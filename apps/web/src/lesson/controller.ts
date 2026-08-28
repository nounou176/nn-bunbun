import {
  EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
  normalizeTypeAnswer,
  truncateToUnicodeCodePoints,
  unicodeCodePointLength,
  type ChoiceOption,
  type FeedbackMessage,
  type LessonManifest,
  type SessionCheckpoint,
  type LessonStep,
  type Scaffold,
  type TransferredObject,
  type TransitionTarget,
} from "@bunbun/contracts";

import {
  exposureEvents,
  heardEvents,
  lessonCompletedEvent,
  reactionEvents,
  stepCompletedEvent,
  type EventContext,
  type SessionEvent,
} from "./events.js";
import { orderedArrangeTokens, orderedChoiceOptions } from "./shuffle.js";

export type LessonPhase =
  | "AWAITING_AUDIO"
  | "PLAYING_AUDIO"
  | "AWAITING_CONTINUE"
  | "AWAITING_ARRANGE"
  | "AWAITING_OBJECT"
  | "AWAITING_TYPE"
  | "AWAITING_LOCATION"
  | "MOVING_TO_LOCATION"
  | "AWAITING_PICK_UP"
  | "AWAITING_RECIPIENT"
  | "AWAITING_CHOICE"
  | "FEEDBACK"
  | "COMPLETED";

export type LessonOutcome = "SUCCESS" | "FAILURE" | "ASSISTED";

export interface PendingLocation {
  locationId: string;
  activeTimeMs: number;
  occurredAt: string;
  assistedRecovery: boolean;
}

export interface LessonState {
  manifest: LessonManifest;
  sessionId: string;
  currentStepId: string;
  phase: LessonPhase;
  attempt: number;
  helpUsed: boolean;
  audioFailed: boolean;
  activeScaffoldIds: readonly string[];
  visibleObjectIds: readonly string[];
  visibleLocationIds: readonly string[];
  visibleRecipientEntityIds: readonly string[];
  visibleOptions: readonly ChoiceOption[];
  availableTokenIds: readonly string[];
  arrangedTokenIds: readonly string[];
  typeDraft: string;
  highlightObjectIds: readonly string[];
  highlightEntityIds: readonly string[];
  readingHint: string | undefined;
  meaningHint: string | undefined;
  patternHint: string | undefined;
  movementError: string | undefined;
  pendingLocation: PendingLocation | undefined;
  carriedObjectId: string | undefined;
  transferredObjects: readonly TransferredObject[];
  feedback: FeedbackMessage | undefined;
  feedbackKind: FeedbackKind | undefined;
  pending: PendingAction | undefined;
  completedStepIds: readonly string[];
  stepStartedAtActiveMs: number;
}

export type LessonInput =
  | TimedInput<"AUDIO_STARTED">
  | TimedInput<"AUDIO_ENDED">
  | TimedInput<"AUDIO_FAILED">
  | TimedInput<"CONTINUE">
  | TimedInput<"HELP_REQUESTED">
  | (TimedInput<"ARRANGE_TOKEN_ADDED"> & { tokenId: string })
  | (TimedInput<"ARRANGE_TOKEN_REMOVED"> & { tokenId: string })
  | TimedInput<"ARRANGE_RESET">
  | TimedInput<"ARRANGE_SUBMITTED">
  | (TimedInput<"TYPE_DRAFT_CHANGED"> & { value: string })
  | TimedInput<"TYPE_SUBMITTED">
  | (TimedInput<"OBJECT_SELECTED"> & { objectId: string })
  | (TimedInput<"LOCATION_SELECTED"> & { locationId: string })
  | (TimedInput<"LOCATION_REACHED"> & { locationId: string })
  | (TimedInput<"MOVEMENT_FAILED"> & { locationId: string })
  | (TimedInput<"RECIPIENT_SELECTED"> & { entityId: string })
  | (TimedInput<"OPTION_SELECTED"> & { optionId: string })
  | TimedInput<"FEEDBACK_ELAPSED">;

export type LessonEffect =
  | { type: "RECORD_EVENTS"; events: readonly SessionEvent[] }
  | { type: "APPLY_CUES"; cueIds: readonly string[] }
  | { type: "SCHEDULE_FEEDBACK"; delayMs: number }
  | {
      type: "REQUEST_LOCATION_MOVEMENT";
      locationId: string;
      arrivalRadius: number;
    }
  | { type: "SET_CARRIED_OBJECT"; objectId: string }
  | {
      type: "TRANSFER_CARRIED_OBJECT";
      objectId: string;
      recipientEntityId: string;
    }
  | { type: "CLEAR_CARRIED_OBJECT" };

