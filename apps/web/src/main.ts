import "./style.css";

import type { ValidatedLessonPackage } from "@bunbun/contracts";
import { bindAudioMixerControls } from "./audio/controls.js";
import { createBunbunAudioMixer } from "./audio/mixer.js";
import { findNonSpeechAudioAsset } from "./audio/assets.js";
import { showAuthoringHome } from "./authoring/home.js";
import { readRuntimeConfig, type RuntimeConfig } from "./game/config.js";
import { BunbunRuntimeError, createGameRuntime } from "./game/runtime.js";
import { resolveWorldScene } from "./game/world-assets.js";
import {
  LessonContentError,
  loadAuthoredLesson,
  loadCachedSpeechLesson,
  loadLastTrainLesson,
  loadLessonPackage,
} from "./lesson/content.js";
import { createLessonRuntime } from "./lesson/runtime.js";
import { packageFingerprint } from "./persistence/fingerprint.js";
import { createHttpEvidenceStore } from "./persistence/http.js";
import { createAppShell } from "./ui/shell.js";
import { EVIDENCE_PERSISTENCE_SCHEMA_VERSION } from "@bunbun/contracts";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("Bunbun app root was not found.");
}

interface AppRuntime {
  dispose: () => void;
}

void startApp(app);

async function startApp(app: HTMLDivElement): Promise<void> {
  const baseConfig = readRuntimeConfig(window.location.search);
  if (baseConfig.worldPreviewSceneId !== undefined) {
    await startWorldPreview(app, baseConfig);
    return;
  }
  const selection = await showAuthoringHome(app);
  const selectedPackage =
    selection.kind === "PUBLISHED"
      ? selection.lessonPackage
      : selection.kind === "CACHED_SPEECH_DEMO"
        ? loadCachedSpeechLesson(false)
        : selection.kind === "LAST_TRAIN_DEMO"
          ? loadLastTrainLesson(false)
          : undefined;
  const selectedSceneId = selectedPackage?.manifest.scene.sceneId;
  const shell = createAppShell(
    app,
    selectedSceneId === "neighborhood_small"
      ? {
          worldTitle: "Bunbun Neighborhood",
          worldSceneId: selectedSceneId,
          worldAriaLabel:
            "Bunbun rainy evening neighborhood lesson. Use the lesson prompts to move, inspect clues, and help Aoi.",
          instructionJa: "日本語を使って、あおいを終電に間に合わせよう。",
          instructionSupport:
            "Complete the authored Japanese actions in the rainy neighborhood.",
        }
      : undefined,
  );
  const audioMixer = createConfiguredAudioMixer(baseConfig);
  const unbindAudioMixer = bindAudioMixerControls(shell, audioMixer);
  const evidenceStore = createHttpEvidenceStore(
    baseConfig.simulatePersistenceFailure,
  );
  const lifecycle = new AbortController();
  let runtime: AppRuntime | undefined;
  let bootSequence = 0;
  let attempt = 0;

  async function boot(forceStartNew = false): Promise<void> {
    const sequence = ++bootSequence;
    const bootStartedAt = performance.now();
    runtime?.dispose();
    runtime = undefined;
    shell.setLoading();

    try {
      const lessonPackage = loadSelectedLesson(
        selectedPackage,
        baseConfig.simulateManifestFailure && attempt === 0,
      );
      const fingerprint = await packageFingerprint({
        manifest: lessonPackage.manifest,
        catalog: lessonPackage.catalog,
      });
      const [preferences, resumableResult] = await Promise.all([
        evidenceStore.getPreferences(),
        evidenceStore.findResumableSession({
          lessonId: lessonPackage.manifest.lessonId,
          revision: lessonPackage.manifest.revision,
          packageFingerprint: fingerprint,
        }),
      ]);
      let resumedSession = resumableResult.session;
      if (resumedSession?.status === "ACTIVE") {
        const shouldStartNew =
          forceStartNew || preferences.resumeMode === "START_NEW";
        const shouldResume =
          !shouldStartNew &&
          (preferences.resumeMode === "AUTO_RESUME" ||
            (preferences.resumeMode === "ASK" &&
              (await chooseSession(
                lessonPackage.manifest.title.ja,
                resumedSession.checkpoint.currentStepId,
                resumedSession.lastSavedAt,
              )) === "RESUME"));
        if (!shouldResume) {
          await evidenceStore.abandonSession(
            resumedSession.sessionId,
            resumedSession.checkpoint.sequence,
          );
          resumedSession = undefined;
        }
      } else if (forceStartNew) {
        resumedSession = undefined;
      }
      if (sequence !== bootSequence) return;

      const worldRuntime = await createGameRuntime(
        shell,
        {
          ...baseConfig,
          simulateAssetFailure:
            baseConfig.simulateAssetFailure && attempt === 0,
        },
        audioMixer,
        handleFatalError,
        resolveWorldScene(lessonPackage.manifest.scene.sceneId),
      );
      let lessonRuntime;
      try {
        lessonRuntime = await createLessonRuntime(
          shell,
          worldRuntime,
          audioMixer,
          {
            store: evidenceStore,
            lessonPackage,
            packageFingerprint: fingerprint,
            ...(resumedSession === undefined ? {} : { resumedSession }),
            onPersistenceStatus: (status, detail) => {
              shell.setPersistenceStatus(
                status,
                status === "saving"
                  ? "Saving evidence and checkpoint locally…"
                  : `Saved locally · ${detail.eventCount} evidence events`,
              );
            },
            onRestart: async (sessionId, checkpointSequence, active) => {
              runtime?.dispose();
              runtime = undefined;
              try {
                if (active) {
                  await evidenceStore.abandonSession(
                    sessionId,
                    checkpointSequence,
                  );
                }
                await boot(true);
              } catch (error) {
                handleFatalError(toRuntimeError(error));
              }
            },
          },
          baseConfig.simulateAudioFailure,
          performance.now() - bootStartedAt,
          (error) =>
            handleFatalError(
              new BunbunRuntimeError("RUNTIME_LESSON_FAILED", error.message, {
                cause: error,
              }),
            ),
        );
      } catch (error) {
        worldRuntime.dispose();
        throw error;
      }
      const nextRuntime: AppRuntime = {
        dispose: () => {
          lessonRuntime.dispose();
          worldRuntime.dispose();
          audioMixer.restart();
        },
      };
      if (sequence !== bootSequence) {
        nextRuntime.dispose();
        return;
      }
      runtime = nextRuntime;
    } catch (error) {
      if (sequence !== bootSequence) {
        return;
      }
      const runtimeError = toRuntimeError(error);
      shell.setPersistenceStatus("error", runtimeError.message);
      shell.setError(runtimeError.code, runtimeError.message);
    }
  }

  function chooseSession(
    lessonTitle: string,
    stepId: string,
    lastSavedAt: string,
  ): Promise<"RESUME" | "START_NEW"> {
    shell.setResumePrompt(lessonTitle, stepId, lastSavedAt);
    return new Promise((resolve) => {
      const selection = new AbortController();
      shell.resumeButton.addEventListener(
        "click",
        () => {
          selection.abort();
          shell.setLoading();
          resolve("RESUME");
        },
        { once: true, signal: selection.signal },
      );
      shell.startAgainButton.addEventListener(
        "click",
        () => {
          selection.abort();
          shell.setLoading();
          resolve("START_NEW");
        },
        { once: true, signal: selection.signal },
      );
    });
  }

  function toRuntimeError(error: unknown): BunbunRuntimeError {
    return error instanceof BunbunRuntimeError
      ? error
      : error instanceof LessonContentError
        ? new BunbunRuntimeError(error.code, error.message, { cause: error })
        : new BunbunRuntimeError(
            "RUNTIME_START_FAILED",
            error instanceof Error ? error.message : "Unknown runtime error.",
            { cause: error },
          );
  }

  async function refreshLocalData(): Promise<void> {
    const lessonPackage = loadSelectedLesson(selectedPackage, false);
    const [preferences, summary, progress] = await Promise.all([
      evidenceStore.getPreferences(),
      evidenceStore.getStorageSummary(),
      evidenceStore
        .getProgress(
          lessonPackage.manifest.lessonId,
          lessonPackage.manifest.revision,
        )
        .catch(() => undefined),
    ]);
    shell.renderLocalData({
      resumeMode: preferences.resumeMode,
      sessionCount: summary.sessionCount,
      eventCount: summary.eventCount,
      activeSessionCount: summary.activeSessionCount,
      targetSignal: progress?.targets[0]?.signal ?? "No evidence yet",
    });
  }

  function handleFatalError(error: BunbunRuntimeError): void {
    runtime?.dispose();
    runtime = undefined;
    shell.setError(error.code, error.message);
  }

  shell.retryButton.addEventListener(
    "click",
    () => {
      attempt += 1;
      void boot();
    },
    { signal: lifecycle.signal },
  );

  shell.localDataButton.addEventListener(
    "click",
    () => {
      shell.setSoundPanelOpen(false);
      shell.setDiagnosticsOpen(false);
      shell.setLocalDataOpen(true);
      void refreshLocalData().catch((error: unknown) =>
        shell.setPersistenceStatus(
          "error",
          error instanceof Error ? error.message : "Could not read local data.",
        ),
      );
    },
    { signal: lifecycle.signal },
  );
  shell.closeLocalDataButton.addEventListener(
    "click",
    () => {
      shell.setDeleteConfirmation(false);
      shell.setLocalDataOpen(false);
    },
    { signal: lifecycle.signal },
  );
  shell.resumeModeSelect.addEventListener(
    "change",
    () => {
      const resumeMode = shell.resumeModeSelect.value;
      if (
        resumeMode !== "ASK" &&
        resumeMode !== "AUTO_RESUME" &&
        resumeMode !== "START_NEW"
      ) {
        return;
      }
      void evidenceStore
        .updatePreferences({
          schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
          resumeMode,
        })
        .then(() => refreshLocalData())
        .catch((error: unknown) =>
          shell.setPersistenceStatus(
            "error",
            error instanceof Error
              ? error.message
              : "Could not save preference.",
          ),
        );
    },
    { signal: lifecycle.signal },
  );
  shell.deleteLocalDataButton.addEventListener(
    "click",
    () => shell.setDeleteConfirmation(true),
    { signal: lifecycle.signal },
  );
  shell.confirmDeleteLocalDataButton.addEventListener(
    "click",
    () => {
      void evidenceStore
        .resetLocalData()
        .then(() => {
          runtime?.dispose();
          runtime = undefined;
          shell.setDeleteConfirmation(false);
          shell.setLocalDataOpen(false);
          shell.setPersistenceStatus(
            "saved",
            "All local learning data was deleted.",
          );
          shell.setDataDeleted();
        })
        .catch((error: unknown) =>
          shell.setPersistenceStatus(
            "error",
            error instanceof Error
              ? error.message
              : "Could not delete local data.",
          ),
        );
    },
    { signal: lifecycle.signal },
  );

  window.addEventListener("pagehide", disposeApp, {
    once: true,
    signal: lifecycle.signal,
  });

  if (import.meta.hot !== undefined) {
    import.meta.hot.dispose(() => {
      disposeApp();
    });
  }

  void boot();

  function disposeApp(): void {
    lifecycle.abort();
    runtime?.dispose();
    runtime = undefined;
    unbindAudioMixer();
    audioMixer.dispose();
  }
}

