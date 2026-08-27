import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { validateM8NonSpeechApproval } from "./validate-m8-non-speech-approval.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const RUNTIME_AUDIO_ROOT = path.join(
  REPOSITORY_ROOT,
  "apps/web/src/assets/audio/non-speech/v1",
);

export async function validateM8RuntimeAudio() {
  const { approvedCandidates, rejectedCandidates } =
    await validateM8NonSpeechApproval();
  const expectedFiles = new Map(
    approvedCandidates.map((candidate) => {
      const extension = path.extname(candidate.relativePath);
      return [`${candidate.id}${extension}`, candidate];
    }),
  );
  const actualFiles = (await readdir(RUNTIME_AUDIO_ROOT)).sort();
  if (actualFiles.length !== expectedFiles.size) {
    throw new Error(
      `Runtime audio contains ${actualFiles.length} files; expected ${expectedFiles.size}.`,
    );
  }

  let totalBytes = 0;
  for (const filename of actualFiles) {
    const candidate = expectedFiles.get(filename);
    if (!candidate) throw new Error(`Unapproved runtime file: ${filename}`);
    const filePath = path.join(RUNTIME_AUDIO_ROOT, filename);
    const [bytes, metadata] = await Promise.all([
      readFile(filePath),
      stat(filePath),
    ]);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== candidate.sha256) {
      throw new Error(`Runtime hash mismatch for ${candidate.id}.`);
    }
    if (metadata.size !== candidate.media.bytes) {
      throw new Error(`Runtime byte count mismatch for ${candidate.id}.`);
    }
    totalBytes += metadata.size;
  }

  for (const candidate of rejectedCandidates) {
    const extension = path.extname(candidate.relativePath);
    if (actualFiles.includes(`${candidate.id}${extension}`)) {
      throw new Error(`Rejected candidate was promoted: ${candidate.id}`);
    }
  }
  if (totalBytes > 6 * 1024 * 1024) {
    throw new Error(
      "Runtime audio exceeds the approved 6 MiB encoded ceiling.",
    );
  }

  return { approvedFiles: actualFiles.length, totalBytes };
}

async function main() {
  const result = await validateM8RuntimeAudio();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
