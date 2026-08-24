import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import {
  EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
  LESSON_MANIFEST_SCHEMA_VERSION,
  type ValidationResult,
  validateAbandonSessionRequestStructure,
  validateResetLocalDataRequestStructure,
  validateSessionCommitRequestStructure,
  validateSessionCreateRequestStructure,
  validateUpdatePreferencesRequestStructure,
} from "@bunbun/contracts";

import { CompilerError } from "./compiler/core.js";
import type { CompilationRepository } from "./compiler/repository.js";
import { PersistenceError } from "./persistence/errors.js";
import type { EvidenceRepository } from "./persistence/repository.js";

const LOCAL_ORIGIN = "http://127.0.0.1";
const MAX_JSON_BODY_BYTES = 512 * 1024;
const FINGERPRINT_PATTERN = /^sha256_[0-9a-f]{64}$/;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function createBunbunServer(
  repository: EvidenceRepository,
  compilations: CompilationRepository,
) {
  return createServer((request, response) => {
    void routeRequest(request, response, repository, compilations).catch(
      (error: unknown) => {
        sendError(response, error);
      },
    );
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  repository: EvidenceRepository,
  compilations: CompilationRepository,
): Promise<void> {
  const url = new URL(request.url ?? "/", LOCAL_ORIGIN);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "bunbun-server",
      contractVersion: LESSON_MANIFEST_SCHEMA_VERSION,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/compilations") {
    const input = exactRecord(await readJson(request), ["targets"]);
    if (
      !Array.isArray(input.targets) ||
      !input.targets.every((target) => typeof target === "string")
    ) {
      throw new HttpError(
        400,
        "INVALID_COMPILATION_TARGETS",
        "targets must be an array of Japanese strings.",
      );
    }
    sendJson(response, 201, compilations.create(input.targets));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/compilations") {
    sendJson(response, 200, { compilations: compilations.list() });
    return;
  }

  const compilationMatch = /^\/api\/v1\/compilations\/([^/]+)$/.exec(
    url.pathname,
  );
  if (request.method === "GET" && compilationMatch !== null) {
    sendJson(response, 200, compilations.read(pathId(compilationMatch[1])));
    return;
  }

  const authoringRequestMatch =
    /^\/api\/v1\/compilations\/([^/]+)\/request$/.exec(url.pathname);
  if (request.method === "GET" && authoringRequestMatch !== null) {
    sendJson(
      response,
      200,
      compilations.request(pathId(authoringRequestMatch[1])),
    );
    return;
  }

  const importMatch = /^\/api\/v1\/compilations\/([^/]+)\/imports$/.exec(
    url.pathname,
  );
  if (request.method === "POST" && importMatch !== null) {
    const input = exactRecord(await readJson(request), ["fileName", "rawText"]);
    if (
      typeof input.fileName !== "string" ||
      !input.fileName.endsWith(".json") ||
      input.fileName.length > 240
    ) {
      throw new HttpError(
        400,
        "INVALID_AUTHORING_FILE",
        "Select one local .json result file.",
      );
    }
    if (typeof input.rawText !== "string" || input.rawText.length === 0) {
      throw new HttpError(
        400,
        "INVALID_AUTHORING_FILE",
        "The selected JSON file is empty.",
      );
    }
    sendJson(
      response,
      200,
      compilations.importResult(pathId(importMatch[1]), input.rawText),
    );
    return;
  }

  const publishMatch = /^\/api\/v1\/compilations\/([^/]+)\/publish$/.exec(
    url.pathname,
  );
  if (request.method === "POST" && publishMatch !== null) {
    const body = exactRecord(await readJson(request), ["confirmation"]);
    if (body.confirmation !== "PUBLISH_REVIEWED_LESSON") {
      throw new HttpError(
        400,
        "PUBLICATION_CONFIRMATION_REQUIRED",
        "Explicit reviewed publication confirmation is required.",
      );
    }
    sendJson(response, 200, compilations.publish(pathId(publishMatch[1])));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/lessons") {
    sendJson(response, 200, { lessons: compilations.listLessons() });
    return;
  }

  const lessonMatch =
    /^\/api\/v1\/lessons\/([^/]+)\/revisions\/([1-9][0-9]*)$/.exec(
      url.pathname,
    );
  if (request.method === "GET" && lessonMatch !== null) {
    sendJson(
      response,
      200,
      compilations.loadLesson(pathId(lessonMatch[1]), Number(lessonMatch[2])),
    );
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/sessions") {
    const input = await readJson(request);
    const body = validated(input, validateSessionCreateRequestStructure(input));
    sendJson(response, 201, repository.createSession(body));
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === "/api/v1/resumable-sessions"
  ) {
    const lessonId = requiredId(url, "lessonId");
    const revision = requiredRevision(url);
    const packageFingerprint = requiredFingerprint(url);
    sendJson(
      response,
      200,
      repository.findResumableSession(lessonId, revision, packageFingerprint),
    );
    return;
  }

  const commitMatch = /^\/api\/v1\/sessions\/([^/]+)\/commits$/.exec(
    url.pathname,
  );
  if (request.method === "POST" && commitMatch !== null) {
    const sessionId = pathId(commitMatch[1]);
    const input = await readJson(request);
    const body = validated(input, validateSessionCommitRequestStructure(input));
    sendJson(response, 200, repository.commitSession(sessionId, body));
    return;
  }

  const abandonMatch = /^\/api\/v1\/sessions\/([^/]+)\/abandon$/.exec(
    url.pathname,
  );
  if (request.method === "POST" && abandonMatch !== null) {
    const sessionId = pathId(abandonMatch[1]);
    const input = await readJson(request);
    const body = validated(
      input,
      validateAbandonSessionRequestStructure(input),
    );
    sendJson(
      response,
      200,
      repository.abandonSession(sessionId, body.expectedSequence),
    );
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/progress") {
    sendJson(
      response,
      200,
      repository.progressSummary(
        requiredId(url, "lessonId"),
        requiredRevision(url),
      ),
    );
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/preferences") {
    sendJson(response, 200, repository.getPreferences());
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/v1/preferences") {
    const input = await readJson(request);
    const body = validated(
      input,
      validateUpdatePreferencesRequestStructure(input),
    );
    sendJson(response, 200, repository.updatePreferences(body));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/v1/storage-summary") {
    sendJson(response, 200, repository.storageSummary());
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/v1/local-data") {
    const input = await readJson(request);
    validated(input, validateResetLocalDataRequestStructure(input));
    compilations.reset();
    repository.resetLocalData();
    sendJson(response, 200, {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      deleted: true,
    });
    return;
  }

  sendJson(response, 404, {
    status: "error",
    code: "NOT_FOUND",
    message: "The requested local Bunbun endpoint does not exist.",
  });
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const contentType = request.headers["content-type"];
  if (
    contentType === undefined ||
    !contentType.startsWith("application/json")
  ) {
    throw new HttpError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Expected application/json.",
    );
  }
  const declaredLength = Number(request.headers["content-length"] ?? 0);
  if (declaredLength > MAX_JSON_BODY_BYTES) {
    throw new HttpError(413, "REQUEST_TOO_LARGE", "JSON body exceeds 512 KiB.");
  }

  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.byteLength;
    if (length > MAX_JSON_BODY_BYTES) {
      throw new HttpError(
        413,
        "REQUEST_TOO_LARGE",
        "JSON body exceeds 256 KiB.",
      );
    }
    chunks.push(buffer);
  }
  if (length === 0) {
    throw new HttpError(400, "INVALID_JSON", "A JSON body is required.");
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body is not valid JSON.");
  }
}

