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

### D-022 — Preserve M7 v1 as the OpenAI Responses compiler proposal

- Date: 2026-08-12
- Status: Proposed
- Affects: Compiler, shared contracts, server, SQLite, web client, AI, local
  configuration

Context:

D-027 later names this proposal **M7 v1** and makes it an inactive preserved
candidate while M7 v3 research is active. Its proposed model, credential,
provider, job, and Structured Outputs details remain intact for comparison;
none are approved or implemented by that reclassification.

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

### D-024 — Approve Milestone 7 Prompt Adaptation Pack 0.1.0

- Date: 2026-08-12
- Status: Accepted
- Affects: AI modules, compiler prompt composition, evaluation fixtures,
  provenance, privacy

Context:

D-023 accepted the complete supplied six-GPT source set and assigned the three
Milestone 7 authoring responsibilities. The repository now contains a shared
typed contribution contract, three exact prompt fragments with content hashes,
and fifteen separately authored text-only evaluation fixtures. These artifacts
needed explicit approval before any provider or compiler implementation could
use them.

Decision:

Approve `docs/ai-modules/` as Prompt Adaptation Pack version `0.1.0`, including
the shared contract, failure and validation boundaries, privacy policy, fixed
composition order, and evaluation fixtures.

Approve these exact prompt-module versions and SHA-256 content hashes:

- `story_sheet@0.1.0`:
  `61df189356ee388b05ef3c1564caac9c72fc840568287991999423c5d3e70def`;
- `reverse_trainer@0.1.0`:
  `301f8ae5baea44afdf79501806805e3b1e775fd02a43a0f8fd60a8472305286b`;
- `story_coach@0.1.0`:
  `73a74c5f55bc7ab2fd9e4850c3414f86f161b882168d89c22cd2c2b433dad1d7`.

Compose one structured request in this fixed order: code-owned compiler
envelope, Story Sheet, Reverse Trainer, Story Coach, then the strict output
schema. The modules remain disjoint contributions rather than independent
agents or calls. Code continues to own IDs, primitive sequence, difficulty,
candidate and answer truth, attempts, transitions, timing, budgets,
normalization, and final validation.

The captured `config.md` hashes identify the reviewed source snapshots.
Unknown GPT-editor model, capability, action, and version-history values are
not inherited. The approved modules use no tools. Supplied images and the APKG
remain local style/output examples only and are excluded from prompts,
reference/content inputs, and evaluation fixtures.

If any required module returns `CANNOT_COMPLY`, the whole draft fails. The
compiler may attempt at most one bounded repair using the same module versions
and deterministic diagnostics; it must not use an undocumented generic
fallback. Any prompt behavior change requires an appropriate semantic version
change, a new content hash, rerunning the relevant evaluations, and explicit
approval before activation.

Consequences:

Milestone 7 phase 0 is complete and these three modules are Approved for
implementation. They are not runtime-active: no provider adapter, compiler, or
API call has been implemented or enabled by this decision. Proposed D-022, the
Milestone 7 ExecPlan, the model and reasoning setting, and the environment
variable name remain separate approval gates before implementation starts.

### D-025 — Adopt a GLB-first Three.js world-authoring pipeline

- Date: 2026-08-19
- Status: Accepted
- Affects: World authoring, assets, rendering, navigation, catalogs, roadmap

Context:

The accepted runtime has one repository-owned `park_small` technical fixture,
code-owned scene metadata, stable catalog identities, and direct movement. It
has no production world or asset catalog. Importing a complete city engine
would duplicate the runtime, broaden scope, and introduce avoidable license or
Three.js-version risk. Runtime procedural world generation would also conflict
with the bounded reusable micro-scene direction.

Decision:

Use Three.js Editor as the initial scene assembly and inspection tool. Use the
CC0 Kenney City Kit (Roads), City Kit (Suburban), Blocky Characters, and Cube
Pets packs as the initial production-asset candidates. Use the MIT-licensed
THREE.Terrain project only as an optional authoring-time terrain generator,
then export reviewed bounded geometry through the same GLB boundary. Do not add
THREE.Terrain to ordinary gameplay or the render loop by default.

Build the first production-world envelope as a bounded stylized Japanese
neighborhood containing a short road, convenience-store area, small park, two
active NPCs, and one active animal. Exact learner level, support locale, lesson
scenario, vocabulary, and grammar targets remain deferred. The neighborhood
may later appear connected to other chunks, but each lesson loads only its
required scene and asset bundles.

