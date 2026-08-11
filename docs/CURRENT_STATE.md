# Bunbun Current State

Last updated: 2026-08-11

## Current milestone

Milestone 3 — Isometric runtime foundation: Complete.

Next milestone: Milestone 4 — First deterministic learning loop.

Active ExecPlan: None.

Completed ExecPlans:

- plans/2026-08-10-project-foundation.md
- plans/2026-08-10-contracts-and-catalog-fixtures.md
- plans/2026-08-11-isometric-runtime-foundation.md

## Completed work

- Established the durable product vision, architecture, gameplay primitives,
  LessonManifest 0.1.0 specification, performance direction, decisions,
  roadmap, current-state record, and ExecPlan standard.
- Recorded manual browser/gameplay testing, repository continuity, and the
  local-first release gate as accepted operating decisions.
- Created the Node.js 24.18.0/npm 11.16.0 workspace with separate Vite web,
  node:http server, and shared-contract packages.
- Created the responsive Milestone 1 foundation page and deterministic health
  and JSON 404 endpoints.
- Received the user's manual acceptance of Milestone 1 and recorded the
  supplied desktop screenshot.
- Accepted D-017: TypeBox 1.x is the schema-first source, Ajv performs strict
  structural validation, and pure TypeScript performs semantic validation.
- Implemented the complete LessonManifest 0.1.0 schema, including all three
  learning-target variants, eight interaction variants, ten scaffold variants,
  completion, quality, provenance, and closed nested records.
- Implemented CatalogSnapshot 0.1.0 for scenes, spawn points, cameras, asset
  bundles, locations, entities, objects and affordances, cues, voices, and
  reference records.
- Implemented stable, sorted structural and semantic diagnostics without
  mutation, coercion, defaults, repair, or removal of unknown properties.
- Implemented deterministic catalog, reference, scene, spawn, state,
  affordance, audio, cue, provenance, interaction, scaffold, graph,
  reachability, completion, coverage, evidence, support-locale, text-safety,
  and quality checks.
- Added one valid FIND_SOMETHING lesson and catalog fixture plus the six
  roadmap-required invalid fixtures.
- Added generated LessonManifest and CatalogSnapshot JSON Schema artifacts and
  a drift check covering all eight generated artifacts.
- Added a manifest inspection command and 14 focused contract tests.
- Proved the server and web consume the same LessonManifest version through an
  isolated browser-safe export; the Milestone 2 web production JavaScript was
  1.76 kB rather than bundling validators.
- Received the user's manual acceptance of Milestone 2 on 2026-08-11; the valid
  inspector, visible LessonManifest 0.1.0 value, and health contractVersion
  0.1.0 all passed.
- Accepted D-018: Three.js 0.185.1, desktop Chromium as the reference
  environment, automatic WebGPU with a forced WebGL2 fallback path, a fixed
  orthographic isometric camera, direct convex-region movement, and explicit
  provisional performance goals.
- Implemented the asynchronous renderer lifecycle, automatic fallback,
  recoverable error UI, capped-DPR resize, visibility pause/resume, frame-delta
  cap, context-loss boundary, page/HMR teardown, and owned GPU disposal.
- Added the repository-owned park_small glTF technical fixture, code-owned
  asset registry and scene definition, required-node validation, stable
  catalog-aligned guide/dog/cat identities, authored navigation bounds, and
  placeholder Bunbun player.
- Implemented registered-object and walkable-ground raycasting, deterministic
  click-to-move with replacement destinations, dog/cat selection and highlight,
  bounded zoom, and DOM/canvas input isolation.
- Added runtime diagnostics for renderer, FPS, average/p95 frame time, draw
  calls, triangles, render size/DPR, scene-ready time, pick response, selection,
  and movement plus eight focused web runtime tests.
- Added explicit `renderer=webgl2`, `debug=1`, and one-shot
  `assetFailure=1` local query controls without adding an environment variable.
- Received the user's `PASS` for the Milestone 3 manual functional matrix on
  2026-08-11, covering normal rendering, movement and selection, forced WebGL2,
  asset-failure retry, resize, background/resume, and reload behavior. Numeric
  diagnostics and reference-device details were not included in the report.
- Received a second explicit `PASS` on 2026-08-11 for the requested diagnostics
  and performance acceptance. Milestone 3 is closed on the user's qualitative
  acceptance; exact runtime values remain unreported and are not reconstructed.

## Current work

- Prepare the Milestone 4 overview and ExecPlan for user approval before
  implementing the first deterministic learning loop.

## Repository inventory

Present:

- AGENTS.md and the required docs/ durable project records;
- .agent/PLANS.md and three completed milestone ExecPlans;
- root npm workspace and shared TypeScript, ESLint, Prettier, NVM, npm, and
  environment-example configuration;
