import type {
  ChoiceOption,
  FeedbackMessage,
  LessonManifest,
  LessonStep,
  Scaffold,
  TransitionTarget,
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
import { orderedChoiceOptions } from "./shuffle.js";

export type LessonPhase =
  | "AWAITING_AUDIO"
  | "PLAYING_AUDIO"
  | "AWAITING_CONTINUE"
  | "AWAITING_OBJECT"
  | "AWAITING_CHOICE"
  | "FEEDBACK"
  | "COMPLETED";

export type LessonOutcome = "SUCCESS" | "FAILURE" | "ASSISTED";

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
  visibleOptions: readonly ChoiceOption[];
  highlightObjectIds: readonly string[];
  readingHint: string | undefined;
  feedback: FeedbackMessage | undefined;
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
  | (TimedInput<"OBJECT_SELECTED"> & { objectId: string })
  | (TimedInput<"OPTION_SELECTED"> & { optionId: string })
  | TimedInput<"FEEDBACK_ELAPSED">;

export type LessonEffect =
  | { type: "RECORD_EVENTS"; events: readonly SessionEvent[] }
  | { type: "APPLY_CUES"; cueIds: readonly string[] }
  | { type: "SCHEDULE_FEEDBACK"; delayMs: number };

export interface LessonUpdate {
  state: LessonState;
  effects: readonly LessonEffect[];
}

interface TimedInput<Type extends string> {
  type: Type;
  activeTimeMs: number;
  occurredAt: string;
}

type PendingAction =
  { kind: "RETRY" } | { kind: "TRANSITION"; target: TransitionTarget };

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
      if (
        step.interaction.type !== "LISTEN" ||
        (state.phase !== "AWAITING_AUDIO" &&
          state.phase !== "AWAITING_CONTINUE")
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
      if (
        step.interaction.type !== "LISTEN" ||
        (state.phase !== "AWAITING_AUDIO" && state.phase !== "PLAYING_AUDIO")
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          phase: "AWAITING_CONTINUE",
          helpUsed: true,
          audioFailed: true,
          activeScaffoldIds: step.scaffolds.map(
            (scaffold) => scaffold.scaffoldId,
          ),
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

    case "OBJECT_SELECTED":
      if (
        step.interaction.type !== "CLICK_OBJECT" ||
        state.phase !== "AWAITING_OBJECT" ||
        !state.visibleObjectIds.includes(input.objectId)
      ) {
        return unchanged(state);
      }
      return evaluateAnswer(
        state,
        input,
        input.objectId,
        step.interaction.acceptedObjectIds.includes(input.objectId),
      );

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
        input.optionId,
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
  input: Extract<LessonInput, { type: "OBJECT_SELECTED" | "OPTION_SELECTED" }>,
  submittedValue: string,
  correct: boolean,
): LessonUpdate {
  const step = currentStep(state);
  const attempt = state.attempt + 1;
  const activeScaffolds = step.scaffolds.filter(
    (scaffold) => scaffold.afterAttempt <= attempt,
  );
  const assisted = state.helpUsed || state.activeScaffoldIds.length > 0;
  const reaction = reactionEvents(
    eventContext(state, input),
    step,
    attempt,
    submittedValue,
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

  const supportedState = applyScaffolds(state, activeScaffolds, attempt);
  if (attempt >= step.attemptPolicy.maximumAttempts) {
    const outcome: LessonOutcome =
      step.attemptPolicy.afterMaximum === "CONTINUE_ASSISTED"
        ? "ASSISTED"
        : "FAILURE";
    return finishStep(supportedState, input, outcome, reaction);
  }

  return feedbackUpdate(
    supportedState,
    step.feedback.incorrect,
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
    { kind: "TRANSITION", target },
    [...precedingEvents, terminalEvent],
    cueIds,
  );
}

function feedbackUpdate(
  state: LessonState,
  feedback: FeedbackMessage,
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
    state: { ...state, phase: "FEEDBACK", feedback, pending },
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
    return {
      state: {
        ...state,
        phase: "COMPLETED",
        feedback: undefined,
        pending: undefined,
      },
      effects: [
        record([
          lessonCompletedEvent(eventContext(state, input), previousStep),
        ]),
      ],
    };
  }

  const nextState = createStepState(
    state.manifest,
    state.sessionId,
    target.stepId,
    state.completedStepIds,
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
  activeTimeMs: number,
): LessonState {
  const step = manifest.steps.find((candidate) => candidate.stepId === stepId);
  if (step === undefined)
    throw new Error(`Lesson step '${stepId}' was not found.`);
  const visibleObjectIds =
    step.interaction.type === "CLICK_OBJECT"
      ? [...step.interaction.candidateObjectIds]
      : [];
  const visibleOptions = orderedChoiceOptions(step, manifest.randomSeed);
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
    visibleOptions,
    highlightObjectIds: [],
    readingHint: undefined,
    feedback: undefined,
    pending: undefined,
    completedStepIds: [...completedStepIds],
    stepStartedAtActiveMs: activeTimeMs,
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
  let readingHint = state.readingHint;

  scaffolds.forEach((scaffold) => {
    switch (scaffold.kind) {
      case "HIGHLIGHT_OBJECTS":
        highlightObjectIds = [...scaffold.objectIds];
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
      case "REPLAY_AUDIO":
      case "SHOW_JAPANESE_TEXT":
      case "HIGHLIGHT_ENTITIES":
      case "SHOW_MEANING":
      case "SHOW_PATTERN":
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
    readingHint,
  };
}

function inputPhase(step: LessonStep): LessonPhase {
  switch (step.interaction.type) {
    case "LISTEN":
      return "AWAITING_AUDIO";
    case "CLICK_OBJECT":
      return "AWAITING_OBJECT";
    case "CHOOSE":
      return "AWAITING_CHOICE";
    default:
      throw new Error(
        `Primitive '${step.interaction.type}' passed the Milestone 4 capability gate unexpectedly.`,
      );
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

function record(events: readonly SessionEvent[]): LessonEffect {
  return { type: "RECORD_EVENTS", events };
}

function unchanged(state: LessonState): LessonUpdate {
  return { state, effects: [] };
}
