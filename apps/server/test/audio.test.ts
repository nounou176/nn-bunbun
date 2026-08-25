import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import test from "node:test";

import type { AudioAsset } from "@bunbun/contracts";

import { speechCacheIdentity } from "../src/audio/cache-key.js";
import { SpeechAudioError } from "../src/audio/errors.js";
import { NemoClient } from "../src/audio/nemo-client.js";
import { SpeechRepository } from "../src/audio/repository.js";
import { SpeechService } from "../src/audio/service.js";
import { speechVoiceProfile } from "../src/audio/voice-profiles.js";
import { validateSpeechWav } from "../src/audio/wav.js";
import { CompilationRepository } from "../src/compiler/repository.js";
import { createBunbunServer } from "../src/http.js";
import { openDatabase } from "../src/persistence/database.js";
import { EvidenceRepository } from "../src/persistence/repository.js";

const textJa = "財布を探してください。";
const identity = speechCacheIdentity({
  textJa,
  voiceProfileId: "voice_aoi_01",
});
const audioAsset: AudioAsset = {
  audioAssetId: "audio_aoi_wallet_request",
  textJa,
  voiceProfileId: "voice_aoi_01",
  cacheKey: identity.cacheKey,
};

test("speech cache identity is deterministic and invalidates exact inputs", () => {
  assert.equal(
    identity.cacheKey,
    "bunbun_tts_v1_34a6a1c8a7acc64b6a77f0f7aa84f21142f0b6a5715afc016db11e6f2cd0dbfe",
  );
  assert.equal(
    speechCacheIdentity(audioAsset).cacheKey,
    speechCacheIdentity(audioAsset).cacheKey,
  );
  assert.notEqual(
    speechCacheIdentity({ ...audioAsset, textJa: `${textJa} ` }).cacheKey,
    identity.cacheKey,
  );
  assert.notEqual(
    speechCacheIdentity({
      ...audioAsset,
      voiceProfileId: "voice_tanaka_01",
    }).cacheKey,
    identity.cacheKey,
  );
});

test("WAV validation accepts only bounded 24 kHz mono PCM", () => {
  const wav = createPcmWav(2_400);
  assert.deepEqual(validateSpeechWav(wav), {
    sampleRateHz: 24_000,
    channels: 1,
    bitsPerSample: 16,
    dataBytes: 4_800,
    durationMs: 100,
  });
  const stereo = Buffer.from(wav);
  stereo.writeUInt16LE(2, 22);
  assert.throws(
    () => validateSpeechWav(stereo),
    (error: unknown) =>
      error instanceof SpeechAudioError && error.code === "SPEECH_WAV_INVALID",
  );
});

test("speech repository keeps idempotent references and recovers interrupted jobs", () => {
  const database = openDatabase(":memory:", () => "2026-08-25T05:50:00.000Z");
  try {
    const repository = new SpeechRepository(
      database,
      () => "2026-08-25T05:50:00.000Z",
    );
    repository.enqueue("lesson_m8_cached_speech", 1, [audioAsset]);
    repository.enqueue("lesson_m8_cached_speech", 1, [audioAsset]);
    assert.equal(repository.read(identity.cacheKey).references.length, 1);
    repository.start(identity.cacheKey);

    const recovered = new SpeechRepository(
      database,
      () => "2026-08-25T05:51:00.000Z",
    );
    assert.equal(recovered.read(identity.cacheKey).status, "FAILED");
    assert.equal(
      recovered.read(identity.cacheKey).failureCode,
      "AUTHORING_INTERRUPTED",
    );
    const interruptedAttempt = database
      .prepare(
        `SELECT status, failure_code FROM audio_speech_attempts
         WHERE cache_key = ? AND attempt = 1`,
      )
      .get(identity.cacheKey) as
      { status: string; failure_code: string } | undefined;
    assert.equal(interruptedAttempt?.status, "FAILED");
    assert.equal(interruptedAttempt?.failure_code, "AUTHORING_INTERRUPTED");
    assert.equal(recovered.retry(identity.cacheKey).status, "PENDING");
  } finally {
    database.close();
  }
});

