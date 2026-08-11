import "./style.css";

import { readRuntimeConfig } from "./game/config.js";
import {
  BunbunRuntimeError,
  createGameRuntime,
  type GameRuntime,
} from "./game/runtime.js";
import { createAppShell } from "./ui/shell.js";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("Bunbun app root was not found.");
}

const shell = createAppShell(app);
const baseConfig = readRuntimeConfig(window.location.search);
const lifecycle = new AbortController();
let runtime: GameRuntime | undefined;
let bootSequence = 0;
let attempt = 0;

async function boot(): Promise<void> {
  const sequence = ++bootSequence;
  runtime?.dispose();
  runtime = undefined;
  shell.setLoading();

  try {
    const nextRuntime = await createGameRuntime(
      shell,
      {
        ...baseConfig,
        simulateAssetFailure: baseConfig.simulateAssetFailure && attempt === 0,
      },
      handleFatalError,
    );
    if (sequence !== bootSequence) {
      nextRuntime.dispose();
      return;
    }
    runtime = nextRuntime;
  } catch (error) {
    if (sequence !== bootSequence) {
      return;
    }
    const runtimeError =
      error instanceof BunbunRuntimeError
        ? error
        : new BunbunRuntimeError(
            "RUNTIME_START_FAILED",
            error instanceof Error ? error.message : "Unknown runtime error.",
            { cause: error },
          );
    shell.setError(runtimeError.code, runtimeError.message);
  }
}

function handleFatalError(error: BunbunRuntimeError): void {
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
