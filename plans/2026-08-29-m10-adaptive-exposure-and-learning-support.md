# Turn local evidence into inspectable next-exposure suggestions

Status: Active; approved under D-061
Owner: Codex and user
Created: 2026-08-29
Last updated: 2026-08-30 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Complete Milestone 10 by turning Bunbun's existing privacy-minimized local
evidence into conservative, inspectable suggestions for what to encounter next.
After a lesson, the learner can see which Japanese targets need another useful
context, why Bunbun is suggesting them, whether an already published different
situation is available, and whether to continue with more or less support.

The learner remains in control. M10 never auto-launches a lesson, auto-submits
a compiler request, hides a completed lesson, or claims that a target is
mastered. An incorrect or assisted result increases review priority; two later
unaided-correct contexts can recover the signal. Replaying the same situation
does not masquerade as changed-context practice.

The initial implementation is advisory-only and local. It adds no production
lesson, dialogue, speech, world asset, third-party dataset, dependency, model,
provider, account, credential, environment variable, runtime AI call, remote
analytics, or recurring cost.

## Repository context

M9 is complete under D-060 with explicit evidence limits. D-021 established
server-owned SQLite persistence and an anonymous `local_default` profile.
EvidencePersistence 0.1.0 stores immutable lesson revisions, append-only
EXPOSURE/HEARD/REACTION/STEP_COMPLETED/LESSON_COMPLETED events, safe-boundary
checkpoints, resume preferences, and confirmed local deletion. Raw or
normalized TYPE text is not persisted.

The current server progress path is:

- `packages/contracts/src/schema/evidence-persistence.ts` defines
  `TargetEvidenceSummary` and the three non-mastery signals
  `INSUFFICIENT_EVIDENCE`, `NEEDS_REVIEW`, and `DEVELOPING`;
- `apps/server/src/persistence/repository.ts` aggregates one
  `lessonId + revision + targetId` at a time;
- `GET /api/v1/progress` returns that lesson-scoped summary; and
- `apps/web/src/main.ts` currently exposes only the first target signal in the
  development local-data panel.

That foundation is deliberately not cross-lesson and is not a scheduler. It
also counts target-level REACTION rows, while D-057 later established that a
meaningful learner attempt is grouped by `sessionId + stepId + attempt`.

Cross-lesson identity cannot safely use `targetId`, Japanese surface text, or a
single `referenceId`. The same `～てください` concept already appears under
different reviewed reference identities in Bunbun Core and Last Train. M10
therefore needs an explicit project-owned concept registry; text similarity or
LLM inference must not merge targets.

The published lesson library is owned by
`apps/server/src/compiler/repository.ts`. It can list and load only explicitly
published, validated packages. The learner home and library live in
`apps/web/src/authoring/home.ts`; published launch-mode policy lives in
`apps/web/src/authoring/published-launch.ts`. Existing Japanese reading,
vocabulary, grammar, and exact-audio help is the reviewed
`JapaneseTextStudyCatalog 0.1.0`; JMdict and broader kanji datasets remain
unapproved.

This plan is governed by D-001 through D-003, D-011, D-015, D-021, D-023,
D-031, D-034 through D-038, D-050, D-051, D-056 through D-060, the product
invariants in `docs/BUNBUN_VISION.md`, the evidence semantics in
`docs/GAMEPLAY.md`, the AI boundary in `docs/AI_MODULES.md`, and the local
release boundary in `docs/ROADMAP.md`.

## Scope

### In scope

- Add a versioned, project-owned target-concept registry that maps exact
  reviewed manifest/reference identities to stable cross-lesson concept keys.
- Add an independently versioned AdaptiveLearning 0.1.0 contract for derived
  concept summaries, recommendation reason codes, published-context
  eligibility, and learner preferences.
- Aggregate existing evidence across lesson revisions conservatively while
  grouping per-concept attempts by `sessionId + stepId + attempt`.
- Keep assisted success distinct from unaided success and recover a weak signal
  only after later unaided success in two distinct global context keys.
- Rank weak targets deterministically and explain every recommendation with
  closed reason codes and visible counts.
- Prefer a published lesson with a different lesson/context identity; report
  `NO_CHANGED_CONTEXT_AVAILABLE` rather than immediately drilling the same
  situation when none exists.
