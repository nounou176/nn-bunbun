import {
  AmbientLight,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RingGeometry,
  Scene,
  SphereGeometry,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { disposeObjectTree } from "./dispose.js";
import type {
  ParkSceneDefinition,
  WorldPlacement,
} from "./scene-definition.js";

export interface ParkWorld {
  scene: Scene;
  walkableGround: Object3D;
  player: Group;
  selectableRoots: readonly Group[];
  destinationMarker: Mesh;
  selectionMarker: Mesh;
  highlightMarkers: ReadonlyMap<string, Mesh>;
  dispose: () => void;
}

export async function loadParkWorld(
  definition: ParkSceneDefinition,
  simulateAssetFailure: boolean,
): Promise<ParkWorld> {
  const scene = new Scene();
  scene.name = definition.sceneId;
  scene.background = new Color("#dce9d2");
  scene.fog = new Fog("#dce9d2", 14, 28);

  const loader = new GLTFLoader();
  const assetUrl = simulateAssetFailure
    ? new URL("/__bunbun_missing__/park.gltf", window.location.href).href
    : definition.assetUrl;

  try {
    const asset = await loader.loadAsync(assetUrl);
    const root = asset.scene;
    const walkableGround = root.getObjectByName("walkable_ground");
    const fixtureRoot = root.getObjectByName("park_fixture_root");

    if (walkableGround === undefined || fixtureRoot === undefined) {
      disposeObjectTree(root);
      throw new Error(
        "Required park fixture nodes 'park_fixture_root' and 'walkable_ground' were not found.",
      );
    }

    root.traverse((object) => {
      object.frustumCulled = true;
    });
    walkableGround.userData.walkable = true;
    scene.add(root);

    const ambient = new AmbientLight("#fff7df", 1.8);
    const sun = new DirectionalLight("#fff2cf", 2.4);
    sun.position.set(5, 9, 4);
    scene.add(ambient, sun);

    const player = createBunbunPlayer();
    player.position.set(
      definition.playerSpawn.x,
      definition.playerSpawn.y,
      definition.playerSpawn.z,
    );
    scene.add(player);

    const guide = createGuide(definition.guide);
    scene.add(guide);

    const selectableRoots = definition.objects.map((placement) => {
      const animal = createAnimal(placement);
      scene.add(animal);
      return animal;
    });

    const destinationMarker = createMarker("#f1b45c", 0.17, 0.25);
    const selectionMarker = createMarker("#fff8d9", 0.4, 0.49);
    const highlightMarkers = createHighlightMarkers(definition);
    destinationMarker.visible = false;
    selectionMarker.visible = false;
    scene.add(destinationMarker, selectionMarker);
    highlightMarkers.forEach((marker) => scene.add(marker));

    return {
      scene,
      walkableGround,
      player,
      selectableRoots,
      destinationMarker,
      selectionMarker,
      highlightMarkers,
      dispose: () => disposeObjectTree(scene),
    };
  } catch (error) {
    disposeObjectTree(scene);
    throw new Error(`Park asset could not be loaded. ${messageOf(error)}`, {
      cause: error,
    });
  }
}

function createHighlightMarkers(
  definition: ParkSceneDefinition,
): ReadonlyMap<string, Mesh> {
  const markers = new Map<string, Mesh>();
  [definition.guide, ...definition.objects].forEach((placement) => {
    const marker = createMarker("#f3b24d", 0.45, 0.54);
    marker.name = `highlight_${placement.localId}`;
    marker.position.set(placement.position.x, 0.04, placement.position.z);
    marker.visible = false;
    markers.set(placement.localId, marker);
  });
  return markers;
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
  const body = new Mesh(new SphereGeometry(0.35, 14, 10), fur);
  body.scale.set(1, 1.15, 0.9);
  const head = new Mesh(new SphereGeometry(0.27, 14, 10), fur);
  head.position.y = 0.47;
  const leftEar = new Mesh(new BoxGeometry(0.11, 0.38, 0.1), accent);
  const rightEar = leftEar.clone();
  leftEar.position.set(-0.12, 0.81, 0);
  rightEar.position.set(0.12, 0.81, 0);
  root.add(body, head, leftEar, rightEar);
  return root;
}

function createGuide(placement: WorldPlacement): Group {
  const root = new Group();
  root.name = placement.localId;
  root.userData.localId = placement.localId;
  root.userData.catalogId = placement.catalogId;

  const coat = new MeshStandardMaterial({ color: "#315f68", roughness: 0.85 });
  const skin = new MeshStandardMaterial({ color: "#e8b995", roughness: 0.9 });
  const body = new Mesh(new CylinderGeometry(0.24, 0.34, 0.8, 10), coat);
  body.position.y = 0.42;
  const head = new Mesh(new SphereGeometry(0.23, 12, 10), skin);
  head.position.y = 1;
  root.add(body, head);
  root.position.set(
    placement.position.x,
    placement.position.y,
    placement.position.z,
  );
  return root;
}

function createAnimal(placement: WorldPlacement): Group {
  const isDog = placement.localId === "dog";
  const root = new Group();
  root.name = placement.localId;
  root.userData.selectableId = placement.localId;
  root.userData.catalogId = placement.catalogId;

  const coat = new MeshStandardMaterial({
    color: isDog ? "#b97643" : "#66717c",
    roughness: 0.92,
  });
  const detail = new MeshStandardMaterial({
    color: isDog ? "#6e3c24" : "#39434d",
    roughness: 0.95,
  });
  const body = new Mesh(new SphereGeometry(0.34, 12, 9), coat);
  body.scale.set(1.25, 0.78, 0.78);
  body.position.y = 0.38;
  const head = new Mesh(new SphereGeometry(0.25, 12, 9), coat);
  head.position.set(0, 0.65, -0.3);
  const leftEar = new Mesh(new ConeGeometry(0.1, 0.28, 8), detail);
  const rightEar = leftEar.clone();
  leftEar.position.set(-0.14, 0.92, -0.3);
  rightEar.position.set(0.14, 0.92, -0.3);
  root.add(body, head, leftEar, rightEar);
  root.position.set(
    placement.position.x,
    placement.position.y,
    placement.position.z,
  );
  return root;
}

function createMarker(
  color: string,
  innerRadius: number,
  outerRadius: number,
): Mesh {
  const geometry = new RingGeometry(innerRadius, outerRadius, 32);
  const material = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const marker = new Mesh(geometry, material);
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.025;
  marker.renderOrder = 10;
  return marker;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown asset error.";
}
