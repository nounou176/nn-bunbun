import "./style.css";

import { readRuntimeConfig } from "./game/config.js";
import { BunbunRuntimeError, createGameRuntime } from "./game/runtime.js";
import { LessonContentError, loadAuthoredLesson } from "./lesson/content.js";
import { createLessonRuntime } from "./lesson/runtime.js";
import { packageFingerprint } from "./persistence/fingerprint.js";
import { createHttpEvidenceStore } from "./persistence/http.js";
import { createAppShell } from "./ui/shell.js";
import { EVIDENCE_PERSISTENCE_SCHEMA_VERSION } from "@bunbun/contracts";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("Bunbun app root was not found.");
}

const shell = createAppShell(app);
const baseConfig = readRuntimeConfig(window.location.search);
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
    const lessonPackage = loadAuthoredLesson(
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
        simulateAssetFailure: baseConfig.simulateAssetFailure && attempt === 0,
      },
      handleFatalError,
    );
    let lessonRuntime;
    try {
      lessonRuntime = await createLessonRuntime(
        shell,
        worldRuntime,
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
        resolve("RESUME");
      },
      { once: true, signal: selection.signal },
    );
    shell.startAgainButton.addEventListener(
      "click",
      () => {
        selection.abort();
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
  const lessonPackage = loadAuthoredLesson(false);
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
          error instanceof Error ? error.message : "Could not save preference.",
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

window.addEventListener("pagehide", () => runtime?.dispose(), {
  once: true,
  signal: lifecycle.signal,
});

if (import.meta.hot !== undefined) {
  import.meta.hot.dispose(() => {
    lifecycle.abort();
    runtime?.dispose();
  });
}

void boot();

interface AppRuntime {
  dispose: () => void;
}
