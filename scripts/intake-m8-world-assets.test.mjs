import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyArchiveMember,
  validateArchiveMemberName,
} from "./intake-m8-world-assets.mjs";

test("world intake accepts contained public model paths", () => {
  assert.doesNotThrow(() =>
    validateArchiveMemberName("Kenney/Models/GLB/road.glb"),
  );
  assert.deepEqual(classifyArchiveMember("Models/GLB/road.glb"), {
    extension: ".glb",
    nestedArchive: false,
    executableOrScript: false,
    ignoredHtmlDocument: false,
    extract: true,
  });
});

test("world intake rejects traversal, absolute, and Windows paths", () => {
  for (const member of [
    "../escape.glb",
    "Models/../../escape.glb",
    "/absolute.glb",
    "C:/absolute.glb",
    "Models\\escape.glb",
  ]) {
    assert.throws(() => validateArchiveMemberName(member));
  }
});

test("world intake identifies nested archives, scripts, and ignored HTML", () => {
  assert.equal(classifyArchiveMember("Models/source.zip").nestedArchive, true);
  assert.equal(
    classifyArchiveMember("Models/viewer.js").executableOrScript,
    true,
  );
  assert.equal(
    classifyArchiveMember("Overview.html").ignoredHtmlDocument,
    true,
  );
  assert.equal(classifyArchiveMember("Overview.html").extract, false);
  assert.equal(classifyArchiveMember("License.txt").extract, true);
  assert.equal(
    classifyArchiveMember("Models/GLB format/Textures/colormap.png").extract,
    true,
  );
  assert.equal(classifyArchiveMember("Previews/model.png").extract, false);
  assert.equal(classifyArchiveMember("Models/source.blend").extract, false);
});
