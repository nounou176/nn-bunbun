import { Object3D, Raycaster, Vector2, Vector3 } from "three";

import type { TransferredObject } from "@bunbun/contracts";

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

interface LessonMovementRequest {
  locationId: string;
  arrivalRadius: number;
  onReached: (locationId: string) => void;
  onFailure: (locationId: string) => void;
}

export interface GameRuntime {
  configureLessonInput: (configuration: LessonWorldInputConfiguration) => void;
  requestLocationMovement: (
    locationId: string,
    arrivalRadius: number,
    onReached: (locationId: string) => void,
    onFailure: (locationId: string) => void,
  ) => void;
  setCarriedObject: (objectId: string) => void;
  transferCarriedObject: (objectId: string, recipientEntityId: string) => void;
  clearCarriedObject: () => void;
  resetLessonWorld: () => void;
  restoreLessonWorld: (
    carriedObjectId: string | undefined,
    transferredObjects: readonly TransferredObject[],
  ) => void;
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
      { cause: error },
    );
  }

  const { renderer, backend, recoveredWithWebGL2 } = rendererHandle;
  const camera = createIsometricCamera(PARK_SCENE_DEFINITION.cameraTarget);
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const frameMeter = new FrameMeter();
  const lessonInput = new LessonWorldInputGate();
  const worldPosition = new Vector3();
  const initialObjectPositions = new Map<string, Vector3>(
    PARK_SCENE_DEFINITION.objects.map((placement) => [
      placement.localId,
      new Vector3(
        placement.position.x,
        placement.position.y,
        placement.position.z,
      ),
    ]),
  );
  let zoom = DEFAULT_ZOOM;
  let destination: Vector2 | undefined;
  let lessonMovement: LessonMovementRequest | undefined;
  let carriedObjectId: string | undefined;
  let selectedId: string | undefined;
  let latestPickingMs: number | undefined;
  let lastFrameTime = performance.now();
  let lastDiagnosticUpdate = 0;
  let sceneReadyMs = 0;
  let disposed = false;
  let movementFailureUsed = false;
  let carryFailureUsed = false;
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

  const updateCarriedPresentation = () => {
    if (carriedObjectId === undefined) return;
    const object = world.objectRoots.get(carriedObjectId);
    if (object === undefined) return;
    object.position.set(
      world.player.position.x + 0.58,
      initialObjectPositions.get(carriedObjectId)?.y ?? 0,
      world.player.position.z + 0.38,
    );
    const marker = world.highlightMarkers.get(carriedObjectId);
    marker?.position.set(object.position.x, 0.04, object.position.z);
  };

  const completeLessonMovement = () => {
    const request = lessonMovement;
    if (request === undefined) return;
    lessonMovement = undefined;
    destination = undefined;
    world.destinationMarker.visible = false;
    setMovement("idle");
    queueMicrotask(() => {
      if (!disposed) request.onReached(request.locationId);
    });
  };

  const renderFrame = (time: DOMHighResTimeStamp) => {
    if (disposed) return;

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

      const remaining = Math.hypot(
        destination.x - world.player.position.x,
        destination.y - world.player.position.z,
      );
      if (
        lessonMovement !== undefined &&
        remaining <= lessonMovement.arrivalRadius
      ) {
        completeLessonMovement();
      } else if (step.arrived) {
        destination = undefined;
        world.destinationMarker.visible = false;
        setMovement("idle");
      } else {
        setMovement("moving");
      }
    }

    updateCarriedPresentation();
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

  const showSelection = (root: Object3D, localId: string) => {
    selectedId = localId;
    const catalogId = String(root.userData.catalogId);
    root.getWorldPosition(worldPosition);
    world.selectionMarker.position.set(worldPosition.x, 0.035, worldPosition.z);
    world.selectionMarker.visible = true;
    shell.setSelection(selectedId, catalogId);
  };

  const finishPickingMeasurement = (startedPickingAt: number) => {
    requestAnimationFrame(() => {
      latestPickingMs = performance.now() - startedPickingAt;
    });
  };

  const routeObject = (root: Object3D, startedPickingAt: number) => {
    const objectId = String(root.userData.selectableObjectId);
    showSelection(root, objectId);
    lessonInput.routeObject(objectId);
    finishPickingMeasurement(startedPickingAt);
  };

  const routeLocation = (root: Object3D, startedPickingAt: number) => {
    const locationId = String(root.userData.selectableLocationId);
    showSelection(root, locationId);
    lessonInput.routeLocation(locationId);
    finishPickingMeasurement(startedPickingAt);
  };

  const routeRecipient = (root: Object3D, startedPickingAt: number) => {
    const entityId = String(root.userData.selectableEntityId);
    showSelection(root, entityId);
    if (carriedObjectId === undefined) {
      onFatalError(
        new BunbunRuntimeError(
          "RUNTIME_CARRY_STATE_INVALID",
          "The world has no carried object for the active GIVE interaction.",
        ),
      );
      return;
    }
    lessonInput.routeRecipient(entityId);
    finishPickingMeasurement(startedPickingAt);
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
    lessonMovement = undefined;
    destination = new Vector2(point.x, point.z);
    world.destinationMarker.position.set(point.x, 0.03, point.z);
    world.destinationMarker.visible = true;
    setMovement("moving");
    finishPickingMeasurement(startedPickingAt);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !lessonInput.enabled) return;
    const startedPickingAt = performance.now();
    const bounds = shell.canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    if (lessonInput.mode === "OBJECT") {
      const hit = raycaster.intersectObjects(
        [...world.objectRoots.values()],
        true,
      )[0];
      const root = findTargetRoot(hit?.object, "selectableObjectId");
      if (root !== undefined) {
        routeObject(root, startedPickingAt);
        return;
      }
    }

    if (lessonInput.mode === "LOCATION") {
      const hit = raycaster.intersectObjects(
        [...world.locationRoots.values()],
        true,
      )[0];
      const root = findTargetRoot(hit?.object, "selectableLocationId");
      if (root !== undefined) routeLocation(root, startedPickingAt);
      return;
    }

    if (lessonInput.mode === "RECIPIENT") {
      const hit = raycaster.intersectObjects(
        [...world.entityRoots.values()],
        true,
      )[0];
      const root = findTargetRoot(hit?.object, "selectableEntityId");
      if (root !== undefined) {
        routeRecipient(root, startedPickingAt);
        return;
      }
    }

    const groundHit = raycaster.intersectObject(world.walkableGround, true)[0];
    if (groundHit !== undefined)
      requestMovement(groundHit.point, startedPickingAt);
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

  const cancelMovement = () => {
    destination = undefined;
    lessonMovement = undefined;
    world.destinationMarker.visible = false;
    setMovement("idle");
  };

  const restoreObject = (objectId: string) => {
    const object = world.objectRoots.get(objectId);
    const initial = initialObjectPositions.get(objectId);
    if (object !== undefined && initial !== undefined)
      object.position.copy(initial);
    const marker = world.highlightMarkers.get(objectId);
    if (marker !== undefined && initial !== undefined) {
      marker.position.set(initial.x, 0.04, initial.z);
    }
  };

  const clearCarriedObject = () => {
    if (carriedObjectId !== undefined) restoreObject(carriedObjectId);
    carriedObjectId = undefined;
  };

  const resetLessonWorld = () => {
    cancelMovement();
    carriedObjectId = undefined;
    world.player.position.set(
      PARK_SCENE_DEFINITION.playerSpawn.x,
      PARK_SCENE_DEFINITION.playerSpawn.y,
      PARK_SCENE_DEFINITION.playerSpawn.z,
    );
    PARK_SCENE_DEFINITION.objects.forEach((placement) =>
      restoreObject(placement.localId),
    );
    world.selectionMarker.visible = false;
    world.locationRoots.forEach((root) => {
      root.visible = false;
    });
    world.highlightMarkers.forEach((marker) => {
      marker.visible = false;
    });
    selectedId = undefined;
    shell.setSelection();
  };

  const configureLessonInput = (
    configuration: LessonWorldInputConfiguration,
  ) => {
    lessonInput.configure(configuration);
    world.highlightMarkers.forEach((marker, targetId) => {
      marker.visible =
        configuration.highlightObjectIds.includes(targetId) ||
        configuration.highlightEntityIds.includes(targetId);
    });
    world.locationRoots.forEach((root, locationId) => {
      root.visible =
        configuration.mode === "LOCATION" &&
        configuration.candidateIds.includes(locationId);
    });
    if (
      configuration.mode === "RECIPIENT" &&
      config.simulateCarryFailure &&
      !carryFailureUsed
    ) {
      carryFailureUsed = true;
      carriedObjectId = undefined;
    }
  };

  const requestLocationMovement = (
    locationId: string,
    arrivalRadius: number,
    onReached: (resolvedLocationId: string) => void,
    onFailure: (failedLocationId: string) => void,
  ) => {
    const location = world.locationRoots.get(locationId);
    if (location === undefined) {
      throw new BunbunRuntimeError(
        "RUNTIME_LOCATION_UNKNOWN",
        `Location '${locationId}' has no authored world target.`,
      );
    }
    cancelMovement();
    if (config.simulateMovementFailure && !movementFailureUsed) {
      movementFailureUsed = true;
      queueMicrotask(() => {
        if (!disposed) onFailure(locationId);
      });
      return;
    }
    destination = new Vector2(location.position.x, location.position.z);
    lessonMovement = { locationId, arrivalRadius, onReached, onFailure };
    world.destinationMarker.position.set(
      location.position.x,
      0.03,
      location.position.z,
    );
    world.destinationMarker.visible = true;
    setMovement("moving");
  };

  const setCarriedObject = (objectId: string) => {
    if (!world.objectRoots.has(objectId)) {
      throw new BunbunRuntimeError(
        "RUNTIME_CARRY_OBJECT_UNKNOWN",
        `Object '${objectId}' cannot enter carry state.`,
      );
    }
    if (carriedObjectId !== undefined && carriedObjectId !== objectId) {
      throw new BunbunRuntimeError(
        "RUNTIME_CARRY_SLOT_OCCUPIED",
        `Object '${carriedObjectId}' already occupies the task carry slot.`,
      );
    }
    carriedObjectId = objectId;
    updateCarriedPresentation();
  };

  const transferCarriedObject = (
    objectId: string,
    recipientEntityId: string,
  ) => {
    const object = world.objectRoots.get(objectId);
    const recipient = world.entityRoots.get(recipientEntityId);
    if (carriedObjectId !== objectId || object === undefined) {
      throw new BunbunRuntimeError(
        "RUNTIME_CARRY_STATE_INVALID",
        `Object '${objectId}' is not in the task carry slot.`,
      );
    }
    if (recipient === undefined) {
      throw new BunbunRuntimeError(
        "RUNTIME_RECIPIENT_UNKNOWN",
        `Recipient '${recipientEntityId}' has no world placement.`,
      );
    }
    carriedObjectId = undefined;
    object.position.set(
      recipient.position.x + 0.58,
      initialObjectPositions.get(objectId)?.y ?? 0,
      recipient.position.z + 0.35,
    );
    const marker = world.highlightMarkers.get(objectId);
    marker?.position.set(object.position.x, 0.04, object.position.z);
  };

  const restoreLessonWorld = (
    restoredCarriedObjectId: string | undefined,
    transferredObjects: readonly TransferredObject[],
  ) => {
    resetLessonWorld();
    transferredObjects.forEach(({ objectId, recipientEntityId }) => {
      setCarriedObject(objectId);
      transferCarriedObject(objectId, recipientEntityId);
    });
    if (restoredCarriedObjectId !== undefined) {
      setCarriedObject(restoredCarriedObjectId);
    }
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
    highlightedIds.forEach((targetId) => {
      const marker = world.highlightMarkers.get(targetId);
      if (marker !== undefined) marker.visible = true;
    });
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    abortController.abort();
    resizeObserver.disconnect();
    cancelMovement();
    void renderer.setAnimationLoop(null);
    world.dispose();
    renderer.dispose();
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

  return {
    configureLessonInput,
    requestLocationMovement,
    setCarriedObject,
    transferCarriedObject,
    clearCarriedObject,
    resetLessonWorld,
    restoreLessonWorld,
    applyCues,
    dispose,
  };
}

function findTargetRoot(
  object: Object3D | undefined,
  metadataKey:
    "selectableObjectId" | "selectableLocationId" | "selectableEntityId",
): Object3D | undefined {
  let current = object;
  while (current !== undefined && current !== null) {
    if (typeof current.userData[metadataKey] === "string") return current;
    current = current.parent ?? undefined;
  }
  return undefined;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown runtime error.";
}
