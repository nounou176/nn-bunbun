# Bunbun Roadmap

## Roadmap principles

- Deliver small vertical capabilities in dependency order.
- Prove the learning loop before expanding content breadth.
- Use deterministic fixtures before connecting AI generation.
- Keep rendering, learning evidence, and compiler contracts independently
  understandable.
- Do not start a complex milestone without an approved ExecPlan.
- Update this roadmap when evidence changes sequencing or scope.

Status values are Complete, In progress, Next, Planned, Deferred, and Not
planned.

## Milestone 0 — Durable documentation foundation

Status: Complete

Outcome:

Future Codex sessions can understand Bunbun without external conversation
history.

Deliverables:

- concise repository instructions;
- product vision and learning principles;
- approved architecture boundaries;
- fixed gameplay primitives;
- LessonManifest contract version 0.1.0;
- performance philosophy and budgets;
- durable decision log;
- current-state record;
- sequential roadmap; and
- ExecPlan standard and tracked plans directory.

Exit criteria:

- All required files exist and link to repository-local sources.
- The initial specification is represented without scaffolding an application.
- Accepted and deferred decisions are distinguishable.
- CURRENT_STATE.md reflects the repository accurately.

## Milestone 1 — Project foundation decisions and scaffold

Status: Complete

Purpose:

Create the smallest maintainable TypeScript workspace after discussing the
deferred implementation choices that materially affect it.

Decisions resolved for this milestone:

- D-016 adopts Node.js 24 LTS, npm 11, and native npm workspaces;
- one root development command starts the web and server processes; and
- frontend, backend, and shared contracts use separate workspace boundaries.

Planned scope:

- TypeScript and formatting/static-check configuration;
- Vite web entry with an empty application shell;
- Node.js TypeScript server with a health boundary;
- shared contract location;
- environment-variable name agreement before use;
- concise local development documentation; and
- a milestone ExecPlan with manual verification steps.

Exit criteria:

- Clean install, typecheck, development startup, and production build.
- Frontend and backend boundaries are visible but contain no premature systems.
- The user completes the documented manual smoke check.

Non-goals:

- 3D scene content;
- AI calls;
- TTS;
- full database schema; and
- lesson gameplay;
- Docker, hosting, release automation, and domain configuration.

## Milestone 2 — Machine-readable contracts and catalog fixtures

Status: Complete

Purpose:

Turn LessonManifest 0.1.0 into executable shared contracts without depending
on AI.

Decisions resolved:

- D-017 schema/type generation and structural/semantic validation approach;
- identifier and versioning utilities; and
- the minimum scene/catalog record shapes.

Delivered scope:

- strict JSON Schema and TypeScript types;
- structural and semantic validation layers;
- normalized validation errors;
- one valid authored manifest fixture;
- invalid fixtures for unknown fields, bad references, unreachable steps,
  target-coverage gaps, unbounded fallback, and incompatible evidence;
- minimal catalog fixtures for one scene, entities, objects, locations, cues,
  and audio; and
- a manifest inspection command or developer view.

Implementation note:

All exit criteria pass in static, unit, integration, fixture-inspection, build,
and local HTTP/process checks. The user manually accepted the inspector and
visible contract-version regression on 2026-08-11.

Exit criteria:

- The valid fixture passes all validators.
- Each invalid fixture fails for the intended reason.
- Frontend and backend consume the same contract version.
- No runtime interprets arbitrary code or unknown mechanics.

## Milestone 3 — Isometric runtime foundation

Status: Complete

Purpose:

Prove the lightweight reusable diorama runtime with deterministic authored
data.

Decision resolved:

- D-018 accepts the desktop Chromium reference environment, automatic WebGPU
  with WebGL2 fallback, fixed orthographic camera, direct convex-region
  movement, a local fixture-asset boundary, and provisional performance goals.

Implemented scope:

- Three.js scene lifecycle and resize;
- isometric or diorama camera;
- capability-based WebGPU/WebGL2 selection;
- one small reusable scene;
- point-and-click picking;
- short automatic movement on authored navigation data;
- stable catalog object identities;
- essential DOM shell and canvas/overlay focus separation;
- asset loading, error recovery, and disposal; and
- development performance diagnostics.