GLB owns renderable geometry, materials, rigs, and animation clips. Bunbun's
code-owned asset registry, scene definitions, and catalogs own paths,
transforms, camera presets, stable IDs, spawn points, walkable data,
placements, affordances, and deterministic cues. LessonManifest continues to
select registered IDs and cannot provide asset paths, terrain settings,
arbitrary scripts, or executable world behavior.

Keep direct authored movement while representative geometry has no blocking
obstacle. When real world chunks require routes around obstacles, the preferred
first spike is an authored navmesh with three-pathfinding. Yuka for richer NPC
behavior and recast-navigation-js for dynamic obstacles or crowds remain
conditional candidates; this decision does not approve those dependencies.

Before any asset ships, record its canonical source, author or publisher,
exact license, version or download date, source hash, conversion provenance,
exported GLB hash, catalog ownership, and measured runtime budget. Recheck the
source terms at intake time. Do not import a complete AGPL/GPL city engine as
the production foundation.

Consequences:

World production can start from reusable licensed components without replacing
the deterministic Three.js runtime. The asset pipeline gains explicit license
and provenance work, and representative assets still require a focused
ExecPlan, download review, conversion, optimization, registration, tests, and
manual browser acceptance. O-002 is narrowed to the exact first lesson scene
variant, scenario, and target set rather than the general world-authoring
direction; D-026 later resolves that slice. No dependency or asset is added by
this decision alone.

### D-026 — Select an N5 last-train showcase with complete authored audio

- Date: 2026-08-19
- Status: Accepted
- Affects: Product vertical slice, learning content, gameplay, world authoring,
  audio, performance, roadmap

Context:

D-025 selects a bounded Japanese-neighborhood production envelope but leaves
the first learner level, support locale, scene variant, scenario, and language
targets open. The user wants the first showcase to demonstrate more than a
quiet object-finding tutorial: it should combine narrative pressure, contrasting
NPC personalities, an animal, vocabulary, and grammar in one recoverable
situation. The user also requires character voices, environmental sound, and
meaningful gameplay effects rather than a silent 3D scene or browser-dependent
technical speech alone.

The current runtime has an `AudioPlaybackPort` backed only by browser
SpeechSynthesis after a learner gesture. LessonManifest 0.1.0 already models
exact spoken Japanese, approved voice profile IDs, deterministic cache keys,
and replay. Registered presentation cues can identify deterministic scene
effects, but no production speech, ambience, effect, music, mix, cache, or audio
asset exists yet. O-010 still owns provider/model/voice/cache selection.

Decision:

Use an N5 lesson with Vietnamese support as the first product vertical slice.
Its title is `Three Minutes to the Last Train` (`Ba phút trước chuyến tàu cuối`;
Japanese display title `終電まであと3分`). Use a rainy-evening variant of the
D-025 neighborhood with the convenience-store frontage, short road, park edge,
two NPCs, one cat, and distant station cues rather than a second loaded station
scene.

The learner helps Aoi, an anxious and impulsive student, recover a missing
wallet before leaving for the last train. Tanaka is a formal, rule-bound clerk
who protects a staff-only area. Momo the cat leads the learner toward an
umbrella-stand clue. The resolution reveals a mistaken umbrella and dropped
wallet rather than a theft. The primary template is `SOLVE_SMALL_PROBLEM` and
the initial requested targets are `財布（さいふ）`, `探す（さがす）`, and
`～てください`. Reviewed supporting targets may include `駅`, `雨`, `傘`,
`待つ`, `急ぐ`, `交番`, `～てはいけない`, `～ませんか`, and
`なくてはいけない`.

The apparent three-minute deadline is narrative pressure, not a hard realtime
countdown, game-over condition, or punishment. Wrong responses produce bounded
NPC reactions, feedback, and scaffolding while preserving a completable path.
The complete scenario still uses only the eight accepted primitives.

The vertical slice is audio-complete. Every learner-relevant Japanese NPC or
narration utterance has reviewed cached speech that exactly matches its text;
each named NPC keeps a consistent approved voice profile. The scene has
authored rain, street, convenience-store, and distant-station ambience.
Meaningful movement, object, animal, clue, feedback, and transition beats use
registered deterministic sound cues. Restrained music or stings may support
tension and resolution. Voice receives mix priority and ducks competing layers.
The learner controls master, voice, ambience, effects, and music levels and can
use captions, replay, mute, and recoverable text fallback.

