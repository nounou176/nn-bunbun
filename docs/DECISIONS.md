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
- Status: Accepted; provider-specific wording superseded by D-038
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

### D-035 — Waive M7 v3.2 requalification and proceed with the local compiler

- Date: 2026-08-24
- Status: Accepted by explicit user approval
- Affects: M7 completion sequencing, Skills-only transport qualification,
  deterministic compiler implementation, completion claims

Context:

Authoring contract and plugin protocol 0.2.0 are implemented and validated
locally, and the installed plugin registry now reports the 0.2.0 compatibility
line. D-034 nevertheless required five fresh external authoring reruns and one
actual bounded repair before compiler integration. The user explicitly chose
to skip that M7-internal requalification milestone.

Decision:

Mark M7 completion-plan Milestone 2 as `WAIVED_BY_USER`, never as passed, and
proceed directly to Milestone 3, the deterministic compiler core. Develop and
test the compiler against repository-owned structurally and semantically valid
0.2.0 fixtures, including negative mutations. Continue to treat every imported
authoring result as untrusted and require the existing strict structural,
semantic, deterministic package, runtime-capability, review, and explicit
publication gates.

The waiver supersedes only D-034's requirement to complete requalification
before application importer work. It does not relax answer-truth ownership,
runtime-plan ownership, repair identity, strict JSON parsing, privacy,
publication, or deterministic gameplay boundaries.

Consequences:

The ChatGPT/Codex authoring transport remains `UNVERIFIED` for packet 0.2.0.
The project must not claim that the five skipped cases or actual attempt-2
repair passed. M7 may complete as a fully implemented and locally validated
file-import compiler flow, but its documentation and UI handoff must retain
this transport qualification risk until later evidence explicitly closes it.
D-035 does not activate M7 v1, M7 v2, v3.3 MCP, a provider API, browser
automation, or runtime AI.

### D-036 — Close M7 implementation with verification waived by the user

- Date: 2026-08-24
- Status: Accepted by explicit user direction
- Affects: M7 closure, verification claims, roadmap sequencing, release status

Context:

After directing the project to bypass the external requalification gate under
D-035, the user requested that the remaining M7 implementation be completed
and explicitly said to skip the test portion. The deterministic compiler,
SQLite/API handoff, reviewed file import, explicit publication, lesson library,
and shared browser/server package gate can be implemented without representing
unexecuted automated or manual checks as evidence.

Decision:

Close Milestone 7 as **implementation complete with verification waived by the
user**. Do not run or claim automated tests, Playwright, browser/gameplay
acceptance, the five external transport reruns, or a real attempt-2 transport
repair. Static type checking, linting, formatting, production build, plugin
source validation, and diff hygiene may still be used as implementation checks;
they do not establish runtime or transport acceptance.

Preserve every validation, answer-truth, runtime-plan, privacy, review, and
publication boundary in code. Label the skipped qualification and acceptance
evidence `UNVERIFIED_USER_WAIVED`, keep transport 0.2.0 `UNVERIFIED`, and make
Milestone 8 the next product milestone. This closure is not a local release-
candidate approval and does not authorize Docker, deployment, a provider API,
M7 v2, v3.3 MCP, browser automation, or runtime AI.

Consequences:

M7's implementation deliverables exist, but no M7 test suite or manual
gameplay result is recorded for this closure. Later changes that depend on the
compiler flow must either accept this named risk or obtain fresh explicit
verification. Existing pre-M7 acceptance remains historical evidence only and
does not prove the new authoring/library path.

### D-037 — Exclude Amazon Polly from Bunbun audio

- Date: 2026-08-24
- Status: Accepted by explicit user direction
- Affects: Milestone 8 provider research, TTS integration, local configuration,
  cost

Context:

Amazon Polly was evaluated as one candidate for pre-generated Japanese speech
because it offers Japanese voices and permits generated speech to be cached.
Using it would nevertheless require an AWS account, an Amazon-hosted TTS API,
AWS credentials or a local AWS profile, regional configuration, and separate
provider usage outside the existing Bunbun and ChatGPT boundaries. No Polly
code, dependency, account operation, credential, environment variable, or
billable request had been added.

Decision:

Do not use Amazon Polly for Bunbun. Do not add the AWS SDK, Polly endpoints,
AWS account setup, `AWS_PROFILE`, `AWS_REGION`, AWS access keys, or AWS billing
to the Milestone 8 implementation.

Keep O-010 open. The next TTS proposal must exclude Amazon Polly and compare a
local/offline route or another explicitly reviewed non-AWS provider while
preserving pre-generation, immutable caching, exact Japanese text identity,
pronunciation review, and deterministic offline gameplay.

Consequences:

The proposed Polly voice mapping and cost estimate are discarded and create no
implementation commitment. Milestone 8 remains at its provider/voice/cache
decision gate; its provider-independent Web Audio mixer and local asset
boundary are still valid but must not be implemented as if a TTS provider had
already been selected.

### D-038 — Require reviewed third-party plans and zero incremental cost

- Date: 2026-08-24
- Status: Accepted by explicit user direction
- Affects: All third-party services, dependencies, models, assets, credentials,
  AI, audio, cost, planning workflow
- Supersedes: D-008's provider-specific OpenAI TTS wording

Context:

Bunbun is operating under a constrained budget. An option is not financially
safe merely because it has a free tier, trial, promotional credit, low unit
price, or existing technical integration path. OpenAI API is unaffordable for
the current project, and replacing it with Amazon Polly would move rather than
solve the same incremental-cost problem. Selecting a service before the user
has reviewed its full cost and operating boundary also creates unwanted
account, credential, privacy, and lock-in commitments.

Decision:

Do not select, add, download, register, activate, or configure any new
third-party service, dependency, model, or asset that can create incremental
cost until a self-contained plan documents its exact purpose, license, data
flow, account and credential requirements, expected and worst-case cost,
fallback, removal path, and zero-cost alternatives, and the user explicitly
approves that plan.

A free tier, trial, or credit-limited offering is treated as capable of cost
and cannot be used as the financial basis of the project. OpenAI API and Amazon
Polly are explicitly excluded under the current budget. Do not add their SDKs,
keys, environment variables, accounts, endpoints, usage, or billing. The
existing M7 Skills-only workflow may continue only within the user's already
paid ChatGPT/Codex plan allowance approved by D-031; it must stop rather than
buy extra credits or switch to API billing when that allowance is unavailable.

Read-only research may compare candidates, but research does not select or
authorize one. Even a nominally free or open-source third-party dependency,
model, or asset must pass the reviewed-plan gate before download or addition.
For Milestone 8, the next proposal must target zero incremental usage and
recurring cost through a local/offline path. Provider-independent contracts,
cache design, and mixer planning may continue, but provider/model integration
waits for explicit approval of that focused plan.

Consequences:

D-008 still requires pre-generation and stable cache reuse but no longer
selects OpenAI TTS. O-010 is constrained to a zero-incremental-cost local or
offline route unless a later reviewed plan explicitly changes the budget
policy. No paid-capable provider may be introduced as a convenient substitute.
Every future handoff must report cost risk alongside happy path, edge cases,
regressions, and technical risk.

