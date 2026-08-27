import {
  findNonSpeechAudioAsset,
  type NonSpeechAudioAssetId,
  type NonSpeechBus,
} from "./assets.js";

export type AudioGainName = "master" | "voice" | NonSpeechBus;

export interface AudioMixerSnapshot {
  contextState: AudioContextState | "uninitialized";
  unlocked: boolean;
  muted: boolean;
  ducking: boolean;
  gains: Readonly<Record<AudioGainName, number>>;
  decodedAssetCount: number;
  activeSourceCount: number;
  activeLoopCount: number;
  unavailableAssetIds: readonly string[];
}

export interface BunbunAudioMixer {
  unlock: () => Promise<void>;
  decodeAudioData: (bytes: ArrayBuffer) => Promise<AudioBuffer>;
  playVoice: (buffer: AudioBuffer, onEnded: () => void) => Promise<void>;
  stopVoice: () => void;
  preload: (assetIds: readonly NonSpeechAudioAssetId[]) => Promise<void>;
  playOneShot: (assetId: NonSpeechAudioAssetId) => Promise<boolean>;
  preview: (assetId: NonSpeechAudioAssetId) => Promise<boolean>;
  setSceneAmbience: (assetIds: readonly NonSpeechAudioAssetId[]) => void;
  setGain: (name: AudioGainName, value: number) => void;
  setMuted: (muted: boolean) => void;
  suspendForBackground: () => Promise<void>;
  resumeFromBackground: () => Promise<void>;
  restart: () => void;
  getSnapshot: () => AudioMixerSnapshot;
  subscribe: (listener: (snapshot: AudioMixerSnapshot) => void) => () => void;
  dispose: () => void;
}

interface AudioMixerDependencies {
  createAudioContext?: () => AudioContext;
  fetchImplementation?: typeof fetch;
}

interface ActiveSource {
  source: AudioBufferSourceNode;
  gain?: GainNode;
  loopAssetId?: NonSpeechAudioAssetId;
}

const DEFAULT_GAINS: Record<AudioGainName, number> = {
  master: 1,
  voice: 1,
  ambience: 0.35,
  effects: 0.65,
  music: 0.2,
};
const DUCK_FACTORS: Readonly<Record<"ambience" | "music", number>> = {
  ambience: 0.25,
  music: 0.15,
};
const DUCK_ATTACK_SECONDS = 0.08;
const DUCK_RELEASE_SECONDS = 0.25;
const MAXIMUM_ACTIVE_SOURCES = 16;
const MAXIMUM_AUDIO_BYTES = 5 * 1024 * 1024;