- Let the learner turn adaptive suggestions off and choose `ASK_EACH_TIME`,
  `MORE_SUPPORT`, or `LESS_SUPPORT`. A recommendation never overrides the
  learner's launch choice.
- Reuse reviewed grammar/study help. For KANJI targets, expose deterministic
  reference provenance separately from mnemonic content and fail visibly when
  no reviewed reference aid exists.
- Add a forward-only SQLite migration for adaptive preferences only. Derived
  evidence and rankings are recalculated; no mastery score or scheduler cache
  table is persisted.
- Add a learner-facing “Đề xuất tiếp theo” surface that loads independently of
  the existing library and cannot block ordinary lesson launch.

### Out of scope

- A numeric mastery score, percentage, JLPT readiness claim, streak, XP, level,
  spaced-repetition grade, forgetting curve, or punitive due date.
- Automatic lesson launch, automatic compiler submission, automatic target
  replacement, or mutation/reordering of an approved LessonManifest.
- A new production scenario, lesson package, dialogue, voice line, audio,
  model, texture, world asset, or interaction primitive.
- Sending gameplay evidence, progress summaries, support preferences, or
  recommendation reasons to the M7 authoring Skill, a GPT, an API, or any
  external process. If the learner later presses Compile, only the already
  disclosed target text follows the existing M7 boundary.
- Heuristic merging by target ID, Japanese spelling, reading, translation, or
  embedding similarity.
- JMdict, KANJIDIC2, another dictionary/reference download, generated kanji
  decomposition, or generated mnemonic integration. O-009 remains unresolved.
- Accounts, cross-device sync, remote analytics, cloud persistence, hosting,
  Docker, deployment, or release automation.
- Automated browser E2E under D-011.

## Decisions and constraints

### Recommended M10 product boundary

Implement advisory adaptation over the existing published library. Do not
author a second production package merely to make the scheduler look busy.
With the current library, some targets will truthfully report that no changed
published context exists. Deterministic tests will prove the multi-lesson path
with validated local fixtures; production exposure becomes available only when
another lesson has passed its normal content/audio/world/publication gates.

This is the smallest coherent route because it proves the learning policy
without weakening M7 authoring review or reopening M8's hash-bound package.

### Stable concept identity

Add `LearningTargetRegistry 0.1.0` as reviewed application data. Each record
contains:

- `conceptKey`, target kind, Japanese learner-facing label, and optional
  support label;
- exact accepted selectors composed from provider ID, provider version,
  reference ID, and target kind;
- a canonical content signature used only to reject registry drift, never to
  discover aliases; and
- whether the current compiler can accept that target text when the learner
  explicitly chooses to prepare a new situation.

One exact selector maps to at most one concept. A manifest target with no exact
registry match remains lesson-scoped and receives `UNMAPPED_TARGET`; it is not
cross-aggregated or silently dropped. Registry changes are versioned and
reviewed. Existing evidence events and stored manifests remain unchanged.

The initial registry may cover only the repository-owned Bunbun Core and M8
Last Train targets already present in reviewed fixtures. It may explicitly map
the two reviewed `～てください` reference identities to one concept. No external
linguistic source is introduced.

### Conservative evidence aggregation

For one concept, build an attempt unit from all REACTION rows sharing:

`conceptKey + sessionId + stepId + attempt`.

The unit is correct only when every mapped row is correct. It is assisted when
any mapped row is assisted. Its global context key is
`lessonId + contextId`; revision is intentionally excluded so publishing a
revision cannot manufacture a new learning context. Event sequence supplies
the deterministic order.

Retain the existing non-mastery signals:

- `INSUFFICIENT_EVIDENCE`: fewer than two unaided-correct distinct contexts and
  no unrecovered weak attempt;
- `NEEDS_REVIEW`: the latest incorrect or assisted attempt has not been
  followed by unaided-correct evidence in two distinct later contexts; and
- `DEVELOPING`: at least two unaided-correct distinct contexts, including two
  later contexts after the most recent weak attempt.

M10 does not add `MASTERED`. `DEVELOPING` means that a varied next exposure is
reasonable, not that the learner permanently knows the target.

