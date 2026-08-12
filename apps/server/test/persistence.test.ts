import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
  type CatalogSnapshot,
  type LessonManifest,
  type SessionCommitRequest,
  type SessionCreateRequest,
} from "@bunbun/contracts";

import { createBunbunServer } from "../src/http.js";
import { fingerprint } from "../src/persistence/canonical-json.js";
import { openDatabase } from "../src/persistence/database.js";
import { PersistenceError } from "../src/persistence/errors.js";
import { EvidenceRepository } from "../src/persistence/repository.js";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../..");
const manifestPath = resolve(
  repositoryRoot,
  "packages/contracts/fixtures/manifests/valid-find-dog-loop.json",
);
const catalogPath = resolve(
  repositoryRoot,
  "packages/contracts/fixtures/catalogs/basic-catalog.json",
);

test("SQLite repository migrates, commits idempotently, resumes, and resets", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "bunbun-persistence-"));
  const databasePath = resolve(directory, "nested", "bunbun.sqlite");
  const now = () => "2026-08-12T05:00:00.000Z";

  try {
    const database = openDatabase(databasePath, now);
    const repository = new EvidenceRepository(database, now);
    const createRequest = await sessionCreateRequest("session_repository_001");

    const created = repository.createSession(createRequest);
    assert.equal(created.checkpointSequence, 0);
    assert.equal(created.storedEventCount, 0);

    const resumable = repository.findResumableSession(
      createRequest.manifest.lessonId,
      createRequest.manifest.revision,
      createRequest.packageFingerprint,
    );
    assert.equal(resumable.session?.sessionId, "session_repository_001");
    assert.equal(resumable.session?.checkpoint.phase, "AWAITING_AUDIO");

    const commit = heardCommit(createRequest, "commit_repository_001");
    const first = repository.commitSession("session_repository_001", commit);
    const retry = repository.commitSession("session_repository_001", commit);
    assert.deepEqual(retry, first);
    assert.equal(first.storedEventCount, 1);

    assert.throws(
      () =>
        repository.commitSession("session_repository_001", {
          ...commit,
          commitId: "commit_repository_stale",
        }),
      (error: unknown) =>
        error instanceof PersistenceError &&
        error.code === "PERSISTENCE_STALE_CHECKPOINT",
    );
    assert.throws(
      () =>
        repository.createSession({
          ...createRequest,
          commitId: "create_session_repository_conflict",
          checkpoint: {
            ...createRequest.checkpoint,
            sessionId: "session_repository_conflict",
          },
        }),
      (error: unknown) =>
        error instanceof PersistenceError &&
        error.code === "PERSISTENCE_SESSION_CONFLICT",
    );
    assert.equal(repository.storageSummary().sessionCount, 1);

    const stored = database
      .prepare(
        "SELECT response_ids_json, kind, target_id FROM session_events WHERE session_id = ?",
      )
      .get("session_repository_001") as {
      response_ids_json: string | null;
      kind: string;
      target_id: string;
    };
    assert.equal(stored.response_ids_json, null);
    assert.equal(stored.kind, "HEARD");
    assert.equal(stored.target_id, "target_inu");

    assert.throws(
      () =>
        repository.commitSession("session_repository_001", {
          ...commit,
          events: [],
        }),
      (error: unknown) =>
        error instanceof PersistenceError &&
        error.code === "PERSISTENCE_COMMIT_CONFLICT",
    );

    const progress = repository.progressSummary("lesson_find_dog_loop", 1);
    assert.equal(progress.targets[0]?.heardCount, 1);
    assert.equal(progress.targets[0]?.signal, "INSUFFICIENT_EVIDENCE");
    database.close();

    const reopened = openDatabase(databasePath, now);
    const reopenedRepository = new EvidenceRepository(reopened, now);
    assert.equal(reopenedRepository.storageSummary().eventCount, 1);
    assert.equal(
      reopenedRepository.findResumableSession(
        createRequest.manifest.lessonId,
        createRequest.manifest.revision,
        createRequest.packageFingerprint,
      ).session?.checkpoint.sequence,
      1,
    );
    reopenedRepository.resetLocalData();
    assert.deepEqual(reopenedRepository.storageSummary(), {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      databaseSchemaVersion: 1,
      lessonRevisionCount: 0,
      sessionCount: 0,
      activeSessionCount: 0,
      eventCount: 0,
      checkpointCount: 0,
      sessions: [],
    });
    reopened
      .prepare(
        "INSERT INTO schema_migrations (id, name, checksum, applied_at) VALUES (?, ?, ?, ?)",
      )
      .run(999, "future_schema", "unknown", now());
    reopened.close();
    assert.throws(
      () => openDatabase(databasePath, now),
      (error: unknown) =>
        error instanceof PersistenceError &&
        error.code === "PERSISTENCE_DATABASE_INCOMPATIBLE",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("HTTP API validates requests and exposes local persistence lifecycle", async () => {
  const database = openDatabase(":memory:", () => "2026-08-12T05:30:00.000Z");
  const repository = new EvidenceRepository(
    database,
    () => "2026-08-12T05:30:00.000Z",
  );
  const server = createBunbunServer(repository);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const health = await fetch(`${origin}/health`);
    assert.equal(health.status, 200);

    const invalid = await jsonRequest(`${origin}/api/v1/sessions`, "POST", {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      unexpected: true,
    });
    assert.equal(invalid.response.status, 400);
    assert.equal(asRecord(invalid.body).code, "INVALID_REQUEST");

    const request = await sessionCreateRequest("session_http_001");
    const created = await jsonRequest(
      `${origin}/api/v1/sessions`,
      "POST",
      request,
    );
    assert.equal(created.response.status, 201);
    assert.equal(asRecord(created.body).checkpointSequence, 0);

    const params = new URLSearchParams({
      lessonId: request.manifest.lessonId,
      revision: String(request.manifest.revision),
      fingerprint: request.packageFingerprint,
    });
    const resumed = await fetch(
      `${origin}/api/v1/resumable-sessions?${params.toString()}`,
    );
    assert.equal(resumed.status, 200);
    const resumedBody = asRecord(await resumed.json());
    assert.equal(asRecord(resumedBody.session).sessionId, "session_http_001");

    const preferences = await jsonRequest(
      `${origin}/api/v1/preferences`,
      "PUT",
      {
        schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
        resumeMode: "AUTO_RESUME",
      },
    );
    assert.equal(asRecord(preferences.body).resumeMode, "AUTO_RESUME");

    const summary = await fetch(`${origin}/api/v1/storage-summary`);
    assert.equal(asRecord(await summary.json()).sessionCount, 1);

    const rejectedReset = await jsonRequest(
      `${origin}/api/v1/local-data`,
      "DELETE",
      {
        schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
        confirmation: "NO",
      },
    );
    assert.equal(rejectedReset.response.status, 400);

    const reset = await jsonRequest(`${origin}/api/v1/local-data`, "DELETE", {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      confirmation: "DELETE_LOCAL_BUNBUN_DATA",
    });
    assert.equal(reset.response.status, 200);
    assert.equal(asRecord(reset.body).deleted, true);
    assert.equal(repository.storageSummary().sessionCount, 0);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) =>
        error === undefined ? resolve() : reject(error),
      ),
    );
    database.close();
  }
});

