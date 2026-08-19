# Bunbun Architecture

## Status

This document defines the approved architectural direction. Milestones 1
through 6 are implemented and manually accepted: the workspace, contracts,
technical runtime, complete eight-primitive executor, and local evidence/
safe-resume boundary all exist locally. Compiler, cached audio, and production
asset implementation remain planned until their roadmap milestones. D-025
defines the production world-authoring and asset-intake boundary, and D-026
defines the first N5 audio-complete product vertical slice. D-027 separates
Milestone 7 into three provider strategies and makes the Custom GPT browser
bridge the active research direction; no compiler strategy is implemented.

## Architectural goals

Bunbun should be:

- data-driven rather than generated as bespoke game code;
- deterministic during normal gameplay;
- easy to validate at content boundaries;
- small enough to understand without a complex framework;
- fast to start and responsive on ordinary laptops and desktops;
- able to reuse scenes and assets across many lessons; and
- observable in terms of learning evidence and interaction density.

Avoid premature abstraction. Add a boundary only when it protects a current
requirement or makes an approved milestone independently testable.

## Repository foundation

The accepted physical layout is a native npm workspace:

- apps/web — Vite vanilla TypeScript browser client;
- apps/server — Node.js TypeScript backend;
- packages/contracts — shared compiler/runtime contract boundary; and
- root tooling — pinned Node/npm metadata and shared static/build commands.

Milestone 1 uses node:http only for a local GET /health endpoint. This does not
select the later compiler API framework. PORT is the only environment variable
approved for Milestone 1.

## System context

The primary flow is:

Learner targets
→ lesson compilation request
→ provider-specific untrusted authored contribution
→ deterministic validation and enrichment
→ versioned LessonManifest
→ local game runtime
→ learning evidence and progress persistence.

The LessonManifest is the contract between content generation and gameplay.
The renderer and interaction systems do not interpret prompts or arbitrary
source code.

## Logical components

### Web client and game runtime

Implemented foundation responsibilities:

- initialize Three.js WebGPURenderer with automatic WebGPU selection and a
  testable WebGL2 fallback;
- load the reviewed local park_small fixture through a code-owned asset
  registry;
- render a fixed orthographic isometric diorama with capped DPR and resize;
- preserve stable catalog-aligned world identities;
- raycast registered selectable objects and authored walkable ground;
- perform bounded deterministic direct movement;
- isolate canvas input from DOM controls;
- pause, resume, recover, diagnose, and dispose the technical runtime; and
- expose renderer, frame, scene, picking, and geometry measurements in a
  development DOM panel;
- validate the complete authored LessonManifest and CatalogSnapshot before
  activating the renderer, then reject capabilities outside the closed local
  executor allowlist;
- run a pure deterministic controller for all eight fixed primitives with
  bounded attempts, authored scaffolds, seeded ordering, task-scoped carry,
  explicit transitions, and required-step completion checks;
- present Japanese-first stimulus, help, feedback, choices, token arrangement,
  Japanese typing, completion, and focus transitions through DOM controls while
  keeping lesson truth outside Three.js;
- isolate audio behind AudioPlaybackPort and use browser SpeechSynthesis only
  as the temporary Milestone 4 learner-gesture adapter; and
- record privacy-minimized exposure, heard, reaction, step, and completion
  events against active time that excludes hidden-tab duration;
- commit evidence plus closed safe-boundary checkpoints through an ordered
  EvidenceStore port; and
- restore controller, carry/transfer world projection, active-time offset, and
  durable completion without replaying evidence.

Planned responsibilities beyond Milestone 6:

- load accepted lesson packages from the future compiler/cache boundary rather
  than a repository fixture;
- dynamically load only the referenced scene and asset bundles;
- replace the temporary audio adapter with reviewed cached Japanese speech;
- mix voice, scene ambience, deterministic cue-owned effects, and restrained
  music through learner-controlled audio buses;
- preload speech and sound assets required for the first interaction while
  preserving captions, replay, and a recoverable text fallback; and
- connect later compiled lesson revisions to the implemented storage boundary
  without weakening immutable package fingerprints.

The runtime must not call an LLM from the render loop. A lesson that has already
been compiled should remain playable when no further AI response is available.

### Backend application

Implemented local persistence responsibilities:

- own the built-in SQLite connection, migration ledger, WAL lifecycle, and
  graceful close;
