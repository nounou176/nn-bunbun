import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { format } from "prettier";

import { parseGlbFacts } from "./validate-m8-world-intake.mjs";
import { loadAndValidateM8WorldApproval } from "./validate-m8-world-approval.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const LAYOUT_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/world-sources/M8_WORLD_LAYOUT_V1.json",
);
const APPROVAL_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/world-sources/M8_WORLD_APPROVAL_2026-08-27.json",
);
const DEFAULT_OUTPUT_DIRECTORY = path.join(
  REPOSITORY_ROOT,
  "apps/web/src/assets/world/neighborhood-rainy-evening/v1",
);
const DEFAULT_RUNTIME_MANIFEST_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/world-sources/M8_WORLD_RUNTIME_V1.json",
);
const STAGING_ROOT = path.join(
  REPOSITORY_ROOT,
  ".bunbun-data/world-intake/m8-neighborhood/v1",
);
const MAXIMUM_ENCODED_BYTES = 6 * 1024 * 1024;
const MAXIMUM_VISIBLE_TRIANGLES = 50_000;
const MAXIMUM_DRAW_CALLS = 99;
const MAXIMUM_EXPORTED_NODES = 250;
const MAXIMUM_MATERIALS = 32;
const MAXIMUM_TEXTURE_DIMENSION = 1024;
const MAXIMUM_DECODED_TEXTURE_BYTES = 32 * 1024 * 1024;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function align4(value) {
  return (value + 3) & ~3;
}

function clone(value) {
  return structuredClone(value);
}

function parseSourceGlb(bytes, label) {
  parseGlbFacts(bytes, label);
  const declaredLength = bytes.readUInt32LE(8);
  assert.equal(declaredLength, bytes.length, `${label} GLB length drifted`);
  let offset = 12;
  let document;
  let binary = Buffer.alloc(0);
  while (offset < bytes.length) {
    const chunkLength = bytes.readUInt32LE(offset);
    const chunkType = bytes.readUInt32LE(offset + 4);
    const chunk = bytes.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === 0x4e4f534a) {
      document = JSON.parse(
        chunk.toString("utf8").replace(/\0+$/u, "").trimEnd(),
      );
    } else if (chunkType === 0x004e4942) {
      binary = chunk;
    }
    offset += 8 + chunkLength;
  }
  if (document === undefined) throw new Error(`${label} has no JSON chunk.`);
  const meaningfulBinaryBytes = document.buffers?.[0]?.byteLength ?? 0;
  if (meaningfulBinaryBytes > binary.length) {
    throw new Error(`${label} binary buffer is truncated.`);
  }
  return {
    document,
    binary: Buffer.from(binary.subarray(0, meaningfulBinaryBytes)),
  };
}

function appendAligned(binary, addition) {
  const start = align4(binary.length);
  const padding = Buffer.alloc(start - binary.length);
  return {
    binary: Buffer.concat([binary, padding, addition]),
    offset: start,
  };
}

async function loadSelfContainedSource(candidate) {
  const modelBytes = await readFile(
    path.join(STAGING_ROOT, candidate.relativePath),
  );
  if (sha256(modelBytes) !== candidate.sha256) {
    throw new Error(`Source model hash drifted for ${candidate.assetId}.`);
  }
  const source = parseSourceGlb(modelBytes, candidate.assetId);
  const document = clone(source.document);
  let binary = source.binary;
  const dependencies = new Map();
  for (const dependency of candidate.dependencies) {
    const bytes = await readFile(
      path.join(STAGING_ROOT, dependency.relativePath),
    );
    if (
      bytes.length !== dependency.bytes ||
      sha256(bytes) !== dependency.sha256
    ) {
      throw new Error(
        `Source dependency drifted for ${candidate.assetId}/${dependency.uri}.`,
      );
    }
    dependencies.set(dependency.uri, { ...dependency, data: bytes });
  }
  for (const image of document.images ?? []) {
    if (typeof image.uri !== "string" || image.uri.startsWith("data:"))
      continue;
    const dependency = dependencies.get(decodeURIComponent(image.uri));
    if (!dependency) {
      throw new Error(
        `Missing approved image ${image.uri} for ${candidate.assetId}.`,
      );
    }
    const appended = appendAligned(binary, dependency.data);
    binary = appended.binary;
    document.bufferViews ??= [];
    const bufferView = document.bufferViews.length;
    document.bufferViews.push({
      buffer: 0,
      byteOffset: appended.offset,
      byteLength: dependency.data.length,
    });
    delete image.uri;
    image.bufferView = bufferView;
    image.mimeType = "image/png";
  }
  document.buffers = [{ byteLength: binary.length }];
  return { document, binary, dependencies };
}

