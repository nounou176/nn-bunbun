import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  JAPANESE_TEXT_STUDY_CATALOG_SCHEMA_VERSION,
  validateJapaneseTextStudyCatalogStructure,
} from "../src/index.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(
  packageDirectory,
  "fixtures/references/m8-last-train-study-catalog.json",
);

test("reviewed M8 Japanese text study catalog is closed and hash-addressed", async () => {
  const fixture = await readFixture();
  const result = validateJapaneseTextStudyCatalogStructure(fixture);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(
    result.value.schemaVersion,
    JAPANESE_TEXT_STUDY_CATALOG_SCHEMA_VERSION,
  );
  assert.equal(result.value.records.length, 40);
  assert.equal(
    result.value.records.every(
      (record) => record.textSha256 === sha256(record.textJa),
    ),
    true,
  );
  assert.equal(
    result.value.sources.some((source) => source.sourceId === "jmdict"),
    false,
  );
});

test("Japanese text study catalog rejects unknown runtime fields", async () => {
  const fixture = (await readFixture()) as Record<string, unknown>;
  fixture.runtimeDictionaryUrl = "https://example.invalid";

  const result = validateJapaneseTextStudyCatalogStructure(fixture);

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) => error.code === "STRUCTURAL_ADDITIONAL_PROPERTIES",
    ),
  );
});

test("Japanese text study catalog rejects malformed content hashes", async () => {
  const fixture = (await readFixture()) as {
    records: Array<Record<string, unknown>>;
  };
  fixture.records[0]!.textSha256 = "not-a-sha256";

  const result = validateJapaneseTextStudyCatalogStructure(fixture);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "STRUCTURAL_PATTERN"));
});

async function readFixture(): Promise<unknown> {
  return JSON.parse(await readFile(fixturePath, "utf8")) as unknown;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