export interface LessonUpdate {
  state: LessonState;
  effects: readonly LessonEffect[];
}

interface TimedInput<Type extends string> {
  type: Type;
  activeTimeMs: number;
  occurredAt: string;
}

export type PendingAction =
  { kind: "RETRY" } | { kind: "TRANSITION"; target: TransitionTarget };

export type FeedbackKind = "CORRECT" | "INCORRECT" | "ASSISTED";

export function startLesson(
  manifest: LessonManifest,
  sessionId: string,
  activeTimeMs: number,
  occurredAt: string,
): LessonUpdate {
  const state = createStepState(
    manifest,
    sessionId,
    manifest.entryStepId,
    [],
    undefined,
    [],
    activeTimeMs,
  );
  const step = currentStep(state);
  return {
    state,
    effects: entryEffects(state, step, activeTimeMs, occurredAt),
  };
}

export function reduceLesson(
  state: LessonState,
  input: LessonInput,
): LessonUpdate {
  if (state.phase === "COMPLETED") return unchanged(state);
  const step = currentStep(state);

  switch (input.type) {
    case "HELP_REQUESTED":
      if (state.phase === "FEEDBACK") return unchanged(state);
      return { state: { ...state, helpUsed: true }, effects: [] };

    case "AUDIO_STARTED":
      if (step.stimulus.utterance?.audioAssetId === undefined) {
        return unchanged(state);
      }
      if (step.interaction.type !== "LISTEN") {
        return {
          state: { ...state, audioFailed: false },
          effects: [record(heardEvents(eventContext(state, input), step))],
        };
      }
      if (
        state.phase !== "AWAITING_AUDIO" &&
        state.phase !== "AWAITING_CONTINUE"
      ) {
        return unchanged(state);
      }
      return {
        state: { ...state, phase: "PLAYING_AUDIO", audioFailed: false },
        effects: [record(heardEvents(eventContext(state, input), step))],
      };

    case "AUDIO_ENDED":
      if (
        step.interaction.type !== "LISTEN" ||
        state.phase !== "PLAYING_AUDIO"
      ) {
        return unchanged(state);
      }
      if (step.interaction.completion === "AUDIO_ENDED") {
        return finishStep(state, input, "SUCCESS");
      }
      return {
        state: { ...state, phase: "AWAITING_CONTINUE" },
        effects: [],
      };

    case "AUDIO_FAILED":
      if (step.stimulus.utterance?.audioAssetId === undefined) {
        return unchanged(state);
      }
      if (step.interaction.type !== "LISTEN") {
        return {
          state: { ...state, helpUsed: true, audioFailed: true },
          effects: [],
        };
      }
      if (state.phase !== "AWAITING_AUDIO" && state.phase !== "PLAYING_AUDIO") {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          phase: "AWAITING_CONTINUE",
          helpUsed: true,
          audioFailed: true,
        },
        effects: [],
      };

    case "CONTINUE":
      if (
        step.interaction.type !== "LISTEN" ||
        state.phase !== "AWAITING_CONTINUE"
      ) {
        return unchanged(state);
      }
      return finishStep(
        state,
        input,
        state.helpUsed || state.audioFailed ? "ASSISTED" : "SUCCESS",
      );

    case "ARRANGE_TOKEN_ADDED":
      if (
        step.interaction.type !== "ARRANGE" ||
        state.phase !== "AWAITING_ARRANGE" ||
        !state.availableTokenIds.includes(input.tokenId)
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          availableTokenIds: state.availableTokenIds.filter(
            (tokenId) => tokenId !== input.tokenId,
          ),
          arrangedTokenIds: [...state.arrangedTokenIds, input.tokenId],
        },
        effects: [],
      };

    case "ARRANGE_TOKEN_REMOVED":
      if (
        step.interaction.type !== "ARRANGE" ||
        state.phase !== "AWAITING_ARRANGE" ||
        !state.arrangedTokenIds.includes(input.tokenId)
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          availableTokenIds: [...state.availableTokenIds, input.tokenId],
          arrangedTokenIds: state.arrangedTokenIds.filter(
            (tokenId) => tokenId !== input.tokenId,
          ),
        },
        effects: [],
      };

    case "ARRANGE_RESET":
      if (
        step.interaction.type !== "ARRANGE" ||
        state.phase !== "AWAITING_ARRANGE"
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          availableTokenIds: orderedArrangeTokens(
            step,
            state.manifest.randomSeed,
          ).map((token) => token.tokenId),
          arrangedTokenIds: [],
        },
        effects: [],
      };

    case "ARRANGE_SUBMITTED": {
      if (
        step.interaction.type !== "ARRANGE" ||
        state.phase !== "AWAITING_ARRANGE" ||
        state.availableTokenIds.length > 0
      ) {
        return unchanged(state);
      }
      const correct = step.interaction.acceptedSequences.some((sequence) =>
        sameSequence(sequence, state.arrangedTokenIds),
      );
      const evaluatedState =
        correct || step.attemptPolicy.preserveSubmittedState
          ? state
          : resetArrangeState(state, step);
      return evaluateAnswer(
        evaluatedState,
        input,
        state.arrangedTokenIds,
        correct,
      );
    }

    case "TYPE_DRAFT_CHANGED":
      if (step.interaction.type !== "TYPE" || state.phase !== "AWAITING_TYPE") {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          typeDraft: truncateToUnicodeCodePoints(
            input.value,
            step.interaction.maximumLength,
          ),
        },
        effects: [],
      };

    case "TYPE_SUBMITTED": {
      if (
        step.interaction.type !== "TYPE" ||
        state.phase !== "AWAITING_TYPE" ||
        state.typeDraft.length === 0 ||
        unicodeCodePointLength(state.typeDraft) > step.interaction.maximumLength
      ) {
        return unchanged(state);
      }
      const normalization = step.interaction.normalization;
      const submitted = normalizeTypeAnswer(state.typeDraft, normalization);
      if (submitted.length === 0) return unchanged(state);
      const correct = step.interaction.acceptedAnswers.some(
        (answer) => normalizeTypeAnswer(answer, normalization) === submitted,
      );
      const evaluatedState =
        correct || step.attemptPolicy.preserveSubmittedState
          ? state
          : { ...state, typeDraft: "" };
      return evaluateAnswer(evaluatedState, input, undefined, correct);
    }

    case "OBJECT_SELECTED": {
      const isClick =
        step.interaction.type === "CLICK_OBJECT" &&
        state.phase === "AWAITING_OBJECT";
      const isPickUp =
        step.interaction.type === "PICK_UP" &&
        state.phase === "AWAITING_PICK_UP";
      if (
        (!isClick && !isPickUp) ||
        !state.visibleObjectIds.includes(input.objectId)
      ) {
        return unchanged(state);
      }
      const correct = step.interaction.acceptedObjectIds.includes(
        input.objectId,
      );
      const evaluatedState =
        isPickUp && correct
          ? { ...state, carriedObjectId: input.objectId }
          : state;
      const update = evaluateAnswer(
        evaluatedState,
        input,
        [input.objectId],
        correct,
      );
      return isPickUp && correct
        ? addEffect(update, {
            type: "SET_CARRIED_OBJECT",
            objectId: input.objectId,
          })
        : update;
    }

    case "LOCATION_SELECTED":
      if (
        step.interaction.type !== "MOVE_TO" ||
        state.phase !== "AWAITING_LOCATION" ||
        !state.visibleLocationIds.includes(input.locationId)
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          phase: "MOVING_TO_LOCATION",
          movementError: undefined,
          pendingLocation: {
            locationId: input.locationId,
            activeTimeMs: input.activeTimeMs,
            occurredAt: input.occurredAt,
            assistedRecovery: false,
          },
        },
        effects: [
          {
            type: "REQUEST_LOCATION_MOVEMENT",
            locationId: input.locationId,
            arrivalRadius: step.interaction.arrivalRadius,
          },
        ],
      };

    case "LOCATION_REACHED": {
      if (
        step.interaction.type !== "MOVE_TO" ||
        state.phase !== "MOVING_TO_LOCATION" ||
        state.pendingLocation?.locationId !== input.locationId
      ) {
        return unchanged(state);
      }
      const selectionInput = state.pendingLocation;
      if (selectionInput.assistedRecovery) {
        return finishStep(
          { ...state, pendingLocation: undefined },
          input,
          "ASSISTED",
        );
      }
      const correct = step.interaction.acceptedLocationIds.includes(
        input.locationId,
      );
      return evaluateAnswer(
        { ...state, pendingLocation: undefined },
        input,
        [input.locationId],
        correct,
        selectionInput,
      );
    }

    case "MOVEMENT_FAILED":
      if (
        step.interaction.type !== "MOVE_TO" ||
        state.phase !== "MOVING_TO_LOCATION" ||
        state.pendingLocation?.locationId !== input.locationId
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          phase: "AWAITING_LOCATION",
          pendingLocation: undefined,
          movementError: "移動できませんでした。もう一度場所を選んでください。",
        },
        effects: [],
      };

    case "RECIPIENT_SELECTED": {
      if (
        step.interaction.type !== "GIVE" ||
        state.phase !== "AWAITING_RECIPIENT" ||
        !state.visibleRecipientEntityIds.includes(input.entityId)
      ) {
        return unchanged(state);
      }
      const objectId = state.carriedObjectId;
      if (
        objectId === undefined ||
        !step.interaction.candidateObjectIds.includes(objectId)
      ) {
        throw new Error(
          `GIVE step '${step.stepId}' has no compatible carried object.`,
        );
      }
      const correct = step.interaction.acceptedPairs.some(
        (pair) =>
          pair.objectId === objectId &&
          pair.recipientEntityId === input.entityId,
      );
      const transferredObject = {
        objectId,
        recipientEntityId: input.entityId,
      };
      const evaluatedState = correct
        ? {
            ...state,
            carriedObjectId: undefined,
            transferredObjects: state.transferredObjects.some(
              (item) => item.objectId === objectId,
            )
              ? state.transferredObjects
              : [...state.transferredObjects, transferredObject],
          }
        : state;
      const update = evaluateAnswer(
        evaluatedState,
        input,
        [objectId, input.entityId],
        correct,
      );
      return correct
        ? addEffect(update, {
            type: "TRANSFER_CARRIED_OBJECT",
            objectId,
            recipientEntityId: input.entityId,
          })
        : update;
    }

    case "OPTION_SELECTED":
      if (
        step.interaction.type !== "CHOOSE" ||
        state.phase !== "AWAITING_CHOICE" ||
        !state.visibleOptions.some(
          (option) => option.optionId === input.optionId,
        )
      ) {
        return unchanged(state);
      }
      return evaluateAnswer(
        state,
        input,
        [input.optionId],
        step.interaction.acceptedOptionIds.includes(input.optionId),
      );

    case "FEEDBACK_ELAPSED":
      if (state.phase !== "FEEDBACK" || state.pending === undefined) {
        return unchanged(state);
      }
      if (state.pending.kind === "RETRY") {
        return {
          state: {
            ...state,
            phase: inputPhase(step),
            feedback: undefined,
            feedbackKind: undefined,
            pending: undefined,
          },
          effects: [],
        };
      }
      return followTransition(state, input, state.pending.target);
  }
}

