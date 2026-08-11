import assert from "node:assert/strict";
import test from "node:test";

import type { LessonManifest, ValidatedLessonPackage } from "@bunbun/contracts";

import { ActiveClock } from "../src/lesson/active-clock.js";
import { validateRuntimeCapabilities } from "../src/lesson/capabilities.js";
import {
  currentStep,
  reduceLesson,
  startLesson,
  type LessonEffect,
  type LessonInput,
  type LessonState,
  type LessonUpdate,
} from "../src/lesson/controller.js";
import {
  LessonContentError,
  loadAuthoredLesson,
} from "../src/lesson/content.js";
import { InMemoryEventSink, type SessionEvent } from "../src/lesson/events.js";
import { orderedChoiceOptions } from "../src/lesson/shuffle.js";

const occurredAt = "2026-08-11T00:00:00.000Z";

test("authored three-step package passes contract and runtime capabilities", () => {
  const lessonPackage = loadAuthoredLesson(false);

  assert.equal(lessonPackage.manifest.steps.length, 3);
  assert.deepEqual(
    lessonPackage.manifest.steps.map((step) => step.interaction.type),
    ["LISTEN", "CLICK_OBJECT", "CHOOSE"],
  );
  assert.deepEqual(validateRuntimeCapabilities(lessonPackage), []);
});

test("simulated invalid manifest fails before runtime activation", () => {
  assert.throws(
    () => loadAuthoredLesson(true),
    (error: unknown) =>
      error instanceof LessonContentError &&
      error.code === "RUNTIME_MANIFEST_INVALID" &&
      error.message.includes("STRUCTURAL_CONST"),
  );
});

test("runtime capability gate rejects unsupported scene, object, primitive, scaffold, cue, and audio", () => {
  const valid = loadAuthoredLesson(false);
  const mutations: Array<{
    code: string;
    mutate: (value: MutableLessonPackage) => void;
  }> = [
    {
      code: "UNSUPPORTED_RUNTIME_SCENE",
      mutate: (value) => {
        value.manifest.scene.sceneId = "station_small";
      },
    },
    {
      code: "UNSUPPORTED_RUNTIME_OBJECT",
      mutate: (value) => {
        value.manifest.objects[0]!.objectId = "rabbit";
      },
    },
    {
      code: "UNSUPPORTED_RUNTIME_PRIMITIVE",
      mutate: (value) => {
        value.manifest.steps[0]!.interaction.type = "ARRANGE";
      },
    },
    {
      code: "UNSUPPORTED_RUNTIME_SCAFFOLD",
      mutate: (value) => {
        value.manifest.steps[0]!.scaffolds[0]!.kind = "SHOW_MEANING";
      },
    },
    {
      code: "UNSUPPORTED_RUNTIME_CUE",
      mutate: (value) => {
        value.manifest.steps[0]!.presentation.onEnterCueIds = ["unknown_cue"];
      },
    },
    {
      code: "UNSUPPORTED_RUNTIME_AUDIO",
      mutate: (value) => {
        value.manifest.audioAssets[0]!.audioAssetId = "unknown_audio";
      },
    },
  ];

  mutations.forEach(({ code, mutate }) => {
    const changed = structuredClone(valid) as unknown as MutableLessonPackage;
    mutate(changed);
    const errors = validateRuntimeCapabilities(
      changed as unknown as ValidatedLessonPackage,
    );
    assert.ok(errors.some((error) => error.code === code));
  });
});

test("happy path records heard once, two reactions, every step, and completion", () => {
  const harness = createHarness();

  harness.dispatch(timed("AUDIO_STARTED", 10));
  harness.dispatch(timed("AUDIO_ENDED", 50));
  harness.dispatch(timed("AUDIO_STARTED", 60));
  harness.dispatch(timed("AUDIO_ENDED", 90));
  assert.equal(eventsOfKind(harness, "HEARD").length, 1);

  harness.dispatch(timed("CONTINUE", 100));
  harness.dispatch(timed("FEEDBACK_ELAPSED", 600));
  assert.equal(currentStep(harness.state).stepId, "find_dog");

  harness.dispatch({ ...timed("OBJECT_SELECTED", 700), objectId: "dog" });
  harness.dispatch(timed("FEEDBACK_ELAPSED", 1_350));
  assert.equal(currentStep(harness.state).stepId, "confirm_dog");

  harness.dispatch({
    ...timed("OPTION_SELECTED", 1_500),
    optionId: "choice_dog",
  });
  harness.dispatch(timed("FEEDBACK_ELAPSED", 2_150));

  assert.equal(harness.state.phase, "COMPLETED");
  assert.deepEqual(harness.state.completedStepIds, [
    "listen_request",
    "find_dog",
    "confirm_dog",
  ]);
  assert.equal(eventsOfKind(harness, "REACTION").length, 2);
  assert.equal(eventsOfKind(harness, "STEP_COMPLETED").length, 3);
  assert.equal(eventsOfKind(harness, "LESSON_COMPLETED").length, 1);
});

