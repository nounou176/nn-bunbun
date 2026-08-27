import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  parseGlbFacts,
  resolveContainedPath,
} from "./validate-m8-world-intake.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const CATALOG_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/world-sources/M8_WORLD_CANDIDATES_2026-08-27.json",
);
const THREE_ROOT = path.join(REPOSITORY_ROOT, "node_modules/three");
const THREE_BUILD_ROOT = path.join(THREE_ROOT, "build");
const THREE_ADDONS_ROOT = path.join(THREE_ROOT, "examples/jsm");
const DEFAULT_PORT = 4176;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function validateStagedFile(stagingRoot, artifact, label) {
  const absolutePath = resolveContainedPath(stagingRoot, artifact.relativePath);
  const bytes = await readFile(absolutePath);
  if (bytes.length !== artifact.bytes) {
    throw new Error(`Byte-size drift for ${label}: ${artifact.relativePath}`);
  }
  if (sha256(bytes) !== artifact.sha256) {
    throw new Error(`SHA-256 drift for ${label}: ${artifact.relativePath}`);
  }
  return { absolutePath, bytes };
}

export async function loadAndValidateWorldReviewCatalog() {
  const catalogBytes = await readFile(CATALOG_PATH);
  const catalog = JSON.parse(catalogBytes.toString("utf8"));
  if (
    catalog.packetFormat !== "bunbun_m8_world_candidate_catalog" ||
    catalog.packetVersion !== "1.0.0" ||
    catalog.catalogVersion !== "1.0.0" ||
    catalog.status !== "TECHNICALLY_QUALIFIED_UNSELECTED" ||
    catalog.authority?.decisionId !== "D-044" ||
    catalog.authority?.runtimeSelectionAuthorized !== false
  ) {
    throw new Error("World review catalog authority or version is invalid.");
  }
  const stagingRoot = path.resolve(REPOSITORY_ROOT, catalog.stagingRoot);
  const expectedStagingRoot = path.join(
    REPOSITORY_ROOT,
    ".bunbun-data/world-intake/m8-neighborhood/v1",
  );
  if (stagingRoot !== expectedStagingRoot) {
    throw new Error("World review catalog points outside approved staging.");
  }

  const intakeManifestPath = resolveContainedPath(
    REPOSITORY_ROOT,
    catalog.generatedFrom.intakeManifest,
  );
  const intakeManifestBytes = await readFile(intakeManifestPath);
  if (
    sha256(intakeManifestBytes) !== catalog.generatedFrom.intakeManifestSha256
  ) {
    throw new Error(
      "Intake manifest SHA-256 drifted after catalog generation.",
    );
  }

  await validateStagedFile(
    stagingRoot,
    catalog.license.evidenceSnapshot,
    "CC0 evidence",
  );
  const sourceIds = new Set();
  for (const source of catalog.sources) {
    if (sourceIds.has(source.sourceId)) {
      throw new Error(`Duplicate source ID: ${source.sourceId}`);
    }
    sourceIds.add(source.sourceId);
    await validateStagedFile(
      stagingRoot,
      source.pageSnapshot,
      `${source.sourceId} page`,
    );
    await validateStagedFile(
      stagingRoot,
      source.archive,
      `${source.sourceId} archive`,
    );
    await validateStagedFile(
      stagingRoot,
      source.licenseArtifact,
      `${source.sourceId} license`,
    );
  }

  const groups = new Map(
    catalog.selectionGroups.map((group) => [group.id, group]),
  );
  if (groups.size !== catalog.selectionGroups.length) {
    throw new Error("World review catalog repeats a selection group ID.");
  }
  const candidateIds = new Set();
  const resolvedCandidates = [];
  for (const candidate of catalog.candidates) {
    if (candidateIds.has(candidate.assetId)) {
      throw new Error(`Duplicate candidate ID: ${candidate.assetId}`);
    }
    if (!sourceIds.has(candidate.sourceId)) {
      throw new Error(
        `Unknown source for ${candidate.assetId}: ${candidate.sourceId}`,
      );
    }
    if (
      candidate.eligibleGroups.length === 0 ||
      candidate.eligibleGroups.some((groupId) => !groups.has(groupId))
    ) {
      throw new Error(`Invalid assignment groups for ${candidate.assetId}.`);
    }
    candidateIds.add(candidate.assetId);
    const verifiedModel = await validateStagedFile(
      stagingRoot,
      candidate,
      candidate.assetId,
    );
    const parsedFacts = parseGlbFacts(verifiedModel.bytes, candidate.assetId);
    if (!jsonEqual(parsedFacts, candidate.facts)) {
      throw new Error(`Structural GLB facts drifted for ${candidate.assetId}.`);
    }
    const dependencies = new Map();
    for (const dependency of candidate.dependencies) {
      if (dependencies.has(dependency.uri)) {
        throw new Error(
          `Duplicate resource URI for ${candidate.assetId}: ${dependency.uri}`,
        );
      }
      dependencies.set(
        dependency.uri,
        await validateStagedFile(
          stagingRoot,
          dependency,
          `${candidate.assetId}/${dependency.uri}`,
        ),
      );
    }
    if (
      parsedFacts.externalResourceUris.length !== dependencies.size ||
      parsedFacts.externalResourceUris.some((uri) => !dependencies.has(uri))
    ) {
      throw new Error(
        `External resource map is incomplete for ${candidate.assetId}.`,
      );
    }
    resolvedCandidates.push({
      ...candidate,
      absolutePath: verifiedModel.absolutePath,
      resolvedDependencies: dependencies,
    });
  }
  if (
    candidateIds.size !== catalog.qualification.reviewCandidateCount ||
    catalog.qualification.qualifiedModelCount !==
      candidateIds.size + catalog.excludedFromReview.length
  ) {
    throw new Error("World review candidate accounting is incomplete.");
  }

  return {
    catalog,
    catalogSha256: sha256(catalogBytes),
    resolvedCandidates,
  };
}

