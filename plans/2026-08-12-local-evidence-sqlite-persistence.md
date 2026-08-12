# Persist local evidence and resume safe lesson boundaries

Status: Complete
Owner: Codex and user
Created: 2026-08-12
Last updated: 2026-08-12 12:35 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Make the accepted eight-primitive lesson durable across reloads and local
server restarts. A learner can stop during a lesson, reopen Bunbun, choose to
resume the same session at a safe interaction boundary, and complete it without
losing or duplicating evidence. Starting again intentionally abandons the old
session. A completed session remains completed after reload.

The local app stores validated lesson revisions, sessions, evidence events,
checkpoints, and one small anonymous preference record in server-owned SQLite.
It derives a conservative per-target signal that distinguishes insufficient
evidence, needs review, and developing progress without claiming mastery or
scheduling a lesson. The learner can visibly delete all local learning data.

This milestone proves local durability and recovery. It does not add accounts,
cloud sync, analytics transport, AI compilation, production TTS, canonical
cross-lesson mastery, adaptive scheduling, deployment, or multiple learners.

## Repository context

Milestones 0 through 5 are complete at commit `da0b519`. The web loads one
repository-owned validated LessonManifest/CatalogSnapshot package and runs all
eight fixed primitives through `apps/web/src/lesson/controller.ts`.
`apps/web/src/lesson/events.ts` creates exposure, heard, reaction,
step-completed, and lesson-completed records with session-local event IDs.
`InMemoryEventSink` deduplicates those IDs only until reload.

`apps/web/src/lesson/runtime.ts` owns the active clock, applies controller
effects, creates a random session UUID, and replaces the entire event sink and
world state when Restart is clicked. There is no restore function, durable
checkpoint DTO, asynchronous persistence port, progress view, or storage error
boundary. The controller does not retain completed GIVE transfers after carry
is cleared, so a restored world cannot yet reconstruct that presentation.

`apps/server/src/index.ts` is one small `node:http` process with only GET
`/health` and JSON 404. There is no request-body parser, API router, database,
migration, server test, or shutdown-owned storage resource. The root test
command currently runs 18 contract tests and 28 web tests but no server suite.

Node.js 24.18.0 in the repository toolchain exposes built-in `node:sqlite`
against SQLite 3.53.1. This supports the small local single-process workload
without an ORM or another runtime dependency. The login shell still needs
`nvm use` because system Node.js 18 does not provide the approved toolchain.

D-001, D-002, D-004, D-005, D-010, D-011, D-013, D-015, D-017, D-019, and
D-020 govern the work. Accepted D-021 resolves O-003, O-007, and O-011 for this
milestone. The user approved it and this ExecPlan before persistence
implementation began.

The canonical repository is `/home/nunu/Desktop/nnlab/nn-bunbun`. Planning
starts from a clean worktree at `da0b519`. Publishing changes is outside this
plan.

## Scope

### In scope

- Keep LessonManifest and CatalogSnapshot at 0.1.0.
- Add an independent EvidencePersistence 0.1.0 TypeBox contract and generated
  JSON Schema artifact for persisted events, checkpoints, session lifecycle,
  API requests/responses, preferences, and target summaries.
- Move the persistence-safe event vocabulary into the shared contracts
  boundary while keeping event construction and lesson truth in the web
  controller.
- Remove learner TYPE text from persistent response fields and event IDs.
  Persist only correctness/evidence metadata for TYPE and authored stable IDs
  for closed world, choice, token, location, object, and recipient responses.
- Keep client occurrence time and add server receipt time. Bound every string,
  array, duration, and payload size in the persistence contract.
- Use built-in `node:sqlite` DatabaseSync in the Node server with a repository-
  local ignored `.bunbun-data/bunbun.sqlite` file and injected temporary paths
  in tests.
- Add ordered code-owned migrations with IDs and checksums, a migration ledger,
  foreign keys, WAL, busy timeout, explicit transactions, and rejection of
  unknown-newer or checksum-mismatched schemas.
- Store immutable lesson-package revisions, anonymous local play sessions,
  append-only events, idempotent commit receipts, one versioned checkpoint per
  session, and one local preference row.
- Canonicalize and fingerprint each validated manifest/catalog package. Reject
  different content that reuses an existing lesson ID and revision.
- Validate the complete manifest/catalog package on the server before first
  persistence, then validate every event and checkpoint against its stored
  lesson revision and session identity.
- Add testable `node:http` routing and JSON parsing without selecting a backend
  framework or compiler job model.
- Add same-origin `/api/v1` routes for session creation, resumable-session
  lookup, atomic commits, abandonment, target summary, local preferences, and
  confirmed local-data reset.
- Add a Vite development proxy for `/api/v1` to the existing loopback server.
  Do not add CORS, a frontend API-base environment variable, or a deployment
  topology.
- Add a browser `EvidenceStore` port and HTTP adapter. Do not silently fall
  back to memory if durable storage is unavailable.
