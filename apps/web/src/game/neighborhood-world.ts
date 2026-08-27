import {
  AmbientLight,
  AnimationMixer,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { disposeObjectTree } from "./dispose.js";
import type { RuntimeWorld } from "./park-world.js";
import type {
  LocationPlacement,
  NeighborhoodSceneDefinition,
  WorldPlacement,
} from "./scene-definition.js";
import { resolveWorldAssetUrl } from "./world-assets.js";

const RAIN_DROP_COUNT = 180;

export async function loadNeighborhoodWorld(
  definition: NeighborhoodSceneDefinition,
  simulateAssetFailure: boolean,
): Promise<RuntimeWorld> {
  const scene = new Scene();
  scene.name = definition.sceneId;
  scene.background = new Color("#172825");
  scene.fog = new Fog("#172825", 14, 31);
  const mixers: AnimationMixer[] = [];

  try {
    const loader = new GLTFLoader();
    const staticUrl = simulateAssetFailure
      ? new URL("/__bunbun_missing__/neighborhood.glb", window.location.href)
          .href
      : resolveWorldAssetUrl(definition.staticAssetId);
    const [staticAsset, ...actorAssets] = await Promise.all([
      loader.loadAsync(staticUrl),
      ...definition.actorAssets.map((actor) =>
        loader.loadAsync(resolveWorldAssetUrl(actor.assetId)),
      ),
    ]);
    const fixtureRoot = staticAsset.scene.getObjectByName(
      definition.fixtureRootName,
    );
    const walkableGround = staticAsset.scene.getObjectByName(
      definition.walkableNodeName,
    );
    if (fixtureRoot === undefined || walkableGround === undefined) {
      throw new Error(
        `Required neighborhood nodes '${definition.fixtureRootName}' and '${definition.walkableNodeName}' were not found.`,
      );
    }
    walkableGround.userData.walkable = true;
    staticAsset.scene.traverse((object) => {
      object.frustumCulled = true;
    });
    scene.add(staticAsset.scene);

    const entityRoots = new Map<string, Object3D>();
    const objectRoots = new Map<string, Object3D>();
    definition.actorAssets.forEach((placement, index) => {
      const asset = actorAssets[index];
      if (asset === undefined) {
        throw new Error(`Actor asset '${placement.assetId}' was not loaded.`);
      }
      const root = asset.scene.getObjectByName(placement.rootNodeName);
      if (root === undefined) {
        throw new Error(
          `Actor '${placement.localId}' is missing root '${placement.rootNodeName}'.`,
        );
      }
      root.position.set(
        placement.position.x,
        placement.position.y,
        placement.position.z,
      );
      root.userData.localId = placement.localId;
      root.userData.catalogId = placement.catalogId;
      if (placement.role === "entity") {
        root.userData.selectableEntityId = placement.localId;
        entityRoots.set(placement.localId, root);
      } else {
        root.userData.selectableObjectId = placement.localId;
        objectRoots.set(placement.localId, root);
      }
      const idleClip = asset.animations.find(
        (clip) => clip.name === placement.idleClipName,
      );
      if (idleClip === undefined) {
        throw new Error(
          `Actor '${placement.localId}' is missing idle clip '${placement.idleClipName}'.`,
        );
      }
      const mixer = new AnimationMixer(root);
      mixer.clipAction(idleClip).play();
      mixers.push(mixer);
      scene.add(root);
    });

    definition.objects
      .filter((placement) => !objectRoots.has(placement.localId))
      .forEach((placement) => {
        const object = createClueObject(placement);
        objectRoots.set(placement.localId, object);
        scene.add(object);
      });

    const locationRoots = new Map<string, Object3D>();
    definition.locations.forEach((placement) => {
      const location = createLocationTarget(placement);
      location.visible = false;
      locationRoots.set(placement.localId, location);
      scene.add(location);
    });

    const player = createBunbunPlayer();
    player.position.set(
      definition.playerSpawn.x,
      definition.playerSpawn.y,
      definition.playerSpawn.z,
    );
    scene.add(player);

    const destinationMarker = createMarker("#fac66f", 0.17, 0.25);
    const selectionMarker = createMarker("#f7eed0", 0.4, 0.49);
    destinationMarker.visible = false;
    selectionMarker.visible = false;
    scene.add(destinationMarker, selectionMarker);

    const highlightMarkers = new Map<string, Mesh>();
    [...definition.entities, ...definition.objects].forEach((placement) => {
      const marker = createMarker("#e7a34b", 0.45, 0.54);
      marker.name = `highlight_${placement.localId}`;
      marker.position.set(placement.position.x, 0.04, placement.position.z);
      marker.visible = false;
      highlightMarkers.set(placement.localId, marker);
      scene.add(marker);
    });

    const ambient = new AmbientLight("#8fa7b0", 1.65);
    const streetGlow = new DirectionalLight("#ffd9a0", 2.1);
    streetGlow.position.set(4, 8, 2);
    const moonFill = new DirectionalLight("#8ca9bd", 1.25);
    moonFill.position.set(-5, 7, 5);
    scene.add(ambient, streetGlow, moonFill);

    const rain = createRain();
    scene.add(rain.points);

    let disposed = false;
    return {
      scene,
      walkableGround,
      player,
      objectRoots,
      entityRoots,
      locationRoots,
      destinationMarker,
      selectionMarker,
      highlightMarkers,
      update: (deltaSeconds) => {
        mixers.forEach((mixer) => mixer.update(deltaSeconds));
        rain.update(deltaSeconds);
      },
      dispose: () => {
        if (disposed) return;
        disposed = true;
        mixers.forEach((mixer) => mixer.stopAllAction());
        disposeObjectTree(scene);
      },
    };
  } catch (error) {
    mixers.forEach((mixer) => mixer.stopAllAction());
    disposeObjectTree(scene);
    throw new Error(
      `Neighborhood assets could not be loaded. ${messageOf(error)}`,
      { cause: error },
    );
  }
}

function createRain(): { points: Points; update: (delta: number) => void } {
  const positions = new Float32Array(RAIN_DROP_COUNT * 3);
  for (let index = 0; index < RAIN_DROP_COUNT; index += 1) {
    positions[index * 3] = ((index * 47) % 211) / 10 - 10.5;
    positions[index * 3 + 1] = 1.2 + ((index * 29) % 73) / 10;
    positions[index * 3 + 2] = ((index * 71) % 137) / 10 - 5.3;
  }
  const geometry = new BufferGeometry();
  const position = new Float32BufferAttribute(positions, 3);
  geometry.setAttribute("position", position);
  const points = new Points(
    geometry,
    new PointsMaterial({
      color: "#bfd5dc",
      size: 0.035,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    }),
  );
  points.name = "rain_presentation";
  points.frustumCulled = false;
  return {
    points,
    update: (delta) => {
      const array = position.array as Float32Array;
      for (let index = 0; index < RAIN_DROP_COUNT; index += 1) {
        const yIndex = index * 3 + 1;
        const nextY = (array[yIndex] ?? 0) - delta * 4.8;
        array[yIndex] = nextY < 0.1 ? nextY + 7.3 : nextY;
      }
      position.needsUpdate = true;
    },
  };
}

function createBunbunPlayer(): Group {
  const root = new Group();
  root.name = "player_bunbun";
  root.userData.localId = "player";
  const fur = new MeshStandardMaterial({ color: "#f8eee2", roughness: 0.9 });
  const accent = new MeshStandardMaterial({
    color: "#d88773",
    roughness: 0.9,
  });
  const body = new Mesh(new BoxGeometry(0.52, 0.68, 0.46), fur);
  body.position.y = 0.34;
  const head = new Mesh(new BoxGeometry(0.43, 0.4, 0.4), fur);
  head.position.y = 0.78;
  const leftEar = new Mesh(new BoxGeometry(0.11, 0.38, 0.1), accent);
  const rightEar = leftEar.clone();
  leftEar.position.set(-0.12, 1.15, 0);
  rightEar.position.set(0.12, 1.15, 0);
  root.add(body, head, leftEar, rightEar);
  return root;
}

function createClueObject(placement: WorldPlacement): Group {
  const root = new Group();
  root.name = placement.localId;
  root.userData.localId = placement.localId;
  root.userData.catalogId = placement.catalogId;
  root.userData.selectableObjectId = placement.localId;
  const isWallet = placement.localId === "wallet_clue";
  const mesh = new Mesh(
    new BoxGeometry(isWallet ? 0.34 : 0.12, isWallet ? 0.08 : 0.78, 0.22),
    new MeshStandardMaterial({
      color: isWallet ? "#70483a" : "#d5c8a5",
      roughness: 0.75,
    }),
  );
  mesh.position.y = isWallet ? 0.04 : 0.39;
  root.add(mesh);
  root.position.set(
    placement.position.x,
    placement.position.y,
    placement.position.z,
  );
  return root;
}

function createLocationTarget(placement: LocationPlacement): Group {
  const root = new Group();
  root.name = placement.localId;
  root.userData.selectableLocationId = placement.localId;
  root.userData.catalogId = placement.catalogId;
  root.position.set(
    placement.position.x,
    placement.position.y + 0.035,
    placement.position.z,
  );
  const surface = new Mesh(
    new CircleGeometry(0.68, 24),
    new MeshBasicMaterial({
      color: "#67a091",
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
  );
  surface.rotation.x = -Math.PI / 2;
  root.add(surface);
  return root;
}

function createMarker(
  color: string,
  innerRadius: number,
  outerRadius: number,
): Mesh {
  const marker = new Mesh(
    new RingGeometry(innerRadius, outerRadius, 32),
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.025;
  marker.renderOrder = 10;
  return marker;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown asset error.";
}
