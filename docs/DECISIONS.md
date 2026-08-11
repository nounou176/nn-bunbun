# Bunbun Decision Log

## Purpose

This file records durable product, architecture, UX, and workflow decisions.
Repository documentation, not conversation history, is the long-term source of
truth.

Accepted decisions remain in this log even when superseded. A replacement must
name the earlier decision and explain the migration or consequence.

## Status vocabulary

- Proposed — under discussion and not authorized for implementation.
- Accepted — current direction.
- Superseded — replaced by a later decision.
- Rejected — considered and intentionally not selected.
- Deferred — real decision postponed until evidence or a milestone requires it.

## Decision template

### D-XXX — Short title

- Date: YYYY-MM-DD
- Status: Proposed
- Affects: documents or systems

Context:

Describe the problem, constraints, and meaningful alternatives.

Decision:

State the chosen direction precisely.

Consequences:

Describe benefits, costs, follow-up work, and constraints.

## Accepted decisions

### D-001 — Optimize for meaningful Japanese reactions

- Date: 2026-08-10
- Status: Accepted
- Affects: Product, gameplay, analytics, UX

Context:

Bunbun could optimize for game breadth, lesson duration, content volume, or
language practice density.

Decision:

The north-star metric is meaningful Japanese reactions per minute. When
appropriate, the experience aims for one meaningful reaction every 5–12
seconds. Story, movement, presentation, and feedback must protect this loop.

Consequences:

Game complexity is subordinate to learning density. Timing must eventually be
measured as part of lesson quality. The operational definition in
BUNBUN_VISION.md is version 0 and still needs play validation.

### D-002 — AI is a lesson compiler

- Date: 2026-08-10
- Status: Accepted
- Affects: Architecture, AI, runtime, security

Context:

Generating arbitrary game source for each lesson would create unpredictable
behavior, poor validation, slow startup, and unsafe runtime coupling.

Decision:

AI compiles learner targets into a versioned, strictly validated
LessonManifest. It does not generate per-lesson Three.js code. Normal gameplay
runs locally after compilation, with no LLM in the render or interaction loop.

Consequences:

The manifest and catalogs become key product contracts. Compiler validation is
both structural and semantic. Selective runtime AI may be added later only for
approved use cases such as open-ended evaluation or requested explanations.

### D-003 — Use reusable 3D micro-scenarios

- Date: 2026-08-10
- Status: Accepted
- Affects: Game design, assets, content generation

Context:

A unique world per lesson is expensive, slow, inconsistent, and unnecessary
for dense language practice.

Decision:

Bunbun uses small reusable stylized 3D scenes, entities, objects, locations,
and scenario templates. The camera is isometric, bird's-eye, or diorama-style.
Point-and-click is the primary MVP control.

Consequences:

Content generation selects catalog IDs and composes interactions. The MVP is
not an open world, procedural world generator, or physics-heavy game. WASD is
not required.

### D-004 — Keep the initial primitive vocabulary closed

- Date: 2026-08-10
- Status: Accepted
- Affects: Gameplay, manifest, runtime

Context:

Allowing AI to invent mechanics would make manifests impossible to validate
and the runtime impossible to keep small.

Decision:

The MVP supports LISTEN, CLICK_OBJECT, CHOOSE, ARRANGE, TYPE, MOVE_TO, PICK_UP,
and GIVE. Lessons compose these primitives. SPEAK and any other primitive
require a later accepted decision.

Consequences:

The schema uses a closed discriminated union. New stories and scenario
templates are welcome only when expressible with the existing runtime
capabilities.

### D-005 — Separate the Three.js world from DOM learning UI

- Date: 2026-08-10
- Status: Accepted
- Affects: Frontend, UX, accessibility

Context:

Three-dimensional UI and text would increase rendering cost and reduce normal
web input and text capabilities.

Decision:

Three.js handles world rendering, camera, characters, objects, animation,
picking, and simple movement. HTML/CSS DOM overlays handle Japanese dialogue,
audio replay, choices, arrangement, typing, help, language information, and
lightweight progress.

Consequences:

The world stays visually dominant. Overlay focus must be isolated from world
input and overlays should disappear promptly after use. React is not required
for the MVP.

### D-006 — Adopt a TypeScript web and Node.js stack

