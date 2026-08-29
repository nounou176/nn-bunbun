import type { LessonManifest } from "@bunbun/contracts";

import { APPROVED_SPEECH_WAV_SHA256 } from "../lesson/production-approvals.js";
import type { SpeechAssetView } from "./client.js";

export interface PublishedLaunchOption {
  supportMode: "GUIDED" | "IMMERSIVE";
  label: string;
  recommended: boolean;
  disabled: boolean;
}

export function isM8LastTrainSpeechReady(
  manifest: LessonManifest,
  assets: readonly SpeechAssetView[],
): boolean {
  return (
    assets.length === manifest.audioAssets.length &&
    assets.every(
      (asset) =>
        asset.status === "READY" &&
        asset.wavSha256 === APPROVED_SPEECH_WAV_SHA256.get(asset.cacheKey),
    )
  );
}

export function publishedLaunchOptions(
  lessonId: string,
  lastTrainLessonId: string,
  speechReady: boolean,
): PublishedLaunchOption[] {
  if (lessonId !== lastTrainLessonId) {
    return [
      {
        supportMode: "IMMERSIVE",
        label: "Play",
        recommended: false,
        disabled: false,
      },
    ];
  }
  return [
    {
      supportMode: "GUIDED",
      label: "Chơi có hướng dẫn tiếng Việt",
      recommended: true,
      disabled: !speechReady,
    },
    {
      supportMode: "IMMERSIVE",
      label: "Thử thách chủ yếu bằng tiếng Nhật",
      recommended: false,
      disabled: !speechReady,
    },
  ];
}
