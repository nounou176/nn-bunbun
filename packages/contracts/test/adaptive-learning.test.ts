import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ADAPTIVE_LEARNING_SCHEMA_VERSION,
  type CatalogSnapshot,
  type LearningTarget,
  canonicalLearningTargetContentSignature,
  resolveLearningTargetConcept,
  validateAdaptiveLearningSnapshotStructure,
  validateAdaptivePreferencesStructure,
  validateCatalogStructure,
  validateLearningTargetRegistry,
  validateLearningTargetRegistryStructure,
  validateManifestStructure,
  validateUpdateAdaptivePreferencesRequestStructure,
} from "../src/index.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = resolve(
  packageDirectory,
  "fixtures/adaptive/learning-target-registry-0.1.0.json",
);
const kanjiRegistryPath = resolve(
  packageDirectory,
  "fixtures/adaptive/test-kanji-reference-registry-0.1.0.json",
);
const basicCatalogPath = resolve(
  packageDirectory,
  "fixtures/catalogs/basic-catalog.json",
);
const lastTrainCatalogPath = resolve(
  packageDirectory,
  "fixtures/catalogs/m8-last-train-catalog.json",
);
const lastTrainManifestPath = resolve(
  packageDirectory,
  "fixtures/manifests/m8-last-train.json",
);

test("project LearningTargetRegistry 0.1.0 is closed and semantically valid", async () => {
  const registry = await readJson(registryPath);
  const result = validateLearningTargetRegistry(registry);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.schemaVersion, ADAPTIVE_LEARNING_SCHEMA_VERSION);
  assert.equal(result.value.concepts.length, 8);

  const politeRequest = result.value.concepts.find(
    (concept) => concept.conceptKey === "grammar_te_kudasai",
  );
  assert.ok(politeRequest);
  assert.deepEqual(
    politeRequest.selectors.map((selector) => [
      selector.providerVersion,
      selector.referenceId,
    ]),
    [
      ["0.1.0", "bunbun_core_te_kudasai"],
      ["1.0.0", "bunbun_grammar_te_kudasai"],
    ],
  );
});

test("registry rejects unknown fields, duplicate concept keys, duplicate selectors, and kind mismatch", async () => {
  const original = asRecord(await readJson(registryPath));

  const unknownField = structuredClone(original);
  unknownField.externalDictionaryUrl = "https://example.invalid";
  assertHasCode(
    validateLearningTargetRegistryStructure(unknownField),
    "STRUCTURAL_ADDITIONAL_PROPERTIES",
  );

  const duplicateConcept = structuredClone(original);
  const duplicateConcepts = asRecords(duplicateConcept.concepts);
  duplicateConcepts[1]!.conceptKey = duplicateConcepts[0]!.conceptKey;
  assertHasCode(
    validateLearningTargetRegistry(duplicateConcept),
    "DUPLICATE_CONCEPT_KEY",
  );

  const duplicateSelector = structuredClone(original);
  const selectorConcepts = asRecords(duplicateSelector.concepts);
  const firstSelector = asRecords(selectorConcepts[2]!.selectors)[0]!;
  asRecords(selectorConcepts[7]!.selectors).push(
    structuredClone(firstSelector),
  );
  assertHasCode(
    validateLearningTargetRegistry(duplicateSelector),
    "DUPLICATE_EXACT_SELECTOR",
  );

  const mismatchedKind = structuredClone(original);
  const mismatchConcept = asRecords(mismatchedKind.concepts)[0]!;
  asRecords(mismatchConcept.selectors)[0]!.targetKind = "KANJI";
  assertHasCode(
    validateLearningTargetRegistry(mismatchedKind),
    "SELECTOR_TARGET_KIND_MISMATCH",
  );
});

test("reviewed Bunbun Core and Last Train aliases resolve to one grammar concept", async () => {
  const registry = await readJson(registryPath);
  const [basicCatalog, lastTrainManifest, lastTrainCatalog] = await Promise.all(
    [
      validatedCatalog(basicCatalogPath),
      validatedManifest(lastTrainManifestPath),
      validatedCatalog(lastTrainCatalogPath),
    ],
  );

  const coreTarget = coreTeKudasaiTarget();
  const lastTrainTarget = lastTrainManifest.learningTargets.find(
    (target) => target.targetId === "target_te_kudasai",
  );
  assert.ok(lastTrainTarget);

  const coreResult = resolveLearningTargetConcept(
    registry,
    coreTarget,
    basicCatalog,
  );
  const lastTrainResult = resolveLearningTargetConcept(
    registry,
    lastTrainTarget,
    lastTrainCatalog,
  );

  assert.equal(coreResult.ok, true);
  assert.equal(lastTrainResult.ok, true);
  if (!coreResult.ok || !lastTrainResult.ok) return;
  assert.equal(coreResult.value.status, "MAPPED");
  assert.equal(lastTrainResult.value.status, "MAPPED");
  if (
    coreResult.value.status !== "MAPPED" ||
    lastTrainResult.value.status !== "MAPPED"
  ) {
    return;
  }
  assert.equal(coreResult.value.conceptKey, "grammar_te_kudasai");
  assert.equal(lastTrainResult.value.conceptKey, coreResult.value.conceptKey);
});

