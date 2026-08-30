import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { fileURLToPath } from "node:url";

import type {
  AdaptivePreferences,
  CatalogSnapshot,
  LearningTargetRegistry,
  LessonManifest,
} from "@bunbun/contracts";

import {
  AdaptiveDerivationError,
  type AdaptiveLessonPackageProjection,
  type AdaptiveReactionProjection,
  deriveAdaptiveLearningSnapshot,
} from "../src/adaptation/derive-adaptive-snapshot.js";
import { canonicalJson } from "../src/persistence/canonical-json.js";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../..");

const preferences: AdaptivePreferences = {
  contractType: "ADAPTIVE_PREFERENCES",
  schemaVersion: "0.1.0",
  adaptiveMode: "SUGGEST",
  supportPreference: "ASK_EACH_TIME",
  updatedAt: "2026-08-30T05:00:00.000Z",
};

test("aliases Bunbun Core and Last Train, groups attempts, and chooses a changed lesson", async () => {
  const registry = await registryFixture();
  const core = await coreTeKudasaiPackage("lesson_core_request", 1);
  const lastTrain = await lastTrainPackage();
  const reactions = [
    reaction(1, core.manifest, "target_te_kudasai", {
      sessionId: "session_core_1",
      contextId: "park_aoi_request",
      correct: true,
    }),
    reaction(2, lastTrain.manifest, "target_te_kudasai", {
      sessionId: "session_train_1",
      contextId: "last_train_aoi_request",
      correct: true,
      assisted: true,
    }),
  ];

  const snapshot = deriveAdaptiveLearningSnapshot({
    registry,
    preferences,
    lessonPackages: [lastTrain, core],
    publishedLessons: [
      published(lastTrain, ["IMMERSIVE", "GUIDED"]),
      published(core, ["GUIDED"]),
    ],
    reactions,
  });

  const grammar = snapshot.summaries.find(
    (summary) => summary.conceptKey === "grammar_te_kudasai",
  );
  assert.deepEqual(
    grammar && {
      attempts: grammar.attemptCount,
      unaided: grammar.unaidedCorrectAttemptCount,
      assisted: grammar.assistedCorrectAttemptCount,
      contexts: grammar.distinctUnaidedCorrectContextCount,
      signal: grammar.signal,
    },
    {
      attempts: 2,
      unaided: 1,
      assisted: 1,
      contexts: 1,
      signal: "NEEDS_REVIEW",
    },
  );
  assert.deepEqual(snapshot.suggestions[0], {
    conceptKey: "grammar_te_kudasai",
    reason: "NEEDS_REVIEW",
    context: {
      availability: "CHANGED_CONTEXT_AVAILABLE",
      lessonId: "lesson_core_request",
      revision: 1,
      title: core.manifest.title,
      contextIds: ["park_aoi_request"],
      supportedLaunchModes: ["GUIDED"],
    },
  });

  const reordered = deriveAdaptiveLearningSnapshot({
    registry,
    preferences,
    lessonPackages: [core, lastTrain],
    publishedLessons: [
      published(core, ["GUIDED"]),
      published(lastTrain, ["GUIDED", "IMMERSIVE"]),
    ],
    reactions: [...reactions].reverse(),
  });
  assert.equal(canonicalJson(reordered), canonicalJson(snapshot));
});

test("revision replay does not manufacture context and two later contexts recover a weak attempt", async () => {
  const registry = await registryFixture();
  const coreRevision1 = await coreTeKudasaiPackage("lesson_core_request", 1);
  const coreRevision2 = await coreTeKudasaiPackage("lesson_core_request", 2);
  const lastTrain = await lastTrainPackage();
  const reactions = [
    reaction(1, coreRevision1.manifest, "target_te_kudasai", {
      sessionId: "session_weak",
      contextId: "park_aoi_request",
      correct: true,
      assisted: true,
    }),
    reaction(2, lastTrain.manifest, "target_te_kudasai", {
      sessionId: "session_changed_context",
      contextId: "last_train_aoi_request",
      correct: true,
    }),
    reaction(3, coreRevision2.manifest, "target_te_kudasai", {
      sessionId: "session_revision_replay",
      contextId: "park_aoi_request",
      correct: true,
    }),
  ];

  const snapshot = deriveAdaptiveLearningSnapshot({
    registry,
    preferences,
    lessonPackages: [coreRevision1, coreRevision2, lastTrain],
    publishedLessons: [published(coreRevision2, ["GUIDED"])],
    reactions,
  });
  const grammar = snapshot.summaries.find(
    (summary) => summary.conceptKey === "grammar_te_kudasai",
  );
  assert.equal(grammar?.attemptCount, 3);
  assert.equal(grammar?.distinctUnaidedCorrectContextCount, 2);
  assert.equal(grammar?.signal, "DEVELOPING");
  assert.deepEqual(
    snapshot.suggestions.find(
      (suggestion) => suggestion.conceptKey === "grammar_te_kudasai",
    ),
    {
      conceptKey: "grammar_te_kudasai",
      reason: "READY_FOR_VARIATION",
      context: { availability: "NO_CHANGED_CONTEXT_AVAILABLE" },
      compilerPrefillText: "〜てください",
    },
  );
});