### D-039 — Qualify VOICEVOX Nemo before other local TTS candidates

- Date: 2026-08-25
- Status: Accepted; qualification result `QUALIFIED`
- Affects: Milestone 8 TTS research order, Japanese voice policy, cost,
  licensing, local authoring operations

Context:

D-038 requires a zero-incremental-cost local/offline TTS route and a complete
reviewed plan before any candidate is downloaded or added. Read-only research
compared VOICEVOX Nemo, AivisSpeech, Kokoro-82M, MeloTTS, Open JTalk,
COEIROINK, and Style-Bert-VITS2. Bunbun first needs two consistent non-cloned
Japanese NPC voices and reviewed cached speech for a bounded N5 showcase; it
does not yet need realtime or high-concurrency synthesis.

VOICEVOX Nemo has a dedicated character-less voice library and official local
HTTP engine for Linux. Its output terms allow commercial and non-commercial
use with `VOICEVOX Nemo` credit and prohibit machine-learning use. The official
Nemo engine repository identifies port 50121 and a stable 0.24.0 Linux CPU x64
release. It needs no account, API key, metered endpoint, GPU, or recurring fee.
AivisSpeech offers greater future model/style expansion but adds per-model
license review; Kokoro has a permissive Apache-2.0 boundary but its own voice
card reports weaker Japanese and short-utterance confidence.

Decision:

Qualify VOICEVOX Nemo first through
`plans/2026-08-25-qualify-voicevox-nemo.md`. Keep the qualification isolated
from product code and Git-tracked assets: use the official stable 0.24.0 Linux
CPU x64 engine as a removable loopback-only authoring tool, generate only the
fixed evaluation set, and require the user to choose or reject exact Aoi and
Tanaka voice candidates after listening. Expected and worst-case usage or
recurring monetary cost are both USD 0. Do not add an account, credential,
environment variable, SDK, Docker image, GPU dependency, runtime TTS path, or
cloud fallback.

The user explicitly approved the complete focused qualification plan on
2026-08-25. This authorizes only its pinned Nemo download, isolated local
execution, fixed evaluation output, and evidence work. It does not authorize
production integration. Do not download AivisSpeech in parallel. Consider
AivisSpeech only after an explicit Nemo rejection and a separate approved
plan. Retain Kokoro only as a later licensing-oriented fallback.

The pinned intake, local API, WAV integrity, performance observation, invalid-
style rejection, and isolated offline-synthesis checks now pass. The engine
produced 36 unchanged-baseline anchors across all nine voices and is stopped.
The user shortlisted styles `10005` and `10006` for Aoi and styles `10001` and
`10000` for Tanaka. The resulting 48-file, twelve-line finalist matrix passes
identity, unchanged-query, WAV, hash, and listening-page validation, and the
engine is again stopped. D-039 was resolved when the user explicitly approved
`F6/M2`: Aoi uses Female 6
style `10006`, speaker UUID `3490c392-30be-44c2-8379-b77df27fa65e`; Tanaka uses
Male 2 style `10000`, speaker UUID
`7ecc7a17-1465-4b22-a3b5-842a110ff55e`. Both report model version 0.15.0. No
line-specific pronunciation issue or accent override was reported with the
approval. The qualification result is `QUALIFIED`, with accepted visible
credit `VOICEVOX Nemo`.

This qualified result permits Bunbun to later propose stable code-owned voice
profiles, cache identity, SQLite metadata, local asset resolution, and mixer
integration. Gameplay must receive reviewed cached audio and must never call
the engine. If future evidence invalidates qualification, remove its exact
ignored local directories and return to the D-038 plan gate; do not switch
providers automatically.

Consequences:

O-010 is partially resolved: the local/offline TTS engine, exact Aoi/Tanaka
voice UUID/style assignments, credit, cost, and authoring boundary are
accepted. Stable code-owned profile IDs, canonical cache inputs, SQLite cache
metadata, generation workflow, production utterance review, runtime asset
resolution, and failure behavior remain open. The dedicated Nemo engine
corrects an earlier research assumption based on ordinary VOICEVOX: its stable
release and default port are separate, and its compressed Linux CPU x64 package
is materially smaller. The approved qualification added only ignored local
engine/evaluation data and a tracked source record; no product dependency,
production audio asset, secret, account, paid route, or runtime integration was
added.

### D-040 — Implement reviewed local Nemo speech through an immutable cache

- Date: 2026-08-25
- Status: Accepted by explicit user approval
- Affects: Milestone 8 speech authoring, voice profiles, SQLite, local files,
  runtime playback, cost, privacy, credits

Context:

D-039 qualifies VOICEVOX Nemo and exact Aoi/Tanaka voices but deliberately
stops before application integration. The current runtime still uses browser
SpeechSynthesis for the technical `voice_guide_01` profile. It has no stable
production-character profile IDs, complete cache identity, durable generation
state, reviewed WAV registration, same-origin resolver, or cached playback.

D-038 requires the complete production-integration boundary to be reviewed
before adding it. Final last-train dialogue and non-speech sources are not yet
approved, so the smallest coherent next step is a removable speech foundation
with one technical Aoi fixture rather than silently selecting ambience,
effects, music, or another provider.

Decision:

Approve `plans/2026-08-25-m8-reviewed-cached-japanese-speech.md` exactly as the
first implementation slice of Milestone 8.

Use immutable application profile IDs `voice_aoi_01` and
`voice_tanaka_01`. Map them in a code-owned server registry to Nemo 0.24.0,
manifest UUID `208cf94d-43d2-4cf5-abc0-9783cac36d29`, model 0.15.0, and the
D-039 Female 6 style `10006` and Male 2 style `10000` speaker identities. A
changed engine, model, speaker, style, or baseline policy creates a new profile
ID rather than mutating an accepted mapping.

Compute `bunbun_tts_v1_<sha256>` from canonical JSON containing the exact
Japanese string without cache-layer normalization, immutable profile and
qualified engine identity, unchanged-query policy, dictionary and
pronunciation-override fingerprints, and 24 kHz mono PCM WAV output identity.
Preserve and hash the returned query and generated WAV separately.

Add checksummed SQLite migration 3, a server-owned ignored cache under
`.bunbun-data/audio-cache/v1/`, an explicitly triggered serialized local queue,
bounded loopback Nemo calls, exact engine/style validation, atomic artifact
writes, WAV validation, preview, and explicit human approval. Only `READY`
assets may be served to gameplay through a same-origin cache-key resolver.
Gameplay never calls port 50121.

Use native browser cached-audio playback for Aoi and Tanaka. Preserve captions,
replay, no-duplicate heard evidence, visibility interruption, disposal, and
text fallback. Do not fall back from either production-character profile to
SpeechSynthesis or another provider. Keep SpeechSynthesis only as a named
legacy compatibility adapter for existing M4–M7 `voice_guide_01` technical
fixtures until the production scenario replaces that regression coverage.

