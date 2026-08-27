import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  eligibleGroupsFor,
  parseGlbFacts,
  resolveContainedPath,
} from "./validate-m8-world-intake.mjs";

function createGlb(document) {
  const json = Buffer.from(JSON.stringify(document));
  const padding = (4 - (json.length % 4)) % 4;
  const jsonChunk = Buffer.concat([json, Buffer.alloc(padding, 0x20)]);
  const output = Buffer.alloc(12 + 8 + jsonChunk.length);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(jsonChunk.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  jsonChunk.copy(output, 20);
  return output;
}

test("parses bounded structural and animation facts from a GLB", () => {
  const bytes = createGlb({
    asset: { version: "2.0", generator: "Bunbun test" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }],
      },
    ],
    accessors: [
      { count: 3, min: [-1, 0, -2], max: [1, 2, 2] },
      { count: 3 },
      { count: 2, min: [0], max: [1.25] },
    ],
    materials: [{}],
    animations: [
      {
        name: "Idle",
        samplers: [{ input: 2, output: 0 }],
        channels: [{ sampler: 0, target: { node: 0, path: "translation" } }],
      },
    ],
  });
  const facts = parseGlbFacts(bytes, "fixture.glb");
  assert.equal(facts.glbVersion, 2);
  assert.equal(facts.triangleCount, 1);
  assert.equal(facts.animationCount, 1);
  assert.deepEqual(facts.animations[0], {
    name: "Idle",
    durationSeconds: 1.25,
    trackCount: 1,
  });
  assert.deepEqual(facts.localAccessorBounds, {
    minimum: [-1, 0, -2],
    maximum: [1, 2, 2],
  });
});

test("rejects malformed, unsafe external, and unsupported GLBs", () => {
  assert.throws(
    () => parseGlbFacts(Buffer.from("not glb")),
    /not a binary glTF/u,
  );
  assert.throws(
    () =>
      parseGlbFacts(
        createGlb({
          asset: { version: "2.0" },
          buffers: [{ uri: "../remote.bin" }],
        }),
      ),
    /unsafe external resource URI/u,
  );
  assert.throws(
    () =>
      parseGlbFacts(
        createGlb({
          asset: { version: "2.0" },
          extensionsRequired: ["KHR_draco_mesh_compression"],
        }),
      ),
    /unsupported extension/u,
  );
});

test("contains staged paths and maps only approved review roles", () => {
  const root = path.resolve("/tmp/bunbun-world-test");
  assert.equal(
    resolveContainedPath(root, "extracted/model.glb"),
    path.join(root, "extracted/model.glb"),
  );
  assert.throws(() => resolveContainedPath(root, "../escape.glb"), /leaves/u);
  assert.throws(() => resolveContainedPath(root, "/tmp/escape.glb"), /Unsafe/u);
  assert.deepEqual(
    eligibleGroupsFor("kenney_blocky_characters_2_0", "character-a"),
    ["aoi", "tanaka"],
  );
  assert.deepEqual(
    eligibleGroupsFor("kenney_cube_pets_page_2_0", "animal-dog"),
    [],
  );
});