- validate immutable lesson packages and canonical fingerprints before first
  persistence;
- atomically append evidence, advance checkpoints, and record idempotent commit
  receipts;
- expose narrow same-origin session, resume, preference, summary, inspector,
  and confirmed-reset APIs; and
- reject stale sequences, invalid authored references, raw TYPE text fields,
  incompatible schema versions, and changed immutable revisions.

Planned compiler and media responsibilities:

- accept and normalize learner vocabulary and grammar targets;
- produce one code-owned authoring envelope independent of provider strategy;
- obtain typed contributions through the explicitly selected M7 strategy;
- validate, reject, or repair structured drafts deterministically;
- resolve scene, entity, object, and interaction references against catalogs;
- enforce content, coverage, graph, and performance constraints;
- produce immutable or revisioned LessonManifests;
- coordinate Japanese TTS generation and cache lookup;
- store local/MVP lesson data, cache metadata, and progress in SQLite; and
- expose narrow APIs to the web client.

Model or browser strategy, prompt composition, transport, and retry policy
belong behind the lesson compiler boundary. The game client should not depend
on a particular model, provider, Custom GPT, or browser session.

### Shared contracts and catalogs

packages/contracts now provides TypeBox 1.x source schemas and inferred
TypeScript types for LessonManifest 0.1.0, CatalogSnapshot 0.1.0, and the
independent EvidencePersistence 0.1.0 boundary. Ajv runs
strict, non-coercing structural validation, while pure TypeScript validators
check references, world compatibility, graph termination, learning coverage,
evidence, language safety, interactions, scaffolds, provenance, and quality
budgets. Generated JSON Schema artifacts are checked against their source.

The frontend and backend consume the same contract package. Starting in
Milestone 4, the frontend intentionally bundles the strict package validator so
authored lesson content fails before scene activation; the earlier isolated
version export remains available for callers that only need compatibility
metadata. The shared boundary includes:

- LessonManifest;
- learning targets;
- fixed interaction primitives;
- evidence events;
- scene, entity, object, spawn-point, and asset catalog identifiers;
- manifest validation errors; and
- persistence payloads exchanged across the boundary.

Catalog entries are authored and reviewed application data. AI may select valid
catalog identifiers but may not invent executable behavior or unregistered
assets.

### Deterministic reference providers

Reference providers supply data such as:

- kanji readings, radicals, and components;
- vocabulary readings and normalized forms;
- accepted answer normalization;
- scene capabilities;
- object affordances; and
- asset metadata.

The source, license, version, and update process for each provider must be
documented before its data ships.

## Client runtime layers

The runtime should keep these responsibilities separate:

1. Rendering layer — scene, camera, lighting, materials, animation, and resize.
2. World layer — catalog entities, spawn points, navigation surfaces, and
   lightweight collision or reachability.
3. Input layer — pointer input, picking, UI focus, and movement requests.
4. Lesson state layer — manifest traversal, conditions, attempts, and
   transitions.
5. Interaction layer — fixed primitive executors with typed inputs and results.
6. Learning layer — evidence recording, scaffolding state, and target coverage.
7. Presentation layer — DOM dialogue, choices, typing, help, and progress.
8. Services layer — manifest loading, audio, persistence, telemetry, and time.

Three.js owns the world, characters, objects, animations, camera, picking, and
simple movement. HTML/CSS owns ordinary text and application UI. Japanese text
should not be rendered as a 3D mesh without a specific world-space need.

## Lesson compiler boundary

The compiler is a pipeline, not a runtime game programmer:

1. Normalize the learner's input.
2. Match targets to deterministic linguistic references where possible.
3. Select a compatible scene, scenario template, primitive sequence,
   difficulty progression, candidate truth, and authored content slots.
4. Ask AI to fill the structured story, practice, scaffold, and feedback text
   slots without changing the deterministic plan.
5. Validate the response against the strict schema.
6. Validate referential integrity, reachability, target coverage, and budgets.
7. Enrich accepted Japanese lines with cacheable audio references.
8. Persist a revisioned manifest.
9. Return the playable manifest to the client.

Schema-valid data can still be pedagogically or logically invalid. The
compiler therefore needs semantic validators in addition to JSON validation.

### Milestone 7 strategy boundary

D-027 keeps the compiler outcome stable while preserving three alternative
authoring transports:

