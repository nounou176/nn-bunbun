import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

import type { LessonManifest } from "@bunbun/contracts";
import lastTrainManifestFixture from "@bunbun/contracts/fixtures/m8-last-train" with { type: "json" };

import { CompilerError } from "../src/compiler/core.js";
import {
  M8_LAST_TRAIN_APPROVED_SPEECH,
  M8_LAST_TRAIN_PROFILE_ID,
  PARK_AUTHORING_PROFILE_ID,
  approvedLastTrainPackage,
  createCompilerRouteDraft,
} from "../src/compiler/profiles.js";
import { CompilationRepository } from "../src/compiler/repository.js";
import { createBunbunServer } from "../src/http.js";
import {
  canonicalJson,
  fingerprint,
} from "../src/persistence/canonical-json.js";
import { openDatabase } from "../src/persistence/database.js";
import { EvidenceRepository } from "../src/persistence/repository.js";

const now = () => "2026-08-29T08:30:00.000Z";
const lastTrainManifest = lastTrainManifestFixture as LessonManifest;

test("approved profile aliases and permutations share one canonical compilation identity", () => {
  const aliases = [
    ["財布", "さいふ"],
    ["探す", "さがす"],
    ["～てください", "〜てください", "てください"],
  ];
  const identities = new Set<string>();
  for (const wallet of aliases[0]!) {
    for (const search of aliases[1]!) {
      for (const grammar of aliases[2]!) {
        for (const targets of permutations([wallet, search, grammar])) {
          const draft = createCompilerRouteDraft(targets);
          assert.equal(draft.mode, "APPROVED_PROFILE_SELECTION");
          assert.equal(draft.profileId, M8_LAST_TRAIN_PROFILE_ID);
          assert.deepEqual(draft.normalizedTargetKeys, [
            "wallet",
            "search",
            "te_kudasai",
          ]);
          identities.add(`${draft.compilationId}:${draft.cacheKey}`);
        }
      }
    }
  }
  assert.equal(identities.size, 1);
});

test("approved profile rejects partial, duplicate, unknown, and mixed input", () => {
  for (const targets of [
    ["財布", "探す"],
    ["財布", "財布", "～てください"],
    ["財布", "unknown", "～てください"],
    ["財布", "犬", "～てください"],
  ]) {
    assert.throws(
      () => createCompilerRouteDraft(targets),
      (error: unknown) =>
        error instanceof CompilerError &&
        (error.code === "APPROVED_PROFILE_TARGET_SET_INVALID" ||
          error.code === "DUPLICATE_TARGET"),
    );
  }
});

test("approved package locks truthful provenance, target roles, and exact identities", () => {
  const lessonPackage = approvedLastTrainPackage();
  assert.equal(lessonPackage.manifest.lessonId, "lesson_m8_last_train");
  assert.equal(lessonPackage.manifest.revision, 1);
  assert.equal(lessonPackage.manifest.provenance.source, "AUTHORED");
  assert.deepEqual(lessonPackage.manifest.provenance.promptModuleVersions, []);
  assert.deepEqual(
    lessonPackage.manifest.learningTargets
      .filter((target) => target.role === "REQUESTED")
      .map((target) => target.targetId),
    ["target_wallet", "target_search", "target_te_kudasai"],
  );
  assert.deepEqual(
    lessonPackage.manifest.audioAssets.map((asset) => asset.cacheKey),
    M8_LAST_TRAIN_APPROVED_SPEECH.map((identity) => identity.cacheKey),
  );
});

