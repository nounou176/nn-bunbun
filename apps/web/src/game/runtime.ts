import { Object3D, Raycaster, Vector2, Vector3 } from "three";

import type { TransferredObject } from "@bunbun/contracts";

import { FIRST_INTERACTION_PRELOAD_IDS } from "../audio/assets.js";
import { audioAssetsForCues, visualTargetsForCues } from "../audio/cues.js";
import type { BunbunAudioMixer } from "../audio/mixer.js";
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
import { createRenderer } from "./renderer.js";
import type { WorldSceneDefinition } from "./scene-definition.js";
import { loadWorld } from "./world-loader.js";

const MAXIMUM_DEVICE_PIXEL_RATIO = 1.5;
const MOVEMENT_SPEED = 3.4;
const MAXIMUM_FRAME_DELTA_SECONDS = 0.05;
const DIAGNOSTIC_UPDATE_INTERVAL_MS = 250;
const FOOTSTEP_INTERVAL_MS = 360;
const CAT_REACTION_COOLDOWN_MS = 2_000;

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
  audioMixer: BunbunAudioMixer,
  onFatalError: (error: BunbunRuntimeError) => void,
  definition: WorldSceneDefinition = PARK_SCENE_DEFINITION,
): Promise<GameRuntime> {
  const startedAt = performance.now();
  const abortController = new AbortController();
  const signal = abortController.signal;
  let rendererHandle;

  try {
    rendererHandle = await createRenderer(
      shell.canvas,
      config.forceWebGL2,
      () => {
        const replacement = shell.canvas.cloneNode(false) as HTMLCanvasElement;
        shell.canvas.replaceWith(replacement);
        shell.canvas = replacement;
        return replacement;
      },
    );
  } catch (error) {
    throw new BunbunRuntimeError(
      "RUNTIME_RENDERER_INIT_FAILED",
      messageOf(error),
      { cause: error },
    );
  }

  let world;
  try {
    world = await loadWorld(definition, config.simulateAssetFailure);
  } catch (error) {
    rendererHandle.renderer.dispose();
    throw new BunbunRuntimeError(
      "RUNTIME_ASSET_LOAD_FAILED",
      messageOf(error),
      { cause: error },
    );
  }

  const { renderer, backend, recoveredWithWebGL2 } = rendererHandle;
  const camera = createIsometricCamera(definition.cameraTarget);
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const frameMeter = new FrameMeter();
  const lessonInput = new LessonWorldInputGate();
  const worldPosition = new Vector3();
  const initialObjectPositions = new Map<string, Vector3>(
    definition.objects.map((placement) => [
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
  let lastFootstepAt = Number.NEGATIVE_INFINITY;
  let lastCatReactionAt = Number.NEGATIVE_INFINITY;

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
        if (time - lastFootstepAt >= FOOTSTEP_INTERVAL_MS) {
          lastFootstepAt = time;
          void audioMixer.playOneShot("sfx_footstep_01");
        }
      }
    }

    updateCarriedPresentation();
    world.update(deltaSeconds);
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
    if (
      objectId === definition.catReactionObjectId &&
      startedPickingAt - lastCatReactionAt >= CAT_REACTION_COOLDOWN_MS
    ) {
      lastCatReactionAt = startedPickingAt;
      void audioMixer.playOneShot("sfx_cat_mew_01");
    }
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
        definition.walkableBounds,
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
    if (
      event.button !== 0 ||
      (!lessonInput.enabled && config.worldPreviewSceneId === undefined)
    )
      return;
    const startedPickingAt = performance.now();
    const bounds = shell.canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    if (config.worldPreviewSceneId !== undefined) {
      const objectHit = raycaster.intersectObjects(
        [...world.objectRoots.values()],
        true,
      )[0];
      const objectRoot = findTargetRoot(
        objectHit?.object,
        "selectableObjectId",
      );
      if (objectRoot !== undefined) {
        routeObject(objectRoot, startedPickingAt);
        return;
      }
      const entityHit = raycaster.intersectObjects(
        [...world.entityRoots.values()],
        true,
      )[0];
      const entityRoot = findTargetRoot(
        entityHit?.object,
        "selectableEntityId",
      );
      if (entityRoot !== undefined) {
        showSelection(
          entityRoot,
          String(entityRoot.userData.selectableEntityId),
        );
        finishPickingMeasurement(startedPickingAt);
        return;
      }
    }

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
      definition.playerSpawn.x,
      definition.playerSpawn.y,
      definition.playerSpawn.z,
    );
    definition.objects.forEach((placement) => restoreObject(placement.localId));
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

  const setCarriedObject = (objectId: string, audible = true) => {
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
    if (audible) void audioMixer.playOneShot("sfx_pickup_generic_000");
  };

  const transferCarriedObject = (
    objectId: string,
    recipientEntityId: string,
    audible = true,
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
    if (audible) void audioMixer.playOneShot("sfx_give_soft_001");
  };

  const restoreLessonWorld = (
    restoredCarriedObjectId: string | undefined,
    transferredObjects: readonly TransferredObject[],
  ) => {
    resetLessonWorld();
    transferredObjects.forEach(({ objectId, recipientEntityId }) => {
      setCarriedObject(objectId, false);
      transferCarriedObject(objectId, recipientEntityId, false);
    });
    if (restoredCarriedObjectId !== undefined) {
      setCarriedObject(restoredCarriedObjectId, false);
    }
  };

  const applyCues = (cueIds: readonly string[]) => {
    const highlightedIds = visualTargetsForCues(cueIds);
    highlightedIds.forEach((targetId) => {
      const marker = world.highlightMarkers.get(targetId);
      if (marker !== undefined) marker.visible = true;
    });
    audioAssetsForCues(cueIds).forEach((assetId) => {
      void audioMixer.playOneShot(assetId);
    });
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    abortController.abort();
    resizeObserver.disconnect();
    cancelMovement();
    audioMixer.setSceneAmbience([]);
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
      shell.setSoundPanelOpen(false);
      shell.setLocalDataOpen(false);
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
  audioMixer.setSceneAmbience(definition.ambienceAssetIds);
  void audioMixer.preload(FIRST_INTERACTION_PRELOAD_IDS);
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