Expected and worst recurring provider cost are USD 0. Add no account,
credential, secret, SDK, npm/system dependency, paid tier, remote endpoint, or
automatic provider fallback. Reuse the already confirmed process-local
`XDG_DATA_HOME` name only in the manual qualified-engine authoring command; it
is not application configuration. Send only exact project-authored Japanese
and the selected style over loopback. Retain visible `VOICEVOX Nemo` credit and
the machine-learning prohibition. Bound the generated cache at 512 MiB and
provide confirmed removal that preserves lessons, learning evidence, the
engine, and migration history.

Do not select or register ambience, effects, music, another TTS source, final
M9 dialogue, or a complete multi-bus mixer through this decision. Each remains
a later D-038 approval gate.

Consequences:

O-010 is resolved for stable character speech profiles, local generation,
cache identity/storage, review, resolution, and failure behavior. It remains
open for final production utterance review, non-speech assets, and the complete
mixer. The application gains a third SQLite migration and local
authoring/runtime audio code but no new third-party product dependency.
Qualification WAVs remain evaluation-only and must not be copied into the
cache.

### D-041 — Accept the first reviewed Aoi cache artifact and playback checkpoint

- Date: 2026-08-25
- Status: Accepted by explicit user approval and manual confirmation
- Affects: Milestone 8 speech artifact review and cached runtime acceptance

Context:

D-040 produced one fresh technical Aoi artifact for the exact Japanese text
`財布を探してください。`. It remained unavailable to gameplay until the user
could preview and explicitly approve the exact WAV. The renderer fallback was
separately repaired and manually confirmed before the cached lesson could be
exercised.

Decision:

Accept the exact Aoi artifact with cache key
`bunbun_tts_v1_34a6a1c8a7acc64b6a77f0f7aa84f21142f0b6a5715afc016db11e6f2cd0dbfe`,
WAV SHA-256
`516bdac89cfeb577911d6ea3d287b789f6ebbfede28d12e0923a5ce57b76b5de`,
83,500 bytes, and duration 1,739 ms. The user's authoring action moved the row
to immutable `READY`, and the user then reported the cached gameplay test as
OK. Repository inspection confirms the exact `READY` metadata, and port 50121
was not listening, so this acceptance covers same-origin cached playback
without a runtime Nemo call.

This accepts only the first technical Aoi happy path. It does not claim manual
coverage for replay, reload/resume, interruption, missing/rejected audio, or
the legacy guide path. It does not approve final production utterances,
non-speech assets, a complete mixer, another provider, or any incremental
cost.

Consequences:

The D-040 artifact review and core cached-playback checkpoint pass. At that
checkpoint, the focused plan remained open only for its manual edge/regression
matrix, and O-010 still included final production speech, non-speech assets,
and the complete mixer.

Closure evidence on 2026-08-25: the user reports A/B/C manual acceptance for
resume/replay, unavailable-audio assistance, background interruption, evidence
deduplication, and completion. Isolated tests cover the destructive and invalid
artifact cases without mutating the accepted WAV. The D-040 focused plan is
complete with no expansion to final dialogue, non-speech assets, providers, or
the mixer.

### D-042 — Qualify exact CC0 non-speech audio before building the native mixer

- Date: 2026-08-25
- Status: Accepted by explicit user approval
- Affects: Milestone 8 non-speech audio, Web Audio mixer, assets, licensing,
  cost, privacy, credits, runtime lifecycle

Context:

D-040 and D-041 complete the reviewed cached-speech foundation. Bunbun still
has no ambience, effects, music, ducking, non-speech registry, or learner mix
controls. D-038 requires a self-contained cost, license, data, account,
operational, fallback, and removal plan before any third-party asset is
selected or downloaded. A broad audio library, account-gated archive, paid
sample source, or middleware dependency would exceed the smallest remaining
M8 boundary.

Decision:

Approve
`plans/2026-08-25-m8-zero-cost-non-speech-audio-mixer.md` as the bounded M8
qualification and implementation plan. Its proposed route uses only exact
CC0 candidates from two Kenney audio packs and five named OpenGameArt
submissions, plus four dependency-free repository-authored PCM WAVs. It uses
native Web Audio and adds no account, credential, environment variable,
runtime service, model, npm/system dependency, metered endpoint, donation,
purchase, free-tier dependency, or recurring cost. Expected and worst-case
authorized monetary cost are USD 0.

Approval authorizes only the exact ignored candidate intake and safety
inspection named in the plan. Every proposed runtime file must then receive
separate user listening approval bound to its SHA-256 before it may enter Git
or an application registry. Changed license, price, login requirement,
unexpected speech, brand identity, recognizable melody, personal information,
unclear provenance, or failed audio quality stops that candidate. No automatic
substitution is allowed.

Keep LessonManifest, CatalogSnapshot, and EvidencePersistence at 0.1.0. Scene
definitions own ambience IDs; a code-owned cue registry owns deterministic
visual/effect/music mappings; manifests continue to carry only registered cue
IDs and exact speech metadata. Build one native learner-unlocked mixer with
master, voice, ambience, effects, and music buses, session-local controls,
voice-priority ducking, bounded loading, visible credits, failure isolation,
background/resume/restart/replay safety, and disposal. Non-speech playback
never creates answer truth, transitions, heard evidence, or persistence writes.

Freesound remains outside the proposed primary route because its official FAQ
requires account login for downloads. Paid packs, optional donations, other
OpenGameArt submissions, other Kenney packs, music libraries, audio
middleware, and final M9 production files remain unapproved.

Consequences:

The user explicitly approved this decision and its complete plan with
`DUYỆT PLAN M8 NON-SPEECH + MIXER`. The exact ignored candidate intake,
safety inspection, deterministic authored-audio generation, and local
listening sheet are now authorized. At this checkpoint, a second exact
listening gate preceded tracked runtime intake or mixer implementation. Removal
requires only bounded local files, registry/source records, and a replacement
lesson revision; it requires no account closure, credential rotation, provider
coordination, database rollback, or manifest migration. The current
speech/text-only path remains the zero-cost fallback.

The 2026-08-25 technical intake checkpoint passes for all seven source rows.
The ignored downloads, page/license snapshots, four bounded archives, 26-file
listening catalog, and four deterministic Bunbun WAVs validate against the
hashes and media facts in
`docs/audio-sources/M8_NON_SPEECH_CANDIDATES_2026-08-25.json`. This checkpoint
did not select a runtime file; D-043 subsequently satisfied the listening gate.

### D-043 — Accept the exact M8 non-speech runtime set and native mixer implementation

- Date: 2026-08-25
- Status: Accepted; implementation and A/B/C manual matrix complete
- Affects: Milestone 8 runtime audio assets, source ledger, Web Audio graph,
  scene ambience, presentation cues, controls, lifecycle, performance budgets

Context:

D-042 authorized bounded candidate intake but required a second user listening
decision bound to exact `assetId + SHA-256` before any binary could enter Git or
the runtime. The candidate sheet exposed 26 validated files: four rain options,
paired alternatives for four Kenney roles, two interface alternatives for each
feedback role, six fixed natural/context files, and four deterministic Bunbun
WAVs.

