import type { AppShell } from "../ui/shell.js";
import {
  findNonSpeechAudioAsset,
  type NonSpeechAudioAssetId,
} from "./assets.js";
import type { AudioGainName, BunbunAudioMixer } from "./mixer.js";

export function bindAudioMixerControls(
  shell: AppShell,
  mixer: BunbunAudioMixer,
): () => void {
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const unsubscribe = mixer.subscribe((snapshot) =>
    shell.updateAudioMixer(snapshot),
  );

  shell.soundButton.addEventListener(
    "click",
    () => {
      const open = shell.soundButton.getAttribute("aria-expanded") !== "true";
      shell.setLocalDataOpen(false);
      shell.setDiagnosticsOpen(false);
      shell.setSoundPanelOpen(open);
    },
    { signal },
  );
  shell.closeSoundButton.addEventListener(
    "click",
    () => shell.setSoundPanelOpen(false),
    { signal },
  );
  shell.unlockSoundButton.addEventListener(
    "click",
    () => {
      void mixer
        .unlock()
        .catch((error: unknown) => shell.setSoundStatus(messageOf(error)));
    },
    { signal },
  );
  shell.muteSoundButton.addEventListener(
    "click",
    () => mixer.setMuted(!mixer.getSnapshot().muted),
    { signal },
  );
  (Object.keys(shell.audioGainInputs) as AudioGainName[]).forEach((name) => {
    shell.audioGainInputs[name].addEventListener(
      "input",
      () => mixer.setGain(name, Number(shell.audioGainInputs[name].value)),
      { signal },
    );
  });
  shell.audioPreviewButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const id = button.dataset.audioPreview;
        if (id === undefined || findNonSpeechAudioAsset(id) === undefined)
          return;
        void mixer
          .unlock()
          .then(() => mixer.preview(id as NonSpeechAudioAssetId))
          .then((played) => {
            if (!played) shell.setSoundStatus(`Could not play ${id}.`);
          })
          .catch((error: unknown) => shell.setSoundStatus(messageOf(error)));
      },
      { signal },
    );
  });

  return () => {
    lifecycle.abort();
    unsubscribe();
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Audio could not start.";
}