- Date: 2026-08-10
- Status: Accepted
- Affects: Architecture, tooling

Context:

The product needs a browser 3D runtime, shared typed contracts, and a small
backend for compilation and caching.

Decision:

The approved direction is TypeScript, Vite, Three.js, HTML/CSS overlays, and a
Node.js TypeScript backend. Rendering should use WebGPURenderer where
appropriate with WebGL2 fallback. Local/MVP persistence uses SQLite.

Consequences:

Exact package layout, versions, validation library, backend framework, and
SQLite tooling remain deferred. No application is scaffolded by this decision
alone.

### D-007 — Use reusable optimized asset formats

- Date: 2026-08-10
- Status: Accepted
- Affects: Assets, rendering, performance

Context:

Small scenes still require predictable download, decode, GPU, and draw-call
costs.

Decision:

Use reusable glTF or GLB assets, stylized low-poly art, baked lighting where
possible, minimal realtime light and shadow, shared materials, instancing for
repetition, capped or adaptive device pixel ratio, and lesson-scoped loading.
Use Meshopt, Draco, and KTX2/Basis only when measurements justify them.

Consequences:

Performance is part of content validation. Normal scenes prefer fewer than
approximately 100 draw calls, 1–5 active NPCs, 5–30 interactive objects, and
textures at or below 1024 px unless justified.

### D-008 — Cache generated media

- Date: 2026-08-10
- Status: Accepted
- Affects: Backend, TTS, generated images, cost

Context:

Repeated generation adds latency and cost without improving a stable lesson.

Decision:

OpenAI text-to-speech is generated ahead of or outside normal gameplay, cached
with stable versioned inputs, and reused. Mnemonic images are generated only
when needed and are also cached. Realtime voice is not an MVP requirement.

Consequences:

The backend needs cache metadata and asset resolution. Cache keys must include
inputs that can change output. Provider and storage details remain deferred.

### D-009 — Generate Anki packages deterministically

- Date: 2026-08-10
- Status: Accepted
- Affects: Later integrations

Context:

AI can draft useful learning content but should not be trusted to emit a valid
binary package.

Decision:

An LLM may later generate Anki learning content. Deterministic local code must
generate the actual .apkg file.

Consequences:

Anki remains outside the initial gameplay runtime and roadmap sequencing until
explicitly prioritized.

### D-010 — Repository documentation is durable memory

- Date: 2026-08-10
- Status: Accepted
- Affects: All work

Context:

Future Codex sessions must work without external ChatGPT history.

Decision:

AGENTS.md and docs/ are the durable project memory. Significant work starts by
reading the repository documentation. Durable decisions update this log and
the relevant specification. Meaningful milestones update CURRENT_STATE.md and
ROADMAP.md. Complex features use a live ExecPlan under plans/.

Consequences:

Documentation maintenance is part of completion, not optional cleanup.
Conversation alone does not change the accepted project state.

### D-011 — Use manual browser and gameplay testing only

- Date: 2026-08-10
- Status: Accepted
- Affects: Workflow, verification

Context:

The user will personally validate browser and gameplay behavior and does not
want an automated browser E2E suite.

Decision:

Do not create or run automated browser E2E tooling unless the user explicitly
reverses this decision. Provide clear manual happy-path, edge-case, and
regression steps for implemented behavior.

Consequences:

Manual outcomes must be reported honestly and cannot be inferred by Codex.
Static checks, focused unit or integration tests, production builds, and Docker
builds may still be used when they exist and are relevant.

### D-012 — Isolate prior Bunbun or Dreamworld work

- Date: 2026-08-10
- Status: Accepted
- Affects: Continuity, architecture

Context:

Shared memory contains records for an older bunbun/game2 Dreamworld project
with first-person controls and an existing implementation. This repository is
new and its specification chooses a different isometric, point-and-click
direction.

Decision:

The older implementation is not a baseline or dependency of this repository.
Do not copy its code, content, or architecture unless the user explicitly
requests a reviewed import.

Consequences:

This repository stays self-sufficient and avoids accidental architectural
conflicts. Useful ideas from older work require a new explicit decision.

### D-013 — Use LessonManifest contract 0.1.0 as the implementation baseline

- Date: 2026-08-10
- Status: Accepted
- Affects: Compiler, shared contracts, runtime, catalogs