Decision:

Accept the 16 exact files in
`docs/audio-sources/M8_NON_SPEECH_APPROVAL_2026-08-25.json` and reject the other
10 files recorded there. The accepted set is rain 03, distant road, one
footstep, cat mew and purr, distant rail, pickup 000, soft give 001, wood clue
001, correct 001, incorrect 004, neutral 001, and the four Bunbun-authored
store/station/tension/resolution files. Exact hashes in that approval record
are authoritative; a changed binary is a new candidate and is not approved by
this decision.

Promote only those 16 unchanged binaries into the Vite-owned runtime asset
tree. Keep the rejected files in ignored review staging and out of runtime
registries. The encoded runtime set is 4,958,589 bytes: 3,676,430 ambience,
538,071 effects, and 744,088 music. The first-interaction preload set is
925,841 bytes, below D-042's 1.5 MiB ceiling; the complete set is below its
6 MiB ceiling.

Implement one learner-unlocked native `AudioContext` with master, voice,
ambience, effects, and music buses. Initial session-local gains are 1.00, 1.00,
0.35, 0.65, and 0.20. While cached Aoi/Tanaka speech plays, ambience ducks to
25 percent of its current bus gain and music to 15 percent, with 80 ms attack
and 250 ms release. Scene metadata owns ambience IDs; the code-owned cue
registry owns deterministic visual/effect mappings. Movement, cat selection,
pickup/give, feedback, tension, and completion use bounded one-shots. No
non-speech event may alter answer truth, evidence, checkpoints, or lesson
transitions.

Controls are session-only and do not change EvidencePersistence 0.1.0.
Backgrounding stops voice and transient sources, suspends the context, and
resumes only desired scene loops. Restart and disposal stop stale sources.
Missing or undecodable non-speech files remain optional failures with visible
diagnostics; captions, cached-speech replay, input, and completion remain
usable.

Consequences:

This decision adds no service, account, key, environment variable, runtime
provider, model, package dependency, or recurring cost. All third-party files
remain CC0 with visible voluntary credit; the four generated files are
project-authored. Runtime and unit validators bind the registry to the exact
approval hashes and byte counts. Static/unit/build success establishes the
implementation checkpoint. On 2026-08-27 the user reported `M8 MIX A: PASS`,
`M8 MIX B: PASS`, and `M8 MIX C: PASS`, accepting the planned qualitative
happy-path, optional-file isolation, background/replay/restart, credits, and
session-reset matrix. No numeric loudness, unlock latency, frame impact,
memory, device, or source-growth baseline is inferred from those reports.

### D-044 — Authorize bounded zero-cost M8 world candidate intake

- Date: 2026-08-27
- Status: Accepted by explicit user approval
- Affects: Milestone 8 world intake, Three.js authoring, Kenney candidates,
  cost, licensing, local review, production scene selection

Context:

Parent showcase Milestone 2 is complete under D-043. Milestone 3 now needs one
bounded rainy-evening neighborhood, but D-025 only names initial authoring and
asset candidates and does not approve an immutable source archive or runtime
model. The current runtime remains hard-coded to the technical `park_small`
fixture. D-038 forbids downloading, selecting, or adding even free third-party
assets before a self-contained cost, license, data, operations, fallback, and
removal plan is explicitly approved.

Decision:

Approve `plans/2026-08-27-m8-rainy-neighborhood-world.md`. Authorize intake of
at most the four official individual Kenney asset-page downloads named there:
City Kit (Roads), City Kit (Suburban), Blocky Characters, and Cube Pets. Intake
must remain inside ignored local staging, use the plan's archive/member/byte
safety bounds, retain current official page and included license evidence, and
produce a loopback-only exact 3D review catalog.

Use only the already installed `three@0.185.1` loaders, exporter, controls, and
utilities for qualification and proposed assembly. Do not add Blender,
glTF-Transform, a navmesh/pathfinding package, physics, VFX middleware,
compression tooling, or another asset source. The official Three.js Editor is
optional, authoring-only, non-authoritative, and may receive only public Kenney
assets. It receives no learner or private project data.

Expected and maximum committed financial cost are USD 0. Do not donate, buy
the advertised All-in-One bundle, create an account, accept a trial/free-tier
dependency, provide a credential, or add an environment variable. Abort before
any payment, login, license expansion, or intake-bound increase. No learner
target, lesson text, evidence, save, speech cache, prompt, identifier, or secret
may leave the machine. Ordinary gameplay remains same-origin and offline from
Kenney and threejs.org.

This is the first of two gates. It does not approve a pack wholesale, a source
member, a derived GLB, a catalog ID, or a runtime registration. After technical
qualification, the user must approve or reject every bounded candidate by
exact `assetId + SHA-256`. Assembly and runtime work begin only after that
second decision is recorded.

Consequences:

Candidate intake and local review may proceed with no new recurring operation
or runtime dependency. Failed or changed archives remain unapproved and can be
removed by deleting the bounded staging directory. The technical park, D-043
audio, LessonManifest 0.1.0, evidence data, and SQLite migrations remain
unchanged. If the pinned Three.js route, direct obstacle-free navigation,
license evidence, animation compatibility, or plan budget fails, work stops
and returns for another explicit decision rather than adding a convenient
third party.

### D-045 — Accept the exact M8 rainy-neighborhood visual selection

- Date: 2026-08-27
- Status: Accepted by explicit user approval
- Affects: Milestone 8 world assembly, immutable GLB bundle, actor identities,
  neighborhood layout, runtime registry

Context:

D-044 authorized only bounded ignored intake and local visual review. The user
completed the corrected 55-candidate Three.js review and returned one complete
proposal bound to catalog SHA-256
`a843db08d0c73f25441d349bcf7a73ad765fdab2b246bfba3dbf25c590a95f8b`.
Local validation confirmed 55/55 decisions, every source-member hash, group
cardinality, and distinct Aoi/Tanaka assignments. The proposal packet SHA-256
is `e9b6fa88597815d1178a35c4f63651a4504f212eec1b8fe9b340bf3a380b9390`.
The user explicitly approved that exact packet with `DUYỆT M8 WORLD GATE 2 —
PACKET e9b6fa88597815d1178a35c4f63651a4504f212eec1b8fe9b340bf3a380b9390`.

Decision:

Accept exactly 18 candidates and reject exactly 37. The approved set consists
of all five reviewed road pieces, curved street light, traffic light, building
type N, all seven reviewed park-edge props, character N as Aoi, character Q as
Tanaka, and the cat as Momo. Exact IDs, source members, assignments, and hashes
belong in `docs/world-sources/M8_WORLD_APPROVAL_2026-08-27.json`; that artifact
and its validator are authoritative over this prose summary.

Authorize deterministic assembly, validation, and local runtime registration
of only that exact approved set under
`plans/2026-08-27-m8-rainy-neighborhood-world.md`. Project-authored layout,
unbranded convenience-store accents, simple umbrella-stand geometry, lighting,
fog, rain presentation, stable selectors, and clue anchors may be added within
the approved plan. No rejected model may be copied, embedded, registered, or
used as a visual fallback.