export function createBunbunAudioMixer(
  dependencies: AudioMixerDependencies = {},
): BunbunAudioMixer {
  const createAudioContext =
    dependencies.createAudioContext ?? (() => new AudioContext());
  const fetchImplementation = dependencies.fetchImplementation ?? fetch;
  const lifecycle = new AbortController();
  const decoded = new Map<NonSpeechAudioAssetId, Promise<AudioBuffer>>();
  const unavailable = new Set<NonSpeechAudioAssetId>();
  const desiredLoops = new Set<NonSpeechAudioAssetId>();
  const activeLoops = new Map<NonSpeechAudioAssetId, number>();
  const activeSources = new Map<number, ActiveSource>();
  const listeners = new Set<(snapshot: AudioMixerSnapshot) => void>();
  const gains = { ...DEFAULT_GAINS };
  let context: AudioContext | undefined;
  let masterGain: GainNode | undefined;
  let compressor: DynamicsCompressorNode | undefined;
  let busGains: Record<Exclude<AudioGainName, "master">, GainNode> | undefined;
  let voiceSourceId: number | undefined;
  let previewSourceId: number | undefined;
  let nextSourceId = 1;
  let loopGeneration = 0;
  let voiceGeneration = 0;
  let previewGeneration = 0;
  let unlocked = false;
  let unlockedBeforeBackground = false;
  let muted = false;
  let ducking = false;
  let disposed = false;

  const snapshot = (): AudioMixerSnapshot => ({
    contextState: context?.state ?? "uninitialized",
    unlocked,
    muted,
    ducking,
    gains: { ...gains },
    decodedAssetCount: decoded.size,
    activeSourceCount: activeSources.size,
    activeLoopCount: activeLoops.size,
    unavailableAssetIds: [...unavailable].sort(),
  });

  const publish = () => {
    const current = snapshot();
    listeners.forEach((listener) => listener(current));
  };

  const ensureGraph = (): AudioContext => {
    if (disposed) throw new Error("Audio mixer is disposed.");
    if (context !== undefined) return context;
    context = createAudioContext();
    masterGain = context.createGain();
    compressor = context.createDynamicsCompressor();
    busGains = {
      voice: context.createGain(),
      ambience: context.createGain(),
      effects: context.createGain(),
      music: context.createGain(),
    };
    busGains.voice.gain.value = gains.voice;
    busGains.ambience.gain.value = gains.ambience;
    busGains.effects.gain.value = gains.effects;
    busGains.music.gain.value = gains.music;
    masterGain.gain.value = muted ? 0 : gains.master;
    Object.values(busGains).forEach((node) => node.connect(masterGain!));
    masterGain.connect(compressor);
    compressor.connect(context.destination);
    publish();
    return context;
  };

  const targetBusGain = (bus: Exclude<AudioGainName, "master">): number => {
    if (!ducking || (bus !== "ambience" && bus !== "music")) {
      return gains[bus];
    }
    return gains[bus] * DUCK_FACTORS[bus];
  };

  const rampBus = (
    bus: Exclude<AudioGainName, "master">,
    durationSeconds: number,
  ) => {
    const node = busGains?.[bus];
    if (node === undefined || context === undefined) return;
    const now = context.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(node.gain.value, now);
    node.gain.linearRampToValueAtTime(
      targetBusGain(bus),
      now + durationSeconds,
    );
  };

  const setDucking = (next: boolean) => {
    if (ducking === next) return;
    ducking = next;
    const duration = next ? DUCK_ATTACK_SECONDS : DUCK_RELEASE_SECONDS;
    rampBus("ambience", duration);
    rampBus("music", duration);
    publish();
  };

  const disconnectSource = (id: number, stop: boolean) => {
    const active = activeSources.get(id);
    if (active === undefined) return;
    active.source.onended = null;
    if (stop) {
      try {
        active.source.stop();
      } catch {
        /* source already stopped */
      }
    }
    active.source.disconnect();
    active.gain?.disconnect();
    activeSources.delete(id);
    if (previewSourceId === id) previewSourceId = undefined;
    if (active.loopAssetId !== undefined) {
      activeLoops.delete(active.loopAssetId);
    }
  };

  const registerSource = (
    source: AudioBufferSourceNode,
    gain?: GainNode,
    loopAssetId?: NonSpeechAudioAssetId,
    onEnded?: () => void,
  ): number => {
    while (activeSources.size >= MAXIMUM_ACTIVE_SOURCES) {
      const oldest = activeSources.keys().next().value as number | undefined;
      if (oldest === undefined) break;
      disconnectSource(oldest, true);
    }
    const id = nextSourceId++;
    activeSources.set(id, {
      source,
      ...(gain === undefined ? {} : { gain }),
      ...(loopAssetId === undefined ? {} : { loopAssetId }),
    });
    if (loopAssetId !== undefined) activeLoops.set(loopAssetId, id);
    source.onended = () => {
      if (!activeSources.has(id)) return;
      disconnectSource(id, false);
      onEnded?.();
      publish();
    };
    return id;
  };

  const loadAsset = (assetId: NonSpeechAudioAssetId): Promise<AudioBuffer> => {
    const existing = decoded.get(assetId);
    if (existing !== undefined) return existing;
    const asset = findNonSpeechAudioAsset(assetId);
    if (asset === undefined) {
      return Promise.reject(new Error(`Unknown audio asset '${assetId}'.`));
    }
    const loading = (async () => {
      const response = await fetchImplementation(asset.url, {
        cache: "force-cache",
        signal: lifecycle.signal,
      });
      if (!response.ok) {
        throw new Error(
          `Audio asset '${assetId}' returned HTTP ${response.status}.`,
        );
      }
      const bytes = await response.arrayBuffer();
      if (
        bytes.byteLength === 0 ||
        bytes.byteLength > MAXIMUM_AUDIO_BYTES ||
        bytes.byteLength !== asset.bytes
      ) {
        throw new Error(`Audio asset '${assetId}' has an invalid byte count.`);
      }
      return ensureGraph().decodeAudioData(bytes.slice(0));
    })();
    decoded.set(assetId, loading);
    loading.catch(() => {
      decoded.delete(assetId);
      unavailable.add(assetId);
      publish();
    });
    return loading;
  };

  const startLoop = async (
    assetId: NonSpeechAudioAssetId,
    generation: number,
  ): Promise<void> => {
    if (
      disposed ||
      !unlocked ||
      activeLoops.has(assetId) ||
      !desiredLoops.has(assetId)
    ) {
      return;
    }
    const asset = findNonSpeechAudioAsset(assetId);
    if (asset === undefined || asset.bus !== "ambience" || !asset.loop) return;
    try {
      const buffer = await loadAsset(assetId);
      if (
        disposed ||
        !unlocked ||
        generation !== loopGeneration ||
        !desiredLoops.has(assetId) ||
        activeLoops.has(assetId)
      ) {
        return;
      }
      const audioContext = ensureGraph();
      const source = audioContext.createBufferSource();
      const sourceGain = audioContext.createGain();
      source.buffer = buffer;
      source.loop = true;
      sourceGain.gain.value = asset.baseGain;
      source.connect(sourceGain);
      sourceGain.connect(busGains!.ambience);
      registerSource(source, sourceGain, assetId);
      source.start();
      publish();
    } catch {
      /* an optional ambience failure is isolated from gameplay */
    }
  };

  const startDesiredLoops = () => {
    const generation = loopGeneration;
    desiredLoops.forEach((assetId) => void startLoop(assetId, generation));
  };

  const stopNonVoiceSources = () => {
    [...activeSources.keys()].forEach((id) => {
      if (id !== voiceSourceId) disconnectSource(id, true);
    });
    activeLoops.clear();
    publish();
  };

  const stopVoice = () => {
    voiceGeneration += 1;
    if (voiceSourceId !== undefined) disconnectSource(voiceSourceId, true);
    voiceSourceId = undefined;
    setDucking(false);
    publish();
  };

  const unlock = async () => {
    const audioContext = ensureGraph();
    await audioContext.resume();
    if (audioContext.state !== "running") {
      throw new Error("Browser audio did not unlock.");
    }
    unlocked = true;
    unlockedBeforeBackground = true;
    startDesiredLoops();
    publish();
  };

  const playOneShot = async (
    assetId: NonSpeechAudioAssetId,
    replacePreview: boolean,
  ): Promise<boolean> => {
    if (disposed || !unlocked || context?.state !== "running") return false;
    const asset = findNonSpeechAudioAsset(assetId);
    if (asset === undefined) return false;
    const currentPreviewGeneration = replacePreview
      ? ++previewGeneration
      : previewGeneration;
    if (replacePreview && previewSourceId !== undefined) {
      disconnectSource(previewSourceId, true);
    }
    try {
      const buffer = await loadAsset(assetId);
      if (disposed || !unlocked || context?.state !== "running") return false;
      if (replacePreview && currentPreviewGeneration !== previewGeneration) {
        return false;
      }
      if (replacePreview && previewSourceId !== undefined) {
        disconnectSource(previewSourceId, true);
      }
      const source = context.createBufferSource();
      const sourceGain = context.createGain();
      source.buffer = buffer;
      source.loop = false;
      sourceGain.gain.value = asset.baseGain;
      source.connect(sourceGain);
      sourceGain.connect(busGains![asset.bus]);
      const sourceId = registerSource(source, sourceGain);
      if (replacePreview) previewSourceId = sourceId;
      source.start();
      publish();
      return true;
    } catch {
      return false;
    }
  };

  return {
    unlock,
    decodeAudioData: (bytes) => ensureGraph().decodeAudioData(bytes.slice(0)),
    playVoice: async (buffer, onEnded) => {
      stopVoice();
      const generation = voiceGeneration;
      await unlock();
      if (disposed || generation !== voiceGeneration) return;
      const audioContext = ensureGraph();
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(busGains!.voice);
      setDucking(true);
      voiceSourceId = registerSource(source, undefined, undefined, () => {
        if (generation !== voiceGeneration) return;
        voiceSourceId = undefined;
        setDucking(false);
        onEnded();
      });
      source.start();
      publish();
    },
    stopVoice,
    preload: async (assetIds) => {
      await Promise.allSettled(assetIds.map((assetId) => loadAsset(assetId)));
    },
    playOneShot: (assetId) => playOneShot(assetId, false),
    preview: (assetId) => playOneShot(assetId, true),
    setSceneAmbience: (assetIds) => {
      loopGeneration += 1;
      desiredLoops.clear();
      assetIds.forEach((assetId) => {
        const asset = findNonSpeechAudioAsset(assetId);
        if (asset?.bus === "ambience" && asset.loop) desiredLoops.add(assetId);
      });
      for (const [assetId, sourceId] of activeLoops) {
        if (!desiredLoops.has(assetId)) disconnectSource(sourceId, true);
      }
      startDesiredLoops();
      publish();
    },
    setGain: (name, value) => {
      gains[name] = Math.min(1, Math.max(0, value));
      if (name === "master") {
        if (masterGain !== undefined) {
          masterGain.gain.value = muted ? 0 : gains.master;
        }
      } else {
        rampBus(name, 0.03);
      }
      publish();
    },
    setMuted: (next) => {
      muted = next;
      if (masterGain !== undefined) {
        masterGain.gain.value = muted ? 0 : gains.master;
      }
      publish();
    },
    suspendForBackground: async () => {
      if (disposed || context === undefined) return;
      unlockedBeforeBackground = unlocked;
      loopGeneration += 1;
      previewGeneration += 1;
      stopVoice();
      stopNonVoiceSources();
      await context.suspend();
      publish();
    },
    resumeFromBackground: async () => {
      if (disposed || context === undefined || !unlockedBeforeBackground)
        return;
      await context.resume();
      unlocked = context.state === "running";
      if (unlocked) startDesiredLoops();
      publish();
    },
    restart: () => {
      loopGeneration += 1;
      stopVoice();
      stopNonVoiceSources();
      startDesiredLoops();
    },
    getSnapshot: snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      lifecycle.abort();
      loopGeneration += 1;
      stopVoice();
      stopNonVoiceSources();
      decoded.clear();
      desiredLoops.clear();
      Object.values(busGains ?? {}).forEach((node) => node.disconnect());
      masterGain?.disconnect();
      compressor?.disconnect();
      busGains = undefined;
      masterGain = undefined;
      compressor = undefined;
      listeners.clear();
      if (context !== undefined) void context.close();
      context = undefined;
      unlocked = false;
    },
  };
}