- Commit event batches and their resulting checkpoints in one SQLite
  transaction. Use a unique commit ID and expected checkpoint sequence so
  retries are idempotent and stale tabs fail with a visible conflict.
- Extend pure lesson state with only the durable world projection needed for
  recovery, including carried object and completed object-recipient transfers.
- Add a closed checkpoint serializer/validator/restore function rather than
  storing arbitrary `LessonState` JSON.
- Persist interaction boundaries and help/audio/feedback lifecycle boundaries,
  but not every keystroke or unsubmitted token movement.
- Clear unsubmitted TYPE text on restore. Rebuild ARRANGE from authored token
  IDs only when it was part of a committed boundary. Normalize interrupted
  audio and movement into safe awaiting states and settle feedback
  idempotently.
- Restore the active-time offset, completed steps, attempts, scaffolds, carry,
  transfers, and completion state without replaying evidence.
- Show an explicit Resume or Start again panel for a compatible active session.
  Never merge two sessions silently.
- Mark the prior session ABANDONED when Start again or Restart is chosen, then
  create a fresh session atomically.
- Add a small learner-facing local-data panel that explains local-only storage,
  exposes the current persistence state, and requires confirmation before
  deleting all local learning data.
- Add a local preference for resume behavior, defaulting to `ASK`; any saved
  choice remains local and contains no identity.
- Derive lesson/revision/target-scoped `INSUFFICIENT_EVIDENCE`, `NEEDS_REVIEW`,
  or `DEVELOPING` summaries from stored events. Do not store or expose a mastery
  percentage.
- Add a privacy-safe storage inspector that reports migration version, row
  counts, session status, and checkpoint sequences without printing learner
  response content.
- Add focused contracts, server persistence/API, and web controller/adapter
  tests plus a complete manual reload, restart, multi-tab, deletion, privacy,
  and Milestone 5 regression matrix.

### Out of scope

- Browser SQLite, IndexedDB, localStorage, sessionStorage, OPFS, service
  workers, offline-first synchronization, or a second local source of truth.
- An ORM, query builder, database daemon, hosted database, Redis, queue, or
  general event-sourcing framework.
- A new backend framework or the compiler job-model decision O-006.
- A new environment variable. `PORT` remains the only runtime environment name
  in the local foundation.
- Accounts, names, email, authentication, authorization, cookies, device
  fingerprinting, IP/user-agent retention, multiple local learners, or cloud
  ownership.
- Analytics or evidence transport, telemetry vendors, remote logging, consent
  flows for a network service, or production retention policy.
- Raw or normalized TYPE answer persistence, prompt text entered by a learner,
  arbitrary DOM state, audio buffers, canvas state, or Three.js object graphs.
- A `MASTERED` state, numeric ability score, spaced-repetition scheduler,
  automatic weak-target lesson selection, cross-lesson aggregation, or
  revision merging. Milestone 10 owns adaptation.
- Changing LessonManifest completion semantics. Correctness and mastery remain
  independent from completing a lesson.
- Persisting an in-flight movement destination, partial audio playback time,
  unsubmitted TYPE draft, or every ARRANGE button action. Recovery occurs at a
  reviewed safe boundary.
- AI compilation, production TTS/cache, final product content, reference-data
  integration, new primitives, or RECOGNITION_FALLBACK execution.
- Production static hosting, Docker, deployment, backup, encryption-at-rest,
  domain configuration, multi-process SQLite writers, or release automation.
- Automated browser E2E tooling under D-011.

## Decisions and constraints

- Accepted D-021 governs the implementation. The user approved the decision and
  this plan on 2026-08-12 before persistence code changed.
- The server is the only SQLite owner. The browser uses a typed service port and
  never sees a file path or SQL statement.
- Normal local storage uses `.bunbun-data/bunbun.sqlite`, ignored by Git. Tests
  use `mkdtemp` paths under the system temporary directory and clean only the
  exact directories they created.
- No new environment variable is proposed, so no variable-name confirmation is
  required. A future deployment path is explicitly deferred to D-015/O-012.
- Database migrations are forward-only and transactional. Startup never edits
  an applied migration, guesses a newer schema, or destroys incompatible data.
- An immutable lesson revision is identified by lesson ID, revision, contract
  version, and canonical package fingerprint. Same identity plus different
  content is an error.
- One local anonymous profile owns progress. This is not an account and cannot
  support two learners sharing the same checkout.
- The event log is append-only. Updates occur only to session lifecycle,
  checkpoint, preference, and idempotent-commit records.
- A commit contains `commitId`, `expectedSequence`, zero or more evidence
  events, and exactly one checkpoint. SQLite inserts the events, validates the
  expected sequence, updates the checkpoint/session, and records the commit
  receipt in one transaction.
- Retrying the same commit returns its previous success. Reusing a commit ID
  with a different payload is an error. A different commit against an old
  sequence returns a stable conflict and does not partially insert events.
