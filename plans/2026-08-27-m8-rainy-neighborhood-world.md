# Qualify and assemble the first rainy-evening neighborhood world

Status: Approved — intake qualified and local review ready; exact visual selection pending
Owner: Codex and user
Created: 2026-08-27
Last updated: 2026-08-27 20:01 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Deliver parent showcase Milestone 3: one bounded, reusable Three.js
rainy-evening Japanese-neighborhood chunk for the later `Three Minutes to the
Last Train` lesson. A local preview must show the short road, unbranded
convenience-store frontage, park edge, umbrella stand, Aoi, Tanaka, and Momo the
cat. The learner can point and click through the authored pedestrian area;
required anchors are reachable; approved M8 rain, road, and distant-rail audio
plays through the completed mixer; and the scene works in automatic renderer
mode and forced WebGL2.

This plan creates the reviewed world foundation only. It does not author the
complete lesson, generate final dialogue, or add NPC personality logic. Parent
showcase Milestone 4 will author the lesson package after this world checkpoint
is accepted.

Plan approval authorizes only the bounded candidate intake and local review
stages below. It does not approve a pack wholesale for Git or runtime use. A
second exact user decision over selected source-file identities and SHA-256
hashes is required before assembly or runtime registration.

## Repository context

The current browser runtime is a technical park:

- `apps/web/src/assets/park-small.gltf` is a 5,899-byte project fixture with
  `park_fixture_root` and `walkable_ground` nodes;
- `apps/web/src/game/park-definition.ts` hard-codes `park_small`, one asset URL,
  rectangular movement bounds, two generic NPC placements, and two animals;
- `apps/web/src/game/scene-definition.ts` restricts its type literals to the
  park IDs;
- `apps/web/src/game/park-world.ts` loads the park GLTF but builds the player,
  NPCs, animals, targets, lights, and markers from code-owned primitive meshes;
- `apps/web/src/game/runtime.ts` imports `PARK_SCENE_DEFINITION` directly, so a
  validated manifest's registered scene and bundle IDs do not yet choose the
  visual world;
- direct movement supports one obstacle-free authored rectangular area and no
  pathfinding dependency; and
- the D-043 mixer already owns approved rain, distant-road, distant-rail,
  footsteps, cat, object, feedback, tension, and resolution audio.

The technical park remains a supported regression fixture. This plan adds one
production-oriented scene without importing the older Dreamworld or
`bunbun/game2` implementation.

The governing records are D-001 through D-005, D-011, D-015, D-021, D-025,
D-026, D-038, and D-043; `docs/WORLD_AUTHORING.md`; the production-world gate
in `docs/PERFORMANCE.md`; and parent plan
`plans/2026-08-19-audio-complete-last-train-showcase.md`.

## Candidate research snapshot

Read-only research on 2026-08-27 rechecked the official candidate pages named
by D-025. Page facts are provisional until intake captures the actual source
archive, included license, and hashes.

| Candidate                  | Official page fact on 2026-08-27                 | Proposed bounded role                                   |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Kenney City Kit (Roads)    | Version 2.1, 90 files, CC0                       | Road, curb, crossing, light/sign candidates             |
| Kenney City Kit (Suburban) | Version 2.0, 40 files, CC0                       | Unbranded store-front/building and park-edge candidates |
| Kenney Blocky Characters   | Version 2.0, 20 files, CC0, animation advertised | Exact Aoi and Tanaka visual candidates                  |
| Kenney Cube Pets           | Version 2.0, 24 files, CC0, animation advertised | Exact Momo cat visual candidate                         |

Canonical pages:

- `https://kenney.nl/assets/city-kit-roads`
- `https://kenney.nl/assets/city-kit-suburban`
- `https://kenney.nl/assets/blocky-characters`
- `https://kenney.nl/assets/cube-pets`
- `https://kenney.nl/support`

