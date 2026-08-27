import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const DEFAULT_PARAMETER_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/audio-sources/M8_AUTHORED_AUDIO_V1.json",
);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function attackReleaseEnvelope(
  elapsedSeconds,
  durationSeconds,
  attackSeconds,
  releaseSeconds,
) {
  if (elapsedSeconds < 0 || elapsedSeconds >= durationSeconds) {
    return 0;
  }

  const attack = Math.min(1, elapsedSeconds / attackSeconds);
  const release = Math.min(
    1,
    (durationSeconds - elapsedSeconds) / releaseSeconds,
  );
  return Math.sin((Math.PI / 2) * Math.min(attack, release));
}

function renderStoreHum(definition, sampleRate) {
  const samples = new Float64Array(
    Math.round(definition.durationSeconds * sampleRate),
  );
  const { fundamentalHz, modulationHz, harmonicGains } = definition.parameters;

  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    const modulation =
      0.86 + 0.14 * Math.sin(2 * Math.PI * modulationHz * time);
    let sample = 0;

    for (let harmonic = 0; harmonic < harmonicGains.length; harmonic += 1) {
      sample +=
        harmonicGains[harmonic] *
        Math.sin(2 * Math.PI * fundamentalHz * (harmonic + 1) * time);
    }

    const ventilation =
      0.08 * Math.sin(2 * Math.PI * 18 * time) +
      0.04 * Math.sin(2 * Math.PI * 30 * time + Math.PI / 3);
    samples[index] = modulation * sample + ventilation;
  }

  return samples;
}

function addBellTone(samples, sampleRate, startSeconds, frequency, duration) {
  const startIndex = Math.round(startSeconds * sampleRate);
  const endIndex = Math.min(
    samples.length,
    startIndex + Math.round(duration * sampleRate),
  );

  for (let index = startIndex; index < endIndex; index += 1) {
    const elapsed = (index - startIndex) / sampleRate;
    const envelope =
      attackReleaseEnvelope(elapsed, duration, 0.018, 0.42) *
      Math.exp(-1.35 * elapsed);
    samples[index] +=
      envelope *
      (Math.sin(2 * Math.PI * frequency * elapsed) +
        0.24 * Math.sin(2 * Math.PI * frequency * 2.01 * elapsed) +
        0.08 * Math.sin(2 * Math.PI * frequency * 3.97 * elapsed));
  }
}

function renderStationChime(definition, sampleRate) {
  const samples = new Float64Array(
    Math.round(definition.durationSeconds * sampleRate),
  );
  const { firstHz, secondHz, secondStartSeconds, toneDurationSeconds } =
    definition.parameters;
  addBellTone(samples, sampleRate, 0, firstHz, toneDurationSeconds);
  addBellTone(
    samples,
    sampleRate,
    secondStartSeconds,
    secondHz,
    toneDurationSeconds,
  );
  return samples;
}

function renderTensionPulse(definition, sampleRate) {
  const samples = new Float64Array(
    Math.round(definition.durationSeconds * sampleRate),
  );
  const { pulseHz, upperHz, pulseIntervalSeconds, pulseDurationSeconds } =
    definition.parameters;

  for (
    let pulseStart = 0;
    pulseStart < definition.durationSeconds;
    pulseStart += pulseIntervalSeconds
  ) {
    const startIndex = Math.round(pulseStart * sampleRate);
    const endIndex = Math.min(
      samples.length,
      startIndex + Math.round(pulseDurationSeconds * sampleRate),
    );

    for (let index = startIndex; index < endIndex; index += 1) {
      const elapsed = (index - startIndex) / sampleRate;
      const envelope =
        attackReleaseEnvelope(elapsed, pulseDurationSeconds, 0.035, 0.22) *
        Math.exp(-2.1 * elapsed);
      samples[index] +=
        envelope *
        (Math.sin(2 * Math.PI * pulseHz * elapsed) +
          0.38 * Math.sin(2 * Math.PI * upperHz * elapsed));
    }
  }

  return samples;
}