- Session and event UUID/idempotency values are generated in the client, but
  the server verifies their bounded syntax and their relation to the session,
  step, target, lesson, and revision.
- Event IDs no longer contain submitted answer text. One reaction is uniquely
  identified by session, step, attempt, target, and event kind.
- Persisted closed responses use stable authored IDs. TYPE stores no response
  text, even when the text was normalized before in-memory evaluation.
- Server receipt time, not client wall-clock time, drives database ordering and
  any later approved retention rule. Client occurrence time remains diagnostic
  context.
- Data is retained locally until explicit confirmed reset. There is no hidden
  upload or automatic deletion policy in this technical milestone.
- Resume defaults to an explicit choice. `ASK` may later be changed only by a
  deliberate local preference action.
- The checkpoint is a versioned DTO containing IDs, counters, durable flags,
  pending transition kind, active elapsed time, carry, and transfer projection.
  Authored text and derived candidate/display fields are reconstructed from the
  validated manifest.
- A restored `MOVING_TO_LOCATION` checkpoint returns to `AWAITING_LOCATION`
  without an attempt. A restored `PLAYING_AUDIO` checkpoint returns to the
  appropriate replay/continue boundary without duplicating heard evidence. A
  restored `FEEDBACK` checkpoint retains its closed pending action and settles
  through the reducer once.
- The TYPE draft is always empty after reload. ARRANGE state is retained only
  when the checkpoint containing stable token IDs was durably committed; no
  arbitrary display text is stored.
- World recovery is a projection of controller checkpoint data. Three.js still
  cannot decide evidence, correctness, session truth, or persistence.
- Persistence failure blocks further evidence-producing input and enters a
  recoverable error boundary. The app never labels unsaved progress as saved.
- Target summaries aggregate only one `(lessonId, revision, targetId)`.
  Exposure/heard events do not clear weakness; assisted results are never
  unaided; `DEVELOPING` requires two later unaided correct assessments in two
  distinct contexts after the most recent incorrect or assisted result.
- No summary state is a mastery declaration, no signal blocks completion, and
  no scheduler consumes the signal in Milestone 6.
- D-011 keeps browser testing manual. Node tests may cover contracts, SQLite,
  HTTP, serialization, restore, idempotency, and aggregation.
- D-015 keeps Docker and deployment out of scope because the local release
  candidate gate is not yet satisfied.

## Implementation approach

### Shared persistence contract and privacy-safe events

Add `packages/contracts/src/schema/evidence-persistence.ts` and export its
TypeBox schemas/types through the package. Give the contract its own
`EVIDENCE_PERSISTENCE_SCHEMA_VERSION = "0.1.0"`; it does not change the
LessonManifest version. Generate and drift-check
`schemas/evidence-persistence-0.1.0.schema.json`.

Define strict closed schemas for EvidenceEvent, LessonCheckpoint,
TransferredObject, session create/commit/resume/abandon payloads, preferences,
storage summary, target evidence summary, and structured API errors. Use
bounded RFC 3339 timestamps, UUID-like opaque strings, Bunbun IDs where the
manifest already requires them, nonnegative integer times, and closed enum
values. Compile shared structural validators just as the manifest and catalog
validators are compiled today.

Replace `submittedValue` in the durable event shape with an optional array of
authored response IDs. ARRANGE records ordered token IDs; CLICK_OBJECT,
MOVE_TO, PICK_UP, and CHOOSE record one authored ID; GIVE records the object and
recipient IDs in a defined order. TYPE records correctness, evidence, attempt,
support, and timing but no entered text. Change reaction event IDs to depend on
session, step, attempt, target, and kind rather than response content. Keep an
in-memory sink implementation behind the same port for focused reducer tests,
but production lesson startup must use the HTTP store.

### SQLite lifecycle, migrations, and repository

Create small server modules under `apps/server/src/persistence/` for database
opening, pragmas, migration execution, canonical JSON fingerprinting,
repositories, transaction boundaries, target aggregation, and privacy-safe
inspection. Keep the listen entry separate from a testable application/router
factory.

The first migration creates:

- `schema_migrations` with migration ID, checksum, and applied time;
- `lesson_revisions` keyed by lesson ID/revision with contract versions,
  canonical package fingerprint, manifest JSON, catalog JSON, and creation
  time;
- `play_sessions` with anonymous profile, lesson identity, ACTIVE/COMPLETED/
  ABANDONED status, checkpoint sequence, active time, and lifecycle times;
- `session_events` keyed by event ID with typed evidence columns, authored
  response-ID JSON when permitted, client occurrence time, and server receipt
  time;
- `session_checkpoints` keyed by session ID with checkpoint contract version,
  sequence, closed JSON payload, and update time;
- `session_commits` keyed by commit ID with payload fingerprint and resulting
  sequence; and
- `local_preferences` keyed by the single anonymous profile with resume mode
  and update time.