Kenney's official support page says asset-page downloads are CC0, including
commercial use, and attribution is not required. The asset pages present a
free `Continue without donating` route. Bunbun will nevertheless show a
voluntary `Kenney` credit and will not use the Kenney logo. The paid All-in-One
bundle and donations are excluded from this plan.

The exact archive URLs, archive sizes, member lists, included license files,
selected model files, and hashes are deliberately unknown until the approved
intake runs. A page title or pack-level CC0 label is not runtime approval.

## Scope

### In scope

- Intake at most the four official Kenney archives above into ignored local
  staging after explicit plan approval.
- Capture canonical page evidence, included license files, download time,
  resolved source URLs, archive hashes, byte sizes, and safe member manifests.
- Reject unsafe archives before extraction and keep the complete source packs
  outside Git and outside production builds.
- Build a local-only 3D review sheet using the already installed
  `three@0.185.1` loaders and controls. Show each viable model's exact source
  identity, hash, nodes, meshes, triangles, materials, textures, rigs, clips,
  bounding box, axes, and animation preview.
- Obtain a second user approval bound to exact selected source files and
  SHA-256 hashes for road/store/park props, Aoi, Tanaka, and Momo.
- Assemble one project-authored layout from only the exact approved source
  models using the already installed Three.js loaders/exporter.
- Export and validate one static neighborhood GLB plus the minimum separate
  actor GLBs needed to retain approved rigs and clips.
- Add a code-owned world asset registry and a reusable scene definition while
  preserving the technical park.
- Register stable scene, variant, bundle, entity, location, object, spawn,
  camera, animation, and presentation IDs needed by the next lesson milestone.
- Keep one authored obstacle-free pedestrian area so direct point-and-click
  movement remains valid without a pathfinding dependency.
- Add restrained code-owned rainy-evening presentation using existing Three.js
  primitives and the approved M8 audio registry; do not add a VFX package.
- Add a closed local world-preview route that exercises movement, picking,
  actor animation, ambience, failure recovery, diagnostics, and disposal
  without claiming a complete lesson.
- Measure provenance, build size, GLB structure, renderer diagnostics, and
  named manual-browser behavior.

### Out of scope

- Final lesson content, production speech set, target coverage, story steps,
  scaffolds, feedback copy, or compiler integration; those belong to parent
  Milestones 4 and 5.
- A seamless city, station scene, interiors, enterable store, traffic, crowds,
  multiple chunks loaded together, day/night simulation, or procedural city
  growth.
- Freeform collision events, physics, combat, inventory systems, or a ninth
  gameplay primitive.
- `three-pathfinding`, Yuka, Recast, Rapier, THREE.Terrain, Blender,
  glTF-Transform, Meshopt, Draco, KTX2, a particle library, or any other new
  service, dependency, model, tool, or asset source.
- Runtime network requests to Kenney, threejs.org, a CDN, or an authoring tool.
- The paid Kenney All-in-One bundle, a donation, an account, credential, API
  key, environment variable, subscription, free-tier dependency, or recurring
  service.
- Automated browser E2E under D-011, Docker under D-015, hosting, and release
  work.

## Decisions and constraints

### Recommended production route

Use the repository-pinned `three@0.185.1` package already present in Bunbun:

- `GLTFLoader` for intake and runtime parsing;
- `GLTFExporter` for binary GLB output;
- `SkeletonUtils` only if an approved animated actor requires safe cloning;
  and
- existing Three.js primitives for lighting, fog, markers, and a bounded rain
  presentation.

This is the smallest coherent route. It avoids a new converter/runtime
dependency and keeps the source layout reproducible in a code-owned assembly
record. The official Three.js Editor may be used only as an optional visual
scratchpad with public Kenney assets; it is not the authoritative exporter or
the sole source of transforms. No learner or private project data is sent to
it. If the pinned exporter cannot reproduce a valid scene, stop and present a
separate tool proposal rather than silently adding Blender or glTF-Transform.

### Proposed durable world identities

These IDs become final only after exact visual selection and implementation
review:

- scene: `neighborhood_small`
- variant: `rainy_evening_last_train_v1`
- bundles: `neighborhood_rainy_core_v1`, `last_train_characters_v1`, and
  `neighborhood_animals_v1`
- camera: `neighborhood_isometric_default`
- entities: `aoi`, `tanaka`, and `momo`
- catalog entities: `npc_aoi_student`, `npc_tanaka_clerk`, and
  `animal_momo_cat`
- locations: `store_front`, `park_edge`, `road_crossing`,
  `umbrella_stand_area`, and `staff_only_door`
- future object anchors: `wallet_clue` and `mistaken_umbrella`
- spawn points: `player_start`, `aoi_storefront`, `tanaka_store_door`,
  `momo_park_edge`, `wallet_clue_spawn`, and `umbrella_clue_spawn`

LessonManifest remains 0.1.0 and continues to contain registered IDs only. It
does not gain file paths, transforms, materials, animation names, navigation
geometry, or source metadata.

### Navigation boundary

The first layout uses one code-owned rectangular or convex pedestrian area.
Buildings, lamp posts, signs, the road carriageway, and the umbrella stand sit
outside its traversable interior or at reviewed non-blocking edges. Every
required location and future clue anchor must be reachable by direct movement
within three seconds at the accepted movement speed.

If the reviewed composition needs routing around an obstacle, this plan stops
before runtime registration. An authored-navmesh and `three-pathfinding`
compatibility spike requires a separate D-038 plan and approval.

### Performance and asset ceilings

The exact selected result must stay within all of these initial ceilings:

- at most 6 MiB encoded across the static chunk and three actor GLBs;
- at most 50,000 visible triangles at the accepted camera;
- fewer than 100 draw calls in the representative scene;
- at most 250 exported nodes and 32 unique runtime materials;
- textures at or below 1024 px per dimension and at most 32 MiB estimated
  decoded texture memory;
- at most three active animation mixers and three shipped clips per actor;
- DPR capped at 1.5;
- 60 FPS preferred, first visible local scene under two seconds, picking under
  100 ms, and longest required movement under three seconds on the named
  reference device; and
- no compression decoder added unless an observed uncompressed result fails a
  later explicitly approved budget decision.

An exceeded preferred runtime goal is recorded rather than hidden. An exceeded
asset ceiling blocks registration until the user approves a revised plan.

## Cost, license, data, and operations review

| Boundary                                     |     Expected cost |                                         Worst committed cost | Account or credential | Data flow                                                                    | Removal path                                                             |
| -------------------------------------------- | ----------------: | -----------------------------------------------------------: | --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Four individual Kenney asset-page downloads  |             USD 0 | USD 0; abort before payment, donation, login, or paid bundle | None                  | Public archive travels from `kenney.nl` to ignored local staging; no upload  | Delete bounded staging and any unapproved derived files                  |
| Kenney runtime selections                    |   USD 0 recurring |                                                        USD 0 | None                  | Exact approved files are processed locally and shipped same-origin           | Remove registry entries and tracked derived GLBs in a new scene revision |
| Existing `three@0.185.1` loaders/exporter    | USD 0 incremental |                                                        USD 0 | None                  | Local files only during assembly and runtime                                 | Remove assembly scripts; existing Three runtime remains                  |
| Local review server                          |             USD 0 |                                                        USD 0 | None                  | Loopback only; source models never leave the machine                         | Stop server and delete ignored review output                             |
| Optional official Three.js Editor scratchpad |    USD 0 expected |                            USD 0; do not purchase or sign in | None                  | Browser fetches editor code; only public Kenney assets may be opened locally | Close browser; authoritative assembly does not depend on it              |

No environment variable is proposed. No learner target, Japanese lesson text,
evidence, save data, speech cache, identifier, prompt, or secret is transmitted
to a third party. Ordinary gameplay performs only same-origin asset requests.

### Bounded intake safety limits