export function currentStep(state: LessonState): LessonStep {
  const step = state.manifest.steps.find(
    (candidate) => candidate.stepId === state.currentStepId,
  );
  if (step === undefined) {
    throw new Error(`Lesson step '${state.currentStepId}' was not found.`);
  }
  return step;
}

function evaluateAnswer(
  state: LessonState,
  input: LessonInput,
  responseIds: readonly string[] | undefined,
  correct: boolean,
  reactionInput: Pick<
    TimedInput<string>,
    "activeTimeMs" | "occurredAt"
  > = input,
): LessonUpdate {
  const step = currentStep(state);
  const attempt = state.attempt + 1;
  const activeScaffolds = step.scaffolds.filter(
    (scaffold) => scaffold.afterAttempt <= attempt,
  );
  const assisted = state.helpUsed || state.activeScaffoldIds.length > 0;
  const reaction = reactionEvents(
    eventContext(state, reactionInput),
    step,
    attempt,
    responseIds,
    correct,
    assisted,
  );

  if (correct) {
    return finishStep(
      { ...state, attempt },
      input,
      assisted ? "ASSISTED" : "SUCCESS",
      reaction,
    );
  }

  let supportedState = applyScaffolds(state, activeScaffolds, attempt);
  if (attempt >= step.attemptPolicy.maximumAttempts) {
    const outcome: LessonOutcome =
      step.attemptPolicy.afterMaximum === "CONTINUE_ASSISTED"
        ? "ASSISTED"
        : "FAILURE";
    if (outcome === "ASSISTED" && step.interaction.type === "MOVE_TO") {
      const locationId = step.interaction.acceptedLocationIds[0];
      if (
        step.interaction.acceptedLocationIds.length !== 1 ||
        locationId === undefined
      ) {
        throw new Error(
          `MOVE_TO step '${step.stepId}' cannot resolve assisted location state.`,
        );
      }
      const effects: LessonEffect[] = [record(reaction)];
      if (step.presentation.onFailureCueIds.length > 0) {
        effects.push({
          type: "APPLY_CUES",
          cueIds: step.presentation.onFailureCueIds,
        });
      }
      effects.push({
        type: "REQUEST_LOCATION_MOVEMENT",
        locationId,
        arrivalRadius: step.interaction.arrivalRadius,
      });
      return {
        state: {
          ...supportedState,
          phase: "MOVING_TO_LOCATION",
          helpUsed: true,
          movementError: undefined,
          pendingLocation: {
            locationId,
            activeTimeMs: input.activeTimeMs,
            occurredAt: input.occurredAt,
            assistedRecovery: true,
          },
        },
        effects,
      };
    }

    let statefulEffect: LessonEffect | undefined;
    if (outcome === "ASSISTED" && step.interaction.type === "PICK_UP") {
      const objectId = step.interaction.acceptedObjectIds[0];
      if (
        step.interaction.acceptedObjectIds.length !== 1 ||
        objectId === undefined ||
        !supportedState.visibleObjectIds.includes(objectId)
      ) {
        throw new Error(
          `PICK_UP step '${step.stepId}' cannot resolve assisted carry state.`,
        );
      }
      supportedState = { ...supportedState, carriedObjectId: objectId };
      statefulEffect = { type: "SET_CARRIED_OBJECT", objectId };
    }
    if (outcome === "ASSISTED" && step.interaction.type === "GIVE") {
      const pair = step.interaction.acceptedPairs[0];
      if (
        step.interaction.acceptedPairs.length !== 1 ||
        pair === undefined ||
        supportedState.carriedObjectId !== pair.objectId
      ) {
        throw new Error(
          `GIVE step '${step.stepId}' cannot resolve assisted transfer state.`,
        );
      }
      supportedState = {
        ...supportedState,
        carriedObjectId: undefined,
        transferredObjects: supportedState.transferredObjects.some(
          (item) => item.objectId === pair.objectId,
        )
          ? supportedState.transferredObjects
          : [...supportedState.transferredObjects, pair],
      };
      statefulEffect = {
        type: "TRANSFER_CARRIED_OBJECT",
        objectId: pair.objectId,
        recipientEntityId: pair.recipientEntityId,
      };
    }
    const update = finishStep(supportedState, input, outcome, reaction);
    return statefulEffect === undefined
      ? update
      : addEffect(update, statefulEffect);
  }

  return feedbackUpdate(
    supportedState,
    step.feedback.incorrect,
    "INCORRECT",
    { kind: "RETRY" },
    reaction,
    step.presentation.onFailureCueIds,
  );
}