test("speech service generates, reviews, resolves, and purges one immutable WAV", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bunbun-audio-"));
  const database = openDatabase(":memory:", () => new Date().toISOString());
  const fakeClient = {
    generate: async () => ({
      queryBytes: Buffer.from(
        JSON.stringify({ outputSamplingRate: 24_000, outputStereo: false }),
      ),
      wavBytes: createPcmWav(2_400),
      engineVersion: "0.24.0",
      engineManifestUuid: "208cf94d-43d2-4cf5-abc0-9783cac36d29",
      speakerUuid: "3490c392-30be-44c2-8379-b77df27fa65e",
      styleId: 10006,
      elapsedMs: 500,
    }),
  };
  const service = new SpeechService(
    new SpeechRepository(database),
    fakeClient,
    directory,
  );
  try {
    const enqueued = service.enqueue({
      lessonId: "lesson_m8_cached_speech",
      revision: 1,
      audioAssets: [audioAsset],
    });
    assert.equal(enqueued[0]?.status, "PENDING");
    await assert.rejects(
      service.ready(identity.cacheKey),
      (error: unknown) =>
        error instanceof SpeechAudioError &&
        error.code === "SPEECH_ASSET_NOT_READY",
    );

    const generated = await service.runPending();
    assert.equal(generated[0]?.status, "REVIEW_REQUIRED");
    assert.equal((await service.preview(identity.cacheKey)).durationMs, 100);
    const storedQuery = join(
      directory,
      "artifacts",
      identity.cacheKey.slice("bunbun_tts_v1_".length, -62),
      `${identity.cacheKey}.query.json`,
    );
    const originalQuery = await readFile(storedQuery);
    await writeFile(storedQuery, "{}");
    await assert.rejects(
      service.review(identity.cacheKey, "APPROVE"),
      (error: unknown) =>
        error instanceof SpeechAudioError &&
        error.code === "SPEECH_QUERY_ARTIFACT_MISMATCH",
    );
    await writeFile(storedQuery, originalQuery);
    assert.equal(
      (await service.review(identity.cacheKey, "APPROVE")).status,
      "READY",
    );
    const ready = await service.ready(identity.cacheKey);
    assert.equal(ready.credit, "VOICEVOX Nemo");
    assert.equal(validateSpeechWav(ready.bytes).durationMs, 100);

    const storedWav = join(
      directory,
      "artifacts",
      identity.cacheKey.slice("bunbun_tts_v1_".length, -62),
      `${identity.cacheKey}.wav`,
    );
    assert.equal(
      (await readFile(storedWav)).byteLength,
      ready.bytes.byteLength,
    );

    await service.purge();
    assert.equal(service.list().length, 0);
  } finally {
    database.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("speech service reserves bounded query and WAV space before generation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bunbun-audio-limit-"));
  const database = openDatabase(":memory:");
  let generated = false;
  const service = new SpeechService(
    new SpeechRepository(database),
    {
      generate: async () => {
        generated = true;
        throw new Error("Cache guard must run first.");
      },
    },
    directory,
    6 * 1024 * 1024 - 1,
  );
  try {
    service.enqueue({
      lessonId: "lesson_m8_cached_speech",
      revision: 1,
      audioAssets: [audioAsset],
    });
    const result = await service.runPending();
    assert.equal(generated, false);
    assert.equal(result[0]?.status, "FAILED");
    assert.equal(result[0]?.failureCode, "SPEECH_CACHE_LIMIT_REACHED");
  } finally {
    database.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("Nemo client rejects a speaker identity mismatch before synthesis", async () => {
  const calls: string[] = [];
  const client = new NemoClient(async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/version")) return jsonResponse("0.24.0");
    if (url.endsWith("/engine_manifest")) {
      return jsonResponse({ uuid: "208cf94d-43d2-4cf5-abc0-9783cac36d29" });
    }
    if (url.endsWith("/speakers")) {
      return jsonResponse([
        {
          speaker_uuid: "3490c392-30be-44c2-8379-b77df27fa65e",
          version: "0.15.0",
          styles: [{ id: 999_999 }],
        },
      ]);
    }
    throw new Error("Synthesis must not be reached.");
  });
  const profile = speechVoiceProfile("voice_aoi_01");
  assert.ok(profile);
  await assert.rejects(
    client.generate(profile, textJa),
    (error: unknown) =>
      error instanceof SpeechAudioError &&
      error.code === "SPEECH_ENGINE_IDENTITY_MISMATCH",
  );
  assert.equal(
    calls.some((url) => url.includes("audio_query")),
    false,
  );
});

test("speech HTTP boundary withholds unreviewed WAV and serves approved cache", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bunbun-audio-http-"));
  const database = openDatabase(":memory:");
  const fakeClient = {
    generate: async () => ({
      queryBytes: Buffer.from(
        JSON.stringify({ outputSamplingRate: 24_000, outputStereo: false }),
      ),
      wavBytes: createPcmWav(2_400),
      engineVersion: "0.24.0",
      engineManifestUuid: "208cf94d-43d2-4cf5-abc0-9783cac36d29",
      speakerUuid: "3490c392-30be-44c2-8379-b77df27fa65e",
      styleId: 10006,
      elapsedMs: 500,
    }),
  };
  const speech = new SpeechService(
    new SpeechRepository(database),
    fakeClient,
    directory,
  );
  const server = createBunbunServer(
    new EvidenceRepository(database),
    new CompilationRepository(database),
    speech,
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const enqueued = await jsonRequest(
      `${origin}/api/v1/audio/speech/jobs`,
      "POST",
      {
        lessonId: "lesson_m8_cached_speech",
        revision: 1,
        audioAssets: [audioAsset],
      },
    );
    assert.equal(enqueued.status, 201);

    const beforeReview = await fetch(
      `${origin}/api/v1/audio/speech/assets/${identity.cacheKey}.wav`,
    );
    assert.equal(beforeReview.status, 404);

    const generated = await jsonRequest(
      `${origin}/api/v1/audio/speech/run`,
      "POST",
      { confirmation: "GENERATE_LOCAL_SPEECH" },
    );
    assert.equal(generated.status, 200);
    const preview = await fetch(
      `${origin}/api/v1/audio/speech/jobs/${identity.cacheKey}/preview`,
    );
    assert.equal(preview.status, 200);
    assert.equal(preview.headers.get("cache-control"), "no-store");

    const approved = await jsonRequest(
      `${origin}/api/v1/audio/speech/jobs/${identity.cacheKey}/review`,
      "POST",
      {
        decision: "APPROVE",
        confirmation: "APPROVE_REVIEWED_SPEECH",
      },
    );
    assert.equal(approved.status, 200);
    const ready = await fetch(
      `${origin}/api/v1/audio/speech/assets/${identity.cacheKey}.wav`,
    );
    assert.equal(ready.status, 200);
    assert.equal(ready.headers.get("x-bunbun-audio-credit"), "VOICEVOX Nemo");
    assert.match(ready.headers.get("cache-control") ?? "", /immutable/);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) =>
        error === undefined ? resolve() : reject(error),
      ),
    );
    database.close();
    await rm(directory, { recursive: true, force: true });
  }
});

function createPcmWav(sampleCount: number): Buffer {
  const dataBytes = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(24_000, 24);
  buffer.writeUInt32LE(48_000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);
  return buffer;
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function jsonRequest(
  url: string,
  method: string,
  body: unknown,
): Promise<Response> {
  return fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
