import { createServer, type ServerResponse } from "node:http";

import { LESSON_MANIFEST_SCHEMA_VERSION } from "@bunbun/contracts/version";

const DEFAULT_PORT = 3000;
const LOCAL_HOST = "127.0.0.1";

function parsePort(rawPort: string | undefined): number {
  if (rawPort === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
): void {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${LOCAL_HOST}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "bunbun-server",
      contractVersion: LESSON_MANIFEST_SCHEMA_VERSION,
    });
    return;
  }

  sendJson(response, 404, {
    status: "error",
    code: "NOT_FOUND",
  });
});

const port = parsePort(process.env.PORT);

server.listen(port, LOCAL_HOST, () => {
  console.log(`Bunbun server listening at http://${LOCAL_HOST}:${port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`Received ${signal}; stopping Bunbun server.`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
