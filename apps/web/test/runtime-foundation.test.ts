import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import {
  clampZoom,
  computeOrthographicFrustum,
  MAX_ZOOM,
  MIN_ZOOM,
} from "../src/game/camera.js";
import { readRuntimeConfig } from "../src/game/config.js";
import { FrameMeter } from "../src/game/frame-meter.js";
import { LessonWorldInputGate } from "../src/game/lesson-input-gate.js";
import {
  clampToWalkableBounds,
  isInsideWalkableBounds,
  stepToward,
} from "../src/game/navigation.js";
import { createRenderer } from "../src/game/renderer.js";

const bounds = {
  minX: -4,
  maxX: 4,
  minZ: -3,
  maxZ: 3,
};

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("park glTF fixture parses and exposes required runtime nodes", async () => {
  const previousProgressEvent = globalThis.ProgressEvent;
  Object.defineProperty(globalThis, "ProgressEvent", {
    configurable: true,
    writable: true,
    value: TestProgressEvent,
  });

  try {
    const source = await readFile(
      resolve(packageDirectory, "src/assets/park-small.gltf"),
      "utf8",
    );
    const asset = await new GLTFLoader().parseAsync(source, "");

    assert.equal(asset.scene.name, "park_small");
    assert.ok(asset.scene.getObjectByName("park_fixture_root"));
    assert.ok(asset.scene.getObjectByName("walkable_ground"));
  } finally {
    if (previousProgressEvent === undefined) {
      Reflect.deleteProperty(globalThis, "ProgressEvent");
    } else {
      Object.defineProperty(globalThis, "ProgressEvent", {
        configurable: true,
        writable: true,
        value: previousProgressEvent,
      });
    }
  }
});

test("walkable bounds accept edges and reject outside points", () => {
  assert.equal(isInsideWalkableBounds({ x: -4, z: 3 }, bounds), true);
  assert.equal(isInsideWalkableBounds({ x: 4.001, z: 0 }, bounds), false);
  assert.equal(isInsideWalkableBounds({ x: 0, z: -3.001 }, bounds), false);
});

test("walkable clamping never mutates authored bounds", () => {
  const result = clampToWalkableBounds({ x: -9, z: 8 }, bounds);
  assert.deepEqual(result, { x: -4, z: 3 });
  assert.deepEqual(bounds, { minX: -4, maxX: 4, minZ: -3, maxZ: 3 });
});

test("movement advances deterministically and snaps on arrival", () => {
  const partial = stepToward({ x: 0, z: 0 }, { x: 3, z: 4 }, 2);
  assert.equal(partial.arrived, false);
  assert.ok(Math.abs(partial.position.x - 1.2) < 0.000001);
  assert.ok(Math.abs(partial.position.z - 1.6) < 0.000001);

  const arrived = stepToward(partial.position, { x: 3, z: 4 }, 5);
  assert.deepEqual(arrived, { position: { x: 3, z: 4 }, arrived: true });
});

test("zero movement distance leaves position unchanged", () => {
  assert.deepEqual(stepToward({ x: 1, z: 2 }, { x: 4, z: 6 }, 0), {
    position: { x: 1, z: 2 },
    arrived: false,
  });
});

test("orthographic sizing preserves aspect and clamps zoom", () => {
  const wide = computeOrthographicFrustum(1600, 800, 1);
  const tall = computeOrthographicFrustum(800, 1600, 1);

  assert.equal(wide.right / wide.top, 2);
  assert.equal(tall.right / tall.top, 0.5);
  assert.equal(clampZoom(-10), MIN_ZOOM);
  assert.equal(clampZoom(10), MAX_ZOOM);
});

test("runtime query controls are explicit and closed", () => {
  assert.deepEqual(
    readRuntimeConfig(
      "?renderer=webgl2&debug=1&assetFailure=1&manifestFailure=1&audioFailure=1&movementFailure=1&carryFailure=1&persistenceFailure=1&nonSpeechFailure=music",
    ),
    {
      forceWebGL2: true,
      diagnosticsOpen: true,
      simulateAssetFailure: true,
      simulateManifestFailure: true,
      simulateAudioFailure: true,
      simulateMovementFailure: true,
      simulateCarryFailure: true,
      simulatePersistenceFailure: true,
      nonSpeechFailure: "music",
    },
  );
  assert.deepEqual(readRuntimeConfig("?renderer=webgpu&debug=yes"), {
    forceWebGL2: false,
    diagnosticsOpen: false,
    simulateAssetFailure: false,
    simulateManifestFailure: false,
    simulateAudioFailure: false,
    simulateMovementFailure: false,
    simulateCarryFailure: false,
    simulatePersistenceFailure: false,
    nonSpeechFailure: undefined,
  });
  assert.equal(
    readRuntimeConfig("?nonSpeechFailure=unregistered").nonSpeechFailure,
    undefined,
  );
});