- apps/web with Vite, Three.js, the park_small glTF fixture, isometric runtime,
  DOM shell, diagnostics, and focused tests, plus apps/server;
- packages/contracts source schemas, inferred types, validators, fixtures,
  generated JSON Schema artifacts, inspector, and tests; and
- package.json and package-lock.json.

Not present:

- database or migration files;
- production 3D, audio, or image assets;
- LessonManifest state traversal, learning interactions, or evidence;
- AI, compiler-job, TTS, or persistence integrations;
- automated browser E2E configuration or tests;
- Dockerfiles; and
- deployment configuration.

The canonical repository is /home/nunu/Desktop/nnlab/nn-bunbun. It is on main
with origin set to https://github.com/nounou176/nn-bunbun.git. Milestones 0–2
are published at 27355c0 on main and origin/main. Later Milestone 2 closure
documentation and the approved Milestone 3 implementation are currently
uncommitted.

## Known issues

1. The fixture catalog proves identities and capabilities but does not provide
   production scene, mesh, navigation, image, or audio assets.
2. Contract 0.1.0 rejects every graph cycle because it has no counter or
   condition language with which to prove an arbitrary cycle bounded.
3. Deterministic validators cannot judge natural Japanese quality or future
   physical reachability from 3D geometry; those require later review/runtime
   systems.
4. Forced WebGL2, the functional matrix, and the provisional performance matrix
   passed by user report, but numeric runtime measurements and named-device
   details were not supplied. No wider browser, mobile, or touch support is
   claimed.
5. Initial learner level, support locale, scene, scenario, and target set are
   not selected.
6. Mastery aggregation, weak-target scheduling, analytics privacy, progress
   synchronization, and compiler-draft normalization remain deferred.
7. The login shell resolves system Node.js 18.19.1 until NVM is sourced;
   contributors must run nvm use to activate Node.js 24.18.0.
8. Deployment topology remains intentionally deferred until local
   release-candidate acceptance.
9. The WebGPU-capable web build is 852,644 bytes minified and triggers Vite's
   default uncompressed chunk warning, although its measured gzip size is
   234.70 kB. Scene-ready measurements must guide later splitting decisions.

## Next recommended work

Prepare a self-contained Milestone 4 overview and ExecPlan without beginning
implementation before user approval.

## Verification status

- Dependency installation: an isolated clean `npm ci --ignore-scripts
  --offline` passed with Node.js 24.18.0/npm 11.16.0; 146 packages were added,
  150 packages were audited, and zero vulnerabilities were reported. The final
  lockfile also passes an in-place offline dry-run.
- Generated artifact drift check: passed for two schemas and six invalid
  fixtures.
- Typecheck: passed for contracts, server, web source, and web test tooling.
- Lint and format check: passed.
- Tests: passed, 22 of 22: 14 contract tests and eight web runtime helper/asset
  tests.
- Fixture inspection: the valid lesson passed; all six invalid fixtures exited
  nonzero with their intended stable error codes.
- Production build: passed for contracts, server, and web workspaces; web
  output contains 852,644-byte JavaScript, 5,537-byte CSS, a 5,899-byte local
  glTF fixture, and 520-byte HTML. Vite reports the known JavaScript chunk
  warning.
- HTTP regression: passed against the already-running local processes for
  updated web HTML/module/asset output, health contractVersion 0.1.0, and JSON
  404. A second combined startup correctly reported that the user's existing
  ports were occupied; those processes were preserved.
- Scope regression: passed; no lesson execution, AI, SQLite, TTS, physics
  runtime, Docker, deployment, or automated browser E2E artifact was added.
  The locked `@types/three` development package has an unused transitive Rapier
  type dependency; Bunbun does not import or bundle it.
- Docker build: not applicable; Dockerfiles intentionally do not exist.
- Milestone 1 manual browser test: passed by user report on 2026-08-10.
- Milestone 2 manual acceptance: passed by user report on 2026-08-11; the valid
  inspector, visible LessonManifest 0.1.0 value, and health contractVersion
  0.1.0 were confirmed.
- Milestone 3 manual functional acceptance: passed by user report on
  2026-08-11. A second `PASS` closed the requested performance checklist; exact
  reference-environment and numeric diagnostics remain unreported.
- Automated browser E2E tooling: intentionally excluded by D-011.

## Risks

- Later compiler Structured Outputs may need a separate all-required draft
  schema and deterministic normalization into the playable contract; it must
  not weaken LessonManifest 0.1.0.
- Catalog capability checks do not replace Milestone 3 measurements of
  navigation, object overlap, renderer compatibility, or real asset budgets.
- The qualitative performance `PASS` does not preserve the actual runtime FPS,
  scene-ready time, picking latency, or renderer/device details observed on the
  user's browser.
- Manual-only browser validation depends on disciplined, recorded user results.