test("compiler repository selects, reviews, publishes, lists, and reloads exact Last Train", () => {
  const database = openDatabase(":memory:", now);
  try {
    seedApprovedSpeech(database);
    const repository = new CompilationRepository(database, now);
    const created = repository.create(["さがす", "てください", "さいふ"]);
    assert.equal(created.mode, "APPROVED_PROFILE_SELECTION");
    assert.equal(created.profileId, M8_LAST_TRAIN_PROFILE_ID);
    assert.equal(created.status, "READY_FOR_REVIEW");
    assert.equal(created.request, undefined);
    assert.equal(created.selection?.lessonId, "lesson_m8_last_train");
    assert.deepEqual(created.review?.requestedTargetLabels, [
      "財布",
      "探す",
      "～てください",
    ]);
    assert.deepEqual(created.review?.supportingTargetLabels, [
      "傘",
      "駅",
      "～てはいけない",
    ]);

    const attemptCount = database
      .prepare(
        "SELECT COUNT(*) AS count FROM compilation_attempts WHERE compilation_id = ?",
      )
      .get(created.compilationId) as { count: number };
    assert.equal(attemptCount.count, 0);
    assert.throws(
      () => repository.request(created.compilationId),
      isCompilerError("COMPILATION_AUTHORING_NOT_APPLICABLE"),
    );
    assert.throws(
      () => repository.importResult(created.compilationId, "{}"),
      isCompilerError("COMPILATION_AUTHORING_NOT_APPLICABLE"),
    );
    assert.equal(
      repository.create(["財布", "探す", "～てください"]).compilationId,
      created.compilationId,
    );

    const approved = approvedLastTrainPackage();
    database
      .prepare(
        `INSERT INTO lesson_revisions (
           lesson_id, revision, manifest_schema_version, catalog_schema_version,
           package_fingerprint, manifest_json, catalog_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        approved.manifest.lessonId,
        approved.manifest.revision,
        approved.manifest.schemaVersion,
        approved.catalog.schemaVersion,
        fingerprint(approved),
        canonicalJson(approved.manifest),
        canonicalJson(approved.catalog),
        now(),
      );
    assert.deepEqual(repository.listLessons(), []);
    const published = repository.publish(created.compilationId);
    assert.equal(published.status, "PUBLISHED");
    assert.deepEqual(published.lesson, {
      lessonId: "lesson_m8_last_train",
      revision: 1,
    });
    assert.equal(repository.publish(created.compilationId).status, "PUBLISHED");
    assert.equal(
      (
        database
          .prepare("SELECT COUNT(*) AS count FROM lesson_revisions")
          .get() as { count: number }
      ).count,
      1,
    );
    assert.deepEqual(
      repository.listLessons().map((lesson) => lesson.lessonId),
      ["lesson_m8_last_train"],
    );
    assert.equal(
      repository.loadLesson("lesson_m8_last_train", 1).manifest.scene.sceneId,
      "neighborhood_small",
    );
  } finally {
    database.close();
  }
});

test("approved profile fails closed until every exact speech row is READY", () => {
  const database = openDatabase(":memory:", now);
  try {
    const repository = new CompilationRepository(database, now);
    assert.throws(
      () => repository.create(["財布", "探す", "～てください"]),
      isCompilerError("APPROVED_PROFILE_SPEECH_NOT_READY"),
    );
    seedApprovedSpeech(database, { wrongFirstHash: true });
    assert.throws(
      () => repository.create(["財布", "探す", "～てください"]),
      isCompilerError("APPROVED_PROFILE_SPEECH_NOT_READY"),
    );
  } finally {
    database.close();
  }
});

test("migration defaults preserve the existing park authoring route", () => {
  const database = openDatabase(":memory:", now);
  try {
    const repository = new CompilationRepository(database, now);
    const park = repository.create(["犬", "～てください"]);
    assert.equal(park.mode, "AUTHORING_HANDOFF");
    assert.equal(park.profileId, PARK_AUTHORING_PROFILE_ID);
    assert.equal(park.status, "AWAITING_AUTHORING");
    assert.ok(park.request);

    database
      .prepare(
        `INSERT INTO compilation_requests (
           compilation_id, cache_key, status, current_attempt,
           normalized_target_keys_json, authoring_request_json,
           diagnostics_json, created_at, updated_at
         ) VALUES (?, ?, 'AWAITING_AUTHORING', 1, '[]', '{}', '[]', ?, ?)`,
      )
      .run("compilation_legacy", "legacy_cache", now(), now());
    const legacy = database
      .prepare(
        "SELECT mode, profile_id FROM compilation_requests WHERE compilation_id = ?",
      )
      .get("compilation_legacy") as { mode: string; profile_id: string };
    assert.equal(legacy.mode, "AUTHORING_HANDOFF");
    assert.equal(legacy.profile_id, PARK_AUTHORING_PROFILE_ID);
  } finally {
    database.close();
  }
});

test("publication rejects an immutable revision with a different fingerprint", () => {
  const database = openDatabase(":memory:", now);
  try {
    seedApprovedSpeech(database);
    const repository = new CompilationRepository(database, now);
    const created = repository.create(["財布", "探す", "～てください"]);
    const approved = approvedLastTrainPackage();
    database
      .prepare(
        `INSERT INTO lesson_revisions (
           lesson_id, revision, manifest_schema_version, catalog_schema_version,
           package_fingerprint, manifest_json, catalog_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        approved.manifest.lessonId,
        approved.manifest.revision,
        approved.manifest.schemaVersion,
        approved.catalog.schemaVersion,
        "sha256_different",
        JSON.stringify(approved.manifest),
        JSON.stringify(approved.catalog),
        now(),
      );
    assert.throws(
      () => repository.publish(created.compilationId),
      isCompilerError("PUBLICATION_REVISION_CONFLICT"),
    );
  } finally {
    database.close();
  }
});

test("HTTP selection forbids handoff endpoints and publishes through the library", async () => {
  const database = openDatabase(":memory:", now);
  seedApprovedSpeech(database);
  const compilations = new CompilationRepository(database, now);
  const server = createBunbunServer(
    new EvidenceRepository(database, now),
    compilations,
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    const created = await jsonRequest(`${origin}/api/v1/compilations`, "POST", {
      targets: ["財布", "探す", "～てください"],
    });
    assert.equal(created.response.status, 201);
    const compilationId = asRecord(created.body).compilationId as string;

    const exported = await fetch(
      `${origin}/api/v1/compilations/${compilationId}/request`,
    );
    assert.equal(exported.status, 409);
    assert.equal(
      asRecord(await exported.json()).code,
      "COMPILATION_AUTHORING_NOT_APPLICABLE",
    );
    const imported = await jsonRequest(
      `${origin}/api/v1/compilations/${compilationId}/imports`,
      "POST",
      { fileName: "result.json", rawText: "{}" },
    );
    assert.equal(imported.response.status, 409);

    const published = await jsonRequest(
      `${origin}/api/v1/compilations/${compilationId}/publish`,
      "POST",
      { confirmation: "PUBLISH_REVIEWED_LESSON" },
    );
    assert.equal(published.response.status, 200);
    assert.equal(asRecord(published.body).status, "PUBLISHED");
    const lessons = await fetch(`${origin}/api/v1/lessons`);
    const list = asRecord(await lessons.json()).lessons as unknown[];
    assert.equal(list.length, 1);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) =>
        error === undefined ? resolve() : reject(error),
      ),
    );
    database.close();
  }
});

