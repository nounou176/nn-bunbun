import { AgXToneMapping, Color, SRGBColorSpace } from "three";
import { WebGPURenderer } from "three/webgpu";

export type RendererBackend = "webgpu" | "webgl2";

export interface RendererHandle {
  renderer: WebGPURenderer;
  backend: RendererBackend;
  recoveredWithWebGL2: boolean;
}

export async function createRenderer(
  canvas: HTMLCanvasElement,
  forceWebGL2: boolean,
): Promise<RendererHandle> {
  try {
    const renderer = await initializeRenderer(canvas, forceWebGL2);
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
      const renderer = await initializeRenderer(canvas, true);
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
  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    alpha: false,
    forceWebGL,
    powerPreference: "high-performance",
  });

  try {
    await renderer.init();
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = AgXToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(new Color("#dce9d2"), 1);
    return renderer;
  } catch (error) {
    renderer.dispose();
    throw error;
  }
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