- no more than four archives;
- no archive above 128 MiB and no more than 256 MiB compressed total;
- no more than 1 GiB expanded total or 2,000 members;
- no individual extracted member above 64 MiB;
- reject absolute paths, traversal, symlinks, nested archives, executables,
  scripts, HTML applications, and unsupported media types;
- accept only documented model, texture, preview, and license/readme files; and
- bind the intake/review server only to `127.0.0.1`.

If an official page requires payment, login, a new license, or a larger bound,
the intake stops. Free tiers, temporary promotions, and the current paid
All-in-One advertisement do not change the USD 0 boundary.

## Implementation approach

Create a content-addressed world pipeline parallel to the accepted non-speech
audio pipeline:

1. An approved intake command downloads only the four official individual
   packs into `.bunbun-data/world-intake/m8-neighborhood/v1/`.
2. A validator records source pages, included licenses, archives, members,
   magic bytes, hashes, model structure, animation facts, and safety results.
3. A loopback review page renders viable exact candidates without remote URLs
   and exports a strict approval-result JSON containing every accepted or
   rejected candidate identity and hash.
4. Only after the second user approval does a deterministic assembly script
   read an explicit project-authored layout manifest, load the selected
   sources, apply recorded transforms/material adjustments, and export the
   bounded GLBs.
5. Runtime validators bind tracked GLBs to source approval, layout version,
   output hashes, required node/clip names, stable catalog IDs, and budgets.
6. A small world registry selects the technical park or neighborhood scene by
   a code-owned registered ID. The existing park remains default for existing
   manifests; a closed local preview selects the new scene until parent
   Milestone 4 supplies its valid lesson package.
7. The generalized world loader instantiates static geometry and approved
   actor roots, registers selectors and locations, starts approved scene
   ambience through the existing mixer, and disposes geometry, materials,
   textures, animation mixers, and audio safely.

The source layout record owns transforms and chosen clip mappings. The GLBs own
renderable geometry, materials, rigs, and clips. Scene definitions own stable
IDs, spawn points, camera, walkability, placements, ambience, and deterministic
presentation. No AI participates in intake, asset selection, export, loading,
navigation, or the render loop.

## Planned repository changes

Candidate intake and review, after first approval:

- `.bunbun-data/world-intake/m8-neighborhood/v1/` — ignored source, extracted,
  candidate, review, and derived staging;
- `scripts/intake-m8-world-assets.mjs` — bounded download and source capture;
- `scripts/validate-m8-world-intake.mjs` — archive/media/license/model checks;
- `scripts/serve-m8-world-review.mjs` — loopback exact-candidate review;
- `docs/world-sources/M8_WORLD_CANDIDATES_2026-08-27.json` — technical
  candidate facts after intake; and
- root npm scripts `world:m8:intake`, `world:m8:intake-check`, and
  `world:m8:review`.

Assembly and runtime, only after exact second approval:

- `docs/world-sources/M8_WORLD_APPROVAL_2026-08-27.json` — exact user decision;
- `docs/world-sources/M8_WORLD_LAYOUT_V1.json` — deterministic source transforms
  and clip/material decisions;
- `docs/world-sources/M8_WORLD_RUNTIME_V1.json` — output identity, rights,
  budgets, and required nodes;
- `scripts/assemble-m8-neighborhood.mjs` and focused tests;
- `scripts/validate-m8-runtime-world.mjs`;
- `apps/web/src/assets/world/neighborhood-rainy-evening/v1/` — only approved
  derived runtime GLBs;
- `apps/web/src/game/world-assets.ts` — exact code-owned runtime registry;
- `apps/web/src/game/neighborhood-definition.ts` — stable scene metadata;
- generalize `scene-definition.ts`, `park-world.ts`, and `runtime.ts` only as
  needed to support both registered scenes;
- `config.ts`, `main.ts`, and the authoring home only for one closed local
  preview route; and
- focused web tests for registry identity, loading, node/animation checks,
  reachability, selection, failure, and disposal.

Names may be adjusted during implementation only to match existing repository
conventions; scope and authority may not expand silently.

## Milestones

