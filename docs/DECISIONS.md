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

### D-019 — Prove one lesson with a pure in-memory executor

- Date: 2026-08-11
- Status: Accepted
- Affects: Web runtime, lesson execution, audio, learning evidence, UX

Context:

Milestone 4 must execute one validated LessonManifest through LISTEN,
CLICK_OBJECT, and CHOOSE without pulling persistence, production TTS, AI, or
the remaining primitives forward. The current park runtime owns canvas input
directly, the valid contract fixture contains only one CLICK_OBJECT step, and
the contract does not yet define a persisted evidence-event payload. Browser
autoplay restrictions also prevent reliable audio from starting before a user
gesture, while the cached OpenAI TTS pipeline belongs to Milestone 8.

Decision:

For Milestone 4, add a pure deterministic lesson controller around a new
authored three-step FIND_SOMETHING fixture: LISTEN, CLICK_OBJECT, then CHOOSE.
Validate the complete manifest and catalog in the browser before activating the
scene, then apply a separate closed runtime-capability check for the implemented
scene, primitives, scaffolds, cues, and audio IDs. Unsupported valid contract
features fail closed rather than being ignored.

Keep session, reaction, and learning-evidence events in memory only. Give every
attempt and terminal outcome a deterministic session-local idempotency key,
exclude hidden-tab time from active latency, and expose technical results only
through development diagnostics. Reload starts a new session. Do not add
localStorage, SQLite, analytics transport, mastery calculation, or a durable
evidence schema before Milestone 6.

Place audio behind an AudioPlaybackPort. For this technical milestone only,
map the reviewed fixture audio ID to its validated Japanese text and use the
desktop browser's SpeechSynthesis API after an explicit learner gesture. Record
heard evidence only after playback reports that it started; replay never
duplicates evidence. Missing or failed speech presents a recoverable assisted
path. This temporary adapter makes no voice-quality, cache, offline, or cross-
browser claim and must be replaced by the D-008 cached-audio boundary in
Milestone 8.

Use the manifest randomSeed for deterministic CHOOSE ordering. A wrong attempt
records one result, applies only authored supported scaffolds, and cannot advance
twice under repeated input. Correct work after help uses the assisted feedback
and transition. CONTINUE_ASSISTED resolves after the bounded maximum without
claiming unaided success. DOM input suspends world picking during INTERACTION;
CLICK_OBJECT in EXPLORE consumes only registered candidate IDs.

Consequences:

The milestone proves the data-driven learning loop and event semantics without
a storage migration or service dependency. The pure controller, injected clock,
audio port, and world-input bridge remain testable outside a browser. Speech
quality and availability depend on the accepted desktop Chromium environment,
so this is not the production audio implementation. O-001 and O-002 remain open
because park_small and Vietnamese support are technical fixture choices, not
the first product vertical slice.

### D-020 — Complete the primitive runtime with task-scoped carry state

- Date: 2026-08-12
- Status: Accepted
- Affects: Web runtime, lesson execution, world input, fixtures, UX

Context:

Milestone 4 executes LISTEN, CLICK_OBJECT, and CHOOSE through a pure in-memory
controller. LessonManifest 0.1.0 already models ARRANGE, TYPE, MOVE_TO, PICK_UP,
and GIVE, but the web has no execution semantics for token identity, ordered
answer normalization, location arrival, carried state, or recipient handoff.
The current park also has no registered location targets and only one entity,
so it cannot demonstrate a wrong MOVE_TO destination or wrong GIVE recipient.

Implementing the remaining variants requires narrow coordination between DOM
input, controller truth, and Three.js presentation. It must not grow into a
general inventory, pathfinding, physics, or world-state scripting system, and
it must preserve the accepted world-dominant EXPLORE presentation and atomic
input gate that corrected Milestone 4.

Decision:

For Milestone 5, keep LessonManifest and CatalogSnapshot at version 0.1.0 and
add one authored eight-step HELP_SOMEONE technical fixture in this sequence:
LISTEN, ARRANGE, CLICK_OBJECT, TYPE, MOVE_TO, PICK_UP, GIVE, and CHOOSE. Preserve
the earlier fixtures. Extend park_small with two code-owned authored locations
and one second technical NPC so the fixture can exercise wrong destinations and
recipients. These additions do not select the first product scene or content.