Create indexes for active-session lookup, event/session order, target summary,
and commit lookup. Apply `foreign_keys = ON`, WAL, and busy timeout when opening
a file database. The migration runner calculates a SHA-256 checksum over each
code-owned migration, runs unapplied migrations in order, and rejects changed
or unknown-ahead migration state. Startup closes the database on SIGINT,
SIGTERM, or failed initialization.

The repository validates all data before SQL. Session creation validates the
manifest/catalog package with the existing full validator, checks the package
fingerprint, inserts or confirms the immutable lesson revision, then inserts
the initial session, exposure events, and checkpoint atomically. Commits verify
stored session/package identity, event/checkpoint references, expected
sequence, and completion constraints before mutation.

Target summary is derived from persisted evidence rather than maintained as a
second mutable truth. Order results by server receipt sequence, find the most
recent incorrect or assisted assessment, and require two subsequent unaided
correct assessments in distinct contexts before returning `DEVELOPING`.

### Narrow local HTTP boundary

Refactor the Node entry so `createBunbunServer` receives a repository and clock
for tests. Keep GET `/health`. Add bounded JSON parsing, content-type checking,
method/path routing, stable error JSON, and no-store headers for:

- `POST /api/v1/sessions` — validate a package and atomically create the
  initial session/commit;
- `GET /api/v1/resumable-sessions?lessonId=...&revision=...&fingerprint=...` —
  return the compatible active checkpoint or no result;
- `POST /api/v1/sessions/:sessionId/commits` — idempotently append events and
  advance one checkpoint sequence;
- `POST /api/v1/sessions/:sessionId/abandon` — close an active session without
  deleting evidence;
- `GET /api/v1/progress?lessonId=...&revision=...` — return privacy-safe target
  summaries;
- `GET` and `PUT /api/v1/preferences` — read/change only the closed resume
  preference;
- `GET /api/v1/storage-summary` — return schema version and counts without
  response content; and
- `DELETE /api/v1/local-data` — require the exact confirmation field and delete
  all local learning rows transactionally while retaining migrations.

Reject oversized bodies, malformed JSON, unknown fields, mismatched IDs,
unsupported versions, stale sequences, conflicting immutable revisions, and
database failures with stable codes. Do not enable broad CORS. Add
`apps/web/vite.config.ts` so development `/api/v1` requests proxy to the
existing loopback server. Production hosting remains deferred.

### Browser store, commit serialization, and recovery

Add `apps/web/src/persistence/port.ts`, an HTTP adapter, checkpoint mapper, and
recovery coordinator. The port exposes lookup, create, commit, abandon,
preference, progress, summary, and reset operations using shared contract
types. Use one serialized promise queue per active session so callbacks cannot
reorder commits.

Change lesson bootstrap into three explicit branches: no compatible active
session creates a fresh durable session; a compatible active session renders a
Resume/Start again choice; a completed session checkpoint restores completion.
Start again first abandons the old active session, then creates a new session.
If either operation fails, show a recoverable storage error rather than
starting an untracked in-memory game.

Add checkpoint mapping separate from LessonState. The mapper validates every
step/token/scaffold/object/entity reference against the current manifest,
normalizes transient phases, clears TYPE text and pending movement, and returns
a state that the pure reducer can continue. Extend ActiveClock with a validated
initial active-time offset.

Replace the production InMemoryEventSink application path with durable commit
effects. Event-bearing controller updates always commit their events and the
resulting checkpoint together before world mutations or the next learner input
are enabled. Add explicit checkpoint requests for help, audio completion,
feedback settlement, completion, and other safe state changes that have no
new evidence event. Do not commit ordinary TYPE input changes or each token
button action.

When a commit is pending, show a small saving state and disable world/DOM
submissions that could produce another outcome. On acknowledgment, update the
local sequence, apply remaining world effects, and continue. A retry resends the
same commit ID. A stale-sequence conflict stops the current tab and offers
reload from the server checkpoint; it never overwrites the other tab.

### World projection, progress signal, and local-data controls

Extend controller state with a small immutable list of completed object-
recipient transfers. Correct GIVE appends the pair while clearing carry.
Restart clears the list. The checkpoint stores carry and transfer IDs; world
restore resets authored transforms, then reapplies transfers and carry in a
deterministic order before input is enabled.

Add a compact resume card and local-data panel to the DOM shell. The resume card
states the lesson and last safe step, then offers Resume or Start again. The
data panel says that data stays in the local Bunbun SQLite file, shows counts
and the target signal without raw events, exposes the `ASK` preference, and
requires a second confirmation before reset. Reset disposes the active runtime,
deletes server data, resets world/UI state, and creates a new session only after
the deletion succeeds.

Diagnostics add durable/session status, checkpoint sequence, last saved time,
stored event count, and persistence error code. A one-shot
`persistenceFailure=1` query may fail the first client commit for manual
recovery testing; it adds no environment variable and cannot alter server data
outside the requested commit.

