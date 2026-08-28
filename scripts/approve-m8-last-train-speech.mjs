import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const SERVER_ORIGIN = "http://127.0.0.1:3000";
const REVIEW_PATH = new URL(
  "../docs/lesson-content/M8_LAST_TRAIN_SPEECH_REVIEW_2026-08-27.json",
  import.meta.url,
);
const APPROVAL_PATH = new URL(
  "../docs/lesson-content/M8_LAST_TRAIN_SPEECH_APPROVAL_2026-08-28.json",
  import.meta.url,
);

const reviewBytes = await readFile(REVIEW_PATH);
const review = JSON.parse(reviewBytes.toString("utf8"));
const approval = JSON.parse(await readFile(APPROVAL_PATH, "utf8"));
const reviewSha256 = createHash("sha256").update(reviewBytes).digest("hex");

assertEqual(
  approval.packetFormat,
  "bunbun_m8_last_train_speech_approval",
  "packetFormat",
);
assertEqual(approval.status, "APPROVED_BY_USER", "status");
assertEqual(approval.reviewPacketSha256, reviewSha256, "reviewPacketSha256");
assertEqual(approval.lessonId, review.lessonId, "lessonId");
assertEqual(approval.revision, review.revision, "revision");
assertEqual(approval.approvalAuthority.speechReady, true, "speechReady");
assertEqual(
  approval.approvalAuthority.runtimeActivation,
  true,
  "runtimeActivation",
);
assertEqual(
  approval.approvalAuthority.compilerIntegration,
  false,
  "compilerIntegration",
);
assertEqual(
  approval.approvedAssets.length,
  review.assets.length,
  "approvedAssets.length",
);

for (const [index, asset] of approval.approvedAssets.entries()) {
  const reviewed = review.assets[index];
  assertEqual(
    asset.audioAssetId,
    reviewed.audioAssetId,
    `approvedAssets[${index}].audioAssetId`,
  );
  assertEqual(
    asset.cacheKey,
    reviewed.cacheKey,
    `approvedAssets[${index}].cacheKey`,
  );
  assertEqual(
    asset.wavSha256,
    reviewed.wavSha256,
    `approvedAssets[${index}].wavSha256`,
  );
}

const listed = await request("/api/v1/audio/speech/jobs", "GET");
for (const approved of approval.approvedAssets) {
  const current = listed.assets.find(
    (asset) => asset.cacheKey === approved.cacheKey,
  );
  if (current === undefined) {
    throw new Error(`Approved speech row '${approved.cacheKey}' is missing.`);
  }
  assertEqual(
    current.wavSha256,
    approved.wavSha256,
    `${approved.audioAssetId}.wavSha256`,
  );
  if (current.status === "READY") continue;
  assertEqual(
    current.status,
    "REVIEW_REQUIRED",
    `${approved.audioAssetId}.status`,
  );
  await request(
    `/api/v1/audio/speech/jobs/${encodeURIComponent(approved.cacheKey)}/review`,
    "POST",
    { decision: "APPROVE", confirmation: "APPROVE_REVIEWED_SPEECH" },
  );
}

const promoted = await request("/api/v1/audio/speech/jobs", "GET");
const result = approval.approvedAssets.map((approved) => {
  const asset = promoted.assets.find(
    (item) => item.cacheKey === approved.cacheKey,
  );
  assertEqual(
    asset?.status,
    "READY",
    `${approved.audioAssetId}.promotedStatus`,
  );
  assertEqual(
    asset?.wavSha256,
    approved.wavSha256,
    `${approved.audioAssetId}.promotedWavSha256`,
  );
  return {
    audioAssetId: approved.audioAssetId,
    cacheKey: approved.cacheKey,
    wavSha256: approved.wavSha256,
    status: asset.status,
  };
});

console.log(
  JSON.stringify(
    {
      status: "APPROVED_BY_USER",
      reviewPacketSha256: reviewSha256,
      promotedAssets: result,
      runtimeActivationAuthorized: true,
      compilerIntegrationAuthorized: false,
    },
    null,
    2,
  ),
);

async function request(path, method, body) {
  const response = await fetch(`${SERVER_ORIGIN}${path}`, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const value = await response.json();
  if (!response.ok) {
    throw new Error(
      `${response.status} ${value.code ?? "REQUEST_FAILED"}: ${value.message ?? "Local request failed."}`,
    );
  }
  return value;
}

function assertEqual(actual, expected, field) {
  if (actual !== expected) {
    throw new Error(
      `${field} mismatch: expected ${String(expected)}, received ${String(actual)}.`,
    );
  }
}