ARRANGE runs in DOM INTERACTION mode and compares stable token ID sequences,
including distinct IDs for duplicate displayed text. Pointer and keyboard
controls must work without requiring drag-and-drop. TYPE also runs in DOM
INTERACTION mode. Promote the existing deterministic TYPE normalizer to one
shared contracts utility and apply the manifest's rules exactly once and in
authored order. Compare exact normalized values, enforce maximumLength by
Unicode code point, remain safe during Japanese IME composition, and retain
only the normalized submitted value in the session-local event record.

MOVE_TO, PICK_UP, and GIVE run as world-dominant EXPLORE interactions through a
discriminated, atomic candidate gate. MOVE_TO accepts only registered authored
locations, locks repeated selection during travel, and produces learner
evidence only after the matching location arrival is confirmed. Its reaction
latency starts at the learner's selection. A movement adapter failure restores
the awaiting state without consuming an attempt or recording a wrong answer.

The controller owns one task-scoped carriedObjectId mirrored by a simple
authored follow or escort presentation. Correct PICK_UP sets it and wrong
PICK_UP leaves it unchanged. A bounded CONTINUE_ASSISTED PICK_UP may set it only
when the final active REDUCE_OBJECT_CANDIDATES scaffold exposes exactly one
accepted object. Correct GIVE transfers and clears it; wrong GIVE preserves it.
Missing or contradictory carry at GIVE fails closed as a runtime error. Restart
restores initial world placement and clears pending movement, highlights, and
carry state. No inventory UI, multiple carried items, collision, pathfinding,
physics, or general world-state expression language is added.

Implement HIGHLIGHT_ENTITIES, SHOW_MEANING, and SHOW_PATTERN only as the fixed
presentation required by the reviewed fixture. RECOGNITION_FALLBACK remains
explicitly rejected by the local capability gate until its execution and
rejoin semantics receive separate review. Keep all evidence in memory under
D-019, add no persistence or environment variable, and expose one-shot query
controls only for manual movement and invalid-carry recovery checks.

Consequences:

One forward-only technical lesson can manually prove and regress the entire
closed primitive vocabulary. Controller state and tests become larger, but the
world remains a presentation adapter and all answer truth stays deterministic.
The shared normalization utility prevents validator/runtime drift without a
schema migration. The second NPC, authored locations, and dog escort behavior
are technical fixtures rather than production content decisions. Persistence,
AI compilation, cached TTS, final content, and recognition-fallback execution
remain deferred to their owning decisions or milestones.

### D-021 — Persist local evidence through server-owned SQLite checkpoints

- Date: 2026-08-12
- Status: Accepted
- Affects: Shared contracts, server, web runtime, persistence, resume, privacy,
  learning evidence

Context:

Milestone 5 keeps an idempotent event map and all lesson state in browser
memory. Reload creates a new session, so completed evidence can be lost and a
repeated interaction can be recorded again. Milestone 6 must persist evidence,
recover at safe interaction boundaries, distinguish assisted work, and expose
a conservative weak-target signal. It must do so before accounts, cloud sync,
the AI compiler, production analytics, or a final mastery model exist.

SQLite could run behind the Node server or inside the browser through a second
storage technology. Progress could be reconstructed from events alone or from
opaque serialized controller state. A broad ORM, browser database, full
event-sourcing framework, numeric mastery score, or analytics pipeline would
all expand the milestone beyond its local deterministic requirement.

Decision:

Keep LessonManifest and CatalogSnapshot at 0.1.0. Add a separate versioned
EvidencePersistence 0.1.0 shared contract for API payloads, persisted evidence,
session checkpoints, resume summaries, and local progress summaries.

The existing Node server owns one repository-local SQLite file and accesses it
through Node.js 24's built-in `node:sqlite` DatabaseSync API. Use small ordered
code-owned migrations with names and checksums; reject a database created by a
newer schema or one whose applied migration checksum changed. Use foreign keys,
WAL mode, a busy timeout, explicit transactions, and parameterized statements.
Do not add an ORM, a browser database, a second persistence dependency, a new
environment variable, or a backend framework. Tests inject temporary database
paths; normal local development uses the ignored
`.bunbun-data/bunbun.sqlite` path.