test("conflicting target rows make one attempt incorrect and assisted recovery remains weak", async () => {
  const registry = await registryFixture();
  const core = await coreTeKudasaiPackage("lesson_core_conflict", 1);
  const reactions = [
    reaction(1, core.manifest, "target_te_kudasai", {
      sessionId: "session_conflict",
      contextId: "park_aoi_request",
      correct: true,
    }),
    reaction(2, core.manifest, "target_te_kudasai", {
      sessionId: "session_conflict",
      contextId: "park_aoi_request",
      correct: false,
    }),
    reaction(3, core.manifest, "target_te_kudasai", {
      sessionId: "session_assisted",
      stepId: "listen_aoi_request",
      contextId: "park_aoi_request",
      attempt: 1,
      correct: true,
      assisted: true,
    }),
  ];

  const snapshot = deriveAdaptiveLearningSnapshot({
    registry,
    preferences,
    lessonPackages: [core],
    publishedLessons: [published(core, ["GUIDED"])],
    reactions,
  });
  const summary = snapshot.summaries[0]!;
  assert.deepEqual(
    {
      attempts: summary.attemptCount,
      incorrect: summary.incorrectAttemptCount,
      assisted: summary.assistedCorrectAttemptCount,
      signal: summary.signal,
    },
    { attempts: 2, incorrect: 1, assisted: 1, signal: "NEEDS_REVIEW" },
  );
});

test("ranking is stable, requested targets beat supporting targets, and OFF hides suggestions", async () => {
  const registry = await registryFixture();
  const lastTrain = await lastTrainPackage();
  const input = {
    registry,
    preferences,
    lessonPackages: [lastTrain],
    publishedLessons: [published(lastTrain, ["IMMERSIVE", "GUIDED"])],
    reactions: [],
  };
  const snapshot = deriveAdaptiveLearningSnapshot(input);

  assert.deepEqual(
    snapshot.suggestions.map((suggestion) => suggestion.conceptKey),
    ["grammar_te_kudasai", "vocabulary_search", "vocabulary_wallet"],
  );
  assert.deepEqual(
    snapshot.summaries
      .slice(0, 3)
      .map((summary) => [summary.role, summary.priority]),
    [
      ["REQUESTED", 5],
      ["REQUESTED", 5],
      ["REQUESTED", 5],
    ],
  );
  assert.equal(
    snapshot.summaries.find(
      (summary) => summary.conceptKey === "vocabulary_umbrella",
    )?.role,
    "SUPPORTING",
  );

  const off = deriveAdaptiveLearningSnapshot({
    ...input,
    preferences: { ...preferences, adaptiveMode: "OFF" },
  });
  assert.deepEqual(off.suggestions, []);
  assert.deepEqual(off.summaries, snapshot.summaries);
});

test("reports no published lesson, no changed context, and unmapped published targets honestly", async () => {
  const registry = await registryFixture();
  const core = await coreTeKudasaiPackage("lesson_core_only", 1);
  const noPublished = deriveAdaptiveLearningSnapshot({
    registry,
    preferences,
    lessonPackages: [core],
    publishedLessons: [],
    reactions: [
      reaction(1, core.manifest, "target_te_kudasai", {
        sessionId: "session_no_publish",
        contextId: "park_aoi_request",
        correct: false,
      }),
    ],
  });
  assert.deepEqual(noPublished.suggestions[0], {
    conceptKey: "grammar_te_kudasai",
    reason: "NEEDS_REVIEW",
    context: { availability: "NO_PUBLISHED_LESSON_AVAILABLE" },
    compilerPrefillText: "〜てください",
  });

  const dogFixture = await readPackage(
    "packages/contracts/fixtures/manifests/valid-find-dog-loop.json",
    "packages/contracts/fixtures/catalogs/basic-catalog.json",
  );
  const unmapped = deriveAdaptiveLearningSnapshot({
    registry,
    preferences,
    lessonPackages: [],
    publishedLessons: [published(dogFixture, ["IMMERSIVE"])],
    reactions: [],
  });
  assert.deepEqual(unmapped.summaries, []);
  assert.deepEqual(unmapped.suggestions, []);
  assert.deepEqual(unmapped.unmappedTargets, [
    {
      lessonId: "lesson_find_dog_loop",
      revision: 1,
      targetId: "target_inu",
      targetKind: "VOCABULARY",
      reason: "UNMAPPED_TARGET",
    },
  ]);
});

