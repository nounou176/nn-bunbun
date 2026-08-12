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
import {
  orderedArrangeTokens,
  orderedChoiceOptions,
} from "../src/lesson/shuffle.js";

const occurredAt = "2026-08-12T00:00:00.000Z";

test("authored package passes all eight primitive capabilities", () => {
  const lessonPackage = loadAuthoredLesson(false);

  assert.equal(lessonPackage.manifest.steps.length, 8);
  assert.deepEqual(
    lessonPackage.manifest.steps.map((step) => step.interaction.type),
    [
      "LISTEN",
      "ARRANGE",
      "CLICK_OBJECT",
      "TYPE",
      "MOVE_TO",
      "PICK_UP",
      "GIVE",
      "CHOOSE",
    ],
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

test("runtime capability gate rejects unknown runtime resources and fallback", () => {
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
      code: "UNSUPPORTED_RUNTIME_LOCATION",
      mutate: (value) => {
        value.manifest.locations[0]!.locationId = "pond_area";
      },
    },
    {
      code: "UNSUPPORTED_RUNTIME_SCAFFOLD",
      mutate: (value) => {
        value.manifest.steps[1]!.scaffolds[0]!.kind = "RECOGNITION_FALLBACK";
      },
    },
    {
      code: "UNSUPPORTED_RUNTIME_CARRY_PATH",
      mutate: (value) => {
        value.manifest.steps[5]!.attemptPolicy.afterMaximum =
          "FOLLOW_FAILURE_TRANSITION";
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

test("happy path completes all eight primitives with seven reactions", () => {
  const harness = createHarness();

  advanceToArrange(harness);
  completeArrange(harness);
  completeFindDog(harness);
  completeType(harness, "　イヌ。　");
  completeMove(harness, "animal_area");
  completePickUp(harness, "dog");
  completeGive(harness, "guide");
  completeChoice(harness, "choice_dog");

  assert.equal(harness.state.phase, "COMPLETED");
  assert.equal(harness.state.carriedObjectId, undefined);
  assert.equal(harness.state.completedStepIds.length, 8);
  assert.equal(eventsOfKind(harness, "REACTION").length, 7);
  assert.equal(eventsOfKind(harness, "STEP_COMPLETED").length, 8);
  assert.equal(eventsOfKind(harness, "LESSON_COMPLETED").length, 1);
  const typed = eventsOfKind(harness, "REACTION").find(
    (event) => event.primitive === "TYPE",
  );
  assert.equal(typed?.submittedValue, "いぬ");
});

test("ARRANGE keeps duplicate surface tokens distinct and preserves a wrong order", () => {
  const harness = createHarness();
  advanceToArrange(harness);
  const step = currentStep(harness.state);
  assert.equal(step.interaction.type, "ARRANGE");
  if (step.interaction.type !== "ARRANGE") return;
  const duplicateParticles = step.interaction.tokens.filter(
    (token) => token.textJa === "を",
  );
  assert.equal(duplicateParticles.length, 2);
  assert.notEqual(
    duplicateParticles[0]?.tokenId,
    duplicateParticles[1]?.tokenId,
  );

  [...step.interaction.acceptedSequences[0]!].reverse().forEach((tokenId) =>
    harness.dispatch({
      type: "ARRANGE_TOKEN_ADDED",
      tokenId,
      ...harness.tick(),
    }),
  );
  const wrongOrder = [...harness.state.arrangedTokenIds];
  harness.dispatch({ type: "ARRANGE_SUBMITTED", ...harness.tick() });

  assert.equal(harness.state.phase, "FEEDBACK");
  assert.deepEqual(harness.state.arrangedTokenIds, wrongOrder);
  assert.ok(harness.state.patternHint?.includes("［もの］"));
  assert.equal(eventsOfKind(harness, "REACTION").at(-1)?.correct, false);
});

test("ARRANGE reset restores the same seeded bank without mutating manifest", () => {
  const harness = createHarness();
  advanceToArrange(harness);
  const step = currentStep(harness.state);
  const before = JSON.stringify(step.interaction);
  const initial = [...harness.state.availableTokenIds];
  const tokenId = initial[0]!;
  harness.dispatch({
    type: "ARRANGE_TOKEN_ADDED",
    tokenId,
    ...harness.tick(),
  });
  harness.dispatch({ type: "ARRANGE_RESET", ...harness.tick() });

  assert.deepEqual(harness.state.availableTokenIds, initial);
  assert.deepEqual(harness.state.arrangedTokenIds, []);
  assert.deepEqual(
    orderedArrangeTokens(step, harness.state.manifest.randomSeed).map(
      (token) => token.tokenId,
    ),
    initial,
  );
  assert.equal(JSON.stringify(step.interaction), before);
});

test("TYPE preserves authored wrong text and accepts exact configured kana equivalence", () => {
  const harness = createHarness();
  advanceToType(harness);
  harness.dispatch({
    type: "TYPE_DRAFT_CHANGED",
    value: "ねこ",
    ...harness.tick(),
  });
  harness.dispatch({ type: "TYPE_SUBMITTED", ...harness.tick() });
  assert.equal(harness.state.typeDraft, "ねこ");
  assert.equal(harness.state.readingHint, "いぬ");
  finishFeedback(harness);
  harness.dispatch({
    type: "TYPE_DRAFT_CHANGED",
    value: "イヌ！",
    ...harness.tick(),
  });
  harness.dispatch({ type: "TYPE_SUBMITTED", ...harness.tick() });
  assert.equal(eventsOfKind(harness, "REACTION").at(-1)?.correct, true);
  assert.equal(eventsOfKind(harness, "REACTION").at(-1)?.assisted, true);
});

test("TYPE draft is truncated by Unicode code points", () => {
  const harness = createHarness();
  advanceToType(harness);
  harness.dispatch({
    type: "TYPE_DRAFT_CHANGED",
    value: "犬🐕あいうえおかきくけこさしす",
    ...harness.tick(),
  });
  assert.equal([...harness.state.typeDraft].length, 12);
});

test("MOVE_TO waits for matching arrival and runtime failure consumes no attempt", () => {
  const harness = createHarness();
  advanceToMove(harness);
  const eventCount = harness.events.size;
  harness.dispatch({
    type: "LOCATION_SELECTED",
    locationId: "animal_area",
    ...harness.tick(),
  });
  assert.equal(harness.state.phase, "MOVING_TO_LOCATION");
  assert.equal(harness.state.attempt, 0);
  harness.dispatch({
    type: "MOVEMENT_FAILED",
    locationId: "animal_area",
    ...harness.tick(),
  });
  assert.equal(harness.state.phase, "AWAITING_LOCATION");
  assert.equal(harness.state.attempt, 0);
  assert.equal(harness.events.size, eventCount);
  assert.ok(harness.state.movementError?.includes("移動"));
});

test("MOVE_TO reaction latency uses selection time rather than travel completion", () => {
  const harness = createHarness();
  advanceToMove(harness);
  const stepStartedAt = harness.state.stepStartedAtActiveMs;
  const selectedAt = harness.now + 50;
  harness.dispatch({
    type: "LOCATION_SELECTED",
    locationId: "bench_area",
    ...harness.tick(50),
  });
  harness.dispatch({
    type: "LOCATION_REACHED",
    locationId: "bench_area",
    ...harness.tick(5_000),
  });
  const reaction = eventsOfKind(harness, "REACTION").at(-1);
  assert.equal(reaction?.activeLatencyMs, selectedAt - stepStartedAt);
  assert.equal(reaction?.correct, false);
});

test("PICK_UP assisted maximum deterministically acquires the single dog", () => {
  const harness = createHarness();
  advanceToPickUp(harness);
  harness.dispatch({
    type: "OBJECT_SELECTED",
    objectId: "cat",
    ...harness.tick(),
  });
  finishFeedback(harness);
  const update = harness.dispatch({
    type: "OBJECT_SELECTED",
    objectId: "cat",
    ...harness.tick(),
  });

  assert.equal(harness.state.carriedObjectId, "dog");
  assert.ok(
    update.effects.some(
      (effect) =>
        effect.type === "SET_CARRIED_OBJECT" && effect.objectId === "dog",
    ),
  );
  assert.equal(eventsOfKind(harness, "STEP_COMPLETED").at(-1)?.assisted, true);
});

test("wrong GIVE recipient preserves carry and correct recipient transfers it", () => {
  const harness = createHarness();
  advanceToGive(harness);
  harness.dispatch({
    type: "RECIPIENT_SELECTED",
    entityId: "visitor",
    ...harness.tick(),
  });
  assert.equal(harness.state.carriedObjectId, "dog");
  assert.deepEqual(harness.state.highlightEntityIds, ["guide", "visitor"]);
  finishFeedback(harness);
  const update = harness.dispatch({
    type: "RECIPIENT_SELECTED",
    entityId: "guide",
    ...harness.tick(),
  });
  assert.equal(harness.state.carriedObjectId, undefined);
  assert.ok(
    update.effects.some(
      (effect) =>
        effect.type === "TRANSFER_CARRIED_OBJECT" &&
        effect.objectId === "dog" &&
        effect.recipientEntityId === "guide",
    ),
  );
});

test("GIVE fails closed when controller carry state is invalid", () => {
  const harness = createHarness();
  advanceToGive(harness);
  harness.state = { ...harness.state, carriedObjectId: undefined };

  assert.throws(
    () =>
      harness.dispatch({
        type: "RECIPIENT_SELECTED",
        entityId: "guide",
        ...harness.tick(),
      }),
    /no compatible carried object/,
  );
});

test("rapid duplicate world input during feedback cannot duplicate or skip", () => {
  const harness = createHarness();
  advanceToFindDog(harness);
  harness.dispatch({
    type: "OBJECT_SELECTED",
    objectId: "dog",
    ...harness.tick(),
  });
  const eventCount = harness.events.size;
  harness.dispatch({
    type: "OBJECT_SELECTED",
    objectId: "dog",
    ...harness.tick(1),
  });

  assert.equal(harness.events.size, eventCount);
  assert.equal(currentStep(harness.state).stepId, "find_dog");
  assert.equal(harness.state.phase, "FEEDBACK");
});

test("audio failure creates no heard evidence and continues assisted", () => {
  const harness = createHarness();

  harness.dispatch({ type: "AUDIO_FAILED", ...harness.tick() });
  assert.equal(harness.state.phase, "AWAITING_CONTINUE");
  assert.equal(eventsOfKind(harness, "HEARD").length, 0);
  harness.dispatch({ type: "CONTINUE", ...harness.tick() });
  assert.equal(eventsOfKind(harness, "STEP_COMPLETED")[0]?.assisted, true);
});

test("seeded CHOOSE and ARRANGE orders are stable", () => {
  const manifest = loadAuthoredLesson(false).manifest;
  const arrange = manifest.steps.find(
    (step) => step.interaction.type === "ARRANGE",
  );
  const choose = manifest.steps.find(
    (step) => step.interaction.type === "CHOOSE",
  );
  assert.ok(arrange);
  assert.ok(choose);
  assert.deepEqual(
    orderedArrangeTokens(arrange, manifest.randomSeed),
    orderedArrangeTokens(arrange, manifest.randomSeed),
  );
  assert.deepEqual(
    orderedChoiceOptions(choose, manifest.randomSeed),
    orderedChoiceOptions(choose, manifest.randomSeed),
  );
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

test("a fresh lesson start resets session-local state", () => {
  const manifest = loadAuthoredLesson(false).manifest;
  const first = createHarness(manifest, "session_first");
  first.dispatch({ type: "AUDIO_STARTED", ...first.tick() });
  assert.ok(first.events.size > 1);

  const restarted = createHarness(manifest, "session_restart");
  assert.equal(restarted.state.sessionId, "session_restart");
  assert.equal(restarted.state.currentStepId, manifest.entryStepId);
  assert.equal(restarted.state.carriedObjectId, undefined);
  assert.equal(restarted.events.size, 1);
});

interface Harness {
  state: LessonState;
  events: InMemoryEventSink;
  now: number;
  tick: (advanceMs?: number) => { activeTimeMs: number; occurredAt: string };
  dispatch: (input: LessonInput) => LessonUpdate;
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
    now: 0,
    tick: (advanceMs = 50) => {
      harness.now += advanceMs;
      return { activeTimeMs: harness.now, occurredAt };
    },
    dispatch: (input) => {
      const update = reduceLesson(harness.state, input);
      harness.state = update.state;
      applyEffects(events, update.effects);
      return update;
    },
  };
  applyEffects(events, initial.effects);
  return harness;
}

function advanceToArrange(harness: Harness): void {
  harness.dispatch({ type: "AUDIO_STARTED", ...harness.tick() });
  harness.dispatch({ type: "AUDIO_ENDED", ...harness.tick() });
  harness.dispatch({ type: "CONTINUE", ...harness.tick() });
  finishFeedback(harness);
  assert.equal(currentStep(harness.state).stepId, "arrange_request");
}

function completeArrange(harness: Harness): void {
  const step = currentStep(harness.state);
  assert.equal(step.interaction.type, "ARRANGE");
  if (step.interaction.type !== "ARRANGE") return;
  step.interaction.acceptedSequences[0]!.forEach((tokenId) =>
    harness.dispatch({
      type: "ARRANGE_TOKEN_ADDED",
      tokenId,
      ...harness.tick(),
    }),
  );
  harness.dispatch({ type: "ARRANGE_SUBMITTED", ...harness.tick() });
  finishFeedback(harness);
}

function advanceToFindDog(harness: Harness): void {
  advanceToArrange(harness);
  completeArrange(harness);
  assert.equal(currentStep(harness.state).stepId, "find_dog");
}

function completeFindDog(harness: Harness): void {
  harness.dispatch({
    type: "OBJECT_SELECTED",
    objectId: "dog",
    ...harness.tick(),
  });
  finishFeedback(harness);
}

function advanceToType(harness: Harness): void {
  advanceToFindDog(harness);
  completeFindDog(harness);
  assert.equal(currentStep(harness.state).stepId, "type_dog");
}

function completeType(harness: Harness, value: string): void {
  harness.dispatch({ type: "TYPE_DRAFT_CHANGED", value, ...harness.tick() });
  harness.dispatch({ type: "TYPE_SUBMITTED", ...harness.tick() });
  finishFeedback(harness);
}

function advanceToMove(harness: Harness): void {
  advanceToType(harness);
  completeType(harness, "いぬ");
  assert.equal(currentStep(harness.state).stepId, "move_to_dog");
}

function completeMove(harness: Harness, locationId: string): void {
  harness.dispatch({
    type: "LOCATION_SELECTED",
    locationId,
    ...harness.tick(),
  });
  harness.dispatch({
    type: "LOCATION_REACHED",
    locationId,
    ...harness.tick(),
  });
  finishFeedback(harness);
}

function advanceToPickUp(harness: Harness): void {
  advanceToMove(harness);
  completeMove(harness, "animal_area");
  assert.equal(currentStep(harness.state).stepId, "pick_up_dog");
}

function completePickUp(harness: Harness, objectId: string): void {
  harness.dispatch({
    type: "OBJECT_SELECTED",
    objectId,
    ...harness.tick(),
  });
  finishFeedback(harness);
}

function advanceToGive(harness: Harness): void {
  advanceToPickUp(harness);
  completePickUp(harness, "dog");
  assert.equal(currentStep(harness.state).stepId, "give_dog");
  assert.equal(harness.state.carriedObjectId, "dog");
}

function completeGive(harness: Harness, entityId: string): void {
  harness.dispatch({
    type: "RECIPIENT_SELECTED",
    entityId,
    ...harness.tick(),
  });
  finishFeedback(harness);
}

function completeChoice(harness: Harness, optionId: string): void {
  harness.dispatch({
    type: "OPTION_SELECTED",
    optionId,
    ...harness.tick(),
  });
  finishFeedback(harness);
}

function finishFeedback(harness: Harness): void {
  assert.equal(harness.state.phase, "FEEDBACK");
  harness.dispatch({ type: "FEEDBACK_ELAPSED", ...harness.tick() });
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
      attemptPolicy: { afterMaximum: string };
      scaffolds: Array<{ kind: string }>;
      presentation: { onEnterCueIds: string[] };
    }>;
    objects: Array<{ objectId: string }>;
    locations: Array<{ locationId: string }>;
    audioAssets: Array<{ audioAssetId: string }>;
  };
}