### 0. Approve the bounded world plan

Review this document's source list, two-gate selection model, no-new-dependency
route, cost/license/data boundary, stable IDs, layout envelope, budgets, and
recovery. If accepted, record a new D-044 decision and mark this plan Approved.

Observable checkpoint: repository documentation authorizes four ignored
candidate downloads and a local review sheet, but no runtime selection.

### 1. Intake and technically qualify exact source packs

Capture the four official individual downloads within the safety bounds,
retain page/license evidence, inspect archives before extraction, and produce
model/animation/provenance facts. Do not copy a source pack into Git.

Observable checkpoint: every archive and viable model has a reproducible exact
identity and every rejected archive/member has an explicit reason.

### 2. Review and approve exact visual candidates

Run the loopback 3D review page. Compare road/store/park components and exact
Aoi/Tanaka/Momo candidates at the target isometric camera, including animation
clips. Export one complete approval packet; ask the user to approve or reject
every candidate by `assetId + SHA-256`.

Observable checkpoint: a strict 100-percent decision exists for the bounded
candidate set. No undecided or merely pack-approved file can proceed.

### 3. Assemble and validate the immutable GLB bundle

Create the explicit source layout, assemble only approved assets, export the
static scene and minimum actor GLBs, then validate two consecutive exports,
required nodes, rigs/clips, transforms, hashes, and budgets.

Observable checkpoint: the exported bundle is reproducible and fully traceable
to source archives, selected members, approvals, transforms, and Three.js
version.

### 4. Register the reusable world boundary

Generalize the park-only type and loader minimally, add the world registry and
neighborhood definition, preserve technical park behavior, and resolve only
registered same-origin asset IDs. Add the closed preview route.

Observable checkpoint: the app can load either the unchanged park or the new
neighborhood without a manifest-supplied path or remote request.

### 5. Complete rainy-evening presentation and interaction

Place Aoi, Tanaka, Momo, the umbrella stand, future clue anchors, locations,
spawn points, markers, camera, fog/lights, bounded rain presentation, and the
approved scene ambience. Run approved idle clips where available. Keep every
required target reachable with direct movement and keep lesson truth outside
the scene.

Observable checkpoint: movement, selection, animation, ambience, background/
resume, restart, failure, and disposal behave deterministically in the local
preview.

### 6. Verify and hand off manual acceptance

Run supported provenance, GLB, registry, unit, schema, static, build, and diff
checks. Record measured asset/build facts and provide the user's WebGPU/WebGL2
manual matrix.

Observable checkpoint: all exact assets have provenance, automated non-browser
checks pass, and the user receives a reproducible world acceptance checklist.

## Progress

- [x] 2026-08-27 12:53 — Re-read the accepted product/world/audio boundaries,
      inspect the park-only runtime, and recheck the four official Kenney
      candidate pages and support/license statement without downloading.
- [x] 2026-08-27 12:53 — Prepare this self-contained proposed D-044 plan. No
      third-party asset, dependency, tool, runtime file, or environment
      variable was added.
- [x] 2026-08-27 16:36 — User explicitly approved `DUYỆT PLAN M8 WORLD M3`.
      D-044 authorizes only the bounded ignored candidate intake and local
      review; exact visual/hash selection remains a second user gate.
- [x] 2026-08-27 17:05 — Capture and validate the four exact official
      archives in ignored content-addressed staging. All 177 GLBs, 21 required
      PNG textures, four pack license files, source pages, and the support
      statement are accounted for within the approved bounds.
- [x] 2026-08-27 17:05 — Generate the tracked 55-candidate exact-hash catalog,
      explicitly exclude 122 models from this bounded review, and provide the
      loopback Three.js review page with animation playback, resumable review
      state, strict assignment constraints, and complete approval/rejection
      JSON export. No candidate is selected by the implementation.
