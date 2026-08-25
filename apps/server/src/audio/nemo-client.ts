import { performance } from "node:perf_hooks";

import { SpeechAudioError } from "./errors.js";
import type { SpeechVoiceProfile } from "./voice-profiles.js";

const ENGINE_ORIGIN = "http://127.0.0.1:50121";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_QUERY_BYTES = 1024 * 1024;
const MAX_WAV_BYTES = 5 * 1024 * 1024;

export interface NemoGenerationResult {
  queryBytes: Uint8Array;
  wavBytes: Uint8Array;
  engineVersion: string;
  engineManifestUuid: string;
  speakerUuid: string;
  styleId: number;
  elapsedMs: number;
}

export class NemoClient {
  constructor(
    private readonly fetchImplementation: typeof fetch = fetch,
    private readonly origin = ENGINE_ORIGIN,
  ) {}

  async generate(
    profile: SpeechVoiceProfile,
    textJa: string,
  ): Promise<NemoGenerationResult> {
    const startedAt = performance.now();
    const [version, manifest, speakers] = await Promise.all([
      this.json("/version", "GET", 32 * 1024),
      this.json("/engine_manifest", "GET", 1024 * 1024),
      this.json("/speakers", "GET", 512 * 1024),
    ]);
    if (version !== profile.engine.version) {
      throw identityMismatch("Nemo engine version does not match the profile.");
    }
    const manifestUuid = recordString(manifest, "uuid");
    if (manifestUuid !== profile.engine.manifestUuid) {
      throw identityMismatch(
        "Nemo engine manifest does not match the profile.",
      );
    }
    const speaker = findSpeaker(speakers, profile.speakerUuid);
    if (
      speaker.version !== profile.modelVersion ||
      !speaker.styleIds.includes(profile.styleId)
    ) {
      throw identityMismatch(
        "Nemo speaker model or style does not match the profile.",
      );
    }

    const queryUrl = new URL("/audio_query", this.origin);
    queryUrl.searchParams.set("text", textJa);
    queryUrl.searchParams.set("speaker", String(profile.styleId));
    const queryBytes = await this.bytes(
      queryUrl,
      { method: "POST" },
      MAX_QUERY_BYTES,
      "SPEECH_QUERY_FAILED",
    );
    const query = parseJson(queryBytes, "SPEECH_QUERY_INVALID");
    if (
      recordNumber(query, "outputSamplingRate") !== 24_000 ||
      recordBoolean(query, "outputStereo") !== false
    ) {
      throw new SpeechAudioError(
        "SPEECH_QUERY_OUTPUT_MISMATCH",
        "Nemo query did not preserve the approved 24 kHz mono output.",
      );
    }

    const synthesisUrl = new URL("/synthesis", this.origin);
    synthesisUrl.searchParams.set("speaker", String(profile.styleId));
    const wavBytes = await this.bytes(
      synthesisUrl,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: queryBytes,
      },
      MAX_WAV_BYTES,
      "SPEECH_SYNTHESIS_FAILED",
    );
    return {
      queryBytes,
      wavBytes,
      engineVersion: version,
      engineManifestUuid: manifestUuid,
      speakerUuid: profile.speakerUuid,
      styleId: profile.styleId,
      elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
    };
  }

  private async json(
    path: string,
    method: "GET",
    maximumBytes: number,
  ): Promise<unknown> {
    return parseJson(
      await this.bytes(
        new URL(path, this.origin),
        { method },
        maximumBytes,
        "SPEECH_ENGINE_IDENTITY_UNAVAILABLE",
      ),
      "SPEECH_ENGINE_IDENTITY_INVALID",
    );
  }

  private async bytes(
    url: URL,
    init: RequestInit,
    maximumBytes: number,
    failureCode: string,
  ): Promise<Uint8Array> {
    let response: Response;
    try {
      response = await this.fetchImplementation(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new SpeechAudioError(
        "SPEECH_ENGINE_UNAVAILABLE",
        "The qualified local Nemo engine is unavailable on loopback.",
        503,
      );
    }
    if (!response.ok) {
      throw new SpeechAudioError(
        failureCode,
        `The qualified local Nemo engine returned HTTP ${response.status}.`,
        502,
      );
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > maximumBytes) {
      throw new SpeechAudioError(
        "SPEECH_ENGINE_RESPONSE_TOO_LARGE",
        "Nemo response exceeds the approved size limit.",
        502,
      );
    }
    let bytes: Uint8Array;
    try {
      bytes = await readBoundedResponse(response, maximumBytes);
    } catch (error) {
      if (error instanceof SpeechAudioError) throw error;
      throw new SpeechAudioError(
        "SPEECH_ENGINE_UNAVAILABLE",
        "The qualified local Nemo response was interrupted.",
        503,
      );
    }
    if (bytes.byteLength === 0) {
      throw new SpeechAudioError(
        "SPEECH_ENGINE_RESPONSE_INVALID",
        "Nemo response is empty.",
        502,
      );
    }
    return bytes;
  }
}

async function readBoundedResponse(
  response: Response,
  maximumBytes: number,
): Promise<Uint8Array> {
  if (response.body === null) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel().catch(() => undefined);
      throw new SpeechAudioError(
        "SPEECH_ENGINE_RESPONSE_TOO_LARGE",
        "Nemo response exceeds the approved size limit.",
        502,
      );
    }
    chunks.push(chunk.value);
  }
  return Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk)),
    total,
  );
}

function parseJson(bytes: Uint8Array, code: string): unknown {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown;
  } catch {
    throw new SpeechAudioError(code, "Nemo returned invalid JSON.", 502);
  }
}

function findSpeaker(
  input: unknown,
  speakerUuid: string,
): { version: string; styleIds: number[] } {
  if (!Array.isArray(input))
    throw identityMismatch("Nemo speakers are invalid.");
  for (const candidate of input) {
    if (!isRecord(candidate) || candidate.speaker_uuid !== speakerUuid)
      continue;
    if (
      typeof candidate.version !== "string" ||
      !Array.isArray(candidate.styles)
    ) {
      break;
    }
    const styleIds = candidate.styles.flatMap((style) =>
      isRecord(style) && typeof style.id === "number" ? [style.id] : [],
    );
    return { version: candidate.version, styleIds };
  }
  throw identityMismatch("Nemo speaker UUID is not installed.");
}

function recordString(input: unknown, key: string): string {
  if (!isRecord(input) || typeof input[key] !== "string") {
    throw identityMismatch(`Nemo identity field '${key}' is invalid.`);
  }
  return input[key];
}

function recordNumber(input: unknown, key: string): number {
  if (!isRecord(input) || typeof input[key] !== "number") {
    throw new SpeechAudioError(
      "SPEECH_QUERY_INVALID",
      `Nemo query field '${key}' is invalid.`,
      502,
    );
  }
  return input[key];
}

function recordBoolean(input: unknown, key: string): boolean {
  if (!isRecord(input) || typeof input[key] !== "boolean") {
    throw new SpeechAudioError(
      "SPEECH_QUERY_INVALID",
      `Nemo query field '${key}' is invalid.`,
      502,
    );
  }
  return input[key];
}

function identityMismatch(message: string): SpeechAudioError {
  return new SpeechAudioError("SPEECH_ENGINE_IDENTITY_MISMATCH", message, 409);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
