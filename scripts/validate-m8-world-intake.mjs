import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { format } from "prettier";

const MEBIBYTE = 1024 * 1024;
const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const STAGING_ROOT = path.join(
  REPOSITORY_ROOT,
  ".bunbun-data/world-intake/m8-neighborhood/v1",
);
const INTAKE_MANIFEST_PATH = path.join(STAGING_ROOT, "intake-manifest.json");
const CATALOG_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/world-sources/M8_WORLD_CANDIDATES_2026-08-27.json",
);

const EXPECTED_SOURCE_IDS = Object.freeze([
  "kenney_city_kit_roads_2_1",
  "kenney_city_kit_suburban_2_0",
  "kenney_blocky_characters_2_0",
  "kenney_cube_pets_page_2_0",
]);

const REVIEW_MODELS = Object.freeze({
  kenney_city_kit_roads_2_1: new Set([
    "light-curved",
    "light-square",
    "road-bend-sidewalk",
    "road-crossing",
    "road-side",
    "road-straight",
    "road-straight-half",
    "traffic-light",
  ]),
  kenney_city_kit_suburban_2_0: new Set([
    ...Array.from(
      { length: 21 },
      (_, index) => `building-type-${String.fromCharCode(97 + index)}`,
    ),
    "fence-low",
    "fence",
    "path-long",
    "path-short",
    "planter",
    "tree-large",
    "tree-small",
  ]),
  kenney_blocky_characters_2_0: new Set(
    Array.from(
      { length: 18 },
      (_, index) => `character-${String.fromCharCode(97 + index)}`,
    ),
  ),
  kenney_cube_pets_page_2_0: new Set(["animal-cat"]),
});