The backend stores immutable lesson-revision snapshots, play sessions,
append-only evidence events, one current checkpoint per active session, and a
small local preference record. A session commit inserts new events and updates
its checkpoint atomically. Event IDs are unique, a commit ID is idempotent, and
checkpoint sequence uses optimistic concurrency. A stale tab receives a
conflict instead of overwriting newer progress. The server validates payloads,
session/lesson identity, manifest references, checkpoint references, and event
consistency before committing.

The browser calls same-origin `/api/v1` endpoints. Vite proxies this path to the
local Node server during development. On boot, an unfinished compatible
session produces an explicit Resume or Start again choice; it is not silently
merged. Restart marks the old session abandoned and creates a new one. A
completed session remains completed after reload. Runtime state is restored
from a closed checkpoint DTO, not an arbitrary serialized LessonState object.
Transient audio playback and movement resume at their safe awaiting phase,
feedback settles idempotently, unsubmitted TYPE text is cleared, and authored
world carry/transfer presentation is reconstructed from checkpoint data.

Use a single anonymous local profile with no name, email, account, cookie,
cross-device sync, IP/user-agent capture, or analytics transport. Persist only
fields needed for resume and learning evidence. In particular, TYPE text is
never stored in SQLite or embedded in an event ID; closed world/choice/token
responses may store only authored stable IDs. Store server receipt time beside
the client occurrence time. Local data remains until the user invokes a
visible, confirmed Reset local data action; reset deletes lesson/session/event,
checkpoint, commit, and preference rows but preserves the migration history.

Do not calculate a mastery probability or schedule future lessons in this
milestone. Derive a lesson-revision-scoped target signal from persisted
assessment evidence:

- `INSUFFICIENT_EVIDENCE` when there is no meaningful assessment or fewer than
  two unaided correct results in distinct contexts and no weak event;
- `NEEDS_REVIEW` after an incorrect or assisted result until it is followed by
  at least two unaided correct results in distinct contexts; and
- `DEVELOPING` after that conservative recovery condition is met.

Exposure and heard events never clear weakness, assisted success never counts
as unaided evidence, lesson completion never depends on this signal, and the
runtime makes no `MASTERED` claim. Aggregate only within one lesson ID,
revision, and target ID until a later compiler/reference decision supplies a
reviewed cross-lesson target identity.

Consequences:

Reload can recover durable progress without adding cloud identity or allowing
the browser to mutate SQLite directly. Atomic commits and optimistic sequence
checks make duplicate delivery and multiple tabs explicit. The shared
persistence contract and migration tests add code and validation weight, while
synchronous SQLite is acceptable for the small single-process local workload.
Production authentication, backup, hosting paths, multi-user ownership,
cross-device sync, analytics, canonical cross-lesson mastery, and adaptive
scheduling remain deferred. This decision resolves O-003, O-007, and O-011 for
the local persistence milestone.

### D-022 — Compile lessons through durable local jobs and a strict draft boundary

- Date: 2026-08-12
- Status: Proposed
- Affects: Compiler, shared contracts, server, SQLite, web client, AI, local
  configuration

Context:

Milestones 2 through 6 prove the strict playable LessonManifest 0.1.0,
deterministic runtime, complete fixed primitive vocabulary, and local evidence
boundary using authored fixtures. Milestone 7 must accept learner vocabulary
and grammar targets, use AI only to propose lesson content, reject anything
that is not playable, persist an immutable revision, and let an already
compiled lesson play without another model call.

The playable manifest cannot be sent directly as an OpenAI Structured Outputs
schema. It intentionally omits optional properties, while Structured Outputs
requires every field to be required and represents optional values with null.
The current server uses node:http and synchronous server-owned SQLite; adding a
web framework, external queue, second database, or model call in gameplay would
expand the milestone without protecting its outcome. The existing catalog also
contains only a small technical park and metadata-only reference records, so it
cannot support an unbounded claim about arbitrary Japanese targets or licensed
external linguistic data.

