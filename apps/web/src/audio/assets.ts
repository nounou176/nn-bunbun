export type NonSpeechBus = "ambience" | "effects" | "music";

export interface NonSpeechAudioCredit {
  title: string;
  author: string;
  rights: "CC0-1.0" | "Bunbun project-authored";
  sourceUrl?: string;
}

export interface NonSpeechAudioAsset {
  id: string;
  role: string;
  url: string;
  bus: NonSpeechBus;
  loop: boolean;
  bytes: number;
  sha256: string;
  baseGain: number;
  credit: NonSpeechAudioCredit;
}

const assetUrl = (filename: string) =>
  new URL(`../assets/audio/non-speech/v1/${filename}`, import.meta.url).href;

const cc0 = (
  title: string,
  author: string,
  sourceUrl: string,
): NonSpeechAudioCredit => ({
  title,
  author,
  rights: "CC0-1.0",
  sourceUrl,
});

const authored: NonSpeechAudioCredit = {
  title: "Bunbun project-authored audio v1",
  author: "Bunbun",
  rights: "Bunbun project-authored",
};

export const NON_SPEECH_AUDIO_ASSETS = [
  {
    id: "amb_rain_03",
    role: "Rainy exterior loop",
    url: assetUrl("amb_rain_03.ogg"),
    bus: "ambience",
    loop: true,
    bytes: 913_769,
    sha256: "73a0f5ef19ed9f64599c0425b1fb52d857acfc42c0fd5eab85c4577ace18f0ed",
    baseGain: 0.65,
    credit: cc0(
      "Rain (loopable)",
      "Ylmir",
      "https://opengameart.org/content/rain-loopable",
    ),
  },
  {
    id: "amb_distant_road_01",
    role: "Distant road bed",
    url: assetUrl("amb_distant_road_01.ogg"),
    bus: "ambience",
    loop: true,
    bytes: 558_092,
    sha256: "1c7ce49677ade7ebc4c7f3bd58657a730b892713382d197ea96a2c0f4ead0c51",
    baseGain: 0.18,
    credit: cc0(
      "High traffic road sounds",
      "IgnasD",
      "https://opengameart.org/content/high-traffic-road-sounds",
    ),
  },
  {
    id: "sfx_footstep_01",
    role: "Movement footstep",
    url: assetUrl("sfx_footstep_01.ogg"),
    bus: "effects",
    loop: false,
    bytes: 12_072,
    sha256: "62c2dfaafdd9f79e2f5599d56d826b7d35ba038a05b3001c2f17487bd1b5d3b3",
    baseGain: 0.75,
    credit: cc0(
      "Step sound (walking)",
      "IgnasD",
      "https://opengameart.org/content/step-sound-walking",
    ),
  },
  {
    id: "sfx_cat_mew_01",
    role: "Momo clue reaction",
    url: assetUrl("sfx_cat_mew_01.wav"),
    bus: "effects",
    loop: false,
    bytes: 218_620,
    sha256: "7de9fed4401b677ccbf072781182857d875093a8e9b5727fc21b38028cfd5a90",
    baseGain: 0.7,
    credit: cc0(
      "Cat Purr & Meow",
      "Kerzoven",
      "https://opengameart.org/content/cat-purr-meow",
    ),
  },
  {
    id: "amb_cat_purr_01",
    role: "Optional calm cat loop",
    url: assetUrl("amb_cat_purr_01.wav"),
    bus: "ambience",
    loop: true,
    bytes: 498_694,
    sha256: "7f06368e25e6a7aec9b106c3e2915f236b3fa10b41781733ecc8a1866fc749b9",
    baseGain: 0.35,
    credit: cc0(
      "Cat Purr & Meow",
      "Kerzoven",
      "https://opengameart.org/content/cat-purr-meow",
    ),
  },
  {
    id: "amb_distant_rail_01",
    role: "Distant rail rumble",
    url: assetUrl("amb_distant_rail_01.ogg"),
    bus: "ambience",
    loop: true,
    bytes: 553_831,
    sha256: "fd107cd69bb2204e07325a2505ef2be74d7ba2432b0f3a8763f46c0c1cee4e12",
    baseGain: 0.1,
    credit: cc0(
      "underwater or space engine rumble",
      "gmason",
      "https://opengameart.org/content/underwater-or-space-engine-rumble",
    ),
  },
  {
    id: "sfx_pickup_generic_000",
    role: "Object pickup",
    url: assetUrl("sfx_pickup_generic_000.ogg"),
    bus: "effects",
    loop: false,
    bytes: 5_827,
    sha256: "f0e982611e97512fee5f777986b67e8b435434b601f94992ec044f7e89fb5acb",
    baseGain: 0.75,
    credit: cc0(
      "Impact Sounds 1.0",
      "Kenney",
      "https://kenney.nl/assets/impact-sounds",
    ),
  },
  {
    id: "sfx_give_soft_001",
    role: "Give or soft drop",
    url: assetUrl("sfx_give_soft_001.ogg"),
    bus: "effects",
    loop: false,
    bytes: 5_506,
    sha256: "7642a4fd43e547afe4f7adfadb3dabb681c0ff512f52c1674bae30a726841faf",
    baseGain: 0.7,
    credit: cc0(
      "Impact Sounds 1.0",
      "Kenney",
      "https://kenney.nl/assets/impact-sounds",
    ),
  },
  {
    id: "sfx_clue_wood_001",
    role: "Clue impact",
    url: assetUrl("sfx_clue_wood_001.ogg"),
    bus: "effects",
    loop: false,
    bytes: 6_373,
    sha256: "4b76bf3ccc8e60d19188f3165b778a7817786faa6887c55d9049bcbeef3b425f",
    baseGain: 0.7,
    credit: cc0(
      "Impact Sounds 1.0",
      "Kenney",
      "https://kenney.nl/assets/impact-sounds",
    ),
  },
  {
    id: "sfx_correct_001",
    role: "Correct feedback",
    url: assetUrl("sfx_correct_001.ogg"),
    bus: "effects",
    loop: false,
    bytes: 8_968,
    sha256: "063564703b6094d70718a3e787a55cc9141611e4ecd6b6637f8828f79b4a8c3a",
    baseGain: 0.75,
    credit: cc0(
      "Interface Sounds 1.0",
      "Kenney",
      "https://kenney.nl/assets/interface-sounds",
    ),
  },
  {
    id: "sfx_incorrect_004",
    role: "Incorrect feedback",
    url: assetUrl("sfx_incorrect_004.ogg"),
    bus: "effects",
    loop: false,
    bytes: 6_393,
    sha256: "0b574cea597d96507e782ae9764f88482ce49f46e931e57054bf7150047f2d69",
    baseGain: 0.7,
    credit: cc0(
      "Interface Sounds 1.0",
      "Kenney",
      "https://kenney.nl/assets/interface-sounds",
    ),
  },
  {
    id: "sfx_neutral_001",
    role: "Neutral UI feedback",
    url: assetUrl("sfx_neutral_001.ogg"),
    bus: "effects",
    loop: false,
    bytes: 5_468,
    sha256: "aec0c31ea934a35936ae0d2ab8fac8123c93aa5647f935853a58dbaf90278b7a",
    baseGain: 0.65,
    credit: cc0(
      "Interface Sounds 1.0",
      "Kenney",
      "https://kenney.nl/assets/interface-sounds",
    ),
  },
  {
    id: "amb_store_hum_01",
    role: "Store room tone",
    url: assetUrl("amb_store_hum_01.wav"),
    bus: "ambience",
    loop: true,
    bytes: 1_152_044,
    sha256: "4e82d3c7abbcec1c2f3b7c375d5cf783a73d1a6afa1bf2ed937f35e08e0e153f",
    baseGain: 0.25,
    credit: authored,
  },
  {
    id: "cue_station_chime_01",
    role: "Original distant-station chime",
    url: assetUrl("cue_station_chime_01.wav"),
    bus: "effects",
    loop: false,
    bytes: 268_844,
    sha256: "b7341a20c1e3cd6495ac2f3aac93c0d40811e9ac9de672e3a15a8be3bda907ab",
    baseGain: 0.45,
    credit: authored,
  },
  {
    id: "music_tension_pulse_01",
    role: "Tension pulse",
    url: assetUrl("music_tension_pulse_01.wav"),
    bus: "music",
    loop: false,
    bytes: 480_044,
    sha256: "21eb08f2b46504ad484856b202890abf8d1e5de6143674d7942e90521c92346a",
    baseGain: 0.65,
    credit: authored,
  },
  {
    id: "music_resolution_sting_01",
    role: "Resolution sting",
    url: assetUrl("music_resolution_sting_01.wav"),
    bus: "music",
    loop: false,
    bytes: 264_044,
    sha256: "df31d79d0c59f3ba5b5505e0f39ec6c3849d67e5a26cd9075f81d610dc0777f9",
    baseGain: 0.65,
    credit: authored,
  },
] as const satisfies readonly NonSpeechAudioAsset[];

export type NonSpeechAudioAssetId =
  (typeof NON_SPEECH_AUDIO_ASSETS)[number]["id"];

const registry = new Map<string, NonSpeechAudioAsset>(
  NON_SPEECH_AUDIO_ASSETS.map((asset) => [asset.id, asset]),
);

export function findNonSpeechAudioAsset(
  id: string,
): NonSpeechAudioAsset | undefined {
  return registry.get(id);
}

export const PARK_AMBIENCE_ASSET_IDS = [
  "amb_rain_03",
  "amb_distant_road_01",
  "amb_distant_rail_01",
] as const satisfies readonly NonSpeechAudioAssetId[];

export const FIRST_INTERACTION_PRELOAD_IDS = [
  "amb_rain_03",
  "sfx_footstep_01",
] as const satisfies readonly NonSpeechAudioAssetId[];
