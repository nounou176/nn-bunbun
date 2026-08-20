import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CatalogSnapshotSchema,
  EvidencePersistenceSchema,
  LessonAuthoringRequestSchema,
  LessonAuthoringResultSchema,
  LessonManifestSchema,
} from "../src/schema/index.js";
import {
  validAuthoringRequest,
  validAuthoringResult,
} from "./authoring-fixtures.js";
import {
  AUTHORING_EVALUATION_SUITE_VERSION,
  authoringEvaluationCases,
} from "./authoring-evaluation-suite.js";

type JsonObject = Record<string, unknown>;

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

const validManifestPath = resolve(
  packageDirectory,
  "fixtures/manifests/valid-find-dog.json",
);
const validManifest = JSON.parse(
  await readFile(validManifestPath, "utf8"),
) as JsonObject;

const artifacts = new Map<string, string>([
  [
    resolve(packageDirectory, "schemas/lesson-manifest-0.1.0.schema.json"),
    serialize(LessonManifestSchema),
  ],
  [
    resolve(packageDirectory, "schemas/catalog-snapshot-0.1.0.schema.json"),
    serialize(CatalogSnapshotSchema),
  ],
  [
    resolve(packageDirectory, "schemas/evidence-persistence-0.1.0.schema.json"),
    serialize(EvidencePersistenceSchema),
  ],
  [
    resolve(
      packageDirectory,
      "schemas/lesson-authoring-request-0.1.0.schema.json",
    ),
    serialize(LessonAuthoringRequestSchema),
  ],
  [
    resolve(
      packageDirectory,
      "schemas/lesson-authoring-result-0.1.0.schema.json",
    ),
    serialize(LessonAuthoringResultSchema),
  ],
  [
    resolve(
      packageDirectory,
      "../../plugins/bunbun-authoring/skills/bunbun-lesson-authoring/references/lesson-authoring-request-0.1.0.schema.json",
    ),
    serialize(LessonAuthoringRequestSchema),
  ],
  [
    resolve(
      packageDirectory,
      "../../plugins/bunbun-authoring/skills/bunbun-lesson-authoring/references/lesson-authoring-result-0.1.0.schema.json",
    ),
    serialize(LessonAuthoringResultSchema),
  ],
]);

const authoringFixtureDirectory = resolve(
  packageDirectory,
  "fixtures/authoring",
);
artifacts.set(
  resolve(authoringFixtureDirectory, "valid-request.json"),
  serialize(validAuthoringRequest),
);
artifacts.set(
  resolve(authoringFixtureDirectory, "valid-result.json"),
  serialize(validAuthoringResult),
);

const authoringEvaluationDirectory = resolve(
  authoringFixtureDirectory,
  "evals",
);
for (const evaluationCase of authoringEvaluationCases) {
  if (evaluationCase.execution === "RUNNABLE") {
    artifacts.set(
      resolve(
        authoringEvaluationDirectory,
        `${evaluationCase.fixtureId}.request.json`,
      ),
      serialize(evaluationCase.request),
    );
  }
}
artifacts.set(
  resolve(authoringEvaluationDirectory, "coverage.json"),
  serialize({
    suiteVersion: AUTHORING_EVALUATION_SUITE_VERSION,
    packetVersion: validAuthoringRequest.packetVersion,
    promptPack: validAuthoringRequest.promptPack,
    cases: authoringEvaluationCases.map((evaluationCase) =>
      evaluationCase.execution === "RUNNABLE"
        ? {
            fixtureId: evaluationCase.fixtureId,
            moduleId: evaluationCase.moduleId,
            category: evaluationCase.category,
            execution: evaluationCase.execution,
            requestPath: `${evaluationCase.fixtureId}.request.json`,
          }
        : {
            fixtureId: evaluationCase.fixtureId,
            moduleId: evaluationCase.moduleId,
            category: evaluationCase.category,
            execution: evaluationCase.execution,
            gapCode: evaluationCase.gapCode,
            reason: evaluationCase.reason,
          },
    ),
  }),
);

const unknownResultField = clone(validAuthoringResult) as JsonObject;
unknownResultField.learnerIdentity = "must_not_leave_local_boundary";
artifacts.set(
  resolve(authoringFixtureDirectory, "invalid-result-unknown-field.json"),
  serialize(unknownResultField),
);

const wrongIdentityResult = clone(validAuthoringResult);
wrongIdentityResult.requestId = "m7_v3_2_lesson_authoring_wrong";
artifacts.set(
  resolve(authoringFixtureDirectory, "invalid-result-wrong-identity.json"),
  serialize(wrongIdentityResult),
);

