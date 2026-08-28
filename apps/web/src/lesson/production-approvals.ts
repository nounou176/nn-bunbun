import type { AudioAsset } from "@bunbun/contracts";

export const M8_LAST_TRAIN_SPEECH_REVIEW_SHA256 =
  "f14d677762915f9c8bc868c7a624f17ac018d9ddb57fec315df9819461ff8d50";
export const M8_LAST_TRAIN_RUNTIME_ACTIVATION_APPROVED = true;

export const APPROVED_SPEECH_WAV_SHA256 = new Map<string, string>([
  [
    "bunbun_tts_v1_604748d17f4dbe0caf708a2d6876ef6c8f5d6c535472ecff84c078ddafb2ba57",
    "03b159f6f83c54f7db54d14c047aad2a0eee7132bde3027c26c15aac170d2745",
  ],
  [
    "bunbun_tts_v1_3f128a2c0df87140fa79809662ccab7186b32e7b721b0e43ef67a9b2d9270347",
    "855c4bc15f6c7bb12fbbfb2506b95f011c7aa3979d51fd250f328e775002cdc8",
  ],
  [
    "bunbun_tts_v1_7ec483945124a9bb23c8045c8ac1c54f9cc1ba59ef53ad0a785d6d6183fead7e",
    "8ee0688f009626e6d0cbb3db0f8907cd1a85108bae40381d570e4dd8313e8c49",
  ],
  [
    "bunbun_tts_v1_48390b80d3c62f6c5f77505c15998c61fbf014d605cb1ecf248f09c3d8202599",
    "13c76f66672174596ffdf45ea5bf84fdec07c5a68dd2f2e76e52ac14e345cf57",
  ],
]);

export function assertM8LastTrainSpeechApproval(
  audioAssets: readonly AudioAsset[],
): void {
  if (
    !M8_LAST_TRAIN_RUNTIME_ACTIVATION_APPROVED ||
    audioAssets.length !== APPROVED_SPEECH_WAV_SHA256.size ||
    audioAssets.some((asset) => !APPROVED_SPEECH_WAV_SHA256.has(asset.cacheKey))
  ) {
    throw new Error(
      "The last-train package does not match the approved Speech Gate 2 cache identities.",
    );
  }
}
