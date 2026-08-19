# Bunbun Current State

Last updated: 2026-08-19

## Current milestone

Milestone 7 — Lesson compiler with Structured Outputs: phase 0 prompt pack
approved; remaining architecture and ExecPlan gates await user approval. No
compiler implementation has started.

Active ExecPlan:

- plans/2026-08-12-structured-lesson-compiler.md — Proposed

Completed ExecPlans:

- plans/2026-08-10-project-foundation.md
- plans/2026-08-10-contracts-and-catalog-fixtures.md
- plans/2026-08-11-isometric-runtime-foundation.md
- plans/2026-08-11-first-deterministic-learning-loop.md
- plans/2026-08-12-complete-mvp-primitive-runtime.md
- plans/2026-08-12-local-evidence-sqlite-persistence.md

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
- Accepted D-019 and implemented a second reviewed FIND_SOMETHING fixture with
  the required LISTEN → CLICK_OBJECT → CHOOSE sequence while preserving the
  Milestone 2 one-step fixture.
- Added full structural and semantic lesson-package validation before renderer
  startup plus a closed Milestone 4 capability gate for the scene, object,
  audio, cue, scaffold, and primitive executors that actually exist.
- Added a pure deterministic lesson controller with bounded attempts, authored
  scaffold escalation, seeded choices, assisted outcomes, feedback input
  locking, required-step completion, and a fresh in-memory session on restart.
- Added visibility-aware active timing and idempotent session-local exposure,
  heard, reaction, step-completed, and lesson-completed records. Heard evidence
  is written only after playback starts and replay cannot duplicate it.
- Added the temporary learner-gesture SpeechSynthesis adapter behind
  AudioPlaybackPort, a visible assisted audio-failure path, Japanese-first DOM
  learning UI, deterministic focus transitions, and candidate-filtered world
  input/highlight/cue commands.
- Added `manifestFailure=1` and `audioFailure=1` local controls and expanded
  diagnostics with lesson progress, heard/terminal/assisted outcomes,
  correct/wrong reaction counts, active time, latest reaction latency, and time
  to first lesson stimulus.
- The user's first Milestone 4 browser attempt exposed a world-to-lesson bridge
  defect: picking selected `dog`, but `find_dog` remained `AWAITING_OBJECT`
  with zero reactions. Replaced the indirect post-construction callback with an
  atomic candidate-and-handler input gate and added a focused regression test.
- The same screenshot exposed a diagnostics error: `render.calls` reported
  cumulative render invocations as draw calls. Diagnostics now use the
  per-frame `render.drawCalls` value.
- The user confirmed the corrected animal click reaches the lesson, then found
  an EXPLORE affordance issue: the centered translucent lesson card made the
  world appear modal and disabled. EXPLORE now uses a compact left-side mission
  card, reduced edge dimming, an active canvas cursor, and an explicit
  Japanese/Vietnamese instruction to click an animal in the park.
- Passed schema drift, typecheck, lint, format, 38 focused tests, and the
  production build after the fixes. The Milestone 4 JavaScript is 1,229,245
  bytes minified (340.84 kB gzip); the known Vite large-chunk warning remains
  visible.
- Received the user's explicit `PASS` on 2026-08-12 for the corrected compact
  EXPLORE presentation and the complete Milestone 4 manual happy-path,
  edge-case, failure-control, renderer, resize, and regression checklist.
  Milestone 4 is closed.
- Accepted D-020 after the user's Milestone 5 plan approval and kept
  LessonManifest/CatalogSnapshot at 0.1.0 while completing the remaining fixed
  primitive executors.
- Promoted exact TYPE normalization and Unicode code-point helpers into one
  browser-safe contracts utility shared by semantic validation and gameplay.
- Added a valid eight-step HELP_SOMEONE fixture that executes LISTEN, ARRANGE,
  CLICK_OBJECT, TYPE, MOVE_TO, PICK_UP, GIVE, and CHOOSE in one acyclic required
  path while preserving both earlier valid fixtures.
- Expanded the technical catalog and code-owned park registry with animal and
  bench locations plus a second visitor NPC. The new content remains a
  technical fixture and does not resolve O-001 or O-002.