## Milestones

### 1. Lock persistence contracts and privacy semantics

Add EvidencePersistence 0.1.0 schemas/types/validators/artifact, refactor event
IDs and response payloads to exclude TYPE text, and add contract tests. The
checkpoint is that valid create/commit/restore payloads pass and unknown,
oversized, mismatched, raw-text, or unsupported-version payloads fail with
stable errors while LessonManifest 0.1.0 artifacts remain unchanged.

### 2. Build migration-driven SQLite storage

Add the database lifecycle, schema migration, repositories, package
fingerprinting, atomic commit, idempotency, conflict handling, derived target
summary, privacy reset, inspector, and temporary-database tests. The checkpoint
is that fresh/repeated migration, transaction rollback, duplicate delivery,
stale sequence, immutable revision conflict, reset, close/reopen, and
newer-schema rejection all pass.

### 3. Add the local persistence API

Refactor the `node:http` server into a testable app, implement the closed API
routes and error mapping, add the Vite proxy, and add server integration tests.
The checkpoint is that create, resume lookup, commit retry, abandon,
preferences, progress summary, reset, health, JSON 404, payload limits, and
malformed requests pass over real loopback HTTP with a temporary database.

### 4. Add pure checkpoint and restore semantics

Extend controller world projection, add checkpoint serialization/validation,
restore every stable phase, normalize interrupted audio/movement/feedback,
restore ActiveClock offset, and add focused tests. The checkpoint is that every
primitive can checkpoint, recreate a fresh controller/world projection, and
continue once without duplicated event IDs.

### 5. Integrate durable browser sessions

Add the EvidenceStore port/HTTP adapter, ordered commit queue, saving/error
gate, boot recovery choice, new/abandon/restart flow, and durable completion.
The checkpoint is that reload and local server restart recover the same session
and event count, while Start again creates a distinct clean session.

### 6. Add progress and privacy controls

Add the resume preference, compact local progress summary, diagnostics,
confirmed local-data reset, persistence failure control, and world carry/
transfer reconstruction. The checkpoint is that no TYPE text appears in
storage inspection, assisted work remains distinct, data deletion is visible
and complete, and a failed commit never presents unsaved progress as durable.

### 7. Regress, document, and hand off

Run migrations against fresh and reopened temporary files, all contract/server/
web tests, schema drift, typecheck, lint, formatting, production build, storage
inspection, and local HTTP smoke checks. Update durable docs and provide the
manual persistence matrix. The plan remains open until the user reports actual
browser reload/resume, multi-tab, deletion, privacy, renderer, and full M5 flow
results.

## Progress

- [x] 2026-08-12 11:40 — Re-read the current durable project state and active
  ExecPlan standard, then confirm Milestone 5 is committed cleanly at
  `da0b519`.
- [x] 2026-08-12 11:40 — Inspect the in-memory event shape, event IDs, active
  clock, controller checkpoints gaps, restart behavior, world carry/transfer
  projection, server boundary, package scripts, tests, and absence of storage.
- [x] 2026-08-12 11:40 — Verify locally that the pinned Node.js 24.18.0 runtime
  exposes built-in `node:sqlite` backed by SQLite 3.53.1.
- [x] 2026-08-12 11:40 — Draft proposed D-021 and this self-contained ExecPlan
  to resolve O-003, O-007, and O-011.
- [x] 2026-08-12 11:48 — User explicitly approved Milestone 6; changed D-021 to
  Accepted, this plan to Approved, and the roadmap milestone to In progress.
- [x] 2026-08-12 12:18 — Implement milestone 1: persistence contracts,
  generated artifact, structural validators, and privacy-safe event IDs that
  contain no TYPE response.
- [x] 2026-08-12 12:18 — Implement milestone 2: code-owned checked migrations,
  built-in SQLite lifecycle, immutable lesson packages, atomic repositories,
  idempotent commits, conservative summaries, reset, and safe inspector.
- [x] 2026-08-12 12:18 — Implement milestone 3: testable local HTTP API, body
  limits and structured errors, `/api/v1` routes, Vite proxy, and loopback API
  integration tests.
- [x] 2026-08-12 12:18 — Implement milestone 4: closed checkpoint serializer,
  restore normalization, ActiveClock offset, scaffolds, feedback, carry, and
  transfer reconstruction with focused tests.
- [x] 2026-08-12 12:18 — Implement milestone 5: browser EvidenceStore port,
  validated HTTP adapter, ordered commit gate, durable boot/completion,
  Resume/Start again, abandonment, and visible fail-closed storage errors.
- [x] 2026-08-12 12:18 — Implement milestone 6: local resume preference,
  progress/count panel, privacy copy, two-step confirmed reset, persistence
  failure control, and privacy-safe CLI summary.
