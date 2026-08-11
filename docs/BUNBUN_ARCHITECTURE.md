# Bunbun Architecture

## Status

This document defines the approved architectural direction. The Milestone 1
filesystem foundation, Milestone 2 executable contract boundary, and
Milestone 3 technical runtime boundary are implemented. The Milestone 4
three-step lesson executor is implemented and awaiting manual browser
acceptance. The complete primitive set, compiler, persistence, and production
asset boundaries remain planned until their roadmap milestones.

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
→ AI-assisted structured draft
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
- run a pure deterministic LISTEN, CLICK_OBJECT, and CHOOSE controller with
  bounded attempts, authored scaffolds, seeded choice order, transitions, and
  required-step completion checks;
- present Japanese-first stimulus, help, feedback, choices, completion, and
  focus transitions through DOM controls while keeping lesson truth outside
  Three.js;
- isolate audio behind AudioPlaybackPort and use browser SpeechSynthesis only
  as the temporary Milestone 4 learner-gesture adapter; and
- record idempotent session-local exposure, heard, reaction, step, and
  completion events against active time that excludes hidden-tab duration.

Planned responsibilities beyond Milestone 4:

- load accepted lesson packages from the future compiler/cache boundary rather
  than a repository fixture;
- dynamically load only the referenced scene and asset bundles;
- execute ARRANGE, TYPE, MOVE_TO, PICK_UP, and GIVE;
- replace the temporary audio adapter with reviewed cached audio;
- promote the provisional in-memory event record into the accepted persistent
  evidence contract; and
- send or persist progress through an explicit storage boundary.

The runtime must not call an LLM from the render loop. A lesson that has already
been compiled should remain playable when no further AI response is available.

### Backend application

Planned responsibilities:

- accept and normalize learner vocabulary and grammar targets;
- invoke reusable AI prompt modules through the OpenAI Responses API;
- request data that conforms to a strict Structured Outputs schema;
- validate, reject, or repair structured drafts deterministically;
- resolve scene, entity, object, and interaction references against catalogs;
- enforce content, coverage, graph, and performance constraints;
- produce immutable or revisioned LessonManifests;
- coordinate Japanese TTS generation and cache lookup;
- store local/MVP lesson data, cache metadata, and progress in SQLite; and
- expose narrow APIs to the web client.

Model selection, prompt composition, and retry policy belong behind the lesson
compiler boundary. The game client should not depend on a particular model.

### Shared contracts and catalogs

packages/contracts now provides TypeBox 1.x source schemas and inferred
TypeScript types for LessonManifest 0.1.0 and CatalogSnapshot 0.1.0. Ajv runs
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
3. Select a compatible scene and scenario template from catalogs.
4. Ask AI for a structured interaction sequence using only allowed identifiers
   and primitive types.
5. Validate the response against the strict schema.
6. Validate referential integrity, reachability, target coverage, and budgets.
7. Enrich accepted Japanese lines with cacheable audio references.
8. Persist a revisioned manifest.
9. Return the playable manifest to the client.

Schema-valid data can still be pedagogically or logically invalid. The
compiler therefore needs semantic validators in addition to JSON validation.

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

Existing Custom GPT behavior may later be ported into versioned reusable prompt
modules behind the compiler boundary. It must not be treated as hidden external
project memory or copied into separate services by default.

## Data and persistence

SQLite is the approved local/MVP persistence technology. The initial data model
should remain small and migration-driven. Likely domains are:

- lesson requests and normalized targets;
- compiled manifest revisions;
- TTS and generated-media cache metadata;
- play sessions;
- target evidence; and
- learner preferences.

The exact client/server ownership of offline progress, user identity, and
cross-device synchronization remains open. Do not add accounts or cloud sync
implicitly.

Generated audio and mnemonic images should use stable cache keys derived from
their relevant inputs and provider version. Store metadata and references in
SQLite; do not duplicate large binary data inside manifests.

## Runtime determinism and recovery

- A manifest revision is immutable while a session is running.
- Interaction outcomes are derived from manifest data and local input.
- Any randomized ordering uses a stored seed.
- Evidence events use stable lesson, revision, session, target, and interaction
  identifiers.
- Saving is explicit at meaningful interaction boundaries.
- Milestone 4 events are intentionally memory-only and reload starts a clean
  session. Milestone 6 must make reloading idempotent without losing a completed
  persistent interaction.
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

## API principles

No endpoint shape is accepted yet. When APIs are designed, they should:

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
- Data retention and privacy requirements must be decided before collecting
  identifiable learner data.

## Architecture decisions still required

Before implementation reaches the relevant boundary, decide:

- HTTP framework and compilation job model;
- the broader production browser/device support matrix beyond the accepted
  Milestone 3 desktop Chromium reference environment;
- SQLite access and migration tools;
- progress ownership and offline behavior;
- initial reference datasets and licenses;
- OpenAI model, TTS model, voice policy, and cache invalidation inputs; and
- observability and privacy rules for learning analytics.

The contract validation and schema-generation direction was resolved by D-017.
The remaining choices are intentionally deferred until their owning milestone.
Deployment topology, Docker, hosting, and domain architecture remain deferred
until the user has manually accepted a complete local release candidate.