- M7 v1 is the inactive proposed OpenAI Responses API and Structured Outputs
  path in D-022 and `plans/2026-08-12-structured-lesson-compiler.md`.
- M7 v2 is a research-only self-built/local LLM path with no selected model,
  runtime, hardware floor, training method, or license set.
- M7 v3 is the active Custom GPT browser-bridge research path in
  `plans/2026-08-19-m7-v3-custom-gpt-browser-bridge.md`; it uses neither
  `gpt-5.6-terra` nor `OPENAI_API_KEY`.

`docs/M7_VARIANTS.md` is the strategy registry. Every route must consume the
same deterministic compiler envelope and return untrusted typed contributions
that pass local normalization, LessonManifest validation, and runtime
capability checks. Provider-specific browser, API, token, or model state must
not leak into gameplay or the manifest.

## AI boundary

Approved AI uses:

- compile a lesson structure;
- generate contextual Japanese within controlled fields;
- generate optional explanations;
- later, evaluate explicitly approved open-ended answers;
- later, create mnemonic-image prompts or Anki learning content.

Disallowed AI uses:

- producing arbitrary Three.js or executable lesson code;
- controlling animation or rendering frame by frame;
- deciding physics results;
- bypassing manifest validation;
- inventing new interaction mechanics; or
- acting as an authoritative kanji decomposition database.

The conceptual modules Story Coach, Reverse Trainer, Visual Mnemonic, Tutor,
Anki content generator, and JLPT assessment generator are reusable behaviors.
They are not separate services or models unless future evidence justifies that
architecture.

Existing Custom GPT behavior may be ported into versioned reusable prompt
modules or, under the active M7 v3 research, evaluated through an explicit
user-mediated browser bridge. It must not be treated as hidden external project
memory, an undocumented API, or a runtime dependency.

`docs/AI_MODULES.md` is the source-capture and routing registry for these
behaviors. On 2026-08-12, the user supplied six local GPT configurations and
their Knowledge assets. They do not match the conceptual list one-to-one:
Tutor and JLPT assessment are absent, while Story Sheet and HTML Anki are
additional sources and two GPTs overlap on Anki generation. D-023 confirms that
this is the complete intended set and accepts the Milestone 7 mapping: Story
Sheet owns premise/story/setting content, Story Coach owns bounded hint,
scaffold, pedagogical-cadence, and feedback content, and Reverse Trainer owns
phrase analysis, reverse recall, and practice content. For the accepted D-023
route, one composed structured request uses the typed adaptations and versions
approved by D-024.
Deterministic code continues to own primitive order, difficulty progression,
IDs, transitions, attempt/timing limits, and hard budgets. The three selected
prompt modules are Approved for implementation but are not implemented or
runtime-active. A missing or unapproved behavior must not be replaced by an
undocumented generic prompt.

The D-024-approved adaptation pack at `docs/ai-modules/` makes this boundary
typed: the compiler envelope owns every runtime and reference decision; Story
Sheet, Reverse Trainer, and Story Coach own disjoint contribution fields in one
LessonContentDraft. Exact approved prompt fragments, content hashes, and fifteen
text-only evaluation fixtures are versioned together. Pack approval does not
activate a provider or approve an M7 implementation. Sequential direct use of
the three existing Custom GPTs would change D-023 and therefore requires a new
accepted decision after the M7 v3 feasibility gate.

The captured images and APKG are local style/output examples only. They are not
linguistic references, lesson-content sources, or evaluation fixtures, and the
Milestone 7 compiler must not upload them to the lesson provider. Text
evaluation fixtures are authored and reviewed separately. A later visual or
Anki workflow requires its own approval before using the files as style
examples.

## Data and persistence

SQLite is the approved local/MVP persistence technology. The initial data model
should remain small and migration-driven. Likely domains are:

- lesson requests and normalized targets;
- compiled manifest revisions;
- TTS and generated-media cache metadata;
- play sessions;
- target evidence; and
- learner preferences.

For the local milestone, the server is the only SQLite owner and the browser
uses an EvidenceStore HTTP port. Identity, remote ownership, offline browser
storage, and cross-device synchronization remain open. Do not add accounts or
cloud sync implicitly. See EVIDENCE_PERSISTENCE.md.

Generated audio and mnemonic images should use stable cache keys derived from
their relevant inputs and provider version. Store metadata and references in
SQLite; do not duplicate large binary data inside manifests.