function validated<Value>(
  input: unknown,
  result: ValidationResult<Value>,
): Value {
  if (result.ok) return result.value;
  const first = result.errors[0];
  throw new HttpError(
    400,
    "INVALID_REQUEST",
    first === undefined
      ? "Request did not match the persistence contract."
      : `${first.code} at ${first.path}: ${first.message}`,
  );
}

function requiredId(url: URL, name: string): string {
  const value = url.searchParams.get(name);
  if (value === null || !ID_PATTERN.test(value)) {
    throw new HttpError(
      400,
      "INVALID_QUERY",
      `${name} must be a valid Bunbun ID.`,
    );
  }
  return value;
}

function pathId(encoded: string | undefined): string {
  let value: string;
  try {
    value = decodeURIComponent(encoded ?? "");
  } catch {
    throw new HttpError(400, "INVALID_PATH", "Session ID is malformed.");
  }
  if (!/^[A-Za-z0-9:_-]+$/.test(value)) {
    throw new HttpError(400, "INVALID_PATH", "Session ID is invalid.");
  }
  return value;
}

function requiredRevision(url: URL): number {
  const raw = url.searchParams.get("revision");
  const revision = Number(raw);
  if (raw === null || !Number.isInteger(revision) || revision < 1) {
    throw new HttpError(
      400,
      "INVALID_QUERY",
      "revision must be a positive integer.",
    );
  }
  return revision;
}

function requiredFingerprint(url: URL): string {
  const value = url.searchParams.get("fingerprint");
  if (value === null || !FINGERPRINT_PATTERN.test(value)) {
    throw new HttpError(400, "INVALID_QUERY", "fingerprint is invalid.");
  }
  return value;
}

function sendError(response: ServerResponse, error: unknown): void {
  if (response.headersSent) {
    response.destroy();
    return;
  }
  if (
    error instanceof PersistenceError ||
    error instanceof CompilerError ||
    error instanceof HttpError
  ) {
    sendJson(response, error.statusCode, {
      status: "error",
      code: error.code,
      message: error.message,
    });
    return;
  }
  console.error(error);
  sendJson(response, 500, {
    status: "error",
    code: "INTERNAL_ERROR",
    message: "The local evidence store could not complete the request.",
  });
}

function exactRecord(
  input: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      "Expected one closed JSON object.",
    );
  }
  const record = input as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      `Expected exactly these fields: ${expected.join(", ")}.`,
    );
  }
  return record;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