Implementation note:

Static checks, 22 focused tests, production builds, local asset parsing, and
HTTP regressions pass. The user reported `PASS` for the manual runtime,
fallback, recovery, and lifecycle matrix, then supplied a second explicit
`PASS` for the requested diagnostics/performance acceptance on 2026-08-11.
Exact values were not supplied, so closure records qualitative acceptance
without inventing numeric measurements.

Exit criteria:

- The user can manually enter, inspect, move, select, resize, background, and
  resume the scene.
- WebGL2 fallback is manually verified.
- Required objects remain reachable and correctly identified.
- Measurements are recorded against PERFORMANCE.md.

Non-goals:

- AI compiler;
- all interaction primitives;
- polished production art; and
- heavy physics.

## Milestone 4 — First deterministic learning loop

Status: Complete

Purpose:

Prove the north-star loop using the authored fixture and a minimal primitive
subset.

Implemented scope:

- EXPLORE and INTERACTION state transitions;
- LISTEN, CLICK_OBJECT, and CHOOSE;
- Japanese-first DOM dialogue and audio replay controls;
- immediate correct, incorrect, and assisted feedback;
- bounded retry and basic scaffold escalation;
- deterministic step transitions;
- session timing and reaction events; and
- a short authored FIND_SOMETHING flow.

Implementation note:

D-019 is accepted. The reviewed LISTEN → CLICK_OBJECT → CHOOSE fixture, strict
pre-render package/capability validation, pure deterministic controller,
bounded retry/scaffolds, visibility-aware timing, idempotent in-memory events,
temporary learner-gesture SpeechSynthesis adapter, Japanese-first DOM UI, and
candidate-filtered park bridge are implemented. The first manual attempt found
a dropped world-selection handoff and a cumulative draw-call diagnostic; both
are corrected with an atomic input gate and regression coverage. The user then
confirmed animal clicking works and identified a modal-looking EXPLORE layout;
the world-active state now uses a compact mission card and explicit click cue.
Static checks, schema drift, 38 focused tests, and the production build pass.
The user supplied an explicit `PASS` on 2026-08-12 after the corrected compact
EXPLORE presentation and full manual checklist. Milestone 4 is complete.

Exit criteria:

- A fresh session reaches its first Japanese stimulus promptly.
- Correct, wrong, helped, and repeated inputs behave deterministically.
- The lesson completes even after maximum help.
- Evidence writes once per result.
- The user manually reports happy-path, edge-case, and regression results.

## Milestone 5 — Complete MVP primitive runtime

Status: Complete

Purpose:

Implement the remaining fixed interaction vocabulary without expanding game
scope.

Implementation note:

Accepted D-020 and
plans/2026-08-12-complete-mvp-primitive-runtime.md define one authored
eight-step regression fixture, shared exact TYPE normalization, authored
MOVE_TO arrival, and one task-scoped carry/escort slot for PICK_UP and GIVE.
The user approved the proposal with `PASS` on 2026-08-12. The shared TYPE
normalizer, expanded technical catalog, authored eight-step fixture, all five
remaining controller executors, DOM ARRANGE/TYPE controls, authored MOVE_TO,
task-scoped PICK_UP/GIVE, state-scoped world input, failure controls,
diagnostics, and reset behavior are implemented. Schema drift, typecheck, lint,
formatting, 46 focused tests, manifest inspection, production build, and local
HTTP smoke checks pass. The user supplied an explicit `PASS` on 2026-08-12 for
the full manual browser/gameplay matrix. No numeric performance values were
reported, so closure is qualitative and does not create a broader device claim.

Implemented scope:

- ARRANGE;
- deterministic TYPE normalization;
- MOVE_TO;
- PICK_UP;
- GIVE;
- task-scoped carry state;
- focus, keyboard, pointer, and overlay interaction polish; and
- manual regression matrices for all eight primitives.

Exit criteria:

- Every primitive accepts a valid manifest variant and rejects invalid state.
- Wrong attempts remain recoverable.
- Duplicate tokens, normalization boundaries, unreachable movement, invalid
  carry state, and wrong recipients are manually exercised.
