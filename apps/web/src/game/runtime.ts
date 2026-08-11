import { Object3D, Raycaster, Vector2, Vector3 } from "three";

import type { AppShell, DiagnosticsSnapshot } from "../ui/shell.js";
import {
  clampZoom,
  createIsometricCamera,
  DEFAULT_ZOOM,
  resizeOrthographicCamera,
} from "./camera.js";
import type { RuntimeConfig } from "./config.js";
import { FrameMeter } from "./frame-meter.js";
import {
  LessonWorldInputGate,
  type LessonWorldInputConfiguration,
} from "./lesson-input-gate.js";
import { isInsideWalkableBounds, stepToward } from "./navigation.js";
import { PARK_SCENE_DEFINITION } from "./park-definition.js";
import { loadParkWorld } from "./park-world.js";
import { createRenderer } from "./renderer.js";

const MAXIMUM_DEVICE_PIXEL_RATIO = 1.5;
const MOVEMENT_SPEED = 3.4;
const MAXIMUM_FRAME_DELTA_SECONDS = 0.05;
const DIAGNOSTIC_UPDATE_INTERVAL_MS = 250;

export interface GameRuntime {
  configureLessonInput: (configuration: LessonWorldInputConfiguration) => void;
  applyCues: (cueIds: readonly string[]) => void;
  dispose: () => void;
}

export class BunbunRuntimeError extends Error {
  constructor(
    readonly code: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export async function createGameRuntime(
  shell: AppShell,
  config: RuntimeConfig,
  onFatalError: (error: BunbunRuntimeError) => void,
): Promise<GameRuntime> {
  const startedAt = performance.now();
  const abortController = new AbortController();
  const signal = abortController.signal;
  let rendererHandle;

  try {
    rendererHandle = await createRenderer(shell.canvas, config.forceWebGL2);
  } catch (error) {
    throw new BunbunRuntimeError(
      "RUNTIME_RENDERER_INIT_FAILED",
      messageOf(error),
      { cause: error },
    );
  }

  let world;
  try {
    world = await loadParkWorld(
      PARK_SCENE_DEFINITION,
      config.simulateAssetFailure,
    );
  } catch (error) {
    rendererHandle.renderer.dispose();
    throw new BunbunRuntimeError(
      "RUNTIME_ASSET_LOAD_FAILED",
      messageOf(error),
      {
        cause: error,
      },
    );
  }

  const { renderer, backend, recoveredWithWebGL2 } = rendererHandle;
  const camera = createIsometricCamera(PARK_SCENE_DEFINITION.cameraTarget);
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const frameMeter = new FrameMeter();
  const lessonInput = new LessonWorldInputGate();
  const worldPosition = new Vector3();
  let zoom = DEFAULT_ZOOM;
  let destination: Vector2 | undefined;
  let selectedId: string | undefined;
  let latestPickingMs: number | undefined;
  let lastFrameTime = performance.now();
  let lastDiagnosticUpdate = 0;
  let sceneReadyMs = 0;
  let disposed = false;
  let movement: DiagnosticsSnapshot["movement"] = "idle";

  const resize = () => {
    const width = Math.max(1, shell.viewport.clientWidth);
    const height = Math.max(1, shell.viewport.clientHeight);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAXIMUM_DEVICE_PIXEL_RATIO),
    );
    renderer.setSize(width, height, false);
    resizeOrthographicCamera(camera, width, height, zoom);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(shell.viewport);
  resize();

  const setMovement = (next: DiagnosticsSnapshot["movement"]) => {
    if (movement !== next) {
      movement = next;
      shell.setMovement(next);
    }
  };

  const renderFrame = (time: DOMHighResTimeStamp) => {
    if (disposed) {
      return;
    }

    const frameMs = Math.max(0.01, time - lastFrameTime);
    const deltaSeconds = Math.min(frameMs / 1000, MAXIMUM_FRAME_DELTA_SECONDS);
    lastFrameTime = time;
    frameMeter.addSample(frameMs);

    if (destination !== undefined) {
      const step = stepToward(
        { x: world.player.position.x, z: world.player.position.z },
        { x: destination.x, z: destination.y },
        MOVEMENT_SPEED * deltaSeconds,
      );
      const facingX = step.position.x - world.player.position.x;
      const facingZ = step.position.z - world.player.position.z;
      world.player.position.x = step.position.x;
      world.player.position.z = step.position.z;
      if (Math.hypot(facingX, facingZ) > 0.001) {
        world.player.rotation.y = Math.atan2(facingX, facingZ);
      }

      if (step.arrived) {
        destination = undefined;
        world.destinationMarker.visible = false;
        setMovement("idle");
      } else {
        setMovement("moving");
      }
    }

    renderer.render(world.scene, camera);

    if (time - lastDiagnosticUpdate >= DIAGNOSTIC_UPDATE_INTERVAL_MS) {
      lastDiagnosticUpdate = time;
      updateDiagnostics();
    }
  };

  const updateDiagnostics = () => {
    const frame = frameMeter.read();
    shell.updateDiagnostics({
      renderer: backend,
      ...frame,
      drawCalls: renderer.info.render.drawCalls,
      triangles: renderer.info.render.triangles,
      renderSize: `${shell.canvas.width} × ${shell.canvas.height}`,
      devicePixelRatio: Math.min(
        window.devicePixelRatio,
        MAXIMUM_DEVICE_PIXEL_RATIO,
      ),
      sceneReadyMs,
      pickingMs: latestPickingMs,
      selectedId,
      movement,
    });
  };

  const selectObject = (root: Object3D, startedPickingAt: number) => {
    selectedId = String(root.userData.selectableId);
    const catalogId = String(root.userData.catalogId);
    root.getWorldPosition(worldPosition);
    world.selectionMarker.position.set(worldPosition.x, 0.035, worldPosition.z);
    world.selectionMarker.visible = true;
    shell.setSelection(selectedId, catalogId);
    lessonInput.routeSelection(selectedId);
    requestAnimationFrame(() => {
      latestPickingMs = performance.now() - startedPickingAt;
    });
  };

  const requestMovement = (point: Vector3, startedPickingAt: number) => {
    if (
      !isInsideWalkableBounds(
        { x: point.x, z: point.z },
        PARK_SCENE_DEFINITION.walkableBounds,
      )
    ) {
      return;
    }
    destination = new Vector2(point.x, point.z);
    world.destinationMarker.position.set(point.x, 0.03, point.z);
    world.destinationMarker.visible = true;
    setMovement("moving");
    requestAnimationFrame(() => {
      latestPickingMs = performance.now() - startedPickingAt;
    });
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !lessonInput.enabled) {
      return;
    }
    const startedPickingAt = performance.now();
    const bounds = shell.canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const objectHit = raycaster.intersectObjects(
      [...world.selectableRoots],
      true,
    )[0];
    const selectableRoot = findSelectableRoot(objectHit?.object);
    if (selectableRoot !== undefined) {
      selectObject(selectableRoot, startedPickingAt);
      return;
    }

    const groundHit = raycaster.intersectObject(world.walkableGround, true)[0];
    if (groundHit !== undefined) {
      requestMovement(groundHit.point, startedPickingAt);
    }
  };