- [x] 2026-08-12 12:18 — Implement Milestone 6 static work: 55 focused tests,
  schema drift, typecheck, lint, format, production build, durable
  documentation, and the manual handoff matrix all pass or are prepared.
- [x] 2026-08-12 12:35 — User explicitly responded `DUYỆT MILESTONE 6`,
  accepting the supplied browser matrix as a whole. No per-scenario notes,
  screenshots, named-device details, persistence latency, or numeric renderer
  measurements were supplied, so none are reconstructed.

## Surprises and discoveries

- The current SessionEvent is close to a persistence payload but embeds the
  submitted response in reaction event IDs. TYPE input therefore cannot be
  made private merely by omitting one database column; event identity must also
  change.
- The controller state clears carriedObjectId after GIVE and does not remember
  the completed recipient transfer. A durable checkpoint needs a small
  controller-owned transfer projection so Three.js can reconstruct the world.
- The in-memory controller writes a terminal event before feedback elapses and
  writes the next exposure or lesson-completed event afterward. A reload during
  FEEDBACK requires a closed pending action in the checkpoint and idempotent
  settlement rather than only storing the current step ID.
- Some meaningful safe boundaries create no event: help request, audio end,
  movement failure/retry, and feedback settlement. Persistence cannot be
  triggered only by `RECORD_EVENTS` effects.
- Persisting every reducer update would send each TYPE keystroke to the server
  and violate the proposed privacy boundary. The controller/runtime needs
  explicit checkpoint-worthy effects instead.
- The built-in Node 24 SQLite API is available in the pinned toolchain, so an
  ORM or third-party native module would add cost without solving a current
  requirement.
- There is no Vite config today. A narrow same-origin development proxy avoids
  broad CORS and avoids proposing an API-base environment variable before
  deployment discovery.
- The current server entry owns listening at module load and has no tests.
  Persistence requires separating the router/app factory from the executable
  entry so temporary databases and ephemeral ports are testable.
- The workspace sandbox blocks loopback port binding with EPERM. The real HTTP
  integration suite passed after the approved local-loopback escalation; the
  repository code itself did not require broader network access.
- The final focused suite grew from 46 to 55 tests: 19 contracts, 2 server
  database/API integration tests, and 34 web controller/adapter/runtime tests.
- The Milestone 6 web build remains dominated by the WebGPU-capable Three.js
  chunk: 1,273.78 kB minified and 351.53 kB gzip. Persistence added visible UI
  and contract validation but did not resolve the already known split warning.

## Plan decisions

- 2026-08-12 — Propose server-owned SQLite via built-in `node:sqlite`, not
  browser storage or an ORM, because Bunbun already has a local Node boundary
  and needs one authoritative writer.
- 2026-08-12 — Propose one separate EvidencePersistence 0.1.0 contract so
  storage/API evolution cannot silently change LessonManifest 0.1.0.
- 2026-08-12 — Propose atomic append-only events plus a versioned mutable
  checkpoint. Events alone omit transient reducer information; opaque full
  LessonState serialization would be unstable and over-retentive.
- 2026-08-12 — Propose explicit Resume/Start again rather than automatic merge,
  preserving user intent and making abandonment observable.
- 2026-08-12 — Propose no persisted TYPE response text or answer-derived event
  ID. Closed authored response IDs are sufficient for deterministic diagnostics
  while minimizing learner-entered data.
- 2026-08-12 — Propose local retention until confirmed reset, with no analytics
  transport, identity, or hidden deletion schedule in the technical milestone.
- 2026-08-12 — Propose a three-state lesson-scoped evidence signal and no
  `MASTERED` value. Two later unaided correct contexts are required to recover
  from incorrect or assisted evidence.
- 2026-08-12 — Propose no new environment variable; the local database path and
  Vite proxy are code-owned until deployment discovery is authorized.

## Validation

### Static and automated checks

Run from `/home/nunu/Desktop/nnlab/nn-bunbun` after `nvm use` with Node.js
24.18.0 and npm 11.16.0:

- `npm run schema:check` — LessonManifest, CatalogSnapshot, persistence schema,
  and generated invalid artifacts have no drift.
- `npm run typecheck` — contracts, server, web source, and all test tooling
  compile.
- `npm run lint` — migration, SQL repository, HTTP, web adapter, controller,
  and tests pass lint rules.
- `npm run format:check` — supported source, JSON, SQL-as-code, and root files
  are formatted.
- `npm test` — root test now runs contracts, server, and web suites and passes
  persistence contracts, migrations, transactions, API, checkpoints, restore,
  aggregation, privacy, idempotency, and all earlier runtime tests.
- `npm run inspect:manifest -- packages/contracts/fixtures/manifests/valid-complete-primitive-loop.json packages/contracts/fixtures/catalogs/basic-catalog.json`
  — the accepted M5 fixture remains valid.
- Add and run a privacy-safe storage inspection command against a temporary or
  local database; it reports schema/session/event counts and no response text.
