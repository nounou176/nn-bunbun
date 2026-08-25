import { openDatabase } from "./persistence/database.js";
import { EvidenceRepository } from "./persistence/repository.js";
import { createBunbunServer } from "./http.js";
import { CompilationRepository } from "./compiler/repository.js";
import { SpeechRepository } from "./audio/repository.js";
import { SpeechService } from "./audio/service.js";

const DEFAULT_PORT = 3000;
const LOCAL_HOST = "127.0.0.1";

const database = openDatabase();
const repository = new EvidenceRepository(database);
const compilations = new CompilationRepository(database);
const speech = new SpeechService(new SpeechRepository(database));
const server = createBunbunServer(repository, compilations, speech);
const port = parsePort(process.env.PORT);

server.listen(port, LOCAL_HOST, () => {
  console.log(`Bunbun server listening at http://${LOCAL_HOST}:${port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`Received ${signal}; stopping Bunbun server.`);
  server.close((error) => {
    database.close();
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

function parsePort(rawPort: string | undefined): number {
  if (rawPort === undefined) return DEFAULT_PORT;
  const value = Number(rawPort);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    database.close();
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return value;
}