function buildGlb(documentInput, binaryInput) {
  const document = clone(documentInput);
  document.buffers = [{ byteLength: binaryInput.length }];
  const jsonBytes = Buffer.from(JSON.stringify(document));
  const paddedJsonLength = align4(jsonBytes.length);
  const paddedBinaryLength = align4(binaryInput.length);
  const totalLength = 12 + 8 + paddedJsonLength + 8 + paddedBinaryLength;
  const output = Buffer.alloc(totalLength);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);
  output.writeUInt32LE(paddedJsonLength, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  jsonBytes.copy(output, 20);
  output.fill(0x20, 20 + jsonBytes.length, 20 + paddedJsonLength);
  const binaryHeader = 20 + paddedJsonLength;
  output.writeUInt32LE(paddedBinaryLength, binaryHeader);
  output.writeUInt32LE(0x004e4942, binaryHeader + 4);
  binaryInput.copy(output, binaryHeader + 8);
  return output;
}

function shiftTextureReferences(material, textureOffset) {
  const fields = [
    material.pbrMetallicRoughness?.baseColorTexture,
    material.pbrMetallicRoughness?.metallicRoughnessTexture,
    material.normalTexture,
    material.occlusionTexture,
    material.emissiveTexture,
  ];
  for (const textureInfo of fields) {
    if (Number.isInteger(textureInfo?.index))
      textureInfo.index += textureOffset;
  }
}

function shiftMesh(mesh, accessorOffset, materialOffset) {
  for (const primitive of mesh.primitives ?? []) {
    for (const semantic of Object.keys(primitive.attributes ?? {})) {
      primitive.attributes[semantic] += accessorOffset;
    }
    if (Number.isInteger(primitive.indices))
      primitive.indices += accessorOffset;
    if (Number.isInteger(primitive.material))
      primitive.material += materialOffset;
    for (const target of primitive.targets ?? []) {
      for (const semantic of Object.keys(target))
        target[semantic] += accessorOffset;
    }
  }
}

function mergeExtensionNames(target, source) {
  for (const extension of source ?? []) target.add(extension);
}

function createBinaryAccumulator() {
  let binary = Buffer.alloc(0);
  return {
    append(bytes) {
      const appended = appendAligned(binary, bytes);
      binary = appended.binary;
      return appended.offset;
    },
    read() {
      return binary;
    },
  };
}

function addUnitBoxGeometry(document, binaryAccumulator, materialIndices) {
  const positions = new Float32Array([
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5,
    -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5,
    -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,
    -0.5, 0.5, -0.5,
  ]);
  const normals = new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ]);
  const positionOffset = binaryAccumulator.append(
    Buffer.from(positions.buffer),
  );
  const normalOffset = binaryAccumulator.append(Buffer.from(normals.buffer));
  const indexOffset = binaryAccumulator.append(Buffer.from(indices.buffer));
  const positionView = document.bufferViews.length;
  document.bufferViews.push({
    buffer: 0,
    byteOffset: positionOffset,
    byteLength: positions.byteLength,
    target: 34962,
  });
  const normalView = document.bufferViews.length;
  document.bufferViews.push({
    buffer: 0,
    byteOffset: normalOffset,
    byteLength: normals.byteLength,
    target: 34962,
  });
  const indexView = document.bufferViews.length;
  document.bufferViews.push({
    buffer: 0,
    byteOffset: indexOffset,
    byteLength: indices.byteLength,
    target: 34963,
  });
  const positionAccessor = document.accessors.length;
  document.accessors.push({
    bufferView: positionView,
    componentType: 5126,
    count: 24,
    type: "VEC3",
    min: [-0.5, -0.5, -0.5],
    max: [0.5, 0.5, 0.5],
  });
  const normalAccessor = document.accessors.length;
  document.accessors.push({
    bufferView: normalView,
    componentType: 5126,
    count: 24,
    type: "VEC3",
  });
  const indexAccessor = document.accessors.length;
  document.accessors.push({
    bufferView: indexView,
    componentType: 5123,
    count: 36,
    type: "SCALAR",
    min: [0],
    max: [23],
  });
  return Object.fromEntries(
    Object.entries(materialIndices).map(([materialId, material]) => {
      const mesh = document.meshes.length;
      document.meshes.push({
        name: `project_box_${materialId}`,
        primitives: [
          {
            attributes: { POSITION: positionAccessor, NORMAL: normalAccessor },
            indices: indexAccessor,
            material,
          },
        ],
      });
      return [materialId, mesh];
    }),
  );
}

