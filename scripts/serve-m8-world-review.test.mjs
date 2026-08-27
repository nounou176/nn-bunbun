import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  buildSelectionPacket,
  resolveVendorModule,
} from "./serve-m8-world-review.mjs";

const CATALOG_PATH = path.resolve(
  "docs/world-sources/M8_WORLD_CANDIDATES_2026-08-27.json",
);

async function fixture() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const byGroup = (groupId) =>
    catalog.candidates
      .filter((candidate) => candidate.eligibleGroups.includes(groupId))
      .map((candidate) => candidate.assetId);
  return {
    catalog,
    reviewed: catalog.candidates.map((candidate) => candidate.assetId),
    assignments: {
      roadPieces: byGroup("roadPieces").slice(0, 2),
      streetLight: byGroup("streetLight").slice(0, 1),
      streetContext: [],
      storefront: byGroup("storefront").slice(0, 1),
      parkProps: byGroup("parkProps").slice(0, 2),
      aoi: byGroup("aoi").slice(0, 1),
      tanaka: byGroup("tanaka").slice(1, 2),
      momo: byGroup("momo").slice(0, 1),
    },
  };
}

test("builds a complete exact-hash selection proposal", async () => {
  const { catalog, reviewed, assignments } = await fixture();
  const packet = buildSelectionPacket(
    catalog,
    "a".repeat(64),
    assignments,
    reviewed,
    "2026-08-27T00:00:00.000Z",
  );
  assert.equal(packet.status, "PROPOSED_FOR_USER_APPROVAL");
  assert.equal(packet.approved.length + packet.rejected.length, 55);
  assert.equal(packet.reviewedCandidateIds.length, 55);
  assert.equal(packet.assignments.aoi.length, 1);
  assert.notEqual(
    packet.assignments.aoi[0].assetId,
    packet.assignments.tanaka[0].assetId,
  );
});

test("rejects incomplete review, group underflow, and duplicate actors", async () => {
  const { catalog, reviewed, assignments } = await fixture();
  assert.throws(
    () =>
      buildSelectionPacket(
        catalog,
        "b".repeat(64),
        assignments,
        reviewed.slice(1),
      ),
    /Review every candidate/u,
  );
  assert.throws(
    () =>
      buildSelectionPacket(
        catalog,
        "b".repeat(64),
        { ...assignments, roadPieces: [] },
        reviewed,
      ),
    /Road composition requires/u,
  );
  assert.throws(
    () =>
      buildSelectionPacket(
        catalog,
        "b".repeat(64),
        { ...assignments, tanaka: [...assignments.aoi] },
        reviewed,
      ),
    /different character models/u,
  );
});

test("serves the complete local Three.js module dependency chain", async () => {
  const modulePath = resolveVendorModule("/vendor/three.module.js");
  const corePath = resolveVendorModule("/vendor/three.core.js");
  const loaderPath = resolveVendorModule(
    "/vendor/addons/loaders/GLTFLoader.js",
  );
  assert.equal(path.basename(modulePath), "three.module.js");
  assert.equal(path.basename(corePath), "three.core.js");
  assert.equal(path.basename(loaderPath), "GLTFLoader.js");
  await Promise.all(
    [modulePath, corePath, loaderPath].map((file) => readFile(file)),
  );
  assert.throws(
    () => resolveVendorModule("/vendor/addons/../build/three.module.js"),
    /leaves its root/u,
  );
});
