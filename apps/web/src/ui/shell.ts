import type { RendererBackend } from "../game/renderer.js";
import { currentStep, type LessonState } from "../lesson/controller.js";
import type { AudioGainName, AudioMixerSnapshot } from "../audio/mixer.js";

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
  resumeButton: HTMLButtonElement;
  startAgainButton: HTMLButtonElement;
  zoomInButton: HTMLButtonElement;
  zoomOutButton: HTMLButtonElement;
  diagnosticsButton: HTMLButtonElement;
  soundButton: HTMLButtonElement;
  closeSoundButton: HTMLButtonElement;
  unlockSoundButton: HTMLButtonElement;
  muteSoundButton: HTMLButtonElement;
  audioGainInputs: Readonly<Record<AudioGainName, HTMLInputElement>>;
  audioPreviewButtons: readonly HTMLButtonElement[];
  localDataButton: HTMLButtonElement;
  closeLocalDataButton: HTMLButtonElement;
  deleteLocalDataButton: HTMLButtonElement;
  confirmDeleteLocalDataButton: HTMLButtonElement;
  resumeModeSelect: HTMLSelectElement;
  audioButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  helpButton: HTMLButtonElement;
  restartLessonButton: HTMLButtonElement;
  choiceList: HTMLElement;
  arrangeBank: HTMLElement;
  arrangeAnswer: HTMLElement;
  arrangeSubmitButton: HTMLButtonElement;
  arrangeResetButton: HTMLButtonElement;
  typeForm: HTMLFormElement;
  typeInput: HTMLInputElement;
  setLoading: () => void;
  setResumePrompt: (
    lessonTitle: string,
    stepId: string,
    lastSavedAt: string,
  ) => void;
  setDataDeleted: () => void;
  setReady: (backend: RendererBackend, recoveredWithWebGL2: boolean) => void;
  setError: (code: string, message: string) => void;
  setPaused: (paused: boolean) => void;
  setSelection: (localId?: string, catalogId?: string) => void;
  setMovement: (movement: "idle" | "moving" | "paused") => void;
  setAudioError: (message?: string) => void;
  renderLesson: (state: LessonState) => void;
  setDiagnosticsOpen: (open: boolean) => void;
  setSoundPanelOpen: (open: boolean) => void;
  setSoundStatus: (message: string) => void;
  setLocalDataOpen: (open: boolean) => void;
  setPersistenceStatus: (
    status: "saving" | "saved" | "error",
    detail?: string,
  ) => void;
  renderLocalData: (snapshot: LocalDataSnapshot) => void;
  setDeleteConfirmation: (visible: boolean) => void;
  updateDiagnostics: (snapshot: DiagnosticsSnapshot) => void;
  updateAudioMixer: (snapshot: AudioMixerSnapshot) => void;
  updateLessonDiagnostics: (snapshot: LessonDiagnosticsSnapshot) => void;
}

export interface LocalDataSnapshot {
  resumeMode: "ASK" | "AUTO_RESUME" | "START_NEW";
  sessionCount: number;
  eventCount: number;
  activeSessionCount: number;
  targetSignal: string;
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
  worldTargetMode: "none" | "object" | "location" | "recipient";
  pendingLocationId: string | undefined;
  carriedObjectId: string | undefined;
  persistenceStatus: "saving" | "saved";
  checkpointSequence: number;
  storedEventCount: number;
  lastSavedAt: string;
}

export interface AppShellOptions {
  worldTitle?: string;
  worldSceneId?: string;
  worldAriaLabel?: string;
  loadingMessage?: string;
  instructionJa?: string;
  instructionSupport?: string;
  previewMode?: boolean;
}