async function assembleStaticGlb(layout, candidateMap) {
  const document = {
    asset: {
      version: "2.0",
      generator: "Bunbun M8 deterministic assembler 1.0.0",
    },
    scene: 0,
    scenes: [],
    nodes: [],
    meshes: [],
    accessors: [],
    bufferViews: [],
    materials: [],
    textures: [],
    images: [],
    samplers: [],
    buffers: [{ byteLength: 0 }],
    extras: {
      sceneId: layout.sceneId,
      variantId: layout.variantId,
      layoutVersion: layout.layoutVersion,
      decisionId: "D-045",
    },
  };
  const extensionsUsed = new Set();
  const extensionsRequired = new Set();
  const binaryAccumulator = createBinaryAccumulator();
  const templates = new Map();
  const uniqueStaticIds = [
    ...new Set(layout.staticPlacements.map((item) => item.assetId)),
  ].sort();

  for (const assetId of uniqueStaticIds) {
    const candidate = candidateMap.get(assetId);
    if (!candidate)
      throw new Error(`Layout references unapproved static asset ${assetId}.`);
    const source = await loadSelfContainedSource(candidate);
    if (
      (source.document.animations?.length ?? 0) !== 0 ||
      (source.document.skins?.length ?? 0) !== 0
    ) {
      throw new Error(
        `Static asset ${assetId} unexpectedly contains animation or skin data.`,
      );
    }
    const sourceScene = source.document.scenes?.[source.document.scene ?? 0];
    if (
      source.document.nodes?.length !== 1 ||
      sourceScene?.nodes?.length !== 1 ||
      (source.document.nodes[0].children?.length ?? 0) !== 0
    ) {
      throw new Error(
        `Static asset ${assetId} is outside the one-node assembly boundary.`,
      );
    }

    const binaryOffset = binaryAccumulator.append(source.binary);
    const bufferViewOffset = document.bufferViews.length;
    const accessorOffset = document.accessors.length;
    const materialOffset = document.materials.length;
    const textureOffset = document.textures.length;
    const imageOffset = document.images.length;
    const samplerOffset = document.samplers.length;
    const meshOffset = document.meshes.length;

    for (const bufferView of source.document.bufferViews ?? []) {
      document.bufferViews.push({
        ...clone(bufferView),
        buffer: 0,
        byteOffset: binaryOffset + (bufferView.byteOffset ?? 0),
      });
    }
    for (const accessor of source.document.accessors ?? []) {
      const shifted = clone(accessor);
      if (Number.isInteger(shifted.bufferView))
        shifted.bufferView += bufferViewOffset;
      document.accessors.push(shifted);
    }
    for (const sampler of source.document.samplers ?? [])
      document.samplers.push(clone(sampler));
    for (const image of source.document.images ?? []) {
      const shifted = clone(image);
      if (Number.isInteger(shifted.bufferView))
        shifted.bufferView += bufferViewOffset;
      document.images.push(shifted);
    }
    for (const texture of source.document.textures ?? []) {
      const shifted = clone(texture);
      if (Number.isInteger(shifted.source)) shifted.source += imageOffset;
      if (Number.isInteger(shifted.sampler)) shifted.sampler += samplerOffset;
      document.textures.push(shifted);
    }
    for (const material of source.document.materials ?? []) {
      const shifted = clone(material);
      shiftTextureReferences(shifted, textureOffset);
      document.materials.push(shifted);
    }
    for (const mesh of source.document.meshes ?? []) {
      const shifted = clone(mesh);
      shiftMesh(shifted, accessorOffset, materialOffset);
      document.meshes.push(shifted);
    }
    const template = clone(source.document.nodes[0]);
    if (Number.isInteger(template.mesh)) template.mesh += meshOffset;
    templates.set(assetId, template);
    mergeExtensionNames(extensionsUsed, source.document.extensionsUsed);
    mergeExtensionNames(extensionsRequired, source.document.extensionsRequired);
  }

  const fixtureChildren = [];
  for (const placement of layout.staticPlacements) {
    const template = clone(templates.get(placement.assetId));
    template.name = `${placement.localId}_source`;
    const sourceNode = document.nodes.length;
    document.nodes.push(template);
    const wrapper = document.nodes.length;
    document.nodes.push({
      name: placement.localId,
      children: [sourceNode],
      translation: [
        placement.position.x,
        placement.position.y,
        placement.position.z,
      ],
      rotation: [
        0,
        Math.sin(placement.rotationY / 2),
        0,
        Math.cos(placement.rotationY / 2),
      ],
      scale: [placement.scale, placement.scale, placement.scale],
      extras: { sourceAssetId: placement.assetId },
    });
    fixtureChildren.push(wrapper);
  }

  const materialIndices = {};
  for (const [materialId, material] of Object.entries(
    layout.projectMaterials,
  )) {
    materialIndices[materialId] = document.materials.length;
    document.materials.push({
      name: `project_${materialId}`,
      pbrMetallicRoughness: {
        baseColorFactor: material.baseColor,
        metallicFactor: 0,
        roughnessFactor: material.roughness,
      },
    });
  }
  const boxMeshes = addUnitBoxGeometry(
    document,
    binaryAccumulator,
    materialIndices,
  );
  for (const primitive of layout.projectAuthoredPrimitives) {
    if (primitive.kind !== "box")
      throw new Error(`Unsupported authored primitive ${primitive.kind}.`);
    const node = document.nodes.length;
    document.nodes.push({
      name: primitive.localId,
      mesh: boxMeshes[primitive.material],
      translation: [
        primitive.position.x,
        primitive.position.y,
        primitive.position.z,
      ],
      scale: [primitive.scale.x, primitive.scale.y, primitive.scale.z],
      extras: { projectAuthored: true },
    });
    fixtureChildren.push(node);
  }
  const fixtureRoot = document.nodes.length;
  document.nodes.push({
    name: "neighborhood_fixture_root",
    children: fixtureChildren,
  });
  document.scenes.push({
    name: layout.variantId,
    nodes: [fixtureRoot],
  });
  if (extensionsUsed.size > 0)
    document.extensionsUsed = [...extensionsUsed].sort();
  if (extensionsRequired.size > 0)
    document.extensionsRequired = [...extensionsRequired].sort();
  return buildGlb(document, binaryAccumulator.read());
}