test("wrong attempts activate authored scaffolds and complete assisted", () => {
  const harness = createHarness();
  advanceToClick(harness);

  harness.dispatch({ ...timed("OBJECT_SELECTED", 700), objectId: "cat" });
  assert.equal(harness.state.phase, "FEEDBACK");
  assert.deepEqual(harness.state.highlightObjectIds, ["dog", "cat"]);
  harness.dispatch(timed("FEEDBACK_ELAPSED", 1_400));

  harness.dispatch({ ...timed("OBJECT_SELECTED", 1_500), objectId: "cat" });
  assert.deepEqual(harness.state.visibleObjectIds, ["dog"]);
  harness.dispatch(timed("FEEDBACK_ELAPSED", 2_300));
  assert.equal(currentStep(harness.state).stepId, "confirm_dog");

  harness.dispatch({
    ...timed("OPTION_SELECTED", 2_400),
    optionId: "choice_cat",
  });
  harness.dispatch(timed("FEEDBACK_ELAPSED", 3_100));
  assert.equal(harness.state.readingHint, "犬（いぬ）");

  harness.dispatch({
    ...timed("OPTION_SELECTED", 3_200),
    optionId: "choice_cat",
  });
  assert.deepEqual(
    harness.state.visibleOptions.map((option) => option.optionId),
    ["choice_dog"],
  );
  harness.dispatch(timed("FEEDBACK_ELAPSED", 4_050));

  assert.equal(harness.state.phase, "COMPLETED");
  const completed = eventsOfKind(harness, "STEP_COMPLETED");
  assert.equal(
    completed.find((event) => event.stepId === "find_dog")?.assisted,
    true,
  );
  assert.equal(
    completed.find((event) => event.stepId === "confirm_dog")?.assisted,
    true,
  );
});

test("maximum attempts can follow the authored failure transition", () => {
  const authored = loadAuthoredLesson(false).manifest;
  const manifest = {
    ...authored,
    steps: authored.steps.map((step) =>
      step.stepId === "find_dog"
        ? {
            ...step,
            attemptPolicy: {
              ...step.attemptPolicy,
              afterMaximum: "FOLLOW_FAILURE_TRANSITION" as const,
            },
          }
        : step,
    ),
  } satisfies LessonManifest;
  const harness = createHarness(manifest);
  advanceToClick(harness);

  harness.dispatch({ ...timed("OBJECT_SELECTED", 700), objectId: "cat" });
  harness.dispatch(timed("FEEDBACK_ELAPSED", 1_400));
  harness.dispatch({ ...timed("OBJECT_SELECTED", 1_500), objectId: "cat" });
  harness.dispatch(timed("FEEDBACK_ELAPSED", 2_300));

  assert.equal(currentStep(harness.state).stepId, "confirm_dog");
  const result = eventsOfKind(harness, "STEP_COMPLETED").find(
    (event) => event.stepId === "find_dog",
  );
  assert.equal(result?.correct, false);
  assert.equal(result?.assisted, false);
});

test("help makes a later correct result assisted", () => {
  const harness = createHarness();
  advanceToClick(harness);

  harness.dispatch(timed("HELP_REQUESTED", 650));
  harness.dispatch({ ...timed("OBJECT_SELECTED", 700), objectId: "dog" });

  const completed = eventsOfKind(harness, "STEP_COMPLETED").find(
    (event) => event.stepId === "find_dog",
  );
  assert.equal(completed?.assisted, true);
  assert.equal(completed?.correct, false);
});

test("rapid duplicate input during feedback cannot duplicate or skip", () => {
  const harness = createHarness();
  advanceToClick(harness);

  harness.dispatch({ ...timed("OBJECT_SELECTED", 700), objectId: "dog" });
  const eventCount = harness.events.size;
  harness.dispatch({ ...timed("OBJECT_SELECTED", 701), objectId: "dog" });

  assert.equal(harness.events.size, eventCount);
  assert.equal(currentStep(harness.state).stepId, "find_dog");
  assert.equal(harness.state.phase, "FEEDBACK");
});

test("audio failure creates no heard evidence and continues assisted", () => {
  const harness = createHarness();

  harness.dispatch(timed("AUDIO_FAILED", 20));
  assert.equal(harness.state.phase, "AWAITING_CONTINUE");
  assert.equal(harness.state.audioFailed, true);
  assert.equal(eventsOfKind(harness, "HEARD").length, 0);
  harness.dispatch(timed("CONTINUE", 40));

  const completed = eventsOfKind(harness, "STEP_COMPLETED")[0];
  assert.equal(completed?.assisted, true);
  assert.equal(completed?.correct, false);
});

test("seeded CHOOSE order is stable and does not mutate manifest", () => {
  const manifest = loadAuthoredLesson(false).manifest;
  const step = manifest.steps.find(
    (candidate) => candidate.stepId === "confirm_dog",
  );
  assert.ok(step);
  const before = JSON.stringify(step.interaction);

  const first = orderedChoiceOptions(step, manifest.randomSeed);
  const second = orderedChoiceOptions(step, manifest.randomSeed);

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(step.interaction), before);
});

