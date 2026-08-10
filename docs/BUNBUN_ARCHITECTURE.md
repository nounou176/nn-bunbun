# Bunbun Architecture

## Status

This document defines the approved architectural direction. It describes
logical boundaries, not a committed filesystem layout. No application has been
scaffolded yet.

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

Planned responsibilities:

- load and validate a playable LessonManifest;
- load only the referenced scene and asset bundles;
- render the Three.js diorama;
- handle camera, picking, simple navigation, and lightweight animation;
- run a deterministic lesson state machine;
- execute the fixed interaction primitives;
- present Japanese dialogue and task overlays in HTML/CSS;
- play cached audio;
- emit normalized learning evidence;
- track session-level metrics; and
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

The frontend and backend need one versioned definition for:

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
- Reloading must not duplicate evidence or lose a completed interaction.
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

- repository and package layout;
- Node.js runtime and package manager versions;
- contract validation library and schema-generation direction;
- HTTP framework and compilation job model;
- browser support and WebGPU selection policy;
- SQLite access and migration tools;
- progress ownership and offline behavior;
- initial reference datasets and licenses;
- OpenAI model, TTS model, voice policy, and cache invalidation inputs; and
- observability and privacy rules for learning analytics.

These are intentionally not chosen during the documentation-only milestone.
