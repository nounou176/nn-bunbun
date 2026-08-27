import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FIRST_INTERACTION_PRELOAD_IDS,
  NON_SPEECH_AUDIO_ASSETS,
} from "../src/audio/assets.js";

test("runtime audio registry is exactly the approved hash-bound set", async () => {
  const approvalUrl = new URL(
    "../../../docs/audio-sources/M8_NON_SPEECH_APPROVAL_2026-08-25.json",
    import.meta.url,
  );
  const approval = JSON.parse(await readFile(approvalUrl, "utf8")) as {
    approved: Array<{ id: string; sha256: string }>;
    rejected: Array<{ id: string }>;
  };
  const approved = new Map(
    approval.approved.map((item) => [item.id, item.sha256]),
  );
  assert.equal(NON_SPEECH_AUDIO_ASSETS.length, 16);
  assert.equal(
    new Set(NON_SPEECH_AUDIO_ASSETS.map((asset) => asset.id)).size,
    16,
  );

  let totalBytes = 0;
  for (const asset of NON_SPEECH_AUDIO_ASSETS) {
    const bytes = await readFile(new URL(asset.url));
    assert.equal(bytes.byteLength, asset.bytes, asset.id);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      asset.sha256,
      asset.id,
    );
    assert.equal(approved.get(asset.id), asset.sha256, asset.id);
    assert.equal(
      approval.rejected.some((candidate) => candidate.id === asset.id),
      false,
      asset.id,
    );
    totalBytes += bytes.byteLength;
  }
  assert.deepEqual(
    [...approved.keys()].sort(),
    NON_SPEECH_AUDIO_ASSETS.map((asset) => asset.id).sort(),
  );
  assert.equal(totalBytes, 4_958_589);
  assert.ok(totalBytes <= 6 * 1024 * 1024);
});

test("first-interaction preload remains below its approved encoded ceiling", () => {
  const preloadBytes = NON_SPEECH_AUDIO_ASSETS.filter((asset) =>
    FIRST_INTERACTION_PRELOAD_IDS.includes(
      asset.id as (typeof FIRST_INTERACTION_PRELOAD_IDS)[number],
    ),
  ).reduce((total, asset) => total + asset.bytes, 0);
  assert.equal(preloadBytes, 925_841);
  assert.ok(preloadBytes <= 1.5 * 1024 * 1024);
});
