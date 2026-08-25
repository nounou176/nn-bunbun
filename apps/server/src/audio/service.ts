import { createHash, randomUUID } from "node:crypto";
import {
  access,
  link,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { AudioAsset } from "@bunbun/contracts";

import { assertSpeechCacheKey, speechCacheIdentity } from "./cache-key.js";
import { SpeechAudioError } from "./errors.js";
import { NemoClient } from "./nemo-client.js";
import {
  SpeechRepository,
  type RunningSpeechAsset,
  type SpeechAssetView,
} from "./repository.js";
import { validateSpeechWav } from "./wav.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const MAX_ASSETS_PER_ENQUEUE = 60;
const MAX_CACHE_BYTES = 512 * 1024 * 1024;
const MAX_QUERY_BYTES = 1024 * 1024;
const MAX_WAV_BYTES = 5 * 1024 * 1024;

export const DEFAULT_AUDIO_CACHE_ROOT = fileURLToPath(
  new URL("../../../../.bunbun-data/audio-cache/v1/", import.meta.url),
);

export interface SpeechArtifact {
  bytes: Buffer;
  sha256: string;
  durationMs: number;
  credit: "VOICEVOX Nemo";
}

export class SpeechService {
  private drainPromise: Promise<void> | undefined;

  constructor(
    private readonly repository: SpeechRepository,
    private readonly client: Pick<NemoClient, "generate"> = new NemoClient(),
    private readonly cacheRoot = DEFAULT_AUDIO_CACHE_ROOT,
    private readonly maxCacheBytes = MAX_CACHE_BYTES,
  ) {}

  enqueue(input: unknown): SpeechAssetView[] {
    const request = parseEnqueue(input);
    return this.repository.enqueue(
      request.lessonId,
      request.revision,
      request.audioAssets,
    );
  }

  list(): SpeechAssetView[] {
    return this.repository.list();
  }

  retry(cacheKey: string): SpeechAssetView {
    assertSpeechCacheKey(cacheKey);
    return this.repository.retry(cacheKey);
  }

  async runPending(): Promise<SpeechAssetView[]> {
    if (this.drainPromise === undefined) {
      this.drainPromise = this.drain().finally(() => {
        this.drainPromise = undefined;
      });
    }
    await this.drainPromise;
    return this.list();
  }

  async review(
    cacheKey: string,
    decision: "APPROVE" | "REJECT",
  ): Promise<SpeechAssetView> {
    assertSpeechCacheKey(cacheKey);
    if (decision === "REJECT") return this.repository.reject(cacheKey);
    await this.verifyQueryArtifact(cacheKey);
    const artifact = await this.readArtifact(cacheKey, true);
    if (artifact.bytes.byteLength === 0) {
      throw new SpeechAudioError(
        "SPEECH_ARTIFACT_INVALID",
        "Speech artifact cannot be approved.",
        409,
      );
    }
    const row = this.repository.artifact(cacheKey, true);
    return this.repository.approve(
      cacheKey,
      row.query_relative_path!,
      row.wav_relative_path!,
    );
  }

  preview(cacheKey: string): Promise<SpeechArtifact> {
    assertSpeechCacheKey(cacheKey);
    return this.readArtifact(cacheKey, true);
  }

  ready(cacheKey: string): Promise<SpeechArtifact> {
    assertSpeechCacheKey(cacheKey);
    return this.readArtifact(cacheKey, false);
  }

  async purge(): Promise<void> {
    await assertCacheRootSafe(this.cacheRoot);
    this.repository.purge();
    await rm(this.cacheRoot, { recursive: true, force: true });
  }

  private async drain(): Promise<void> {
    await ensureCacheRoot(this.cacheRoot);
    while (true) {
      const pending = this.repository.nextPending();
      if (pending === undefined) return;
      const running = this.repository.start(pending.cacheKey);
      await this.generate(running);
    }
  }

  private async generate(running: RunningSpeechAsset): Promise<void> {
    const identity = speechCacheIdentity({
      textJa: running.textJa,
      voiceProfileId: running.voiceProfileId,
    });
    if (
      identity.cacheKey !== running.cacheKey ||
      identity.canonicalInput !== running.canonicalInput
    ) {
      this.repository.fail(running, {
        elapsedMs: 0,
        failureCode: "SPEECH_CACHE_IDENTITY_DRIFT",
      });
      return;
    }
    const paths = artifactPaths(running.cacheKey);
    const queryPath = resolveCachePath(this.cacheRoot, paths.queryRelativePath);
    const wavPath = resolveCachePath(this.cacheRoot, paths.wavRelativePath);
    let queryWritten = false;
    let wavWritten = false;
    try {
      if (
        (await directorySize(this.cacheRoot)) +
          MAX_QUERY_BYTES +
          MAX_WAV_BYTES >
        this.maxCacheBytes
      ) {
        throw new SpeechAudioError(
          "SPEECH_CACHE_LIMIT_REACHED",
          "The 512 MiB speech cache limit has been reached.",
          507,
        );
      }
      const generated = await this.client.generate(
        identity.profile,
        running.textJa,
      );
      const wav = validateSpeechWav(generated.wavBytes);
      const querySha256 = sha256(generated.queryBytes);
      const wavSha256 = sha256(generated.wavBytes);
      await atomicWrite(queryPath, generated.queryBytes);
      queryWritten = true;
      await atomicWrite(wavPath, generated.wavBytes);
      wavWritten = true;
      this.repository.succeed(running, {
        engineVersion: generated.engineVersion,
        engineManifestUuid: generated.engineManifestUuid,
        speakerUuid: generated.speakerUuid,
        styleId: generated.styleId,
        querySha256,
        wavSha256,
        queryRelativePath: paths.queryRelativePath,
        wavRelativePath: paths.wavRelativePath,
        durationMs: wav.durationMs,
        byteLength: generated.wavBytes.byteLength,
        elapsedMs: generated.elapsedMs,
      });
    } catch (error) {
      await Promise.all([
        ...(queryWritten ? [rm(queryPath, { force: true })] : []),
        ...(wavWritten ? [rm(wavPath, { force: true })] : []),
      ]).catch(() => undefined);
      const speechError =
        error instanceof SpeechAudioError
          ? error
          : new SpeechAudioError(
              "SPEECH_GENERATION_FAILED",
              "Local speech generation failed.",
              500,
            );
      this.repository.fail(running, {
        elapsedMs: 0,
        failureCode: speechError.code,
      });
    }
  }

  private async readArtifact(
    cacheKey: string,
    allowReview: boolean,
  ): Promise<SpeechArtifact> {
    const row = this.repository.artifact(cacheKey, allowReview);
    const path = resolveCachePath(this.cacheRoot, row.wav_relative_path!);
    let bytes: Buffer;
    try {
      bytes = await readFile(path);
    } catch {
      throw new SpeechAudioError(
        "SPEECH_ARTIFACT_MISSING",
        "Speech WAV is missing from the local cache.",
        404,
      );
    }
    const actualSha256 = sha256(bytes);
    if (actualSha256 !== row.wav_sha256) {
      throw new SpeechAudioError(
        "SPEECH_ARTIFACT_HASH_MISMATCH",
        "Speech WAV no longer matches its reviewed hash.",
        409,
      );
    }
    const metadata = validateSpeechWav(bytes);
    return {
      bytes,
      sha256: actualSha256,
      durationMs: metadata.durationMs,
      credit: "VOICEVOX Nemo",
    };
  }

  private async verifyQueryArtifact(cacheKey: string): Promise<void> {
    const row = this.repository.artifact(cacheKey, true);
    if (row.query_relative_path === null || row.query_sha256 === null) {
      throw new SpeechAudioError(
        "SPEECH_QUERY_ARTIFACT_MISSING",
        "Speech query is missing from the local cache.",
        404,
      );
    }
    const path = resolveCachePath(this.cacheRoot, row.query_relative_path);
    let bytes: Buffer;
    try {
      bytes = await readFile(path);
    } catch {
      throw new SpeechAudioError(
        "SPEECH_QUERY_ARTIFACT_MISSING",
        "Speech query is missing from the local cache.",
        404,
      );
    }
    if (
      bytes.byteLength === 0 ||
      bytes.byteLength > MAX_QUERY_BYTES ||
      sha256(bytes) !== row.query_sha256
    ) {
      throw new SpeechAudioError(
        "SPEECH_QUERY_ARTIFACT_MISMATCH",
        "Speech query no longer matches its generated hash.",
        409,
      );
    }
    try {
      JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new SpeechAudioError(
        "SPEECH_QUERY_ARTIFACT_INVALID",
        "Speech query is no longer valid JSON.",
        409,
      );
    }
  }
}

function parseEnqueue(input: unknown): {
  lessonId: string;
  revision: number;
  audioAssets: AudioAsset[];
} {
  const record = exactRecord(input, ["lessonId", "revision", "audioAssets"]);
  if (
    typeof record.lessonId !== "string" ||
    record.lessonId.length > 64 ||
    !ID_PATTERN.test(record.lessonId)
  ) {
    throw invalidRequest("lessonId must be a valid Bunbun ID.");
  }
  if (!Number.isInteger(record.revision) || Number(record.revision) < 1) {
    throw invalidRequest("revision must be a positive integer.");
  }
  if (
    !Array.isArray(record.audioAssets) ||
    record.audioAssets.length === 0 ||
    record.audioAssets.length > MAX_ASSETS_PER_ENQUEUE
  ) {
    throw invalidRequest("audioAssets must contain between 1 and 60 items.");
  }
  return {
    lessonId: record.lessonId,
    revision: Number(record.revision),
    audioAssets: record.audioAssets.map(parseAudioAsset),
  };
}

function parseAudioAsset(input: unknown): AudioAsset {
  if (!isRecord(input)) throw invalidRequest("Audio asset must be an object.");
  const allowed = new Set([
    "audioAssetId",
    "textJa",
    "voiceProfileId",
    "cacheKey",
    "durationMs",
  ]);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw invalidRequest("Audio asset contains an unknown field.");
  }
  if (
    typeof input.audioAssetId !== "string" ||
    input.audioAssetId.length > 64 ||
    !ID_PATTERN.test(input.audioAssetId) ||
    typeof input.voiceProfileId !== "string" ||
    input.voiceProfileId.length > 64 ||
    !ID_PATTERN.test(input.voiceProfileId) ||
    typeof input.textJa !== "string" ||
    input.textJa.length === 0 ||
    input.textJa.length > 500 ||
    !/\S/u.test(input.textJa) ||
    typeof input.cacheKey !== "string"
  ) {
    throw invalidRequest("Audio asset fields are invalid.");
  }
  if (
    input.durationMs !== undefined &&
    (!Number.isInteger(input.durationMs) || Number(input.durationMs) < 1)
  ) {
    throw invalidRequest("Audio duration must be a positive integer.");
  }
  return {
    audioAssetId: input.audioAssetId,
    textJa: input.textJa,
    voiceProfileId: input.voiceProfileId,
    cacheKey: input.cacheKey,
    ...(input.durationMs === undefined
      ? {}
      : { durationMs: Number(input.durationMs) }),
  };
}

