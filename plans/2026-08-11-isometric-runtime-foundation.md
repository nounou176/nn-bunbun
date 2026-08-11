# Walk through a reusable isometric park runtime

Status: Complete
Owner: Codex and user
Created: 2026-08-11
Last updated: 2026-08-11 22:57 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Turn the static foundation page into the first deterministic Bunbun 3D world.
At completion, the user can open a small stylized park, see a fixed isometric
camera, click walkable ground to move a placeholder player, click the catalog-
identified dog or cat to select it, inspect renderer/performance diagnostics,
resize and background the page safely, and force the WebGL2 backend for manual
fallback validation.

This milestone proves rendering and world interaction infrastructure. It does
not yet execute LessonManifest steps or claim that a Japanese lesson is
playable; that belongs to Milestone 4.

## Repository context

Milestones 1 and 2 are complete and manually accepted. apps/web is a Vite
vanilla TypeScript status page. packages/contracts provides validated
LessonManifest and CatalogSnapshot 0.1.0 contracts. The valid fixture already
names park_small, park_isometric_default, park_core, npc_guide_basic,
animal_dog_small, and animal_cat_small, but catalog records currently express
identity and capability only: they intentionally contain no mesh URL,
transform, camera rig, or navigation geometry.

The runtime therefore needs a local, reviewed asset registry and authored scene
definition that resolves catalog IDs to bundled assets and transforms without
putting paths or Three.js code into LessonManifest. D-001, D-003, D-005, D-006,
D-007, D-011, D-013, D-015, and D-017 govern the work. D-018 is proposed for
the milestone-specific renderer, browser, camera, navigation, fixture-asset,
and measurement choices.

The user-approved Milestone 1 and 2 implementation is committed and published
at 27355c0 on main and origin/main. The working tree contains later Milestone 2
closure documentation and the approved Milestone 3 implementation. Milestone 3
preserves that history and keeps its implementation scope explicit.

## Scope

### In scope

- Pin Three.js 0.185.1 and matching TypeScript definitions in apps/web.
- Replace the foundation card with a world-dominant canvas and small accessible
  DOM status/control layer.
- Create an asynchronous renderer factory using WebGPURenderer with its WebGPU
  backend by default and WebGL2 backend fallback.
- Support a documented query switch that forces WebGL2 for manual acceptance.
- Implement renderer initialization failure, retry, resize, visibility pause,
  capped frame delta, and disposal behavior.
- Use a fixed orthographic isometric camera with constrained zoom and no free
  orbit.
- Add one local park_small runtime fixture aligned to the existing catalog IDs,
  using a tiny local glTF/GLB fixture for reusable scenery and runtime-created
  primitives only for player and interaction markers.
- Resolve asset IDs through a code-owned local registry; no asset URL comes
  from LessonManifest.
- Author one convex walkable region, player spawn, selectable dog and cat,
  guide placement, and catalog-stable object metadata.
- Raycast registered selectable objects and walkable ground only.
- Move the player directly and deterministically within the convex authored
  region, without a physics engine or general pathfinding system.
- Separate DOM control input from world picking.
- Add a development diagnostics panel for renderer backend, FPS/frame time,
  draw calls, triangles, DPR/render size, scene-ready time, selected ID, and
  movement state.
- Add focused Node tests for pure navigation, camera sizing, and runtime-state
  helpers; browser/gameplay acceptance remains manual.
- Record measured bundle, asset, scene-ready, renderer, draw-call, frame-time,
  picking, resize, background/resume, and disposal results.
- Update architecture, performance, decisions, current state, roadmap, README,
  plans index, and this ExecPlan.

### Out of scope

- LessonManifest traversal, EXPLORE/INTERACTION lesson state, learning
  evidence, LISTEN, CHOOSE, scaffolding, feedback, or completion.
- Audio, TTS, AI, compiler APIs, SQLite, progress, accounts, or analytics.
- A final product scene, production art, licensed external assets, asset CDN,
  or remote asset URLs.
- Mobile/touch support claims, free camera orbit, WASD, a minimap, navmesh,
  collision engine, physics, inventory, combat, or open world.
- React, a scene editor, a general entity-component system, post-processing, or
  premature adaptive-quality automation.
- Automated browser E2E tooling, Docker, hosting, or deployment.

## Decisions and constraints

The following D-018 choices were accepted by the user before implementation:

- The Milestone 3 acceptance environment is the user's current stable desktop
  Chromium browser with pointer and keyboard. Wider Firefox, Safari, mobile,
  and touch support remains unclaimed until manually tested.
