import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
  type SessionCreateRequest,
} from "@bunbun/contracts";

import { packageFingerprint } from "../src/persistence/fingerprint.js";
import {
  createHttpEvidenceStore,
  EvidenceStoreError,
} from "../src/persistence/http.js";

test("browser package fingerprint matches canonical SHA-256", async () => {
  const value = {
    z: [3, { y: true, a: "犬" }],
    a: { c: null, b: 2 },
  };
  const canonical = '{"a":{"b":2,"c":null},"z":[3,{"a":"犬","y":true}]}';
  const expected = `sha256_${createHash("sha256").update(canonical).digest("hex")}`;
  assert.equal(await packageFingerprint(value), expected);
});

test("HTTP evidence adapter validates successful responses", async () => {
  const originalFetch = globalThis.fetch;
  let requestedPath = "";
  globalThis.fetch = (input) => {
    requestedPath = String(input);
    return Promise.resolve(
      Response.json({
        schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
        resumeMode: "ASK",
        updatedAt: "2026-08-12T00:00:00.000Z",
      }),
    );
  };
  try {
    const preferences = await createHttpEvidenceStore().getPreferences();
    assert.equal(preferences.resumeMode, "ASK");
    assert.equal(requestedPath, "/api/v1/preferences");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("HTTP evidence adapter fails closed on invalid responses and simulated writes", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(Response.json({ unexpected: true }));
  try {
    await assert.rejects(
      () => createHttpEvidenceStore().getPreferences(),
      (error: unknown) =>
        error instanceof EvidenceStoreError &&
        error.code === "PERSISTENCE_RESPONSE_INVALID",
    );

    const simulated = createHttpEvidenceStore(true);
    await assert.rejects(
      () => simulated.createSession({} as unknown as SessionCreateRequest),
      (error: unknown) =>
        error instanceof EvidenceStoreError &&
        error.code === "PERSISTENCE_SIMULATED_FAILURE" &&
        error.retryable,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
