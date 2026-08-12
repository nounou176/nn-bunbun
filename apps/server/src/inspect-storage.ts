import { openDatabase } from "./persistence/database.js";
import { EvidenceRepository } from "./persistence/repository.js";

const databasePath = process.argv[2];
const database = openDatabase(databasePath);

try {
  const summary = new EvidenceRepository(database).storageSummary();
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} finally {
  database.close();
}
