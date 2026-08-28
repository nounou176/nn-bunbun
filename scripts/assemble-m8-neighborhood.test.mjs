import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { assembleM8Neighborhood } from "./assemble-m8-neighborhood.mjs";
import { validateM8RuntimeWorld } from "./validate-m8-runtime-world.mjs";

test("M8 neighborhood assembly is deterministic and runtime-valid", async () => {
  const firstRoot = await mkdtemp(path.join(os.tmpdir(), "bunbun-m8-world-a-"));
  const secondRoot = await mkdtemp(
    path.join(os.tmpdir(), "bunbun-m8-world-b-"),
  );
  const firstManifestPath = path.join(firstRoot, "runtime.json");
  const secondManifestPath = path.join(secondRoot, "runtime.json");
  const firstOutput = path.join(firstRoot, "assets");
  const secondOutput = path.join(secondRoot, "assets");

  const first = await assembleM8Neighborhood(firstOutput, firstManifestPath);
  const second = await assembleM8Neighborhood(secondOutput, secondManifestPath);
  assert.deepEqual(
    first.runtimeManifest.outputs.map(({ filename, bytes, sha256 }) => ({
      filename,
      bytes,
      sha256,
    })),
    second.runtimeManifest.outputs.map(({ filename, bytes, sha256 }) => ({
      filename,
      bytes,
      sha256,
    })),
  );

  for (const output of first.runtimeManifest.outputs) {
    assert.deepEqual(
      await readFile(path.join(firstOutput, output.filename)),
      await readFile(path.join(secondOutput, output.filename)),
    );
  }
  const validated = await validateM8RuntimeWorld(firstManifestPath);
  assert.equal(validated.manifest.status, "REGISTERED_FOR_LOCAL_PREVIEW");
  assert.equal(validated.outputs.length, 4);
  assert.ok(
    validated.manifest.budgets.actual.encodedBytes <
      validated.manifest.budgets.ceilings.encodedBytes,
  );
});

test("M8 layout keeps decorative trees behind Momo and the initial player sight line", async () => {
  const layout = JSON.parse(
    await readFile(
      path.resolve("docs/world-sources/M8_WORLD_LAYOUT_V1.json"),
      "utf8",
    ),
  );
  assert.equal(layout.layoutVersion, "1.0.1");

  const placements = new Map(
    layout.staticPlacements.map((placement) => [placement.localId, placement]),
  );
  assert.deepEqual(placements.get("tree_large_north")?.position, {
    x: -5.05,
    y: 0,
    z: 0.75,
  });
  assert.deepEqual(placements.get("tree_small_path")?.position, {
    x: -2.8,
    y: 0,
    z: -1.45,
  });

  const momo = layout.actors.find((actor) => actor.localId === "momo");
  assert.deepEqual(momo.position, { x: -3.25, y: 0, z: 2.55 });
  assert.deepEqual(layout.playerSpawn, { x: 0, y: 0.38, z: 2.85 });
  assert.ok(
    placements.get("tree_large_north").position.x +
      placements.get("tree_large_north").position.z <
      momo.position.x + momo.position.z,
  );
  assert.ok(
    placements.get("tree_small_path").position.x +
      placements.get("tree_small_path").position.z <
      layout.playerSpawn.x + layout.playerSpawn.z,
  );
});