- `npm run build` — contracts, server, and web production builds pass; record
  artifact changes and the known Vite chunk warning.
- Start the normal local dev command and verify web, `/health`, the API health
  boundary, same-origin proxy, JSON 404, and graceful database close. Do not
  overwrite a user-owned running process or database.
- Docker build remains not applicable because Dockerfiles intentionally do not
  exist before local release-candidate acceptance.
- Do not create or run Playwright or another browser E2E suite under D-011.

### Manual happy path

1. Start Bunbun with `nvm use` and `npm run dev`, open the debug URL, and confirm
   the storage status reports ready with a newly created session.
2. Complete LISTEN, ARRANGE, CLICK_OBJECT, and TYPE. Reload during the next safe
   boundary. Confirm the Resume/Start again card identifies the unfinished
   lesson without exposing raw event data.
3. Choose Resume. Confirm the same session/checkpoint sequence returns, earlier
   steps do not replay, active time continues from the saved offset, and TYPE
   text is not restored.
4. Continue MOVE_TO, PICK_UP, and GIVE. Reload after the dog is carried and
   again after it is transferred. Confirm authored carry/recipient world
   presentation reconstructs correctly.
5. Complete CHOOSE. Confirm the lesson remains completed after reload, the
   event count does not increase from reload, and the target summary is visible
   without declaring mastery.
6. Stop and restart the local server, reload the web page, and confirm the same
   completed session and counts remain available from SQLite.
7. Start again. Confirm the prior session becomes ABANDONED, a new session UUID
   starts from LISTEN, and old evidence remains historical rather than being
   copied into the new checkpoint.

### Manual edge cases

1. Reload before submitting ARRANGE and TYPE. Confirm the safe step resumes,
   unsubmitted TYPE text is cleared, no reaction is invented, and no completed
   evidence is lost.
2. Reload while audio is playing, while MOVE_TO is traveling, and during
   feedback. Audio/movement return to documented safe phases; feedback settles
   once; no event or attempt duplicates.
3. Submit a wrong result and request help, then reload. Confirm committed
   attempts/scaffolds remain assisted and later correct work is not reclassified
   as unaided.
4. Open the same active session in two tabs. Let one tab commit, then submit in
   the stale tab. Confirm the stale tab receives a conflict and cannot overwrite
   or append partial evidence.
5. Use `?persistenceFailure=1` for the first commit. Confirm input stops, the UI
   says progress was not saved, Retry reuses the idempotent commit or restores
   the prior checkpoint, and no duplicate appears.
6. Stop the server during a pending interaction and restart it. Confirm the
   last acknowledged checkpoint remains authoritative and unacknowledged UI
   state is not presented as durable.
7. Rapidly submit/double-click during saving. Confirm one commit/event/attempt
   and no skipped step.
8. Reopen the database through repeated app/server starts. Confirm migrations
   are idempotent and existing evidence remains readable.
9. Exercise Start again from an active session and Restart from completion.
   Each old session receives one lifecycle status change and each new session
   begins cleanly.
10. Open local-data controls, cancel deletion, and confirm nothing changes.
    Confirm deletion on the second attempt and verify all lesson/session/event/
    checkpoint/preference counts become zero while migration status remains.
11. Type a distinctive wrong Japanese string, persist later progress, and use
    the privacy-safe inspector. Confirm the string does not appear in event IDs,
    checkpoint JSON, summaries, diagnostics, or inspector output.
12. Create assisted/incorrect evidence, then one unaided correct context and
    then two distinct later unaided correct contexts. Confirm the signal remains
    NEEDS_REVIEW until the two-context recovery condition and then becomes
    DEVELOPING; it never becomes MASTERED.

### Manual regression

1. Run the complete Milestone 5 eight-primitive happy path without reload. UI,
   movement, carry, feedback, event counts, and completion remain deterministic.
2. Repeat the M5 ARRANGE duplicate-token, Japanese IME, wrong location, wrong
   pickup, wrong recipient, movement failure, invalid carry, audio failure,
   manifest failure, and asset failure paths.
3. Confirm INTERACTION still blocks canvas picking and EXPLORE still visibly
   invites the correct object/location/recipient target.
4. Confirm normal auto renderer and forced WebGL2, resize, capped DPR, zoom,
   background/resume, context loss, retry, and disposal remain functional.
5. Confirm target summary never gates lesson completion and assisted completion
   remains completable.
6. Confirm `/health` and JSON 404 behavior remain stable and invalid API JSON
   cannot activate partial lesson or database state.
7. Observe diagnostics through a full saved run and record FPS, average/p95
   frame time, draw calls, triangles, scene-ready time, first stimulus,
   persistence commit latency, and visible saving stalls. Do not infer missing
   values.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Durable create, reload, resume, and completion | User | 2026-08-12 | Accepted overall | Included in the user's explicit Milestone 6 approval; no scenario-level notes supplied |
