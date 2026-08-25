import { createHash } from "node:crypto";

import type { AudioAsset } from "@bunbun/contracts";

import { canonicalJson } from "../persistence/canonical-json.js";
import { SpeechAudioError } from "./errors.js";
import {
  speechVoiceProfile,
  type SpeechVoiceProfile,
} from "./voice-profiles.js";

export const SPEECH_CACHE_KEY_PATTERN = /^bunbun_tts_v1_[0-9a-f]{64}$/;

export interface SpeechCacheIdentity {
  cacheKey: string;
  canonicalInput: string;
  profile: SpeechVoiceProfile;
}

export function speechCacheIdentity(
  audioAsset: Pick<AudioAsset, "textJa" | "voiceProfileId">,
): SpeechCacheIdentity {
  const profile = speechVoiceProfile(audioAsset.voiceProfileId);
  if (profile === undefined) {
    throw new SpeechAudioError(
      "SPEECH_VOICE_PROFILE_UNSUPPORTED",
      `Voice profile '${audioAsset.voiceProfileId}' is not approved for cached speech.`,
    );
  }
  const input = {
    format: "bunbun_speech_cache_input",
    version: 1,
    textJa: audioAsset.textJa,
    voiceProfile: {
      id: profile.voiceProfileId,
      revision: profile.profileRevision,
      engine: profile.engine,
      modelVersion: profile.modelVersion,
      speakerUuid: profile.speakerUuid,
      styleId: profile.styleId,
    },
    queryPolicy: {
      id: "nemo_unchanged_audio_query",
      version: 1,
      userDictionaryFingerprint: "none",
      pronunciationOverrideFingerprint: "none",
    },
    output: {
      container: "wav",
      codec: "pcm_s16le",
      sampleRateHz: 24_000,
      channels: 1,
    },
  };
  const canonicalInput = canonicalJson(input);
  const digest = createHash("sha256")
    .update(canonicalInput, "utf8")
    .digest("hex");
  return {
    cacheKey: `bunbun_tts_v1_${digest}`,
    canonicalInput,
    profile,
  };
}

export function assertSpeechCacheKey(cacheKey: string): void {
  if (!SPEECH_CACHE_KEY_PATTERN.test(cacheKey)) {
    throw new SpeechAudioError(
      "SPEECH_CACHE_KEY_INVALID",
      "Speech cache key is invalid.",
    );
  }
}
