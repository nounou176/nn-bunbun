import assert from "node:assert/strict";
import test from "node:test";

import type { AudioAsset } from "@bunbun/contracts";

import { createLessonAudioPort } from "../src/lesson/audio.js";

const cachedAsset: AudioAsset = {
  audioAssetId: "audio_aoi_wallet_request",
  textJa: "財布を探してください。",
  voiceProfileId: "voice_aoi_01",
  cacheKey:
    "bunbun_tts_v1_34a6a1c8a7acc64b6a77f0f7aa84f21142f0b6a5715afc016db11e6f2cd0dbfe",
};

test("cached speech preloads once, starts after unlock, and ends once", async () => {
  const previousWindow = globalThis.window;
  const audio = fakeAudioContext();
  let fetchCount = 0;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { speechSynthesis: { cancel: () => undefined } },
  });
  try {
    const port = createLessonAudioPort([cachedAsset], false, {
      fetchImplementation: async () => {
        fetchCount += 1;
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "x-bunbun-audio-credit": "VOICEVOX Nemo" },
        });
      },
      createAudioContext: () => audio.context,
    });
    await port.preload(cachedAsset.audioAssetId);
    await port.preload(cachedAsset.audioAssetId);
    assert.equal(fetchCount, 1);

    const events: string[] = [];
    port.play(cachedAsset.audioAssetId, {
      onStart: () => events.push("start"),
      onEnd: () => events.push("end"),
      onError: () => events.push("error"),
    });
    await tick();
    assert.deepEqual(events, ["start"]);
    audio.source?.onended?.(new Event("ended"));
    assert.deepEqual(events, ["start", "end"]);
    audio.source?.onended?.(new Event("ended"));
    assert.deepEqual(events, ["start", "end"]);
    port.dispose();
    assert.equal(audio.closed, true);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previousWindow,
    });
  }
});

test("cached speech interruption reports one recoverable failure", async () => {
  const previousWindow = globalThis.window;
  const audio = fakeAudioContext();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { speechSynthesis: { cancel: () => undefined } },
  });
  try {
    const port = createLessonAudioPort([cachedAsset], false, {
      fetchImplementation: async () =>
        new Response(new Uint8Array([1]), {
          status: 200,
          headers: { "x-bunbun-audio-credit": "VOICEVOX Nemo" },
        }),
      createAudioContext: () => audio.context,
    });
    const errors: string[] = [];
    port.play(cachedAsset.audioAssetId, {
      onStart: () => undefined,
      onEnd: () => undefined,
      onError: (message) => errors.push(message),
    });
    await tick();
    port.interrupt("background interruption");
    port.interrupt("duplicate interruption");
    assert.deepEqual(errors, ["background interruption"]);
    assert.equal(audio.stopped, true);
    port.dispose();
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previousWindow,
    });
  }
});

function fakeAudioContext(): {
  context: AudioContext;
  source: AudioBufferSourceNode | undefined;
  stopped: boolean;
  closed: boolean;
} {
  const state = {
    source: undefined as AudioBufferSourceNode | undefined,
    stopped: false,
    closed: false,
  };
  const gain = {
    gain: { value: 1 },
    connect: () => undefined,
    disconnect: () => undefined,
  } as unknown as GainNode;
  const context = {
    state: "running",
    destination: {},
    createGain: () => gain,
    decodeAudioData: async () => ({}) as AudioBuffer,
    resume: async () => undefined,
    createBufferSource: () => {
      const source = {
        buffer: null,
        onended: null,
        connect: () => undefined,
        disconnect: () => undefined,
        start: () => undefined,
        stop: () => {
          state.stopped = true;
        },
      } as unknown as AudioBufferSourceNode;
      state.source = source;
      return source;
    },
    close: async () => {
      state.closed = true;
    },
  } as unknown as AudioContext;
  return {
    context,
    get source() {
      return state.source;
    },
    get stopped() {
      return state.stopped;
    },
    get closed() {
      return state.closed;
    },
  };
}

async function tick(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}