function decisionFor(candidate) {
  return { assetId: candidate.assetId, sha256: candidate.sha256 };
}

export function buildSelectionPacket(
  catalog,
  catalogSha256,
  assignments,
  reviewedCandidateIds,
  reviewedAt = new Date().toISOString(),
) {
  const candidates = new Map(
    catalog.candidates.map((candidate) => [candidate.assetId, candidate]),
  );
  const reviewed = new Set(reviewedCandidateIds);
  if (
    reviewed.size !== candidates.size ||
    [...reviewed].some((candidateId) => !candidates.has(candidateId))
  ) {
    throw new Error(
      `Review every candidate before export (${reviewed.size}/${candidates.size}).`,
    );
  }

  const normalizedAssignments = {};
  const approvedIds = new Set();
  for (const group of catalog.selectionGroups) {
    const selected = assignments[group.id] ?? [];
    if (
      !Array.isArray(selected) ||
      new Set(selected).size !== selected.length
    ) {
      throw new Error(
        `Assignment group ${group.id} contains duplicate or invalid IDs.`,
      );
    }
    if (selected.length < group.minimum || selected.length > group.maximum) {
      throw new Error(
        `${group.label} requires ${group.minimum}-${group.maximum} selection(s).`,
      );
    }
    normalizedAssignments[group.id] = selected.map((candidateId) => {
      const candidate = candidates.get(candidateId);
      if (!candidate || !candidate.eligibleGroups.includes(group.id)) {
        throw new Error(`${candidateId} is not eligible for ${group.id}.`);
      }
      approvedIds.add(candidateId);
      return decisionFor(candidate);
    });
  }

  const aoiId = normalizedAssignments.aoi?.[0]?.assetId;
  const tanakaId = normalizedAssignments.tanaka?.[0]?.assetId;
  if (aoiId === tanakaId) {
    throw new Error("Aoi and Tanaka must use different character models.");
  }

  const approved = catalog.candidates
    .filter((candidate) => approvedIds.has(candidate.assetId))
    .map(decisionFor);
  const rejected = catalog.candidates
    .filter((candidate) => !approvedIds.has(candidate.assetId))
    .map(decisionFor);
  if (approved.length + rejected.length !== candidates.size) {
    throw new Error("Selection packet did not decide every candidate.");
  }

  return {
    packetFormat: "bunbun_m8_world_selection_review",
    packetVersion: "1.0.0",
    status: "PROPOSED_FOR_USER_APPROVAL",
    reviewedAt,
    catalog: {
      path: "docs/world-sources/M8_WORLD_CANDIDATES_2026-08-27.json",
      catalogVersion: catalog.catalogVersion,
      sha256: catalogSha256,
    },
    authority: {
      decisionId: "D-044",
      runtimeSelectionAuthorized: false,
      requiredNextAction: "USER_APPROVE_EXACT_ASSET_IDS_AND_SHA256",
    },
    assignments: normalizedAssignments,
    approved,
    rejected,
    reviewedCandidateIds: [...reviewed].sort(),
  };
}