Under D-026, spoken Japanese remains manifest-addressed through `AudioAsset`
and approved voice profiles. Scene ambience belongs to the code-owned scene
audio registry. World, feedback, and musical stings belong to registered
presentation cues. The runtime resolves all three through application-owned
asset metadata; a manifest cannot provide an audio URL, file path, mix value,
or arbitrary playback instruction. Character speech receives mix priority and
may temporarily duck ambience and music. Exact TTS provider, model, voice
profiles, cache storage, and licensed non-speech sources remain O-010 decisions.

## Runtime determinism and recovery

- A manifest revision is immutable while a session is running.
- Interaction outcomes are derived from manifest data and local input.
- Any randomized ordering uses a stored seed.
- Evidence events use stable lesson, revision, session, target, and interaction
  identifiers.
- Saving is explicit at meaningful interaction boundaries.
- Milestone 6 persists acknowledged boundaries atomically. Reload restores a
  validated checkpoint, clears unsubmitted TYPE text, normalizes interrupted
  movement/audio, and does not replay evidence.
- Unknown schema versions fail closed with a useful error.
- A broken manifest must return the learner to a safe UI state, not a partially
  loaded world.

## Renderer and asset strategy

- Use TypeScript, Vite, Three.js, and HTML/CSS DOM overlays.
- Prefer WebGPURenderer where it is appropriate and stable for the supported
  browser matrix, with a WebGL2 fallback.
- Use reusable glTF or GLB assets.
- Apply Meshopt, KTX2/Basis, and Draco only where measurements justify them.
- Prefer stylized low-poly assets, baked light, minimal realtime lights,
  restrained shadows, shared materials, and instancing.
- Load only assets required by the current lesson.
- Do not add a heavy physics engine for the MVP.

Detailed numeric budgets are in PERFORMANCE.md.

### Production world-authoring boundary

D-025 adopts a GLB-first pipeline described in `WORLD_AUTHORING.md`. Three.js
Editor is the initial assembly and inspection tool. The reviewed Kenney CC0
road, suburban, blocky-character, and cube-pet packs are the initial asset
sources. THREE.Terrain is an optional authoring-time terrain generator; its
output must cross the same reviewed GLB boundary and it is not a default
runtime dependency.

The initial production-world envelope is a bounded stylized Japanese
neighborhood with road, convenience-store, and park areas, two active NPCs,
and one active animal. Exact lesson scenario and language targets remain
deferred. A visually larger city grows from reusable lesson-sized chunks, not
one unbounded always-loaded world.

The application-owned asset registry and scene definition continue to own
asset URLs, transforms, camera settings, stable catalog mappings, spawn points,
walkable data, and runtime placements. Asset source, license, version or
download date, hashes, conversion provenance, and measured budgets must be
recorded before a production asset ships.

Navigation remains direct and authored while geometry permits it. An authored
navmesh with three-pathfinding is the preferred first candidate when a real
chunk requires routing around obstacles. Yuka and recast-navigation-js remain
conditional future candidates rather than approved dependencies.

### Milestone 3 runtime boundary

D-018 fixes the technical prototype to Three.js 0.185.1 on the user's current
stable desktop Chromium environment. WebGPURenderer starts in automatic mode,
retries once with its forced WebGL2 backend after initialization failure, and
supports `?renderer=webgl2` for explicit fallback validation. Broader browser,
mobile, and touch support is not claimed.

The runtime resolves the catalog-aligned `park_small` technical fixture through
an application-owned scene definition and local asset registry. That definition
owns asset URLs, transforms, camera settings, navigation bounds, and runtime
placements. LessonManifest may select reviewed catalog identifiers but cannot
supply asset paths, Three.js code, transforms, or executable mechanics.

The fixture uses one repository-owned glTF asset and runtime-created placeholder
characters and markers. Its one convex walkable region permits direct
click-to-move without pathfinding, collision, navmesh, or physics. This is an
explicitly narrow runtime proof and does not resolve the final product scene
decision O-002.

### Milestone 4 lesson boundary

D-019 adds one narrow executable lesson slice without changing the contract or
pulling later services forward. The browser loads the reviewed three-step
FIND_SOMETHING package, runs full structural and semantic validation, and then
applies a second capability allowlist for `park_small`, LISTEN, CLICK_OBJECT,
CHOOSE, reviewed cues, scaffolds, object IDs, and audio ID. Invalid content
fails into the existing recoverable DOM boundary before renderer activation.