const wrongHashRequest = clone(validAuthoringRequest);
wrongHashRequest.inputSha256 = "0".repeat(64);
artifacts.set(
  resolve(authoringFixtureDirectory, "invalid-request-wrong-hash.json"),
  serialize(wrongHashRequest),
);

const promptDriftRequest = clone(validAuthoringRequest) as JsonObject;
const promptPack = arrayAt(promptDriftRequest, "promptPack");
objectAt(promptPack[0]).promptSha256 = "f".repeat(64);
artifacts.set(
  resolve(authoringFixtureDirectory, "invalid-request-prompt-drift.json"),
  serialize(promptDriftRequest),
);

const prohibitedDataRequest = clone(validAuthoringRequest) as JsonObject;
objectAt(prohibitedDataRequest, "input").learnerIdentity = "forbidden";
artifacts.set(
  resolve(authoringFixtureDirectory, "invalid-request-prohibited-data.json"),
  serialize(prohibitedDataRequest),
);

const oversizedResult = clone(validAuthoringResult);
if (oversizedResult.contributions.story.status === "OK") {
  oversizedResult.contributions.story.value.title.ja = "長".repeat(29);
}
artifacts.set(
  resolve(authoringFixtureDirectory, "invalid-result-oversized.json"),
  serialize(oversizedResult),
);

artifacts.set(
  resolve(authoringFixtureDirectory, "invalid-result-malformed.txt"),
  "{not valid JSON\n",
);

const unknownField = clone(validManifest);
unknownField.unexpectedField = true;
addInvalidManifest("invalid-unknown-field.json", unknownField);

const badReference = clone(validManifest);
const badReferenceInteraction = objectAt(
  arrayAt(badReference, "steps")[0],
  "interaction",
);
badReferenceInteraction.candidateObjectIds = ["bird", "cat"];
badReferenceInteraction.acceptedObjectIds = ["bird"];
addInvalidManifest("invalid-bad-reference.json", badReference);

const unreachableStep = clone(validManifest);
const steps = arrayAt(unreachableStep, "steps");
const orphan = clone(objectAt(steps[0]));
orphan.stepId = "orphan_step";
orphan.contextId = "orphan_context";
steps.push(orphan);
addInvalidManifest("invalid-unreachable-step.json", unreachableStep);

const coverageGap = clone(validManifest);
const firstTarget = objectAt(arrayAt(coverageGap, "learningTargets")[0]);
objectAt(firstTarget, "goal").minimumEncounters = 2;
addInvalidManifest("invalid-coverage-gap.json", coverageGap);

const unboundedFallback = clone(validManifest);
const loopingStep = objectAt(arrayAt(unboundedFallback, "steps")[0]);
const transitions = objectAt(loopingStep, "transitions");
transitions.onFailure = { kind: "STEP", stepId: "find_dog" };
transitions.onAssisted = { kind: "STEP", stepId: "find_dog" };
arrayAt(loopingStep, "scaffolds").push({
  scaffoldId: "fallback_to_self",
  afterAttempt: 2,
  kind: "RECOGNITION_FALLBACK",
  fallbackStepId: "find_dog",
});
addInvalidManifest("invalid-unbounded-fallback.json", unboundedFallback);

const incompatibleEvidence = clone(validManifest);
const firstStep = objectAt(arrayAt(incompatibleEvidence, "steps")[0]);
const assessment = objectAt(arrayAt(firstStep, "targetBindings")[1]);
assessment.successEvidence = "actively_produced";
addInvalidManifest("invalid-incompatible-evidence.json", incompatibleEvidence);

let differences = 0;

for (const [path, expected] of artifacts) {
  if (checkOnly) {
    const actual = await readFile(path, "utf8").catch(() => undefined);
    if (actual !== expected) {
      console.error(`Artifact is missing or stale: ${path}`);
      differences += 1;
    }
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, expected, "utf8");
    console.log(`Wrote ${path}`);
  }
}

if (differences > 0) {
  process.exitCode = 1;
} else if (checkOnly) {
  console.log(`Artifact check passed (${artifacts.size} files).`);
}

function addInvalidManifest(fileName: string, manifest: JsonObject): void {
  artifacts.set(
    resolve(packageDirectory, "fixtures/manifests/invalid", fileName),
    serialize(manifest),
  );
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function clone<Value>(value: Value): Value {
  return structuredClone(value);
}

function objectAt(value: unknown, key?: string): JsonObject {
  const target = key === undefined ? value : asObject(value)[key];
  return asObject(target);
}

function arrayAt(value: unknown, key: string): unknown[] {
  const target = asObject(value)[key];
  if (!Array.isArray(target)) {
    throw new Error(
      `Expected '${key}' to be an array while generating fixtures.`,
    );
  }
  return target;
}

function asObject(value: unknown): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected an object while generating contract artifacts.");
  }
  return value as JsonObject;
}