- Three.js 0.185.1 and @types/three 0.185.1 are pinned together.
- WebGPURenderer runs in automatic mode first. A query switch forces its WebGL2
  backend, and renderer initialization failure retries once with forced WebGL2
  before showing a recoverable DOM error.
- The camera is orthographic at a classic isometric angle, with fixed rotation,
  small bounded zoom, and no pan/orbit controls.
- Navigation is a direct, deterministic walk to the raycast ground point inside
  one authored convex region. The fixture contains no blocking obstacle that
  would require pathfinding. Invalid clicks do not move the player.
- Clicking a registered object selects and highlights its stable lesson-local
  ID. Clicking ground requests movement. UI clicks never raycast the world.
- park_small is a technical fixture aligned to Milestone 2 data, not the
  product-level first-scene decision O-002.
- A tiny repository-local glTF/GLB fixture proves loading and disposal. It is
  generated or authored specifically for this repository and has no external
  license dependency. Compression remains deferred until measured real assets
  exist.
- Provisional acceptance targets on the reference machine are: 60 FPS
  preferred, under 100 draw calls, DPR capped at 1.5, first visible scene under
  2 seconds on local cold load, visible picking response under 100 ms, and no
  authored movement longer than 3 seconds. Actual measurements are recorded;
  failed targets are reported rather than hidden.
- No environment variable is added. Developer controls use explicit local
  query parameters and are not lesson data.

## Implementation approach

Keep main.ts as composition only. A small DOM shell owns loading, error,
controls, selection text, and diagnostics. A runtime controller owns the
renderer, scene, camera, frame loop, lifecycle, and cleanup. Rendering,
navigation, picking, content resolution, diagnostics, and UI remain narrow
modules rather than one global script.

The local runtime asset registry maps approved assetBundleIds to static Vite
asset imports. The park scene definition maps stable catalog and lesson fixture
IDs to transforms, navigation bounds, selectable node names, and camera
settings. The generic world builder loads the local glTF/GLB, validates required
named nodes, attaches application metadata to registered selectable roots, and
fails before activation if a required asset or node is missing.

WebGPURenderer provides the preferred WebGPU backend and a WebGL2 backend. The
factory reports which backend is active, exposes a force-WebGL2 query for
manual fallback testing, and retries safely. The runtime never presents a blank
canvas as success.

An orthographic camera looks at the center of the compact diorama. Resize logic
derives the frustum from CSS display size and caps the drawing buffer scale.
The frame loop pauses while the document is hidden, caps resumed delta time,
updates only active movement and diagnostics, renders, and exposes Three.js
renderer.info measurements without placing diagnostics in the normal learner
surface.

Picking raycasts only the authored ground and registered interactive roots.
Ground clicks are clamped to the convex walkable bounds and create a bounded
movement request. A new valid click replaces the previous destination.
Selection highlights reuse one marker/material rather than allocating every
frame. All geometry, materials, textures, event listeners, timers, and renderer
resources are disposed on teardown or hot reload.

## Milestones

### 1. Establish the runtime and asset boundary

Add the approved dependencies, DOM game shell, runtime state model, renderer
factory, local asset registry, park scene definition, and fixture asset. The
observable checkpoint is a recoverable loading/error shell with no blank
canvas path.

### 2. Render the reusable diorama

Create the scene lifecycle, orthographic camera, restrained lighting, local
asset loading, stable world identities, resize behavior, capped DPR, and
disposal. The observable checkpoint is a correctly composed park at narrow and
wide desktop sizes.

### 3. Add deterministic point-and-click world input

Add registered-object picking, ground picking, bounded direct movement,
selection/highlight feedback, replacement of in-flight destinations, and DOM
input isolation. The observable checkpoint is repeatable movement and dog/cat
selection by stable IDs.

### 4. Add fallback, diagnostics, and lifecycle resilience

Add forced WebGL2 mode, automatic fallback, asset-failure simulation, retry,
visibility pause/resume, delta capping, diagnostics, and HMR/page teardown. The
observable checkpoint is a user-verifiable backend and recovery matrix.

### 5. Verify and hand off

Add pure unit tests, run root checks and production build, record bundle and
runtime measurements, update durable documentation, and provide the complete
manual browser checklist. The plan remains open until the user reports manual
results.

## Progress

- [x] 2026-08-11 22:15 — Re-read the governing vision, architecture,
  gameplay, manifest, decisions, current state, roadmap, performance, and
  ExecPlan documents.