Keep LessonManifest 0.1.0 unchanged. Spoken lines continue through
`AudioAsset`; application-owned scene metadata owns ambience; registered
presentation cues own non-speech effects and musical stings. No manifest may
supply an arbitrary media URL, file path, mix value, or playback script. TTS is
prepared and cached outside ordinary gameplay. This decision adds no
microphone, realtime TTS, realtime NPC conversation, voice cloning,
pronunciation scoring, SPEAK primitive, or runtime LLM call.

Treat the sibling N5 extraction as local research input only. Shipped target
records, Vietnamese support copy, dialogue, and examples must be reviewed,
repository-owned content with documented provenance; Bunpro meanings, links,
or the full extracted corpus are not imported by this decision.

Consequences:

O-001 and O-002 are resolved for the first vertical slice. M7 remains the next
milestone; this decision does not select or approve an M7 strategy. D-027 later
separates those strategies and makes v3 research active. M8 must replace
SpeechSynthesis with a reviewed cached speech and audio-runtime boundary before
M9 can satisfy the complete showcase. O-010 remains open for any applicable
text-model choice, TTS provider/model, voice policy, cache storage, and
invalidation details. Every production world and audio asset requires source,
license, hash, processing, and measured-runtime intake.

### D-027 — Track three M7 compiler strategies and research v3 first

- Date: 2026-08-19
- Status: Accepted
- Affects: Compiler planning, AI modules, roadmap, local research, privacy,
  browser integration

Context:

The original Milestone 7 proposal tied the lesson-compiler outcome to one
OpenAI Responses API implementation using `gpt-5.6-terra` and
`OPENAI_API_KEY`. The user wants to preserve that proposal without activating
it, keep a second local self-built LLM direction under research, and now study
a third route that can reuse the user's existing Custom GPTs through a browser
or another reviewed ChatGPT-side bridge. The local repository already owns the
six captured GPT configurations, the accepted three-module responsibility map,
Prompt Adaptation Pack 0.1.0, and a strict model-to-runtime contribution
contract. No compiler implementation exists, so the strategies can be split
without migration or rollback.

Decision:

Milestone 7 remains one product outcome: learner vocabulary and grammar become
a validated, revisioned LessonManifest that ordinary gameplay can execute
deterministically. Track three alternative implementation strategies:

1. **M7 v1 — OpenAI Responses API.** Preserve proposed D-022 and
   `plans/2026-08-12-structured-lesson-compiler.md` as the inactive v1
   candidate. It retains the proposed `gpt-5.6-terra`, medium reasoning,
   Structured Outputs, and `OPENAI_API_KEY` design for later comparison. It is
   neither approved nor active.
2. **M7 v2 — self-built local LLM.** Preserve a research direction for a
   locally hosted, locally adapted, or locally trained open-weight language
   model. Model family, hardware floor, inference runtime, fine-tuning versus
   training scope, structured-output enforcement, licenses, and evaluation
   thresholds remain unselected. It is not the active implementation plan.
3. **M7 v3 — Custom GPT browser bridge.** Make this the active research
   direction. It must not use `gpt-5.6-terra` or `OPENAI_API_KEY`. Research
   user-authorized browser-assisted, file/clipboard handoff, ChatGPT plugin or
   MCP, Custom GPT action, and other documented routes that might reuse the
   captured GPT behavior without weakening Bunbun's local deterministic
   boundary.

All three strategies must converge on the same code-owned authoring envelope,
typed contribution boundary, deterministic references, catalog allowlists,
normalization, LessonManifest validation, persistence, provenance, and
provider-independent runtime. External output is always untrusted and never
playable directly. No strategy may add an LLM to ordinary gameplay or the
render loop.

M7 v3 research is authorized, but implementation is not. Research does not
authorize programmatic login, cookie or session extraction, a persistent
browser profile, browser automation, a public tunnel, a new credential or
environment variable, changes to the user's GPTs, or transmission of learner
data. D-011 still excludes automated browser E2E. D-023 and D-024 continue to
govern module ownership and the approved local adaptations. In particular,
D-023's one-composed-request rule remains in force until a later accepted
decision explicitly permits sequential direct calls to separate Custom GPTs.

Consequences:

The repository can compare provider API, local-model, and browser-mediated
paths without erasing prior research or binding the runtime to one provider.
M7 v1 no longer blocks work by asking for an API-key-name approval, but it
cannot be implemented accidentally. M7 v2 needs a separate hardware, model,
license, inference, and evaluation study before an ExecPlan. M7 v3 receives a
focused proposed ExecPlan whose first gate is a manual, no-secret feasibility
spike against the existing GPT configurations and approved evaluation
fixtures.