function addChord(samples, sampleRate, startSeconds, frequencies) {
  const startIndex = Math.round(startSeconds * sampleRate);
  const duration = samples.length / sampleRate - startSeconds;

  for (let index = startIndex; index < samples.length; index += 1) {
    const elapsed = (index - startIndex) / sampleRate;
    const envelope =
      attackReleaseEnvelope(elapsed, duration, 0.025, 0.5) *
      Math.exp(-1.05 * elapsed);
    let chord = 0;
    for (const frequency of frequencies) {
      chord +=
        Math.sin(2 * Math.PI * frequency * elapsed) +
        0.12 * Math.sin(2 * Math.PI * frequency * 2 * elapsed);
    }
    samples[index] += (envelope * chord) / frequencies.length;
  }
}

function renderResolutionSting(definition, sampleRate) {
  const samples = new Float64Array(
    Math.round(definition.durationSeconds * sampleRate),
  );
  const { firstChordHz, secondChordHz, secondStartSeconds } =
    definition.parameters;
  addChord(samples, sampleRate, 0, firstChordHz);
  addChord(samples, sampleRate, secondStartSeconds, secondChordHz);
  return samples;
}

const RENDERERS = {
  resolutionSting: renderResolutionSting,
  stationChime: renderStationChime,
  storeHum: renderStoreHum,
  tensionPulse: renderTensionPulse,
};

function normalize(samples, targetPeak) {
  let sourcePeak = 0;
  for (const sample of samples) {
    sourcePeak = Math.max(sourcePeak, Math.abs(sample));
  }
  if (sourcePeak === 0) {
    throw new Error("Cannot normalize a silent authored-audio asset.");
  }

  const scale = targetPeak / sourcePeak;
  const normalized = new Float64Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    normalized[index] = clamp(samples[index] * scale, -1, 1);
  }
  return normalized;
}

function encodePcmWav(samples, sampleRate) {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const wav = Buffer.alloc(44 + dataLength);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + dataLength, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * bytesPerSample, 28);
  wav.writeUInt16LE(bytesPerSample, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const integer =
      sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767);
    wav.writeInt16LE(clamp(integer, -32768, 32767), 44 + index * 2);
  }

  return wav;
}

export async function loadParameters(parameterPath = DEFAULT_PARAMETER_PATH) {
  const content = await readFile(parameterPath, "utf8");
  return JSON.parse(content);
}

export function renderAsset(definition, sampleRate) {
  const renderer = RENDERERS[definition.kind];
  if (!renderer) {
    throw new Error(`Unknown authored-audio kind: ${definition.kind}`);
  }
  return encodePcmWav(
    normalize(renderer(definition, sampleRate), definition.targetPeak),
    sampleRate,
  );
}

export async function generateAuthoredAudio(outputDirectory, parameterPath) {
  const parameters = await loadParameters(parameterPath);
  if (
    parameters.channels !== 1 ||
    parameters.bitDepth !== 16 ||
    !Number.isInteger(parameters.sampleRate)
  ) {
    throw new Error(
      "Only mono 16-bit PCM with an integer sample rate is supported.",
    );
  }

  await mkdir(outputDirectory, { recursive: true });
  const outputs = [];
  for (const definition of parameters.assets) {
    const wav = renderAsset(definition, parameters.sampleRate);
    const outputPath = path.join(outputDirectory, definition.filename);
    await writeFile(outputPath, wav);
    outputs.push(outputPath);
  }
  return outputs;
}

async function main() {
  const outputDirectory = process.argv[2];
  if (!outputDirectory) {
    throw new Error(
      "Usage: node scripts/generate-m8-authored-audio.mjs <output-directory> [parameter-json]",
    );
  }
  const outputs = await generateAuthoredAudio(
    path.resolve(outputDirectory),
    process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_PARAMETER_PATH,
  );
  for (const output of outputs) {
    process.stdout.write(`${output}\n`);
  }
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