| Interrupted audio, movement, feedback, and forms | User | 2026-08-12 | Accepted overall | Included in the user's explicit Milestone 6 approval; no scenario-level notes supplied |
| Idempotent retry and stale-tab conflict | User | 2026-08-12 | Accepted overall | Included in the user's explicit Milestone 6 approval; no scenario-level notes supplied |
| Carry/transfer world reconstruction | User | 2026-08-12 | Accepted overall | Included in the user's explicit Milestone 6 approval; no scenario-level notes supplied |
| Privacy, target signal, and confirmed reset | User | 2026-08-12 | Accepted overall | Included in the user's explicit Milestone 6 approval; no scenario-level notes supplied |
| Full M5 renderer/gameplay regression | User | 2026-08-12 | Accepted overall | Included in the user's explicit Milestone 6 approval; no scenario-level notes supplied |

## Recovery and compatibility

This milestone adds the first durable application data, so migration and
recovery behavior are part of correctness. The database opens only after all
known applied migration IDs and checksums match. Unapplied known migrations run
in order inside transactions. A migration failure rolls back and leaves the
previous schema/data intact. A database with a newer unknown migration or
changed checksum fails closed with a diagnostic; it is never downgraded,
deleted, or silently recreated.

Every session commit is safe to retry because commit ID and payload fingerprint
are recorded. Event IDs are unique and inserts plus checkpoint advancement are
one transaction. A stale expected sequence rolls the entire operation back.
The browser retains the last acknowledged sequence only and labels any later
unsaved state honestly.

LessonManifest and CatalogSnapshot remain 0.1.0. Existing fixtures remain
inspectable and playable. EvidencePersistence 0.1.0 is an independent contract;
unknown checkpoint or evidence versions fail closed. Immutable lesson package
fingerprints prevent a changed manifest from reusing an old revision's
checkpoint.

Resume reconstructs a new pure controller state and authored world projection
from validated IDs. It does not deserialize functions, DOM nodes, Three.js
objects, or arbitrary code. Unsupported/transient states normalize to the
documented safe awaiting phase. If checkpoint references are invalid, the app
offers a diagnostic and Start again; it never guesses evidence or mutates the
bad checkpoint.

The confirmed reset action is intentionally destructive and cannot be undone.
The UI must name exactly what will be removed and require a second explicit
confirmation. Implementation and tests must target only the configured local
database or a test-created temporary directory; no broad filesystem deletion
is permitted.

Source rollback is ordinary Git reversion. Database rollback is not automatic:
code older than the applied schema must fail as newer/incompatible rather than
opening it. During development, the user may invoke the explicit Reset local
data control if they accept losing all local learning records. Never delete the
database merely to make a migration test pass.

## Documentation updates

- D-021 is Accepted; O-003, O-007, and O-011 were removed from the deferred
  table at the approval boundary.
- Add a persistence specification documenting EvidencePersistence 0.1.0,
  tables, migration guarantees, API ownership, checkpoint semantics, privacy,
  retention, deletion, and conservative target signal after approval.
- Update BUNBUN_ARCHITECTURE.md with the accepted server-owned storage/data
  flow and safe-resume boundary.
- Update GAMEPLAY.md with persisted evidence privacy and conservative signal,
  without adding mastery or scheduling claims.
- Update LESSON_MANIFEST.md only to clarify its independence from the new
  persistence contract; do not change LessonManifest 0.1.0 fields.
- Update PERFORMANCE.md with database/API/build measurements and only the
  browser values the user actually reports.
- Update README.md with storage location, migration/start commands, reset and
  inspection instructions, and the same-origin local API behavior.
- Keep this plan's Progress, Surprises, Plan decisions, Validation, Recovery,
  and Outcomes current through implementation.
- Update CURRENT_STATE.md, ROADMAP.md, and plans/README.md at proposal,
  approval, implementation handoff, and manual completion boundaries.

## Outcomes

Implementation outcome: D-021 now exists end to end as one server-owned SQLite
source of truth, a separate EvidencePersistence 0.1.0 contract, atomic event
plus checkpoint commits, safe controller/world resume, privacy-minimized
responses with no TYPE text, explicit abandonment and restart, conservative
non-mastery summaries, local resume preferences, visible storage status, and
confirmed deletion. The root test suite passes all 55 focused tests; schema
drift, typecheck, lint, formatting, and the production build pass. Docker is
not applicable because D-015 intentionally keeps Dockerfiles absent.

The user explicitly approved Milestone 6 on 2026-08-12 after receiving the
manual reload/resume, server-restart, multi-tab, deletion/privacy, renderer,
failure, and complete M5 regression matrix. This closes the milestone
qualitatively. Because the user supplied one overall approval and no
per-scenario evidence or numeric diagnostics, this outcome does not establish
measured save latency, a named reference device, broader browser support, or
scenario-specific observations. Milestone 7 planning may now begin, but its
compiler decisions and ExecPlan still require discussion and approval before
implementation.