const ROAD_PIECES = new Set([
  "road-bend-sidewalk",
  "road-crossing",
  "road-side",
  "road-straight",
  "road-straight-half",
]);
const STREET_LIGHTS = new Set(["light-curved", "light-square"]);
const PARK_PROPS = new Set([
  "fence-low",
  "fence",
  "path-long",
  "path-short",
  "planter",
  "tree-large",
  "tree-small",
]);
const SUPPORTED_REQUIRED_EXTENSIONS = new Set([
  "KHR_lights_punctual",
  "KHR_materials_anisotropy",
  "KHR_materials_clearcoat",
  "KHR_materials_emissive_strength",
  "KHR_materials_ior",
  "KHR_materials_iridescence",
  "KHR_materials_sheen",
  "KHR_materials_specular",
  "KHR_materials_transmission",
  "KHR_materials_unlit",
  "KHR_materials_volume",
  "KHR_mesh_quantization",
  "KHR_texture_transform",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function publicArtifact(artifact) {
  return {
    relativePath: artifact.relativePath,
    bytes: artifact.bytes,
    sha256: artifact.sha256,
  };
}

export function resolveContainedPath(root, relativePath) {
  if (
    typeof relativePath !== "string" ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\")
  ) {
    throw new Error(`Unsafe staged path: ${String(relativePath)}`);
  }
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Staged path leaves its root: ${relativePath}`);
  }
  return resolved;
}

function requireArray(value, field) {
  if (!Array.isArray(value)) {
    throw new Error(`GLB ${field} must be an array when present.`);
  }
  return value;
}

function validateExternalResourceUri(uri, label) {
  let decoded;
  try {
    decoded = decodeURIComponent(uri);
  } catch {
    throw new Error(`${label} contains an invalid resource URI.`);
  }
  if (
    decoded.length === 0 ||
    decoded.includes("\\") ||
    decoded.startsWith("/") ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(decoded) ||
    decoded.split("/").some((part) => part === "..")
  ) {
    throw new Error(
      `${label} contains an unsafe external resource URI: ${uri}`,
    );
  }
  return decoded;
}

function primitiveVertexCount(document, primitive) {
  const indexAccessor = primitive.indices;
  if (Number.isInteger(indexAccessor)) {
    return document.accessors?.[indexAccessor]?.count ?? 0;
  }
  const positionAccessor = primitive.attributes?.POSITION;
  if (Number.isInteger(positionAccessor)) {
    return document.accessors?.[positionAccessor]?.count ?? 0;
  }
  return 0;
}

function primitiveTriangleCount(document, primitive) {
  const count = primitiveVertexCount(document, primitive);
  switch (primitive.mode ?? 4) {
    case 4:
      return Math.floor(count / 3);
    case 5:
    case 6:
      return Math.max(0, count - 2);
    default:
      return 0;
  }
}

function mergeBounds(target, minimum, maximum) {
  if (
    !Array.isArray(minimum) ||
    !Array.isArray(maximum) ||
    minimum.length < 3 ||
    maximum.length < 3
  ) {
    return;
  }
  for (let axis = 0; axis < 3; axis += 1) {
    target.minimum[axis] = Math.min(target.minimum[axis], minimum[axis]);
    target.maximum[axis] = Math.max(target.maximum[axis], maximum[axis]);
  }
}

export function parseGlbFacts(bytes, label = "GLB") {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67) {
    throw new Error(`${label} is not a binary glTF file.`);
  }
  const glbVersion = bytes.readUInt32LE(4);
  const declaredLength = bytes.readUInt32LE(8);
  if (glbVersion !== 2 || declaredLength !== bytes.length) {
    throw new Error(`${label} has an unsupported version or length.`);
  }

  let offset = 12;
  let jsonChunk;
  let binaryChunkBytes = 0;
  let chunkCount = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) {
      throw new Error(`${label} has a truncated chunk header.`);
    }
    const chunkLength = bytes.readUInt32LE(offset);
    const chunkType = bytes.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > bytes.length) {
      throw new Error(`${label} has a chunk outside the declared length.`);
    }
    if (chunkType === 0x4e4f534a) {
      if (jsonChunk !== undefined) {
        throw new Error(`${label} contains more than one JSON chunk.`);
      }
      jsonChunk = bytes.subarray(chunkStart, chunkEnd);
    } else if (chunkType === 0x004e4942) {
      binaryChunkBytes += chunkLength;
    }
    chunkCount += 1;
    offset = chunkEnd;
  }
  if (offset !== bytes.length || jsonChunk === undefined) {
    throw new Error(`${label} is missing a valid JSON chunk.`);
  }

  let document;
  try {
    document = JSON.parse(
      jsonChunk.toString("utf8").replace(/\0+$/u, "").trimEnd(),
    );
  } catch (error) {
    throw new Error(`${label} contains invalid glTF JSON: ${error.message}`, {
      cause: error,
    });
  }
  if (
    typeof document.asset?.version !== "string" ||
    document.asset.version !== "2.0"
  ) {
    throw new Error(`${label} does not declare glTF 2.0.`);
  }

  const externalResourceUris = new Set();
  for (const buffer of document.buffers ?? []) {
    if (typeof buffer.uri === "string" && !buffer.uri.startsWith("data:")) {
      externalResourceUris.add(validateExternalResourceUri(buffer.uri, label));
    }
    if (buffer.uri === undefined && buffer.byteLength > binaryChunkBytes) {
      throw new Error(`${label} declares more binary bytes than it contains.`);
    }
  }
  for (const image of document.images ?? []) {
    if (typeof image.uri === "string" && !image.uri.startsWith("data:")) {
      externalResourceUris.add(validateExternalResourceUri(image.uri, label));
    }
  }
  const extensionsRequired = document.extensionsRequired ?? [];
  requireArray(extensionsRequired, "extensionsRequired");
  const unsupportedExtensions = extensionsRequired.filter(
    (extension) => !SUPPORTED_REQUIRED_EXTENSIONS.has(extension),
  );
  if (unsupportedExtensions.length > 0) {
    throw new Error(
      `${label} requires unsupported extension(s): ${unsupportedExtensions.join(", ")}`,
    );
  }

  const meshes = document.meshes ?? [];
  const primitives = meshes.flatMap((mesh) => mesh.primitives ?? []);
  const localBounds = {
    minimum: [
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ],
    maximum: [
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ],
  };
  for (const primitive of primitives) {
    const positionAccessor = primitive.attributes?.POSITION;
    if (!Number.isInteger(positionAccessor)) continue;
    const accessor = document.accessors?.[positionAccessor];
    if (accessor) mergeBounds(localBounds, accessor.min, accessor.max);
  }
  const hasBounds = localBounds.minimum.every(Number.isFinite);

  const animations = (document.animations ?? []).map((animation, index) => {
    let durationSeconds = 0;
    for (const sampler of animation.samplers ?? []) {
      const accessor = document.accessors?.[sampler.input];
      const minimum = accessor?.min?.[0];
      const maximum = accessor?.max?.[0];
      if (Number.isFinite(minimum) && Number.isFinite(maximum)) {
        durationSeconds = Math.max(durationSeconds, maximum - minimum);
      }
    }
    return {
      name: animation.name || `animation_${index + 1}`,
      durationSeconds: Number(durationSeconds.toFixed(4)),
      trackCount: animation.channels?.length ?? 0,
    };
  });

  return {
    glbVersion,
    generator: document.asset.generator ?? null,
    chunkCount,
    binaryChunkBytes,
    sceneCount: document.scenes?.length ?? 0,
    nodeCount: document.nodes?.length ?? 0,
    meshCount: meshes.length,
    primitiveCount: primitives.length,
    triangleCount: primitives.reduce(
      (sum, primitive) => sum + primitiveTriangleCount(document, primitive),
      0,
    ),
    materialCount: document.materials?.length ?? 0,
    textureCount: document.textures?.length ?? 0,
    imageCount: document.images?.length ?? 0,
    skinCount: document.skins?.length ?? 0,
    jointCount: (document.skins ?? []).reduce(
      (sum, skin) => sum + (skin.joints?.length ?? 0),
      0,
    ),
    animationCount: animations.length,
    animations,
    extensionsUsed: [...(document.extensionsUsed ?? [])].sort(),
    extensionsRequired: [...extensionsRequired].sort(),
    externalResourceUris: [...externalResourceUris].sort(),
    localAccessorBounds: hasBounds ? localBounds : null,
  };
}

function basenameWithoutExtension(relativePath) {
  return path.basename(relativePath, path.extname(relativePath));
}

export function eligibleGroupsFor(sourceId, modelName) {
  if (sourceId === "kenney_city_kit_roads_2_1") {
    if (ROAD_PIECES.has(modelName)) return ["roadPieces"];
    if (STREET_LIGHTS.has(modelName)) return ["streetLight"];
    if (modelName === "traffic-light") return ["streetContext"];
  }
  if (sourceId === "kenney_city_kit_suburban_2_0") {
    if (/^building-type-[a-u]$/u.test(modelName)) return ["storefront"];
    if (PARK_PROPS.has(modelName)) return ["parkProps"];
  }
  if (sourceId === "kenney_blocky_characters_2_0") {
    return ["aoi", "tanaka"];
  }
  if (sourceId === "kenney_cube_pets_page_2_0" && modelName === "animal-cat") {
    return ["momo"];
  }
  return [];
}

function candidateId(modelName) {
  return `world_${modelName.replaceAll("-", "_").toLowerCase()}`;
}

async function validateFile(stagingRoot, artifact, label) {
  const absolutePath = resolveContainedPath(stagingRoot, artifact.relativePath);
  const bytes = await readFile(absolutePath);
  if (bytes.length !== artifact.bytes) {
    throw new Error(`Byte-size drift for ${label}: ${artifact.relativePath}`);
  }
  const digest = sha256(bytes);
  if (digest !== artifact.sha256) {
    throw new Error(`SHA-256 drift for ${label}: ${artifact.relativePath}`);
  }
  return { absolutePath, bytes };
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label} drifted: expected ${expected}, received ${actual}`,
    );
  }
}