async function assembleActorGlb(actor, candidate) {
  const source = await loadSelfContainedSource(candidate);
  const document = source.document;
  const availableClips = new Set(
    (document.animations ?? []).map((clip) => clip.name),
  );
  for (const clip of actor.clips) {
    if (!availableClips.has(clip)) {
      throw new Error(`${actor.assetId} is missing required clip ${clip}.`);
    }
  }
  document.animations = (document.animations ?? []).filter((clip) =>
    actor.clips.includes(clip.name),
  );
  assert.equal(
    document.animations.length,
    3,
    `${actor.localId} shipped clip count`,
  );
  const scene = document.scenes?.[document.scene ?? 0];
  if (!scene || !Array.isArray(scene.nodes)) {
    throw new Error(`${actor.assetId} has no default scene roots.`);
  }
  const wrapper = document.nodes.length;
  document.nodes.push({
    name: actor.rootNodeName,
    children: [...scene.nodes],
    translation: [0, actor.normalization.groundOffsetY, 0],
    scale: [
      actor.normalization.scale,
      actor.normalization.scale,
      actor.normalization.scale,
    ],
    extras: {
      localId: actor.localId,
      catalogId: actor.catalogId,
      sourceAssetId: actor.assetId,
    },
  });
  scene.nodes = [wrapper];
  document.asset = {
    ...document.asset,
    generator: "Bunbun M8 deterministic assembler 1.0.0",
  };
  document.extras = {
    actorId: actor.localId,
    layoutVersion: "1.0.0",
    decisionId: "D-045",
  };
  return buildGlb(document, source.binary);
}

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) {
    throw new Error(`${label} is not a PNG.`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function assertSameSet(actual, expected, label) {
  if (
    actual.size !== expected.size ||
    [...actual].some((value) => !expected.has(value))
  ) {
    throw new Error(`${label} does not match D-045 exactly.`);
  }
}

export async function assembleM8Neighborhood(
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
  runtimeManifestPath = DEFAULT_RUNTIME_MANIFEST_PATH,
) {
  const [approvalResult, layoutBytes, approvalBytes, threePackageBytes] =
    await Promise.all([
      loadAndValidateM8WorldApproval(),
      readFile(LAYOUT_PATH),
      readFile(APPROVAL_PATH),
      readFile(path.join(REPOSITORY_ROOT, "node_modules/three/package.json")),
    ]);
  const layout = JSON.parse(layoutBytes.toString("utf8"));
  if (
    layout.packetFormat !== "bunbun_m8_world_layout" ||
    layout.packetVersion !== "1.0.0" ||
    layout.layoutVersion !== "1.0.1" ||
    layout.sceneId !== "neighborhood_small" ||
    layout.variantId !== "rainy_evening_last_train_v1"
  ) {
    throw new Error("M8 world layout identity is invalid.");
  }
  if (layout.approval.sha256 !== sha256(approvalBytes)) {
    throw new Error("M8 world layout approval hash drifted.");
  }
  const approvedIds = new Set(
    approvalResult.approval.approved.map((decision) => decision.assetId),
  );
  const usedIds = new Set([
    ...layout.staticPlacements.map((placement) => placement.assetId),
    ...layout.actors.map((actor) => actor.assetId),
  ]);
  assertSameSet(usedIds, approvedIds, "Layout asset set");
  const localIds = [
    ...layout.staticPlacements.map((placement) => placement.localId),
    ...layout.projectAuthoredPrimitives.map((primitive) => primitive.localId),
    ...layout.actors.map((actor) => actor.localId),
    ...layout.locations.map((location) => location.localId),
    ...layout.futureObjectAnchors.map((anchor) => anchor.localId),
  ];
  if (new Set(localIds).size !== localIds.length) {
    throw new Error("M8 world layout repeats a local ID.");
  }
  const candidateMap = new Map(
    approvalResult.approvedCandidates.map((candidate) => [
      candidate.assetId,
      candidate,
    ]),
  );
  for (const actor of layout.actors) {
    const assignment = approvalResult.approval.assignments[actor.localId]?.[0];
    if (assignment?.assetId !== actor.assetId) {
      throw new Error(`Actor assignment drifted for ${actor.localId}.`);
    }
  }

  const outputBuffers = new Map();
  outputBuffers.set(
    layout.outputs.static,
    await assembleStaticGlb(layout, candidateMap),
  );
  for (const actor of layout.actors) {
    outputBuffers.set(
      layout.outputs[actor.output],
      await assembleActorGlb(actor, candidateMap.get(actor.assetId)),
    );
  }
  await mkdir(outputDirectory, { recursive: true });
  for (const [filename, bytes] of outputBuffers) {
    await writeFile(path.join(outputDirectory, filename), bytes);
  }

  const outputs = [...outputBuffers].map(([filename, bytes]) => ({
    filename,
    bytes: bytes.length,
    sha256: sha256(bytes),
    facts: parseGlbFacts(bytes, filename),
  }));
  const encodedBytes = outputs.reduce((sum, output) => sum + output.bytes, 0);
  const exportedNodes = outputs.reduce(
    (sum, output) => sum + output.facts.nodeCount,
    0,
  );
  const materialCount = outputs.reduce(
    (sum, output) => sum + output.facts.materialCount,
    0,
  );
  const visibleTriangles =
    layout.staticPlacements.reduce(
      (sum, placement) =>
        sum + candidateMap.get(placement.assetId).facts.triangleCount,
      0,
    ) +
    layout.projectAuthoredPrimitives.length * 12 +
    layout.actors.reduce(
      (sum, actor) => sum + candidateMap.get(actor.assetId).facts.triangleCount,
      0,
    );
  const drawCallEstimate =
    layout.staticPlacements.length +
    layout.projectAuthoredPrimitives.length +
    layout.actors.reduce(
      (sum, actor) => sum + candidateMap.get(actor.assetId).facts.meshCount,
      0,
    );
  const uniqueTextureRows = new Map();
  for (const assetId of usedIds) {
    for (const dependency of candidateMap.get(assetId).dependencies) {
      const bytes = await readFile(
        path.join(STAGING_ROOT, dependency.relativePath),
      );
      const dimensions = pngDimensions(bytes, dependency.relativePath);
      uniqueTextureRows.set(`${assetId}:${dependency.sha256}`, {
        assetId,
        sha256: dependency.sha256,
        width: dimensions.width,
        height: dimensions.height,
        estimatedDecodedBytes: dimensions.width * dimensions.height * 4,
      });
    }
  }
  const textures = [...uniqueTextureRows.values()].sort((left, right) =>
    left.assetId.localeCompare(right.assetId),
  );
  const estimatedDecodedTextureBytes = textures.reduce(
    (sum, texture) => sum + texture.estimatedDecodedBytes,
    0,
  );
  const maximumTextureDimension = Math.max(
    ...textures.flatMap((texture) => [texture.width, texture.height]),
  );
  const actual = {
    encodedBytes,
    visibleTriangles,
    drawCallEstimate,
    exportedNodes,
    materialCount,
    textureCount: textures.length,
    maximumTextureDimension,
    estimatedDecodedTextureBytes,
    activeAnimationMixers: 3,
    shippedClipsPerActor: 3,
  };
  const ceilings = {
    encodedBytes: MAXIMUM_ENCODED_BYTES,
    visibleTriangles: MAXIMUM_VISIBLE_TRIANGLES,
    drawCalls: MAXIMUM_DRAW_CALLS,
    exportedNodes: MAXIMUM_EXPORTED_NODES,
    materials: MAXIMUM_MATERIALS,
    textureDimension: MAXIMUM_TEXTURE_DIMENSION,
    estimatedDecodedTextureBytes: MAXIMUM_DECODED_TEXTURE_BYTES,
    activeAnimationMixers: 3,
    shippedClipsPerActor: 3,
  };
  for (const [field, ceilingField] of [
    ["encodedBytes", "encodedBytes"],
    ["visibleTriangles", "visibleTriangles"],
    ["drawCallEstimate", "drawCalls"],
    ["exportedNodes", "exportedNodes"],
    ["materialCount", "materials"],
    ["maximumTextureDimension", "textureDimension"],
    ["estimatedDecodedTextureBytes", "estimatedDecodedTextureBytes"],
    ["activeAnimationMixers", "activeAnimationMixers"],
    ["shippedClipsPerActor", "shippedClipsPerActor"],
  ]) {
    if (actual[field] > ceilings[ceilingField]) {
      throw new Error(`Runtime world budget exceeded: ${field}.`);
    }
  }

  const runtimeManifest = {
    packetFormat: "bunbun_m8_world_runtime_bundle",
    packetVersion: "1.0.0",
    bundleVersion: "1.0.1",
    status: "REGISTERED_FOR_LOCAL_PREVIEW",
    sceneId: layout.sceneId,
    variantId: layout.variantId,
    authority: {
      decisionId: "D-045",
      approvalPath: path.relative(REPOSITORY_ROOT, APPROVAL_PATH),
      approvalSha256: sha256(approvalBytes),
      proposalSha256: approvalResult.approval.proposal.packetSha256,
    },
    layout: {
      path: path.relative(REPOSITORY_ROOT, LAYOUT_PATH),
      sha256: sha256(layoutBytes),
      layoutVersion: layout.layoutVersion,
    },
    assembler: {
      id: "bunbun_m8_deterministic_glb_assembler",
      version: "1.0.0",
      threeVersion: JSON.parse(threePackageBytes.toString("utf8")).version,
    },
    outputDirectory: path.relative(REPOSITORY_ROOT, outputDirectory),
    outputs,
    requiredNodes: {
      static: [
        "neighborhood_fixture_root",
        ...layout.staticPlacements.map((placement) => placement.localId),
        ...layout.projectAuthoredPrimitives.map(
          (primitive) => primitive.localId,
        ),
      ],
      actors: Object.fromEntries(
        layout.actors.map((actor) => [actor.localId, [actor.rootNodeName]]),
      ),
    },
    actorClips: Object.fromEntries(
      layout.actors.map((actor) => [actor.localId, actor.clips]),
    ),
    provenance: approvalResult.approval.approved,
    textures,
    budgets: { ceilings, actual },
  };
  const formattedManifest = await format(JSON.stringify(runtimeManifest), {
    parser: "json",
  });
  await writeFile(runtimeManifestPath, formattedManifest);
  return {
    runtimeManifest,
    runtimeManifestSha256: sha256(Buffer.from(formattedManifest)),
    outputDirectory,
    runtimeManifestPath,
  };
}

async function main() {
  const result = await assembleM8Neighborhood();
  process.stdout.write(
    `${JSON.stringify(
      {
        status: result.runtimeManifest.status,
        runtimeManifestPath: result.runtimeManifestPath,
        runtimeManifestSha256: result.runtimeManifestSha256,
        outputs: result.runtimeManifest.outputs.map((output) => ({
          filename: output.filename,
          bytes: output.bytes,
          sha256: output.sha256,
        })),
        budgets: result.runtimeManifest.budgets.actual,
      },
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