- [x] 2026-08-27 17:07 — The user's first browser screenshot showed that the
      module stopped before rendering assignment controls or candidate cards,
      leaving the viewer blank. Render the catalog controls before GPU
      initialization, contain malformed local state, surface module/renderer
      failures inside the page, and automatically load the first model after a
      successful renderer start. Focused tests, lint, and loopback model/
      texture smoke checks pass. A second screenshot reproduced the blank page
      and isolated the missing `/vendor/three.core.js` dependency route. The
      complete Three.js module chain now returns HTTP 200 and has a focused
      regression test; user browser retest is pending.
- [x] 2026-08-27 19:47 — Replace the stale pre-fix review process, verify the
      complete Three.js module/GLB/texture chain on port 4176, and receive the
      user's explicit `PASS` for the corrected local review UI and model
      display. This validates the review tool only; exact candidate selection
      remains pending until the user returns its complete JSON packet.
- [x] 2026-08-27 20:01 — Receive and strictly validate the complete local
      selection proposal against catalog SHA-256
      `a843db08d0c73f25441d349bcf7a73ad765fdab2b246bfba3dbf25c590a95f8b`.
      Its packet SHA-256 is
      `e9b6fa88597815d1178a35c4f63651a4504f212eec1b8fe9b340bf3a380b9390`;
      it decides 55/55 candidates as 18 approved and 37 rejected, satisfies
      every group constraint, and assigns distinct Aoi/Tanaka models. The
      packet remains `PROPOSED_FOR_USER_APPROVAL`; explicit Gate 2 approval is
      still required before recording an approval artifact or assembling.
- [ ] Obtain exact hash-bound visual selection approval.
- [ ] Assemble, register, verify, and manually accept the neighborhood.

## Surprises and discoveries

- The official City Kit (Roads) page now advertises version 2.1 and 90 files,
  while earlier repository research recorded fewer files. This confirms that
  page names cannot stand in for immutable archive identities.
- The official Roads archive contains `Overview.html`. It is static pack
  documentation, not an authorized application: intake records but never
  extracts or serves it. Executable/script members remain pack-level failures.
- Kenney's files in the `GLB format` directories keep geometry/animation in
  GLB but reference sibling PNG textures. Qualification therefore extracts
  only the exact `Models/GLB format/Textures/*.png` members from the same four
  approved archives, validates their hashes, and exposes them only through the
  loopback candidate route. It does not treat the GLBs as falsely
  self-contained or add another source.
- Cube Pets 2.0 is advertised as a 2026 complete remake with animations. It is
  a current candidate, not the same immutable source as an older pack version.
- Blender is not available in the current command environment. The installed
  Three.js package already contains `GLTFLoader`, `GLTFExporter`, and
  `SkeletonUtils`, so a no-new-dependency qualification route is possible.
- The runtime validates manifest scene IDs but still renders
  `PARK_SCENE_DEFINITION` directly. Milestone 3 must close that registered-
  scene selection seam without authoring the complete Milestone 4 lesson.
- Direct rectangular movement remains sufficient only if composition treats
  obstacles as non-traversable visual edges. A visually attractive layout is
  not allowed to smuggle in an unapproved pathfinding dependency.
- The first visual-review open rendered only static HTML: no assignments,
  candidate cards, or model appeared. GPU setup happened before catalog DOM
  rendering, so any early module/renderer exception erased the entire review
  workflow. The second screenshot and live HTML inspection identified the
  actual import failure: `three.module.js` imports `./three.core.js`, but the
  local review server did not serve `/vendor/three.core.js`. The server now
  serves both build modules plus contained addons, and the review page renders
  catalog controls before GPU initialization rather than failing blank.

## Plan decisions

- 2026-08-27 — Recommend four official individual Kenney packs only; exclude
  the paid All-in-One bundle and every additional asset source.
- 2026-08-27 — Recommend two user gates: approve bounded ignored intake first,
  then approve exact selected model hashes before Git/runtime registration.
- 2026-08-27 — Recommend the existing pinned Three.js loaders/exporter as the
  authoritative local pipeline; keep the official editor optional and
  non-authoritative.
