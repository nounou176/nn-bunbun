import type { AudioAsset } from "@bunbun/contracts";

export interface AudioPlaybackCallbacks {
  onStart: () => void;
  onEnd: () => void;
  onError: (message: string) => void;
}

export interface AudioPlaybackPort {
  play: (audioAssetId: string, callbacks: AudioPlaybackCallbacks) => void;
  stop: () => void;
  dispose: () => void;
}

export function createSpeechSynthesisAudioPort(
  audioAssets: readonly AudioAsset[],
  simulateFailure: boolean,
): AudioPlaybackPort {
  const registry = new Map(
    audioAssets.map((audio) => [audio.audioAssetId, audio] as const),
  );
  let generation = 0;
  let disposed = false;

  const play = (
    audioAssetId: string,
    callbacks: AudioPlaybackCallbacks,
  ): void => {
    const currentGeneration = ++generation;
    const audio = registry.get(audioAssetId);
    if (audio === undefined) {
      callbacks.onError(`Audio '${audioAssetId}' is not registered.`);
      return;
    }
    if (
      simulateFailure ||
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      queueMicrotask(() => {
        if (!disposed && generation === currentGeneration) {
          callbacks.onError(
            "Japanese speech is unavailable. Use the assisted text path to continue.",
          );
        }
      });
      return;
    }

    window.speechSynthesis.cancel();
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
      if (!disposed && generation === currentGeneration) callbacks.onEnd();
    };
    utterance.onerror = (event) => {
      if (!disposed && generation === currentGeneration) {
        callbacks.onError(
          event.error === "canceled" || event.error === "interrupted"
            ? "Japanese speech was interrupted. You can try replaying it."
            : `Japanese speech failed (${event.error}). Use the assisted text path to continue.`,
        );
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  return {
    play,
    stop: () => {
      generation += 1;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      generation += 1;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
  };
}
