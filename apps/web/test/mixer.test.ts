import assert from "node:assert/strict";
import test from "node:test";

import { NON_SPEECH_AUDIO_ASSETS } from "../src/audio/assets.js";
import { createBunbunAudioMixer } from "../src/audio/mixer.js";

test("mixer preloads without autoplay and starts only desired loops after unlock", async () => {
  const audio = fakeAudioContext();
  const mixer = createBunbunAudioMixer({
    createAudioContext: () => audio.context,
    fetchImplementation: approvedAssetFetch,
  });
  mixer.setSceneAmbience(["amb_rain_03"]);
  assert.equal(audio.sources.length, 0);
  await mixer.preload(["amb_rain_03", "sfx_footstep_01"]);
  assert.deepEqual(mixer.getSnapshot(), {
    contextState: "suspended",
    unlocked: false,
    muted: false,
    ducking: false,
    gains: {
      master: 1,
      voice: 1,
      ambience: 0.35,
      effects: 0.65,
      music: 0.2,
    },
    decodedAssetCount: 2,
    activeSourceCount: 0,
    activeLoopCount: 0,
    unavailableAssetIds: [],
  });

  await mixer.unlock();
  await tick();
  assert.equal(mixer.getSnapshot().activeLoopCount, 1);
  assert.equal(audio.sources.filter((source) => source.started).length, 1);
  assert.equal(audio.sources[0]?.loop, true);
  mixer.dispose();
});

test("voice uses the shared graph and ducks ambience and music", async () => {
  const audio = fakeAudioContext("running");
  const mixer = createBunbunAudioMixer({
    createAudioContext: () => audio.context,
    fetchImplementation: approvedAssetFetch,
  });
  let ended = 0;
  await mixer.playVoice({} as AudioBuffer, () => {
    ended += 1;
  });
  assert.equal(mixer.getSnapshot().ducking, true);
  assert.equal(audio.gains[2]?.gain.ramps.at(-1)?.value, 0.35 * 0.25);
  assert.equal(audio.gains[4]?.gain.ramps.at(-1)?.value, 0.2 * 0.15);

  audio.sources.at(-1)?.finish();
  assert.equal(ended, 1);
  assert.equal(mixer.getSnapshot().ducking, false);
  assert.equal(audio.gains[2]?.gain.ramps.at(-1)?.value, 0.35);
  assert.equal(audio.gains[4]?.gain.ramps.at(-1)?.value, 0.2);
  mixer.dispose();
});

test("gain clamps, mute is session-only, and optional failures stay isolated", async () => {
  const audio = fakeAudioContext();
  const mixer = createBunbunAudioMixer({
    createAudioContext: () => audio.context,
    fetchImplementation: async (input) => {
      if (String(input).includes("amb_distant_road_01")) {
        return new Response(null, { status: 404 });
      }
      return approvedAssetFetch(input);
    },
  });
  mixer.setGain("effects", 2);
  mixer.setGain("music", -1);
  mixer.setMuted(true);
  assert.equal(mixer.getSnapshot().gains.effects, 1);
  assert.equal(mixer.getSnapshot().gains.music, 0);
  assert.equal(mixer.getSnapshot().muted, true);

  mixer.setSceneAmbience(["amb_distant_road_01"]);
  await mixer.unlock();
  await tick();
  assert.deepEqual(mixer.getSnapshot().unavailableAssetIds, [
    "amb_distant_road_01",
  ]);
  assert.equal(await mixer.playOneShot("sfx_correct_001"), true);
  assert.equal(mixer.getSnapshot().activeSourceCount, 1);
  mixer.dispose();
});