- No inventory-heavy, combat, physics-heavy, or freeform AI system appears.

## Milestone 6 — Evidence and SQLite persistence

Status: Complete

Purpose:

Persist trustworthy learning evidence and recover sessions at safe boundaries.

Decisions resolved:

- D-021 resolves O-003 with a conservative non-mastery target signal;
- D-021 resolves O-007 with server-owned built-in SQLite and versioned
  migrations/checkpoints; and
- D-021 resolves O-011 for the local milestone with minimized local-only data,
  no transport, retention until confirmed reset, and explicit deletion.

Implementation note:

Accepted D-021 and
`plans/2026-08-12-local-evidence-sqlite-persistence.md` recommend a separate
EvidencePersistence 0.1.0 contract, server-owned built-in `node:sqlite`, atomic
append-only events plus versioned checkpoints, explicit Resume/Start again,
privacy-minimized local-only data, confirmed reset, and a conservative
lesson-scoped signal with no mastery claim. The user approved this direction on
2026-08-12. Contracts, migrations, SQLite repositories, local API, checkpoint
restore, durable browser sessions, progress/privacy controls, focused tests,
and documentation are implemented. The user explicitly responded
`DUYỆT MILESTONE 6` on 2026-08-12 after receiving the complete manual browser
matrix. This closes the milestone qualitatively; no per-scenario notes or
numeric runtime measurements were supplied or inferred.

Implemented scope:

- migration-driven SQLite schema;
- manifest, session, evidence, and preference records;
- idempotent evidence writes;
- safe resume at interaction boundaries;
- assisted versus unaided evidence;
- target coverage and reaction-density diagnostics; and
- a conservative initial weak-target signal.

Exit criteria:

- Reload does not duplicate or lose completed evidence.
- Invalid or old persistence versions fail or migrate safely.
- Lesson completion does not require correct mastery.
- Learner-facing UI does not expose raw analytics unintentionally.

## Milestone 7 — Provider-independent lesson compiler

Status: Complete — implementation. D-036 closes the compiler, reviewed file
handoff, publication, and lesson-library implementation while explicitly
waiving new automated and manual verification. The end-to-end flow is
`UNVERIFIED_USER_WAIVED`; transport 0.2.0 remains `UNVERIFIED`, and no skipped
case is counted as a pass.

Purpose:

Compile learner targets into the already proven deterministic runtime.

Remaining decisions beyond the closed technical M7 profile:

- a model/provider choice only if a later strategy requires one; and
- production reference datasets and licenses beyond the D-034 technical
  three-record fixture.

Decision resolved:

- D-023 confirms the complete six-GPT source set and assigns Milestone 7
  lesson-authoring responsibilities while keeping primitive sequence and
  difficulty progression deterministic.
- D-024 approves Prompt Adaptation Pack 0.1.0, its shared contribution
  contract, three exact prompt fragments and hashes, fixed composition order,
  privacy/failure boundaries, and fifteen text-only fixtures.
- D-027 preserves three implementation strategies, freezes the old Responses
  proposal as inactive M7 v1, keeps local self-built LLM work as M7 v2
  research, and makes captured Custom GPT behavior reuse the M7 v3 direction.
- D-028 originally accepted a manual → WXT → MCP sequence and is superseded by
  D-031.
- D-029 stops the Story Sheet suite after two of five fixtures at the user's
  direction. Run 001 remains a semantic rejection, Run 002 is accepted, and the
  gate is provisionally viable only for orchestration planning.
- D-031 rejects proposed D-030, selects one repository-owned Skills-only
  personal ChatGPT/Codex plugin for v3.2, keeps one composed request, moves WXT
  to research-only fallback, and leaves MCP conditional for v3.3.
- D-032 implements the closed v3.2 request/result boundary, canonical identity
  checks, claim-level world traceability, one local Skills-only plugin, prompt
  drift gate, authored fixtures, local inspector, and user-operated runbook.
- D-033 records ten accepted runnable fixtures, one strict-JSON rejection, and
  four honest contract gaps; it classifies the route as conditionally viable
  and selects reviewed local JSON file import after the contract is versioned
  forward.