function finishStep(
  state: LessonState,
  input: LessonInput,
  outcome: LessonOutcome,
  precedingEvents: readonly SessionEvent[] = [],
): LessonUpdate {
  const step = currentStep(state);
  const attempt = Math.max(1, state.attempt);
  const completed = state.completedStepIds.includes(step.stepId)
    ? state.completedStepIds
    : [...state.completedStepIds, step.stepId];
  const feedback =
    outcome === "SUCCESS"
      ? step.feedback.correct
      : outcome === "ASSISTED"
        ? step.feedback.assisted
        : step.feedback.incorrect;
  const target =
    outcome === "SUCCESS"
      ? step.transitions.onSuccess
      : outcome === "ASSISTED"
        ? step.transitions.onAssisted
        : step.transitions.onFailure;
  const terminalEvent = stepCompletedEvent(
    eventContext(state, input),
    step,
    attempt,
    outcome,
  );
  const cueIds =
    outcome === "SUCCESS"
      ? [...step.presentation.onSuccessCueIds, ...feedback.cueIds]
      : outcome === "ASSISTED"
        ? feedback.cueIds
        : [...step.presentation.onFailureCueIds, ...feedback.cueIds];

  return feedbackUpdate(
    { ...state, completedStepIds: completed },
    feedback,
    outcome === "SUCCESS"
      ? "CORRECT"
      : outcome === "ASSISTED"
        ? "ASSISTED"
        : "INCORRECT",
    { kind: "TRANSITION", target },
    [...precedingEvents, terminalEvent],
    cueIds,
  );
}

