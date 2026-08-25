export interface SpeechVoiceProfile {
  voiceProfileId: "voice_aoi_01" | "voice_tanaka_01";
  profileRevision: 1;
  character: "AOI" | "TANAKA";
  credit: "VOICEVOX Nemo";
  engine: {
    id: "voicevox_nemo";
    version: "0.24.0";
    archiveSha256: string;
    manifestUuid: "208cf94d-43d2-4cf5-abc0-9783cac36d29";
  };
  modelVersion: "0.15.0";
  speakerUuid: string;
  styleId: 10006 | 10000;
}

const ENGINE = {
  id: "voicevox_nemo" as const,
  version: "0.24.0" as const,
  archiveSha256:
    "c2af9ddf42dd28f55e831f0e76f605321daaec981dda3c8be558c734dc6830e7",
  manifestUuid: "208cf94d-43d2-4cf5-abc0-9783cac36d29" as const,
};

export const SPEECH_VOICE_PROFILES: readonly SpeechVoiceProfile[] = [
  {
    voiceProfileId: "voice_aoi_01",
    profileRevision: 1,
    character: "AOI",
    credit: "VOICEVOX Nemo",
    engine: ENGINE,
    modelVersion: "0.15.0",
    speakerUuid: "3490c392-30be-44c2-8379-b77df27fa65e",
    styleId: 10006,
  },
  {
    voiceProfileId: "voice_tanaka_01",
    profileRevision: 1,
    character: "TANAKA",
    credit: "VOICEVOX Nemo",
    engine: ENGINE,
    modelVersion: "0.15.0",
    speakerUuid: "7ecc7a17-1465-4b22-a3b5-842a110ff55e",
    styleId: 10000,
  },
] as const;

const profilesById = new Map(
  SPEECH_VOICE_PROFILES.map((profile) => [profile.voiceProfileId, profile]),
);

export function speechVoiceProfile(
  voiceProfileId: string,
): SpeechVoiceProfile | undefined {
  return profilesById.get(
    voiceProfileId as SpeechVoiceProfile["voiceProfileId"],
  );
}
