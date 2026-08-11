import type { RendererBackend } from "../game/renderer.js";

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
  setLoading: () => void;
  setReady: (backend: RendererBackend, recoveredWithWebGL2: boolean) => void;
  setError: (code: string, message: string) => void;
  setPaused: (paused: boolean) => void;
  setSelection: (localId?: string, catalogId?: string) => void;
  setMovement: (movement: "idle" | "moving" | "paused") => void;
  setDiagnosticsOpen: (open: boolean) => void;
  updateDiagnostics: (snapshot: DiagnosticsSnapshot) => void;
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
          <p class="eyebrow" data-role="state-label">Milestone 3</p>
          <h2 data-role="state-title">Preparing the diorama…</h2>
          <p data-role="state-message">
            Initializing the renderer and validating the local park fixture.
          </p>
          <button class="primary-button" data-role="retry" type="button" hidden>
            Retry runtime
          </button>
        </section>

        <aside class="world-controls" aria-label="World controls">
          <p class="instruction-ja">地面をクリックして、歩いてみよう。</p>
          <p class="instruction-support">Click the ground to move. Select the dog or cat to inspect its stable ID.</p>
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
    setLoading: () => {
      statePanel.hidden = false;
      stateLabel.textContent = "Milestone 3";
      stateTitle.textContent = "Preparing the diorama…";
      stateMessage.textContent =
        "Initializing the renderer and validating the local park fixture.";
      retryButton.hidden = true;
      rendererPill.textContent = "Starting…";
      rendererPill.dataset.backend = "loading";
      runtimeState.textContent = "loading";
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
