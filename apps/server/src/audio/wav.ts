import { SpeechAudioError } from "./errors.js";

const MAX_WAV_BYTES = 5 * 1024 * 1024;
const MAX_DURATION_MS = 60_000;

export interface WavMetadata {
  sampleRateHz: 24_000;
  channels: 1;
  bitsPerSample: 16;
  dataBytes: number;
  durationMs: number;
}

export function validateSpeechWav(bytes: Uint8Array): WavMetadata {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (buffer.byteLength < 44 || buffer.byteLength > MAX_WAV_BYTES) {
    throw invalidWav("WAV size is outside the approved bounds.");
  }
  if (
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw invalidWav("Expected one RIFF/WAVE file.");
  }

  let offset = 12;
  let format:
    | {
        audioFormat: number;
        channels: number;
        sampleRateHz: number;
        bitsPerSample: number;
      }
    | undefined;
  let dataBytes: number | undefined;
  while (offset + 8 <= buffer.byteLength) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + size;
    if (dataEnd > buffer.byteLength) {
      throw invalidWav("WAV chunk exceeds the file boundary.");
    }
    if (id === "fmt ") {
      if (size < 16) throw invalidWav("WAV fmt chunk is incomplete.");
      format = {
        audioFormat: buffer.readUInt16LE(dataStart),
        channels: buffer.readUInt16LE(dataStart + 2),
        sampleRateHz: buffer.readUInt32LE(dataStart + 4),
        bitsPerSample: buffer.readUInt16LE(dataStart + 14),
      };
    } else if (id === "data") {
      dataBytes = size;
    }
    offset = dataEnd + (size % 2);
  }

  if (format === undefined || dataBytes === undefined || dataBytes === 0) {
    throw invalidWav("WAV is missing a non-empty fmt or data chunk.");
  }
  if (
    format.audioFormat !== 1 ||
    format.channels !== 1 ||
    format.sampleRateHz !== 24_000 ||
    format.bitsPerSample !== 16
  ) {
    throw invalidWav("Expected 24 kHz, 16-bit, mono PCM WAV.");
  }
  const durationMs = Math.round(
    (dataBytes / (format.sampleRateHz * format.channels * 2)) * 1_000,
  );
  if (durationMs <= 0 || durationMs > MAX_DURATION_MS) {
    throw invalidWav("WAV duration is outside the approved bounds.");
  }
  return {
    sampleRateHz: 24_000,
    channels: 1,
    bitsPerSample: 16,
    dataBytes,
    durationMs,
  };
}

function invalidWav(message: string): SpeechAudioError {
  return new SpeechAudioError("SPEECH_WAV_INVALID", message);
}