function feedbackUpdate(
  state: LessonState,
  feedback: FeedbackMessage,
  feedbackKind: FeedbackKind,
  pending: PendingAction,
  events: readonly SessionEvent[],
  cueIds: readonly string[],
): LessonUpdate {
  const effects: LessonEffect[] = [
    record(events),
    { type: "SCHEDULE_FEEDBACK", delayMs: feedback.displayMs },
  ];
  if (cueIds.length > 0) effects.push({ type: "APPLY_CUES", cueIds });
  return {
    state: { ...state, phase: "FEEDBACK", feedback, feedbackKind, pending },
    effects,
  };
}

function followTransition(
  state: LessonState,
  input: TimedInput<"FEEDBACK_ELAPSED">,
  target: TransitionTarget,
): LessonUpdate {
  const previousStep = currentStep(state);
  if (target.kind === "COMPLETE") {
    const missingRequired = state.manifest.completion.requiredStepIds.filter(
      (stepId) => !state.completedStepIds.includes(stepId),
    );
    if (missingRequired.length > 0) {
      throw new Error(
        `Lesson reached COMPLETE before required steps: ${missingRequired.join(", ")}.`,
      );
    }
    const effects: LessonEffect[] = [
      record([lessonCompletedEvent(eventContext(state, input), previousStep)]),
    ];
    if (state.carriedObjectId !== undefined) {
      effects.push({ type: "CLEAR_CARRIED_OBJECT" });
    }
    return {
      state: {
        ...state,
        phase: "COMPLETED",
        carriedObjectId: undefined,
        feedback: undefined,
        feedbackKind: undefined,
        pending: undefined,
      },
      effects,
    };
  }

  const nextState = createStepState(
    state.manifest,
    state.sessionId,
    target.stepId,
    state.completedStepIds,
    state.carriedObjectId,
    state.transferredObjects,
    input.activeTimeMs,
  );
  const nextStep = currentStep(nextState);
  return {
    state: nextState,
    effects: entryEffects(
      nextState,
      nextStep,
      input.activeTimeMs,
      input.occurredAt,
    ),
  };
}