The financial, privacy, and operational boundaries do not change: committed
incremental cost remains USD 0; no account, credential, environment variable,
runtime network request, new dependency, service, model, source pack,
converter, pathfinding system, physics engine, or VFX middleware is approved.

Consequences:

Gate 2 is closed and assembly/runtime work may proceed. A source, member,
texture, catalog, proposal, approval, layout, or derived-output hash mismatch
must stop promotion. A later visual substitution or additional asset requires
a new explicit decision; it cannot inherit D-045 approval. The existing
technical park and LessonManifest 0.1.0 behavior remain regression boundaries.

### D-046 — Approve the fixed-package-first M8 lesson authoring plan

- Date: 2026-08-27
- Status: Accepted by explicit user approval
- Affects: Milestone 8 lesson content, production speech gates, runtime
  capability integration, Milestone 5 boundary

Context:

The technical audio boundary and exact rainy-neighborhood world are complete
and manually accepted, but the runtime capability gate and authored demo still
target the technical park. The first production lesson needs repository-owned
N5/Vietnamese content, exact dialogue, deterministic answer truth, reviewed
speech, and a fixed package before the M7 compiler is allowed to select the
production profile. D-038 also requires the implementation plan to keep cost,
license, data, dependency, and operational effects explicit.

Decision:

Accept `plans/2026-08-27-m8-last-train-lesson-package.md` after the user sent
`DUYỆT PLAN M8 LESSON M4`. Implement one fixed authored
`Three Minutes to the Last Train` package first, then connect the M7 compiler
in parent Milestone 5. Keep the requested targets `財布`, `探す`, and
`～てください`; add only supporting `傘`, `駅`, and `～てはいけない`.
Use a nine-step graph that executes all eight primitives and repeats LISTEN for
Aoi's spoken resolution.

Require two exact user gates. Content Gate 1 binds the six targets, Japanese
and Vietnamese content, four exact Aoi/Tanaka utterances, answer truth,
scaffolds, evidence, and cue intentions to one byte-level SHA-256. It does not
authorize speech generation or runtime activation. After Gate 1 approval,
generate only those exact lines through the already approved local VOICEVOX
Nemo boundary. Speech Gate 2 separately requires listening approval bound to
every immutable WAV hash before the package may activate.

No new service, API, account, credential, environment variable, model,
dependency, visual asset, or non-speech asset is approved. Incremental and
recurring service cost remain USD 0. Ordinary gameplay makes no TTS, LLM,
Custom GPT, provider, or external asset request. LessonManifest and
CatalogSnapshot stay at 0.1.0 unless a separately approved contract change is
proven necessary.

Consequences:

The exact content proposal may now be created and validated, but no generated
speech or production runtime activation may be inferred from plan approval.
The M7 plugin/compiler contract remains unchanged in this milestone. Content
or speech hash drift reopens the applicable gate rather than silently reusing
an older technical artifact.

### D-047 — Approve the exact M8 last-train Content Gate 1 packet

- Date: 2026-08-27
- Status: Accepted by explicit user approval
- Affects: M8 production language content, fixed package authoring, exact local
  speech-generation input, Speech Gate 2

Context:

D-046 authorizes creation of a hash-bound Content Gate 1 proposal but leaves
speech generation and runtime activation false. The deterministic validator
accepts the proposal with six targets, four exact utterances, nine steps, and
all eight primitive identities. Its byte-level SHA-256 is
`5e3cb41ab76b0f02958236c1c2241bc0d6c7e70b35a58996fa9f0072f7c403a6`.

Decision:

Accept that exact packet after the user sent `DUYỆT M8 LESSON CONTENT GATE 1
— PACKET 5e3cb41ab76b0f02958236c1c2241bc0d6c7e70b35a58996fa9f0072f7c403a6`.
The authoritative approval artifact is
`docs/lesson-content/M8_LAST_TRAIN_CONTENT_APPROVAL_2026-08-27.json`.

Authorize construction and validation of the fixed production
CatalogSnapshot/LessonManifest and local generation of only the packet's four
exact utterances with their fixed Aoi/Tanaka profiles. Preserve the packet as
immutable revision-1 input. A wording, target, answer, scaffold, cue intent,
speaker, or voice-profile change requires a new content packet and explicit
hash approval.

Do not activate the production package yet. Every generated WAV remains
`REVIEW_REQUIRED` until the user listens and separately approves its exact
hash at Speech Gate 2. Compiler integration remains parent Milestone 5 and is
not authorized by this decision.

Consequences:

Speech generation may now use only the four exact Japanese strings over the
already approved loopback Nemo boundary. No new provider, service, dependency,
asset, account, credential, environment variable, or cost is introduced.
Runtime gameplay continues to make no provider or synthesis call.

### D-048 — Add bounded deterministic assisted state correction

- Date: 2026-08-27
- Status: Accepted by explicit user approval
- Affects: LessonManifest 0.1.0 semantic validation, lesson controller,
  MOVE_TO/GIVE world state, M8 wrong-path acceptance

Context:

Mapping the D-047 packet into LessonManifest exposed a real compatibility gap.
The packet requires `CONTINUE_ASSISTED` for every bounded step, while the
existing semantic validator recognizes deterministic assistance only through
`RECOGNITION_FALLBACK` or a reducer exposing one accepted object/choice. The
approved ARRANGE, TYPE, MOVE_TO, and GIVE steps each have one exact answer but
cannot use those recognition reducers. Silently changing them to failure
transitions would allow the story to advance while the learner remains at the
wrong location or still carries the wallet.

Decision:

Accept the user's `DUYỆT M8 ASSISTED RECOVERY SEMANTICS`. Preserve the exact
D-047 packet and LessonManifest/CatalogSnapshot schema version 0.1.0. Extend
semantic validation and runtime execution only for a closed deterministic
case: `CONTINUE_ASSISTED` may resolve from answer truth when the interaction
has exactly one accepted sequence, normalized text answer, location, object,
choice, or GIVE pair and its configured scaffold budget has been reached.

ARRANGE, TYPE, CLICK_OBJECT, CHOOSE, and other stateless selections may finish
with assisted feedback after exposing their single accepted truth. PICK_UP
must set the uniquely accepted carried object. MOVE_TO must request and await
movement to the uniquely accepted location before completing the step. GIVE
must transfer the uniquely accepted carried object to the uniquely accepted
recipient before completing the step. These state corrections emit assisted,
not correct, evidence and retain the learner's wrong reaction record.

Keep the acceptance closed: multiple accepted truths without an existing
deterministic reducer remain invalid; an incompatible carried object, failed
assisted movement, unknown target, or missing unique pair remains a visible
error rather than guessed state. Add focused contract and controller tests and
preserve the current technical-park behavior as regression evidence.

Consequences:

The fixed last-train package can retain its approved bounded recovery policy
without changing content hashes or inventing a second lesson graph. This adds
no mechanic, provider, dependency, asset, schema field, environment variable,
or cost. It does broaden accepted 0.1.0 semantic behavior for explicitly
deterministic packages, so tests and runtime capability gating must prevent
unbounded or ambiguous auto-correction.