test("resume prompt is visibly actionable while runtime startup waits", async () => {
  const [mainSource, shellSource, styles] = await Promise.all([
    readFile(resolve(packageDirectory, "src/main.ts"), "utf8"),
    readFile(resolve(packageDirectory, "src/ui/shell.ts"), "utf8"),
    readFile(resolve(packageDirectory, "src/style.css"), "utf8"),
  ]);

  assert.match(styles, /\.resume-actions button:not\(\.primary-button\),/);
  assert.match(
    shellSource,
    /setResumePrompt:[\s\S]*resumeButton\.disabled = false;[\s\S]*rendererPill\.textContent = "Waiting…";/,
  );
  assert.equal(
    [
      ...mainSource.matchAll(
        /selection\.abort\(\);\s+shell\.setLoading\(\);\s+resolve\("(?:RESUME|START_NEW)"\);/g,
      ),
    ].length,
    2,
  );
});

test("renderer retry replaces a canvas that may own a failed GPU context", async () => {
  const initialCanvas = { id: "initial" } as unknown as HTMLCanvasElement;
  const replacementCanvas = {
    id: "replacement",
  } as unknown as HTMLCanvasElement;
  const calls: Array<{ canvas: HTMLCanvasElement; forceWebGL: boolean }> = [];
  let replacementCount = 0;

  const handle = await createRenderer(
    initialCanvas,
    false,
    () => {
      replacementCount += 1;
      return replacementCanvas;
    },
    async (canvas, forceWebGL) => {
      calls.push({ canvas, forceWebGL });
      if (!forceWebGL) throw new Error("automatic backend failed");
      return {
        backend: { isWebGPUBackend: false },
      } as never;
    },
  );

  assert.equal(replacementCount, 1);
  assert.deepEqual(calls, [
    { canvas: initialCanvas, forceWebGL: false },
    { canvas: replacementCanvas, forceWebGL: true },
  ]);
  assert.equal(handle.backend, "webgl2");
  assert.equal(handle.recoveredWithWebGL2, true);
});

test("frame meter reports stable average, FPS, and p95", () => {
  const meter = new FrameMeter();
  meter.addSample(Number.NaN);
  meter.addSample(0);
  [10, 20, 30, 40].forEach((sample) => meter.addSample(sample));

  assert.deepEqual(meter.read(), {
    fps: 40,
    averageFrameMs: 25,
    p95FrameMs: 40,
  });
});

test("lesson world input isolates object, location, and recipient targets", () => {
  const gate = new LessonWorldInputGate();
  const selected: string[] = [];
  gate.configure({
    mode: "OBJECT",
    candidateIds: ["dog", "cat"],
    highlightObjectIds: [],
    highlightEntityIds: [],
    onSelected: (objectId) => selected.push(`object:${objectId}`),
  });

  assert.equal(gate.routeObject("dog"), true);
  assert.equal(gate.routeLocation("animal_area"), false);
  assert.equal(gate.routeRecipient("guide"), false);
  assert.deepEqual(selected, ["object:dog"]);

  gate.configure({
    mode: "LOCATION",
    candidateIds: ["animal_area"],
    highlightObjectIds: [],
    highlightEntityIds: [],
    onSelected: (locationId) => selected.push(`location:${locationId}`),
  });
  assert.equal(gate.routeObject("dog"), false);
  assert.equal(gate.routeLocation("bench_area"), false);
  assert.equal(gate.routeLocation("animal_area"), true);

  gate.configure({
    mode: "RECIPIENT",
    candidateIds: ["guide", "visitor"],
    highlightObjectIds: [],
    highlightEntityIds: [],
    onSelected: (entityId) => selected.push(`recipient:${entityId}`),
  });
  assert.equal(gate.routeRecipient("guide"), true);

  gate.configure({
    mode: "NONE",
    highlightObjectIds: [],
    highlightEntityIds: [],
  });
  assert.equal(gate.routeRecipient("visitor"), false);
  assert.deepEqual(selected, [
    "object:dog",
    "location:animal_area",
    "recipient:guide",
  ]);
});

class TestProgressEvent extends Event {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;

  constructor(type: string, init: ProgressEventInit = {}) {
    super(type);
    this.lengthComputable = init.lengthComputable ?? false;
    this.loaded = init.loaded ?? 0;
    this.total = init.total ?? 0;
  }
}
