import assert from "node:assert/strict";
import test from "node:test";

import type { LessonManifest } from "@bunbun/contracts";
import lastTrainManifestFixture from "@bunbun/contracts/fixtures/m8-last-train" with { type: "json" };

import type { SpeechAssetView } from "../src/authoring/client.js";
import {
  isM8LastTrainSpeechReady,
  publishedLaunchOptions,
} from "../src/authoring/published-launch.js";
import { APPROVED_SPEECH_WAV_SHA256 } from "../src/lesson/production-approvals.js";

const manifest = lastTrainManifestFixture as LessonManifest;

test("published Last Train recommends guided launch when exact speech is ready", () => {
  const assets = manifest.audioAssets.map((audio, index): SpeechAssetView => ({
    cacheKey: audio.cacheKey,
    voiceProfileId: audio.voiceProfileId,
    textJa: audio.textJa,
    status: "READY",
    attemptCount: 1,
    wavSha256: APPROVED_SPEECH_WAV_SHA256.get(audio.cacheKey)!,
    credit: "VOICEVOX Nemo",
    references: [
      {
        lessonId: manifest.lessonId,
        revision: manifest.revision,
        audioAssetId: audio.audioAssetId,
      },
    ],
    createdAt: `2026-08-29T08:00:0${index}.000Z`,
    updatedAt: `2026-08-29T08:00:0${index}.000Z`,
  }));

  assert.equal(isM8LastTrainSpeechReady(manifest, assets), true);
  assert.deepEqual(
    publishedLaunchOptions(manifest.lessonId, manifest.lessonId, true),
    [
      {
        supportMode: "GUIDED",
        label: "Chơi có hướng dẫn tiếng Việt",
        recommended: true,
        disabled: false,
      },
      {
        supportMode: "IMMERSIVE",
        label: "Thử thách chủ yếu bằng tiếng Nhật",
        recommended: false,
        disabled: false,
      },
    ],
  );
});

test("published Last Train fails closed on missing or changed speech identity", () => {
  assert.equal(isM8LastTrainSpeechReady(manifest, []), false);
  const wrong = manifest.audioAssets.map((audio): SpeechAssetView => ({
    cacheKey: audio.cacheKey,
    voiceProfileId: audio.voiceProfileId,
    textJa: audio.textJa,
    status: "READY",
    attemptCount: 1,
    wavSha256: "0".repeat(64),
    credit: "VOICEVOX Nemo",
    references: [],
    createdAt: "2026-08-29T08:00:00.000Z",
    updatedAt: "2026-08-29T08:00:00.000Z",
  }));
  assert.equal(isM8LastTrainSpeechReady(manifest, wrong), false);
  assert.ok(
    publishedLaunchOptions(manifest.lessonId, manifest.lessonId, false).every(
      (option) => option.disabled,
    ),
  );
});

test("published park lessons retain one immersive launch", () => {
  assert.deepEqual(
    publishedLaunchOptions("lesson_park", manifest.lessonId, false),
    [
      {
        supportMode: "IMMERSIVE",
        label: "Play",
        recommended: false,
        disabled: false,
      },
    ],
  );
});
