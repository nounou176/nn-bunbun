import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateReactionCadence,
  meaningfulReactionKey,
  summarizeMeaningfulReactions,
} from "../src/lesson/cadence.js";

const sessionId = "session_m9_cadence";

test("meaningful reaction identity groups target evidence by learner attempt", () => {
  assert.equal(
    meaningfulReactionKey({ sessionId, stepId: "arrange_wallet", attempt: 2 }),
    "session_m9_cadence:arrange_wallet:2",
  );
});

test("multiple assessed targets in one attempt count as one meaningful reaction", () => {
  assert.deepEqual(
    summarizeMeaningfulReactions([
      { sessionId, stepId: "arrange_wallet", attempt: 1, correct: true },
      { sessionId, stepId: "arrange_wallet", attempt: 1, correct: true },
      { sessionId, stepId: "arrange_wallet", attempt: 1, correct: true },
    ]),
    {
      reactionCount: 1,
      correctReactionCount: 1,
      incorrectReactionCount: 0,
    },
  );
});

test("different attempts remain distinct meaningful reactions", () => {
  assert.deepEqual(
    summarizeMeaningfulReactions([
      { sessionId, stepId: "type_wallet", attempt: 1, correct: false },
      { sessionId, stepId: "type_wallet", attempt: 2, correct: true },
      { sessionId, stepId: "choose_meaning", attempt: 1, correct: true },
    ]),
    {
      reactionCount: 3,
      correctReactionCount: 2,
      incorrectReactionCount: 1,
    },
  );
});

test("a conflicting target row makes its grouped attempt incorrect", () => {
  assert.deepEqual(
    summarizeMeaningfulReactions([
      { sessionId, stepId: "give_wallet", attempt: 1, correct: true },
      { sessionId, stepId: "give_wallet", attempt: 1, correct: false },
    ]),
    {
      reactionCount: 1,
      correctReactionCount: 0,
      incorrectReactionCount: 1,
    },
  );
});

test("reaction cadence reports an empty active visit without invented gaps", () => {
  assert.deepEqual(calculateReactionCadence(0, []), {
    reactionsPerMinute: 0,
    medianGapMs: undefined,
    p95GapMs: undefined,
  });
});

test("reaction cadence measures rate and active-time gaps", () => {
  assert.deepEqual(calculateReactionCadence(12_000, [1_000, 5_000, 9_000]), {
    reactionsPerMinute: 15,
    medianGapMs: 4_000,
    p95GapMs: 4_000,
  });
});

test("reaction cadence sorts valid samples and ignores invalid or future values", () => {
  assert.deepEqual(
    calculateReactionCadence(60_000, [40_000, Number.NaN, -1, 10_000, 70_000]),
    {
      reactionsPerMinute: 2,
      medianGapMs: 30_000,
      p95GapMs: 30_000,
    },
  );
});

test("one reaction has a rate but no reaction gap", () => {
  assert.deepEqual(calculateReactionCadence(30_000, [15_000]), {
    reactionsPerMinute: 2,
    medianGapMs: undefined,
    p95GapMs: undefined,
  });
});

test("p95 uses the nearest-rank sample", () => {
  const result = calculateReactionCadence(60_000, [0, 1_000, 3_000, 6_000]);
  assert.equal(result.medianGapMs, 2_000);
  assert.equal(result.p95GapMs, 3_000);
});