- 2026-08-27 — Recommend one obstacle-free authored pedestrian area and no
  pathfinding dependency for this first chunk.
- 2026-08-27 — Preserve LessonManifest 0.1.0, the technical park, the D-043
  mixer, and ordinary local deterministic gameplay.

The user accepted these boundaries under D-044 for candidate intake and local
review. Exact source-member and runtime selections remain unapproved until the
second hash-bound gate.

## Validation

### Static and automated checks

After implementation approval, run from
`/home/nunu/Desktop/nnlab/nn-bunbun` with the pinned Node/npm toolchain:

1. `npm run world:m8:intake-check`
2. `npm run world:m8:assemble`
3. `npm run world:m8:runtime-check`
4. the focused deterministic assembly test twice and require identical output
   hashes;
5. `npm run schema:check`
6. `npm run typecheck`
7. `npm run lint`
8. `npm run format:check`
9. `npm test`
10. `npm run build`
11. `git diff --check`

Tests must cover archive traversal/symlink/nested-archive/size failures,
unknown or changed approval hashes, extra runtime files, missing required GLB
nodes, invalid rigs/clips, duplicate IDs, bundle mismatch, unreachable anchors,
missing optional actor animation, required world-asset failure, scene switching,
technical-park preservation, background/resume, restart, and idempotent
disposal.

No automated browser E2E is added or run under D-011. Docker is not applicable
under D-015 because the complete local game is not yet an accepted release
candidate.

Candidate-gate results on 2026-08-27:

- `npm run world:m8:intake`: pass; four immutable archives, 10,849,076
  compressed bytes, 42,954,997 expanded bytes, and 1,017 members;
- `npm run world:m8:intake-check`: pass; 177 structurally qualified GLBs, 55
  review candidates, and 122 explicit out-of-scope records;
- `npm run world:m8:test`: pass for all three focused test files; and
- loopback smoke check: HTML, local Three.js loader, one animated character
  GLB, and its exact PNG texture return HTTP 200. Browser visual acceptance is
  intentionally left to the user under D-011.
- schema drift (56 files), workspace typecheck, lint, repository plus focused
  formatting, production build, and diff hygiene pass; all 96 workspace tests
  pass when the existing server loopback boundary is permitted. The first
  restricted-sandbox run reproduced the known Node native abort while loopback
  listen was blocked; the authorized rerun passes contracts 41/41, server 9/9,
  and web 46/46.

### Manual source and visual gate

1. Open the loopback review sheet with network access disabled after intake.
2. Inspect each candidate at the target camera and rotate/zoom it.
3. Verify scale, origin, axes, material appearance, silhouettes, clipping, and
   unbranded presentation.
4. For actors, play every proposed shipped clip and reject broken rigs,
   sliding, deformation, unsuitable personality cues, or inconsistent scale.
5. Compare exact candidates for Aoi, Tanaka, and Momo and approve every shipped
   source file by hash.
6. Confirm the approval packet accounts for every candidate as approved or
   rejected.

### Manual happy path

1. Start the local neighborhood preview with automatic renderer selection.
2. Confirm the scene visibly reads as a compact rainy Japanese neighborhood:
   short road, unbranded store frontage, park edge, umbrella stand, Aoi,
   Tanaka, and Momo.
3. Unlock audio and confirm approved rain/road/rail ambience supports rather
   than masks the scene.
4. Move through every registered location and select Aoi, Tanaka, Momo, and
   the future clue anchors.
5. Confirm expected idle animation, markers, camera framing, and diagnostics.
6. Leave and re-enter the preview; no stale actor, animation, GPU, or audio
   source remains.

### Manual edge cases

1. Force one missing static world GLB and confirm a clear recoverable world
   error without partial interaction or evidence.
2. Force one missing optional actor clip and confirm the actor remains visible
   in a safe static pose with diagnostics.
3. Deny initial audio unlock; world movement and visual context remain usable,
   and a later gesture starts ambience once.