The summary universe contains mapped concepts that either have local evidence
or occur in a currently published package. If a concept appears with different
roles or priorities across packages, `REQUESTED` wins over `SUPPORTING` and the
highest authored priority is used for ranking. These derived fields explain
ordering only; they do not rewrite any stored manifest.

### Deterministic prioritization and context spacing

The server sorts recommendation candidates by this closed order:

1. mapped `NEEDS_REVIEW` concepts;
2. mapped `INSUFFICIENT_EVIDENCE` concepts;
3. mapped `DEVELOPING` concepts ready for variation;
4. requested targets before supporting targets;
5. higher authored target priority;
6. never-practiced, then oldest `lastPracticedAt`; and
7. lexical `conceptKey` as the final stable tie-breaker.

Return at most three concept suggestions. For each suggestion, consider only
currently published and fully validated lesson revisions. Prefer another
lesson whose assessment context set differs from the most recently practiced
lesson. Never call the same lesson a changed context. When no eligible lesson
exists, return a closed reason such as `NO_CHANGED_CONTEXT_AVAILABLE` or
`NO_PUBLISHED_LESSON_AVAILABLE`; the UI may offer a non-destructive target
prefill only when the existing compiler explicitly supports that concept.

The same database rows, published package set, registry version, and
preferences must produce byte-identical canonical recommendation output. Wall
clock age is displayed but does not affect ordering in M10; this avoids a
hidden time-dependent spaced-repetition policy.

### Learner-visible support control

Adaptive exposure mode is `SUGGEST` or `OFF`; default is `SUGGEST`. Support
preference is `ASK_EACH_TIME`, `MORE_SUPPORT`, or `LESS_SUPPORT`; default is
`ASK_EACH_TIME`.

`MORE_SUPPORT` recommends a guided launch when that published lesson supports
it. `LESS_SUPPORT` recommends immersive. `ASK_EACH_TIME` preserves both launch
choices. These preferences change presentation only. They never activate a
scaffold before the existing controller records help, never change answer
truth, and never alter assisted evidence semantics.

### Grammar and kanji support boundary

Grammar help reuses exact reviewed manifest content and
JapaneseTextStudyCatalog records. M10 performs no runtime tokenization or
dictionary lookup.

For a KANJI target, the adaptive response may expose the target's character,
reviewed readings already present in the validated manifest, and the catalog's
reference provider ID/version. The UI labels that section `REFERENCE`. A
mnemonic section is absent in M10 and must never be synthesized as a fallback.
A small project-authored contract fixture may prove this distinction; it is
test data, not a new production lesson or external reference dataset.

### Contract, storage, and API boundary

Create `AdaptiveLearning 0.1.0` independently from EvidencePersistence 0.1.0.
It should define:

- target registry and validation result;
- concept evidence summary;
- recommendation and closed reason codes;
- adaptive preferences;
- snapshot response; and
- structured local API errors.

Add one SQLite migration, tentatively `m10_adaptive_preferences`, with one row
for `local_default`. Do not duplicate evidence or store recommendation output.
Confirmed local-data reset deletes the preference row. Existing databases
migrate forward without rewriting events, lesson revisions, sessions,
checkpoints, compilation rows, or audio rows.

Recommended endpoints:

- `GET /api/v1/adaptation` for the derived snapshot;
- `GET /api/v1/adaptation/preferences`; and
- `PUT /api/v1/adaptation/preferences` for closed validated values.

The server composes evidence aggregation with the compiler repository's
published lesson list. The browser does not inspect SQLite or derive a second
truth in localStorage.

### Cost, license, privacy, and operations review

| Area                                | M10 effect                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| Incremental or recurring cost       | USD 0                                                                               |
| New service, API, model, or account | None                                                                                |
| New npm/system dependency           | None                                                                                |
| New downloaded asset or dataset     | None                                                                                |
| New environment variable or secret  | None                                                                                |
| New local data                      | Two closed preferences; derived summaries are not stored                            |
| Learner data leaving localhost      | None                                                                                |
| Reference license                   | Project-authored registry/fixture under repository ownership                        |
| Runtime operation                   | Existing Node server and SQLite only; no worker or daemon                           |
| Removal                             | Stop using the new endpoint/table; preserve immutable evidence and migration ledger |

