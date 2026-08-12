import {
  EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
  type ValidationResult,
  validateAbandonSessionResultStructure,
  validateLocalPreferencesStructure,
  validateProgressSummaryResultStructure,
  validateResetLocalDataResultStructure,
  validateResumableSessionResultStructure,
  validateSessionCommitResultStructure,
  validateStorageSummaryStructure,
} from "@bunbun/contracts";

import type { EvidenceStore, ResumableQuery } from "./port.js";

export class EvidenceStoreError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export function createHttpEvidenceStore(
  simulateWriteFailure = false,
): EvidenceStore {
  let failurePending = simulateWriteFailure;

  const write = async <Value>(action: () => Promise<Value>): Promise<Value> => {
    if (failurePending) {
      failurePending = false;
      throw new EvidenceStoreError(
        "PERSISTENCE_SIMULATED_FAILURE",
        "The requested local persistence failure was simulated.",
        true,
      );
    }
    return action();
  };

  return {
    createSession: (request) =>
      write(() =>
        requestJson(
          "/api/v1/sessions",
          { method: "POST", body: request },
          validateSessionCommitResultStructure,
        ),
      ),
    commitSession: (sessionId, request) =>
      write(() =>
        requestJson(
          `/api/v1/sessions/${encodeURIComponent(sessionId)}/commits`,
          { method: "POST", body: request },
          validateSessionCommitResultStructure,
        ),
      ),
    findResumableSession: (query) =>
      requestJson(
        `/api/v1/resumable-sessions?${resumableParameters(query)}`,
        { method: "GET" },
        validateResumableSessionResultStructure,
      ),
    abandonSession: (sessionId, expectedSequence) =>
      write(() =>
        requestJson(
          `/api/v1/sessions/${encodeURIComponent(sessionId)}/abandon`,
          {
            method: "POST",
            body: {
              schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
              expectedSequence,
            },
          },
          validateAbandonSessionResultStructure,
        ),
      ),
    getProgress: (lessonId, revision) =>
      requestJson(
        `/api/v1/progress?${new URLSearchParams({
          lessonId,
          revision: String(revision),
        })}`,
        { method: "GET" },
        validateProgressSummaryResultStructure,
      ),
    getPreferences: () =>
      requestJson(
        "/api/v1/preferences",
        { method: "GET" },
        validateLocalPreferencesStructure,
      ),
    updatePreferences: (request) =>
      write(() =>
        requestJson(
          "/api/v1/preferences",
          { method: "PUT", body: request },
          validateLocalPreferencesStructure,
        ),
      ),
    getStorageSummary: () =>
      requestJson(
        "/api/v1/storage-summary",
        { method: "GET" },
        validateStorageSummaryStructure,
      ),
    resetLocalData: () =>
      write(async () => {
        await requestJson(
          "/api/v1/local-data",
          {
            method: "DELETE",
            body: {
              schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
              confirmation: "DELETE_LOCAL_BUNBUN_DATA",
            },
          },
          validateResetLocalDataResultStructure,
        );
      }),
  };
}

async function requestJson<Value>(
  path: string,
  options: { method: string; body?: unknown },
  validate: (input: unknown) => ValidationResult<Value>,
): Promise<Value> {
  let response: Response;
  try {
    response = await fetch(
      path,
      options.body === undefined
        ? { method: options.method }
        : {
            method: options.method,
            headers: { "content-type": "application/json" },
            body: JSON.stringify(options.body),
          },
    );
  } catch (error) {
    throw new EvidenceStoreError(
      "PERSISTENCE_UNAVAILABLE",
      "The local Bunbun server is unavailable. Start the server and retry.",
      true,
      { cause: error },
    );
  }

  const input = await responseJson(response);
  if (!response.ok) {
    const record = isRecord(input) ? input : {};
    throw new EvidenceStoreError(
      typeof record.code === "string"
        ? record.code
        : "PERSISTENCE_REQUEST_FAILED",
      typeof record.message === "string"
        ? record.message
        : `Local persistence request failed with HTTP ${response.status}.`,
      response.status >= 500 || response.status === 409,
    );
  }
  const result = validate(input);
  if (!result.ok) {
    const first = result.errors[0];
    throw new EvidenceStoreError(
      "PERSISTENCE_RESPONSE_INVALID",
      first === undefined
        ? "The local server returned an invalid persistence response."
        : `${first.code} at ${first.path}: ${first.message}`,
      false,
    );
  }
  return result.value;
}

async function responseJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new EvidenceStoreError(
      "PERSISTENCE_RESPONSE_INVALID",
      "The local server returned a non-JSON response.",
      false,
      { cause: error },
    );
  }
}

function resumableParameters(query: ResumableQuery): string {
  return new URLSearchParams({
    lessonId: query.lessonId,
    revision: String(query.revision),
    fingerprint: query.packageFingerprint,
  }).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