The original Bunbun source names Story Coach, Reverse Trainer, Visual Mnemonic,
Tutor, Anki content generator, and JLPT assessment generator. The user later
supplied six local GPT configurations, but the sets do not match one-to-one:
Tutor and JLPT assessment are absent, while Story Sheet and HTML Anki appear and
two GPTs overlap on Anki generation. `docs/AI_MODULES.md` records the captured
sources and keeps every module disabled until its source revision,
capabilities, examples, adaptation, version, and routing are reviewed and
approved.

Decision:

For Milestone 7, retain node:http and the single local Node process. Add a
versioned LessonCompilation 0.1.0 API contract and durable SQLite compilation
jobs. POST creates an idempotent job and returns promptly; GET exposes its
queued, running, succeeded, or failed state. One in-process worker runs at most
one job at a time. A process restart marks an interrupted running job failed
and never silently repeats a potentially billable model call. Successful
compiled packages are stored as immutable lesson revisions and may be listed,
loaded, validated, and played without OpenAI being available.

Normalize one to three vocabulary or grammar targets deterministically using
Unicode NFKC, trimming, controlled whitespace collapse, exact duplicate
removal, stable ordering, closed size limits, and plain-text safety checks.
Kanji targets remain outside this milestone. Use a small reviewed,
repository-owned Bunbun Core reference fixture for the technical park. A known
target receives its reference record; an unknown vocabulary target is accepted
only when the learner supplies its reading. Grammar patterns may remain
learner-supplied as permitted by LessonManifest 0.1.0. No external dictionary
or grammar dataset is imported, and no license claim is invented. O-009 is
resolved only for this technical compiler slice; production reference-provider
selection remains deferred.

Select the existing park_small runtime profile and a compatible initial
scenario deterministically before asking AI for content. The model receives
only normalized targets, a compact allowlist of reviewed local world IDs,
primitive capabilities, quality budgets, a versioned compiler envelope, and
only the approved prompt modules registered in `docs/AI_MODULES.md`. D-023
accepts the Milestone 7 responsibility map: Story Sheet authors premise,
story, and setting/context; Story Coach authors bounded hints, scaffold
wording, pedagogical cadence, and feedback; Reverse Trainer authors phrase
analysis, reverse recall, and practice content. These responsibilities are
composed in one structured lesson request rather than run as independent
agents. Deterministic code owns primitive order, difficulty progression, IDs,
transitions, and hard budgets. A required module that remains unapproved fails
clearly rather than being replaced by an undocumented generic prompt. The
model cannot invent assets, mechanics, paths, URLs, or executable behavior.

Use the official OpenAI JavaScript SDK and Responses API with strict Structured
Outputs through a separate all-required LessonContentDraft 0.1.0 schema. The
proposed initial model is `gpt-5.6-terra` with `reasoning.effort` set to
`medium`, because current official OpenAI documentation identifies Terra as
the balance of intelligence and cost and confirms Responses and Structured
Outputs support. Use `text.format`, not JSON mode or function calling, because
the desired result is a structured response rather than a model-triggered
tool. Record the requested model, returned model identifier, response ID,
participating prompt-module IDs and versions, usage metadata, and normalized
validation diagnostics; do not persist hidden reasoning or a provider
credential.

The model-facing draft is never playable. A pure deterministic normalizer
removes null optionals, assigns backend-owned identifiers, timestamps,
revision, seed, provenance, reference versions, and technical audio metadata,
then runs the existing structural and semantic package validators plus the
same runtime-capability gate used by the browser. At most two OpenAI Responses
calls are allowed per job: the initial draft and one bounded retry using stable
validation diagnostics. Refusal, unsafe input, missing configuration, and
unrecoverable provider errors fail visibly without a silent model fallback.
No invalid draft or partially normalized package is published.

The server reads the provider credential only from an environment variable
named `OPENAI_API_KEY`. This name still requires explicit user confirmation
before implementation or use. The model, compiler envelope, and approved
prompt-module versions remain code-owned for this technical milestone rather
than adding another configuration variable. The browser never receives the
key.