### D-049 — Approve the exact M8 last-train Speech Gate 2 packet

- Date: 2026-08-28
- Status: Accepted by explicit user approval
- Affects: M8 production speech cache, fixed last-train package activation,
  runtime speech integrity

Context:

D-047 authorized local generation of four exact Aoi/Tanaka utterances but kept
every resulting WAV at `REVIEW_REQUIRED`. The local review packet binds the
displayed Japanese text, fixed voice profile/style, cache key, query SHA-256,
WAV SHA-256, duration, byte length, credit, zero-cost loopback boundary, and
false runtime authority for all four rows. Its byte-level SHA-256 is
`f14d677762915f9c8bc868c7a624f17ac018d9ddb57fec315df9819461ff8d50`.

Decision:

Accept that exact packet after the user sent `DUYỆT M8 SPEECH GATE 2 — PACKET
f14d677762915f9c8bc868c7a624f17ac018d9ddb57fec315df9819461ff8d50`.
The authoritative approval artifact is
`docs/lesson-content/M8_LAST_TRAIN_SPEECH_APPROVAL_2026-08-28.json`, SHA-256
`68164151a7d562f18acc9629db273a98e9791b0f1d9c6423af56ec7e4d8422da`.

Promote only the four exact reviewed rows to immutable `READY`. Authorize the
fixed revision-1 `lesson_m8_last_train` package to activate locally when all
four approved cache rows are available. Bind cached playback to the approved
WAV hashes using the server's immutable SHA-256 ETag; a cache-key, hash,
profile, text, or duration change reopens Speech Gate 2. Preserve captions and
the assisted path for playback interruption after a valid package starts.

Do not authorize M7 compiler integration, runtime synthesis, a different
voice, provider, service, dependency, model, account, credential, environment
variable, or cost. VOICEVOX Nemo remains an authoring-only loopback tool and
is not required during gameplay.

Consequences:

The fixed lesson may now appear in the local library and proceed to M8
Milestone 4 manual A/B/C acceptance. The four ignored WAV artifacts remain
local; repository records contain only stable identities and approved hashes.
Parent Milestone 5 remains the compiler/polish boundary and is not inferred
from this speech approval.

### D-050 — Make beginner guidance explicit and evidence-honest

- Date: 2026-08-28
- Status: Accepted by explicit user approval
- Affects: M8 Last Train launch, lesson presentation, help semantics, evidence

Context:

Manual M8 Lesson scenario A passed, but scenario B exposed a product failure
before its intended wrong/assisted matrix could be evaluated. The required
controls were Japanese-only, Vietnamese support was hidden behind the
Japanese-only `ヒント` control, and a manual help request did not expose a
useful authored pattern, reading, or meaning before the learner became stuck.
The learner repeatedly tried to select a correct answer without understanding
the expected interaction. This violates the low-friction and no-trap gameplay
principles; it is an onboarding failure rather than learner failure.

Decision:

Accept the user's `DUYỆT PLAN M8 BEGINNER GUIDANCE` and the focused plan at
`plans/2026-08-28-m8-beginner-guidance-recovery.md`. Give the fixed M8 Last
Train package two local presentation choices: recommended `GUIDED` Vietnamese
support and optional `IMMERSIVE` Japanese-first challenge. Keep Japanese first
in the visual hierarchy, but make every required control bilingual and show a
short Vietnamese operational cue derived only from the fixed primitive type.

In guided mode, opt into the existing help state on every step before an
assessed response. Show only current manifest-owned support, Japanese text,
and the first relevant authored textual pattern, reading, or meaning hint.
Classify later success as assisted. Immersive mode keeps support hidden until
the learner explicitly requests it; that request has the same assisted
semantics. `afterAttempt` remains the sole authority for automatic candidate
reduction, highlighting, and deterministic state correction. Manual help must
not add a premature active scaffold ID to an attempt-zero checkpoint.

Consequences:

The M8 beginner path becomes understandable without changing the approved
story, Japanese dialogue, answer truth, lesson graph, target bindings, world,
speech hashes, non-speech catalog, contract schema, or runtime primitive set.
Unaided and supported evidence remain distinguishable. This adds no provider,
dependency, model, asset, account, credential, environment variable, data
transport, recurring operation, or cost. On 2026-08-28, the user reports
`M8 LESSON B RETEST: PASS`, accepting the repaired guided beginner path and
ordinary replay/study controls. The later `M8 LESSON C: PASS` report accepts
the remaining lifecycle/failure matrix and closes parent Milestone 4 under
D-053.

### D-051 — Repair replay idempotency and approve local Japanese study-tool qualification

- Date: 2026-08-28
- Status: Accepted by explicit user approval
- Affects: M8 lesson runtime, evidence, Japanese learning UI, reference-data
  authoring, dependencies, local data, licenses

Context:

The first D-050 guided retest exposed a cached-speech replay failure rather
than a voice-engine failure. `AUDIO_STARTED` recreated the stable HEARD event
identity with a new timestamp and active latency. SQLite correctly rejected
the changed immutable payload and the lesson entered `RUNTIME_LESSON_FAILED`.
The same retest also showed that beginners need optional pronunciation,
vocabulary, and grammar support adjacent to Japanese content. D-038 forbids
downloading a convenient dictionary or NLP package without a complete cost,
license, data, and removal plan.

Decision:

Accept the user's `UYỆT PLAN M8 JAPANESE TEXT TOOLS + REPLAY FIX` as the
unambiguous approval of
`plans/2026-08-28-m8-japanese-text-tools-and-replay-recovery.md`; the missing
initial `D` is a typing omission in a direct response to the requested exact
phrase.

Keep one stable HEARD event per session, LISTEN step, and assessed target.
Distinguish first playback, replay, failure-before-start, and interruption-
after-start in the deterministic controller using existing state. Do not
weaken the server's full-payload fingerprint rejection and do not migrate the
evidence contract or SQLite schema.

Add compact play, reading, vocabulary, and grammar controls for the fixed M8
Japanese content. Opening reading/vocabulary/grammar support makes subsequent
assessment assisted; replay alone does not. Enable play only where exact text
already maps to a D-049-approved cached WAV. Missing speech fails visibly and
never invokes browser SpeechSynthesis, Nemo, or a remote source.

Keep language analysis outside gameplay. Approve exact authoring-only intake
of `kuromoji@0.1.2` and `wanakana@5.3.1`, with all Apache-2.0, MIT, IPADIC,
ICOT, copyright, redistribution, and no-warranty notices retained. Approve one
bounded ignored download of the JMdict English-without-examples candidate for
hash/license review only. JMdict-derived entries remain prohibited from the
repository and runtime until a second exact source/version/hash/selection
packet is approved. Runtime receives only a compact reviewed text-study
catalog; it does not bundle the tokenizer, transliterator, or full dictionary.