Context:

The first implementation needs an explicit data boundary, while no
machine-readable schema or runtime exists yet.

Decision:

Use the strict closed contract documented in LESSON_MANIFEST.md version 0.1.0
as the design baseline. It supports one scene, one initial scenario template,
versioned catalog references, eight fixed primitive variants, bounded
scaffolding, explicit transitions, learning evidence bindings, completion
independent of mastery, quality targets, and provenance.

Consequences:

Milestone 2 must implement and test the contract as JSON Schema, shared
TypeScript types, and semantic validators. If implementation reveals a
necessary change, discuss material semantics, update the documentation and
decision log, and version the contract rather than silently drifting.

### D-014 — Use nn-bunbun as the canonical repository

- Date: 2026-08-10
- Status: Accepted
- Affects: Repository continuity, local development

Context:

The documentation foundation was initially created in the temporary
bunbungame directory. The user created a dedicated Git repository for the
project.

Decision:

The canonical local repository is
/home/nunu/Desktop/nnlab/nn-bunbun. Its main branch tracks the origin remote at
https://github.com/nounou176/nn-bunbun.git. Future project work must happen in
this repository.

Consequences:

The project documents move without importing the invalid Git placeholder from
the old directory. Shared memory and future handoffs must use the canonical
repository path.

### D-015 — Complete and accept the game locally before release work

- Date: 2026-08-10
- Status: Accepted
- Affects: Roadmap, development workflow, deployment

Context:

The project can either prepare containers and hosting during early foundation
work or focus first on proving and completing the game locally. Early release
infrastructure would add configuration before the runtime and product shape are
known.

Decision:

Build the game for local execution first. The user will manually test and
accept a complete local release candidate before the project designs or
implements Docker, hosting, release automation, or domain configuration. The
user's explicit local acceptance is the gate that starts release planning.

Consequences:

Milestone 1 contains no Docker or deployment work. Local development commands,
production builds, and manual test checklists remain required. O-012 stays
deferred until the local acceptance gate, when the actual hosting and domain
requirements are known. "Complete" means the locally approved release scope,
not every possible item in Later opportunities.

### D-016 — Adopt the local TypeScript workspace foundation

- Date: 2026-08-10
- Status: Accepted
- Affects: Repository layout, local tooling, frontend, backend

Context:

Milestone 1 needs the smallest local structure that keeps the browser client,
Node.js backend, and shared contracts distinct without introducing a complex
monorepo framework or premature application systems.

Decision:

Use Node.js 24 LTS, pinned by .nvmrc and package engines, with the bundled npm
major pinned in package metadata. Use native npm workspaces with one root
package-lock.json. Place the Vite vanilla TypeScript client in apps/web, the
Node.js TypeScript server in apps/server, and the future shared data contracts
in packages/contracts. The server uses node:http for the Milestone 1 GET
/health boundary rather than selecting a backend framework early. PORT is the
only approved environment variable name in this milestone. Provide root
commands for concurrent local development, typecheck, lint, format checking,
and production builds.

Consequences:

React, Three.js scene code, the machine-readable LessonManifest, SQLite, AI,
TTS, Docker, deployment, and browser automation remain outside Milestone 1.
The backend framework decision O-006 stays deferred because node:http is only a
small foundation boundary. The workspace layout resolves O-004.

### D-017 — Use schema-first shared contracts with deterministic validation

- Date: 2026-08-10
- Status: Accepted
- Affects: Shared contracts, manifest validation, catalogs, compiler, runtime

Context:

Milestone 2 must turn the documented LessonManifest 0.1.0 contract into one
machine-readable definition consumed by TypeScript, the browser runtime, the
server, developer tools, and later compiler boundaries. Hand-maintaining
independent JSON Schema and TypeScript declarations would allow silent drift.
Ajv's own TypeScript schema helper has limited union guarantees, while this
contract relies heavily on closed discriminated unions.

Decision:

Use TypeBox 1.x in the ESM TypeScript 6 workspace as the schema-first source
for JSON Schema and inferred TypeScript types. Export deterministic JSON Schema
artifacts and fail a check when they drift from the source schemas. Use Ajv in
strict, non-coercing, all-errors mode for structural validation and normalize
its diagnostics into Bunbun validation errors. Implement reference, graph,
coverage, evidence, catalog compatibility, and other semantic rules as pure
TypeScript validators. Keep catalogs as a separate versioned CatalogSnapshot
contract supplied alongside a manifest. Use focused Node test-runner tests
through the existing tsx toolchain; browser automation remains excluded.

The playable LessonManifest schema preserves contract 0.1.0 optional-field
semantics: optional properties are omitted and null is rejected. A later AI
compiler may require a separate Structured Outputs draft schema and a
deterministic normalization step; it must not weaken or silently change the
playable manifest contract.

Consequences:

Schema, static types, and serialized artifacts share one source. Both client
and server can use the same structural result and normalized error vocabulary.
Semantic validation remains explicit and independently testable rather than
being hidden in custom schema keywords. TypeBox, Ajv, and format validation are
new runtime dependencies of packages/contracts and must be pinned by the root
lockfile. O-005 is resolved. Compiler-draft compatibility remains work for the
AI compiler milestone.

### D-018 — Build a desktop-first deterministic isometric runtime fixture

- Date: 2026-08-11
- Status: Accepted
- Affects: Web runtime, rendering, browser support, camera, navigation, assets,
  performance

Context:

Milestone 3 must prove the reusable diorama runtime before lesson execution.
CatalogSnapshot 0.1.0 describes identities and capabilities but intentionally
contains no Three.js paths, transforms, camera rig, or navigation geometry.
WebGPU is not universally available, and the prototype needs a manually
testable fallback rather than a broad unverified browser claim.

Decision:

For Milestone 3, target the user's current stable desktop Chromium environment
with pointer and keyboard; do not claim Firefox, Safari, mobile, or touch
support until manually tested. Pin Three.js and its matching types at 0.185.1.
Use WebGPURenderer in automatic mode with its WebGL2 backend as the fallback,
plus a local query switch that forces WebGL2. Retry one failed automatic
initialization with forced WebGL2, then show a recoverable DOM error.

Use a fixed orthographic isometric camera with bounded zoom and no orbit, pan,
or WASD. Resolve the existing park_small technical fixture through a reviewed
local asset registry and authored scene definition outside LessonManifest.
Load one repository-owned glTF/GLB fixture, preserve stable catalog-aligned
object IDs, and use a single convex walkable region with direct click-to-move
motion. Do not add pathfinding, navmesh, collision, or physics while the
fixture has no blocking obstacle.

Use provisional reference-machine goals of 60 FPS preferred, fewer than 100
draw calls, DPR capped at 1.5, first visible local scene under 2 seconds,
visible picking response under 100 milliseconds, and no authored movement
longer than 3 seconds. Record actual measurements and report misses. Use query
parameters rather than a new environment variable for local renderer,
diagnostic, and failure-simulation controls.

Consequences:

The milestone can prove scene lifecycle, renderer fallback, stable world
identity, point-and-click input, resize, background/resume, recovery, disposal,
and performance observability without pulling lesson logic or a heavy engine
forward. park_small remains a technical fixture and does not resolve the
product-level first-scene decision O-002. The broader MVP browser/device matrix
remains open after this narrow acceptance environment.

## Deferred decisions

These are acknowledged but not yet ready to decide:

| ID | Decision needed | Resolve before |
| --- | --- | --- |
| O-001 | Initial learner level and support locale | First vertical-slice content |
| O-002 | First scene, scenario, and target set | Vertical-slice ExecPlan |
| O-003 | Mastery aggregation and weak-target scheduling policy | Persistence and adaptation milestone |
| O-006 | Backend HTTP framework and compilation job model | Backend foundation |
| O-007 | SQLite library, migrations, and browser/server progress ownership | Persistence foundation |
| O-008 | Browser/device support and WebGPU fallback policy | Rendering foundation |
| O-009 | Kanji and Japanese reference datasets and licenses | Compiler/reference integration |
| O-010 | OpenAI model, TTS model, voice policy, and cache storage | AI and audio integration |
| O-011 | Analytics privacy, retention, and exact metric definitions | Telemetry implementation |
| O-012 | Deployment model and Docker topology | Post-acceptance release discovery |

Deferred decisions must be discussed when they become material. They should
not be filled with convenient defaults during unrelated work.