- [x] 2026-08-11 22:15 — Inspect the web foundation, shared catalog fixture,
  package tooling, dirty working tree, and recent durable memory.
- [x] 2026-08-11 22:15 — Reconcile stale state text with Git: Milestones 1 and
  2 are published at 27355c0 on main and origin/main; only later documentation
  and this proposed plan are currently uncommitted.
- [x] 2026-08-11 22:15 — Verify from current Three.js documentation that
  WebGPURenderer can select WebGPU and fall back to a WebGL2 backend, and verify
  the current matching Three.js/type package version is 0.185.1.
- [x] 2026-08-11 22:23 — Receive explicit user approval for D-018 and this
  ExecPlan; activate Milestone 3 implementation.
- [x] 2026-08-11 22:36 — Pin Three.js 0.185.1 and matching types, add the
  asynchronous WebGPU/WebGL2 renderer factory, code-owned park asset registry,
  repository-local glTF fixture, atomic loader, and owned disposal boundary.
- [x] 2026-08-11 22:40 — Implement the orthographic isometric camera, capped
  resize, stable park identities, object and ground picking, bounded direct
  movement, replacement destinations, zoom, DOM/canvas isolation,
  background/resume, context-loss handling, retry, and teardown.
- [x] 2026-08-11 22:40 — Add renderer/frame/draw-call/triangle/render-size/DPR/
  scene-ready/picking/selection/movement diagnostics, forced WebGL2 and
  one-shot asset-failure controls, and focused pure helper tests.
- [x] 2026-08-11 — Pass an isolated clean install, schema drift, typecheck,
  lint, format, 22 tests, production builds, asset parsing, HTTP regressions,
  lockfile dry-run, scope review, and diff whitespace checks; record static
  bundle and fixture sizes.
- [x] 2026-08-11 — Update architecture, performance, current state, roadmap,
  README, plans index, and this ExecPlan; hand off manual acceptance.
- [x] 2026-08-11 22:57 — Receive the user's `PASS` for the manual functional
  matrix: normal and forced-WebGL2 rendering, movement and selection, recovery,
  resize, background/resume, and repeated-load behavior.
- [x] 2026-08-11 — Receive a second explicit `PASS` for the requested
  diagnostics/performance acceptance. Close the milestone qualitatively while
  recording that exact reference-environment and numeric values were not
  supplied.

## Surprises and discoveries

- CatalogSnapshot 0.1.0 deliberately proves identity and capability but lacks
  transforms, navigation geometry, camera settings, and asset resolution. A
  separate reviewed runtime scene definition is necessary; weakening the
  lesson contract or placing local paths in it would violate its boundary.
- Current Three.js WebGPURenderer already targets multiple backends and falls
  back to WebGL2 when WebGPU is unavailable. Milestone 3 can use one renderer
  abstraction and still expose a force-WebGL2 acceptance path.
- WebGPU remains unavailable in some widely used browsers and requires a secure
  context outside localhost. The milestone must not imply broad browser
  support from one successful local Chromium test.
- The existing park_small fixture already provides a coherent identity set for
  a technical scene, avoiding an early product decision about the final first
  vertical-slice scene.
- The WebGPU-capable Three.js build produces an 852.59 kB minified JavaScript
  chunk but 234.68 kB gzip. This passes the proposed 300 kB gzip observation
  point while triggering Vite's default uncompressed chunk warning; the warning
  remains visible and must be considered with measured startup time.
- Node.js 24 has no ProgressEvent global, which GLTFLoader uses when decoding
  embedded buffers. The focused fixture-parse test supplies a test-only
  ProgressEvent implementation; no production polyfill is needed in browsers.
- `@types/three` declares a development dependency on Rapier compatibility
  types. The package therefore appears transitively in the lockfile, but the
  Bunbun runtime neither imports nor bundles a physics engine.
- An already-running Bunbun web process occupied port 5173 and the server
  occupied port 3000 during smoke validation. Their updated HTML, source asset,
  health, and 404 responses passed; the existing user processes were not
  stopped or replaced.

## Plan decisions

- 2026-08-11 — Proposed D-018 as one coherent, desktop-first technical slice;
  do not begin implementation until the user accepts or changes it.
- 2026-08-11 — Keep runtime asset resolution outside LessonManifest and map
  only approved catalog IDs to repository-local assets.
- 2026-08-11 — Use direct motion within one convex walkable region for the
  prototype, because a navmesh or pathfinder adds no value without obstacles.