function createStepState(
  manifest: LessonManifest,
  sessionId: string,
  stepId: string,
  completedStepIds: readonly string[],
  carriedObjectId: string | undefined,
  transferredObjects: readonly TransferredObject[],
  activeTimeMs: number,
): LessonState {
  const step = manifest.steps.find((candidate) => candidate.stepId === stepId);
  if (step === undefined) {
    throw new Error(`Lesson step '${stepId}' was not found.`);
  }
  const visibleObjectIds = objectCandidates(step);
  const visibleLocationIds =
    step.interaction.type === "MOVE_TO"
      ? [...step.interaction.candidateLocationIds]
      : [];
  const visibleRecipientEntityIds =
    step.interaction.type === "GIVE"
      ? [...step.interaction.candidateRecipientEntityIds]
      : [];
  const availableTokenIds = orderedArrangeTokens(step, manifest.randomSeed).map(
    (token) => token.tokenId,
  );
  return {
    manifest,
    sessionId,
    currentStepId: stepId,
    phase: inputPhase(step),
    attempt: 0,
    helpUsed: false,
    audioFailed: false,
    activeScaffoldIds: [],
    visibleObjectIds,
    visibleLocationIds,
    visibleRecipientEntityIds,
    visibleOptions: orderedChoiceOptions(step, manifest.randomSeed),
    availableTokenIds,
    arrangedTokenIds: [],
    typeDraft: "",
    highlightObjectIds: [],
    highlightEntityIds: [],
    readingHint: undefined,
    meaningHint: undefined,
    patternHint: undefined,
    movementError: undefined,
    pendingLocation: undefined,
    carriedObjectId,
    transferredObjects: [...transferredObjects],
    feedback: undefined,
    feedbackKind: undefined,
    pending: undefined,
    completedStepIds: [...completedStepIds],
    stepStartedAtActiveMs: activeTimeMs,
  };
}