test("active clock excludes time while paused", () => {
  let now = 100;
  const clock = new ActiveClock(() => now);
  now = 150;
  assert.equal(clock.read(), 50);
  clock.pause();
  now = 400;
  assert.equal(clock.read(), 50);
  clock.resume();
  now = 460;
  assert.equal(clock.read(), 110);
});

test("event sink deduplicates stable idempotency keys", () => {
  const sink = new InMemoryEventSink();
  const event = sampleEvent();

  assert.equal(sink.write([event, event]), 1);
  assert.equal(sink.write([event]), 0);
  assert.equal(sink.size, 1);
});

test("a fresh lesson start uses a new session and resets in-memory events", () => {
  const manifest = loadAuthoredLesson(false).manifest;
  const first = createHarness(manifest, "session_first");
  first.dispatch(timed("AUDIO_STARTED", 10));
  assert.ok(first.events.size > 1);

  const restarted = createHarness(manifest, "session_restart");

  assert.equal(restarted.state.sessionId, "session_restart");
  assert.notEqual(restarted.state.sessionId, first.state.sessionId);
  assert.equal(restarted.state.currentStepId, manifest.entryStepId);
  assert.equal(restarted.events.size, 1);
  assert.equal(eventsOfKind(restarted, "HEARD").length, 0);
});

test("controller refuses completion when a required step is missing", () => {
  const manifest = structuredClone(
    loadAuthoredLesson(false).manifest,
  ) as LessonManifest;
  manifest.completion.requiredStepIds.push("missing_step");
  const harness = createHarness(manifest);
  advanceToClick(harness);
  harness.dispatch({ ...timed("OBJECT_SELECTED", 700), objectId: "dog" });
  harness.dispatch(timed("FEEDBACK_ELAPSED", 1_350));
  harness.dispatch({
    ...timed("OPTION_SELECTED", 1_500),
    optionId: "choice_dog",
  });

  assert.throws(
    () => harness.dispatch(timed("FEEDBACK_ELAPSED", 2_150)),
    /missing_step/,
  );
});

interface Harness {
  state: LessonState;
  events: InMemoryEventSink;
  dispatch: (input: LessonInput) => void;
}

function createHarness(
  manifest: LessonManifest = loadAuthoredLesson(false).manifest,
  sessionId = "session_test",
): Harness {
  const events = new InMemoryEventSink();
  const initial = startLesson(manifest, sessionId, 0, occurredAt);
  const harness: Harness = {
    state: initial.state,
    events,
    dispatch: (input) => {
      apply(harness, reduceLesson(harness.state, input));
    },
  };
  applyEffects(events, initial.effects);
  return harness;
}

function advanceToClick(harness: Harness): void {
  harness.dispatch(timed("AUDIO_STARTED", 10));
  harness.dispatch(timed("AUDIO_ENDED", 50));
  harness.dispatch(timed("CONTINUE", 100));
  harness.dispatch(timed("FEEDBACK_ELAPSED", 600));
  assert.equal(currentStep(harness.state).stepId, "find_dog");
}

function apply(harness: Harness, update: LessonUpdate): void {
  harness.state = update.state;
  applyEffects(harness.events, update.effects);
}

function applyEffects(
  sink: InMemoryEventSink,
  effects: readonly LessonEffect[],
): void {
  effects.forEach((effect) => {
    if (effect.type === "RECORD_EVENTS") sink.write(effect.events);
  });
}

function eventsOfKind(
  harness: Harness,
  kind: SessionEvent["kind"],
): readonly SessionEvent[] {
  return harness.events.values().filter((event) => event.kind === kind);
}

function timed<Type extends LessonInput["type"]>(
  type: Type,
  activeTimeMs: number,
): Extract<LessonInput, { type: Type }> {
  return { type, activeTimeMs, occurredAt } as Extract<
    LessonInput,
    { type: Type }
  >;
}

function sampleEvent(): SessionEvent {
  return {
    eventId: "session:step:reaction:1",
    kind: "REACTION",
    sessionId: "session",
    lessonId: "lesson",
    revision: 1,
    stepId: "step",
    contextId: "context",
    primitive: "CHOOSE",
    targetId: "target",
    evidence: "selected_correctly",
    submittedValue: "choice",
    correct: true,
    assisted: false,
    attempt: 1,
    activeLatencyMs: 100,
    occurredAt,
  };
}

interface MutableLessonPackage {
  manifest: {
    scene: { sceneId: string };
    steps: Array<{
      interaction: { type: string };
      scaffolds: Array<{ kind: string }>;
      presentation: { onEnterCueIds: string[] };
    }>;
    objects: Array<{ objectId: string }>;
    audioAssets: Array<{ audioAssetId: string }>;
  };
}