function artifactPaths(cacheKey: string): {
  queryRelativePath: string;
  wavRelativePath: string;
} {
  assertSpeechCacheKey(cacheKey);
  const shard = cacheKey.slice("bunbun_tts_v1_".length, -62);
  return {
    queryRelativePath: `artifacts/${shard}/${cacheKey}.query.json`,
    wavRelativePath: `artifacts/${shard}/${cacheKey}.wav`,
  };
}

async function atomicWrite(path: string, bytes: Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  try {
    await access(path);
    throw new SpeechAudioError(
      "SPEECH_ARTIFACT_ALREADY_EXISTS",
      "Immutable speech artifact already exists.",
      409,
    );
  } catch (error) {
    if (error instanceof SpeechAudioError) throw error;
  }
  const temporary = `${path}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporary, bytes, { flag: "wx" });
    try {
      await link(temporary, path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new SpeechAudioError(
          "SPEECH_ARTIFACT_ALREADY_EXISTS",
          "Immutable speech artifact already exists.",
          409,
        );
      }
      throw error;
    }
    await rm(temporary, { force: true });
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

function resolveCachePath(root: string, relativePath: string): string {
  if (isAbsolute(relativePath)) {
    throw new SpeechAudioError(
      "SPEECH_CACHE_PATH_INVALID",
      "Speech cache path must be relative.",
      500,
    );
  }
  const target = resolve(root, relativePath);
  const relation = relative(resolve(root), target);
  if (relation === "" || relation.startsWith("..") || isAbsolute(relation)) {
    throw new SpeechAudioError(
      "SPEECH_CACHE_PATH_INVALID",
      "Speech cache path escapes its owned root.",
      500,
    );
  }
  return target;
}

async function ensureCacheRoot(root: string): Promise<void> {
  await assertCacheRootSafe(root);
  await mkdir(root, { recursive: true });
}

async function assertCacheRootSafe(root: string): Promise<void> {
  try {
    const info = await lstat(root);
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw new SpeechAudioError(
        "SPEECH_CACHE_ROOT_UNSAFE",
        "Speech cache root must be an owned directory, not a symlink.",
        409,
      );
    }
  } catch (error) {
    if (error instanceof SpeechAudioError) throw error;
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function directorySize(root: string): Promise<number> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const path = resolve(root, entry.name);
      if (entry.isSymbolicLink()) {
        throw new SpeechAudioError(
          "SPEECH_CACHE_ROOT_UNSAFE",
          "Speech cache contains an unexpected symlink.",
          409,
        );
      }
      total += entry.isDirectory()
        ? await directorySize(path)
        : (await stat(path)).size;
    }
    return total;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function exactRecord(
  input: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!isRecord(input))
    throw invalidRequest("Expected one closed JSON object.");
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw invalidRequest(
      `Expected exactly these fields: ${expected.join(", ")}.`,
    );
  }
  return input;
}

function invalidRequest(message: string): SpeechAudioError {
  return new SpeechAudioError("SPEECH_REQUEST_INVALID", message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