export function checkpointFromState(
  state: LessonState,
  sequence: number,
  activeTimeMs: number,
): SessionCheckpoint {
  return {
    schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
    sessionId: state.sessionId,
    lessonId: state.manifest.lessonId,
    revision: state.manifest.revision,
    sequence,
    status: state.phase === "COMPLETED" ? "COMPLETED" : "ACTIVE",
    currentStepId: state.currentStepId,
    phase: state.phase,
    attempt: state.attempt,
    helpUsed: state.helpUsed,
    audioFailed: state.audioFailed,
    activeScaffoldIds: [...state.activeScaffoldIds],
    arrangedTokenIds: [...state.arrangedTokenIds],
    completedStepIds: [...state.completedStepIds],
    ...(state.carriedObjectId === undefined
      ? {}
      : { carriedObjectId: state.carriedObjectId }),
    transferredObjects: state.transferredObjects.map((transfer) => ({
      ...transfer,
    })),
    ...(state.feedbackKind === undefined
      ? {}
      : { feedbackKind: state.feedbackKind }),
    ...(state.pending === undefined
      ? {}
      : {
          pendingAction:
            state.pending.kind === "RETRY"
              ? { kind: "RETRY" as const }
              : {
                  kind: "TRANSITION" as const,
                  target: state.pending.target,
                },
        }),
    activeTimeMs: Math.max(0, Math.round(activeTimeMs)),
    stepStartedAtActiveMs: Math.max(
      0,
      Math.min(
        Math.round(activeTimeMs),
        Math.round(state.stepStartedAtActiveMs),
      ),
    ),
  };
}

export function restoreLesson(
  manifest: LessonManifest,
  checkpoint: SessionCheckpoint,
): LessonState {
  let state = createStepState(
    manifest,
    checkpoint.sessionId,
    checkpoint.currentStepId,
    checkpoint.completedStepIds,
    checkpoint.carriedObjectId,
    checkpoint.transferredObjects,
    checkpoint.stepStartedAtActiveMs,
  );
  const step = currentStep(state);
  const activeScaffolds = checkpoint.activeScaffoldIds.map((scaffoldId) => {
    const scaffold = step.scaffolds.find(
      (candidate) => candidate.scaffoldId === scaffoldId,
    );
    if (scaffold === undefined) {
      throw new Error(`Checkpoint scaffold '${scaffoldId}' was not authored.`);
    }
    return scaffold;
  });
  state = applyScaffolds(state, activeScaffolds, checkpoint.attempt);

  if (step.interaction.type === "ARRANGE") {
    const arranged = [...checkpoint.arrangedTokenIds];
    const arrangedSet = new Set(arranged);
    state = {
      ...state,
      arrangedTokenIds: arranged,
      availableTokenIds: orderedArrangeTokens(step, manifest.randomSeed)
        .map((token) => token.tokenId)
        .filter((tokenId) => !arrangedSet.has(tokenId)),
    };
  }

  const phase =
    checkpoint.phase === "MOVING_TO_LOCATION"
      ? "AWAITING_LOCATION"
      : checkpoint.phase === "PLAYING_AUDIO"
        ? "AWAITING_CONTINUE"
        : checkpoint.phase;
  const feedback =
    checkpoint.feedbackKind === "CORRECT"
      ? step.feedback.correct
      : checkpoint.feedbackKind === "ASSISTED"
        ? step.feedback.assisted
        : checkpoint.feedbackKind === "INCORRECT"
          ? step.feedback.incorrect
          : undefined;

  return {
    ...state,
    phase,
    attempt: checkpoint.attempt,
    helpUsed: checkpoint.helpUsed,
    audioFailed: checkpoint.audioFailed,
    pendingLocation: undefined,
    typeDraft: "",
    feedback,
    feedbackKind: checkpoint.feedbackKind,
    pending:
      checkpoint.pendingAction === undefined
        ? undefined
        : checkpoint.pendingAction.kind === "RETRY"
          ? { kind: "RETRY" }
          : {
              kind: "TRANSITION",
              target: checkpoint.pendingAction.target,
            },
    stepStartedAtActiveMs: checkpoint.stepStartedAtActiveMs,
  };
}

