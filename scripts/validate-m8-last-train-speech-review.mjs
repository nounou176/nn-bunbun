import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const CACHE_PREFIX = "bunbun_tts_v1_";
const REVIEW_PATH = resolve(
  "docs/lesson-content/M8_LAST_TRAIN_SPEECH_REVIEW_2026-08-27.json",
);
const APPROVAL_PATH = resolve(
  "docs/lesson-content/M8_LAST_TRAIN_SPEECH_APPROVAL_2026-08-28.json",
);
const MANIFEST_PATH = resolve(
  "packages/contracts/fixtures/manifests/m8-last-train.json",
);
const EXPECTED_CONTENT_SHA256 =
  "5e3cb41ab76b0f02958236c1c2241bc0d6c7e70b35a58996fa9f0072f7c403a6";

const reviewBytes = await readFile(REVIEW_PATH);
const review = JSON.parse(reviewBytes.toString("utf8"));
const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));

assertEqual(
  review.packetFormat,
  "bunbun_m8_last_train_speech_review",
  "packetFormat",
);
assertEqual(review.packetVersion, "1.0.0", "packetVersion");
assertEqual(review.lessonId, manifest.lessonId, "lessonId");
assertEqual(review.revision, manifest.revision, "revision");
assertEqual(
  review.contentProposalSha256,
  EXPECTED_CONTENT_SHA256,
  "contentProposalSha256",
);
assertEqual(review.generator.engine, "VOICEVOX Nemo", "generator.engine");
assertEqual(
  review.generator.engineVersion,
  "0.24.0",
  "generator.engineVersion",
);
assertEqual(review.generator.transport, "loopback-only", "generator.transport");
assertEqual(
  review.generator.runtimeSynthesis,
  false,
  "generator.runtimeSynthesis",
);
assertEqual(
  review.generator.incrementalCostUsd,
  0,
  "generator.incrementalCostUsd",
);
assertEqual(review.assets.length, manifest.audioAssets.length, "assets.length");
assertEqual(
  review.approvalAuthority.speechReady,
  false,
  "approvalAuthority.speechReady",
);
assertEqual(
  review.approvalAuthority.runtimeActivation,
  false,
  "approvalAuthority.runtimeActivation",
);
assertEqual(
  review.approvalAuthority.compilerIntegration,
  false,
  "approvalAuthority.compilerIntegration",
);

for (const [index, manifestAsset] of manifest.audioAssets.entries()) {
  const asset = review.assets[index];
  const field = `assets[${index}]`;
  assertEqual(
    asset.audioAssetId,
    manifestAsset.audioAssetId,
    `${field}.audioAssetId`,
  );
  assertEqual(asset.textJa, manifestAsset.textJa, `${field}.textJa`);
  assertEqual(
    asset.voiceProfileId,
    manifestAsset.voiceProfileId,
    `${field}.voiceProfileId`,
  );
  assertEqual(asset.cacheKey, manifestAsset.cacheKey, `${field}.cacheKey`);
  assertEqual(
    asset.durationMs,
    manifestAsset.durationMs,
    `${field}.durationMs`,
  );
  assertEqual(asset.credit, "VOICEVOX Nemo", `${field}.credit`);
  assertEqual(asset.reviewStatus, "REVIEW_REQUIRED", `${field}.reviewStatus`);

  if (!asset.cacheKey.startsWith(CACHE_PREFIX)) {
    throw new Error(
      `${field}.cacheKey does not use the approved cache prefix.`,
    );
  }
  const shard = asset.cacheKey.slice(
    CACHE_PREFIX.length,
    CACHE_PREFIX.length + 2,
  );
  const base = resolve(
    ".bunbun-data/audio-cache/v1/artifacts",
    shard,
    asset.cacheKey,
  );
  const wavPath = `${base}.wav`;
  const queryPath = `${base}.query.json`;
  assertEqual(await sha256(wavPath), asset.wavSha256, `${field}.wavSha256`);
  assertEqual(
    await sha256(queryPath),
    asset.querySha256,
    `${field}.querySha256`,
  );
  assertEqual(
    (await stat(wavPath)).size,
    asset.byteLength,
    `${field}.byteLength`,
  );
}

const approvalCheck = process.argv[2] === "approval-check";
let approvalSha256;
if (approvalCheck) {
  const approvalBytes = await readFile(APPROVAL_PATH);
  const approval = JSON.parse(approvalBytes.toString("utf8"));
  assertEqual(
    approval.packetFormat,
    "bunbun_m8_last_train_speech_approval",
    "approval.packetFormat",
  );
  assertEqual(approval.packetVersion, "1.0.0", "approval.packetVersion");
  assertEqual(approval.status, "APPROVED_BY_USER", "approval.status");
  assertEqual(
    approval.reviewPacketSha256,
    digest(reviewBytes),
    "approval.reviewPacketSha256",
  );
  assertEqual(approval.lessonId, review.lessonId, "approval.lessonId");
  assertEqual(approval.revision, review.revision, "approval.revision");
  assertEqual(
    approval.approvedAssets.length,
    review.assets.length,
    "approval.approvedAssets.length",
  );
  for (const [index, approved] of approval.approvedAssets.entries()) {
    const reviewed = review.assets[index];
    assertEqual(
      approved.audioAssetId,
      reviewed.audioAssetId,
      `approval.approvedAssets[${index}].audioAssetId`,
    );
    assertEqual(
      approved.cacheKey,
      reviewed.cacheKey,
      `approval.approvedAssets[${index}].cacheKey`,
    );
    assertEqual(
      approved.wavSha256,
      reviewed.wavSha256,
      `approval.approvedAssets[${index}].wavSha256`,
    );
  }
  assertEqual(
    approval.approvalAuthority.speechReady,
    true,
    "approval.speechReady",
  );
  assertEqual(
    approval.approvalAuthority.runtimeActivation,
    true,
    "approval.runtimeActivation",
  );
  assertEqual(
    approval.approvalAuthority.compilerIntegration,
    false,
    "approval.compilerIntegration",
  );
  approvalSha256 = digest(approvalBytes);
}

console.log(
  JSON.stringify(
    {
      status: approvalCheck ? "APPROVED_BY_USER" : "REVIEW_REQUIRED",
      packetPath: REVIEW_PATH,
      packetSha256: digest(reviewBytes),
      contentProposalSha256: EXPECTED_CONTENT_SHA256,
      verifiedAssets: review.assets.length,
      ...(approvalSha256 === undefined ? {} : { approvalSha256 }),
      runtimeActivationAuthorized: approvalCheck,
      compilerIntegrationAuthorized: false,
    },
    null,
    2,
  ),
);

async function sha256(path) {
  return digest(await readFile(path));
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertEqual(actual, expected, field) {
  if (actual !== expected) {
    throw new Error(
      `${field} mismatch: expected ${String(expected)}, received ${String(actual)}.`,
    );
  }
}