function renderReviewPage(catalog, catalogSha256) {
  const publicCatalog = {
    ...catalog,
    excludedFromReview: undefined,
    catalogSha256,
  };
  const serializedCatalog = JSON.stringify(publicCatalog).replaceAll(
    "<",
    "\\u003c",
  );

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bunbun M8 world review</title>
    <script type="importmap">{"imports":{"three":"/vendor/three.module.js","three/addons/":"/vendor/addons/"}}</script>
    <style>
      :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #14211f; color: #f5efdf; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      header { padding: 24px clamp(18px, 4vw, 48px); border-bottom: 1px solid #49625b; background: #1b2b27; }
      h1 { margin: 0 0 8px; font: 700 clamp(2rem, 4vw, 3.8rem) Georgia, serif; }
      h2 { color: #f0ce91; margin-top: 26px; }
      p { line-height: 1.55; }
      main { display: grid; grid-template-columns: minmax(440px, 1.3fr) minmax(390px, .8fr); min-height: calc(100vh - 145px); }
      .viewer-column { position: sticky; top: 0; align-self: start; padding: 18px; }
      .viewer { position: relative; min-height: 560px; border: 1px solid #587269; border-radius: 18px; overflow: hidden; background: #202d29; }
      canvas { display: block; width: 100%; height: 560px; }
      .viewer-status { position: absolute; left: 14px; top: 14px; max-width: calc(100% - 28px); padding: 9px 12px; border-radius: 999px; background: #17231fdd; color: #f4d69d; overflow-wrap: anywhere; }
      .viewer-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .panel { padding: 18px 24px 42px; border-left: 1px solid #49625b; background: #182521; }
      .notice, .selection, .output { border: 1px solid #49625b; border-radius: 16px; padding: 16px; background: #20302b; margin-bottom: 16px; }
      .progress { font-weight: 800; color: #f0ce91; }
      button, select { border: 1px solid #d9b36e; background: #2c443b; color: #fff8ea; border-radius: 9px; padding: 9px 11px; font: inherit; }
      button { cursor: pointer; }
      button:hover { background: #3a584c; }
      button:disabled { cursor: not-allowed; opacity: .45; }
      select { width: 100%; }
      .group { margin: 15px 0; }
      .group > strong { display: block; margin-bottom: 8px; }
      .check { display: flex; align-items: flex-start; gap: 8px; margin: 7px 0; }
      .tools { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
      .filter { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .cards { display: grid; gap: 9px; }
      .card { border: 1px solid #49625b; border-radius: 12px; padding: 12px; background: #1c2a26; }
      .card.active { border-color: #f0ce91; }
      .card.reviewed::before { content: "REVIEWED · "; color: #8fd1ae; font-weight: 800; }
      .card h3 { margin: 6px 0; font-size: 1rem; }
      .meta, .hash { font-size: .78rem; color: #b4c4bd; overflow-wrap: anywhere; margin: 6px 0; }
      .hash { color: #8fb7a5; }
      textarea { width: 100%; min-height: 320px; resize: vertical; padding: 12px; border: 1px solid #49625b; border-radius: 10px; background: #0e1714; color: #e9f2ed; }
      .error { color: #ffb7a4; }
      @media (max-width: 940px) { main { grid-template-columns: 1fr; } .viewer-column { position: static; } .panel { border-left: 0; border-top: 1px solid #49625b; } canvas { height: 440px; } .viewer { min-height: 440px; } }
    </style>
  </head>
  <body>
    <header>
      <h1>M8 world exact-candidate gate</h1>
      <p>Trang review local, không đưa asset vào Git/runtime. Hãy mở đủ 55 ứng viên, chọn vai trò, rồi gửi lại JSON có <code>assetId + SHA-256</code>.</p>
    </header>
    <main>
      <section class="viewer-column">
        <div class="viewer">
          <canvas id="canvas"></canvas>
          <div class="viewer-status" id="viewer-status">Chọn một model để bắt đầu.</div>
        </div>
        <div class="viewer-controls">
          <button id="previous">← Previous</button>
          <button id="next">Next →</button>
          <select id="animation" aria-label="Animation clip"><option value="">No animation</option></select>
        </div>
        <p class="meta">Kéo để xoay · cuộn để zoom · model động sẽ ưu tiên clip <code>idle</code>. Camera chỉ phục vụ so sánh ứng viên, chưa phải layout runtime.</p>
      </section>
      <section class="panel">
        <div class="notice">
          <strong>Gate 2 chưa được duyệt.</strong>
          <p>Archive/source đã đạt kiểm định kỹ thuật và CC0. Việc chọn hình ảnh bên dưới chỉ tạo đề xuất để bạn duyệt trong chat; không tự động lắp scene.</p>
          <div class="progress" id="progress">Reviewed 0 / 55</div>
        </div>
        <div class="selection">
          <h2>Assignments</h2>
          <div id="groups"></div>
          <div class="tools"><button id="build">Build exact JSON</button><button id="copy">Copy JSON</button></div>
          <p id="selection-status" class="meta">Chưa đủ điều kiện xuất.</p>
        </div>
        <div class="filter">
          <select id="filter-group"><option value="all">All assignment groups</option></select>
          <select id="filter-review"><option value="all">All review states</option><option value="pending">Pending only</option><option value="reviewed">Reviewed only</option></select>
        </div>
        <h2>Exact candidates</h2>
        <div class="cards" id="cards"></div>
        <div class="output">
          <h2>Selection packet</h2>
          <textarea id="result" spellcheck="false" placeholder="JSON xuất hiện sau khi review đủ 55/55 và chọn đủ assignment."></textarea>
        </div>
      </section>
    </main>
    <script>
      window.addEventListener("error", (event) => {
        const status = document.querySelector("#viewer-status");
        if (status) {
          status.textContent = "REVIEW UI ERROR · " + (event.message || "JavaScript module failed to load");
          status.classList.add("error");
        }
      });
      window.addEventListener("unhandledrejection", (event) => {
        const status = document.querySelector("#viewer-status");
        if (status) {
          const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
          status.textContent = "REVIEW UI ERROR · " + reason;
          status.classList.add("error");
        }
      });
    </script>
    <script type="module">
      import * as THREE from "three";
      import { OrbitControls } from "three/addons/controls/OrbitControls.js";
      import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

      const catalog = ${serializedCatalog};
      const candidates = catalog.candidates;
      const candidatesById = new Map(candidates.map((candidate) => [candidate.assetId, candidate]));
      const reviewedStorageKey = "bunbun-m8-world-reviewed:" + catalog.catalogSha256;
      const assignmentStorageKey = "bunbun-m8-world-assignments:" + catalog.catalogSha256;
      function readStoredJson(key, fallback) {
        try {
          return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch {
          localStorage.removeItem(key);
          return fallback;
        }
      }
      const storedReviewedIds = readStoredJson(reviewedStorageKey, []);
      const reviewedIds = new Set((Array.isArray(storedReviewedIds) ? storedReviewedIds : []).filter((id) => candidatesById.has(id)));
      const savedAssignments = readStoredJson(assignmentStorageKey, {});
      const assignments = Object.fromEntries(catalog.selectionGroups.map((group) => {
        const eligibleIds = new Set(candidates.filter((candidate) => candidate.eligibleGroups.includes(group.id)).map((candidate) => candidate.assetId));
        const saved = Array.isArray(savedAssignments[group.id]) ? savedAssignments[group.id].filter((id) => eligibleIds.has(id)).slice(0, group.maximum) : [];
        return [group.id, [...new Set(saved)]];
      }));
      let activeIndex = -1;
      let currentRoot;
      let currentMixer;
      let currentClips = [];
      let animationFrame;
      let lastFrame = performance.now();
      let renderer;
      let scene;
      let camera;
      let controls;
      let loader;
      let viewerAvailable = false;

      const canvas = document.querySelector("#canvas");
      const viewerStatus = document.querySelector("#viewer-status");
      const animationSelect = document.querySelector("#animation");
      const progressNode = document.querySelector("#progress");
      const cardsNode = document.querySelector("#cards");
      const groupsNode = document.querySelector("#groups");
      const selectionStatus = document.querySelector("#selection-status");
      const resultNode = document.querySelector("#result");
      const filterGroup = document.querySelector("#filter-group");
      const filterReview = document.querySelector("#filter-review");

      function initializeViewer() {
        try {
          renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
          scene = new THREE.Scene();
          scene.background = new THREE.Color(0x26342f);
          camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000);
          controls = new OrbitControls(camera, canvas);
          controls.enableDamping = true;
          scene.add(new THREE.HemisphereLight(0xfff4d8, 0x30423b, 2.4));
          const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
          keyLight.position.set(4, 8, 5);
          scene.add(keyLight);
          const grid = new THREE.GridHelper(20, 20, 0x8da298, 0x53675e);
          scene.add(grid);
          loader = new GLTFLoader();
          viewerAvailable = true;
          animationFrame = requestAnimationFrame(render);
          return true;
        } catch (error) {
          viewerStatus.textContent = "RENDERER ERROR · " + error.message;
          viewerStatus.classList.add("error");
          selectionStatus.textContent = "Danh sách vẫn dùng được, nhưng cần sửa renderer trước khi duyệt hình ảnh.";
          selectionStatus.classList.add("error");
          return false;
        }
      }

      function resize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio())) {
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }

      function render(now) {
        animationFrame = requestAnimationFrame(render);
        resize();
        const delta = Math.min((now - lastFrame) / 1000, 0.1);
        lastFrame = now;
        currentMixer?.update(delta);
        controls.update();
        renderer.render(scene, camera);
      }
      function disposeRoot(root) {
        root?.traverse((object) => {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
          for (const material of materials) {
            for (const value of Object.values(material)) {
              if (value?.isTexture) value.dispose();
            }
            material.dispose();
          }
        });
      }

      function chooseAnimation(name) {
        currentMixer?.stopAllAction();
        const clip = currentClips.find((candidate) => candidate.name === name);
        if (clip && currentMixer) currentMixer.clipAction(clip).reset().play();
      }

      animationSelect.addEventListener("change", () => chooseAnimation(animationSelect.value));

      async function loadCandidate(index) {
        if (index < 0 || index >= candidates.length) return;
        if (!viewerAvailable) {
          viewerStatus.textContent = "RENDERER ERROR · 3D viewer is unavailable.";
          viewerStatus.classList.add("error");
          return;
        }
        activeIndex = index;
        const candidate = candidates[index];
        viewerStatus.textContent = "Loading " + candidate.assetId + "…";
        document.querySelectorAll(".card").forEach((card) => card.classList.toggle("active", card.dataset.id === candidate.assetId));
        try {
          const filename = candidate.sourceMember.split("/").at(-1);
          const gltf = await loader.loadAsync("/asset/" + encodeURIComponent(candidate.assetId) + "/" + encodeURIComponent(filename));
          if (currentRoot) {
            scene.remove(currentRoot);
            disposeRoot(currentRoot);
          }
          currentMixer?.stopAllAction();
          currentRoot = gltf.scene;
          scene.add(currentRoot);
          currentRoot.updateMatrixWorld(true);
          const initialBox = new THREE.Box3().setFromObject(currentRoot);
          const center = initialBox.getCenter(new THREE.Vector3());
          currentRoot.position.set(-center.x, -initialBox.min.y, -center.z);
          currentRoot.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(currentRoot);
          const size = box.getSize(new THREE.Vector3());
          const maximum = Math.max(size.x, size.y, size.z, 0.5);
          controls.target.set(0, size.y * 0.4, 0);
          camera.near = Math.max(0.01, maximum / 1000);
          camera.far = maximum * 100;
          camera.position.set(maximum * 1.7, maximum * 1.35, maximum * 1.7);
          camera.updateProjectionMatrix();
          controls.update();
          currentClips = gltf.animations;
          animationSelect.replaceChildren(new Option("No animation", ""));
          for (const clip of currentClips) animationSelect.add(new Option(clip.name, clip.name));
          currentMixer = currentClips.length > 0 ? new THREE.AnimationMixer(currentRoot) : undefined;
          const preferred = currentClips.find((clip) => clip.name.toLowerCase() === "idle") ?? currentClips[0];
          if (preferred) {
            animationSelect.value = preferred.name;
            chooseAnimation(preferred.name);
          }
          reviewedIds.add(candidate.assetId);
          localStorage.setItem(reviewedStorageKey, JSON.stringify([...reviewedIds].sort()));
          viewerStatus.textContent = candidate.assetId + " · " + candidate.facts.triangleCount.toLocaleString() + " triangles · " + currentClips.length + " clips";
          updateReviewState();
        } catch (error) {
          viewerStatus.textContent = "ERROR · " + error.message;
          viewerStatus.classList.add("error");
        }
      }

      function updateReviewState() {
        progressNode.textContent = "Reviewed " + reviewedIds.size + " / " + candidates.length;
        for (const card of document.querySelectorAll(".card")) card.classList.toggle("reviewed", reviewedIds.has(card.dataset.id));
        applyFilters();
      }

      function setAssignment(groupId, selectedIds) {
        assignments[groupId] = selectedIds;
        localStorage.setItem(assignmentStorageKey, JSON.stringify(assignments));
        resultNode.value = "";
        selectionStatus.textContent = "Selection changed; build a new exact JSON packet.";
      }

      function renderGroups() {
        for (const group of catalog.selectionGroups) {
          const eligible = candidates.filter((candidate) => candidate.eligibleGroups.includes(group.id));
          const wrapper = document.createElement("div");
          wrapper.className = "group";
          const heading = document.createElement("strong");
          heading.textContent = group.label + " · choose " + group.minimum + "-" + group.maximum;
          wrapper.append(heading);
          if (group.maximum === 1) {
            const select = document.createElement("select");
            select.dataset.group = group.id;
            select.add(new Option(group.minimum === 0 ? "None" : "Choose…", ""));
            for (const candidate of eligible) select.add(new Option(candidate.label, candidate.assetId));
            select.value = assignments[group.id][0] || "";
            select.addEventListener("change", () => setAssignment(group.id, select.value ? [select.value] : []));
            wrapper.append(select);
          } else {
            for (const candidate of eligible) {
              const label = document.createElement("label");
              label.className = "check";
              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.checked = assignments[group.id].includes(candidate.assetId);
              checkbox.addEventListener("change", () => {
                const next = new Set(assignments[group.id]);
                checkbox.checked ? next.add(candidate.assetId) : next.delete(candidate.assetId);
                setAssignment(group.id, [...next]);
              });
              label.append(checkbox, document.createTextNode(candidate.label));
              wrapper.append(label);
            }
          }
          groupsNode.append(wrapper);
          filterGroup.add(new Option(group.label, group.id));
        }
      }

      function renderCards() {
        for (const [index, candidate] of candidates.entries()) {
          const card = document.createElement("article");
          card.className = "card";
          card.dataset.id = candidate.assetId;
          card.dataset.groups = candidate.eligibleGroups.join(",");
          const title = document.createElement("h3");
          title.textContent = candidate.assetId;
          const facts = document.createElement("p");
          facts.className = "meta";
          facts.textContent = candidate.eligibleGroups.join(" / ") + " · " + candidate.facts.triangleCount.toLocaleString() + " triangles · " + candidate.facts.animationCount + " clips · " + candidate.bytes.toLocaleString() + " bytes";
          const hash = document.createElement("p");
          hash.className = "hash";
          hash.textContent = candidate.sourceMember + " · " + candidate.sha256;
          const view = document.createElement("button");
          view.textContent = "Review 3D";
          view.addEventListener("click", () => loadCandidate(index));
          card.append(title, facts, hash, view);
          cardsNode.append(card);
        }
      }

      function applyFilters() {
        const group = filterGroup.value;
        const state = filterReview.value;
        for (const card of document.querySelectorAll(".card")) {
          const groupMatches = group === "all" || card.dataset.groups.split(",").includes(group);
          const isReviewed = reviewedIds.has(card.dataset.id);
          const stateMatches = state === "all" || (state === "reviewed" ? isReviewed : !isReviewed);
          card.hidden = !(groupMatches && stateMatches);
        }
      }

      function buildPacket() {
        try {
          if (reviewedIds.size !== candidates.length) throw new Error("Review every candidate first (" + reviewedIds.size + "/" + candidates.length + ").");
          const groupById = new Map(catalog.selectionGroups.map((group) => [group.id, group]));
          for (const [groupId, selected] of Object.entries(assignments)) {
            const group = groupById.get(groupId);
            if (selected.length < group.minimum || selected.length > group.maximum) throw new Error(group.label + " requires " + group.minimum + "-" + group.maximum + " selection(s).");
          }
          if (assignments.aoi[0] === assignments.tanaka[0]) throw new Error("Aoi and Tanaka must use different character models.");
          const approvedIds = new Set(Object.values(assignments).flat());
          const decision = (candidate) => ({ assetId: candidate.assetId, sha256: candidate.sha256 });
          const normalizedAssignments = Object.fromEntries(Object.entries(assignments).map(([groupId, ids]) => [groupId, ids.map((id) => decision(candidatesById.get(id)))]));
          const packet = {
            packetFormat: "bunbun_m8_world_selection_review",
            packetVersion: "1.0.0",
            status: "PROPOSED_FOR_USER_APPROVAL",
            reviewedAt: new Date().toISOString(),
            catalog: { path: "docs/world-sources/M8_WORLD_CANDIDATES_2026-08-27.json", catalogVersion: catalog.catalogVersion, sha256: catalog.catalogSha256 },
            authority: { decisionId: "D-044", runtimeSelectionAuthorized: false, requiredNextAction: "USER_APPROVE_EXACT_ASSET_IDS_AND_SHA256" },
            assignments: normalizedAssignments,
            approved: candidates.filter((candidate) => approvedIds.has(candidate.assetId)).map(decision),
            rejected: candidates.filter((candidate) => !approvedIds.has(candidate.assetId)).map(decision),
            reviewedCandidateIds: [...reviewedIds].sort(),
          };
          resultNode.value = JSON.stringify(packet, null, 2);
          selectionStatus.textContent = "Ready to copy. This is still a proposal until you approve it in chat.";
          selectionStatus.classList.remove("error");
        } catch (error) {
          selectionStatus.textContent = "ERROR · " + error.message;
          selectionStatus.classList.add("error");
        }
      }

      document.querySelector("#previous").addEventListener("click", () => loadCandidate(activeIndex <= 0 ? candidates.length - 1 : activeIndex - 1));
      document.querySelector("#next").addEventListener("click", () => loadCandidate(activeIndex >= candidates.length - 1 ? 0 : activeIndex + 1));
      document.querySelector("#build").addEventListener("click", buildPacket);
      document.querySelector("#copy").addEventListener("click", async () => {
        if (!resultNode.value) buildPacket();
        if (!resultNode.value) return;
        await navigator.clipboard.writeText(resultNode.value);
        selectionStatus.textContent = "Copied exact JSON. Paste it into the Bunbun chat for approval.";
      });
      filterGroup.addEventListener("change", applyFilters);
      filterReview.addEventListener("change", applyFilters);
      renderGroups();
      renderCards();
      updateReviewState();
      if (initializeViewer()) loadCandidate(0);
      window.addEventListener("beforeunload", () => {
        if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
        currentMixer?.stopAllAction();
        disposeRoot(currentRoot);
        renderer?.dispose();
      });
    </script>
  </body>
</html>`;
}

function sendText(response, statusCode, contentType, body) {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

async function streamFile(response, absolutePath, contentType) {
  const metadata = await stat(absolutePath);
  response.writeHead(200, {
    "content-type": contentType,
    "content-length": metadata.size,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  createReadStream(absolutePath).pipe(response);
}

export function resolveVendorModule(requestPath) {
  if (requestPath === "/vendor/three.module.js") {
    return path.join(THREE_BUILD_ROOT, "three.module.js");
  }
  if (requestPath === "/vendor/three.core.js") {
    return path.join(THREE_BUILD_ROOT, "three.core.js");
  }
  if (requestPath.startsWith("/vendor/addons/")) {
    const relativePath = decodeURIComponent(
      requestPath.slice("/vendor/addons/".length),
    );
    if (!relativePath.endsWith(".js")) {
      throw new Error("Only local Three.js modules are served.");
    }
    return resolveContainedPath(THREE_ADDONS_ROOT, relativePath);
  }
  return undefined;
}

export async function startWorldReviewServer(port = DEFAULT_PORT) {
  const validated = await loadAndValidateWorldReviewCatalog();
  const candidateMap = new Map(
    validated.resolvedCandidates.map((candidate) => [
      candidate.assetId,
      candidate,
    ]),
  );
  const html = renderReviewPage(validated.catalog, validated.catalogSha256);
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (request.method !== "GET") {
        sendText(
          response,
          405,
          "text/plain; charset=utf-8",
          "Method not allowed",
        );
        return;
      }
      if (requestUrl.pathname === "/") {
        sendText(response, 200, "text/html; charset=utf-8", html);
        return;
      }
      const vendorModulePath = resolveVendorModule(requestUrl.pathname);
      if (vendorModulePath !== undefined) {
        await streamFile(
          response,
          vendorModulePath,
          "text/javascript; charset=utf-8",
        );
        return;
      }
      const assetMatch = requestUrl.pathname.match(/^\/asset\/([^/]+)\/(.+)$/u);
      if (assetMatch) {
        const candidateId = decodeURIComponent(assetMatch[1]);
        const resourcePath = decodeURIComponent(assetMatch[2]);
        const candidate = candidateMap.get(candidateId);
        if (!candidate) {
          sendText(
            response,
            404,
            "text/plain; charset=utf-8",
            "Unknown candidate",
          );
          return;
        }
        const modelFilename = path.posix.basename(candidate.sourceMember);
        if (resourcePath === modelFilename) {
          await streamFile(
            response,
            candidate.absolutePath,
            "model/gltf-binary",
          );
          return;
        }
        const dependency = candidate.resolvedDependencies.get(resourcePath);
        if (dependency) {
          await streamFile(response, dependency.absolutePath, "image/png");
          return;
        }
        sendText(
          response,
          404,
          "text/plain; charset=utf-8",
          "Unknown candidate resource",
        );
        return;
      }
      sendText(response, 404, "text/plain; charset=utf-8", "Not found");
    } catch (error) {
      sendText(
        response,
        500,
        "text/plain; charset=utf-8",
        error instanceof Error ? error.message : String(error),
      );
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return { server, validated, port };
}

async function main() {
  const portArgument = process.argv[2];
  const port = portArgument === undefined ? DEFAULT_PORT : Number(portArgument);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("Review port must be an integer from 1 through 65535.");
  }
  const result = await startWorldReviewServer(port);
  process.stdout.write(
    `M8 world review ready: http://127.0.0.1:${result.port}/\n` +
      `Catalog SHA-256: ${result.validated.catalogSha256}\n` +
      `Candidates: ${result.validated.resolvedCandidates.length}\n` +
      "Press Ctrl+C to stop.\n",
  );
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