- Extended the pure lesson controller with stable duplicate ARRANGE token IDs,
  seeded ordering, exact normalized TYPE answers, Unicode input limits,
  preserveSubmittedState, authored location arrival, deterministic movement
  failure recovery, one task-scoped carry slot, assisted PICK_UP, wrong-recipient
  retention, correct GIVE transfer, and invalid-carry rejection.
- Added accessible DOM token and Japanese TYPE controls with pointer, keyboard,
  deterministic focus, and IME composition isolation. Added dynamic compact
  EXPLORE action cues for objects, locations, pickup, movement, and recipients.
- Generalized the atomic lesson input gate into isolated OBJECT, LOCATION, and
  RECIPIENT modes. Added authored location markers, arrival-radius movement,
  guide/visitor selection, dog follow/escort presentation, transfer placement,
  and clean world restart without inventory, physics, collision, or pathfinding.
- Added `movementFailure=1` and `carryFailure=1` one-shot local controls and
  diagnostics for world target mode, pending location, and carried object.
- Passed schema drift, typecheck, lint, formatting, 46 focused tests, manifest
  inspection, the production build, and local web/health/404 HTTP smoke checks.
- Received the user's explicit `PASS` on 2026-08-12 for the complete Milestone 5
  manual happy-path, edge-case, failure-control, renderer, lifecycle, and
  performance matrix. No numeric diagnostics or per-scenario notes were
  supplied, so the milestone is closed on qualitative acceptance without a
  wider browser/device or numeric runtime claim.
- Accepted D-021 and added the independent EvidencePersistence 0.1.0 TypeBox
  contract, inferred types, Ajv validators, and generated JSON Schema artifact
  without changing LessonManifest or CatalogSnapshot 0.1.0.
- Removed learner TYPE values and answer-derived content from durable event
  payloads and IDs. Persisted TYPE reactions retain only correctness, authored
  target/evidence identity, support state, attempt, active latency, and time.
- Added built-in Node SQLite ownership with an ignored
  `.bunbun-data/bunbun.sqlite`, checksummed forward migrations, foreign keys,
  WAL, busy timeout, immutable lesson fingerprints, one ACTIVE session per
  lesson revision, append-only events, versioned checkpoints, idempotent commit
  receipts, preferences, summaries, and confirmed reset.
- Refactored the Node HTTP process into a testable application and added the
  closed `/api/v1` session, resume, commit, abandon, progress, preference,
  storage-summary, and local-data routes with strict JSON validation, 256 KiB
  body limits, stable errors, and the Vite same-origin development proxy.
- Added a closed checkpoint serializer and fresh-state restore for attempts,
  scaffolds, completed steps, feedback action, active time, carry, and GIVE
  transfers. TYPE drafts clear, interrupted movement/audio normalize safely,
  and acknowledged evidence is not replayed.
- Added the browser EvidenceStore port and validated HTTP adapter, ordered
  persistence gate, explicit Resume/Start again flow, abandonment on restart,
  durable completion, visible saving/error state, and no silent memory-only
  fallback.
- Added a local-only data panel with ASK/AUTO_RESUME/START_NEW preference,
  counts, conservative `INSUFFICIENT_EVIDENCE`/`NEEDS_REVIEW`/`DEVELOPING`
  signal, privacy explanation, and two-step permanent deletion. Added
  `persistenceFailure=1` and a privacy-safe `inspect:storage` command.
- Passed schema drift, typecheck, lint, formatting, 55 focused tests, and the
  production build. The two server tests exercise real temporary SQLite files,
  reopen/migration/idempotency/reset, and the complete HTTP lifecycle over
  loopback. Browser E2E remains manual under D-011.
- Received the user's explicit `DUYỆT MILESTONE 6` approval on 2026-08-12.
  This closes the supplied manual acceptance matrix qualitatively. No
  scenario-level notes, named test device, screenshots, measured persistence
  latency, or numeric renderer observations were supplied, so none are inferred.

## Current work

- Milestone 6 is closed with no blocking defect reported in the user's approval.
- Proposed D-022 and the Milestone 7 ExecPlan define a durable node:http/SQLite
  compilation job, strict Structured Outputs draft normalization, a small
  project-authored reference fixture, and validated dynamic lesson loading.