Under D-038, this plan does not authorize later dictionary, kanji, mnemonic,
analytics, hosting, or provider intake. Each requires its own reviewed plan.

### Performance and failure constraints

- Adaptation loading must not block the lesson library or existing Play
  buttons. A failure produces a compact unavailable state and leaves ordinary
  launch behavior intact.
- Bound one response to at most 100 concept summaries, three suggestions, and
  100 published lesson candidates; reject unbounded registry growth.
- Keep the JSON response below 128 KiB for the bounded local profile.
- A deterministic 10,000-event server fixture should compute the snapshot in
  at most 100 ms on the development machine; record the actual result without
  claiming a wider device guarantee.
- No adaptation work occurs in the Three.js render loop.

### Accepted implementation decisions

D-061 accepts:

1. advisory-only adaptation rather than automatic scheduling;
2. an explicit project-owned concept registry rather than text heuristics;
3. the three existing non-mastery signals rather than a numeric mastery score;
4. deterministic context spacing without a wall-clock forgetting curve;
5. a separate AdaptiveLearning 0.1.0 contract and one preferences migration;
6. project-owned kanji provenance test data only, with no third-party dataset;
   and
7. the zero-cost/no-external-data boundary above.

## Implementation approach

Add a pure contract-level registry validator first. Then implement a pure
server aggregation module that accepts validated registry records, stored
manifest/event projections, published lesson summaries, and preferences. It
returns a complete AdaptiveLearning snapshot without reading the wall clock or
mutating storage.

Keep SQL ownership in the existing persistence layer. A small adaptive
repository reads bounded rows and the new preference table, converts database
records into pure inputs, and delegates all ranking to the pure module. The
HTTP layer validates and returns the result. The compiler repository supplies
published packages; no evidence enters compilation requests.

The web client fetches adaptation in parallel with the existing library. The
home page renders one optional card above the published library. Each
suggestion shows Japanese first, a Vietnamese reason, the conservative signal,
the last distinct context facts, and either an explicit published lesson
choice or a truthful unavailable state. Preference controls are ordinary DOM
controls and cannot alter the active lesson controller.

Japanese study buttons reuse the current exact-string catalog where available.
KANJI reference provenance is rendered from validated manifest/catalog data in
a visually separate reference panel. No generated mnemonic placeholder is
shown.

## Milestones

### 1. Lock D-061 and the observable policy — complete

The user approved the plan. D-061 is recorded in `docs/DECISIONS.md`, and
`docs/BUNBUN_VISION.md`, `docs/GAMEPLAY.md`,
`docs/BUNBUN_ARCHITECTURE.md`, `docs/LESSON_MANIFEST.md`,
`docs/EVIDENCE_PERSISTENCE.md`, and `docs/AI_MODULES.md` now carry the accepted
concept, signal, spacing, privacy, preference, and AI-isolation semantics.

Observable checkpoint: no unresolved decision remains about mastery wording,
identity merging, automatic behavior, new data, cost, or privacy.

### 2. Add AdaptiveLearning contracts and concept registry — complete

Add `packages/contracts/src/schema/adaptive-learning.ts`, exports, strict
validators, generated JSON Schema, project-owned registry fixture, and focused
tests. Validate unique concept keys/selectors, target-kind compatibility,
content signatures, bounded counts, reason codes, preferences, and closed
objects.

Add a test-only KANJI record with project-authored provenance to prove that a
reference aid is distinguishable from a mnemonic. Do not add a production
lesson or runtime asset.

Observable checkpoint: valid cross-lesson aliases pass; unknown, ambiguous,
drifted, heuristic-only, and unreferenced kanji inputs fail closed.

### 3. Implement cross-lesson aggregation and recommendations — complete

Add a pure module near `apps/server/src/persistence/` or a focused
`apps/server/src/adaptation/` directory. Group target rows into per-concept
attempt units, preserve assisted semantics, derive the three signals, calculate
distinct global contexts, rank at most three targets, and match only validated
published lessons with changed contexts.

Use fixtures to cover Last Train/Bunbun Core `～てください` aliasing, targets
with no alternate lesson, repeated revisions, repeated same-context sessions,
conflicting target rows, incorrect/assisted recovery, supporting targets, and
stable tie-breaks.

Observable checkpoint: identical inputs return identical canonical JSON, and
no same-lesson replay is labeled changed context.

