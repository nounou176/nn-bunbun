import { AgXToneMapping, Color, SRGBColorSpace } from "three";
import { WebGPURenderer } from "three/webgpu";

export type RendererBackend = "webgpu" | "webgl2";

export interface RendererHandle {
  renderer: WebGPURenderer;
  backend: RendererBackend;
  recoveredWithWebGL2: boolean;
}

type RendererInitializer = (
  canvas: HTMLCanvasElement,
  forceWebGL: boolean,
) => Promise<WebGPURenderer>;

export async function createRenderer(
  canvas: HTMLCanvasElement,
  forceWebGL2: boolean,
  replaceCanvas: () => HTMLCanvasElement = () => canvas,
  initialize: RendererInitializer = initializeRenderer,
): Promise<RendererHandle> {
  try {
    const renderer = await initialize(canvas, forceWebGL2);
    return {
      renderer,
      backend: detectBackend(renderer),
      recoveredWithWebGL2: false,
    };
  } catch (automaticError) {
    if (forceWebGL2) {
      throw rendererError(automaticError);
    }

    try {
      const fallbackCanvas = replaceCanvas();
      const renderer = await initialize(fallbackCanvas, true);
      return {
        renderer,
        backend: "webgl2",
        recoveredWithWebGL2: true,
      };
    } catch (fallbackError) {
      throw new Error(
        `Renderer initialization failed in automatic mode (${errorMessage(automaticError)}) and forced WebGL2 mode (${errorMessage(fallbackError)}).`,
        { cause: fallbackError },
      );
    }
  }
}

async function initializeRenderer(
  canvas: HTMLCanvasElement,
  forceWebGL: boolean,
): Promise<WebGPURenderer> {
  const context = forceWebGL ? acquireHealthyWebGL2Context(canvas) : undefined;
  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    alpha: false,
    forceWebGL,
    powerPreference: "high-performance",
    ...(context === undefined ? {} : { context }),
  });

  try {
    await renderer.init();
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = AgXToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(new Color("#dce9d2"), 1);
    return renderer;
  } catch (error) {
    try {
      renderer.dispose();
    } catch {
      /* A partially initialized backend must not hide the original error. */
    }
    throw error;
  }
}

function acquireHealthyWebGL2Context(
  canvas: HTMLCanvasElement,
): WebGL2RenderingContext {
  const context = canvas.getContext("webgl2", {
    antialias: true,
    alpha: true,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (context === null) {
    throw new Error(
      "WebGL2 context is unavailable. Reload the page; if it persists, restart the browser to recover its GPU process.",
    );
  }
  const scissor = context.getParameter(
    context.SCISSOR_BOX,
  ) as ArrayLike<number> | null;
  const viewport = context.getParameter(
    context.VIEWPORT,
  ) as ArrayLike<number> | null;
  if (
    context.isContextLost() ||
    scissor === null ||
    scissor.length < 4 ||
    viewport === null ||
    viewport.length < 4
  ) {
    throw new Error(
      "WebGL2 context is already lost. Reload the page; if it persists, restart the browser to recover its GPU process.",
    );
  }
  return context;
}

function detectBackend(renderer: WebGPURenderer): RendererBackend {
  const backend = renderer.backend as typeof renderer.backend & {
    isWebGPUBackend?: boolean;
  };
  return backend.isWebGPUBackend === true ? "webgpu" : "webgl2";
}

function rendererError(error: unknown): Error {
  return new Error(`Renderer initialization failed. ${errorMessage(error)}`, {
    cause: error,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown renderer error.";
}
