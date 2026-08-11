import type { LessonManifest } from "@bunbun/contracts";

import type { GameRuntime } from "../game/runtime.js";
import type { AppShell } from "../ui/shell.js";
import { ActiveClock } from "./active-clock.js";
import { createSpeechSynthesisAudioPort } from "./audio.js";
import {
  currentStep,
  reduceLesson,
  startLesson,
  type LessonEffect,
  type LessonInput,
  type LessonState,
  type LessonUpdate,
} from "./controller.js";
import { InMemoryEventSink } from "./events.js";

export interface LessonRuntime {
  dispose: () => void;
}

export function createLessonRuntime(
  shell: AppShell,
  world: GameRuntime,
  manifest: LessonManifest,
  simulateAudioFailure: boolean,
  firstStimulusMs: number,
  onFatalError: (error: Error) => void,
): LessonRuntime {
  const lifecycle = new AbortController();
  const signal = lifecycle.signal;
  const audio = createSpeechSynthesisAudioPort(
    manifest.audioAssets,
    simulateAudioFailure,
  );
  let clock = new ActiveClock();
  let eventSink = new InMemoryEventSink();
  let state: LessonState;
  let feedbackTimer: number | undefined;
  let feedbackStartedAt = 0;
  let feedbackRemainingMs = 0;
  let focusedStateKey: string | undefined;
  let disposed = false;

  const timed = <Type extends LessonInput["type"]>(type: Type) => ({
    type,
    activeTimeMs: clock.read(),
    occurredAt: new Date().toISOString(),
  });

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
    const stateKey = `${state.currentStepId}:${state.phase}`;
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
        shell.canvas.focus({ preventScroll: true });
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
      case "FEEDBACK":
        break;
    }
  };

  const render = () => {
    const step = currentStep(state);
    if (step.interaction.type !== "LISTEN") {
      shell.setAudioError(undefined);
    }
    const worldEnabled =
      step.mode === "EXPLORE" && state.phase === "AWAITING_OBJECT";
    world.configureLessonInput({
      enabled: worldEnabled,
      candidateObjectIds: worldEnabled ? state.visibleObjectIds : [],
      highlightObjectIds: state.highlightObjectIds,
      onObjectSelected: worldEnabled ? selectObject : undefined,
    });
    shell.renderLesson(state);
    focusActiveInput();
    updateDiagnostics();
  };

  const updateDiagnostics = () => {
    const events = eventSink.values();
    const reactions = events.filter((event) => event.kind === "REACTION");
    const stepResults = events.filter(
      (event) => event.kind === "STEP_COMPLETED",
    );
    const lastReaction = [...events]
      .reverse()
      .find((event) => event.kind === "REACTION");
    shell.updateLessonDiagnostics({
      sessionId: state.sessionId,
      stepId: state.currentStepId,
      phase: state.phase,
      eventCount: events.length,
      reactionCount: reactions.length,
      correctReactionCount: reactions.filter((event) => event.correct).length,
      incorrectReactionCount: reactions.filter((event) => !event.correct)
        .length,
      heardCount: events.filter((event) => event.kind === "HEARD").length,
      terminalResultCount: stepResults.length,
      assistedResultCount: stepResults.filter((event) => event.assisted).length,
      completedStepCount: state.completedStepIds.length,
      totalStepCount: state.manifest.steps.length,
      activeTimeMs: clock.read(),
      lastReactionMs: lastReaction?.activeLatencyMs,
      firstStimulusMs,
    });
  };

  const applyEffects = (effects: readonly LessonEffect[]) => {
    effects.forEach((effect) => {
      switch (effect.type) {
        case "RECORD_EVENTS":
          eventSink.write(effect.events);
          break;
        case "APPLY_CUES":
          world.applyCues(effect.cueIds);
          break;
        case "SCHEDULE_FEEDBACK":
          scheduleFeedback(effect.delayMs);
          break;
      }
    });
    updateDiagnostics();
  };

  const applyUpdate = (update: LessonUpdate) => {
    state = update.state;
    render();
    applyEffects(update.effects);
  };

  function safeDispatch(input: LessonInput): void {
    if (disposed) return;
    try {
      applyUpdate(reduceLesson(state, input));
    } catch (error) {
      onFatalError(
        error instanceof Error ? error : new Error("Unknown lesson error."),
      );
    }
  }

  const selectObject = (objectId: string) => {
    safeDispatch({ ...timed("OBJECT_SELECTED"), objectId });
  };

  const playAudio = () => {
    const step = currentStep(state);
    const audioAssetId = step.stimulus.utterance?.audioAssetId;
    if (
      step.interaction.type !== "LISTEN" ||
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
    clearFeedbackTimer();
    audio.stop();
    shell.setAudioError(undefined);
    clock = new ActiveClock();
    if (document.hidden) clock.pause();
    eventSink = new InMemoryEventSink();
    applyUpdate(
      startLesson(
        manifest,
        crypto.randomUUID(),
        clock.read(),
        new Date().toISOString(),
      ),
    );
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
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
    clock.resume();
    resumeFeedbackTimer();
  };

  shell.audioButton.addEventListener("click", playAudio, { signal });
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
  document.addEventListener("visibilitychange", onVisibilityChange, { signal });

  const initialUpdate = startLesson(
    manifest,
    crypto.randomUUID(),
    clock.read(),
    new Date().toISOString(),
  );
  state = initialUpdate.state;
  applyUpdate(initialUpdate);

  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      lifecycle.abort();
      clearFeedbackTimer();
      audio.dispose();
      world.configureLessonInput({
        enabled: false,
        candidateObjectIds: [],
        highlightObjectIds: [],
      });
    },
  };
}
