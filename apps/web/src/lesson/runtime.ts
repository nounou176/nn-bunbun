import {
  EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
  type ResumableSession,
  type ValidatedLessonPackage,
} from "@bunbun/contracts";

import type { GameRuntime } from "../game/runtime.js";
import type { BunbunAudioMixer } from "../audio/mixer.js";
import type { EvidenceStore } from "../persistence/port.js";
import type { AppShell } from "../ui/shell.js";
import { ActiveClock } from "./active-clock.js";
import { createLessonAudioPort } from "./audio.js";
import {
  calculateReactionCadence,
  meaningfulReactionKey,
  summarizeMeaningfulReactions,
} from "./cadence.js";
import {
  checkpointFromState,
  currentStep,
  isTypeGuidedCorrection,
  reduceLesson,
  restoreLesson,
  startLesson,
  type LessonEffect,
  type LessonInput,
  type LessonState,
  type LessonUpdate,
} from "./controller.js";
import { InMemoryEventSink } from "./events.js";
import type { LessonSupportMode } from "./guidance.js";

export interface LessonRuntime {
  dispose: () => void;
}

export interface LessonRuntimePersistence {
  store: EvidenceStore;
  lessonPackage: ValidatedLessonPackage;
  packageFingerprint: string;
  resumedSession?: ResumableSession;
  onPersistenceStatus: (
    status: "saved" | "saving",
    detail: { eventCount: number; lastSavedAt: string },
  ) => void;
  onRestart: (
    sessionId: string,
    sequence: number,
    active: boolean,
  ) => Promise<void>;
}

export function applyLessonSupportMode(
  update: LessonUpdate,
  supportMode: LessonSupportMode,
  activeTimeMs: number,
  occurredAt: string,
): LessonUpdate {
  if (
    supportMode !== "GUIDED" ||
    update.state.helpUsed ||
    update.state.phase === "COMPLETED" ||
    update.state.phase === "FEEDBACK"
  ) {
    return update;
  }
  const supported = reduceLesson(update.state, {
    type: "HELP_REQUESTED",
    activeTimeMs,
    occurredAt,
  });
  return {
    state: supported.state,
    effects: [...update.effects, ...supported.effects],
  };
}