4. Background and resume during movement, rain presentation, actor animation,
   and ambience; only desired persistent presentation returns.
5. Click outside the pedestrian area, on road/building geometry, and rapidly
   across multiple targets; movement remains bounded and selection is not
   duplicated.
6. Resize from narrow portrait to desktop, zoom to both limits, and repeat at
   DPR 1.0 and capped 1.5.

### Manual regression

1. Load the existing park technical demo and repeat movement, picking,
   selection, audio, restart, renderer fallback, and disposal checks.
2. Force WebGL2 for both park and neighborhood and confirm neither scene is
   blank.
3. Confirm current published park lessons still resolve `park_small` and never
   receive neighborhood assets accidentally.
4. Confirm the neighborhood makes no runtime request to Kenney, threejs.org,
   an editor, a model, TTS, or an LLM.
5. Confirm audio controls and DOM overlays do not trigger world picking.

### Manual performance record

Record browser version, OS, device, GPU, display, renderer, DPR, cold/warm
scene-ready time, FPS, average/p95 frame time, draw calls, triangles, picking
response, longest movement, encoded world bytes, and active animation mixers.
No wider device claim follows from one report.

### Manual results

| Scenario                              | Tester  | Date       | Result  | Evidence or notes                              |
| ------------------------------------- | ------- | ---------- | ------- | ---------------------------------------------- |
| Local review UI and model loading     | User    | 2026-08-27 | Pass    | Explicit `PASS` after corrected server restart |
| Exact visual candidate approval       | Pending | 2026-08-27 | Not run | Valid 55/55 proposal awaits explicit approval  |
| Automatic renderer happy path         | Pending | Pending    | Not run | Requires implementation                        |
| Forced WebGL2 happy path              | Pending | Pending    | Not run | Requires implementation                        |
| Missing asset and background recovery | Pending | Pending    | Not run | Requires implementation                        |
| Technical park regression             | Pending | Pending    | Not run | Requires implementation                        |
| Named-device performance              | Pending | Pending    | Not run | Requires implementation                        |

## Recovery and compatibility

Candidate intake is idempotent and content-addressed. A changed archive or
member hash is a new candidate and cannot inherit approval. Re-running
assembly from the same approved sources and layout must produce the same GLB
hashes; otherwise registration fails.

Ignored staging can be removed without touching Git, the speech cache,
evidence SQLite data, or accepted audio. Tracked runtime GLBs are immutable by
version and hash. A later visual change creates `v2`; it does not overwrite a
published lesson's scene revision.

The technical park remains registered and is the fallback regression world.
A failed neighborhood load shows a recoverable error; it never falls through
to a visually different park while claiming the neighborhood lesson is active.
No applied SQLite migration changes in this plan.

If license, archive safety, animation compatibility, deterministic export,
reachability, or budget validation fails, stop before the relevant promotion
step. Do not solve failure by adding a different source, converter,
pathfinding/VFX package, paid tool, or remote service without a new approved
plan.

## Documentation updates

After first approval:

- add D-044 to `docs/DECISIONS.md`;
- mark this plan Approved;
- update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `docs/WORLD_AUTHORING.md`,
  and `plans/README.md`; and
- update the parent showcase plan's Milestone 3 progress.

After exact asset approval and implementation:

- record source/archive/member/output hashes and rights under
  `docs/world-sources/`;
- update `docs/BUNBUN_ARCHITECTURE.md`, `docs/GAMEPLAY.md`,
  `docs/LESSON_MANIFEST.md`, and `docs/PERFORMANCE.md` with observed boundaries
  and measurements; and
- record only user-reported manual results before marking this plan Complete.

## Outcomes

Approved candidate intake and technical qualification are complete. Exact
source archives remain ignored; the tracked catalog contains provenance,
structural facts, hashes, decision bounds, and no selected asset. No new
dependency, service, environment variable, account, runtime asset, or gameplay
world code was added. The next authorized action is user-operated visual
review and exact hash-bound approval; assembly remains blocked.