- Captured six user-owned Custom GPT configurations and their Knowledge assets
  in the Git-ignored local `gpts/` library. Added a normalized index and six
  source summaries without changing the raw inputs. The source set contains six
  configs, three Knowledge text specs, 57 PNG files representing 53 unique
  images, and one example APKG with 42 notes/cards and 38 mapped media files.
- Accepted D-023 after the user confirmed that the supplied six GPTs are the
  exact complete set. Milestone 7 maps Story Sheet to premise/story/setting,
  Story Coach to bounded hints/scaffolds/pedagogical cadence/feedback, and
  Reverse Trainer to phrase analysis/reverse recall/practice content. Code
  retains primitive sequence, difficulty progression, IDs, transitions, and
  hard budgets.
- Classified every supplied image and the APKG as a local style/output example
  only. They cannot supply lesson/reference content or evaluation fixtures.
- Accepted D-024 after the user approved Prompt Adaptation Pack 0.1.0. Its
  shared contract, three exact prompt fragments and hashes, fixed composition
  order, deterministic failure/privacy boundaries, and fifteen text-only
  fixtures are now approved. Milestone 7 phase 0 is complete.
- All three selected M7 prompt modules are Approved for implementation but are
  not implemented or runtime-active. D-022, the ExecPlan, model/reasoning
  setting, and environment-variable name remain proposed.
- Added the approved `docs/ai-modules/` adaptation pack: one shared typed
  contribution contract, three exact lean prompt fragments, source and prompt
  hashes, three module adaptation records, and fifteen text-only evaluation
  fixtures. The pack explicitly removes image/worksheet/Anki, unverified JLPT/
  reference claims, long ChatGPT teaching flows, and deterministic runtime
  control from the selected modules. Pack approval does not enable any provider
  or API call.
- Accepted D-025 after the user approved the practical Three.js world-authoring
  proposal. The approved direction uses Three.js Editor, reviewed Kenney CC0
  city/character/pet candidates, optional authoring-time THREE.Terrain, bounded
  GLB chunks, and code-owned world metadata. The first production-world
  envelope is a small Japanese neighborhood with road, convenience-store, and
  park areas, two NPCs, and one animal. No asset or dependency has been added.
- Accepted D-026 after the user approved the audio-complete showcase plan. The
  first product vertical slice is now an N5, Vietnamese-supported rainy-evening
  `Three Minutes to the Last Train` scenario with Aoi, Tanaka, Momo the cat,
  requested `財布`, `探す`, and `～てください` targets, recoverable narrative
  pressure, voiced Japanese, authored ambience, deterministic effects, and
  restrained music or stings. O-001 and O-002 are resolved for this slice.
  Exact production assets, TTS/provider/voice/cache choices, dialogue, and
  acceptance thresholds remain unimplemented or open.

## Repository inventory

Present:

- AGENTS.md, `docs/AI_MODULES.md`, `docs/WORLD_AUTHORING.md`, and the required
  docs/ durable project records;
- .agent/PLANS.md, six completed milestone ExecPlans, one proposed Milestone 7
  ExecPlan, and one approved queued audio-complete showcase ExecPlan;
- root npm workspace and shared TypeScript, ESLint, Prettier, NVM, npm, and
  environment-example configuration;
- apps/web with Vite, Three.js, the park_small glTF fixture, isometric runtime,
  deterministic eight-step/eight-primitive lesson executor, durable
  EvidenceStore adapter, safe checkpoint restore, task-scoped carry/transfer
  reconstruction, local data controls, DOM learning shell, diagnostics, and
  focused tests;
- apps/server with health and local persistence APIs, built-in SQLite database
  lifecycle, checksummed migrations, repositories, privacy-safe inspector, and
  temporary-database/HTTP integration tests;
- packages/contracts source schemas for LessonManifest, CatalogSnapshot, and
  EvidencePersistence, inferred types, validators, fixtures, generated JSON
  Schema artifacts, inspector, and tests; and
- package.json and package-lock.json.

Not present:

- production 3D, audio, or image assets;
- learner identity, cross-device sync, mastery, scheduler, or analytics
  transport;