export async function buildCatalog(
  manifestPath = INTAKE_MANIFEST_PATH,
  outputPath = CATALOG_PATH,
) {
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (
    manifest.packetFormat !== "bunbun_m8_world_intake" ||
    manifest.packetVersion !== "1.0.0" ||
    manifest.authority?.decisionId !== "D-044" ||
    manifest.authority?.runtimeSelectionAuthorized !== false
  ) {
    throw new Error("Intake authority or packet version is invalid.");
  }
  const stagingRoot = path.resolve(REPOSITORY_ROOT, manifest.stagingRoot);
  if (stagingRoot !== STAGING_ROOT) {
    throw new Error(
      "Intake manifest points outside the approved staging root.",
    );
  }
  assertEqual(manifest.sources.length, 4, "Source count");
  assertEqual(manifest.constraints.maximumArchiveCount, 4, "Archive ceiling");
  if (
    manifest.constraints.maximumArchiveBytes > 128 * MEBIBYTE ||
    manifest.constraints.maximumTotalArchiveBytes > 256 * MEBIBYTE ||
    manifest.constraints.maximumExpandedBytes > 1024 * MEBIBYTE ||
    manifest.constraints.maximumMemberBytes > 64 * MEBIBYTE ||
    manifest.constraints.maximumMembers > 2_000
  ) {
    throw new Error("Intake manifest exceeds the approved D-044 bounds.");
  }

  const actualSourceIds = manifest.sources.map((source) => source.sourceId);
  if (
    actualSourceIds.length !== EXPECTED_SOURCE_IDS.length ||
    actualSourceIds.some(
      (sourceId, index) => sourceId !== EXPECTED_SOURCE_IDS[index],
    )
  ) {
    throw new Error("Intake source list or ordering does not match D-044.");
  }

  await validateFile(
    stagingRoot,
    manifest.license.evidenceSnapshot,
    "license evidence",
  );
  let archiveBytes = 0;
  let expandedBytes = 0;
  let memberCount = 0;
  let extractedBytes = 0;
  let extractedFileCount = 0;
  let modelCount = 0;
  const sourceCatalog = [];
  const candidates = [];
  const excludedFromReview = [];
  const seenCandidateIds = new Set();

  for (const source of manifest.sources) {
    await validateFile(
      stagingRoot,
      source.pageSnapshot,
      `${source.sourceId} page`,
    );
    await validateFile(
      stagingRoot,
      source.archive,
      `${source.sourceId} archive`,
    );
    archiveBytes += source.archive.bytes;
    expandedBytes += source.archiveInspection.expandedBytes;
    memberCount += source.archiveInspection.memberCount;

    const licenseArtifact = source.extractedArtifacts.find((artifact) =>
      /(^|\/)license\.txt$/iu.test(artifact.relativePath),
    );
    if (!licenseArtifact) {
      throw new Error(`No pack license file found for ${source.sourceId}.`);
    }
    const verifiedLicense = await validateFile(
      stagingRoot,
      licenseArtifact,
      `${source.sourceId} license`,
    );
    const licenseText = verifiedLicense.bytes.toString("utf8");
    if (
      !licenseText.includes("Creative Commons Zero, CC0") ||
      !licenseText.includes("this is not a requirement")
    ) {
      throw new Error(`Pack license facts drifted for ${source.sourceId}.`);
    }

    const artifactsBySourceMember = new Map(
      source.extractedArtifacts.map((artifact) => [
        path.relative(source.extractionRoot, artifact.relativePath),
        artifact,
      ]),
    );
    let sourceModelCount = 0;
    let sourceReviewCount = 0;
    for (const artifact of source.extractedArtifacts) {
      const verified = await validateFile(
        stagingRoot,
        artifact,
        `${source.sourceId} extracted artifact`,
      );
      extractedBytes += artifact.bytes;
      extractedFileCount += 1;
      if (!artifact.relativePath.toLowerCase().endsWith(".glb")) continue;
      modelCount += 1;
      sourceModelCount += 1;
      const modelName = basenameWithoutExtension(artifact.relativePath);
      const facts = parseGlbFacts(verified.bytes, artifact.relativePath);
      const sourceMember = path.relative(
        source.extractionRoot,
        artifact.relativePath,
      );
      const dependencies = facts.externalResourceUris.map((uri) => {
        const dependencyMember = path.posix.normalize(
          path.posix.join(path.posix.dirname(sourceMember), uri),
        );
        const dependency = artifactsBySourceMember.get(dependencyMember);
        if (!dependency) {
          throw new Error(
            `${artifact.relativePath} is missing external resource ${dependencyMember}.`,
          );
        }
        return {
          uri,
          sourceMember: dependencyMember,
          relativePath: dependency.relativePath,
          bytes: dependency.bytes,
          sha256: dependency.sha256,
        };
      });
      if (!REVIEW_MODELS[source.sourceId].has(modelName)) {
        excludedFromReview.push({
          sourceId: source.sourceId,
          sourceMember,
          sha256: artifact.sha256,
          reason: "OUTSIDE_BOUNDED_M8_REVIEW_SCOPE",
        });
        continue;
      }

      const id = candidateId(modelName);
      if (seenCandidateIds.has(id)) {
        throw new Error(`Duplicate candidate ID: ${id}`);
      }
      seenCandidateIds.add(id);
      const eligibleGroups = eligibleGroupsFor(source.sourceId, modelName);
      if (eligibleGroups.length === 0) {
        throw new Error(`Review model has no assignment group: ${modelName}`);
      }
      sourceReviewCount += 1;
      candidates.push({
        assetId: id,
        label: modelName,
        sourceId: source.sourceId,
        sourceMember,
        relativePath: artifact.relativePath,
        bytes: artifact.bytes,
        sha256: artifact.sha256,
        eligibleGroups,
        dependencies,
        facts,
      });
    }
    assertEqual(
      sourceModelCount,
      source.modelCount,
      `${source.sourceId} model count`,
    );
    sourceCatalog.push({
      sourceId: source.sourceId,
      title: source.title,
      advertisedVersion: source.advertisedVersion,
      pageUrl: source.pageUrl,
      resolvedPageUrl: source.resolvedPageUrl,
      pageSnapshot: publicArtifact(source.pageSnapshot),
      archiveUrl: source.archiveUrl,
      resolvedArchiveUrl: source.resolvedArchiveUrl,
      archive: publicArtifact(source.archive),
      archiveInspection: {
        memberCount: source.archiveInspection.memberCount,
        expandedBytes: source.archiveInspection.expandedBytes,
      },
      licenseArtifact: publicArtifact(licenseArtifact),
      qualifiedModelCount: sourceModelCount,
      reviewCandidateCount: sourceReviewCount,
    });
  }

  assertEqual(
    archiveBytes,
    manifest.totals.archiveBytes,
    "Total archive bytes",
  );
  assertEqual(
    expandedBytes,
    manifest.totals.expandedBytes,
    "Total expanded bytes",
  );
  assertEqual(
    memberCount,
    manifest.totals.memberCount,
    "Total archive members",
  );
  assertEqual(
    extractedBytes,
    manifest.totals.extractedBytes,
    "Total extracted bytes",
  );
  assertEqual(
    extractedFileCount,
    manifest.totals.extractedFileCount,
    "Total extracted files",
  );
  assertEqual(modelCount, manifest.totals.modelCount, "Total GLB models");
  assertEqual(candidates.length, 55, "Bounded review candidate count");
  assertEqual(
    excludedFromReview.length,
    modelCount - candidates.length,
    "Excluded model count",
  );

  candidates.sort((left, right) => left.assetId.localeCompare(right.assetId));
  excludedFromReview.sort((left, right) =>
    `${left.sourceId}/${left.sourceMember}`.localeCompare(
      `${right.sourceId}/${right.sourceMember}`,
    ),
  );

  const catalog = {
    packetFormat: "bunbun_m8_world_candidate_catalog",
    packetVersion: "1.0.0",
    catalogVersion: "1.0.0",
    status: "TECHNICALLY_QUALIFIED_UNSELECTED",
    observedAt: manifest.observedAt,
    generatedFrom: {
      intakeManifest: path.relative(REPOSITORY_ROOT, manifestPath),
      intakeManifestSha256: sha256(manifestBytes),
    },
    stagingRoot: path.relative(REPOSITORY_ROOT, stagingRoot),
    authority: {
      decisionId: "D-044",
      plan: "plans/2026-08-27-m8-rainy-neighborhood-world.md",
      candidateIntakeAuthorized: true,
      runtimeSelectionAuthorized: false,
      nextGate: "USER_APPROVAL_BY_ASSET_ID_AND_SHA256",
    },
    license: {
      id: "CC0-1.0",
      sourceUrl: manifest.license.sourceUrl,
      evidenceSnapshot: publicArtifact(manifest.license.evidenceSnapshot),
      attributionRequired: false,
      voluntaryCredit: "Kenney",
    },
    costAndData: {
      committedCost: 0,
      accountRequired: false,
      environmentVariablesRequired: [],
      runtimeNetworkRequired: false,
      stagedFilesCommittedToGit: false,
    },
    qualification: {
      archiveCount: manifest.sources.length,
      archiveBytes,
      expandedBytes,
      memberCount,
      extractedBytes,
      extractedFileCount,
      qualifiedModelCount: modelCount,
      reviewCandidateCount: candidates.length,
      excludedFromReviewCount: excludedFromReview.length,
    },
    selectionGroups: [
      { id: "roadPieces", label: "Road composition", minimum: 2, maximum: 5 },
      { id: "streetLight", label: "Street light", minimum: 1, maximum: 1 },
      {
        id: "streetContext",
        label: "Optional traffic light",
        minimum: 0,
        maximum: 1,
      },
      { id: "storefront", label: "Storefront base", minimum: 1, maximum: 1 },
      { id: "parkProps", label: "Park edge props", minimum: 2, maximum: 7 },
      { id: "aoi", label: "Aoi actor", minimum: 1, maximum: 1 },
      { id: "tanaka", label: "Tanaka actor", minimum: 1, maximum: 1 },
      { id: "momo", label: "Momo cat", minimum: 1, maximum: 1 },
    ],
    crossConstraints: [
      {
        kind: "DISTINCT_ASSIGNMENTS",
        groups: ["aoi", "tanaka"],
        reason: "Aoi and Tanaka must use visibly distinct character models.",
      },
    ],
    projectAuthoredAfterApproval: [
      "Unbranded convenience-store sign/frontage accents",
      "Simple umbrella stand geometry",
      "Rain presentation, lighting, fog, layout, selectors, and clue anchors",
    ],
    sources: sourceCatalog,
    candidates,
    excludedFromReview,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    await format(JSON.stringify(catalog), { parser: "json" }),
  );
  return {
    catalog,
    outputPath,
    catalogSha256: sha256(await readFile(outputPath)),
  };
}

async function main() {
  const result = await buildCatalog();
  process.stdout.write(
    `${JSON.stringify(
      {
        status: result.catalog.status,
        catalogPath: result.outputPath,
        catalogSha256: result.catalogSha256,
        qualification: result.catalog.qualification,
        groups: result.catalog.selectionGroups.length,
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