function applyScaffolds(
  state: LessonState,
  scaffolds: readonly Scaffold[],
  attempt: number,
): LessonState {
  let visibleObjectIds = state.visibleObjectIds;
  let visibleOptions = state.visibleOptions;
  let highlightObjectIds = state.highlightObjectIds;
  let highlightEntityIds = state.highlightEntityIds;
  let readingHint = state.readingHint;
  let meaningHint = state.meaningHint;
  let patternHint = state.patternHint;

  scaffolds.forEach((scaffold) => {
    switch (scaffold.kind) {
      case "HIGHLIGHT_OBJECTS":
        highlightObjectIds = [...scaffold.objectIds];
        break;
      case "HIGHLIGHT_ENTITIES":
        highlightEntityIds = [...scaffold.entityIds];
        break;
      case "REDUCE_OBJECT_CANDIDATES":
        visibleObjectIds = [...scaffold.objectIds];
        highlightObjectIds = [...scaffold.objectIds];
        break;
      case "REDUCE_CHOICE_CANDIDATES":
        visibleOptions = state.visibleOptions.filter((option) =>
          scaffold.optionIds.includes(option.optionId),
        );
        break;
      case "SHOW_READING":
        readingHint = scaffold.textJa;
        break;
      case "SHOW_MEANING":
        meaningHint = scaffold.supportText;
        break;
      case "SHOW_PATTERN":
        patternHint = scaffold.textJa;
        break;
      case "REPLAY_AUDIO":
      case "SHOW_JAPANESE_TEXT":
      case "RECOGNITION_FALLBACK":
        break;
    }
  });

  return {
    ...state,
    attempt,
    activeScaffoldIds: scaffolds.map((scaffold) => scaffold.scaffoldId),
    visibleObjectIds,
    visibleOptions,
    highlightObjectIds,
    highlightEntityIds,
    readingHint,
    meaningHint,
    patternHint,
  };
}

function inputPhase(step: LessonStep): LessonPhase {
  switch (step.interaction.type) {
    case "LISTEN":
      return "AWAITING_AUDIO";
    case "ARRANGE":
      return "AWAITING_ARRANGE";
    case "CLICK_OBJECT":
      return "AWAITING_OBJECT";
    case "TYPE":
      return "AWAITING_TYPE";
    case "MOVE_TO":
      return "AWAITING_LOCATION";
    case "PICK_UP":
      return "AWAITING_PICK_UP";
    case "GIVE":
      return "AWAITING_RECIPIENT";
    case "CHOOSE":
      return "AWAITING_CHOICE";
  }
}

function entryEffects(
  state: LessonState,
  step: LessonStep,
  activeTimeMs: number,
  occurredAt: string,
): LessonEffect[] {
  const effects: LessonEffect[] = [
    record(
      exposureEvents(eventContext(state, { activeTimeMs, occurredAt }), step),
    ),
  ];
  if (step.presentation.onEnterCueIds.length > 0) {
    effects.push({
      type: "APPLY_CUES",
      cueIds: step.presentation.onEnterCueIds,
    });
  }
  return effects;
}

function eventContext(
  state: LessonState,
  input: Pick<TimedInput<string>, "activeTimeMs" | "occurredAt">,
): EventContext {
  return {
    sessionId: state.sessionId,
    lessonId: state.manifest.lessonId,
    revision: state.manifest.revision,
    activeLatencyMs: input.activeTimeMs - state.stepStartedAtActiveMs,
    occurredAt: input.occurredAt,
  };
}

function objectCandidates(step: LessonStep): string[] {
  switch (step.interaction.type) {
    case "CLICK_OBJECT":
    case "PICK_UP":
    case "GIVE":
      return [...step.interaction.candidateObjectIds];
    default:
      return [];
  }
}

function resetArrangeState(state: LessonState, step: LessonStep): LessonState {
  return {
    ...state,
    availableTokenIds: orderedArrangeTokens(
      step,
      state.manifest.randomSeed,
    ).map((token) => token.tokenId),
    arrangedTokenIds: [],
  };
}

function sameSequence(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function addEffect(update: LessonUpdate, effect: LessonEffect): LessonUpdate {
  return { ...update, effects: [...update.effects, effect] };
}

function record(events: readonly SessionEvent[]): LessonEffect {
  return { type: "RECORD_EVENTS", events };
}

function unchanged(state: LessonState): LessonUpdate {
  return { state, effects: [] };
}