The web client gains a small pre-game compiler view for entering targets,
observing job state, and selecting a previously compiled lesson. Once a
validated package is selected, the existing world-dominant runtime and
persistence flow remain authoritative. Compiler-generated utterances may use
the temporary browser SpeechSynthesis adapter through validated technical audio
metadata until Milestone 8; this does not claim cached or production audio.

Consequences:

Milestone 7 can prove the real AI-to-deterministic-runtime boundary without a
backend framework, external worker, production content library, external
reference license, TTS pipeline, or runtime LLM. Successful results are cached
and reproducible enough to diagnose through explicit compiler, prompt,
catalog, reference, and model metadata, while exact model output is not assumed
to be deterministic. The local SQLite schema, server APIs, shared contracts,
web boot flow, capability validator, and manual failure matrix all grow. Model
quality and Japanese naturalness still require reviewed examples and manual
acceptance because schema and semantic validators cannot prove them. O-006 and
the initial text-model portion of O-010 are resolved only if this proposal is
accepted; TTS model, voice, and cache choices remain owned by Milestone 8.

### D-023 — Accept the confirmed Custom GPT set and Milestone 7 routing

- Date: 2026-08-12
- Status: Accepted
- Affects: AI modules, compiler routing, prompt review, evaluation fixtures,
  local source assets

Context:

The original Bunbun concepts and the six supplied Custom GPT configurations do
not match one-to-one. The supplied set has no standalone Tutor or JLPT
assessment GPT, while Story Sheet and HTML Anki are present. Story Coach,
Reverse Trainer, and Story Sheet also overlap in sentence and lesson-support
behavior. Separately, the captured source library contains images and an APKG
whose linguistic contents and provenance have not been accepted as reference
or evaluation data.

Decision:

The six supplied GPT configurations are the exact complete intended source set
for current planning. Do not wait for or invent a separate Tutor or JLPT
assessment GPT.

For Milestone 7, map responsibilities as follows:

- Story Sheet authors the premise, story, and setting/context inside a
  compiler-selected scene and scenario profile.
- Story Coach authors bounded hint and scaffold wording, pedagogical cadence,
  and feedback inside code-owned slots and budgets.
- Reverse Trainer authors phrase analysis, reverse-recall material, and
  practice content.
- deterministic code chooses primitive sequence, difficulty progression, IDs,
  transitions, attempt/timing limits, and hard quality/runtime budgets.

Compose the three approved responsibilities into one structured lesson request
after their individual Bunbun adaptations and versions are approved. Do not
call the Custom GPTs as independent agents or treat their ChatGPT links as API
dependencies.

All supplied images and the APKG are style/output examples only. Do not extract
their linguistic content for lessons, treat them as reference truth, or use
them as evaluation fixtures. Author and review text evaluation fixtures
separately.

Consequences:

The source-to-module mapping gate is closed, but all three selected prompt
modules remain disabled until their typed responsibilities, exclusions,
versions, content hashes, source metadata, and text-only success/failure
evaluations are reviewed and approved. Story Coach can shape pedagogical rhythm
without controlling the deterministic lesson graph. Visual Mnemonic and both
Anki workflows remain deferred, and JLPT assessment remains a later capability
requiring a new decision. Binary examples are not inputs to the Milestone 7
lesson provider and cannot be promoted into compiler/reference/evaluation data.
A later visual or Anki workflow may use them only as style/output examples
after its own review and approval.

## Deferred decisions

These are acknowledged but not yet ready to decide:

| ID | Decision needed | Resolve before |
| --- | --- | --- |
| O-001 | Initial learner level and support locale | First vertical-slice content |
| O-002 | First scene, scenario, and target set | Vertical-slice ExecPlan |
| O-006 | Backend HTTP framework and compilation job model | Backend foundation |
| O-008 | Browser/device support and WebGPU fallback policy | Rendering foundation |
| O-009 | Kanji and Japanese reference datasets and licenses | Compiler/reference integration |
| O-010 | OpenAI model, TTS model, voice policy, and cache storage | AI and audio integration |
| O-012 | Deployment model and Docker topology | Post-acceptance release discovery |

Deferred decisions must be discussed when they become material. They should
not be filled with convenient defaults during unrelated work.