export async function createLessonRuntime(
  shell: AppShell,
  world: GameRuntime,
  audioMixer: BunbunAudioMixer,
  persistence: LessonRuntimePersistence,
  simulateAudioFailure: boolean,
  firstStimulusMs: number,
  onFatalError: (error: Error) => void,
  supportMode: LessonSupportMode = "IMMERSIVE",
): Promise<LessonRuntime> {
  const { manifest, catalog } = persistence.lessonPackage;
  const lifecycle = new AbortController();
  const signal = lifecycle.signal;
  const audio = createLessonAudioPort(
    manifest.audioAssets,
    simulateAudioFailure,
    { mixer: audioMixer },
  );
  const firstAudioAssetId = manifest.steps
    .map((step) => step.stimulus.utterance?.audioAssetId)
    .find((audioAssetId): audioAssetId is string => audioAssetId !== undefined);
  if (firstAudioAssetId !== undefined) {
    void audio.preload(firstAudioAssetId).catch(() => undefined);
  }
  const clock = new ActiveClock(
    undefined,
    persistence.resumedSession?.checkpoint.activeTimeMs ?? 0,
  );
  const visitStartedAtActiveMs = clock.read();
  const reactionActiveTimesMs: number[] = [];
  const measuredReactionAttemptKeys = new Set<string>();
  const eventSink = new InMemoryEventSink();
  let state: LessonState;
  let checkpointSequence = persistence.resumedSession?.checkpoint.sequence ?? 0;
  let persistedEventCount = persistence.resumedSession?.storedEventCount ?? 0;
  let lastSavedAt =
    persistence.resumedSession?.lastSavedAt ?? new Date().toISOString();
  let persistenceStatus: "saving" | "saved" = "saved";
  let dispatchQueue = Promise.resolve();
  let feedbackTimer: number | undefined;
  let feedbackStartedAt = 0;
  let feedbackRemainingMs = 0;
  let focusedStateKey: string | undefined;
  let renderedStepId: string | undefined;
  let lastAppliedPhase: LessonState["phase"] | undefined;
  let audioTransitionsEnabled = persistence.resumedSession === undefined;
  let disposed = false;

  const timed = <Type extends LessonInput["type"]>(type: Type) => ({
    type,
    activeTimeMs: clock.read(),
    occurredAt: new Date().toISOString(),
  });

  const applySupportMode = (update: LessonUpdate): LessonUpdate =>
    applyLessonSupportMode(
      update,
      supportMode,
      clock.read(),
      new Date().toISOString(),
    );

  const clearFeedbackTimer = () => {
    if (feedbackTimer !== undefined) window.clearTimeout(feedbackTimer);
    feedbackTimer = undefined;
  };

  const dispatchFeedbackElapsed = () => {
    feedbackTimer = undefined;
    feedbackRemainingMs = 0;
    safeDispatch(timed("FEEDBACK_ELAPSED"));
  };

  const resumeFeedbackTimer = () => {
    if (
      disposed ||
      document.hidden ||
      feedbackRemainingMs <= 0 ||
      feedbackTimer !== undefined
    ) {
      return;
    }
    feedbackStartedAt = performance.now();
    feedbackTimer = window.setTimeout(
      dispatchFeedbackElapsed,
      feedbackRemainingMs,
    );
  };

  const scheduleFeedback = (delayMs: number) => {
    clearFeedbackTimer();
    feedbackRemainingMs = Math.max(0, delayMs);
    if (feedbackRemainingMs === 0 && !document.hidden) {
      queueMicrotask(dispatchFeedbackElapsed);
      return;
    }
    resumeFeedbackTimer();
  };

  const focusActiveInput = () => {
    const stateKey = `${state.currentStepId}:${state.phase}:${state.availableTokenIds.length}:${state.arrangedTokenIds.length}`;
    if (stateKey === focusedStateKey) return;
    focusedStateKey = stateKey;

    switch (state.phase) {
      case "AWAITING_AUDIO":
        shell.audioButton.focus({ preventScroll: true });
        break;
      case "AWAITING_CONTINUE":
        shell.continueButton.focus({ preventScroll: true });
        break;
      case "AWAITING_OBJECT":
      case "AWAITING_LOCATION":
      case "AWAITING_PICK_UP":
      case "AWAITING_RECIPIENT":
        shell.canvas.focus({ preventScroll: true });
        break;
      case "AWAITING_ARRANGE":
        (
          shell.arrangeBank.querySelector<HTMLButtonElement>(
            "[data-token-id]",
          ) ?? shell.arrangeSubmitButton
        ).focus({ preventScroll: true });
        break;
      case "AWAITING_TYPE":
        shell.typeInput.focus({ preventScroll: true });
        break;
      case "AWAITING_CHOICE":
        shell.choiceList
          .querySelector<HTMLButtonElement>("[data-option-id]")
          ?.focus({ preventScroll: true });
        break;
      case "COMPLETED":
        shell.restartLessonButton.focus({ preventScroll: true });
        break;
      case "PLAYING_AUDIO":
      case "MOVING_TO_LOCATION":
      case "FEEDBACK":
        break;
    }
  };

  const render = () => {
    if (renderedStepId !== state.currentStepId) {
      renderedStepId = state.currentStepId;
      shell.setAudioError(undefined);
    }
    world.configureLessonInput(worldInputConfiguration());
    shell.renderLesson(state);
    focusActiveInput();
    updateDiagnostics();
  };

  const updateDiagnostics = () => {
    const events = eventSink.values();
    const reactionEvents = events.filter((event) => event.kind === "REACTION");
    const reactionSummary = summarizeMeaningfulReactions(reactionEvents);
    const stepResults = events.filter(
      (event) => event.kind === "STEP_COMPLETED",
    );
    const lastReaction = [...events]
      .reverse()
      .find((event) => event.kind === "REACTION");
    const visitActiveTimeMs = Math.max(
      0,
      clock.read() - visitStartedAtActiveMs,
    );
    const cadence = calculateReactionCadence(
      visitActiveTimeMs,
      reactionActiveTimesMs,
    );
    const targetIds = new Set(
      state.manifest.steps.flatMap((step) =>
        step.targetBindings.map((binding) => binding.targetId),
      ),
    );
    const encounteredStepIds = new Set([
      ...state.completedStepIds,
      state.currentStepId,
    ]);
    const encounteredTargetIds = new Set(
      state.manifest.steps
        .filter((step) => encounteredStepIds.has(step.stepId))
        .flatMap((step) =>
          step.targetBindings.map((binding) => binding.targetId),
        ),
    );
    shell.updateLessonDiagnostics({
      sessionId: state.sessionId,
      stepId: state.currentStepId,
      phase: state.phase,
      eventCount: Math.max(persistedEventCount, events.length),
      reactionCount: reactionSummary.reactionCount,
      correctReactionCount: reactionSummary.correctReactionCount,
      incorrectReactionCount: reactionSummary.incorrectReactionCount,
      heardCount: events.filter((event) => event.kind === "HEARD").length,
      terminalResultCount: stepResults.length,
      assistedResultCount: stepResults.filter((event) => event.assisted).length,
      unaidedResultCount: stepResults.filter((event) => !event.assisted).length,
      targetCount: targetIds.size,
      encounteredTargetCount: encounteredTargetIds.size,
      completedStepCount: state.completedStepIds.length,
      totalStepCount: state.manifest.steps.length,
      activeTimeMs: clock.read(),
      lastReactionMs: lastReaction?.activeLatencyMs,
      reactionsPerMinute: cadence.reactionsPerMinute,
      medianReactionGapMs: cadence.medianGapMs,
      p95ReactionGapMs: cadence.p95GapMs,
      firstStimulusMs,
      worldTargetMode: worldTargetMode(),
      pendingLocationId: state.pendingLocation?.locationId,
      carriedObjectId: state.carriedObjectId,
      persistenceStatus,
      checkpointSequence,
      storedEventCount: persistedEventCount,
      lastSavedAt,
    });
  };

  const worldTargetMode = (): "none" | "object" | "location" | "recipient" => {
    switch (state.phase) {
      case "AWAITING_OBJECT":
      case "AWAITING_PICK_UP":
        return "object";
      case "AWAITING_LOCATION":
        return "location";
      case "AWAITING_RECIPIENT":
        return "recipient";
      default:
        return "none";
    }
  };

  const worldInputConfiguration = () => {
    const base = {
      highlightObjectIds: state.highlightObjectIds,
      highlightEntityIds: state.highlightEntityIds,
    };
    switch (state.phase) {
      case "AWAITING_OBJECT":
      case "AWAITING_PICK_UP":
        return {
          ...base,
          mode: "OBJECT" as const,
          candidateIds: state.visibleObjectIds,
          onSelected: selectObject,
        };
      case "AWAITING_LOCATION":
        return {
          ...base,
          mode: "LOCATION" as const,
          candidateIds: state.visibleLocationIds,
          onSelected: selectLocation,
        };
      case "AWAITING_RECIPIENT":
        return {
          ...base,
          mode: "RECIPIENT" as const,
          candidateIds: state.visibleRecipientEntityIds,
          onSelected: selectRecipient,
        };
      default:
        return { ...base, mode: "NONE" as const };
    }
  };

  const applyEffects = (effects: readonly LessonEffect[]) => {
    effects.forEach((effect) => {
      switch (effect.type) {
        case "RECORD_EVENTS":
          effect.events.forEach((event) => {
            if (event.kind === "REACTION") {
              const attemptKey = meaningfulReactionKey(event);
              if (measuredReactionAttemptKeys.has(attemptKey)) return;
              measuredReactionAttemptKeys.add(attemptKey);
              reactionActiveTimesMs.push(
                Math.max(0, clock.read() - visitStartedAtActiveMs),
              );
            }
          });
          eventSink.write(effect.events);
          break;
        case "APPLY_CUES":
          world.applyCues(effect.cueIds);
          break;
        case "SCHEDULE_FEEDBACK":
          scheduleFeedback(effect.delayMs);
          break;
        case "REQUEST_LOCATION_MOVEMENT":
          world.requestLocationMovement(
            effect.locationId,
            effect.arrivalRadius,
            (locationId) =>
              safeDispatch({ ...timed("LOCATION_REACHED"), locationId }),
            (locationId) =>
              safeDispatch({ ...timed("MOVEMENT_FAILED"), locationId }),
          );
          break;
        case "SET_CARRIED_OBJECT":
          world.setCarriedObject(effect.objectId);
          break;
        case "TRANSFER_CARRIED_OBJECT":
          world.transferCarriedObject(
            effect.objectId,
            effect.recipientEntityId,
          );
          break;
        case "CLEAR_CARRIED_OBJECT":
          world.clearCarriedObject();
          break;
      }
    });
    updateDiagnostics();
  };

  const applyUpdate = (update: LessonUpdate) => {
    state = update.state;
    render();
    applyEffects(update.effects);
    if (audioTransitionsEnabled) {
      if (state.phase === "FEEDBACK" && lastAppliedPhase !== "FEEDBACK") {
        switch (state.feedbackKind) {
          case "CORRECT":
            void audioMixer.playOneShot("sfx_correct_001");
            break;
          case "INCORRECT":
            void audioMixer.playOneShot("sfx_incorrect_004");
            void audioMixer.playOneShot("music_tension_pulse_01");
            break;
          case "ASSISTED":
            void audioMixer.playOneShot("sfx_neutral_001");
            break;
        }
      }
      if (state.phase === "COMPLETED" && lastAppliedPhase !== "COMPLETED") {
        void audioMixer.playOneShot("music_resolution_sting_01");
      }
    }
    lastAppliedPhase = state.phase;
  };

  function safeDispatch(input: LessonInput): void {
    if (disposed) return;
    dispatchQueue = dispatchQueue
      .then(() =>
        persistUpdate(applySupportMode(reduceLesson(state, input)), input.type),
      )
      .catch((error: unknown) => {
        if (disposed) return;
        onFatalError(
          error instanceof Error ? error : new Error("Unknown lesson error."),
        );
      });
  }

  const persistUpdate = async (
    update: LessonUpdate,
    inputType: LessonInput["type"],
  ): Promise<void> => {
    const events = eventsFrom(update);
    if (events.length > 0 || isCheckpointBoundary(inputType)) {
      const nextSequence = checkpointSequence + 1;
      persistenceStatus = "saving";
      persistence.onPersistenceStatus(persistenceStatus, {
        eventCount: persistedEventCount,
        lastSavedAt,
      });
      updateDiagnostics();
      const result = await persistence.store.commitSession(state.sessionId, {
        schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
        commitId: crypto.randomUUID(),
        expectedSequence: checkpointSequence,
        events,
        checkpoint: checkpointFromState(
          update.state,
          nextSequence,
          clock.read(),
        ),
      });
      if (disposed) return;
      checkpointSequence = result.checkpointSequence;
      persistedEventCount = result.storedEventCount;
      lastSavedAt = result.lastSavedAt;
      persistenceStatus = "saved";
      persistence.onPersistenceStatus(persistenceStatus, {
        eventCount: persistedEventCount,
        lastSavedAt,
      });
    }
    applyUpdate(update);
  };

  const selectObject = (objectId: string) => {
    safeDispatch({ ...timed("OBJECT_SELECTED"), objectId });
  };

  const selectLocation = (locationId: string) => {
    safeDispatch({ ...timed("LOCATION_SELECTED"), locationId });
  };

  const selectRecipient = (entityId: string) => {
    safeDispatch({ ...timed("RECIPIENT_SELECTED"), entityId });
  };

  const playAudio = () => {
    const step = currentStep(state);
    const audioAssetId = step.stimulus.utterance?.audioAssetId;
    if (
      audioAssetId === undefined ||
      state.phase === "PLAYING_AUDIO" ||
      state.phase === "FEEDBACK" ||
      state.phase === "COMPLETED"
    ) {
      return;
    }
    shell.setAudioError(undefined);
    audio.play(audioAssetId, {
      onStart: () => {
        shell.setAudioError(undefined);
        safeDispatch(timed("AUDIO_STARTED"));
      },
      onEnd: () => safeDispatch(timed("AUDIO_ENDED")),
      onError: (message) => {
        shell.setAudioError(message);
        safeDispatch(timed("AUDIO_FAILED"));
      },
    });
  };

  const restart = () => {
    void persistence.onRestart(
      state.sessionId,
      checkpointSequence,
      state.phase !== "COMPLETED",
    );
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      audio.interrupt(
        "Japanese speech was interrupted in the background. Replay it or use the visible text path.",
      );
      void audioMixer.suspendForBackground();
      clock.pause();
      if (feedbackTimer !== undefined) {
        feedbackRemainingMs = Math.max(
          0,
          feedbackRemainingMs - (performance.now() - feedbackStartedAt),
        );
        clearFeedbackTimer();
      }
      return;
    }
    void audioMixer.resumeFromBackground();
    clock.resume();
    resumeFeedbackTimer();
  };

  shell.audioButton.addEventListener("click", playAudio, { signal });
  shell.studyToolsRoot.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("[data-study-action]");
      if (button === null || button.disabled) return;
      if (button.dataset.studyAction === "AUDIO") {
        const requestedAudioAssetId = button.dataset.studyAudioAssetId;
        const currentAudioAssetId =
          currentStep(state).stimulus.utterance?.audioAssetId;
        if (
          requestedAudioAssetId !== undefined &&
          requestedAudioAssetId === currentAudioAssetId
        ) {
          playAudio();
        }
        return;
      }
      safeDispatch(timed("HELP_REQUESTED"));
    },
    { signal },
  );
  shell.continueButton.addEventListener(
    "click",
    () => safeDispatch(timed("CONTINUE")),
    { signal },
  );
  shell.helpButton.addEventListener(
    "click",
    () => safeDispatch(timed("HELP_REQUESTED")),
    { signal },
  );
  shell.restartLessonButton.addEventListener("click", restart, { signal });
  shell.choiceList.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("[data-option-id]");
      const optionId = button?.dataset.optionId;
      if (optionId !== undefined) {
        safeDispatch({ ...timed("OPTION_SELECTED"), optionId });
      }
    },
    { signal },
  );
  shell.arrangeBank.addEventListener(
    "click",
    (event) => {
      const tokenId = tokenIdFromEvent(event);
      if (tokenId !== undefined) {
        safeDispatch({ ...timed("ARRANGE_TOKEN_ADDED"), tokenId });
      }
    },
    { signal },
  );
  shell.arrangeAnswer.addEventListener(
    "click",
    (event) => {
      const tokenId = tokenIdFromEvent(event);
      if (tokenId !== undefined) {
        safeDispatch({ ...timed("ARRANGE_TOKEN_REMOVED"), tokenId });
      }
    },
    { signal },
  );
  shell.arrangeSubmitButton.addEventListener(
    "click",
    () => safeDispatch(timed("ARRANGE_SUBMITTED")),
    { signal },
  );
  shell.arrangeResetButton.addEventListener(
    "click",
    () => safeDispatch(timed("ARRANGE_RESET")),
    { signal },
  );
  let composingTypeInput = false;
  shell.typeInput.addEventListener(
    "compositionstart",
    () => {
      composingTypeInput = true;
    },
    { signal },
  );
  shell.typeInput.addEventListener(
    "compositionend",
    () => {
      composingTypeInput = false;
      safeDispatch({
        ...timed("TYPE_DRAFT_CHANGED"),
        value: shell.typeInput.value,
      });
    },
    { signal },
  );
  shell.typeInput.addEventListener(
    "input",
    () => {
      if (composingTypeInput) return;
      safeDispatch({
        ...timed("TYPE_DRAFT_CHANGED"),
        value: shell.typeInput.value,
      });
    },
    { signal },
  );
  shell.typeForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      if (!composingTypeInput) safeDispatch(timed("TYPE_SUBMITTED"));
    },
    { signal },
  );
  shell.typeModelAnswerButton.addEventListener(
    "click",
    () => {
      const step = currentStep(state);
      if (step.interaction.type !== "TYPE" || !isTypeGuidedCorrection(state)) {
        return;
      }
      const modelAnswer = step.interaction.acceptedAnswers[0];
      if (modelAnswer === undefined) return;
      safeDispatch({
        ...timed("TYPE_DRAFT_CHANGED"),
        value: modelAnswer,
      });
    },
    { signal },
  );
  document.addEventListener("visibilitychange", onVisibilityChange, { signal });

  if (persistence.resumedSession !== undefined) {
    state = applySupportMode({
      state: restoreLesson(manifest, persistence.resumedSession.checkpoint),
      effects: [],
    }).state;
    world.restoreLessonWorld(state.carriedObjectId, state.transferredObjects);
    applyUpdate({ state, effects: [] });
    audioTransitionsEnabled = true;
    if (state.phase === "FEEDBACK" && state.feedback !== undefined) {
      scheduleFeedback(state.feedback.displayMs);
    }
    persistence.onPersistenceStatus("saved", {
      eventCount: persistedEventCount,
      lastSavedAt,
    });
  } else {
    const initialUpdate = applySupportMode(
      startLesson(
        manifest,
        crypto.randomUUID(),
        clock.read(),
        new Date().toISOString(),
      ),
    );
    state = initialUpdate.state;
    const events = eventsFrom(initialUpdate);
    persistence.onPersistenceStatus("saving", {
      eventCount: 0,
      lastSavedAt,
    });
    const created = await persistence.store.createSession({
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      commitId: crypto.randomUUID(),
      packageFingerprint: persistence.packageFingerprint,
      manifest,
      catalog,
      events,
      checkpoint: checkpointFromState(state, 0, clock.read()),
    });
    checkpointSequence = created.checkpointSequence;
    persistedEventCount = created.storedEventCount;
    lastSavedAt = created.lastSavedAt;
    applyUpdate(initialUpdate);
    persistence.onPersistenceStatus("saved", {
      eventCount: persistedEventCount,
      lastSavedAt,
    });
  }

  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      lifecycle.abort();
      clearFeedbackTimer();
      audio.dispose();
      world.configureLessonInput({
        mode: "NONE",
        highlightObjectIds: [],
        highlightEntityIds: [],
      });
    },
  };
}

function eventsFrom(update: LessonUpdate) {
  return update.effects.flatMap((effect) =>
    effect.type === "RECORD_EVENTS" ? [...effect.events] : [],
  );
}

function isCheckpointBoundary(type: LessonInput["type"]): boolean {
  return [
    "AUDIO_ENDED",
    "AUDIO_FAILED",
    "HELP_REQUESTED",
    "FEEDBACK_ELAPSED",
  ].includes(type);
}

function tokenIdFromEvent(event: Event): string | undefined {
  const target = event.target;
  if (!(target instanceof Element)) return undefined;
  return target.closest<HTMLButtonElement>("[data-token-id]")?.dataset.tokenId;
}
