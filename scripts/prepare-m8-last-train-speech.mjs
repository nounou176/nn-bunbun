import { readFile } from "node:fs/promises";

const SERVER_ORIGIN = "http://127.0.0.1:3000";
const MANIFEST_PATH = new URL(
  "../packages/contracts/fixtures/manifests/m8-last-train.json",
  import.meta.url,
);

const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
const mode = process.argv[2] ?? "prepare";
if (mode !== "prepare" && mode !== "generate") {
  throw new Error(
    "Usage: node scripts/prepare-m8-last-train-speech.mjs [prepare|generate]",
  );
}

const prepared = await request("/api/v1/audio/speech/jobs", "POST", {
  lessonId: manifest.lessonId,
  revision: manifest.revision,
  audioAssets: manifest.audioAssets,
});

const result =
  mode === "generate"
    ? await request("/api/v1/audio/speech/run", "POST", {
        confirmation: "GENERATE_LOCAL_SPEECH",
      })
    : prepared;
const expectedKeys = new Set(
  manifest.audioAssets.map((asset) => asset.cacheKey),
);
const assets = result.assets
  .filter((asset) => expectedKeys.has(asset.cacheKey))
  .map((asset) => ({
    cacheKey: asset.cacheKey,
    voiceProfileId: asset.voiceProfileId,
    status: asset.status,
    durationMs: asset.durationMs ?? null,
    querySha256: asset.querySha256 ?? null,
    wavSha256: asset.wavSha256 ?? null,
    byteLength: asset.byteLength ?? null,
    credit: asset.credit,
  }));

if (assets.length !== manifest.audioAssets.length) {
  throw new Error(
    `Expected ${manifest.audioAssets.length} last-train assets, received ${assets.length}.`,
  );
}
console.log(
  JSON.stringify({ mode, lessonId: manifest.lessonId, assets }, null, 2),
);

async function request(path, method, body) {
  const response = await fetch(`${SERVER_ORIGIN}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok) {
    throw new Error(
      `${response.status} ${value.code ?? "REQUEST_FAILED"}: ${value.message ?? "Local request failed."}`,
    );
  }
  return value;
}
