import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  type CatalogSnapshot,
  type LessonManifest,
  type UpdateAdaptivePreferencesRequest,
} from "@bunbun/contracts";
import lastTrainCatalogFixture from "@bunbun/contracts/fixtures/m8-last-train-catalog" with { type: "json" };
import lastTrainManifestFixture from "@bunbun/contracts/fixtures/m8-last-train" with { type: "json" };

import {
  AdaptiveRepository,
  type AdaptivePublishedLessonSource,
} from "../src/adaptation/repository.js";
import { CompilationRepository } from "../src/compiler/repository.js";
import { createBunbunServer } from "../src/http.js";
import { openDatabase } from "../src/persistence/database.js";
import { PersistenceError } from "../src/persistence/errors.js";
import {
  DATABASE_SCHEMA_VERSION,
  migrateDatabase,
} from "../src/persistence/migrations.js";
import { EvidenceRepository } from "../src/persistence/repository.js";

const manifest = lastTrainManifestFixture as LessonManifest;
const catalog = lastTrainCatalogFixture as CatalogSnapshot;
const noPublishedLessons: AdaptivePublishedLessonSource = {
  listAdaptivePublishedLessons: () => [],
};

test("migration 5 creates deterministic defaults and adaptive writes are idempotent", () => {
  const timestamps = ["2026-08-30T07:00:01.000Z", "2026-08-30T07:00:02.000Z"];
  let nowIndex = 0;
  const database = openDatabase(":memory:");
  try {
    assert.equal(DATABASE_SCHEMA_VERSION, 5);
    const repository = new AdaptiveRepository(
      database,
      noPublishedLessons,
      () => timestamps[nowIndex++]!,
    );
    assert.deepEqual(repository.getPreferences(), {
      contractType: "ADAPTIVE_PREFERENCES",
      schemaVersion: "0.1.0",
      adaptiveMode: "SUGGEST",
      supportPreference: "ASK_EACH_TIME",
      updatedAt: "1970-01-01T00:00:00.000Z",
    });

    const off = updateRequest("OFF", "LESS_SUPPORT");
    const first = repository.updatePreferences(off);
    const retry = repository.updatePreferences(off);
    assert.deepEqual(retry, first);
    assert.equal(first.updatedAt, timestamps[0]);
    assert.equal(nowIndex, 1);

    const changed = repository.updatePreferences(
      updateRequest("SUGGEST", "MORE_SUPPORT"),
    );
    assert.equal(changed.updatedAt, timestamps[1]);
    assert.equal(nowIndex, 2);
    assert.throws(
      () =>
        repository.updatePreferences({
          ...off,
          adaptiveMode: "UNKNOWN",
        } as unknown as UpdateAdaptivePreferencesRequest),
      (error: unknown) =>
        isRecord(error) && error.code === "INVALID_ADAPTIVE_PREFERENCES",
    );
  } finally {
    database.close();
  }
});