The initial recommendation for v3 is a human-in-the-loop browser bridge:
Bunbun creates a versioned prompt packet, the user deliberately opens the
corresponding GPT and transfers the packet, then imports its structured result
for local deterministic validation. Direct UI automation, a browser extension,
ChatGPT-side MCP/action delivery, or workspace-agent triggering remain
conditional candidates until the manual bridge proves the output contract and
the user separately approves their authentication, privacy, networking, and
maintenance costs.

### D-028 — Sequence M7 v3 through manual, WXT, then MCP bridge stages

- Date: 2026-08-19
- Status: Superseded by D-031
- Affects: M7 v3 sequencing, browser integration, open-source intake,
  authentication, privacy, M7 v2 fallback

Context:

The user accepted the staged route proposed after reviewing open-source
browser automation, extension, MCP, ChatGPT export, and self-hosted agent
projects. The survey found six technically possible patterns, but they do not
have equal product risk or reuse fidelity. Manual transfer, a local extension,
and a later ChatGPT-side bridge can reuse the hosted GPT behavior without
making ordinary gameplay depend on a model. Playwright/Puppeteer and agentic
browser controllers add fragile UI/session automation. Reconstructing the GPT
instructions and Knowledge in LibreChat or AnythingLLM reuses the design, not
the hosted GPT object, and belongs with local-model research.

Decision:

Sequence M7 v3 as three gated stages:

1. **M7 v3.1 — manual packet bridge.** This is the active and approved next
   slice. Bunbun prepares a versioned, privacy-reviewed packet; the user opens
   the existing GPT, transfers the packet, and imports exact JSON for strict
   local validation. Begin with the no-code Story Sheet feasibility gate. The
   result must pass before implementing a complete manual bridge.
2. **M7 v3.2 — local WXT extension.** This is a conditional later stage, not an
   implementation approval. If v3.1 passes and manual transfer is the measured
   bottleneck, prefer the MIT-licensed WXT framework for a narrowly scoped
   browser extension. It may act only on an explicitly selected conversation
   result and a loopback Bunbun endpoint. Permissions, nonce/origin checks,
   data minimization, ChatGPT DOM churn, packaging, and manual installation
   require a separate approved plan. Plasmo and ChatGPT exporter projects are
   reference evidence, not dependencies selected by this decision.
3. **M7 v3.3 — ChatGPT-side MCP bridge.** This is a conditional long-term
   stage, not an implementation approval. Consider it only after v3.1 and any
   justified v3.2 work. It may require a dedicated bridge-mode GPT or a reviewed
   edit/clone of an existing GPT, a public HTTPS endpoint or Secure MCP Tunnel,
   authentication, explicit write confirmation, and a new privacy/security
   decision. The official OpenAI Apps SDK examples and Model Context Protocol
   TypeScript SDK are reference candidates; no package, tunnel, token, or GPT
   edit is selected now.

Keep deterministic Playwright/Puppeteer automation, Playwright MCP, and
agentic browser-use tooling research-only. They must not receive a persistent
ChatGPT browser profile, cookies, passwords, or unattended execution authority
under this decision. Move LibreChat, AnythingLLM, and similar reconstruction of
the captured GPT behavior to the M7 v2 research comparison because those paths
replace the hosted GPT execution model.

D-023 remains unchanged. Acceptance of this staged route does not yet approve
sequential independent use of Story Sheet, Reverse Trainer, and Story Coach.
After the Story Sheet gate, a separate accepted orchestration decision must
choose sequential GPT conversations, one dedicated bridge-mode GPT, or one
composed prompt-pack conversation. D-011 still excludes automated browser E2E.

Consequences:

The active work is now M7 v3.1 rather than open-ended v3 research. The current
ExecPlan is approved only through its manual Story Sheet feasibility gate and
the documentation/fixture preparation needed to run it. Full compiler code
still waits for the post-gate orchestration, disclosure, repair, local-link,
and O-006/O-009 decisions. V3.2 and v3.3 remain ordered options with explicit
promotion gates, so their permissions and infrastructure cannot enter v3.1 by
convenience.

### D-029 — Close the Story Sheet gate early with provisional evidence