Expected and worst recurring provider cost are USD 0. Add no account,
credential, environment variable, metered API, remote runtime, model, new
voice, or paid/free-tier dependency. Grammar remains Bunbun-authored. Yomitan
application code, Tae Kim content, Bunpro content/extractions, Sudachi, and an
unlicensed Japanese-Vietnamese dictionary remain excluded.

Consequences:

Replay can be repaired without invalidating existing sessions or evidence.
The approved intake creates new authoring dependencies and ignored candidate
data but no runtime service or learner-data flow. O-009 is only partially
addressed: exact M8 study records may be built from Bunbun-owned data, while
production JMdict-derived data and broader Japanese reference coverage remain
behind the second approval gate and documented update obligations.
On 2026-08-28, the user reports `M8 LESSON B RETEST: PASS` after exercising
ordinary repeated replay plus the play, reading, vocabulary, and grammar
controls. Reload/resume, background interruption, and simulated audio-failure
coverage were assigned to scenario C rather than inferred from B. The user's
later `M8 LESSON C: PASS` report accepts those remaining paths under D-053.

### D-052 — Require explicit guided correction for TYPE and preserve actor visibility

- Date: 2026-08-28
- Status: Accepted by explicit user approval
- Affects: TYPE assisted semantics, lesson UI, evidence persistence, M8 world
  layout, Milestone 4 manual acceptance

Context:

Manual beginner testing showed that the M8 TYPE step advanced after the second
wrong sentence. This was the D-048 `CONTINUE_ASSISTED` behavior, not a
normalization defect, but it taught neither correction nor production. The
same test screenshot showed the accepted park tree composition obscuring Momo
and Bunbun at the fixed isometric camera.

Decision:

Accept the user's `DUYỆT PLAN M8 TYPE GUIDED RETRY` and the attached visibility
repair request through
`plans/2026-08-28-m8-type-guided-retry-and-visibility.md`.

Supersede only D-048's automatic assisted completion for TYPE. A wrong TYPE
submission never transitions. Authored reactions remain bounded by
`maximumAttempts`; the final wrong attempt exposes the final scaffold and
enters an explicit guided-correction state. Later corrections may continue
locally without reusing reaction event identities. The learner sees the exact
model sentence and may fill it into the input, but must still submit a
normalized accepted answer. A correct post-limit correction completes the
step as `ASSISTED` without claiming another unaided production reaction. Raw
TYPE text remains unpersisted, and the existing attempt/checkpoint schema is
unchanged. All non-TYPE deterministic D-048 recovery behavior remains intact.

Revise only the two project-authored decorative tree transforms that cross the
Momo/player sight lines. Keep the exact D-045-approved source assets, actor,
object, location, camera, navigation, and catalog identities unchanged. Record
the deterministic result as layout/runtime bundle `1.0.1` with a new static
GLB and runtime hash.

Consequences:

Wrong text can no longer masquerade as progress. Assisted completion remains
evidence-honest and resumable without a contract migration; post-limit wrong
edits are deliberately presentation-only rather than additional evidence.
The world remains within the accepted source/license/performance envelope.
No provider, dependency, service, account, credential, environment variable,
data transfer, or cost is added. On 2026-08-28, the user reports
`M8 D-052 TYPE: PASS` and `M8 D-052 VISIBILITY: PASS`, manually accepting the
guided correction and revised sight lines under D-011. These results do not
close the separate D-051 lifecycle/failure scenario C matrix. Ordinary replay/
study behavior and the repaired guided scenario B were accepted later through
`M8 LESSON B RETEST: PASS`; scenario C was subsequently accepted under D-053.

### D-053 — Accept the complete M8 fixed-lesson manual matrix and close Milestone 4

- Date: 2026-08-28
- Status: Accepted by explicit user-reported manual results
- Affects: M8 fixed Last Train lesson, D-050/D-051 recovery, parent Milestone 4

Context:

The original fixed Last Train happy path passed as `M8 LESSON A: PASS`.
Beginner scenario B initially failed and led to D-050 through D-052. After the
approved repairs, the user reported `M8 LESSON B RETEST: PASS`. The remaining
scenario C checklist explicitly covered reload/resume, background interruption,
replay recovery, simulated Japanese-audio failure, assisted text continuation,
and full lesson completion.

Decision:

Accept the user's `M8 LESSON C: PASS`. Together with the previously recorded A,
repaired B, D-052 TYPE, and D-052 visibility results, this completes the exact
manual A/B/C matrix for the repository-owned M8 revision-1 Last Train package.
Close parent M8 Milestone 4 and advance planning to Milestone 5 compiler
integration and polish.

Consequences:

The fixed package is manually accepted for its named local checklist. Scenario
C confirms that the learner can resume, recover from background interruption,
replay without a runtime identity failure, and complete through visible
assisted text when Japanese speech is unavailable. No numeric performance,
additional browser/device, production release, compiler-generated lesson,
deployment, provider, or broader language-coverage claim is inferred. M8 itself
remains in progress until Milestones 5 and 6 are planned, implemented, and
accepted.

### D-054 — Select the accepted Last Train package through an approved compiler profile

- Date: 2026-08-29
- Status: Accepted by explicit user approval
- Affects: M8 Milestone 5, compiler lifecycle, published lesson library, Last Train launch

Context:

The D-053 Last Train revision is a byte-identical, manually accepted,
project-authored package. The M7 compiler supports only the park target set and
its manual authoring handoff. Passing Last Train through that prompt route
would generate different reviewed language, reopen content/study/speech gates,
and falsely imply that the accepted package was produced by a GPT. The user
approved `PLAN M8 MILESTONE 5 — APPROVED PROFILE SELECTION` after reviewing the
zero-cost integration plan.

Decision:

Add one deterministic `m8_last_train_approved_v1` compiler profile. The exact
requested set `財布 + 探す + ～てください`, including its reviewed readings and
wave-dash aliases, selects the immutable `lesson_m8_last_train` revision 1
package. Selection creates a local review candidate, retains explicit publish,
and links the published compilation to the existing immutable lesson revision.
The manifest keeps truthful `AUTHORED` provenance and an empty prompt-module
list; compiler-selection lineage is stored on the compilation record.

The profile requires all three requested targets, rejects partial, duplicate,
unknown, and mixed-profile input, and never exports an authoring request or
imports a GPT result. Published Last Train offers recommended guided and
optional immersive launch only when its four exact approved speech rows are
ready. Existing M7 park authoring and the direct fixed-package regression route
remain available.

Consequences:

Milestone 5 demonstrates target-to-approved-package selection, review,
publication, and local play. It does not demonstrate freeform AI generation or
requalify the waived M7 transport. No accepted content, study data, speech,
world, camera, animation, or mix identity changes. No service, API, model,
dependency, asset, download, account, credential, environment variable,
learner-data transfer, incremental charge, or recurring cost is added. Any
future GPT-authored Last Train variation requires a separate plan and new
content/study/speech approval gates.

### D-055 — Close M8 with the remaining compiler-regression checks waived

- Date: 2026-08-29
- Status: Accepted by explicit user direction
- Affects: M8 Milestones 5 and 6, manual regression evidence, roadmap handoff