### 4. Add local preferences, API, and safe migration — complete

Add the forward-only SQLite migration and adaptive repository. Add validated
GET/PUT preference endpoints and the snapshot endpoint. Update confirmed reset,
storage inspection as appropriate, same-origin client types, and HTTP tests.

Do not version-bump or rewrite EvidencePersistence events merely to add the
independent adaptive contract. Migration checks must prove fresh creation,
upgrade from migration 3, checksum enforcement, idempotent preference writes,
invalid-value rejection, and reset cleanup.

Observable checkpoint: old evidence produces a derived snapshot after upgrade;
turning suggestions off persists locally and ordinary progress remains intact.

### 5. Add learner-facing next-exposure and support controls

Extend `apps/web/src/authoring/home.ts`, the same-origin client, and
`apps/web/src/style.css`. Load adaptation independently from library launch.
Render at most three suggestions, closed explanations, explicit no-context
states, and preference controls. A published recommendation still requires a
learner click and launch-mode choice. A supported target prefill requires a
separate learner action and never submits automatically.

Reuse current Japanese study tooling for reviewed grammar help. Render KANJI
provider/version provenance when present and never invent a mnemonic fallback.

Observable checkpoint: a weak target is explained without a score; the learner
can turn suggestions off, override support, and launch any published lesson as
before.

### 6. Verify, document, and hand off M10

Run supported contract/server/web checks, schema generation/check, migration
tests, build, approval-hash regressions, and diff hygiene. Record the bounded
10,000-event measurement. Hand the user a concise manual matrix for weak,
assisted, recovered, no-alternate, preference, reload/reset, and failure paths.