- D-034 approves authoring 0.2.0, preserves the three exact prompt modules at
  0.1.0, selects a durable SQLite human-handoff lifecycle with no model worker,
  resolves O-006 for v3.2, resolves O-009 only through a three-record project-
  authored technical fixture, and requires requalification before importer
  work.
- D-035 supersedes only that sequencing gate: requalification is
  `WAIVED_BY_USER`, deterministic compiler work proceeds with repository-owned
  fixtures, and the external 0.2.0 transport remains `UNVERIFIED`.
- D-036 closes implementation with tests and manual acceptance waived, keeps
  the verification risk explicit, and advances the roadmap to Milestone 8.

Strategy note:

`docs/M7_VARIANTS.md` is the strategy registry:

- M7 v1 preserves proposed D-022 and
  `plans/2026-08-12-structured-lesson-compiler.md` with
  `gpt-5.6-terra`, medium reasoning, Structured Outputs, and the proposed
  `OPENAI_API_KEY`. It is inactive and unapproved.
- M7 v2 preserves the self-built/local LLM research direction. No model,
  hardware floor, inference runtime, training method, or license set is
  selected.
- M7 v3 is the completed implementation path. Its completed ExecPlan is
  `plans/2026-08-20-complete-m7-file-import-compiler.md`. It uses no
  `gpt-5.6-terra` or
  `OPENAI_API_KEY`. V3.1 remains historical provisional evidence. V3.2 packages
  the three approved prompt modules into one Skill; v3.3 considers MCP only
  after a separate endpoint, network, authentication, privacy, confirmation,
  and cost decision.

The repository-owned plugin and application compiler are implemented without a
new dependency, environment variable, app connection, browser automation,
extension, GPT edit, tunnel, automatic learner-data transmission, provider
call, or runtime AI.
The user installed `bunbun-authoring@0.1.0` on 2026-08-20 and the fixed
product-surface result passed the local exchange inspector. The user confirmed
that the only file action was deliberately attaching the required input; the
plugin started no unexpected media or tool. The fixed manual proof is closed.
Milestone 4 then mapped all fifteen D-024 fixtures: eleven were runnable, ten
were accepted, one was rejected for a trailing JSON character, and four exposed
missing code-owned inputs. The exact evidence is retained and no gap is counted
as a pass.

The fixed Story Sheet packets, raw responses, runbooks, and evaluations live
under `docs/ai-modules/feasibility/`. The latest user correction records no
image/file/tool activation in Runs 001 and 002. Run 001 fails strict world-fact
discipline; Run 002 passes every structural, semantic, and media check. Run 003
is a validated but canceled packet, and Runs 004–005 were not run. D-029 permits
orchestration planning from this incomplete evidence but does not fabricate a
full qualification. D-031 avoids a new hosted bridge GPT and keeps the
one-composed-request shape inside the selected Skill.

`docs/AI_MODULES.md` inventories the original concepts and six user-supplied
local GPT configurations. The supplied set contains Story Coach, Reverse
Trainer, Story Sheet, Visual Mnemonic, HTML Anki, and JLPT N3 Anki Deck
Generator; D-023 confirms this is the complete intended set, with no distinct
Tutor or JLPT assessment GPT. The accepted M7 composition uses Story Sheet for
premise/story/setting, Story Coach for bounded hints/scaffolds/pedagogical
cadence/feedback, and Reverse Trainer for phrase analysis/reverse recall/
practice content. Code deterministically owns primitive order, difficulty, IDs,
transitions, and hard budgets. D-024 closes the typed-adaptation, versioning,
text-only-evaluation, and user-approval phase 0 gate: all three 0.1.0 modules
are Approved for implementation but are not runtime-active. Supplied images
and the APKG are style/output examples only, not content, reference data, or
evaluation fixtures. Visual Mnemonic and both Anki workflows remain deferred.

The approved `docs/ai-modules/` pack provides the shared typed
contribution contract, exact 0.1.0 prompt fragments and hashes, disjoint module
ownership, deterministic failure/privacy rules, fixed composition order, and
fifteen text-only evaluation fixtures. Milestone 7 phase 0 is complete. D-032
packages the three modules in the selected local proof. D-036 adds the
deterministic application compiler and explicit local lesson publication, but
no application provider or runtime AI. D-031 composes the three modules in one
Skill and does not authorize sequential direct use of the hosted GPTs.