test("a migration-3 database upgrades without rewriting evidence and checksum drift fails closed", async () => {
  const directory = await mkdtemp(
    resolve(tmpdir(), "bunbun-adaptive-upgrade-"),
  );
  const databasePath = resolve(directory, "bunbun.sqlite");
  const occurredAt = "2026-08-30T07:10:00.000Z";
  try {
    const legacy = new DatabaseSync(databasePath);
    legacy.exec("PRAGMA foreign_keys = ON");
    migrateDatabase(legacy, occurredAt, 3);
    seedWeakGrammarEvidence(legacy);
    assert.equal(
      scalar(legacy, "SELECT COUNT(*) AS count FROM schema_migrations"),
      3,
    );
    legacy.close();

    const upgraded = openDatabase(databasePath, () => occurredAt);
    assert.equal(
      scalar(upgraded, "SELECT COUNT(*) AS count FROM schema_migrations"),
      5,
    );
    assert.equal(
      scalar(upgraded, "SELECT COUNT(*) AS count FROM session_events"),
      1,
    );
    const snapshot = new AdaptiveRepository(
      upgraded,
      noPublishedLessons,
    ).snapshot();
    assert.equal(snapshot.summaries[0]?.conceptKey, "grammar_te_kudasai");
    assert.equal(snapshot.summaries[0]?.signal, "NEEDS_REVIEW");
    assert.equal(
      snapshot.suggestions[0]?.context.availability,
      "NO_PUBLISHED_LESSON_AVAILABLE",
    );
    upgraded
      .prepare("UPDATE schema_migrations SET checksum = ? WHERE id = 5")
      .run("tampered");
    upgraded.close();

    assert.throws(
      () => openDatabase(databasePath, () => occurredAt),
      (error: unknown) =>
        error instanceof PersistenceError &&
        error.code === "PERSISTENCE_DATABASE_INCOMPATIBLE",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("confirmed reset deletes adaptive preferences without changing the migration ledger", () => {
  const database = openDatabase(":memory:");
  try {
    const adaptation = new AdaptiveRepository(database, noPublishedLessons);
    adaptation.updatePreferences(updateRequest("OFF", "LESS_SUPPORT"));
    assert.equal(
      scalar(database, "SELECT COUNT(*) AS count FROM adaptive_preferences"),
      1,
    );
    new EvidenceRepository(database).resetLocalData();
    assert.equal(
      scalar(database, "SELECT COUNT(*) AS count FROM adaptive_preferences"),
      0,
    );
    assert.equal(
      scalar(database, "SELECT COUNT(*) AS count FROM schema_migrations"),
      5,
    );
  } finally {
    database.close();
  }
});

test("same-origin adaptation API validates preferences and isolates snapshot failure", async () => {
  const database = openDatabase(":memory:", () => "2026-08-30T07:20:00.000Z");
  seedWeakGrammarEvidence(database);
  const evidence = new EvidenceRepository(database);
  const compilations = new CompilationRepository(database);
  const adaptation = new AdaptiveRepository(
    database,
    noPublishedLessons,
    () => "2026-08-30T07:20:01.000Z",
  );
  const server = createBunbunServer(
    evidence,
    compilations,
    undefined,
    adaptation,
  );
  await new Promise<void>((resolveListen) =>
    server.listen(0, "127.0.0.1", resolveListen),
  );
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const snapshot = await jsonRequest(`${origin}/api/v1/adaptation`, "GET");
    assert.equal(snapshot.response.status, 200);
    assert.equal(asRecord(snapshot.body).contractType, "ADAPTIVE_SNAPSHOT");

    const defaults = await jsonRequest(
      `${origin}/api/v1/adaptation/preferences`,
      "GET",
    );
    assert.equal(defaults.response.status, 200);
    assert.equal(asRecord(defaults.body).adaptiveMode, "SUGGEST");

    const updated = await jsonRequest(
      `${origin}/api/v1/adaptation/preferences`,
      "PUT",
      updateRequest("OFF", "LESS_SUPPORT"),
    );
    assert.equal(updated.response.status, 200);
    assert.equal(asRecord(updated.body).adaptiveMode, "OFF");
    const hidden = await jsonRequest(`${origin}/api/v1/adaptation`, "GET");
    assert.deepEqual(asRecord(hidden.body).suggestions, []);

    const invalid = await jsonRequest(
      `${origin}/api/v1/adaptation/preferences`,
      "PUT",
      { ...updateRequest("SUGGEST", "ASK_EACH_TIME"), unexpected: true },
    );
    assert.equal(invalid.response.status, 400);
    assert.equal(asRecord(invalid.body).contractType, "ADAPTIVE_API_ERROR");
    assert.equal(asRecord(invalid.body).code, "INVALID_ADAPTIVE_PREFERENCES");
  } finally {
    await new Promise<void>((resolveClose, reject) =>
      server.close((error) =>
        error === undefined ? resolveClose() : reject(error),
      ),
    );
    database.close();
  }
});

test("adaptation failure returns a closed error while the ordinary library remains available", async () => {
  const database = openDatabase(":memory:");
  const compilations = new CompilationRepository(database);
  const brokenSource: AdaptivePublishedLessonSource = {
    listAdaptivePublishedLessons: () => {
      throw new Error("simulated adaptive publication failure");
    },
  };
  const server = createBunbunServer(
    new EvidenceRepository(database),
    compilations,
    undefined,
    new AdaptiveRepository(database, brokenSource),
  );
  await new Promise<void>((resolveListen) =>
    server.listen(0, "127.0.0.1", resolveListen),
  );
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const adaptation = await jsonRequest(`${origin}/api/v1/adaptation`, "GET");
    assert.equal(adaptation.response.status, 500);
    assert.equal(asRecord(adaptation.body).contractType, "ADAPTIVE_API_ERROR");
    assert.equal(asRecord(adaptation.body).code, "ADAPTATION_UNAVAILABLE");

    const lessons = await jsonRequest(`${origin}/api/v1/lessons`, "GET");
    assert.equal(lessons.response.status, 200);
    assert.deepEqual(asRecord(lessons.body).lessons, []);
  } finally {
    await new Promise<void>((resolveClose, reject) =>
      server.close((error) =>
        error === undefined ? resolveClose() : reject(error),
      ),
    );
    database.close();
  }
});

function seedWeakGrammarEvidence(database: DatabaseSync): void {
  database
    .prepare(
      `INSERT OR IGNORE INTO lesson_revisions (
         lesson_id, revision, manifest_schema_version, catalog_schema_version,
         package_fingerprint, manifest_json, catalog_json, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      manifest.lessonId,
      manifest.revision,
      manifest.schemaVersion,
      catalog.schemaVersion,
      `sha256_${"1".repeat(64)}`,
      JSON.stringify(manifest),
      JSON.stringify(catalog),
      "2026-08-30T07:00:00.000Z",
    );
  database
    .prepare(
      `INSERT OR IGNORE INTO play_sessions (
         session_id, profile_id, lesson_id, revision, status,
         checkpoint_sequence, active_time_ms, started_at, updated_at
       ) VALUES (?, 'local_default', ?, ?, 'COMPLETED', 1, 1000, ?, ?)`,
    )
    .run(
      "session_adaptive_weak",
      manifest.lessonId,
      manifest.revision,
      "2026-08-30T07:00:00.000Z",
      "2026-08-30T07:00:01.000Z",
    );
  database
    .prepare(
      `INSERT OR IGNORE INTO session_events (
         event_id, payload_fingerprint, session_id, lesson_id, revision,
         kind, step_id, context_id, primitive, target_id, evidence,
         response_ids_json, correct, assisted, attempt, active_latency_ms,
         occurred_at, received_at
       ) VALUES (?, ?, ?, ?, ?, 'REACTION', ?, ?, 'ARRANGE', ?,
                 'arranged_correctly', NULL, 0, 0, 0, 1000, ?, ?)`,
    )
    .run(
      "event_adaptive_weak",
      "fixture_fingerprint",
      "session_adaptive_weak",
      manifest.lessonId,
      manifest.revision,
      "arrange_wallet_request",
      "last_train_wallet_request",
      "target_te_kudasai",
      "2026-08-30T07:00:01.000Z",
      "2026-08-30T07:00:01.000Z",
    );
}

function updateRequest(
  adaptiveMode: "SUGGEST" | "OFF",
  supportPreference: "ASK_EACH_TIME" | "MORE_SUPPORT" | "LESS_SUPPORT",
): UpdateAdaptivePreferencesRequest {
  return {
    contractType: "UPDATE_ADAPTIVE_PREFERENCES",
    schemaVersion: "0.1.0",
    adaptiveMode,
    supportPreference,
  };
}

async function jsonRequest(
  url: string,
  method: string,
  body?: unknown,
): Promise<{ response: Response; body: unknown }> {
  const response = await fetch(
    url,
    body === undefined
      ? { method }
      : {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  return { response, body: (await response.json()) as unknown };
}

function scalar(database: DatabaseSync, sql: string): number {
  const row = database.prepare(sql).get() as { count: number };
  return Number(row.count);
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.ok(isRecord(value));
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
