import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  generateAuthoredAudio,
  loadParameters,
  renderAsset,
} from "./generate-m8-authored-audio.mjs";

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

test("renders deterministic mono 16-bit PCM WAV assets", async () => {
  const parameters = await loadParameters();
  assert.deepEqual(
    parameters.assets.map((asset) => asset.id),
    [
      "amb_store_hum_01",
      "cue_station_chime_01",
      "music_tension_pulse_01",
      "music_resolution_sting_01",
    ],
  );

  for (const definition of parameters.assets) {
    const first = renderAsset(definition, parameters.sampleRate);
    const second = renderAsset(definition, parameters.sampleRate);
    assert.equal(sha256(first), sha256(second));
    assert.equal(sha256(first), definition.expectedSha256);
    assert.equal(first.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(first.subarray(8, 12).toString("ascii"), "WAVE");
    assert.equal(first.readUInt16LE(20), 1);
    assert.equal(first.readUInt16LE(22), 1);
    assert.equal(first.readUInt32LE(24), 48_000);
    assert.equal(first.readUInt16LE(34), 16);
    assert.equal(
      first.length,
      44 + Math.round(definition.durationSeconds * parameters.sampleRate) * 2,
    );
  }
});

test("writes the complete deterministic authored-audio candidate set", async () => {
  const outputDirectory = await mkdtemp(
    path.join(tmpdir(), "bunbun-m8-authored-audio-"),
  );
  const firstPaths = await generateAuthoredAudio(outputDirectory);
  const firstHashes = await Promise.all(
    firstPaths.map(async (outputPath) => sha256(await readFile(outputPath))),
  );
  const secondPaths = await generateAuthoredAudio(outputDirectory);
  const secondHashes = await Promise.all(
    secondPaths.map(async (outputPath) => sha256(await readFile(outputPath))),
  );

  assert.equal(firstPaths.length, 4);
  assert.deepEqual(firstHashes, secondHashes);
});