- 2026-08-11 — Use park_small only as a technical fixture. O-002 remains open
  for the product vertical slice.

## Validation

### Static and automated checks

Run from /home/nunu/Desktop/nnlab/nn-bunbun with Node.js 24.18.0:

- npm ci
- npm run schema:check
- npm run typecheck
- npm run lint
- npm run format:check
- npm test
- npm run build
- git diff --check
- verify the production bundle and local fixture asset sizes;
- verify no Playwright, browser automation, runtime physics usage, AI, SQLite,
  Docker, or deployment artifact was added; document unavoidable transitive
  development dependencies separately.

Focused Node tests cover pure deterministic helpers only. D-011 excludes
automated browser E2E tooling.

### Manual happy path

1. Run nvm use, npm ci, and npm run dev.
2. Open the default local URL and confirm a park renders rather than the old
   foundation card.
3. Confirm the world is dominant and the small DOM status layer remains
   readable.
4. Click several valid ground points and confirm the player moves directly,
   stops inside the authored boundary, and the newest click replaces an older
   destination.
5. Click the dog and cat and confirm the visible selected ID matches dog and
   cat respectively.
6. Use the zoom controls and confirm the fixed camera orientation remains
   stable.
7. Open diagnostics and record renderer, FPS/frame time, draw calls, triangles,
   DPR/render size, scene-ready time, and picking response.

### Manual edge cases

1. Force WebGL2 with the documented query and confirm the scene and all input
   still work while diagnostics identify WebGL2.
2. Trigger the documented asset-failure simulation, confirm a DOM error and
   diagnostic code replace the loading state, then retry successfully.
3. Click outside the walkable region, on empty non-walkable scenery, and
   rapidly at different destinations; confirm no crash or out-of-bounds move.
4. Double-click selectable objects and controls; confirm no duplicate canvas or
   leaked UI-to-world input.
5. Resize between narrow and wide desktop viewports and test high-DPI scaling;
   confirm composition, picking, and capped render resolution stay correct.
6. Background the tab during movement, wait, and resume; confirm no teleport,
   giant delta, or runaway animation.
7. Reload repeatedly and use Vite hot reload during development; confirm one
   canvas, one loop, and one set of listeners remain.

### Manual regression

1. Confirm GET /health still returns contractVersion 0.1.0 and JSON 404 remains
   unchanged.
2. Run the valid manifest inspector and all contract tests.
3. Confirm LessonManifest and CatalogSnapshot generated artifacts do not drift.
4. Confirm the runtime selects stable catalog-aligned IDs and never reads an
   arbitrary asset URL or mechanic from lesson data.
5. Confirm no lesson, AI, TTS, persistence, deployment, or automated browser
   behavior appears.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Milestone 3 functional acceptance | User | 2026-08-11 | PASS | User reported the full functional checklist passed |
| Milestone 3 performance acceptance | User | 2026-08-11 | PASS | Qualitative acceptance only; numeric diagnostics and reference-device details were not supplied |

## Recovery and compatibility

The change is frontend-only and adds no stored data or migration. npm ci
restores dependencies from the root lockfile. The old status page is replaced,
but the server and contracts remain compatible. Renderer or asset failure stays
inside a DOM error boundary and may retry without reloading the page. Scene
activation is atomic: required assets and named nodes validate before the
runtime becomes ready.

Every created Three.js resource and browser listener has one owning disposer.
If implementation exposes a material browser, renderer, or asset conflict,
stop and amend D-018 rather than silently broadening support or adding a heavy
engine.

## Documentation updates

- D-018 will record accepted renderer, browser, camera, navigation, fixture,
  asset, and measurement choices.
- BUNBUN_ARCHITECTURE.md will document the runtime scene/asset boundary.
- PERFORMANCE.md will record the reference environment and actual prototype
  measurements.
- CURRENT_STATE.md and ROADMAP.md will track implementation and acceptance.
- README.md and plans/README.md will expose commands and plan status.
- This ExecPlan will retain progress, discoveries, results, and remaining
  risks.

## Outcomes

The approved technical runtime is implemented, passes all non-browser
verification, and has user-reported functional and performance acceptance. The
repository now has one deterministic, reusable isometric park fixture with
explicit renderer fallback, local asset ownership, stable object identities,
bounded point-and-click movement, lifecycle recovery, disposal, and development
diagnostics. Milestone 3 and this ExecPlan are complete. Exact browser and
numeric diagnostic values were not supplied, so no unsupported quantitative
claim is carried into later work.
