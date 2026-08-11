import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  LessonManifestSchema,
  validateCatalogStructure,
  validateLessonPackage,
  validateManifestStructure,
} from "../src/index.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = resolve(
  packageDirectory,
  "fixtures/catalogs/basic-catalog.json",
);
const validManifestPath = resolve(
  packageDirectory,
  "fixtures/manifests/valid-find-dog.json",
);
const validLoopManifestPath = resolve(
  packageDirectory,
  "fixtures/manifests/valid-find-dog-loop.json",
);

const invalidCases = [
  ["invalid-unknown-field.json", "STRUCTURAL_ADDITIONAL_PROPERTIES"],
  ["invalid-bad-reference.json", "UNKNOWN_OBJECT_REFERENCE"],
  ["invalid-unreachable-step.json", "UNREACHABLE_STEP"],
  ["invalid-coverage-gap.json", "TARGET_COVERAGE_GAP"],
  ["invalid-unbounded-fallback.json", "UNBOUNDED_STEP_CYCLE"],
  ["invalid-incompatible-evidence.json", "INCOMPATIBLE_EVIDENCE"],
] as const;

test("valid authored lesson passes structural and semantic validation", async () => {
  const [manifest, catalog] = await Promise.all([
    readJson(validManifestPath),
    readJson(catalogPath),
  ]);

  const result = validateLessonPackage(manifest, catalog);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.manifest.schemaVersion, "0.1.0");
    assert.equal(result.value.manifest.lessonId, "lesson_find_dog");
    assert.equal(result.value.catalog.catalogId, "bunbun_fixture_catalog");
  }
});

test("valid three-step learning loop passes contract validation", async () => {
  const [manifest, catalog] = await Promise.all([
    readJson(validLoopManifestPath),
    readJson(catalogPath),
  ]);

  const result = validateLessonPackage(manifest, catalog);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.manifest.lessonId, "lesson_find_dog_loop");
    assert.deepEqual(
      result.value.manifest.steps.map((step) => step.interaction.type),
      ["LISTEN", "CLICK_OBJECT", "CHOOSE"],
    );
  }
});

for (const [fileName, expectedCode] of invalidCases) {
  test(`${fileName} fails with ${expectedCode}`, async () => {
    const [manifest, catalog] = await Promise.all([
      readJson(
        resolve(packageDirectory, "fixtures/manifests/invalid", fileName),
      ),
      readJson(catalogPath),
    ]);

    const result = validateLessonPackage(manifest, catalog);

    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === expectedCode));
  });
}

test("unknown nested fields are rejected without mutating input", async () => {
  const manifest = asObject(await readJson(validManifestPath));
  const firstStep = asObject(asArray(manifest.steps)[0]);
  const interaction = asObject(firstStep.interaction);
  interaction.runtimeCode = "doSomething()";
  const before = JSON.stringify(manifest);

  const result = validateManifestStructure(manifest);

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) =>
        error.code === "STRUCTURAL_ADDITIONAL_PROPERTIES" &&
        error.path.endsWith("/runtimeCode"),
    ),
  );
  assert.equal(JSON.stringify(manifest), before);
});

test("null is rejected for an optional field", async () => {
  const manifest = asObject(await readJson(validManifestPath));
  const firstEntity = asObject(asArray(manifest.entities)[0]);
  firstEntity.displayNameJa = null;

  const result = validateManifestStructure(manifest);

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((error) => error.path === "/entities/0/displayNameJa"),
  );
});

test("compilerVersion must be a semantic version", async () => {
  const manifest = asObject(await readJson(validManifestPath));
  const provenance = asObject(manifest.provenance);
  provenance.compilerVersion = "development";

  const result = validateManifestStructure(manifest);

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((error) => error.path === "/provenance/compilerVersion"),
  );
});

test("REPLAY_AUDIO scaffold requires replay permission", async () => {
  const [manifest, catalog] = await Promise.all([
    readJson(validManifestPath).then(asObject),
    readJson(catalogPath),
  ]);
  const firstStep = asObject(asArray(manifest.steps)[0]);
  const stimulus = asObject(firstStep.stimulus);
  const utterance = asObject(stimulus.utterance);
  utterance.replayAllowed = false;
  asArray(firstStep.scaffolds).push({
    scaffoldId: "replay_audio",
    afterAttempt: 1,
    kind: "REPLAY_AUDIO",
  });

  const result = validateLessonPackage(manifest, catalog);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "REPLAY_NOT_ALLOWED"));
});

test("catalog structures are closed and versioned", async () => {
  const catalog = asObject(await readJson(catalogPath));
  assert.equal(validateCatalogStructure(catalog).ok, true);

  catalog.unknownCatalogSetting = true;
  const result = validateCatalogStructure(catalog);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) => error.code === "STRUCTURAL_ADDITIONAL_PROPERTIES",
    ),
  );
});

test("interaction union is serialized with oneOf", () => {
  const root = asObject(LessonManifestSchema);
  const steps = asObject(asObject(root.properties).steps);
  const step = asObject(steps.items);
  const interaction = asObject(asObject(step.properties).interaction);

  assert.ok(Array.isArray(interaction.oneOf));
  assert.equal(asArray(interaction.oneOf).length, 8);
  assert.equal("anyOf" in interaction, false);
});

test("every TypeBox object record rejects additional properties", () => {
  const openRecords: string[] = [];
  walkSchema(LessonManifestSchema, "", (schema, path) => {
    const kind = Object.getOwnPropertyDescriptor(schema, "~kind")?.value;
    if (kind === "Object" && schema.additionalProperties !== false) {
      openRecords.push(path || "/");
    }
  });

  assert.deepEqual(openRecords, []);
});

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

function asObject(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  assert.ok(Array.isArray(value));
  return value;
}

function walkSchema(
  value: unknown,
  path: string,
  visit: (schema: Record<string, unknown>, path: string) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkSchema(item, `${path}/${index}`, visit));
    return;
  }
  if (typeof value !== "object" || value === null) {
    return;
  }

  const schema = value as Record<string, unknown>;
  visit(schema, path);
  Object.entries(schema).forEach(([key, item]) =>
    walkSchema(item, `${path}/${key}`, visit),
  );
}