- AI, compiler-job, or production TTS integrations;
- automated browser E2E configuration or tests;
- Dockerfiles; and
- deployment configuration.

The canonical repository is /home/nunu/Desktop/nnlab/nn-bunbun. It is on main
with origin set to https://github.com/nounou176/nn-bunbun.git. Milestones 0–2
are published at 27355c0 on origin/main. Milestone 3 is committed locally at
6a44abd. The Milestone 4 runtime/input correction, EXPLORE UX, and closure are
committed locally at 963fae3, 2aa07f6, and 8184ce3. Milestone 5 implementation
and closure are committed locally at `da0b519`. Milestone 6 implementation is
committed locally at `a69e82a`; its acceptance-closure documentation and the
proposed Milestone 7 planning records are currently uncommitted.

## Known issues

1. The fixture catalog proves identities and capabilities but does not provide
   production scene, mesh, navigation, image, or audio assets. D-025 selects
   the world-authoring pipeline and initial source candidates, but source
   intake, retained licenses, hashes, conversion, and runtime measurements are
   not implemented.
2. Contract 0.1.0 rejects every graph cycle because it has no counter or
   condition language with which to prove an arbitrary cycle bounded.
3. Deterministic validators cannot judge natural Japanese quality or future
   physical reachability from 3D geometry; those require later review/runtime
   systems.
4. Forced WebGL2, the functional matrix, and the provisional performance matrix
   passed by user report, but numeric runtime measurements and named-device
   details were not supplied. No wider browser, mobile, or touch support is
   claimed.
5. D-026 selects the first learner level, Vietnamese support locale, rainy-
   evening scene variant, scenario, and initial target set, but exact dialogue,
   reviewed reference fixture, production asset files, and measured acceptance
   thresholds are not yet selected or implemented.
6. Cross-lesson mastery aggregation, weak-target scheduling, remote analytics,
   and progress synchronization remain deferred. Compiler-draft normalization
   is proposed in D-022 but is not approved or implemented.
7. The login shell resolves system Node.js 18.19.1 until NVM is sourced;
   contributors must run nvm use to activate Node.js 24.18.0.
8. Deployment topology remains intentionally deferred until local
   release-candidate acceptance.
9. The Milestone 6 WebGPU-capable web build is 1,273.78 kB minified and
   triggers Vite's default uncompressed chunk warning, although its measured
   gzip size is 351.53 kB. Reported browser measurements must guide any future
   splitting.
10. Browser SpeechSynthesis voice quality and availability vary by installed
    desktop voice. It is a temporary technical adapter, not production TTS or
    an offline-audio guarantee.
11. Milestone 6 has only qualitative overall manual approval. There are no
    scenario-level observations, measured save/reload latency, named device or
    browser details, or numeric renderer metrics; the approval must not be
    represented as evidence for those finer-grained claims.
12. RECOGNITION_FALLBACK is valid in contract 0.1.0 but has no accepted web
    runtime rejoin semantics. D-020 keeps it capability-rejected in
    Milestone 5 rather than guessing behavior.
13. PICK_UP uses a technical dog follow/escort presentation and one carry slot;
    it is not production animal handling, an inventory, or a physics system.
14. Milestone 5 browser behavior is manually accepted, but the user supplied no
    numeric diagnostics, named-device details, or per-scenario evidence. The
    result does not establish broader browser, mobile, or touch support.
15. Six Custom GPT configurations and their local Knowledge assets are
    captured, their Milestone 7 mapping is accepted, and Prompt Adaptation Pack
    0.1.0 is approved. The three selected modules are Approved for
    implementation but remain inactive because the compiler/provider does not
    exist. GPT-editor model, capability/action, and version-history metadata was
    not supplied and is not inherited; config hashes identify the reviewed
    local source snapshots. Supplied images and the APKG remain style/output
    examples only.

## Next recommended work

Complete the remaining Milestone 7 approval gates before implementation:

1. Approve or revise proposed D-022 and
   `plans/2026-08-12-structured-lesson-compiler.md`.
2. Confirm or change the proposed `gpt-5.6-terra` model and medium reasoning
   setting.
3. Confirm or change the environment-variable name `OPENAI_API_KEY`; never
   provide or store its value in repository documentation or shared memory.