Implemented scope:

- vocabulary and grammar request normalization;
- deterministic reference lookup;
- scene and scenario compatibility selection;
- a provider-independent authoring envelope and typed contribution contract;
- the explicitly approved API, local-model, or browser-mediated transport;
- schema and semantic validation;
- bounded repair or retry behavior;
- revisioned manifest persistence;
- useful compiler errors; and
- source capture and composed use of only approved, versioned prompt modules.

Implementation note:

The closed Bunbun Core technical profile accepts only `犬`, `猫`, and
`〜てください`. SQLite migration 2 persists the synchronous human handoff;
server APIs expose request/import/review/publication/library resources; and the
web revalidates published packages through the shared park capability gate.
Typecheck, lint, plugin validation, formatting, and production build pass. Per
D-036, no new tests or manual browser/gameplay acceptance were run, so the exit
criteria below describe implemented behavior rather than verified evidence.

Exit criteria:

- Valid user targets produce a playable manifest using catalog identifiers.
- Invalid, impossible, unsafe, or uncovered output never reaches the runtime.
- Cached or already compiled lessons play without an LLM.
- Unavailable model, browser handoff, or authoring transport has a clear
  recoverable state.
- Every AI-assisted package records the participating prompt-module IDs and
  versions.

## Milestone 8 — Japanese voice and complete audio runtime

Status: Next

Purpose:

Make speech, ambience, effects, and restrained music reliable authored assets
rather than provider or browser-speech dependencies during gameplay.

Decision resolved:

- D-026 requires the first vertical slice to be audio-complete, keeps spoken
  Japanese in LessonManifest `AudioAsset`, and assigns ambience and non-speech
  effects to application-owned scene and cue registries.
- D-037 excludes Amazon Polly, AWS SDK/configuration, AWS credentials, and AWS
  billing from Milestone 8; D-038 further constrains O-010 to a
  zero-incremental-cost local/offline TTS route.
- D-038 requires a reviewed plan before any new third-party selection and fixes
  the first M8 TTS route to zero incremental usage and recurring cost. Free
  tiers and credits are not accepted as the financial foundation; OpenAI API
  and Amazon Polly are excluded.
- D-039 accepts the candidate order: qualify the dedicated VOICEVOX Nemo
  0.24.0 Linux CPU x64 engine first, keep it outside product/runtime code, and
  consider AivisSpeech only after an explicit rejection and separate plan.
  The user explicitly approved
  `plans/2026-08-25-qualify-voicevox-nemo.md` under D-038; its isolated pinned
  intake, loopback/offline technical checks, and 36-anchor matrix pass. Manual
  pronunciation and Aoi/Tanaka voice selection remain active; this is not
  production integration.

Decisions required:

- qualification of the proposed VOICEVOX Nemo route, exact voice profiles,
  cache storage, and invalidation inputs from O-010, after explicit focused
  plan approval;
- pronunciation review process; and
- exact non-speech source assets, licenses, mix targets, and fallback behavior.

Planned scope:

- queued TTS generation outside gameplay;
- normalized, versioned cache keys;
- stable character-to-voice-profile assignment;
- duration metadata;
- lesson audio readiness checks;
- preload for first stimuli;
- a learner-unlocked mixer with master, voice, ambience, effects, and music
  controls;
- voice-priority ducking;
- scene-owned ambience and cue-owned deterministic effects or musical stings;
- replay behavior; and
- captions and missing, disabled, interrupted, or failed audio recovery.

Exit criteria:

- Identical generation inputs reuse audio.
- Changed relevant inputs invalidate the cache.
- Audio failure does not produce a blank or trapped interaction.
- Japanese text and audio match exactly where required by the manifest.
- Named NPC voices remain consistent throughout a lesson.
- Ambience, effects, and music do not mask speech or stall the render loop.
- Background, resume, replay, mute, and disposal preserve deterministic state
  and do not duplicate heard evidence.

