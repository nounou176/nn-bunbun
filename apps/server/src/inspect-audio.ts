import { parseArgs } from "node:util";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DatabaseSync } from "node:sqlite";

import { DEFAULT_DATABASE_PATH } from "./persistence/database.js";

const { values } = parseArgs({
  options: {
    database: { type: "string" },
  },
  strict: true,
});
const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const requestedDatabasePath = values.database;
const databasePath =
  requestedDatabasePath === undefined
    ? DEFAULT_DATABASE_PATH
    : isAbsolute(requestedDatabasePath)
      ? requestedDatabasePath
      : resolve(repositoryRoot, requestedDatabasePath);
const database = new DatabaseSync(databasePath, { readOnly: true });

try {
  const migration = database
    .prepare("SELECT MAX(id) AS version FROM schema_migrations")
    .get() as { version: number | null };
  const counts = database
    .prepare(
      `SELECT status, COUNT(*) AS count
       FROM audio_speech_assets
       GROUP BY status
       ORDER BY status`,
    )
    .all() as Array<{ status: string; count: number }>;
  const assets = database
    .prepare(
      `SELECT cache_key, voice_profile_id, status, attempt_count,
              wav_sha256, duration_ms, byte_length, failure_code,
              updated_at, reviewed_at
       FROM audio_speech_assets
       ORDER BY updated_at DESC, cache_key
       LIMIT 200`,
    )
    .all();
  console.log(
    JSON.stringify(
      {
        databaseSchemaVersion: migration.version ?? 0,
        statusCounts: counts,
        assets,
      },
      null,
      2,
    ),
  );
} finally {
  database.close();
}