export function createAppShell(
  app: HTMLDivElement,
  options: AppShellOptions = {},
): AppShell {
  const worldTitle = options.worldTitle ?? "Bunbun Park";
  const worldSceneId = options.worldSceneId ?? "park_small";
  const worldAriaLabel =
    options.worldAriaLabel ??
    "Bunbun isometric park. Follow the current Japanese instruction to select an object, location, or person.";
  const loadingMessage =
    options.loadingMessage ??
    "Validating the authored lesson before initializing the park.";
  const instructionJa =
    options.instructionJa ?? "日本語を使って、ゆきを助けよう。";
  const instructionSupport =
    options.instructionSupport ??
    "Complete the authored Japanese actions in the park.";
  const localDataHidden = options.previewMode === true ? "hidden" : "";
  app.innerHTML = `
    <main class="game-shell">
      <section class="world-stage" aria-labelledby="world-title">
        <canvas
          class="world-canvas"
          tabindex="0"
          aria-label="${worldAriaLabel}"
        ></canvas>

        <header class="world-header">
          <div class="brand-lockup">
            <span class="brand-mark" aria-hidden="true">ぶ</span>
            <div>
              <p class="eyebrow">ローカル・ランタイム</p>
              <h1 id="world-title">${worldTitle}</h1>
            </div>
          </div>
          <span class="renderer-pill" data-role="renderer">Starting…</span>
        </header>

        <section class="state-panel" data-role="state" aria-live="polite">
          <p class="eyebrow" data-role="state-label">Milestone 6</p>
          <h2 data-role="state-title">Preparing the lesson…</h2>
          <p data-role="state-message">
            Validating the authored lesson before initializing the park.
          </p>
          <button class="primary-button" data-role="retry" type="button" hidden>
            Retry runtime
          </button>
          <div class="resume-actions" data-role="resume-actions" hidden>
            <button class="primary-button" data-role="resume" type="button">
              Resume lesson
            </button>
            <button data-role="start-again" type="button">Start again</button>
          </div>
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
          <p class="lesson-pattern" data-role="lesson-pattern" hidden></p>
          <p class="lesson-meaning" data-role="lesson-meaning" hidden></p>
          <p class="lesson-support" data-role="lesson-support" hidden></p>
          <p class="lesson-world-action" data-role="lesson-world-action" hidden>
            <span data-role="lesson-world-action-ja"></span>
            <small data-role="lesson-world-action-support"></small>
          </p>
          <p class="lesson-movement-error" data-role="lesson-movement-error" hidden></p>
          <p class="lesson-audio-error" data-role="lesson-audio-error" hidden></p>
          <p class="lesson-audio-credit" data-role="lesson-audio-credit" hidden>Voice: VOICEVOX Nemo</p>
          <section class="arrange-control" data-role="arrange-control" aria-label="Sentence arrangement" hidden>
            <p class="control-label">ことば</p>
            <div class="token-list token-bank" data-role="arrange-bank"></div>
            <p class="control-label">文</p>
            <div class="token-list token-answer" data-role="arrange-answer"></div>
            <div class="arrange-actions">
              <button class="primary-button" data-role="arrange-submit" type="button">答える</button>
              <button data-role="arrange-reset" type="button">リセット</button>
            </div>
          </section>
          <form class="type-control" data-role="type-form" hidden>
            <label for="lesson-type-input">日本語で入力</label>
            <div class="type-input-row">
              <input id="lesson-type-input" data-role="type-input" type="text" inputmode="text" lang="ja" autocomplete="off" autocapitalize="off" spellcheck="false">
              <button class="primary-button" type="submit">答える</button>
            </div>
            <small data-role="type-limit"></small>
          </form>
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
          <p class="instruction-ja">${instructionJa}</p>
          <p class="instruction-support">${instructionSupport}</p>
          <output class="selection-output" data-role="selection">Nothing selected</output>
          <div class="button-row">
            <button type="button" data-role="zoom-out" aria-label="Zoom out">−</button>
            <button type="button" data-role="zoom-in" aria-label="Zoom in">＋</button>
            <button type="button" data-role="sound" aria-expanded="false">
              Sound
            </button>
            <button type="button" data-role="diagnostics" aria-expanded="false">
              Diagnostics
            </button>
            <button type="button" data-role="local-data" aria-expanded="false" ${localDataHidden}>
              Local data
            </button>
          </div>
        </aside>

        <aside class="sound-panel" data-role="sound-panel" aria-label="Audio mixer" hidden>
          <div class="sound-heading">
            <div>
              <p class="eyebrow">Local audio mixer</p>
              <p>One browser mixer · controls reset when this page closes.</p>
            </div>
            <button type="button" data-role="sound-close" aria-label="Close sound panel">×</button>
          </div>
          <output class="sound-state" data-role="sound-state">Audio waits for a learner action.</output>
          <div class="sound-actions">
            <button class="primary-button" type="button" data-role="sound-unlock">Start audio</button>
            <button type="button" data-role="sound-mute" aria-pressed="false">Mute</button>
          </div>
          <div class="sound-gains">
            <label>Master <output data-audio-gain-value="master">100%</output><input data-audio-gain="master" type="range" min="0" max="1" step="0.01" value="1"></label>
            <label>Voice <output data-audio-gain-value="voice">100%</output><input data-audio-gain="voice" type="range" min="0" max="1" step="0.01" value="1"></label>
            <label>Ambience <output data-audio-gain-value="ambience">35%</output><input data-audio-gain="ambience" type="range" min="0" max="1" step="0.01" value="0.35"></label>
            <label>Effects <output data-audio-gain-value="effects">65%</output><input data-audio-gain="effects" type="range" min="0" max="1" step="0.01" value="0.65"></label>
            <label>Music <output data-audio-gain-value="music">20%</output><input data-audio-gain="music" type="range" min="0" max="1" step="0.01" value="0.2"></label>
          </div>
          <div class="sound-preview" aria-label="Approved audio previews">
            <button type="button" data-audio-preview="amb_rain_03">Rain</button>
            <button type="button" data-audio-preview="amb_distant_road_01">Road</button>
            <button type="button" data-audio-preview="amb_distant_rail_01">Rail</button>
            <button type="button" data-audio-preview="amb_store_hum_01">Store</button>
            <button type="button" data-audio-preview="sfx_footstep_01">Step</button>
            <button type="button" data-audio-preview="sfx_cat_mew_01">Cat</button>
            <button type="button" data-audio-preview="amb_cat_purr_01">Purr</button>
            <button type="button" data-audio-preview="sfx_pickup_generic_000">Pickup</button>
            <button type="button" data-audio-preview="sfx_give_soft_001">Give</button>
            <button type="button" data-audio-preview="sfx_clue_wood_001">Clue</button>
            <button type="button" data-audio-preview="sfx_correct_001">Correct</button>
            <button type="button" data-audio-preview="sfx_incorrect_004">Incorrect</button>
            <button type="button" data-audio-preview="sfx_neutral_001">Neutral</button>
            <button type="button" data-audio-preview="cue_station_chime_01">Station</button>
            <button type="button" data-audio-preview="music_tension_pulse_01">Tension</button>
            <button type="button" data-audio-preview="music_resolution_sting_01">Resolve</button>
          </div>
          <details class="sound-credits">
            <summary>Audio sources and rights</summary>
            <ul>
              <li><a href="https://opengameart.org/content/rain-loopable" target="_blank" rel="noreferrer">Rain (loopable)</a> · Ylmir · CC0</li>
              <li><a href="https://opengameart.org/content/high-traffic-road-sounds" target="_blank" rel="noreferrer">High traffic road sounds</a> · IgnasD · CC0</li>
              <li><a href="https://opengameart.org/content/step-sound-walking" target="_blank" rel="noreferrer">Step sound (walking)</a> · IgnasD · CC0</li>
              <li><a href="https://opengameart.org/content/cat-purr-meow" target="_blank" rel="noreferrer">Cat Purr &amp; Meow</a> · Kerzoven · CC0</li>
              <li><a href="https://opengameart.org/content/underwater-or-space-engine-rumble" target="_blank" rel="noreferrer">underwater or space engine rumble</a> · gmason · CC0</li>
              <li><a href="https://kenney.nl/assets/impact-sounds" target="_blank" rel="noreferrer">Impact Sounds 1.0</a> · Kenney · CC0</li>
              <li><a href="https://kenney.nl/assets/interface-sounds" target="_blank" rel="noreferrer">Interface Sounds 1.0</a> · Kenney · CC0</li>
              <li>Store hum, station chime, tension pulse, and resolution sting · Bunbun project-authored</li>
            </ul>
          </details>
        </aside>

        <aside class="local-data-panel" data-role="local-data-panel" aria-label="Local learning data" hidden>
          <div class="local-data-heading">
            <div>
              <p class="eyebrow">Local learning data</p>
              <p>Stored only by this Bunbun server. Typed answers are never saved.</p>
            </div>
            <button type="button" data-role="local-data-close" aria-label="Close local data panel">×</button>
          </div>
          <output class="persistence-status" data-role="persistence-status">Preparing local storage…</output>
          <dl>
            <div><dt>Sessions</dt><dd data-local-data="sessions">—</dd></div>
            <div><dt>Evidence events</dt><dd data-local-data="events">—</dd></div>
            <div><dt>Active sessions</dt><dd data-local-data="active">—</dd></div>
            <div><dt>Current target</dt><dd data-local-data="signal">—</dd></div>
          </dl>
          <label class="resume-mode-label">
            On next visit
            <select data-role="resume-mode">
              <option value="ASK">Ask me</option>
              <option value="AUTO_RESUME">Resume automatically</option>
              <option value="START_NEW">Always start again</option>
            </select>
          </label>
          <div class="delete-data-actions">
            <button type="button" data-role="delete-local-data">Delete local learning data</button>
            <button class="danger-button" type="button" data-role="confirm-delete-local-data" hidden>
              Confirm permanent deletion
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
            <div><dt>Audio context</dt><dd data-diagnostic="audio-context">—</dd></div>
            <div><dt>Audio sources / loops</dt><dd data-diagnostic="audio-sources">—</dd></div>
            <div><dt>Audio decoded</dt><dd data-diagnostic="audio-decoded">—</dd></div>
            <div><dt>Audio duck / mute</dt><dd data-diagnostic="audio-state">—</dd></div>
            <div><dt>Audio unavailable</dt><dd data-diagnostic="audio-unavailable">—</dd></div>
            <div><dt>Lesson step</dt><dd data-diagnostic="lesson-step">—</dd></div>
            <div><dt>Lesson phase</dt><dd data-diagnostic="lesson-phase">—</dd></div>
            <div><dt>Events / reactions</dt><dd data-diagnostic="lesson-events">—</dd></div>
            <div><dt>Correct / wrong</dt><dd data-diagnostic="lesson-reaction-results">—</dd></div>
            <div><dt>Heard / step results</dt><dd data-diagnostic="lesson-evidence">—</dd></div>
            <div><dt>Assisted results</dt><dd data-diagnostic="lesson-assisted">—</dd></div>
            <div><dt>Lesson active</dt><dd data-diagnostic="lesson-active">—</dd></div>
            <div><dt>Last reaction</dt><dd data-diagnostic="lesson-reaction">—</dd></div>
            <div><dt>First stimulus</dt><dd data-diagnostic="lesson-first-stimulus">—</dd></div>
            <div><dt>World target</dt><dd data-diagnostic="lesson-world-target">—</dd></div>
            <div><dt>Pending location</dt><dd data-diagnostic="lesson-pending-location">—</dd></div>
            <div><dt>Carried object</dt><dd data-diagnostic="lesson-carried-object">—</dd></div>
            <div><dt>Persistence</dt><dd data-diagnostic="persistence-status">—</dd></div>
            <div><dt>Checkpoint</dt><dd data-diagnostic="checkpoint-sequence">—</dd></div>
            <div><dt>Stored events</dt><dd data-diagnostic="stored-events">—</dd></div>
            <div><dt>Last saved</dt><dd data-diagnostic="last-saved">—</dd></div>
            <div><dt>Session</dt><dd data-diagnostic="lesson-session">—</dd></div>
          </dl>
        </aside>

        <footer class="world-footer">
          <span>${worldSceneId}</span>
          <span data-role="runtime-state">loading</span>
          <span data-role="persistence-state">storage: loading</span>
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
  const resumeActions = required<HTMLElement>(
    app,
    '[data-role="resume-actions"]',
  );
  const resumeButton = required<HTMLButtonElement>(app, '[data-role="resume"]');
  const startAgainButton = required<HTMLButtonElement>(
    app,
    '[data-role="start-again"]',
  );
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
  const soundButton = required<HTMLButtonElement>(app, '[data-role="sound"]');
  const soundPanel = required<HTMLElement>(app, '[data-role="sound-panel"]');
  const closeSoundButton = required<HTMLButtonElement>(
    app,
    '[data-role="sound-close"]',
  );
  const unlockSoundButton = required<HTMLButtonElement>(
    app,
    '[data-role="sound-unlock"]',
  );
  const muteSoundButton = required<HTMLButtonElement>(
    app,
    '[data-role="sound-mute"]',
  );
  const soundState = required<HTMLOutputElement>(
    app,
    '[data-role="sound-state"]',
  );
  const audioGainInputs = Object.fromEntries(
    (["master", "voice", "ambience", "effects", "music"] as const).map(
      (name) => [
        name,
        required<HTMLInputElement>(app, `[data-audio-gain="${name}"]`),
      ],
    ),
  ) as Record<AudioGainName, HTMLInputElement>;
  const audioGainValues = Object.fromEntries(
    (["master", "voice", "ambience", "effects", "music"] as const).map(
      (name) => [
        name,
        required<HTMLOutputElement>(app, `[data-audio-gain-value="${name}"]`),
      ],
    ),
  ) as Record<AudioGainName, HTMLOutputElement>;
  const audioPreviewButtons = [
    ...app.querySelectorAll<HTMLButtonElement>("[data-audio-preview]"),
  ];
  const localDataButton = required<HTMLButtonElement>(
    app,
    '[data-role="local-data"]',
  );
  const localDataPanel = required<HTMLElement>(
    app,
    '[data-role="local-data-panel"]',
  );
  const closeLocalDataButton = required<HTMLButtonElement>(
    app,
    '[data-role="local-data-close"]',
  );
  const deleteLocalDataButton = required<HTMLButtonElement>(
    app,
    '[data-role="delete-local-data"]',
  );
  const confirmDeleteLocalDataButton = required<HTMLButtonElement>(
    app,
    '[data-role="confirm-delete-local-data"]',
  );
  const resumeModeSelect = required<HTMLSelectElement>(
    app,
    '[data-role="resume-mode"]',
  );
  const persistenceStatus = required<HTMLOutputElement>(
    app,
    '[data-role="persistence-status"]',
  );
  const persistenceState = required<HTMLElement>(
    app,
    '[data-role="persistence-state"]',
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
  const lessonPattern = required<HTMLElement>(
    app,
    '[data-role="lesson-pattern"]',
  );
  const lessonMeaning = required<HTMLElement>(
    app,
    '[data-role="lesson-meaning"]',
  );
  const lessonSupport = required<HTMLElement>(
    app,
    '[data-role="lesson-support"]',
  );
  const lessonWorldAction = required<HTMLElement>(
    app,
    '[data-role="lesson-world-action"]',
  );
  const lessonWorldActionJa = required<HTMLElement>(
    app,
    '[data-role="lesson-world-action-ja"]',
  );
  const lessonWorldActionSupport = required<HTMLElement>(
    app,
    '[data-role="lesson-world-action-support"]',
  );
  const lessonMovementError = required<HTMLElement>(
    app,
    '[data-role="lesson-movement-error"]',
  );
  const lessonAudioError = required<HTMLElement>(
    app,
    '[data-role="lesson-audio-error"]',
  );
  const lessonAudioCredit = required<HTMLElement>(
    app,
    '[data-role="lesson-audio-credit"]',
  );
  const lessonFeedback = required<HTMLOutputElement>(
    app,
    '[data-role="lesson-feedback"]',
  );
  const choiceList = required<HTMLElement>(app, '[data-role="choice-list"]');
  const arrangeControl = required<HTMLElement>(
    app,
    '[data-role="arrange-control"]',
  );
  const arrangeBank = required<HTMLElement>(app, '[data-role="arrange-bank"]');
  const arrangeAnswer = required<HTMLElement>(
    app,
    '[data-role="arrange-answer"]',
  );
  const arrangeSubmitButton = required<HTMLButtonElement>(
    app,
    '[data-role="arrange-submit"]',
  );
  const arrangeResetButton = required<HTMLButtonElement>(
    app,
    '[data-role="arrange-reset"]',
  );
  const typeForm = required<HTMLFormElement>(app, '[data-role="type-form"]');
  const typeInput = required<HTMLInputElement>(app, '[data-role="type-input"]');
  const typeLimit = required<HTMLElement>(app, '[data-role="type-limit"]');
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

  function setSoundPanelOpen(open: boolean): void {
    soundPanel.hidden = !open;
    soundButton.setAttribute("aria-expanded", String(open));
  }

  function setLocalDataOpen(open: boolean): void {
    localDataPanel.hidden = !open;
    localDataButton.setAttribute("aria-expanded", String(open));
  }

  return {
    viewport,
    canvas,
    retryButton,
    resumeButton,
    startAgainButton,
    zoomInButton,
    zoomOutButton,
    diagnosticsButton,
    soundButton,
    closeSoundButton,
    unlockSoundButton,
    muteSoundButton,
    audioGainInputs,
    audioPreviewButtons,
    localDataButton,
    closeLocalDataButton,
    deleteLocalDataButton,
    confirmDeleteLocalDataButton,
    resumeModeSelect,
    audioButton,
    continueButton,
    helpButton,
    restartLessonButton,
    choiceList,
    arrangeBank,
    arrangeAnswer,
    arrangeSubmitButton,
    arrangeResetButton,
    typeForm,
    typeInput,
    setLoading: () => {
      setSoundPanelOpen(false);
      statePanel.hidden = false;
      stateLabel.textContent = "Milestone 6";
      stateTitle.textContent = "Preparing the lesson…";
      stateMessage.textContent = loadingMessage;
      retryButton.hidden = true;
      retryButton.textContent = "Retry runtime";
      resumeActions.hidden = true;
      rendererPill.textContent = "Starting…";
      rendererPill.dataset.backend = "loading";
      runtimeState.textContent = "loading";
      lessonPanel.hidden = true;
      delete viewport.dataset.lessonMode;
      delete viewport.dataset.worldInput;
    },
    setResumePrompt: (lessonTitle, stepId, lastSavedAt) => {
      statePanel.hidden = false;
      stateLabel.textContent = "LOCAL SAVE";
      stateTitle.textContent = "Continue your lesson?";
      stateMessage.textContent = `${lessonTitle} is saved at step ${stepId}. Last local save: ${new Date(lastSavedAt).toLocaleString()}.`;
      retryButton.hidden = true;
      resumeButton.disabled = false;
      startAgainButton.disabled = false;
      resumeActions.hidden = false;
      lessonPanel.hidden = true;
      rendererPill.textContent = "Waiting…";
      rendererPill.dataset.backend = "loading";
      runtimeState.textContent = "awaiting choice";
      resumeButton.focus({ preventScroll: true });
    },
    setDataDeleted: () => {
      statePanel.hidden = false;
      stateLabel.textContent = "LOCAL DATA";
      stateTitle.textContent = "Local learning data deleted";
      stateMessage.textContent =
        "Lesson revisions, sessions, evidence, checkpoints, commits, and preferences were removed. Start fresh when you are ready.";
      retryButton.textContent = "Start fresh";
      retryButton.hidden = false;
      resumeActions.hidden = true;
      rendererPill.textContent = "Ready";
      rendererPill.dataset.backend = "loading";
      runtimeState.textContent = "reset";
      lessonPanel.hidden = true;
      delete viewport.dataset.lessonMode;
      delete viewport.dataset.worldInput;
      retryButton.focus({ preventScroll: true });
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
      setSoundPanelOpen(false);
      statePanel.hidden = false;
      stateLabel.textContent = code;
      stateTitle.textContent = `${worldTitle} could not start`;
      stateMessage.textContent = message;
      retryButton.hidden = false;
      resumeActions.hidden = true;
      rendererPill.textContent = "Error";
      rendererPill.dataset.backend = "error";
      runtimeState.textContent = "error";
      lessonPanel.hidden = true;
      delete viewport.dataset.lessonMode;
      delete viewport.dataset.worldInput;
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
      viewport.dataset.lessonMode = lessonPanel.dataset.mode;
      const worldInputActive = [
        "AWAITING_OBJECT",
        "AWAITING_LOCATION",
        "AWAITING_PICK_UP",
        "AWAITING_RECIPIENT",
      ].includes(state.phase);
      viewport.dataset.worldInput = worldInputActive ? "active" : "locked";
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
      lessonPattern.textContent = state.patternHint ?? "";
      lessonPattern.hidden = state.patternHint === undefined;
      lessonMeaning.textContent = state.meaningHint ?? "";
      lessonMeaning.hidden = state.meaningHint === undefined;
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
      const worldAction = worldActionCopy(
        state.phase,
        state.manifest.scene.sceneId,
      );
      lessonWorldActionJa.textContent = worldAction?.ja ?? "";
      lessonWorldActionSupport.textContent = worldAction?.support ?? "";
      lessonWorldAction.hidden = worldAction === undefined;
      lessonMovementError.textContent = state.movementError ?? "";
      lessonMovementError.hidden = state.movementError === undefined;
      lessonAudioError.textContent = audioErrorMessage ?? "";
      lessonAudioError.hidden = audioErrorMessage === undefined;
      const currentAudioAssetId = step.stimulus.utterance?.audioAssetId;
      const currentAudio = state.manifest.audioAssets.find(
        (asset) => asset.audioAssetId === currentAudioAssetId,
      );
      lessonAudioCredit.hidden = !["voice_aoi_01", "voice_tanaka_01"].includes(
        currentAudio?.voiceProfileId ?? "",
      );

      lessonFeedback.textContent =
        state.feedback?.textJa ?? state.feedback?.supportText ?? "";
      lessonFeedback.hidden = state.feedback === undefined;

      arrangeBank.replaceChildren();
      arrangeAnswer.replaceChildren();
      const isArrange = step.interaction.type === "ARRANGE";
      arrangeControl.hidden = !isArrange || state.phase === "COMPLETED";
      if (isArrange) {
        const tokens = new Map(
          step.interaction.tokens.map((token) => [token.tokenId, token]),
        );
        appendTokenButtons(
          arrangeBank,
          state.availableTokenIds,
          tokens,
          "Add",
          state.phase !== "AWAITING_ARRANGE",
        );
        appendTokenButtons(
          arrangeAnswer,
          state.arrangedTokenIds,
          tokens,
          "Remove",
          state.phase !== "AWAITING_ARRANGE",
        );
      }
      arrangeSubmitButton.disabled =
        state.phase !== "AWAITING_ARRANGE" ||
        state.availableTokenIds.length > 0;
      arrangeResetButton.disabled =
        state.phase !== "AWAITING_ARRANGE" ||
        state.arrangedTokenIds.length === 0;

      const isType = step.interaction.type === "TYPE";
      typeForm.hidden = !isType || state.phase === "COMPLETED";
      if (isType) {
        if (typeInput.value !== state.typeDraft) {
          typeInput.value = state.typeDraft;
        }
        typeInput.disabled = state.phase !== "AWAITING_TYPE";
        typeForm.querySelector<HTMLButtonElement>(
          'button[type="submit"]',
        )!.disabled =
          state.phase !== "AWAITING_TYPE" || state.typeDraft.length === 0;
        typeLimit.textContent = `${[...state.typeDraft].length} / ${step.interaction.maximumLength}`;
      } else {
        typeInput.value = "";
        typeLimit.textContent = "";
      }

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

      audioButton.hidden =
        currentAudioAssetId === undefined ||
        state.phase === "FEEDBACK" ||
        state.phase === "COMPLETED";
      audioButton.disabled = state.phase === "PLAYING_AUDIO";
      audioButton.textContent =
        state.phase === "AWAITING_AUDIO" ? "音声を聞く" : "もう一度聞く";
      continueButton.hidden = state.phase !== "AWAITING_CONTINUE";
      helpButton.hidden = state.phase === "COMPLETED";
      helpButton.disabled = state.phase === "FEEDBACK" || state.helpUsed;
      restartLessonButton.hidden = state.phase !== "COMPLETED";
    },
    setDiagnosticsOpen,
    setSoundPanelOpen,
    setSoundStatus: (message) => {
      soundState.textContent = message;
    },
    setLocalDataOpen,
    setPersistenceStatus: (status, detail) => {
      persistenceStatus.dataset.status = status;
      persistenceStatus.textContent =
        detail ??
        (status === "saving"
          ? "Saving locally…"
          : status === "saved"
            ? "Saved locally"
            : "Local storage error");
      persistenceState.textContent = `storage: ${status}`;
    },
    renderLocalData: (snapshot) => {
      resumeModeSelect.value = snapshot.resumeMode;
      localDataValue("sessions").textContent = String(snapshot.sessionCount);
      localDataValue("events").textContent = String(snapshot.eventCount);
      localDataValue("active").textContent = String(
        snapshot.activeSessionCount,
      );
      localDataValue("signal").textContent = snapshot.targetSignal;
    },
    setDeleteConfirmation: (visible) => {
      confirmDeleteLocalDataButton.hidden = !visible;
      deleteLocalDataButton.disabled = visible;
      if (visible) confirmDeleteLocalDataButton.focus({ preventScroll: true });
    },
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
    updateAudioMixer: (snapshot) => {
      soundState.textContent = snapshot.unlocked
        ? `${snapshot.contextState} · ${snapshot.activeSourceCount} active · ${snapshot.decodedAssetCount} decoded`
        : "Audio waits for a learner action.";
      unlockSoundButton.textContent = snapshot.unlocked
        ? "Audio started"
        : "Start audio";
      unlockSoundButton.disabled = snapshot.unlocked;
      muteSoundButton.textContent = snapshot.muted ? "Unmute" : "Mute";
      muteSoundButton.setAttribute("aria-pressed", String(snapshot.muted));
      (Object.keys(snapshot.gains) as AudioGainName[]).forEach((name) => {
        audioGainInputs[name].value = String(snapshot.gains[name]);
        audioGainValues[name].textContent =
          `${Math.round(snapshot.gains[name] * 100)}%`;
      });
      diagnostic("audio-context").textContent = snapshot.unlocked
        ? snapshot.contextState
        : `${snapshot.contextState} (locked)`;
      diagnostic("audio-sources").textContent =
        `${snapshot.activeSourceCount} / ${snapshot.activeLoopCount}`;
      diagnostic("audio-decoded").textContent = String(
        snapshot.decodedAssetCount,
      );
      diagnostic("audio-state").textContent =
        `${snapshot.ducking ? "duck" : "full"} / ${snapshot.muted ? "muted" : "audible"}`;
      diagnostic("audio-unavailable").textContent =
        snapshot.unavailableAssetIds.length === 0
          ? "—"
          : snapshot.unavailableAssetIds.join(", ");
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
      diagnostic("lesson-world-target").textContent = snapshot.worldTargetMode;
      diagnostic("lesson-pending-location").textContent =
        snapshot.pendingLocationId ?? "—";
      diagnostic("lesson-carried-object").textContent =
        snapshot.carriedObjectId ?? "—";
      diagnostic("persistence-status").textContent = snapshot.persistenceStatus;
      diagnostic("checkpoint-sequence").textContent = String(
        snapshot.checkpointSequence,
      );
      diagnostic("stored-events").textContent = String(
        snapshot.storedEventCount,
      );
      diagnostic("last-saved").textContent = new Date(
        snapshot.lastSavedAt,
      ).toLocaleTimeString();
      diagnostic("lesson-session").textContent = snapshot.sessionId.slice(
        0,
        12,
      );
    },
  };

  function localDataValue(name: string): HTMLElement {
    return required<HTMLElement>(app, `[data-local-data="${name}"]`);
  }
}

function appendTokenButtons(
  parent: HTMLElement,
  tokenIds: readonly string[],
  tokens: ReadonlyMap<string, { tokenId: string; textJa: string }>,
  action: "Add" | "Remove",
  disabled: boolean,
): void {
  tokenIds.forEach((tokenId, index) => {
    const token = tokens.get(tokenId);
    if (token === undefined) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "arrange-token";
    button.dataset.tokenId = token.tokenId;
    button.textContent = token.textJa;
    button.disabled = disabled;
    button.setAttribute(
      "aria-label",
      `${action} token ${index + 1}: ${token.textJa}`,
    );
    parent.append(button);
  });
}

function worldActionCopy(
  phase: LessonState["phase"],
  sceneId: string,
): { ja: string; support: string } | undefined {
  const isNeighborhood = sceneId === "neighborhood_small";
  switch (phase) {
    case "AWAITING_OBJECT":
      return isNeighborhood
        ? {
            ja: "手がかりをクリック",
            support: "Chọn đúng manh mối trực tiếp trong khu phố",
          }
        : {
            ja: "公園の動物をクリック",
            support: "Chọn một con vật trực tiếp trong công viên",
          };
    case "AWAITING_LOCATION":
      return {
        ja: "場所のマーカーをクリック",
        support: "Chọn một địa điểm được đánh dấu trong công viên",
      };
    case "MOVING_TO_LOCATION":
      return { ja: "移動中…", support: "Bunbun đang đi đến địa điểm đã chọn" };
    case "AWAITING_PICK_UP":
      return isNeighborhood
        ? {
            ja: "拾うものをクリック",
            support: "Chọn đúng đồ vật để nhặt lên",
          }
        : {
            ja: "連れていく動物をクリック",
            support: "Chọn con vật sẽ đi cùng Bunbun",
          };
    case "AWAITING_RECIPIENT":
      return {
        ja: "渡す相手をクリック",
        support: "Chọn người sẽ nhận con vật đang đi cùng",
      };
    default:
      return undefined;
  }
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