Context:

The approved-profile implementation passes its supported static, unit,
integration, schema, approval-hash, asset, and production-build checks. The
user manually accepted scenario A, every scenario B subcase, the mission-card
repair, and scenario C1's unchanged M7 authoring-handoff route. C2 through C6
would repeat direct-M8, park/demo, resume/background, renderer/layout, and
failure-control regression checks after the compiler-linked integration.

Decision:

Accept the user's instruction `không cần test, làm tiếp` as an explicit waiver
of manual C2 through C6. Record those checks as `WAIVED_BY_USER`, never as
`PASS`. Close focused M8 Milestone 5 with A, B, and C1 accepted plus the
remaining regression scope waived. Complete parent Milestone 6 as a durable
handoff of the existing implementation checks, provenance, measurements,
manual evidence, known warnings, and explicit waiver; add no further test or
implementation work solely to satisfy that handoff. Close Milestone 8 and move
planning to Milestone 9.

Consequences:

The compiler-linked direct-M8 default-mode check, published park/authored-demo
isolation check, compiler-linked reload/background check, additional forced-
WebGL2 narrow/wide check, and combined manifest/asset/persistence/failure
control check remain unverified in this focused matrix. Earlier fixed-lesson,
world, mixer, persistence, failure, renderer, and build evidence remains valid
only for its recorded scope and is not relabeled as the skipped C2–C6 proof.
No service, dependency, provider, model, asset, account, credential,
environment variable, learner-data transfer, or cost is added. This waiver
does not satisfy or weaken the later local release-candidate acceptance gate.

### D-056 — Approve the learner-facing M9 product-slice polish boundary

- Date: 2026-08-29
- Status: Accepted by explicit user approval
- Affects: M9 product shell, completion recap, reaction cadence, acceptance

Context:

M8 already delivered and approved the first rainy-neighborhood world, fixed
Last Train lesson, speech, complete audio runtime, compiler-linked package,
beginner support, Japanese study tools, evidence, and resume. Rebuilding those
inputs in M9 would reopen hash-bound content, speech, audio, and world gates
without improving the learner experience. The remaining root page still mixes
learner actions with speech authoring, transport warnings, destructive cache
controls, and technical regression routes, while completion exposes no compact
learning recap or reaction-density observation.

Decision:

Accept `plans/2026-08-29-m9-first-product-slice-polish.md` after the user sent
`DUYỆT PLAN M9 PRODUCT SLICE`. Reuse the exact accepted M8 package and runtime
identities unchanged. Make the ordinary root page learner-first and move
speech-generation, technical regression, transport, diagnostics, and local
data controls behind an explicit development surface. Preserve compiler
review, publication, library launch, and recovery routes.

Add a local current-session completion recap from existing privacy-minimized
evidence. It may report target exposure, correct/incorrect reactions,
assisted/unaided outcomes, active time, reactions per active minute, and
median/p95 active-time gaps. It must not claim mastery, percentage grading,
JLPT readiness, or persist raw TYPE text. Add replay and return-to-library
actions without a new persistence schema.

Use the plan's representative local thresholds: warm scene ready at most 500
ms, warm first Japanese stimulus at most 2,000 ms, picking at most 100 ms,
fewer than 100 draw calls, at least 45 FPS with 60 preferred and p95 at most
33.3 ms, guided cadence at least 4 reactions/minute, immersive cadence at
least 5, and median inter-reaction gap at most 15 seconds. These are named-run
M9 acceptance thresholds, not broad browser/device guarantees.

Consequences:

M9 adds no dependency, service, provider, model, asset, utterance, account,
credential, environment variable, external learner-data flow, or cost. It
does not add NPC simulation, a primitive, realtime AI, a timer, or a second
lesson package. Browser validation remains user-run under D-011; Docker and
deployment remain deferred under D-015. Any accepted content/audio/world byte
change requires its own existing approval gate.

### D-057 — Count one meaningful reaction per learner attempt

- Date: 2026-08-29
- Status: Accepted by explicit user approval
- Affects: M9 cadence, completion recap, runtime diagnostics

Context:

The user's first M9 completion screenshot reached 9/9 but showed 19 reactions,
15.0 reactions/minute, and a 0.0-second median gap. One learner attempt can
assess multiple targets, and the evidence layer intentionally writes one
REACTION row per target binding. Counting each row as a separate learner
reaction therefore inflates cadence and creates simultaneous zero-length gaps.

Decision:

Accept `DUYỆT PLAN M9 CADENCE DEDUP`. Preserve every target-level evidence row
and the EvidencePersistence schema unchanged. For learner-facing counts,
correct/wrong summaries, and cadence only, group REACTION rows by
`sessionId + stepId + attempt`. One group is one meaningful learner reaction.
Timestamp that group once in the current active visit. If inconsistent target
rows ever disagree on correctness, classify the grouped attempt conservatively
as incorrect rather than inventing a successful reaction.

Consequences:

The completion recap and diagnostics describe learner attempts while SQLite
retains target-level evidence for progress analysis. Existing event IDs,
idempotency, target coverage, step results, checkpoints, content, audio, world,
and package identities do not change. This adds no migration, dependency,
service, provider, model, asset, external data flow, or cost. The first
15.0/minute screenshot remains an invalid observation and must be retested.

### D-058 — Waive the corrected M9 cadence browser retest

- Date: 2026-08-29
- Status: Accepted by explicit user direction
- Affects: D-057 manual verification, M9 cadence acceptance evidence

Context:

D-057 is implemented and passes its supported static, unit, schema, and build
checks. Accepting the corrected numeric cadence would normally require a fresh
guided and immersive browser run because the first 15.0/minute screenshot used
the superseded target-row counting semantics.

Decision:

Accept the user's instruction `bỏ qua kiểm tra phần này` as a waiver of the
fresh guided and immersive D-057 cadence retest. Record the manual result as
`WAIVED_BY_USER`, not `PASS`. Do not reuse the first screenshot as corrected
cadence evidence and do not infer that D-056's numeric cadence thresholds were
met.

Consequences:

The attempt-deduplication implementation and automated evidence remain valid,
but M9 has no accepted named manual cadence measurement. This waiver adds no
code, dependency, service, provider, model, asset, external data flow, or cost,
and does not weaken a later local release-candidate acceptance gate.

## Deferred decisions

These are acknowledged but not yet ready to decide:

| ID    | Decision needed                                                                                  | Resolve before                    |
| ----- | ------------------------------------------------------------------------------------------------ | --------------------------------- |
| O-008 | Browser/device support and WebGPU fallback policy                                                | Rendering foundation              |
| O-009 | Production kanji and Japanese reference datasets and licenses beyond the D-034 technical fixture | Production reference integration  |
| O-010 | Contextual M9 audio linkage beyond the D-049 approved M8 utterances                              | M9 world/lesson linkage           |
| O-012 | Deployment model and Docker topology                                                             | Post-acceptance release discovery |

Deferred decisions must be discussed when they become material. They should
not be filled with convenient defaults during unrelated work.