async function sessionCreateRequest(
  sessionId: string,
): Promise<SessionCreateRequest> {
  const [manifest, catalog] = await Promise.all([
    readFile(manifestPath, "utf8").then(
      (value) => JSON.parse(value) as LessonManifest,
    ),
    readFile(catalogPath, "utf8").then(
      (value) => JSON.parse(value) as CatalogSnapshot,
    ),
  ]);
  return {
    schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
    commitId: `create_${sessionId}`,
    packageFingerprint: fingerprint({ manifest, catalog }),
    manifest,
    catalog,
    events: [],
    checkpoint: {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      sessionId,
      lessonId: manifest.lessonId,
      revision: manifest.revision,
      sequence: 0,
      status: "ACTIVE",
      currentStepId: manifest.entryStepId,
      phase: "AWAITING_AUDIO",
      attempt: 0,
      helpUsed: false,
      audioFailed: false,
      activeScaffoldIds: [],
      arrangedTokenIds: [],
      completedStepIds: [],
      transferredObjects: [],
      activeTimeMs: 0,
      stepStartedAtActiveMs: 0,
    },
  };
}

function heardCommit(
  createRequest: SessionCreateRequest,
  commitId: string,
): SessionCommitRequest {
  const sessionId = createRequest.checkpoint.sessionId;
  const step = createRequest.manifest.steps[0]!;
  return {
    schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
    commitId,
    expectedSequence: 0,
    events: [
      {
        schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
        eventId: `${sessionId}:${step.stepId}:heard:target_inu`,
        kind: "HEARD",
        sessionId,
        lessonId: createRequest.manifest.lessonId,
        revision: createRequest.manifest.revision,
        stepId: step.stepId,
        contextId: step.contextId,
        primitive: step.interaction.type,
        targetId: "target_inu",
        evidence: "heard",
        correct: true,
        assisted: false,
        attempt: 1,
        activeLatencyMs: 1_200,
        occurredAt: "2026-08-12T05:00:01.200Z",
      },
    ],
    checkpoint: {
      ...createRequest.checkpoint,
      sequence: 1,
      phase: "AWAITING_CONTINUE",
      activeTimeMs: 1_200,
    },
  };
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
  return value as Record<string, unknown>;
}