function createConfiguredAudioMixer(config: RuntimeConfig) {
  const failedNonSpeechAssetId =
    config.nonSpeechFailure === "ambience"
      ? "amb_rain_03"
      : config.nonSpeechFailure === "effects"
        ? "sfx_correct_001"
        : config.nonSpeechFailure === "music"
          ? "music_tension_pulse_01"
          : undefined;
  const failedNonSpeechAsset =
    failedNonSpeechAssetId === undefined
      ? undefined
      : findNonSpeechAudioAsset(failedNonSpeechAssetId);
  return createBunbunAudioMixer({
    ...(failedNonSpeechAsset === undefined
      ? {}
      : {
          fetchImplementation: (input, init) =>
            String(input) === failedNonSpeechAsset.url
              ? Promise.resolve(new Response(null, { status: 503 }))
              : fetch(input, init),
        }),
  });
}

async function startWorldPreview(
  app: HTMLDivElement,
  config: RuntimeConfig,
): Promise<void> {
  const sceneId = config.worldPreviewSceneId;
  if (sceneId === undefined) return;
  const definition = resolveWorldScene(sceneId);
  const shell = createAppShell(app, {
    worldTitle: "Bunbun Neighborhood",
    worldSceneId: sceneId,
    worldAriaLabel:
      "Bunbun rainy evening neighborhood preview. Click the pedestrian area to move and select Aoi, Tanaka, Momo, or a clue object.",
    loadingMessage:
      "Loading the approved local neighborhood bundle and actor animations.",
    instructionJa: "雨の町を歩いて、人物や手がかりを確認しよう。",
    instructionSupport:
      "Closed M8 world preview · click the pedestrian area to move and click actors or clue objects to inspect IDs.",
    previewMode: true,
  });
  const audioMixer = createConfiguredAudioMixer(config);
  const unbindAudioMixer = bindAudioMixerControls(shell, audioMixer);
  const lifecycle = new AbortController();
  let runtime: AppRuntime | undefined;
  let attempt = 0;

  const fail = (error: BunbunRuntimeError) => {
    runtime?.dispose();
    runtime = undefined;
    shell.setError(error.code, error.message);
  };

  const boot = async () => {
    runtime?.dispose();
    runtime = undefined;
    shell.setLoading();
    try {
      const worldRuntime = await createGameRuntime(
        shell,
        {
          ...config,
          simulateAssetFailure: config.simulateAssetFailure && attempt === 0,
        },
        audioMixer,
        fail,
        definition,
      );
      runtime = {
        dispose: () => {
          worldRuntime.dispose();
          audioMixer.restart();
        },
      };
      shell.setPersistenceStatus(
        "saved",
        "Closed local world preview · no lesson session is being recorded.",
      );
    } catch (error) {
      fail(
        error instanceof BunbunRuntimeError
          ? error
          : new BunbunRuntimeError(
              "RUNTIME_START_FAILED",
              error instanceof Error ? error.message : "Unknown runtime error.",
              { cause: error },
            ),
      );
    }
  };

  shell.retryButton.addEventListener(
    "click",
    () => {
      attempt += 1;
      void boot();
    },
    { signal: lifecycle.signal },
  );

  const dispose = () => {
    lifecycle.abort();
    runtime?.dispose();
    runtime = undefined;
    unbindAudioMixer();
    audioMixer.dispose();
  };
  window.addEventListener("pagehide", dispose, {
    once: true,
    signal: lifecycle.signal,
  });
  if (import.meta.hot !== undefined) import.meta.hot.dispose(dispose);
  await boot();
}

function loadSelectedLesson(
  selectedPackage: ValidatedLessonPackage | undefined,
  simulateManifestFailure: boolean,
): ValidatedLessonPackage {
  if (selectedPackage === undefined) {
    return loadAuthoredLesson(simulateManifestFailure);
  }
  const manifest = structuredClone(selectedPackage.manifest) as unknown;
  if (
    simulateManifestFailure &&
    typeof manifest === "object" &&
    manifest !== null &&
    !Array.isArray(manifest)
  ) {
    (manifest as Record<string, unknown>).schemaVersion = "broken";
  }
  return loadLessonPackage(manifest, structuredClone(selectedPackage.catalog));
}
