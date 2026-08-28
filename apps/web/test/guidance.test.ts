import assert from "node:assert/strict";
import test from "node:test";

import {
  currentStep,
  reduceLesson,
  startLesson,
} from "../src/lesson/controller.js";
import { loadLastTrainLesson } from "../src/lesson/content.js";
import {
  authoredTextualHints,
  operationalGuidance,
} from "../src/lesson/guidance.js";
import { applyLessonSupportMode } from "../src/lesson/runtime.js";

const occurredAt = "2026-08-28T09:45:00.000Z";

test("every fixed primitive has concise Japanese and Vietnamese operational guidance", () => {
  const manifest = loadLastTrainLesson(false).manifest;
  const guidance = manifest.steps.map((step) => operationalGuidance(step));

  assert.equal(
    new Set(manifest.steps.map((step) => step.interaction.type)).size,
    8,
  );
  guidance.forEach((item) => {
    assert.ok(item.ja.length > 0);
    assert.ok(item.support.length > 0);
  });
  assert.match(guidance[0]!.support, /Nghe câu thoại/);
  assert.match(guidance[4]!.support, /cảnh 3D/);
});

test("manual help exposes only existing authored textual hints", () => {
  const manifest = loadLastTrainLesson(false).manifest;
  const listen = manifest.steps.find(
    (step) => step.stepId === "listen_aoi_request",
  );
  const arrange = manifest.steps.find(
    (step) => step.stepId === "arrange_wallet_request",
  );
  const choose = manifest.steps.find(
    (step) => step.stepId === "choose_tanaka_meaning",
  );
  const type = manifest.steps.find(
    (step) => step.stepId === "type_wallet_request",
  );
  assert.ok(listen);
  assert.ok(arrange);
  assert.ok(choose);
  assert.ok(type);

  assert.deepEqual(authoredTextualHints(listen), []);
  assert.deepEqual(authoredTextualHints(arrange), [
    {
      kind: "PATTERN",
      labelJa: "文型のヒント",
      labelSupport: "Gợi ý mẫu câu",
      text: "［もの］を探してください。",
    },
  ]);
  assert.deepEqual(authoredTextualHints(choose), [
    {
      kind: "MEANING",
      labelJa: "意味のヒント",
      labelSupport: "Gợi ý nghĩa",
      text: "Chiếc ô bị nhầm và khu vực trong cửa hàng không được phép vào.",
    },
  ]);
  assert.deepEqual(authoredTextualHints(type), [
    {
      kind: "PATTERN",
      labelJa: "文型のヒント",
      labelSupport: "Gợi ý mẫu câu",
      text: "財布を［動詞のて形］ください。",
    },
    {
      kind: "READING",
      labelJa: "読み方",
      labelSupport: "Cách đọc",
      text: "財布（さいふ）を探（さが）してください。",
    },
  ]);
});

test("guided mode opts into help without activating attempt-gated scaffolds", () => {
  const manifest = loadLastTrainLesson(false).manifest;
  const started = startLesson(manifest, "guided_session", 0, occurredAt);
  const guided = applyLessonSupportMode(started, "GUIDED", 0, occurredAt);

  assert.equal(guided.state.helpUsed, true);
  assert.equal(guided.state.attempt, 0);
  assert.deepEqual(guided.state.activeScaffoldIds, []);
  assert.deepEqual(guided.effects, started.effects);

  let state = guided.state;
  state = reduceLesson(state, {
    type: "AUDIO_STARTED",
    activeTimeMs: 10,
    occurredAt,
  }).state;
  state = reduceLesson(state, {
    type: "AUDIO_ENDED",
    activeTimeMs: 5_500,
    occurredAt,
  }).state;
  const completed = reduceLesson(state, {
    type: "CONTINUE",
    activeTimeMs: 5_600,
    occurredAt,
  });
  const completedEvent = completed.effects
    .filter((effect) => effect.type === "RECORD_EVENTS")
    .flatMap((effect) => effect.events)
    .find((event) => event.kind === "STEP_COMPLETED");

  assert.equal(completedEvent?.assisted, true);
});

test("immersive mode remains unaided until the learner requests help", () => {
  const manifest = loadLastTrainLesson(false).manifest;
  const started = startLesson(manifest, "immersive_session", 0, occurredAt);
  const immersive = applyLessonSupportMode(started, "IMMERSIVE", 0, occurredAt);

  assert.equal(immersive.state.helpUsed, false);
  assert.deepEqual(immersive.state.activeScaffoldIds, []);

  const helped = reduceLesson(immersive.state, {
    type: "HELP_REQUESTED",
    activeTimeMs: 20,
    occurredAt,
  });
  assert.equal(helped.state.helpUsed, true);
  assert.equal(helped.state.attempt, 0);
  assert.deepEqual(helped.state.activeScaffoldIds, []);
});

test("guided mode is reapplied when the controller enters the next step", () => {
  const manifest = loadLastTrainLesson(false).manifest;
  let state = applyLessonSupportMode(
    startLesson(manifest, "guided_transition", 0, occurredAt),
    "GUIDED",
    0,
    occurredAt,
  ).state;
  state = reduceLesson(state, {
    type: "AUDIO_STARTED",
    activeTimeMs: 10,
    occurredAt,
  }).state;
  state = reduceLesson(state, {
    type: "AUDIO_ENDED",
    activeTimeMs: 5_500,
    occurredAt,
  }).state;
  state = reduceLesson(state, {
    type: "CONTINUE",
    activeTimeMs: 5_600,
    occurredAt,
  }).state;
  const transition = reduceLesson(state, {
    type: "FEEDBACK_ELAPSED",
    activeTimeMs: 6_200,
    occurredAt,
  });
  assert.equal(currentStep(transition.state).stepId, "arrange_wallet_request");
  assert.equal(transition.state.helpUsed, false);

  const guidedNext = applyLessonSupportMode(
    transition,
    "GUIDED",
    6_200,
    occurredAt,
  );
  assert.equal(guidedNext.state.helpUsed, true);
  assert.equal(guidedNext.state.attempt, 0);
  assert.deepEqual(guidedNext.state.activeScaffoldIds, []);
});