- Date: 2026-08-19
- Status: Accepted
- Affects: M7 v3.1 feasibility evidence, Story Sheet evaluation, next
  orchestration decision

Context:

The user completed two of the five approved Story Sheet feasibility fixtures.
Run 001 returned exact valid JSON but failed strict world-fact discipline. Run
002 passed its structural and semantic expected-behavior fixture after the
packet supplied explicit narrative claims. The user initially reported
image/file/tool activation as `yes`, then explicitly corrected the final value
to `no` and instructed the project not to run more fixtures. Run 003 had been
prepared and locally validated but was never executed; the two rejected-
behavior fixtures were not prepared or run.

Decision:

Treat the latest explicit media observation as authoritative for both completed
runs while retaining the correction trail in their evaluation records. Stop
the Story Sheet suite after two of five fixtures by user decision. Keep Run 001
rejected for world-fact discipline and accept Run 002 as a complete structural,
semantic, and media pass.

Close the no-code gate as
`PROVISIONALLY_VIABLE_FOR_ORCHESTRATION_PLANNING`. This is permission to discuss
and select the next M7 v3.1 orchestration shape; it is not a full `VIABLE`
qualification, compiler implementation approval, or evidence that the unrun
multi-target and rejected-behavior cases pass.

Consequences:

Run 003 remains a versioned unexecuted artifact and cannot be counted as
evidence. Runs 004 and 005 remain unrun. The repository must continue to show
these residual risks rather than converting user acceptance into fabricated
test results.

D-023 still forbids silently switching to three independent GPT calls. Before
compiler code, a separate accepted orchestration decision must choose
sequential user-mediated GPTs, one dedicated bridge-mode GPT, or one composed
manual prompt-pack conversation, together with disclosure, repair, import, and
local-link rules. D-028's later WXT and MCP gates remain unchanged.

### D-030 — Use one dedicated bridge-mode GPT for the manual compiler

- Date: 2026-08-19
- Status: Rejected by D-031
- Affects: M7 v3.1 orchestration, GPT configuration, prompt composition,
  privacy disclosure, manual import, D-023

Context:

D-029 allows orchestration planning from a truncated but useful Story Sheet
gate. Three direct user-mediated GPT conversations would reuse the hosted GPT
objects most literally, but would revise D-023, multiply manual transfers, and
pass partially trusted context between conversations. A generic composed
ChatGPT conversation would preserve one request and require no GPT editor work,
but would repeat a large prompt on every run and would reuse only the captured
behavior. A dedicated bridge-mode GPT can keep one composed request while
giving the user a stable manual ChatGPT entry point, but it requires a reviewed
new or cloned GPT configuration and must never become the hidden source of
truth.

Proposed decision:

Create one user-owned `Bunbun Lesson Bridge` GPT for M7 v3.1 manual use. Its
reviewed instructions compose `story_sheet@0.1.0`,
`reverse_trainer@0.1.0`, and `story_coach@0.1.0` in the D-023 order and request
one exact `LessonContentDraftContributions` object. The repository-owned prompt
pack, typed contract, versions, hashes, fixtures, and validators remain
authoritative. The six existing GPTs remain unchanged and serve as provenance
and evaluation sources; this route reuses their reviewed behavior rather than
calling all three hosted GPT objects sequentially.

The first implementation remains manual copy/paste:

- Bunbun exports one versioned packet after an explicit disclosure that the
  normalized Japanese targets and compact authoring facts will be sent to
  ChatGPT;
- the user independently opens the dedicated GPT and pastes the packet;
- the GPT returns exactly one raw JSON object, with no Markdown extraction,
  worksheet, image, file, or tool-dependent field;
- Bunbun imports only exact JSON and runs strict local structural and semantic
  validation;
- one bounded repair packet is allowed after stable redacted diagnostics; a
  second invalid response fails the job;
- no learner identity, progress, evidence, TYPE response, checkpoint, secret,
  GPT URL, cookie, or browser-session data leaves the local boundary; and
- no Open GPT control, WXT extension, MCP connection, tunnel, browser
  automation, API key, or environment variable is included.

The user creates or clones the dedicated GPT manually only after this decision
is accepted. Bunbun does not modify the GPT editor or assume undocumented
editor capabilities. The reviewed bridge instructions must be captured and
hashed in the repository before use; external hidden configuration never wins
over the repository contract.

Consequences:

This proposal preserves D-023's one-composed-request rule and avoids three
manual conversation hops. It trades literal invocation of each existing hosted
GPT for a single stable GPT that composes their approved behaviors. The manual
transport stays replaceable by v3.2 or v3.3 only through their existing gates.