## Milestone 9 — First product vertical slice

Status: Planned

Purpose:

Validate the complete Bunbun promise in one polished micro-scenario.

Decision resolved:

- D-025 selects the GLB-first Three.js world-authoring pipeline, initial Kenney
  CC0 asset candidates, optional authoring-time THREE.Terrain, and a bounded
  Japanese-neighborhood production envelope.
- D-026 selects an N5 lesson with Vietnamese support, the rainy-evening `Three
Minutes to the Last Train` scenario, its requested and supporting target set,
  Aoi, Tanaka, Momo, narrative-only time pressure, and audio-complete acceptance
  boundary.

Decisions required:

- exact production asset choices and intake records;
- exact dialogue and reference review; and
- explicit qualitative and quantitative acceptance thresholds.

Planned scope:

- source/license/hash and conversion provenance for every selected asset;
- one reusable stylized Japanese-neighborhood chunk with road,
  convenience-store, and park areas, two NPCs, and one animal;
- the D-026 rainy-evening last-train scenario;
- requested `財布`, `探す`, and `～てください` targets plus reviewed supporting
  N5 content across repeated contexts;
- multiple reaction difficulty levels;
- all required character speech, ambience, meaningful effects, and restrained
  music or stings;
- evidence and resume;
- interaction-density measurement;
- visual and input polish;
- manual browser/device validation; and
- documented learner observations.

Exit criteria:

- A real target set compiles and plays end to end.
- Every shipped world asset has reviewed provenance and license records.
- Every requested target has verified exposure.
- The scenario remains completable with support.
- Measured reaction cadence, load, and rendering results are reported.
- Findings update vision, manifest, gameplay, performance, and decisions as
  needed.

## Milestone 10 — Adaptive exposure and learning support

Status: Planned

Purpose:

Use accumulated evidence to improve future exposure without creating drill
loops.

Planned scope:

- conservative mastery aggregation;
- weak-target prioritization;
- context-spacing rules;
- optional grammar and kanji help;
- deterministic kanji reference integration; and
- learner-visible control over support.

Exit criteria:

- Weak targets receive useful later exposure in changed contexts.
- Assisted success is not misreported as independent mastery.
- Scheduling remains inspectable and deterministic for the same inputs.
- Reference-backed kanji data is distinguishable from generated mnemonics.

## Local release-candidate acceptance gate

Status: Planned

Purpose:

Establish that the approved release scope works as a complete game locally
before any deployment architecture is selected.

Exit criteria:

- The approved local release scope is implemented end to end.
- A clean install and production build succeed locally.
- The full game starts and runs through documented local commands.
- The user completes the manual happy-path, edge-case, regression, persistence,
  and representative performance checklist.
- Known limitations are documented and explicitly accepted or scheduled.
- The user explicitly approves the local build as the release candidate.

This gate is not satisfied merely because one technical milestone builds.

## Milestone 11 — Release discovery and domain deployment

Status: Deferred

Activation condition: the user has explicitly accepted the local release
candidate.

Purpose:

Publish the accepted local release candidate to a production domain using the
smallest deployment architecture justified by the finished application.

Decisions required:

- O-012 deployment model and whether Docker is useful;
- hosting provider and region;
- domain and DNS ownership;
- production persistence and backup behavior;
- secret and environment-variable names;
- TLS, observability, release, and rollback process; and
- production cost and performance budgets.

No work in this milestone begins before the local release-candidate acceptance
gate.

## Later opportunities

Status: Deferred

- selective open-ended answer evaluation;
- SPEAK and pronunciation;
- mnemonic image generation and reuse;
- deterministic Anki package export;
- JLPT assessment flows;
- additional scene and scenario catalogs;
- accounts or cross-device synchronization; and
- authoring or teacher tools.

None of these should be pulled into an earlier milestone without a recorded
product decision and roadmap update.

## Explicitly not planned for MVP

- multiplayer, WebXR, or large open worlds;
- runtime-generated game source or 3D models;
- heavy physics, combat, HP, stamina, or skill trees;
- a complex agent or microservice framework;
- a general inventory RPG;
- realtime LLM calls for every interaction; and
- automated browser E2E testing.