4. Start implementation only after those decisions and the ExecPlan are
   explicitly approved.

D-025 and D-026 now have an approved queued implementation plan at
`plans/2026-08-19-audio-complete-last-train-showcase.md`. It covers world and
audio source/license intake, reproducible GLB export, the representative
neighborhood chunk, catalog registration, audio completeness, performance, and
manual browser validation. It does not reorder Milestone 7, and production
work remains gated by the still-open Milestone 8 provider, voice, cache,
non-speech asset, and measurable audio acceptance choices.

## Verification status

- Dependency installation: an isolated clean `npm ci --ignore-scripts
  --offline` passed with Node.js 24.18.0/npm 11.16.0; 146 packages were added,
  150 packages were audited, and zero vulnerabilities were reported. The final
  lockfile also passes an in-place offline dry-run.
- Generated artifact drift check: passed for three schemas and six invalid
  fixtures.
- Typecheck: passed for contracts, server, web source, and web test tooling.
- Lint and format check: passed.
- Tests: passed, 55 of 55: 19 contract tests, 2 server SQLite/HTTP integration
  tests, and 34 web lesson/persistence/runtime tests.
- Fixture inspection: the valid lesson passed; all six invalid fixtures exited
  nonzero with their intended stable error codes.
- Production build: passed for contracts, server, and web workspaces; web
  output contains 1,273.78 kB JavaScript (351.53 kB gzip reported by Vite),
  12.42 kB CSS (3.17 kB gzip), a 5.89 kB local glTF fixture, and 0.52 kB
  HTML. Vite reports the known JavaScript chunk warning.
- HTTP regression: passed after starting temporary local Node 24 processes for
  updated web HTML, health contractVersion 0.1.0, and JSON 404. Sandbox port
  binding required approved local access; both processes were stopped cleanly.
- Scope regression: passed; the executor remains limited to the eight accepted
  fixed primitives, one task-scoped carry slot, server-owned local persistence,
  and the isolated temporary browser speech adapter. No AI, provider key,
  analytics transport, production TTS, physics runtime, Docker, deployment, or
  automated browser E2E artifact was added. The locked `@types/three` package
  has an unused transitive Rapier type dependency; Bunbun does not import or
  bundle it.
- Docker build: not applicable; Dockerfiles intentionally do not exist.
- Milestone 1 manual browser test: passed by user report on 2026-08-10.
- Milestone 2 manual acceptance: passed by user report on 2026-08-11; the valid
  inspector, visible LessonManifest 0.1.0 value, and health contractVersion
  0.1.0 were confirmed.
- Milestone 3 manual functional acceptance: passed by user report on
  2026-08-11. A second `PASS` closed the requested performance checklist; exact
  reference-environment and numeric diagnostics remain unreported.
- Milestone 4 manual acceptance: passed by explicit user report on 2026-08-12
  after the world-input and EXPLORE-affordance corrections.
- Milestone 5 manual acceptance: passed by explicit user report on 2026-08-12
  for the complete supplied matrix. Acceptance is qualitative because no
  numeric diagnostics or per-scenario notes were supplied.
- Milestone 6 manual acceptance: explicitly approved by the user on 2026-08-12
  as an overall qualitative result.
- Automated browser E2E tooling: intentionally excluded by D-011.

## Risks

- Later compiler Structured Outputs may need a separate all-required draft
  schema and deterministic normalization into the playable contract; it must
  not weaken LessonManifest 0.1.0.
- Catalog capability checks do not replace Milestone 3 measurements of
  navigation, object overlap, renderer compatibility, or real asset budgets.
- Milestone 4 preserves partial screenshot metrics, but browser version,
  device/GPU identity, display details, warm/cold split, and audio-start latency
  remain unreported despite qualitative acceptance.
- Manual-only browser validation depends on disciplined user reports; the
  Milestone 5 overall PASS provides no retained screenshots, numeric runtime
  measurements, or per-case evidence for later comparison.
- The Milestone 6 approval did not include per-scenario evidence or measured
  responsiveness. Future persistence or runtime changes should re-run targeted
  manual checks rather than treating this approval as a numeric baseline.
