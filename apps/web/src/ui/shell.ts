import type { RendererBackend } from "../game/renderer.js";
import { currentStep, type LessonState } from "../lesson/controller.js";

export interface DiagnosticsSnapshot {
  renderer: RendererBackend;
  fps: number;
  averageFrameMs: number;
  p95FrameMs: number;
  drawCalls: number;
  triangles: number;
  renderSize: string;
  devicePixelRatio: number;
  sceneReadyMs: number;
  pickingMs: number | undefined;
  selectedId: string | undefined;
  movement: "idle" | "moving" | "paused";
}

export interface AppShell {
  viewport: HTMLElement;
  canvas: HTMLCanvasElement;
  retryButton: HTMLButtonElement;
  zoomInButton: HTMLButtonElement;
  zoomOutButton: HTMLButtonElement;
  diagnosticsButton: HTMLButtonElement;
  audioButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  helpButton: HTMLButtonElement;
  restartLessonButton: HTMLButtonElement;
  choiceList: HTMLElement;
  setLoading: () => void;
  setReady: (backend: RendererBackend, recoveredWithWebGL2: boolean) => void;
  setError: (code: string, message: string) => void;
  setPaused: (paused: boolean) => void;
  setSelection: (localId?: string, catalogId?: string) => void;
  setMovement: (movement: "idle" | "moving" | "paused") => void;
  setAudioError: (message?: string) => void;
  renderLesson: (state: LessonState) => void;
  setDiagnosticsOpen: (open: boolean) => void;
  updateDiagnostics: (snapshot: DiagnosticsSnapshot) => void;
  updateLessonDiagnostics: (snapshot: LessonDiagnosticsSnapshot) => void;
}

export interface LessonDiagnosticsSnapshot {
  sessionId: string;
  stepId: string;
  phase: string;
  eventCount: number;
  reactionCount: number;
  correctReactionCount: number;
  incorrectReactionCount: number;
  heardCount: number;
  terminalResultCount: number;
  assistedResultCount: number;
  completedStepCount: number;
  totalStepCount: number;
  activeTimeMs: number;
  lastReactionMs: number | undefined;
  firstStimulusMs: number;
}

