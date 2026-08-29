import { createHash } from "node:crypto";

import type { DatabaseSync } from "node:sqlite";

import { PersistenceError } from "./errors.js";

interface Migration {
  id: number;
  name: string;
  sql: string;
}

const migrations: readonly Migration[] = [
  {
    id: 1,
    name: "initial_local_evidence",
    sql: `
      CREATE TABLE lesson_revisions (
        lesson_id TEXT NOT NULL,
        revision INTEGER NOT NULL CHECK (revision >= 1),
        manifest_schema_version TEXT NOT NULL,
        catalog_schema_version TEXT NOT NULL,
        package_fingerprint TEXT NOT NULL,
        manifest_json TEXT NOT NULL,
        catalog_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (lesson_id, revision)
      ) STRICT;

      CREATE TABLE play_sessions (
        session_id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        revision INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
        checkpoint_sequence INTEGER NOT NULL CHECK (checkpoint_sequence >= 0),
        active_time_ms INTEGER NOT NULL CHECK (active_time_ms >= 0),
        started_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        abandoned_at TEXT,
        FOREIGN KEY (lesson_id, revision)
          REFERENCES lesson_revisions (lesson_id, revision)
          ON DELETE CASCADE
      ) STRICT;

      CREATE TABLE session_events (
        event_sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        payload_fingerprint TEXT NOT NULL,
        session_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        revision INTEGER NOT NULL,
        kind TEXT NOT NULL,
        step_id TEXT NOT NULL,
        context_id TEXT NOT NULL,
        primitive TEXT NOT NULL,
        target_id TEXT,
        evidence TEXT,
        response_ids_json TEXT,
        correct INTEGER,
        assisted INTEGER NOT NULL CHECK (assisted IN (0, 1)),
        attempt INTEGER NOT NULL CHECK (attempt >= 0),
        active_latency_ms INTEGER NOT NULL CHECK (active_latency_ms >= 0),
        occurred_at TEXT NOT NULL,
        received_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES play_sessions (session_id)
          ON DELETE CASCADE
      ) STRICT;

      CREATE TABLE session_checkpoints (
        session_id TEXT PRIMARY KEY,
        checkpoint_contract_version TEXT NOT NULL,
        sequence INTEGER NOT NULL CHECK (sequence >= 0),
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES play_sessions (session_id)
          ON DELETE CASCADE
      ) STRICT;

      CREATE TABLE session_commits (
        commit_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        payload_fingerprint TEXT NOT NULL,
        resulting_sequence INTEGER NOT NULL CHECK (resulting_sequence >= 0),
        stored_event_count INTEGER NOT NULL CHECK (stored_event_count >= 0),
        committed_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES play_sessions (session_id)
          ON DELETE CASCADE
      ) STRICT;

      CREATE TABLE local_preferences (
        profile_id TEXT PRIMARY KEY,
        resume_mode TEXT NOT NULL CHECK (resume_mode IN ('ASK', 'AUTO_RESUME', 'START_NEW')),
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX play_sessions_resume_idx
        ON play_sessions (profile_id, lesson_id, revision, updated_at DESC);
      CREATE UNIQUE INDEX play_sessions_one_active_idx
        ON play_sessions (profile_id, lesson_id, revision)
        WHERE status = 'ACTIVE';
      CREATE INDEX session_events_session_idx
        ON session_events (session_id, event_sequence);
      CREATE INDEX session_events_target_idx
        ON session_events (lesson_id, revision, target_id, event_sequence);
      CREATE INDEX session_commits_session_idx
        ON session_commits (session_id, resulting_sequence);
    `,
  },
  {
    id: 2,
    name: "m7_compilation_handoff",
    sql: `
      CREATE TABLE compilation_requests (
        compilation_id TEXT PRIMARY KEY,
        cache_key TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN (
          'AWAITING_AUTHORING', 'REPAIR_REQUIRED', 'READY_FOR_REVIEW',
          'PUBLISHED', 'FAILED'
        )),
        current_attempt INTEGER NOT NULL CHECK (current_attempt IN (1, 2)),
        normalized_target_keys_json TEXT NOT NULL,
        authoring_request_json TEXT NOT NULL,
        diagnostics_json TEXT NOT NULL,
        pending_package_json TEXT,
        lesson_id TEXT,
        revision INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        published_at TEXT,
        FOREIGN KEY (lesson_id, revision)
          REFERENCES lesson_revisions (lesson_id, revision)
      ) STRICT;

      CREATE TABLE compilation_attempts (
        compilation_id TEXT NOT NULL,
        attempt INTEGER NOT NULL CHECK (attempt IN (1, 2)),
        response_sha256 TEXT NOT NULL,
        failure_stage TEXT,
        diagnostics_json TEXT NOT NULL,
        structured_result_json TEXT,
        imported_at TEXT NOT NULL,
        PRIMARY KEY (compilation_id, attempt),
        FOREIGN KEY (compilation_id) REFERENCES compilation_requests (compilation_id)
          ON DELETE CASCADE
      ) STRICT;

      CREATE INDEX compilation_requests_status_idx
        ON compilation_requests (status, updated_at DESC);
      CREATE INDEX compilation_requests_cache_idx
        ON compilation_requests (cache_key, created_at DESC);
      CREATE INDEX compilation_attempts_hash_idx
        ON compilation_attempts (response_sha256);
    `,
  },
  {
    id: 3,
    name: "m8_reviewed_speech_cache",
    sql: `
      CREATE TABLE audio_speech_assets (
        cache_key TEXT PRIMARY KEY,
        voice_profile_id TEXT NOT NULL,
        text_ja TEXT NOT NULL,
        canonical_input_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN (
          'PENDING', 'RUNNING', 'REVIEW_REQUIRED', 'READY', 'REJECTED', 'FAILED'
        )),
        attempt_count INTEGER NOT NULL CHECK (attempt_count >= 0),
        query_sha256 TEXT,
        wav_sha256 TEXT,
        query_relative_path TEXT,
        wav_relative_path TEXT,
        duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms > 0),
        byte_length INTEGER CHECK (byte_length IS NULL OR byte_length > 0),
        failure_code TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        generated_at TEXT,
        reviewed_at TEXT
      ) STRICT;

      CREATE TABLE audio_speech_references (
        cache_key TEXT NOT NULL,
        origin_lesson_id TEXT NOT NULL,
        origin_revision INTEGER NOT NULL CHECK (origin_revision >= 1),
        audio_asset_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (
          cache_key, origin_lesson_id, origin_revision, audio_asset_id
        ),
        FOREIGN KEY (cache_key) REFERENCES audio_speech_assets (cache_key)
          ON DELETE CASCADE
      ) STRICT;

      CREATE TABLE audio_speech_attempts (
        cache_key TEXT NOT NULL,
        attempt INTEGER NOT NULL CHECK (attempt >= 1),
        status TEXT NOT NULL CHECK (status IN ('SUCCEEDED', 'FAILED')),
        engine_version TEXT,
        engine_manifest_uuid TEXT,
        speaker_uuid TEXT,
        style_id INTEGER,
        query_sha256 TEXT,
        wav_sha256 TEXT,
        duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms > 0),
        elapsed_ms INTEGER CHECK (elapsed_ms IS NULL OR elapsed_ms >= 0),
        failure_code TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        PRIMARY KEY (cache_key, attempt),
        FOREIGN KEY (cache_key) REFERENCES audio_speech_assets (cache_key)
          ON DELETE CASCADE
      ) STRICT;

      CREATE INDEX audio_speech_assets_status_idx
        ON audio_speech_assets (status, updated_at, cache_key);
      CREATE INDEX audio_speech_references_origin_idx
        ON audio_speech_references (
          origin_lesson_id, origin_revision, audio_asset_id
        );
      CREATE INDEX audio_speech_attempts_completed_idx
        ON audio_speech_attempts (completed_at, cache_key);
    `,
  },
  {
    id: 4,
    name: "m8_approved_compiler_profiles",
    sql: `
      ALTER TABLE compilation_requests
        ADD COLUMN mode TEXT NOT NULL DEFAULT 'AUTHORING_HANDOFF'
        CHECK (mode IN ('AUTHORING_HANDOFF', 'APPROVED_PROFILE_SELECTION'));

      ALTER TABLE compilation_requests
        ADD COLUMN profile_id TEXT NOT NULL DEFAULT 'park_authoring_v1';

      CREATE INDEX compilation_requests_profile_idx
        ON compilation_requests (profile_id, mode, updated_at DESC);
    `,
  },
];

