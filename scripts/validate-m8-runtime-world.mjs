import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseGlbFacts } from "./validate-m8-world-intake.mjs";
import { loadAndValidateM8WorldApproval } from "./validate-m8-world-approval.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const RUNTIME_MANIFEST_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/world-sources/M8_WORLD_RUNTIME_V1.json",
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseGlbDocument(bytes, label) {
  let offset = 12;
  while (offset < bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    if (type === 0x4e4f534a) {
      return JSON.parse(
        bytes
          .subarray(offset + 8, offset + 8 + length)
          .toString("utf8")
          .replace(/\0+$/u, "")
          .trimEnd(),
      );
    }
    offset += 8 + length;
  }
  throw new Error(`${label} has no JSON chunk.`);
}

function assertBudget(actual, ceilings) {
  const comparisons = [
    ["encodedBytes", "encodedBytes"],
    ["visibleTriangles", "visibleTriangles"],
    ["drawCallEstimate", "drawCalls"],
    ["exportedNodes", "exportedNodes"],
    ["materialCount", "materials"],
    ["maximumTextureDimension", "textureDimension"],
    ["estimatedDecodedTextureBytes", "estimatedDecodedTextureBytes"],
    ["activeAnimationMixers", "activeAnimationMixers"],
    ["shippedClipsPerActor", "shippedClipsPerActor"],
  ];
  for (const [actualField, ceilingField] of comparisons) {
    if (actual[actualField] > ceilings[ceilingField]) {
      throw new Error(`Runtime world budget exceeded: ${actualField}.`);
    }
  }
}

function visibleBudgetFromDocument(document) {
  let triangles = 0;
  let drawCalls = 0;
  for (const node of document.nodes ?? []) {
    if (!Number.isInteger(node.mesh)) continue;
    const mesh = document.meshes?.[node.mesh];
    for (const primitive of mesh?.primitives ?? []) {
      const accessorIndex = Number.isInteger(primitive.indices)
        ? primitive.indices
        : primitive.attributes?.POSITION;
      const count = document.accessors?.[accessorIndex]?.count ?? 0;
      const mode = primitive.mode ?? 4;
      triangles +=
        mode === 4
          ? Math.floor(count / 3)
          : mode === 5 || mode === 6
            ? Math.max(0, count - 2)
            : 0;
      drawCalls += 1;
    }
  }
  return { triangles, drawCalls };
}