test("background suspension drops transients and resumes only scene loops", async () => {
  const audio = fakeAudioContext();
  const mixer = createBunbunAudioMixer({
    createAudioContext: () => audio.context,
    fetchImplementation: approvedAssetFetch,
  });
  mixer.setSceneAmbience(["amb_rain_03"]);
  await mixer.unlock();
  await tick();
  await mixer.playOneShot("sfx_cat_mew_01");
  assert.equal(mixer.getSnapshot().activeSourceCount, 2);

  await mixer.suspendForBackground();
  assert.equal(mixer.getSnapshot().contextState, "suspended");
  assert.equal(mixer.getSnapshot().activeSourceCount, 0);
  const startedBeforeResume = audio.sources.length;

  await mixer.resumeFromBackground();
  await tick();
  assert.equal(mixer.getSnapshot().activeLoopCount, 1);
  assert.equal(audio.sources.length, startedBeforeResume + 1);
  assert.equal(audio.sources.at(-1)?.loop, true);
  mixer.dispose();
  assert.equal(audio.context.state, "closed");
});

test("diagnostic preview replaces the previous long asset", async () => {
  const audio = fakeAudioContext();
  const mixer = createBunbunAudioMixer({
    createAudioContext: () => audio.context,
    fetchImplementation: approvedAssetFetch,
  });
  await mixer.unlock();
  assert.equal(await mixer.preview("amb_rain_03"), true);
  const rain = audio.sources.at(-1);
  assert.equal(await mixer.preview("amb_distant_road_01"), true);
  assert.equal(rain?.stopped, true);
  assert.equal(mixer.getSnapshot().activeSourceCount, 1);
  assert.equal(audio.sources.at(-1)?.stopped, false);
  mixer.dispose();
});

async function approvedAssetFetch(input: RequestInfo | URL): Promise<Response> {
  const asset = NON_SPEECH_AUDIO_ASSETS.find(
    (candidate) => candidate.url === String(input),
  );
  if (asset === undefined) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(asset.bytes), { status: 200 });
}

interface FakeParam extends AudioParam {
  ramps: Array<{ value: number; time: number }>;
}

interface FakeSource extends AudioBufferSourceNode {
  started: boolean;
  stopped: boolean;
  finish: () => void;
}

function fakeAudioContext(initialState: AudioContextState = "suspended"): {
  context: AudioContext;
  sources: FakeSource[];
  gains: Array<GainNode & { gain: FakeParam }>;
} {
  const sources: FakeSource[] = [];
  const gains: Array<GainNode & { gain: FakeParam }> = [];
  let contextState = initialState;
  const context = {
    get state() {
      return contextState;
    },
    currentTime: 1,
    destination: {},
    createGain: () => {
      const gain = fakeParam(1);
      const node = {
        gain,
        connect: () => undefined,
        disconnect: () => undefined,
      } as unknown as GainNode & { gain: FakeParam };
      gains.push(node);
      return node;
    },
    createDynamicsCompressor: () => ({
      connect: () => undefined,
      disconnect: () => undefined,
    }),
    createBufferSource: () => {
      const source = {
        buffer: null,
        loop: false,
        onended: null,
        started: false,
        stopped: false,
        connect: () => undefined,
        disconnect: () => undefined,
        start: () => {
          source.started = true;
        },
        stop: () => {
          source.stopped = true;
        },
        finish: () => {
          source.onended?.(new Event("ended"));
        },
      } as unknown as FakeSource;
      sources.push(source);
      return source;
    },
    decodeAudioData: async () => ({}) as AudioBuffer,
    resume: async () => {
      contextState = "running";
    },
    suspend: async () => {
      contextState = "suspended";
    },
    close: async () => {
      contextState = "closed";
    },
  } as unknown as AudioContext;
  return { context, sources, gains };
}

function fakeParam(value: number): FakeParam {
  const ramps: FakeParam["ramps"] = [];
  const parameter = {
    value,
    ramps,
    cancelScheduledValues: () => undefined,
    setValueAtTime: (next: number) => {
      parameter.value = next;
      return parameter;
    },
    linearRampToValueAtTime: (next: number, time: number) => {
      parameter.value = next;
      ramps.push({ value: next, time });
      return parameter;
    },
  } as unknown as FakeParam;
  return parameter;
}

async function tick(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}
