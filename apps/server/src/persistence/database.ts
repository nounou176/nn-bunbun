import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DatabaseSync } from "node:sqlite";

import { migrateDatabase } from "./migrations.js";

export const DEFAULT_DATABASE_PATH = fileURLToPath(
  new URL("../../../../.bunbun-data/bunbun.sqlite", import.meta.url),
);

export function openDatabase(
  path = DEFAULT_DATABASE_PATH,
  now: () => string = () => new Date().toISOString(),
): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  try {
    database.exec("PRAGMA foreign_keys = ON");
    database.exec("PRAGMA busy_timeout = 5000");
    if (path !== ":memory:") database.exec("PRAGMA journal_mode = WAL");
    migrateDatabase(database, now());
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}