function seedApprovedSpeech(
  database: ReturnType<typeof openDatabase>,
  options: { wrongFirstHash?: boolean } = {},
): void {
  for (const [index, identity] of M8_LAST_TRAIN_APPROVED_SPEECH.entries()) {
    const audio = lastTrainManifest.audioAssets.find(
      (candidate) => candidate.cacheKey === identity.cacheKey,
    );
    assert.ok(audio);
    database
      .prepare(
        `INSERT INTO audio_speech_assets (
           cache_key, voice_profile_id, text_ja, canonical_input_json,
           status, attempt_count, wav_sha256, created_at, updated_at,
           generated_at, reviewed_at
         ) VALUES (?, ?, ?, '{}', 'READY', 1, ?, ?, ?, ?, ?)`,
      )
      .run(
        identity.cacheKey,
        audio.voiceProfileId,
        audio.textJa,
        options.wrongFirstHash === true && index === 0
          ? "0".repeat(64)
          : identity.wavSha256,
        now(),
        now(),
        now(),
        now(),
      );
  }
}

function permutations(values: string[]): string[][] {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) =>
    permutations(values.filter((_, childIndex) => childIndex !== index)).map(
      (rest) => [value, ...rest],
    ),
  );
}

function isCompilerError(code: string): (error: unknown) => boolean {
  return (error) => error instanceof CompilerError && error.code === code;
}

async function jsonRequest(
  url: string,
  method: string,
  body: unknown,
): Promise<{ response: Response; body: unknown }> {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, body: (await response.json()) as unknown };
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}