test("surface text cannot map a target without an exact selector", async () => {
  const registry = await readJson(registryPath);
  const catalog = await validatedCatalog(basicCatalogPath);
  const target = {
    ...coreTeKudasaiTarget(),
    referenceIds: [],
  };

  const result = resolveLearningTargetConcept(registry, target, catalog);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    status: "UNMAPPED_TARGET",
    targetId: "target_te_kudasai",
    targetKind: "GRAMMAR",
  });
});

test("unknown references and changed reviewed content fail closed", async () => {
  const registry = await readJson(registryPath);
  const catalog = await validatedCatalog(basicCatalogPath);

  const unknownReference = {
    ...coreTeKudasaiTarget(),
    referenceIds: ["missing_reference"],
  };
  assertHasCode(
    resolveLearningTargetConcept(registry, unknownReference, catalog),
    "UNKNOWN_TARGET_REFERENCE_RECORD",
  );

  const originalTarget = coreTeKudasaiTarget();
  if (originalTarget.kind !== "GRAMMAR") {
    assert.fail("Expected the cached-speech target to be GRAMMAR.");
  }
  const drifted: LearningTarget = {
    ...originalTarget,
    content: {
      ...originalTarget.content,
      labelJa: "変更された依頼",
    },
  };
  assertHasCode(
    resolveLearningTargetConcept(registry, drifted, catalog),
    "TARGET_CONTENT_SIGNATURE_MISMATCH",
  );
});

test("multiple exact references to different concepts fail as ambiguous", async () => {
  const registry = asRecord(await readJson(registryPath));
  const catalog = structuredClone(await validatedCatalog(basicCatalogPath));
  const target = coreTeKudasaiTarget();
  const concepts = asRecords(registry.concepts);
  const otherGrammarConcept = concepts.find(
    (concept) => concept.conceptKey === "grammar_tewa_ikenai",
  );
  assert.ok(otherGrammarConcept);

  asRecords(otherGrammarConcept.selectors).push({
    providerId: "bunbun_core",
    providerVersion: "0.1.0",
    referenceId: "bunbun_core_te_kudasai_alt",
    targetKind: "GRAMMAR",
    contentSignature: canonicalLearningTargetContentSignature(target.content),
  });
  catalog.referenceRecords.push({
    referenceId: "bunbun_core_te_kudasai_alt",
    targetKinds: ["GRAMMAR"],
    providerId: "bunbun_core",
    providerVersion: "0.1.0",
  });
  target.referenceIds.push("bunbun_core_te_kudasai_alt");

  assertHasCode(
    resolveLearningTargetConcept(registry, target, catalog),
    "AMBIGUOUS_TARGET_SELECTOR",
  );
});

test("test-only KANJI provenance is REFERENCE-only and mnemonic fields fail closed", async () => {
  const registry = asRecord(await readJson(kanjiRegistryPath));
  const valid = validateLearningTargetRegistry(registry);
  assert.equal(valid.ok, true);

  const concept = asRecords(registry.concepts)[0]!;
  const referenceAid = asRecord(concept.referenceAid);
  assert.equal(referenceAid.aidKind, "REFERENCE");
  assert.equal("mnemonic" in referenceAid, false);

  const missingAid = structuredClone(registry);
  delete asRecords(missingAid.concepts)[0]!.referenceAid;
  assertHasCode(
    validateLearningTargetRegistry(missingAid),
    "KANJI_REFERENCE_AID_REQUIRED",
  );

  const inventedMnemonic = structuredClone(registry);
  asRecord(asRecords(inventedMnemonic.concepts)[0]!.referenceAid).mnemonic =
    "unreviewed mnemonic";
  assertHasCode(
    validateLearningTargetRegistryStructure(inventedMnemonic),
    "STRUCTURAL_ADDITIONAL_PROPERTIES",
  );
});