The lesson controller is a pure reducer over explicit input events. It owns
attempts, help/assisted state, feedback locking, scaffold escalation,
transitions, deterministic choice order, and completion truth. Browser
orchestration owns timers, visibility-aware active time, audio callbacks, DOM
focus, world commands, and an idempotent in-memory event sink. The world bridge
atomically binds the active candidate IDs and selection handler, reports stable
IDs, and applies known presentation cues; it does not decide correctness or
advance lesson state.

The temporary SpeechSynthesis adapter starts only after a learner gesture and
records `heard` only after the browser reports playback start. Failure reveals
an assisted text route and never claims heard evidence. No browser storage,
backend evidence transport, learner identity, mastery, production TTS, AI, or
network dependency is introduced by this boundary.

### Milestone 5 complete primitive boundary

D-020 retains LessonManifest 0.1.0 and executes all eight fixed primitives in
one validated forward-only HELP_SOMEONE fixture. ARRANGE compares stable token
IDs, TYPE shares the contract normalizer and remains IME-safe, MOVE_TO resolves
only after authored location arrival, and PICK_UP/GIVE share one controller-
owned task carry slot. Object, location, and recipient inputs use isolated
atomic target modes; the Three.js world mirrors movement and carry presentation
but never decides answer correctness.

The boundary adds two technical park locations and a second technical NPC,
deterministic movement/carry recovery controls, and clean world restart. It
does not add inventory, pathfinding, physics, production content,
or a general world-state language. The user's manual browser `PASS` on
2026-08-12 closes this boundary qualitatively; no unreported runtime metric or
broader browser/device claim is inferred from that acceptance.

### Milestone 6 local persistence boundary

D-021 adds the independently versioned EvidencePersistence 0.1.0 contract and
one server-owned built-in SQLite source of truth. The browser fingerprints the
validated fixture package, resolves one compatible ACTIVE or COMPLETED session,
and commits privacy-minimized event batches with their resulting closed
checkpoint through an ordered HTTP adapter. Commit IDs and expected checkpoint
sequences make retries idempotent and stale tabs fail closed.

Safe restore rebuilds controller and authored world projection rather than
deserializing application objects. It clears TYPE drafts, normalizes interrupted
audio/movement, retains feedback pending action, active time, carry, and GIVE
transfers, and never replays evidence. The local data panel exposes resume
preference, conservative non-mastery summary, counts, and confirmed deletion.
See EVIDENCE_PERSISTENCE.md. The user's explicit 2026-08-12 approval closes
this boundary qualitatively; no numeric persistence or renderer measurements
are inferred.

## API principles

The local persistence endpoints are accepted and documented in
EVIDENCE_PERSISTENCE.md. The compiler endpoint/job shape remains unaccepted.
When compiler APIs are designed, they should:

- expose resources and jobs rather than prompt internals;
- use versioned request and response contracts;
- return structured validation errors;
- make compilation retries idempotent;
- avoid sending secret provider credentials to the client;
- support cached results;
- distinguish compilation status from playable-manifest status; and
- preserve enough provenance to diagnose a lesson without storing hidden
  reasoning.

## Security and privacy baseline

- Provider keys remain server-side.
- Secret values never enter repository documentation or shared memory.
- Environment variable names must be confirmed with the user before use.
- Learner-entered language content is untrusted input.
- Generated strings must not become HTML or executable code without safe
  handling.
- Catalog and file references must not permit arbitrary path or URL access.
- Local non-identifiable evidence is retained until confirmed reset under
  D-021. Requirements must be revisited before collecting identifiable or
  remotely transported learner data.

## Architecture decisions still required

Before implementation reaches the relevant boundary, decide:

- HTTP framework and compilation job model;
- the broader production browser/device support matrix beyond the accepted
  Milestone 3 desktop Chromium reference environment;
- initial reference datasets and licenses;
- text-model strategy when applicable, TTS model, voice policy, and cache
  invalidation inputs; and
- observability and privacy rules for any remote learning analytics.

The contract validation and schema-generation direction was resolved by D-017.
The remaining choices are intentionally deferred until their owning milestone.
Deployment topology, Docker, hosting, and domain architecture remain deferred
until the user has manually accepted a complete local release candidate.