Acceptance would authorize a self-contained implementation ExecPlan for the
provider-independent packet/import schemas, local durable state, manual UI,
composed bridge prompt, deterministic normalization, and authored tests. It
would not authorize creating/editing the external GPT automatically,
deployment, MCP, WXT, browser automation, or learner-data transmission without
the explicit export disclosure.

This proposal was not accepted. D-031 instead selects a repository-owned,
Skills-only personal plugin and avoids creating another hosted Custom GPT.

### D-031 — Select a Skills-only personal plugin for M7 v3.2

- Date: 2026-08-19
- Status: Accepted
- Affects: M7 v3 sequencing, AI-module orchestration, ChatGPT/Codex plugin,
  Custom GPT reuse, browser integration, cost, privacy
- Supersedes: D-028's WXT v3.2 stage and proposed D-030

Context:

The v3.1 Story Sheet experiment established that a hosted Custom GPT can return
the requested JSON shape, but its incomplete two-of-five evidence does not
justify building a browser extension around ChatGPT's DOM. Reviewing all six
captured GPTs also showed that their durable value is their user-owned behavior
and source material, not their hosted GPT identities: only Story Sheet, Reverse
Trainer, and Story Coach belong to the Milestone 7 lesson compiler, while
Visual Mnemonic and both Anki-oriented GPTs belong to later workflows.

A WXT extension would automate transfer but would add browser permissions,
loopback authentication, packaging, installation, and ongoing ChatGPT DOM
maintenance. A second hosted `Bunbun Lesson Bridge` GPT would create another
external configuration that could drift from the repository. Current ChatGPT
and Codex plugin support can package Skills without requiring an MCP server,
which provides a smaller way to make the reviewed Bunbun behavior reusable in
the user's existing ChatGPT subscription.

Decision:

Make **M7 v3.2 a local personal ChatGPT/Codex plugin containing Skills only**.
This is the selected next implementation direction for M7. The initial plugin
contains one learner-facing lesson-authoring skill that composes the approved
`story_sheet@0.1.0`, `reverse_trainer@0.1.0`, and `story_coach@0.1.0`
responsibilities in D-024 order. It does not expose or run six independent
agents. The remaining captured GPT behaviors stay disabled for Milestone 7 and
may become separately reviewed mnemonic or Anki skills only in their owning
later milestones.

The plugin reuses the captured GPT behavior through repository-owned,
versioned instructions, references, hashes, contracts, and fixtures. It does
not invoke the original hosted Custom GPT IDs, depend on their editor state, or
make hidden ChatGPT configuration authoritative. Bunbun's deterministic
compiler envelope and validators continue to own world facts, target truth,
primitive order, difficulty, IDs, transitions, attempts, timing, budgets,
normalization, publication, and gameplay.

The v3.2 boundary is:

- no `OPENAI_API_KEY`, provider SDK, programmatic login, cookie/session access,
  browser automation, WXT extension, public endpoint, tunnel, or MCP server;
- one explicit user-triggered authoring operation, with learner targets and
  compact authoring facts disclosed before they enter ChatGPT/Codex;
- exact typed output treated as untrusted and accepted only after the same
  local structural, semantic, catalog, and runtime-capability validation;
- no learner identity, progress, evidence, TYPE response, checkpoint, secret,
  or private chat history as authoring input; and
- ordinary gameplay remains completely local and deterministic after lesson
  publication.

Keep M7 v3.1 as historical feasibility evidence rather than the active
implementation route. Move WXT to research-only fallback status; it may be
reconsidered only if the Skills-only route is unavailable or a measured
transfer problem remains and a new permissions/security decision is accepted.
Keep M7 v3.3 as the conditional MCP stage for a future direct ChatGPT-to-Bunbun
connection; it still requires a separate endpoint, authentication, privacy,
confirmation, and infrastructure decision.

No separate OpenAI plugin surcharge was identified in the official pricing and
plugin documentation reviewed on this date. The selected route is expected to
use the allowance of the user's existing ChatGPT plan, but it is not an
unlimited-cost guarantee: normal plan limits or credits still apply, exact
availability depends on the account/workspace, and optional extra credits or
future third-party infrastructure can cost money. API-key billing is outside
this decision.

Consequences:

D-023's one-composed-request rule remains intact, and proposed D-030 is
rejected. A new self-contained ExecPlan must define and receive approval for
the personal plugin manifest, skill interface, authoritative repository
references, packet/output contracts, disclosure, validation handoff, fixtures,
and manual acceptance before implementation. Creating the plugin, installing
it, changing a ChatGPT account, transmitting real learner targets, adding MCP,
or implementing compiler/runtime code is not authorized merely by this
architecture decision.

### D-032 — Implement the M7 v3.2 proof with claim-level world traceability

- Date: 2026-08-19
- Status: Accepted through the approved M7 v3.2 ExecPlan
- Affects: Authoring contracts, local plugin, prompt packaging, validation,
  fixtures, manual proof

Context:

The user approved `plans/2026-08-19-m7-v3-skills-plugin.md`. D-024 had approved
design types but no executable schemas, and v3.1 Run 001 showed that a plain
list of world-fact sentences could not deterministically distinguish an
allowed presence claim from an invented relationship or reaction. The first
Skills-only proof also needs identities and prompt hashes on both sides of the
manual handoff without building the application compiler.

Decision:

Implement closed request and result contracts version `0.1.0` in
`@bunbun/contracts`. Use request format
`bunbun_m7_v3_2_lesson_authoring` and result format
`bunbun_m7_v3_2_lesson_authoring_result`. The request carries the canonical
input SHA-256, exact ordered D-024 prompt pack, authored-fixture disclosure,
attempt limit, strict JSON/text-only policies, explicit output budgets, and the
compact authoring envelope. The result must echo the request identity, input
hash, and prompt pack before returning one complete contribution object.

Refine each world fact's `allowedClaims` into stable claim-ID/statement pairs.
Each story beat receives `allowedWorldClaimIds` and must return its exact
`usedWorldClaimIds`. A plausible implication is not permission: presence does
not authorize a reaction, state, relationship, or action. Local validation
rejects unknown or out-of-beat claim IDs and continues to treat all authored
text as untrusted.

Package exactly one local `bunbun-authoring` plugin with one
`bunbun-lesson-authoring` Skill. Bundle byte-identical copies of the three
approved prompt fragments and fail the drift gate on any order, version, hash,
or content mismatch. Include no app, MCP server, API key, hosted GPT link,
browser permission, binary GPT asset, learner history, or runtime integration.

Stop automated implementation at a locally validated authored fixture. The
user alone installs/reloads the plugin and performs the supported-surface proof
using `docs/ai-modules/M7_V3_2_RUNBOOK.md`. One bounded repair is allowed; a
second invalid result ends the proof.

Consequences:

M7 v3.2 now has an executable transport boundary, fixture, validator,
inspection CLI, local marketplace manifest, and Skills-only plugin package.
This does not activate a provider inside Bunbun, normalize or persist a final
LessonManifest, publish a lesson, alter ordinary gameplay, prove product-
surface availability, or complete Milestone 7. The v3.1 evidence is unchanged.
Application handoff remains Milestone 4 of the active ExecPlan and MCP remains
a separate v3.3 decision.

### D-033 — Classify M7 v3.2 as conditionally viable and select reviewed file import

- Date: 2026-08-20
- Status: Accepted through the approved M7 v3.2 ExecPlan
- Affects: M7 v3.2 qualification, authoring contract, application handoff,
  evaluation evidence

Context:

Milestone 4 mapped all fifteen D-024 fixtures to the executable v3.2 contract.
Eleven can be represented without inventing code-owned data. Ten of their
independent first responses pass strict local validation and fixture-specific
grading; one is rejected for one trailing character after its JSON object.
Four fixtures expose missing compiler-owned practice text, accepted Japanese
answer truth, or runtime-plan fields in request contract 0.1.0.

Decision:

Classify the Skills-only route as `CONDITIONALLY_VIABLE`. Retain every exact
first response and every contract gap; do not count a gap as a model pass or
repair the malformed response in place.

Select a user-reviewed local JSON file as the first application handoff. Do
not use clipboard transfer as the authoritative record and do not promote to a
direct connection. Before implementing the importer, version the authoring
contract forward to carry compiler-owned practice text, accepted Japanese
answer truth, required read-only runtime-plan context, and bounded-repair
diagnostics. Rerun the four blocked fixtures and the one malformed-output case
before an application compiler can depend on this route.

Consequences:

The active Skills-only proof plan is complete, but Milestone 7 is not. No
application importer, compiler job, provider connection, LessonManifest
normalizer, publication path, MCP server, WXT extension, or runtime AI is
authorized by this decision. The next implementation requires its own approved
contract-and-import ExecPlan. MCP remains conditional M7 v3.3 work.

### D-034 — Complete M7 through authoring 0.2.0 and reviewed file publication

- Date: 2026-08-20
- Status: Accepted
- Affects: M7 v3.2 authoring contract, plugin compatibility, compiler,
  reference data, server HTTP lifecycle, SQLite, web authoring handoff,
  LessonManifest publication

Context:

D-033 selected a reviewed local JSON file as the first application handoff but
proved that authoring contract 0.1.0 cannot carry compiler-owned practice text,
accepted Japanese answer truth, the read-only runtime plan, or meaningful
bounded-repair context. The application still has no target normalizer,
reference resolver, compiler plan, manifest normalizer, compilation lifecycle,
importer, review gate, publication path, or compiled-lesson loader.

M7 v3.2 has no in-application model call. A queued/running provider worker from
the inactive M7 v1 proposal would add lifecycle and retry behavior for work the
application does not perform. The sibling Bunpro-derived N5 extraction is
research input without a local redistribution license and cannot become
runtime reference truth.

Decision:

Approve `plans/2026-08-20-complete-m7-file-import-compiler.md` and complete M7
through the selected Skills-only v3.2 route.

Version the authoring packet, protocol, and plugin compatibility forward to
0.2.0 while preserving the exact approved `story_sheet@0.1.0`,
`reverse_trainer@0.1.0`, and `story_coach@0.1.0` prompt files and hashes.
Contract 0.2.0 must add compiler-owned practice text and accepted Japanese
responses, primitive/attempt/feedback-duration runtime context, separate
authored-fixture and learner-target disclosures, and a closed attempt-2 repair
context. Preserve the 0.1.0 proof boundary and evidence side by side.

Before application importer work, rerun the four D-033 contract gaps, the
malformed Story Sheet case, and one actual attempt-2 repair through the updated
installed Skill. Stop if answer truth, runtime-plan integrity, repair identity,
or strict JSON cannot qualify.

Retain `node:http` and the one local SQLite process. Use durable human-handoff
states `AWAITING_AUTHORING`, `REPAIR_REQUIRED`, `READY_FOR_REVIEW`, `PUBLISHED`,
and `FAILED`; do not add a provider worker, SDK, credential, queue, or runtime
model call. Import exact bounded local JSON file text, hash it before strict
parsing, persist only hashes and stable diagnostics for invalid content, and
require deterministic normalization, full package/runtime validation, user
review, and explicit publication before gameplay.

For the technical M7 slice, add an independently authored repository-owned
`bunbun_core@0.1.0` fixture for `犬`, `猫`, and `〜てください`. Accept only
unique combinations of those reviewed targets in the park compiler profile;
reject arbitrary or incompatible text before export. The sibling N5 extraction
remains research-only and no external dataset or license is claimed.

Reuse the existing immutable `lesson_revisions` store for published packages.
Published and authored lessons must remain playable without the plugin or a
model. LessonManifest, CatalogSnapshot, and EvidencePersistence remain at
0.1.0 unless a concrete incompatibility is surfaced and approved separately.

Consequences:

O-006 is resolved for M7 v3.2 through the existing HTTP stack and the durable
human-handoff state machine. O-009 is resolved only for this technical compiler
slice through the three project-authored records; production Japanese
reference selection and licensing remain deferred. M7 uses no
`OPENAI_API_KEY`, provider charge, MCP, browser automation, extension, hosted
GPT invocation, or external endpoint. Plugin 0.2.0 must follow the official
local cachebuster/reinstall flow and be exercised in a new conversation before
compiler integration continues.

## Deferred decisions

These are acknowledged but not yet ready to decide:

| ID    | Decision needed                                                                                  | Resolve before                    |
| ----- | ------------------------------------------------------------------------------------------------ | --------------------------------- |
| O-008 | Browser/device support and WebGPU fallback policy                                                | Rendering foundation              |
| O-009 | Production kanji and Japanese reference datasets and licenses beyond the D-034 technical fixture | Production reference integration  |
| O-010 | Text-model strategy when applicable, TTS model, voice policy, and cache storage                  | AI and audio integration          |
| O-012 | Deployment model and Docker topology                                                             | Post-acceptance release discovery |

Deferred decisions must be discussed when they become material. They should
not be filled with convenient defaults during unrelated work.