export function createAppShell(app: HTMLDivElement): AppShell {
  app.innerHTML = `
    <main class="game-shell">
      <section class="world-stage" aria-labelledby="world-title">
        <canvas
          class="world-canvas"
          tabindex="0"
          aria-label="Bunbun isometric park. Click the ground to move and click an animal to select it."
        ></canvas>

        <header class="world-header">
          <div class="brand-lockup">
            <span class="brand-mark" aria-hidden="true">ぶ</span>
            <div>
              <p class="eyebrow">ローカル・ランタイム</p>
              <h1 id="world-title">Bunbun Park</h1>
            </div>
          </div>
          <span class="renderer-pill" data-role="renderer">Starting…</span>
        </header>

        <section class="state-panel" data-role="state" aria-live="polite">
          <p class="eyebrow" data-role="state-label">Milestone 4</p>
          <h2 data-role="state-title">Preparing the lesson…</h2>
          <p data-role="state-message">
            Validating the authored lesson before initializing the park.
          </p>
          <button class="primary-button" data-role="retry" type="button" hidden>
            Retry runtime
          </button>
        </section>

        <section class="lesson-panel" data-role="lesson" aria-label="Japanese lesson" aria-live="polite" hidden>
          <div class="lesson-heading">
            <span data-role="lesson-mode">INTERACTION</span>
            <span data-role="lesson-progress">1 / 3</span>
          </div>
          <p class="lesson-speaker" data-role="lesson-speaker"></p>
          <h2 class="lesson-instruction" data-role="lesson-instruction"></h2>
          <p class="lesson-utterance" data-role="lesson-utterance"></p>
          <p class="lesson-reading" data-role="lesson-reading" hidden></p>
          <p class="lesson-support" data-role="lesson-support" hidden></p>
          <p class="lesson-audio-error" data-role="lesson-audio-error" hidden></p>
          <div class="choice-list" data-role="choice-list"></div>
          <output class="lesson-feedback" data-role="lesson-feedback"></output>
          <div class="lesson-actions">
            <button class="primary-button" data-role="lesson-audio" type="button" hidden>
              音声を聞く
            </button>
            <button class="primary-button" data-role="lesson-continue" type="button" hidden>
              次へ
            </button>
            <button data-role="lesson-help" type="button">ヒント</button>
            <button data-role="lesson-restart" type="button" hidden>もう一度</button>
          </div>
        </section>

        <aside class="world-controls" aria-label="World controls">
          <p class="instruction-ja">日本語を聞いて、犬を探そう。</p>
          <p class="instruction-support">Listen, inspect the park, and respond to the authored lesson.</p>
          <output class="selection-output" data-role="selection">Nothing selected</output>
          <div class="button-row">
            <button type="button" data-role="zoom-out" aria-label="Zoom out">−</button>
            <button type="button" data-role="zoom-in" aria-label="Zoom in">＋</button>
            <button type="button" data-role="diagnostics" aria-expanded="false">
              Diagnostics
            </button>
          </div>
        </aside>

        <aside class="diagnostics-panel" data-role="diagnostics-panel" hidden>
          <div class="diagnostics-heading">
            <p class="eyebrow">Runtime diagnostics</p>
            <span data-role="movement">idle</span>
          </div>
          <dl>
            <div><dt>Renderer</dt><dd data-diagnostic="renderer">—</dd></div>
            <div><dt>FPS</dt><dd data-diagnostic="fps">—</dd></div>
            <div><dt>Frame avg / p95</dt><dd data-diagnostic="frame">—</dd></div>
            <div><dt>Draw calls</dt><dd data-diagnostic="draw-calls">—</dd></div>
            <div><dt>Triangles</dt><dd data-diagnostic="triangles">—</dd></div>
            <div><dt>Render size</dt><dd data-diagnostic="render-size">—</dd></div>
            <div><dt>DPR</dt><dd data-diagnostic="dpr">—</dd></div>
            <div><dt>Scene ready</dt><dd data-diagnostic="scene-ready">—</dd></div>
            <div><dt>Pick response</dt><dd data-diagnostic="picking">—</dd></div>
            <div><dt>Selected ID</dt><dd data-diagnostic="selected">—</dd></div>
            <div><dt>Lesson step</dt><dd data-diagnostic="lesson-step">—</dd></div>
            <div><dt>Lesson phase</dt><dd data-diagnostic="lesson-phase">—</dd></div>
            <div><dt>Events / reactions</dt><dd data-diagnostic="lesson-events">—</dd></div>
            <div><dt>Correct / wrong</dt><dd data-diagnostic="lesson-reaction-results">—</dd></div>
            <div><dt>Heard / step results</dt><dd data-diagnostic="lesson-evidence">—</dd></div>
            <div><dt>Assisted results</dt><dd data-diagnostic="lesson-assisted">—</dd></div>
            <div><dt>Lesson active</dt><dd data-diagnostic="lesson-active">—</dd></div>
            <div><dt>Last reaction</dt><dd data-diagnostic="lesson-reaction">—</dd></div>
            <div><dt>First stimulus</dt><dd data-diagnostic="lesson-first-stimulus">—</dd></div>
            <div><dt>Session</dt><dd data-diagnostic="lesson-session">—</dd></div>
          </dl>
        </aside>

        <footer class="world-footer">
          <span>park_small</span>
          <span data-role="runtime-state">loading</span>
        </footer>
      </section>
    </main>
  `;

  const viewport = required<HTMLElement>(app, ".world-stage");
  const canvas = required<HTMLCanvasElement>(app, ".world-canvas");
  const statePanel = required<HTMLElement>(app, '[data-role="state"]');
  const stateLabel = required<HTMLElement>(app, '[data-role="state-label"]');
  const stateTitle = required<HTMLElement>(app, '[data-role="state-title"]');
  const stateMessage = required<HTMLElement>(
    app,
    '[data-role="state-message"]',
  );
  const retryButton = required<HTMLButtonElement>(app, '[data-role="retry"]');
  const zoomInButton = required<HTMLButtonElement>(
    app,
    '[data-role="zoom-in"]',
  );
  const zoomOutButton = required<HTMLButtonElement>(
    app,
    '[data-role="zoom-out"]',
  );
  const diagnosticsButton = required<HTMLButtonElement>(
    app,
    '[data-role="diagnostics"]',
  );
  const diagnosticsPanel = required<HTMLElement>(
    app,
    '[data-role="diagnostics-panel"]',
  );
  const rendererPill = required<HTMLElement>(app, '[data-role="renderer"]');
  const selectionOutput = required<HTMLOutputElement>(
    app,
    '[data-role="selection"]',
  );
  const runtimeState = required<HTMLElement>(
    app,
    '[data-role="runtime-state"]',
  );
  const movementState = required<HTMLElement>(app, '[data-role="movement"]');
  const lessonPanel = required<HTMLElement>(app, '[data-role="lesson"]');
  const lessonMode = required<HTMLElement>(app, '[data-role="lesson-mode"]');
  const lessonProgress = required<HTMLElement>(
    app,
    '[data-role="lesson-progress"]',
  );
  const lessonSpeaker = required<HTMLElement>(
    app,
    '[data-role="lesson-speaker"]',
  );
  const lessonInstruction = required<HTMLElement>(
    app,
    '[data-role="lesson-instruction"]',
  );
  const lessonUtterance = required<HTMLElement>(
    app,
    '[data-role="lesson-utterance"]',
  );
  const lessonReading = required<HTMLElement>(
    app,
    '[data-role="lesson-reading"]',
  );
  const lessonSupport = required<HTMLElement>(
    app,
    '[data-role="lesson-support"]',
  );
  const lessonAudioError = required<HTMLElement>(
    app,
    '[data-role="lesson-audio-error"]',
  );
  const lessonFeedback = required<HTMLOutputElement>(
    app,
    '[data-role="lesson-feedback"]',
  );
  const choiceList = required<HTMLElement>(app, '[data-role="choice-list"]');
  const audioButton = required<HTMLButtonElement>(
    app,
    '[data-role="lesson-audio"]',
  );
  const continueButton = required<HTMLButtonElement>(
    app,
    '[data-role="lesson-continue"]',
  );
  const helpButton = required<HTMLButtonElement>(
    app,
    '[data-role="lesson-help"]',
  );
  const restartLessonButton = required<HTMLButtonElement>(
    app,
    '[data-role="lesson-restart"]',
  );
  let audioErrorMessage: string | undefined;

  const diagnostic = (name: string) =>
    required<HTMLElement>(app, `[data-diagnostic="${name}"]`);

  function setDiagnosticsOpen(open: boolean): void {
    diagnosticsPanel.hidden = !open;
    diagnosticsButton.setAttribute("aria-expanded", String(open));
  }

  return {
    viewport,
    canvas,
    retryButton,
    zoomInButton,
    zoomOutButton,
    diagnosticsButton,
    audioButton,
    continueButton,
    helpButton,
    restartLessonButton,
    choiceList,
    setLoading: () => {
      statePanel.hidden = false;
      stateLabel.textContent = "Milestone 4";
      stateTitle.textContent = "Preparing the lesson…";
      stateMessage.textContent =
        "Validating the authored lesson before initializing the park.";
      retryButton.hidden = true;
      rendererPill.textContent = "Starting…";
      rendererPill.dataset.backend = "loading";
      runtimeState.textContent = "loading";
      lessonPanel.hidden = true;
    },
    setReady: (backend, recoveredWithWebGL2) => {
      statePanel.hidden = true;
      rendererPill.textContent = backend.toUpperCase();
      rendererPill.dataset.backend = backend;
      rendererPill.title = recoveredWithWebGL2
        ? "Automatic renderer initialization failed and recovered with WebGL2."
        : `Active renderer backend: ${backend}`;
      runtimeState.textContent = "ready";
    },
    setError: (code, message) => {
      statePanel.hidden = false;
      stateLabel.textContent = code;
      stateTitle.textContent = "The park could not start";
      stateMessage.textContent = message;
      retryButton.hidden = false;
      rendererPill.textContent = "Error";
      rendererPill.dataset.backend = "error";
      runtimeState.textContent = "error";
      lessonPanel.hidden = true;
    },
    setPaused: (paused) => {
      runtimeState.textContent = paused ? "paused" : "ready";
    },
    setSelection: (localId, catalogId) => {
      selectionOutput.textContent =
        localId === undefined
          ? "Nothing selected"
          : `${localId} · ${catalogId ?? "catalog ID unavailable"}`;
    },
    setMovement: (movement) => {
      movementState.textContent = movement;
    },
    setAudioError: (message) => {
      audioErrorMessage = message;
      lessonAudioError.textContent = message ?? "";
      lessonAudioError.hidden = message === undefined;
    },
    renderLesson: (state) => {
      const step = currentStep(state);
      const stepIndex = state.manifest.steps.findIndex(
        (candidate) => candidate.stepId === step.stepId,
      );
      lessonPanel.hidden = false;
      lessonPanel.dataset.mode =
        state.phase === "COMPLETED" ? "COMPLETED" : step.mode;
      lessonPanel.dataset.phase = state.phase;
      lessonMode.textContent =
        state.phase === "COMPLETED" ? "COMPLETE" : step.mode;
      lessonProgress.textContent = `${Math.max(1, stepIndex + 1)} / ${state.manifest.steps.length}`;

      const speaker = step.stimulus.utterance?.speakerEntityId;
      const speakerEntity = state.manifest.entities.find(
        (entity) => entity.entityId === speaker,
      );
      lessonSpeaker.textContent = speakerEntity?.displayNameJa ?? "";
      lessonSpeaker.hidden = lessonSpeaker.textContent.length === 0;

      if (state.phase === "COMPLETED") {
        lessonInstruction.textContent =
          state.manifest.completion.closingMessage?.ja ?? "レッスン完了";
        lessonUtterance.textContent =
          state.manifest.completion.closingMessage?.support ?? "";
        lessonUtterance.hidden = lessonUtterance.textContent.length === 0;
      } else {
        lessonInstruction.textContent =
          step.stimulus.instructionJa ?? step.stimulus.utterance?.textJa ?? "";
        const showJapanese =
          step.stimulus.utterance?.textVisibility === "ALWAYS" ||
          state.helpUsed ||
          state.audioFailed ||
          state.activeScaffoldIds.some((scaffoldId) =>
            step.scaffolds.some(
              (scaffold) =>
                scaffold.scaffoldId === scaffoldId &&
                scaffold.kind === "SHOW_JAPANESE_TEXT",
            ),
          );
        lessonUtterance.textContent = showJapanese
          ? (step.stimulus.utterance?.textJa ?? "")
          : "";
        lessonUtterance.hidden = lessonUtterance.textContent.length === 0;
      }

      lessonReading.textContent = state.readingHint ?? "";
      lessonReading.hidden = state.readingHint === undefined;
      const showSupport =
        state.phase === "COMPLETED" ||
        step.stimulus.supportVisibility === "ALWAYS" ||
        state.helpUsed ||
        state.audioFailed;
      lessonSupport.textContent =
        state.phase !== "COMPLETED" && showSupport
          ? (step.stimulus.supportText ?? "")
          : "";
      lessonSupport.hidden = lessonSupport.textContent.length === 0;
      lessonAudioError.textContent = audioErrorMessage ?? "";
      lessonAudioError.hidden = audioErrorMessage === undefined;

      lessonFeedback.textContent =
        state.feedback?.textJa ?? state.feedback?.supportText ?? "";
      lessonFeedback.hidden = state.feedback === undefined;

      choiceList.replaceChildren();
      if (state.phase === "AWAITING_CHOICE") {
        state.visibleOptions.forEach((option) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "choice-button";
          button.dataset.optionId = option.optionId;
          button.textContent = option.textJa;
          choiceList.append(button);
        });
      }

      const isListen = step.interaction.type === "LISTEN";
      audioButton.hidden =
        !isListen || state.phase === "FEEDBACK" || state.phase === "COMPLETED";
      audioButton.disabled = state.phase === "PLAYING_AUDIO";
      audioButton.textContent =
        state.phase === "AWAITING_AUDIO" ? "音声を聞く" : "もう一度聞く";
      continueButton.hidden = state.phase !== "AWAITING_CONTINUE";
      helpButton.hidden = state.phase === "COMPLETED";
      helpButton.disabled = state.phase === "FEEDBACK" || state.helpUsed;
      restartLessonButton.hidden = state.phase !== "COMPLETED";
    },
    setDiagnosticsOpen,
    updateDiagnostics: (snapshot) => {
      diagnostic("renderer").textContent = snapshot.renderer;
      diagnostic("fps").textContent = snapshot.fps.toFixed(0);
      diagnostic("frame").textContent =
        `${snapshot.averageFrameMs.toFixed(1)} / ${snapshot.p95FrameMs.toFixed(1)} ms`;
      diagnostic("draw-calls").textContent = String(snapshot.drawCalls);
      diagnostic("triangles").textContent = snapshot.triangles.toLocaleString();
      diagnostic("render-size").textContent = snapshot.renderSize;
      diagnostic("dpr").textContent = snapshot.devicePixelRatio.toFixed(2);
      diagnostic("scene-ready").textContent =
        `${snapshot.sceneReadyMs.toFixed(0)} ms`;
      diagnostic("picking").textContent =
        snapshot.pickingMs === undefined
          ? "—"
          : `${snapshot.pickingMs.toFixed(1)} ms`;
      diagnostic("selected").textContent = snapshot.selectedId ?? "—";
      movementState.textContent = snapshot.movement;
    },
    updateLessonDiagnostics: (snapshot) => {
      diagnostic("lesson-step").textContent =
        `${snapshot.stepId} (${snapshot.completedStepCount}/${snapshot.totalStepCount})`;
      diagnostic("lesson-phase").textContent = snapshot.phase;
      diagnostic("lesson-events").textContent =
        `${snapshot.eventCount} / ${snapshot.reactionCount}`;
      diagnostic("lesson-reaction-results").textContent =
        `${snapshot.correctReactionCount} / ${snapshot.incorrectReactionCount}`;
      diagnostic("lesson-evidence").textContent =
        `${snapshot.heardCount} / ${snapshot.terminalResultCount}`;
      diagnostic("lesson-assisted").textContent = String(
        snapshot.assistedResultCount,
      );
      diagnostic("lesson-active").textContent =
        `${snapshot.activeTimeMs.toFixed(0)} ms`;
      diagnostic("lesson-reaction").textContent =
        snapshot.lastReactionMs === undefined
          ? "—"
          : `${snapshot.lastReactionMs.toFixed(0)} ms`;
      diagnostic("lesson-first-stimulus").textContent =
        `${snapshot.firstStimulusMs.toFixed(0)} ms`;
      diagnostic("lesson-session").textContent = snapshot.sessionId.slice(
        0,
        12,
      );
    },
  };
}

function required<ElementType extends Element>(
  root: ParentNode,
  selector: string,
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) {
    throw new Error(`Required Bunbun UI element was not found: ${selector}`);
  }
  return element;
}
