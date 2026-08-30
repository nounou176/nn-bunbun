# Bunbun Evidence Persistence 0.1.0

## Status and ownership

Milestone 6 implements this local persistence boundary under accepted D-021.
The Node server is the only SQLite owner. The browser uses the same-origin
`/api/v1` service and never opens the database or stores a second copy in
browser storage. The user manually accepted Milestone 6 on 2026-08-12.

EvidencePersistence 0.1.0 evolves independently from LessonManifest and
CatalogSnapshot 0.1.0. Its TypeBox source is
`packages/contracts/src/schema/evidence-persistence.ts`; the generated artifact
is `packages/contracts/schemas/evidence-persistence-0.1.0.schema.json`.

## Local database

Normal development data is stored in the ignored repository-local file
`.bunbun-data/bunbun.sqlite`. Tests inject exact temporary paths and delete only
the directories they created. No database path environment variable, browser
SQLite, IndexedDB, localStorage, account, cookie, or remote transport exists.

The server opens SQLite with foreign keys, a busy timeout, WAL for file-backed
databases, and ordered code-owned migrations. `schema_migrations` records each
migration ID, name, checksum, and application time. Unknown migrations or a
checksum mismatch fail closed; startup never downgrades or deletes data.

The initial schema owns:

- immutable validated lesson revisions and canonical package fingerprints;
- one anonymous `local_default` profile namespace;
- ACTIVE, COMPLETED, and ABANDONED play sessions;
- append-only evidence events with stable unique event IDs;
- one versioned safe-boundary checkpoint per session;
- idempotent commit receipts keyed by commit ID and payload fingerprint; and
- one local resume preference.

Only one ACTIVE session may exist for a lesson revision and local profile.
Event insertion, checkpoint advancement, session status, and commit receipt are
one `BEGIN IMMEDIATE` transaction. A stale expected sequence or reused commit
ID with different content rolls back the whole request.

## HTTP boundary

The testable `node:http` application preserves `GET /health` and exposes:

- `POST /api/v1/sessions`;
- `GET /api/v1/resumable-sessions`;
- `POST /api/v1/sessions/:sessionId/commits`;
- `POST /api/v1/sessions/:sessionId/abandon`;
- `GET /api/v1/progress`;
- `GET` and `PUT /api/v1/preferences`;
- `GET /api/v1/storage-summary`; and
- `DELETE /api/v1/local-data` with the exact confirmation literal.

JSON request bodies are closed, versioned, structurally validated, and limited
to 256 KiB. The server validates the complete lesson package before the first
write and validates event identity, authored references, responses, attempts,
scaffolds, phases, transitions, carry transfers, and completion checkpoints
against the immutable stored manifest.

Vite proxies `/api` to `http://127.0.0.1:3000` during local development. This
does not define production topology or enable CORS.

## Checkpoint and recovery semantics

The checkpoint is a closed DTO, not serialized application, DOM, canvas, or
Three.js state. It retains only the session and lesson identity, sequence,
status, current step and phase, attempts, help/audio flags, authored scaffold
and ARRANGE token IDs, completed steps, task carry, completed object-recipient
transfers, feedback pending action, and active-time offsets.

The browser commits meaningful boundaries through an ordered queue. It does
not persist TYPE keystrokes or every ARRANGE click. Reload reconstructs a fresh
controller and world projection from authored IDs. Unsubmitted TYPE text is
always empty. Interrupted movement returns to `AWAITING_LOCATION`; interrupted
audio returns to `AWAITING_CONTINUE`; committed feedback retains one pending
action and settles without replaying its evidence.

A compatible ACTIVE session follows the local preference: ask with explicit
Resume/Start again, auto-resume, or abandon and start new. Start again marks the
old ACTIVE session ABANDONED before creating another. A compatible COMPLETED
session restores its completed screen until the learner explicitly restarts.
A storage failure is visible and stops lesson advancement; there is no silent
memory-only fallback.

## Privacy and retention

No learner identity or learner-entered TYPE value is persisted. TYPE reaction
events contain correctness, target/evidence metadata, assisted state, attempt,
active latency, and timestamps, but no response text, normalized answer, or
answer-derived event ID. Other closed interactions may retain only authored
stable IDs such as object, location, choice, token, and recipient IDs.

Local data remains until the learner uses the two-step confirmed deletion UI.
Reset removes lesson revisions, sessions, events, checkpoints, commit receipts,
and preferences while retaining the migration ledger. The privacy-safe storage
summary and `npm run inspect:storage -- [database-path]` report versions,
counts, session status, and checkpoint sequences without raw response content.

## Conservative target signal

Progress is scoped to one lesson ID, revision, and target. It reports counts
and only one of:

- `INSUFFICIENT_EVIDENCE` when there is not enough unaided evidence;
- `NEEDS_REVIEW` after an incorrect or assisted reaction without two later
  unaided-correct contexts; or
- `DEVELOPING` after unaided-correct evidence in two contexts, including two
  later contexts after the most recent weak result.

This is diagnostic evidence, not mastery, a percentage, cross-lesson
aggregation, or a scheduler. It never gates lesson completion.

## Independent adaptive-learning boundary

D-061 keeps EvidencePersistence 0.1.0 unchanged and introduces a separate
AdaptiveLearning 0.1.0 boundary. The server derives concept summaries and
recommendations from immutable local evidence, validated published packages,
an exact reviewed concept registry, and closed preferences. It does not rewrite
events, lesson revisions, checkpoints, or the existing lesson-scoped progress
summary.

Cross-lesson attempts are grouped by
`conceptKey + sessionId + stepId + attempt`. A group is correct only if every
mapped target row is correct and assisted if any row is assisted. Distinct
contexts use `lessonId + contextId`; revision changes alone do not add a new
context. The derived result retains only `INSUFFICIENT_EVIDENCE`,
`NEEDS_REVIEW`, and `DEVELOPING` and is recalculated rather than persisted.

Migration 5, `m10_adaptive_preferences`, is additive and forward-only. It stores
only:

- adaptation mode: `SUGGEST` or `OFF`; and
- support preference: `ASK_EACH_TIME`, `MORE_SUPPORT`, or `LESS_SUPPORT`.

The deterministic fresh default is `SUGGEST` plus `ASK_EACH_TIME`; an identical
PUT preserves the existing `updatedAt`. The anonymous `local_default` profile
remains the only owner. Confirmed local reset deletes these preferences along
with the existing local data while
retaining the migration ledger. No recommendation cache, mastery score,
learner identity, raw response, browser storage, remote transport, account,
cookie, or synchronization is authorized.

The implemented same-origin boundary exposes:

- `GET /api/v1/adaptation`;
- `GET /api/v1/adaptation/preferences`; and
- `PUT /api/v1/adaptation/preferences`.

The implemented repository bounds one derivation read to 100,000 REACTION
rows, 100 lesson revisions, and 100 latest validated published lesson
candidates. Oversized, incomplete, unknown, or invalid projections fail closed.
An adaptation error is isolated: the learner library and ordinary published
lesson launch remain usable. Gameplay evidence, derived summaries, reasons,
and preferences are never compiler or AI-module inputs.