  const changeZoom = (amount: number) => {
    zoom = clampZoom(zoom + amount);
    resize();
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      void renderer.setAnimationLoop(null);
      setMovement("paused");
      shell.setPaused(true);
      return;
    }

    lastFrameTime = performance.now();
    shell.setPaused(false);
    setMovement(destination === undefined ? "idle" : "moving");
    void renderer.setAnimationLoop(renderFrame);
  };

  const dispose = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    abortController.abort();
    resizeObserver.disconnect();
    void renderer.setAnimationLoop(null);
    world.dispose();
    renderer.dispose();
  };

  const configureLessonInput = (
    configuration: LessonWorldInputConfiguration,
  ) => {
    lessonInput.configure(configuration);
    world.highlightMarkers.forEach((marker, objectId) => {
      marker.visible = configuration.highlightObjectIds.includes(objectId);
    });
  };

  const applyCues = (cueIds: readonly string[]) => {
    const highlightedIds = cueIds.flatMap((cueId) => {
      switch (cueId) {
        case "guide_gesture":
          return ["guide"];
        case "dog_happy":
        case "dog_highlight":
          return ["dog"];
        default:
          return [];
      }
    });
    highlightedIds.forEach((objectId) => {
      const marker = world.highlightMarkers.get(objectId);
      if (marker !== undefined) marker.visible = true;
    });
  };

  shell.canvas.addEventListener("pointerdown", onPointerDown, { signal });
  shell.zoomInButton.addEventListener("click", () => changeZoom(0.1), {
    signal,
  });
  shell.zoomOutButton.addEventListener("click", () => changeZoom(-0.1), {
    signal,
  });
  shell.diagnosticsButton.addEventListener(
    "click",
    () => {
      const open =
        shell.diagnosticsButton.getAttribute("aria-expanded") !== "true";
      shell.setDiagnosticsOpen(open);
    },
    { signal },
  );
  shell.canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      const error = new BunbunRuntimeError(
        "RUNTIME_CONTEXT_LOST",
        "The graphics context was lost. Retry the runtime to create a fresh renderer.",
      );
      dispose();
      onFatalError(error);
    },
    { signal },
  );
  document.addEventListener("visibilitychange", onVisibilityChange, { signal });

  renderer.render(world.scene, camera);
  sceneReadyMs = performance.now() - startedAt;
  shell.setReady(backend, recoveredWithWebGL2);
  shell.setDiagnosticsOpen(config.diagnosticsOpen);
  shell.updateDiagnostics({
    renderer: backend,
    fps: 0,
    averageFrameMs: 0,
    p95FrameMs: 0,
    drawCalls: renderer.info.render.drawCalls,
    triangles: renderer.info.render.triangles,
    renderSize: `${shell.canvas.width} × ${shell.canvas.height}`,
    devicePixelRatio: Math.min(
      window.devicePixelRatio,
      MAXIMUM_DEVICE_PIXEL_RATIO,
    ),
    sceneReadyMs,
    movement,
    pickingMs: undefined,
    selectedId: undefined,
  });
  lastFrameTime = performance.now();
  void renderer.setAnimationLoop(renderFrame);

  return { configureLessonInput, applyCues, dispose };
}

function findSelectableRoot(
  object: Object3D | undefined,
): Object3D | undefined {
  let current = object;
  while (current !== undefined && current !== null) {
    if (typeof current.userData.selectableId === "string") {
      return current;
    }
    current = current.parent ?? undefined;
  }
  return undefined;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown runtime error.";
}
