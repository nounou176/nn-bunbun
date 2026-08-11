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

Status: In progress — implementation complete; manual acceptance pending

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
and local HTTP/process checks. The milestone remains in progress until the user
completes the handed-off manual acceptance checklist.

Exit criteria:

- The valid fixture passes all validators.
- Each invalid fixture fails for the intended reason.
- Frontend and backend consume the same contract version.
- No runtime interprets arbitrary code or unknown mechanics.

## Milestone 3 — Isometric runtime foundation

Status: Planned

Purpose:

Prove the lightweight reusable diorama runtime with deterministic authored
data.

Decisions required:

- O-008 browser/device matrix and renderer fallback policy;
- camera and navigation behavior;
- initial asset pipeline; and
- measurable prototype performance budgets.

Planned scope:

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

Status: Planned

Purpose:

Prove the north-star loop using the authored fixture and a minimal primitive
subset.

Planned scope:

- EXPLORE and INTERACTION state transitions;
- LISTEN, CLICK_OBJECT, and CHOOSE;
- Japanese-first DOM dialogue and audio replay controls;
- immediate correct, incorrect, and assisted feedback;
- bounded retry and basic scaffold escalation;
- deterministic step transitions;
- session timing and reaction events; and
- a short authored FIND_SOMETHING flow.

Exit criteria:

- A fresh session reaches its first Japanese stimulus promptly.
- Correct, wrong, helped, and repeated inputs behave deterministically.
- The lesson completes even after maximum help.
- Evidence writes once per result.
- The user manually reports happy-path, edge-case, and regression results.

## Milestone 5 — Complete MVP primitive runtime

Status: Planned

Purpose:

Implement the remaining fixed interaction vocabulary without expanding game
scope.

Planned scope:

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

Status: Planned

Purpose:

Persist trustworthy learning evidence and recover sessions at safe boundaries.

Decisions required:

- O-003 initial mastery aggregation;
- O-007 SQLite tooling and progress ownership; and
- O-011 privacy, retention, and analytics definitions.

Planned scope:

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

## Milestone 7 — Lesson compiler with Structured Outputs

Status: Planned

Purpose:

Compile learner targets into the already proven deterministic runtime.

Decisions required:

- O-006 HTTP and compilation job model;
- O-009 reference datasets and licenses;
- the initial OpenAI model and prompt-module versions from O-010; and
- input normalization and compiler retry policy.

Planned scope:

- vocabulary and grammar request normalization;
- deterministic reference lookup;
- scene and scenario compatibility selection;
- OpenAI Responses API integration;
- strict Structured Outputs;
- schema and semantic validation;
- bounded repair or retry behavior;
- revisioned manifest persistence;
- useful compiler errors; and
- reuse of conceptual modules only where required.

Exit criteria:

- Valid user targets produce a playable manifest using catalog identifiers.
- Invalid, impossible, unsafe, or uncovered output never reaches the runtime.
- Cached or already compiled lessons play without an LLM.
- Model unavailability has a clear recoverable state.

## Milestone 8 — Japanese TTS and audio cache

Status: Planned

Purpose:

Make audio a reliable cached lesson asset rather than a runtime dependency.

Decisions required:

- TTS model, voice profiles, cache storage, and invalidation inputs from O-010;
- pronunciation review process; and
- audio fallback behavior.

Planned scope:

- queued TTS generation outside gameplay;
- normalized, versioned cache keys;
- duration metadata;
- lesson audio readiness checks;
- preload for first stimuli;
- replay behavior; and
- missing or failed audio recovery.

Exit criteria:

- Identical generation inputs reuse audio.
- Changed relevant inputs invalidate the cache.
- Audio failure does not produce a blank or trapped interaction.
- Japanese text and audio match exactly where required by the manifest.

## Milestone 9 — First product vertical slice

Status: Planned

Purpose:

Validate the complete Bunbun promise in one polished micro-scenario.

Decisions required:

- O-001 learner level and support locale;
- O-002 scene, scenario, vocabulary, and grammar targets; and
- explicit qualitative and quantitative acceptance criteria.

Planned scope:

- one reusable stylized scene;
- one coherent scenario;
- selected vocabulary and grammar across repeated contexts;
- multiple reaction difficulty levels;
- all required audio;
- evidence and resume;
- interaction-density measurement;
- visual and input polish;
- manual browser/device validation; and
- documented learner observations.

Exit criteria:

- A real target set compiles and plays end to end.
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