Update this plan, `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, and shared memory
with only observed results. Preserve all M7–M9 waivers exactly.

Observable checkpoint: M10 is inspectable, deterministic, optional, local,
and ready for the separate local release-candidate gate.

## Progress

- [x] 2026-08-29 23:51 — Audit the M10 roadmap against current evidence,
      compiler, library, study-tool, AI, and persistence boundaries.
- [x] 2026-08-29 23:51 — Identify explicit cross-lesson concept identity as the
      missing prerequisite; reject target-ID/text/LLM heuristic merging.
- [x] 2026-08-29 23:51 — Draft the advisory-only, zero-cost, local M10 plan.
- [x] 2026-08-30 — User approved `DUYỆT PLAN M10 ADAPTIVE EXPOSURE`;
      recorded D-061 and locked the observable policy across the durable specs.
- [x] 2026-08-30 — Implemented AdaptiveLearning 0.1.0, the exact eight-concept
      project registry, canonical content signatures, KANJI REFERENCE-only
      provenance, generated schema/fixtures, and fail-closed validators.
- [x] 2026-08-30 — Contracts 55/55, root typecheck, lint, 60-artifact schema
      freshness, format, and production build pass with Node 24.18.0. No
      browser test was added or run under D-011.
- [x] 2026-08-30 — Implemented the pure server derivation module with exact
      registry resolution, attempt grouping, assisted recovery, revision-safe
      global contexts, deterministic ranking, validated published-context
      matching, OFF behavior, and explicit unavailable/unmapped outcomes.
- [x] 2026-08-30 — Focused adaptive tests pass 7/7; combined adaptive,
      compiler, and persistence regression passes 18/18 with loopback enabled.
      The final 10,000-reaction fixture measured a 42.01 ms median over five warmed
      derivations against the 100 ms development-machine budget.
- [x] 2026-08-30 — Added migration 5 with deterministic local defaults,
      idempotent preference updates, confirmed-reset cleanup, migration-3
      upgrade coverage, and checksum enforcement. Added bounded evidence,
      revision, and latest-published-lesson projections into the pure module.
- [x] 2026-08-30 — Added isolated same-origin snapshot and preference resources
      plus a strict web client. Focused adaptive/compiler/persistence regression
      passes 23/23; contracts pass 55/55; web passes 89/89. Root typecheck,
      lint, 60-artifact schema freshness, format, production build, and diff
      hygiene pass. No browser E2E was added or run under D-011.

## Surprises and discoveries

- The existing progress algorithm already has the right conservative recovery
  shape but is scoped to one lesson revision and counts target rows rather than
  D-057 meaningful attempts.
- The same grammar concept can carry different reviewed reference IDs across
  packages. A cross-lesson scheduler therefore requires an explicit alias
  registry; neither `targetId` nor visible Japanese is a safe identity.
- Current production has only one fully approved product package. M10 must be
  honest when no changed published context exists instead of promoting a
  technical fixture or authoring new content implicitly.
- Existing CatalogSnapshot reference records carry provider/version identity,
  while authoritative target readings live in the validated manifest. This is
  enough to enforce reference provenance presentation without downloading a
  new kanji dataset in M10.
- Equivalent package and reaction arrays can arrive in different input order.
  Canonical sorting by stable identities plus global event sequence makes the
  derived snapshot byte-identical without persisting a scheduler cache.
- Gameplay evidence is prohibited from entering M7 prompt modules. An optional
  target prefill is compatible only because the learner must explicitly choose
  Compile and the existing authoring request receives target text, not evidence
  or recommendation history.

## Plan decisions

- 2026-08-29 — Recommend advisory suggestions, never automatic scheduling or
  manifest mutation.
- 2026-08-29 — Recommend an explicit versioned concept registry and fail-closed
  unmapped targets instead of heuristic merging.
- 2026-08-29 — Recommend preserving the three evidence signals and avoiding a
  `MASTERED` state or numeric score.
- 2026-08-29 — Recommend no new production content or third-party reference
  source in M10; changed-context availability remains truthful and conditional
  on published packages.
- 2026-08-29 — Recommend one independent AdaptiveLearning contract and one
  preferences-only migration; derived rankings remain ephemeral.
- 2026-08-30 — User accepted the full plan. D-061 makes the advisory-only,
  explicit-registry, non-mastery, deterministic, zero-external-cost boundary
  authoritative for implementation.
- 2026-08-30 — Use an inspectable `target_content_v1:` canonical JSON
  signature rather than a runtime hashing dependency. It is used only to
  reject reviewed-content drift; exact provider/version/reference/kind
  selectors remain the sole identity mechanism.

## Validation

All commands run from `/home/nunu/Desktop/nnlab/nn-bunbun` with Node.js
24.18.0 and npm 11.16.0.

### Static and automated checks

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. `npm run schema:check`
5. `npm run test --workspace @bunbun/contracts`
6. Focused server compiler, persistence, and new adaptive tests with
   `node --import tsx --test --test-isolation=none`.
7. `npm run test --workspace @bunbun/web`
8. `npm run lesson:m8:content-approval-check`
9. `npm run lesson:m8:speech-approval-check`
10. `npm run lesson:m8:study-check`
11. `npm run audio:m8:runtime-check`
12. `npm run world:m8:runtime-check`
13. `npm run build`
14. `git diff --check`

The full root `npm test` must be reported truthfully: the unchanged server
audio test currently executes its assertions and then aborts in Node 24.18.0
native callback teardown. M10 must not claim that known issue is fixed unless
separate evidence proves it.

Automated browser E2E remains excluded under D-011. Docker remains not
applicable under D-015 until the user explicitly accepts a local release
candidate.

### Manual happy path

1. Start with local evidence for at least one reviewed target and open the
   learner library.
2. Confirm “Đề xuất tiếp theo” shows Japanese first, a Vietnamese reason, one
   conservative signal, and no mastery score.
3. If a different published context exists, choose it and confirm Bunbun still
   asks for the support mode before launch.
4. Complete an unaided reaction in a new context, return to the library, and
   confirm the explanation changes deterministically after refresh.

### Manual edge cases

1. No evidence: suggestions are bounded and explain insufficient evidence.
2. Incorrect or Help-assisted result: the target becomes `NEEDS_REVIEW`; Help
   is never counted as unaided recovery.
3. Two later unaided-correct distinct contexts: the signal becomes
   `DEVELOPING`.
4. Same lesson/context replay: counts may increase, but it is not labeled a new
   context and is not auto-recommended as variation.
5. No alternate published lesson: show `NO_CHANGED_CONTEXT_AVAILABLE` and keep
   ordinary library actions enabled.
6. Unmapped or drifted target identity: fail closed for cross-lesson merging
   while preserving lesson-scoped progress.
7. Turn suggestions OFF, reload, and confirm the preference persists locally;
   turn it on again without changing evidence.
8. Switch support preference and confirm it recommends but never silently
   activates a scaffold or launches a lesson.
9. Simulate adaptation endpoint failure: library and Play actions remain
   usable.
10. Confirm local reset deletes adaptive preferences together with existing
    local data after the exact confirmation flow.

### Manual regression

1. Existing M7 authoring and explicit publication routes remain unchanged;
   gameplay evidence never appears in an authoring request.
2. Exact M8 content, speech, study, audio, world, and approved-profile hashes
   remain unchanged.
3. M9 learner/development separation, completion recap, replay/library exits,
   D-057 cadence grouping, and mission toggle remain unchanged.
4. Resume, idempotent evidence, raw TYPE privacy, audio fallback, renderer
   fallback, and confirmed reset retain their current behavior.
5. Opening and using recommendations does not create REACTION, EXPOSURE,
   HEARD, STEP_COMPLETED, or LESSON_COMPLETED events.

### Manual results

| Scenario                                            | Tester  | Date    | Result  | Evidence or notes       |
| --------------------------------------------------- | ------- | ------- | ------- | ----------------------- |
| A — weak target and changed-context suggestion      | Pending | Pending | Not run | Awaiting implementation |
| B — assisted/recovery/no-alternate edge cases       | Pending | Pending | Not run | Awaiting implementation |
| C — preferences, reload/reset, failure, regressions | Pending | Pending | Not run | Awaiting implementation |

## Recovery and compatibility

The migration is additive and forward-only. It creates only the adaptive
preference table and never rewrites existing evidence or packages. Default
preferences are deterministic when no row exists. A partial or checksum-
mismatched migration fails startup through the existing migration ledger.

Derived snapshots are disposable. If the registry or aggregation fails, the
API returns a structured local error and the learner page shows adaptation as
unavailable while the library remains functional. No fallback guesses target
identity.

Rollback can remove the web card and stop registering adaptive endpoints while
leaving the additive table unused. Do not delete learner evidence or alter the
migration ledger to roll back. Existing clients and lesson runtime continue to
use EvidencePersistence 0.1.0 unchanged.

Registry updates require a version bump and tests proving that prior selectors
do not silently remap. Existing snapshot output is not persisted, so no data
backfill is required.

## Documentation updates

- D-061 is recorded in `docs/DECISIONS.md` after explicit user approval.
- Update `docs/BUNBUN_VISION.md` with advisory adaptation and learner control.
- Update `docs/BUNBUN_ARCHITECTURE.md` with registry, pure aggregation, API,
  and failure isolation.
- Update `docs/GAMEPLAY.md` with per-concept attempt semantics, signal recovery,
  and context spacing.
- Update `docs/LESSON_MANIFEST.md` with registry compatibility and global
  context identity, without changing manifest execution.
- Update `docs/EVIDENCE_PERSISTENCE.md` with the independent adaptive contract,
  preference migration, reset, and privacy boundary.
- Update `docs/AI_MODULES.md` to reiterate that evidence and adaptation output
  never enter prompt modules.
- Update `docs/PERFORMANCE.md` with the bounded snapshot measurement.
- Update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, this plan, and shared memory
  after every meaningful checkpoint.

## Outcomes

M10 Milestones 1 through 4 are complete under D-061. The accepted policy and
AdaptiveLearning 0.1.0 contract now establish explicit concept identity,
closed non-mastery summaries/reasons/preferences, deterministic
changed-context DTOs, and reference-provenance separation. The initial exact
registry covers eight reviewed concepts and safely aliases the two approved
`～てください` identities. It deliberately avoids mastery claims, automatic
scheduling, new production content, third-party reference intake, runtime AI,
and external learner-data flow. The pure server derivation now turns exact
mapped REACTION projections into attempt-level summaries and at most three
deterministic, context-honest suggestions. It passes the focused semantic,
regression, and 10,000-row performance checkpoints. Migration 5 persists only
the approved local preferences; bounded projections and the isolated
same-origin API now expose deterministic snapshots without storing derived
recommendations or disrupting the ordinary library. The next checkpoint is the
learner-facing adaptive card and preference controls; no M10 learner UI exists
yet.