test("fails closed for duplicate sequences, cross-context attempts, and invalid packages", async () => {
  const registry = await registryFixture();
  const core = await coreTeKudasaiPackage("lesson_core_invalid", 1);
  const valid = reaction(1, core.manifest, "target_te_kudasai", {
    sessionId: "session_invalid",
    contextId: "park_aoi_request",
    correct: true,
  });
  assert.throws(
    () =>
      deriveAdaptiveLearningSnapshot({
        registry,
        preferences,
        lessonPackages: [core],
        publishedLessons: [],
        reactions: [valid, { ...valid }],
      }),
    hasCode("REACTION_INVALID"),
  );
  assert.throws(
    () =>
      deriveAdaptiveLearningSnapshot({
        registry,
        preferences,
        lessonPackages: [core],
        publishedLessons: [],
        reactions: [
          valid,
          { ...valid, eventSequence: 2, contextId: "another_context" },
        ],
      }),
    hasCode("CONFLICTING_ATTEMPT_CONTEXT"),
  );
  const invalidPackage = structuredClone(core);
  invalidPackage.manifest.entryStepId = "missing_step";
  assert.throws(
    () =>
      deriveAdaptiveLearningSnapshot({
        registry,
        preferences,
        lessonPackages: [invalidPackage],
        publishedLessons: [],
        reactions: [],
      }),
    hasCode("LESSON_PACKAGE_INVALID"),
  );
});

test("derives a deterministic 10,000-reaction snapshot within the local M10 budget", async (context) => {
  const registry = await registryFixture();
  const core = await coreTeKudasaiPackage("lesson_core_performance", 1);
  const reactions = Array.from({ length: 10_000 }, (_, index) =>
    reaction(index + 1, core.manifest, "target_te_kudasai", {
      sessionId: `session_perf_${index}`,
      contextId: "park_aoi_request",
      correct: index % 7 !== 0,
      occurredAt: new Date(Date.UTC(2026, 7, 30, 5, 0, 0, index)).toISOString(),
    }),
  );
  const input = {
    registry,
    preferences,
    lessonPackages: [core],
    publishedLessons: [published(core, ["GUIDED"])],
    reactions,
  };

  deriveAdaptiveLearningSnapshot(input);
  const measurements = Array.from({ length: 5 }, () => {
    const startedAt = performance.now();
    deriveAdaptiveLearningSnapshot(input);
    return performance.now() - startedAt;
  }).sort((left, right) => left - right);
  const medianMs = measurements[2]!;

  context.diagnostic(`10,000-reaction median: ${medianMs.toFixed(2)} ms`);
  assert.ok(
    medianMs <= 100,
    `Expected 10,000 reactions in <= 100 ms, observed ${medianMs.toFixed(2)} ms.`,
  );
});

async function registryFixture(): Promise<LearningTargetRegistry> {
  return readJson(
    "packages/contracts/fixtures/adaptive/learning-target-registry-0.1.0.json",
  ) as Promise<LearningTargetRegistry>;
}

async function lastTrainPackage(): Promise<AdaptiveLessonPackageProjection> {
  return readPackage(
    "packages/contracts/fixtures/manifests/m8-last-train.json",
    "packages/contracts/fixtures/catalogs/m8-last-train-catalog.json",
  );
}

async function coreTeKudasaiPackage(
  lessonId: string,
  revision: number,
): Promise<AdaptiveLessonPackageProjection> {
  const lessonPackage = await readPackage(
    "packages/contracts/fixtures/manifests/valid-m8-cached-speech.json",
    "packages/contracts/fixtures/catalogs/basic-catalog.json",
  );
  lessonPackage.manifest.lessonId = lessonId;
  lessonPackage.manifest.manifestId = `manifest_${lessonId}_${revision}`;
  lessonPackage.manifest.revision = revision;
  lessonPackage.manifest.title = {
    ja: "丁寧なお願い",
    support: `Yêu cầu lịch sự ${revision}`,
  };
  lessonPackage.manifest.learningTargets[0]!.content = {
    kind: "GRAMMAR",
    pattern: "〜てください",
    labelJa: "〜てください",
    supportExplanation: "Mẫu yêu cầu lịch sự: hãy hoặc xin hãy làm gì đó.",
  };
  return lessonPackage;
}

function published(
  lessonPackage: AdaptiveLessonPackageProjection,
  supportedLaunchModes: Array<"GUIDED" | "IMMERSIVE">,
) {
  return { ...lessonPackage, supportedLaunchModes };
}

function reaction(
  eventSequence: number,
  manifest: LessonManifest,
  targetId: string,
  overrides: Partial<AdaptiveReactionProjection> & {
    sessionId: string;
    contextId: string;
    correct: boolean;
  },
): AdaptiveReactionProjection {
  return {
    eventSequence,
    sessionId: overrides.sessionId,
    lessonId: manifest.lessonId,
    revision: manifest.revision,
    stepId: overrides.stepId ?? "listen_aoi_request",
    contextId: overrides.contextId,
    targetId,
    attempt: overrides.attempt ?? 0,
    correct: overrides.correct,
    assisted: overrides.assisted ?? false,
    occurredAt:
      overrides.occurredAt ??
      `2026-08-30T05:00:${String(eventSequence).padStart(2, "0")}.000Z`,
  };
}

async function readPackage(
  manifestPath: string,
  catalogPath: string,
): Promise<AdaptiveLessonPackageProjection> {
  return {
    manifest: (await readJson(manifestPath)) as LessonManifest,
    catalog: (await readJson(catalogPath)) as CatalogSnapshot,
  };
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(repositoryRoot, path), "utf8"));
}

function hasCode(code: string) {
  return (error: unknown) =>
    error instanceof AdaptiveDerivationError && error.code === code;
}