export async function validateM8RuntimeWorld(
  runtimeManifestPath = RUNTIME_MANIFEST_PATH,
) {
  const manifestBytes = await readFile(runtimeManifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (
    manifest.packetFormat !== "bunbun_m8_world_runtime_bundle" ||
    manifest.packetVersion !== "1.0.0" ||
    manifest.bundleVersion !== "1.0.0" ||
    !["ASSEMBLED_UNREGISTERED", "REGISTERED_FOR_LOCAL_PREVIEW"].includes(
      manifest.status,
    ) ||
    manifest.sceneId !== "neighborhood_small" ||
    manifest.variantId !== "rainy_evening_last_train_v1" ||
    manifest.authority?.decisionId !== "D-045"
  ) {
    throw new Error("M8 runtime world identity or authority is invalid.");
  }

  const approval = await loadAndValidateM8WorldApproval(
    path.join(REPOSITORY_ROOT, manifest.authority.approvalPath),
  );
  assert.equal(manifest.authority.approvalSha256, approval.approvalSha256);
  assert.equal(
    manifest.authority.proposalSha256,
    approval.approval.proposal.packetSha256,
  );

  const layoutPath = path.join(REPOSITORY_ROOT, manifest.layout.path);
  const layoutBytes = await readFile(layoutPath);
  assert.equal(manifest.layout.sha256, sha256(layoutBytes));
  const layout = JSON.parse(layoutBytes.toString("utf8"));
  assert.equal(layout.layoutVersion, manifest.layout.layoutVersion);
  assert.equal(layout.sceneId, manifest.sceneId);
  assert.equal(layout.variantId, manifest.variantId);

  const outputDirectory = path.join(REPOSITORY_ROOT, manifest.outputDirectory);
  const expectedFilenames = manifest.outputs.map((output) => output.filename);
  assert.deepEqual(
    (await readdir(outputDirectory)).toSorted(),
    expectedFilenames.toSorted(),
    "The runtime world directory must contain only declared outputs.",
  );

  const observedOutputs = [];
  for (const output of manifest.outputs) {
    const bytes = await readFile(path.join(outputDirectory, output.filename));
    assert.equal(bytes.length, output.bytes, `${output.filename} byte drift`);
    assert.equal(sha256(bytes), output.sha256, `${output.filename} hash drift`);
    const facts = parseGlbFacts(bytes, output.filename);
    assert.deepEqual(facts, output.facts, `${output.filename} facts drift`);
    assert.deepEqual(
      facts.externalResourceUris,
      [],
      `${output.filename} must be self-contained`,
    );
    const document = parseGlbDocument(bytes, output.filename);
    const visibleBudget = visibleBudgetFromDocument(document);
    const nodeNames = new Set(
      (document.nodes ?? []).map((node) => node.name).filter(Boolean),
    );
    const requiredNodes =
      output.filename === layout.outputs.static
        ? manifest.requiredNodes.static
        : manifest.requiredNodes.actors[
            layout.actors.find(
              (actor) => layout.outputs[actor.output] === output.filename,
            )?.localId
          ];
    for (const requiredNode of requiredNodes ?? []) {
      assert.ok(
        nodeNames.has(requiredNode),
        `${output.filename} is missing required node '${requiredNode}'.`,
      );
    }
    observedOutputs.push({ output, facts, visibleBudget });
  }

  for (const actor of layout.actors) {
    const filename = layout.outputs[actor.output];
    const observed = observedOutputs.find(
      (entry) => entry.output.filename === filename,
    );
    assert.deepEqual(
      observed.facts.animations.map((animation) => animation.name),
      manifest.actorClips[actor.localId],
      `${actor.localId} runtime clips drifted`,
    );
  }

  const actual = {
    encodedBytes: observedOutputs.reduce(
      (sum, entry) => sum + entry.output.bytes,
      0,
    ),
    visibleTriangles: observedOutputs.reduce(
      (sum, entry) => sum + entry.visibleBudget.triangles,
      0,
    ),
    drawCallEstimate: observedOutputs.reduce(
      (sum, entry) => sum + entry.visibleBudget.drawCalls,
      0,
    ),
    exportedNodes: observedOutputs.reduce(
      (sum, entry) => sum + entry.facts.nodeCount,
      0,
    ),
    materialCount: observedOutputs.reduce(
      (sum, entry) => sum + entry.facts.materialCount,
      0,
    ),
    textureCount: observedOutputs.reduce(
      (sum, entry) => sum + entry.facts.textureCount,
      0,
    ),
    maximumTextureDimension: Math.max(
      0,
      ...manifest.textures.flatMap((texture) => [
        texture.width,
        texture.height,
      ]),
    ),
    estimatedDecodedTextureBytes: manifest.textures.reduce(
      (sum, texture) => sum + texture.estimatedDecodedBytes,
      0,
    ),
    activeAnimationMixers: layout.actors.length,
    shippedClipsPerActor: Math.max(
      ...Object.values(manifest.actorClips).map((clips) => clips.length),
    ),
  };
  assert.deepEqual(actual, manifest.budgets.actual);
  assertBudget(actual, manifest.budgets.ceilings);

  return {
    manifest,
    manifestSha256: sha256(manifestBytes),
    outputs: observedOutputs.map(({ output }) => ({
      filename: output.filename,
      bytes: output.bytes,
      sha256: output.sha256,
    })),
  };
}

async function main() {
  const result = await validateM8RuntimeWorld();
  process.stdout.write(
    `${JSON.stringify(
      {
        status: result.manifest.status,
        manifestSha256: result.manifestSha256,
        outputs: result.outputs,
        budgets: result.manifest.budgets.actual,
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
