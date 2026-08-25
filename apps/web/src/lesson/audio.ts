import type { AudioAsset } from "@bunbun/contracts";

export interface AudioPlaybackCallbacks {
  onStart: () => void;
  onEnd: () => void;
  onError: (message: string) => void;
}

export interface AudioPlaybackPort {
  preload: (audioAssetId: string) => Promise<void>;
  play: (audioAssetId: string, callbacks: AudioPlaybackCallbacks) => void;
  interrupt: (message: string) => void;
  stop: () => void;
  dispose: () => void;
}

interface AudioPortDependencies {
  fetchImplementation?: typeof fetch;
  createAudioContext?: () => AudioContext;
}

const CACHED_VOICE_PROFILES = new Set(["voice_aoi_01", "voice_tanaka_01"]);

export function createLessonAudioPort(
  audioAssets: readonly AudioAsset[],
  simulateFailure: boolean,
  dependencies: AudioPortDependencies = {},
): AudioPlaybackPort {
  const registry = new Map(
    audioAssets.map((audio) => [audio.audioAssetId, audio] as const),
  );
  const fetchImplementation = dependencies.fetchImplementation ?? fetch;
  const createAudioContext =
    dependencies.createAudioContext ?? (() => new AudioContext());
  const decoded = new Map<string, Promise<AudioBuffer>>();
  const lifecycle = new AbortController();
  let context: AudioContext | undefined;
  let voiceGain: GainNode | undefined;
  let currentSource: AudioBufferSourceNode | undefined;
  let currentCallbacks: AudioPlaybackCallbacks | undefined;
  let generation = 0;
  let disposed = false;

  const ensureContext = (): AudioContext => {
    if (context === undefined) {
      context = createAudioContext();
      voiceGain = context.createGain();
      voiceGain.gain.value = 1;
      voiceGain.connect(context.destination);
    }
    return context;
  };

  const loadCached = (audio: AudioAsset): Promise<AudioBuffer> => {
    const existing = decoded.get(audio.audioAssetId);
    if (existing !== undefined) return existing;
    const loading = (async () => {
      const response = await fetchImplementation(
        `/api/v1/audio/speech/assets/${encodeURIComponent(audio.cacheKey)}.wav`,
        { cache: "force-cache", signal: lifecycle.signal },
      );
      if (!response.ok) {
        throw new Error(`Cached speech returned HTTP ${response.status}.`);
      }
      if (response.headers.get("x-bunbun-audio-credit") !== "VOICEVOX Nemo") {
        throw new Error("Cached speech credit identity is missing.");
      }
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) {
        throw new Error("Cached speech file size is invalid.");
      }
      return ensureContext().decodeAudioData(bytes.slice(0));
    })();
    decoded.set(audio.audioAssetId, loading);
    loading.catch(() => decoded.delete(audio.audioAssetId));
    return loading;
  };

  const stopCurrent = (): void => {
    generation += 1;
    currentCallbacks = undefined;
    if (currentSource !== undefined) {
      currentSource.onended = null;
      try {
        currentSource.stop();
      } catch {
        /* source already stopped */
      }
      currentSource.disconnect();
      currentSource = undefined;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  const fail = (
    currentGeneration: number,
    callbacks: AudioPlaybackCallbacks,
    message: string,
  ): void => {
    if (disposed || generation !== currentGeneration) return;
    currentCallbacks = undefined;
    callbacks.onError(message);
  };

  const playCached = (
    audio: AudioAsset,
    callbacks: AudioPlaybackCallbacks,
    currentGeneration: number,
  ): void => {
    void loadCached(audio)
      .then(async (buffer) => {
        if (disposed || generation !== currentGeneration) return;
        const audioContext = ensureContext();
        await audioContext.resume();
        if (
          disposed ||
          generation !== currentGeneration ||
          audioContext.state !== "running" ||
          voiceGain === undefined
        ) {
          throw new Error("Browser audio did not unlock.");
        }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(voiceGain);
        source.onended = () => {
          if (disposed || generation !== currentGeneration) return;
          source.onended = null;
          currentSource = undefined;
          currentCallbacks = undefined;
          source.disconnect();
          callbacks.onEnd();
        };
        currentSource = source;
        source.start();
        callbacks.onStart();
      })
      .catch(() =>
        fail(
          currentGeneration,
          callbacks,
          "Reviewed Japanese speech is unavailable. Use the visible text path to continue.",
        ),
      );
  };

  const playLegacy = (
    audio: AudioAsset,
    callbacks: AudioPlaybackCallbacks,
    currentGeneration: number,
  ): void => {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      queueMicrotask(() =>
        fail(
          currentGeneration,
          callbacks,
          "Technical Japanese speech is unavailable. Use the assisted text path to continue.",
        ),
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(audio.textJa);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const japaneseVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("ja"));
    if (japaneseVoice !== undefined) utterance.voice = japaneseVoice;
    utterance.onstart = () => {
      if (!disposed && generation === currentGeneration) callbacks.onStart();
    };
    utterance.onend = () => {
      if (!disposed && generation === currentGeneration) {
        currentCallbacks = undefined;
        callbacks.onEnd();
      }
    };
    utterance.onerror = (event) => {
      fail(
        currentGeneration,
        callbacks,
        event.error === "canceled" || event.error === "interrupted"
          ? "Technical Japanese speech was interrupted. You can replay it."
          : "Technical Japanese speech failed. Use the assisted text path to continue.",
      );
    };
    window.speechSynthesis.speak(utterance);
  };

  return {
    preload: async (audioAssetId) => {
      const audio = registry.get(audioAssetId);
      if (
        audio === undefined ||
        !CACHED_VOICE_PROFILES.has(audio.voiceProfileId) ||
        simulateFailure
      ) {
        return;
      }
      await loadCached(audio).then(() => undefined);
    },
    play: (audioAssetId, callbacks) => {
      stopCurrent();
      const currentGeneration = generation;
      const audio = registry.get(audioAssetId);
      currentCallbacks = callbacks;
      if (audio === undefined) {
        queueMicrotask(() =>
          fail(
            currentGeneration,
            callbacks,
            `Audio '${audioAssetId}' is not registered.`,
          ),
        );
        return;
      }
      if (simulateFailure) {
        queueMicrotask(() =>
          fail(
            currentGeneration,
            callbacks,
            "Japanese speech is unavailable. Use the assisted text path to continue.",
          ),
        );
        return;
      }
      if (CACHED_VOICE_PROFILES.has(audio.voiceProfileId)) {
        playCached(audio, callbacks, currentGeneration);
        return;
      }
      if (audio.voiceProfileId === "voice_guide_01") {
        playLegacy(audio, callbacks, currentGeneration);
        return;
      }
      queueMicrotask(() =>
        fail(
          currentGeneration,
          callbacks,
          `Voice profile '${audio.voiceProfileId}' has no playback adapter.`,
        ),
      );
    },
    interrupt: (message) => {
      const callbacks = currentCallbacks;
      if (callbacks === undefined) return;
      stopCurrent();
      callbacks.onError(message);
    },
    stop: stopCurrent,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      lifecycle.abort();
      stopCurrent();
      decoded.clear();
      voiceGain?.disconnect();
      voiceGain = undefined;
      if (context !== undefined) void context.close();
      context = undefined;
    },
  };
}

export function createSpeechSynthesisAudioPort(
  audioAssets: readonly AudioAsset[],
  simulateFailure: boolean,
): AudioPlaybackPort {
  return createLessonAudioPort(audioAssets, simulateFailure);
}
