import assert from "node:assert/strict";
import test from "node:test";

import {
  ADAPTIVE_LEARNING_SCHEMA_VERSION,
  type UpdateAdaptivePreferencesRequest,
} from "@bunbun/contracts";

import {
  AdaptiveClientError,
  adaptiveClient,
} from "../src/adaptation/client.js";

const preferences = {
  contractType: "ADAPTIVE_PREFERENCES",
  schemaVersion: ADAPTIVE_LEARNING_SCHEMA_VERSION,
  adaptiveMode: "SUGGEST",
  supportPreference: "ASK_EACH_TIME",
  updatedAt: "1970-01-01T00:00:00.000Z",
} as const;

test("adaptive client validates a same-origin snapshot", async () => {
  const originalFetch = globalThis.fetch;
  let requestedPath = "";
  globalThis.fetch = (input) => {
    requestedPath = String(input);
    return Promise.resolve(
      Response.json({
        contractType: "ADAPTIVE_SNAPSHOT",
        schemaVersion: ADAPTIVE_LEARNING_SCHEMA_VERSION,
        registryId: "bunbun_learning_targets",
        registryVersion: "0.1.0",
        preferences,
        summaries: [],
        suggestions: [],
        unmappedTargets: [],
        publishedLessonCandidateCount: 0,
      }),
    );
  };
  try {
    const snapshot = await adaptiveClient.getSnapshot();
    assert.equal(snapshot.contractType, "ADAPTIVE_SNAPSHOT");
    assert.equal(requestedPath, "/api/v1/adaptation");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adaptive client sends the closed preference request and validates the result", async () => {
  const originalFetch = globalThis.fetch;
  let requestedPath = "";
  let requestedBody = "";
  globalThis.fetch = (input, init) => {
    requestedPath = String(input);
    requestedBody = String(init?.body);
    return Promise.resolve(
      Response.json({
        ...preferences,
        adaptiveMode: "OFF",
        supportPreference: "LESS_SUPPORT",
        updatedAt: "2026-08-30T07:30:00.000Z",
      }),
    );
  };
  const request: UpdateAdaptivePreferencesRequest = {
    contractType: "UPDATE_ADAPTIVE_PREFERENCES",
    schemaVersion: ADAPTIVE_LEARNING_SCHEMA_VERSION,
    adaptiveMode: "OFF",
    supportPreference: "LESS_SUPPORT",
  };
  try {
    const updated = await adaptiveClient.updatePreferences(request);
    assert.equal(requestedPath, "/api/v1/adaptation/preferences");
    assert.deepEqual(JSON.parse(requestedBody), request);
    assert.equal(updated.adaptiveMode, "OFF");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adaptive client preserves closed server errors and rejects invalid success bodies", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = () =>
      Promise.resolve(
        Response.json(
          {
            contractType: "ADAPTIVE_API_ERROR",
            status: "error",
            code: "ADAPTATION_UNAVAILABLE",
            message: "Temporarily unavailable.",
          },
          { status: 503 },
        ),
      );
    await assert.rejects(
      () => adaptiveClient.getSnapshot(),
      (error: unknown) =>
        error instanceof AdaptiveClientError &&
        error.code === "ADAPTATION_UNAVAILABLE" &&
        error.retryable,
    );

    globalThis.fetch = () =>
      Promise.resolve(Response.json({ unexpected: true }));
    await assert.rejects(
      () => adaptiveClient.getPreferences(),
      (error: unknown) =>
        error instanceof AdaptiveClientError &&
        error.code === "ADAPTATION_RESPONSE_INVALID" &&
        !error.retryable,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