test("KANJI resolution requires a reviewed reference identity", async () => {
  const registry = await readJson(kanjiRegistryPath);
  const baseCatalog = await validatedCatalog(basicCatalogPath);
  const catalog: CatalogSnapshot = {
    ...baseCatalog,
    referenceRecords: [
      {
        referenceId: "bunbun_fixture_kanji_gaku",
        targetKinds: ["KANJI"],
        providerId: "bunbun_fixture",
        providerVersion: "0.1.0",
      },
    ],
  };
  const target = kanjiTarget();

  const mapped = resolveLearningTargetConcept(registry, target, catalog);
  assert.equal(mapped.ok, true);
  if (mapped.ok) {
    assert.equal(mapped.value.status, "MAPPED");
    if (mapped.value.status === "MAPPED") {
      assert.equal(mapped.value.referenceAid?.aidKind, "REFERENCE");
    }
  }

  const unreferencedTarget = { ...target, referenceIds: [] };
  assertHasCode(
    resolveLearningTargetConcept(registry, unreferencedTarget, catalog),
    "KANJI_REFERENCE_REQUIRED",
  );
});

test("adaptive preference and snapshot DTOs are closed and bounded", () => {
  const preferences = {
    contractType: "ADAPTIVE_PREFERENCES",
    schemaVersion: "0.1.0",
    adaptiveMode: "SUGGEST",
    supportPreference: "ASK_EACH_TIME",
    updatedAt: "2026-08-30T00:00:00.000Z",
  };
  assert.equal(validateAdaptivePreferencesStructure(preferences).ok, true);
  assert.equal(
    validateUpdateAdaptivePreferencesRequestStructure({
      contractType: "UPDATE_ADAPTIVE_PREFERENCES",
      schemaVersion: "0.1.0",
      adaptiveMode: "OFF",
      supportPreference: "LESS_SUPPORT",
    }).ok,
    true,
  );

  const snapshot = {
    contractType: "ADAPTIVE_SNAPSHOT",
    schemaVersion: "0.1.0",
    registryId: "bunbun_learning_targets",
    registryVersion: "0.1.0",
    preferences,
    summaries: [],
    suggestions: [],
    unmappedTargets: [],
    publishedLessonCandidateCount: 1,
  };
  assert.equal(validateAdaptiveLearningSnapshotStructure(snapshot).ok, true);

  const oversizedSuggestions = structuredClone(snapshot) as Record<
    string,
    unknown
  >;
  oversizedSuggestions.suggestions = Array.from({ length: 4 }, () => ({
    conceptKey: "grammar_te_kudasai",
    reason: "NEEDS_REVIEW",
    context: { availability: "NO_CHANGED_CONTEXT_AVAILABLE" },
  }));
  assertHasCode(
    validateAdaptiveLearningSnapshotStructure(oversizedSuggestions),
    "STRUCTURAL_MAX_ITEMS",
  );
});

async function validatedManifest(path: string) {
  const result = validateManifestStructure(await readJson(path));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("Expected a valid manifest fixture.");
  return result.value;
}

async function validatedCatalog(path: string): Promise<CatalogSnapshot> {
  const result = validateCatalogStructure(await readJson(path));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("Expected a valid catalog fixture.");
  return result.value;
}

function kanjiTarget(): LearningTarget {
  return {
    targetId: "target_kanji_gaku",
    kind: "KANJI",
    role: "REQUESTED",
    priority: 5,
    content: {
      kind: "KANJI",
      character: "学",
      readings: ["がく", "まなぶ"],
      supportGlosses: ["học"],
    },
    referenceIds: ["bunbun_fixture_kanji_gaku"],
    goal: {
      minimumEncounters: 1,
      minimumContexts: 1,
      desiredEvidence: ["recognized"],
    },
  };
}

function coreTeKudasaiTarget(): LearningTarget {
  return {
    targetId: "target_te_kudasai",
    kind: "GRAMMAR",
    role: "REQUESTED",
    priority: 5,
    content: {
      kind: "GRAMMAR",
      pattern: "〜てください",
      labelJa: "〜てください",
      supportExplanation: "Mẫu yêu cầu lịch sự: hãy hoặc xin hãy làm gì đó.",
    },
    referenceIds: ["bunbun_core_te_kudasai"],
    goal: {
      minimumEncounters: 3,
      minimumContexts: 3,
      desiredEvidence: ["heard", "actively_produced"],
    },
  };
}

function assertHasCode(
  result: { ok: boolean; errors: ReadonlyArray<{ code: string }> },
  code: string,
): void {
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((error) => error.code === code),
    `Expected validation error '${code}', received ${result.errors
      .map((error) => error.code)
      .join(", ")}.`,
  );
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}

function asRecords(value: unknown): Array<Record<string, unknown>> {
  assert.ok(Array.isArray(value));
  value.forEach(asRecord);
  return value as Array<Record<string, unknown>>;
}