export const DATABASE_SCHEMA_VERSION = migrations.length;

export function migrateDatabase(
  database: DatabaseSync,
  occurredAt: string,
): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);

  const applied = database
    .prepare("SELECT id, name, checksum FROM schema_migrations ORDER BY id")
    .all() as Array<{ id: number; name: string; checksum: string }>;
  const knownById = new Map(
    migrations.map((migration) => [migration.id, migration]),
  );

  for (const row of applied) {
    const known = knownById.get(row.id);
    if (known === undefined) {
      throw new PersistenceError(
        "PERSISTENCE_DATABASE_INCOMPATIBLE",
        `Database migration ${row.id} is newer than this Bunbun build.`,
        500,
      );
    }
    if (known.name !== row.name || checksum(known) !== row.checksum) {
      throw new PersistenceError(
        "PERSISTENCE_DATABASE_INCOMPATIBLE",
        `Applied migration ${row.id} does not match this Bunbun build.`,
        500,
      );
    }
  }

  for (const migration of migrations) {
    if (applied.some((row) => row.id === migration.id)) continue;
    try {
      database.exec("BEGIN IMMEDIATE");
      database.exec(migration.sql);
      database
        .prepare(
          "INSERT INTO schema_migrations (id, name, checksum, applied_at) VALUES (?, ?, ?, ?)",
        )
        .run(migration.id, migration.name, checksum(migration), occurredAt);
      database.exec("COMMIT");
    } catch (error) {
      rollback(database);
      throw new PersistenceError(
        "PERSISTENCE_MIGRATION_FAILED",
        `Could not apply database migration ${migration.id}.`,
        500,
        { cause: error },
      );
    }
  }
}

function checksum(migration: Migration): string {
  return createHash("sha256")
    .update(`${migration.id}\n${migration.name}\n${migration.sql}`)
    .digest("hex");
}

function rollback(database: DatabaseSync): void {
  try {
    database.exec("ROLLBACK");
  } catch {
    // No transaction remained open.
  }
}
