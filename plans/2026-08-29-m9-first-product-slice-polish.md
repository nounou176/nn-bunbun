# Turn the accepted Last Train build into the first learner-facing product slice

Status: Complete under D-060; cadence and smoke S2–S4 waived by the user
Owner: Codex and user
Created: 2026-08-29
Last updated: 2026-08-29 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Complete Milestone 9 without rebuilding the world, lesson, compiler, speech,
audio mixer, study tools, or persistence already accepted in M8. A learner
opens Bunbun, enters the approved targets, understands how to start the Last
Train adventure, completes it with guided or immersive support, sees a compact
truthful learning recap, and can return to the library or replay.

The ordinary landing experience should look like a Japanese-learning game,
not an audio/compiler engineering console. Developer-only speech gates,
technical fixtures, diagnostics, and local-data controls remain available
behind an explicit development surface. The runtime reports local reaction
cadence from existing privacy-minimized evidence so M9 can evaluate Bunbun's
north-star metric instead of inferring it from story length.

This plan adds no new story, world asset, character, voice, utterance,
dictionary, service, model, provider, account, credential, environment
variable, browser automation, or runtime AI.

## Repository context

M8 is complete under D-055. The following production inputs already exist and
must be reused unchanged:

- `lesson_m8_last_train` revision 1 and its approved six-target, nine-step,
  all-eight-primitive package;
- `m8_last_train_approved_v1` target-to-package selection, local review,
  publication, and guided/immersive launch;
- rainy-neighborhood layout/runtime `1.0.1`, Aoi, Tanaka, Momo, stable world
  identities, camera, navigation, and exact D-045 asset set;
- four D-049-approved Aoi/Tanaka WAVs and the D-043 exact non-speech set;
- native five-bus mixer, captions, replay, Japanese study tools, audio
  fallback, evidence, SQLite checkpoint/resume, and local reset;
- existing runtime diagnostics and persisted privacy-minimized events.

The main learner and product UI currently shares
`apps/web/src/authoring/home.ts` with compiler, speech-generation, technical
regression, and published-library controls. Runtime lesson presentation is in
`apps/web/src/ui/shell.ts`; session timing and reaction snapshots are in
`apps/web/src/lesson/runtime.ts`; persisted summaries are produced by
`apps/server/src/persistence/repository.ts`. Styles live in
`apps/web/src/style.css`.

The accepted M8 run recorded 20 reactions over 244,698 ms active time, about
4.90 reactions per active minute, while the user was deliberately exercising
guided support and diagnostics. That is a useful observation, not a clean
learner baseline. Existing performance observations show 49–58 FPS, 20.5–17.2
ms average frame time, 25.0–33.3 ms p95, 57–58 draw calls, 232–312 ms scene
ready, 4.8–10.8 ms picking, and 328–1,875 ms first stimulus on the user's
reported high-DPI WebGL2 runs.

This plan is governed by D-011, D-015, D-025, D-026, D-038, D-043, D-045,
D-049 through D-055, the product invariants in `docs/BUNBUN_VISION.md`, the
eight primitives in `docs/GAMEPLAY.md`, the deterministic manifest/runtime
boundary, and the GLB-first boundary in `docs/WORLD_AUTHORING.md`.

## Scope

### In scope

- Separate the learner-first landing/library flow from development tooling
  without deleting recovery routes.
- Keep target entry simple and make the approved Last Train route the obvious
  supported product path.
- Preserve explicit review/publication truth while replacing engineering-heavy
  wording with learner-facing Japanese/Vietnamese copy.
- Add a compact completion recap using existing current-session evidence:
  target exposure, correct/incorrect reactions, assisted versus unaided
  outcomes, active time, and reaction cadence.
- Add clear replay and return-to-library actions after completion.
- Add local-only diagnostic cadence facts: reactions per active minute and
  median/p95 active-time gap between reactions. Do not create a mastery score.
- Polish responsive layout, focus, button priority, and world dominance only
  where the accepted slice still exposes a measured usability problem.
- Record one representative guided and one immersive observation against the
  approved thresholds when the user chooses to run them.

### Out of scope

- New lesson content, dialogue, Japanese answer truth, hints, story beats,
  utterances, voices, audio, models, textures, or world assets.
- New NPC personality simulation, pathfinding, collision events, physics,
  inventory, realtime timer, failure punishment, or interaction primitive.
- A new compiler profile, freeform GPT generation, runtime LLM, tutor call,
  speech input, pronunciation scoring, or SPEAK.
- New dictionary/reference intake, including JMdict Gate 2.
- Accounts, cloud sync, analytics transmission, hosting, Docker, release
  automation, or domain work.
- Automated Playwright/browser E2E under D-011.

## Decisions and constraints

### Recommended M9 route

Use a product-shell and measurement pass over the accepted M8 slice.

Do not author a second M9 package. Reauthoring would reopen content, study,
speech, world, and hash approvals while adding no evidence that the learning
loop is better. Do not add open-ended NPC behavior; it would move the project
away from the accepted deterministic eight-primitive MVP.

### Proposed acceptance thresholds

These thresholds apply only to a named representative local browser/device
run and do not create a wider support claim:

| Area                         | Proposed M9 threshold                                      |
| ---------------------------- | ---------------------------------------------------------- |
| Warm scene ready             | 500 ms or less                                             |
| Warm first Japanese stimulus | 2,000 ms or less                                           |
| Picking response             | 100 ms or less                                             |
| Draw calls                   | Fewer than 100                                             |
| Rendering                    | 45 FPS minimum, 60 FPS preferred, p95 at most 33.3 ms      |
| Guided reaction cadence      | At least 4 meaningful reactions per active minute          |
| Immersive reaction cadence   | At least 5 meaningful reactions per active minute          |
| Median inter-reaction gap    | 15 seconds or less                                         |
| Completion                   | No trap; support and audio-failure text paths remain valid |

The guided threshold is intentionally below the product aspiration of one
reaction every 5–12 seconds because a first-time N5 learner reads Vietnamese
operational help. The immersive target remains at the lower edge of that
aspiration. A failed cadence result triggers measurement and pacing analysis,
not deletion of learning support or invention of extra clicks.

### Evidence and privacy

Reaction cadence derives only from existing `REACTION` events and the local
active-time clock. It remains on localhost and in the current learner-facing
recap or development diagnostics. Raw TYPE text, normalized answers, learner
identity, and private chat history are not added. The recap uses terms such as
`unaided`, `assisted`, and `needs more practice`; it must not claim mastery,
JLPT readiness, or a percentage grade.

### Third-party, cost, and operation review

| Area                             | M9 effect |
| -------------------------------- | --------- |
| Incremental or recurring cost    | USD 0     |
| New service/API/model            | None      |
| New package/dependency           | None      |
| New asset/download               | None      |
| New account/key/environment name | None      |
| Learner data leaving localhost   | None      |

## Implementation approach

Keep one runtime and one accepted lesson package. Add a small presentation
mode to the authoring/library home so ordinary entry shows learner actions and
the development surface remains explicitly available, preferably through the
existing debug query rather than another application or router dependency.
Reuse the current compiler client and library APIs; do not bypass explicit
publication or create another storage lifecycle.

Calculate cadence from current-session event snapshots in pure code. The
calculation should accept active-time reaction timestamps, return zero-safe
counts/rates/gaps, and remain independent of DOM and persistence. Extend the
existing runtime snapshot rather than the EvidencePersistence schema unless
implementation proves a schema change is unavoidable and the user approves it
separately.

Render a compact completion recap in the existing lesson DOM. Keep the 3D
world visible, retain Japanese-first copy, and provide two primary exits:
replay and return to the lesson library. Development diagnostics remain
separate and do not become the learner recap.

## Milestones

### 1. Lock the learner shell and metric gate

Approve this plan, its learner/development separation, truthful recap fields,
and representative thresholds. Record the accepted decision before code.

Observable checkpoint: M9 has no unresolved UI ownership, metric definition,
cost, privacy, or package-identity decision.

### 2. Build the learner-first entry and library flow

Refactor only the presentation in `apps/web/src/authoring/home.ts` and
`apps/web/src/style.css`. Keep target entry, approved-profile review,
publication, and library launch intact. Move speech generation, technical
regression, transport warning, and destructive cache controls behind the
explicit development surface.

Observable checkpoint: a learner sees how to create/start the Last Train
adventure without navigating authoring and audio-engine controls; development
tools remain recoverable.

### 3. Add deterministic cadence and completion recap

Add a pure cadence calculation near `apps/web/src/lesson/runtime.ts`, focused
unit coverage, and learner-facing recap rendering in
`apps/web/src/ui/shell.ts`. Reuse existing reaction and step-result truth. Add
return-to-library behavior without reloading or mutating accepted lesson
content.

Observable checkpoint: completion shows target/evidence/cadence facts and
offers replay/library actions without a mastery claim or new persistence.

### 4. Perform bounded product polish

Review only defects exposed by the learner shell and completion flow:
responsive overlays, focus, primary-action hierarchy, world visibility, and
unnecessary presentation delay. Do not tune accepted audio/world/content
identities. If cadence misses the threshold, identify whether the gap is
learner idle, instruction reading, movement, or presentation before changing
anything.

Observable checkpoint: the accepted slice remains world-dominant and a
representative learner can finish without engineering knowledge.

### 5. Verify and hand off M9

Run supported non-browser checks, record build/runtime facts, and hand the user
one concise guided/immersive matrix. Record only tests the user actually runs;
an explicit waiver remains a waiver rather than PASS.

Observable checkpoint: M9 results and known risks are durable, and the project
can decide whether to enter M10 or the local release-candidate gate.

## Progress

- [x] 2026-08-29 — Close M8 under D-055 with C2–C6 explicitly waived.
- [x] 2026-08-29 — Audit M9 against delivered M8 scope and identify product
      shell, truthful completion recap, and reaction-density measurement as
      the smallest remaining coherent slice.
- [x] 2026-08-29 — User approves the plan and thresholds with
      `DUYỆT PLAN M9 PRODUCT SLICE`.
- [x] 2026-08-29 — Record D-056 and authorize the bounded product-shell,
      completion-recap, cadence, and measured-polish implementation.
- [x] 2026-08-29 — Implement Milestones 2–4: learner-first root, explicit
      `debug=1` development surface, current-visit cadence, truthful completion
      recap, replay/library exits, and bounded responsive polish.
- [x] 2026-08-29 — Pass web typecheck, lint, 82/82 web tests, full production
      build, formatting, and diff hygiene without changing accepted M8
      content/audio/world identities.
- [ ] Complete user-run manual A/B/C and record one named guided and immersive
      cadence/performance observation.
- [x] 2026-08-29 — User approves `DUYỆT PLAN M9 CADENCE DEDUP`; D-057 defines
      one meaningful reaction as one `sessionId + stepId + attempt` group while
      preserving target-level evidence rows unchanged.
- [x] 2026-08-29 — Implement D-057 in the runtime, recap, and diagnostics;
      focused duplicate-target, retry, conflicting-outcome, and cadence tests
      pass as part of 86/86 web tests.
- [x] 2026-08-29 — Pass full typecheck, lint, formatting, 57 schema artifacts,
      86/86 web tests, the full production build, and diff hygiene after D-057.
- [x] 2026-08-29 — User directs `bỏ qua kiểm tra phần này`; D-058 records the
      corrected guided and immersive cadence retest as `WAIVED_BY_USER`, not
      PASS, and does not reuse the invalid first screenshot.
- [x] 2026-08-29 — User approves `DUYỆT PLAN M9 FINAL SMOKE`; D-059 compresses
      the remaining B/C acceptance into immersive Help, speech-failure text
      recovery, narrow mission-card ownership, and `debug=1` development-mode
      checks without reopening cadence.
- [x] 2026-08-29 — User reports `M9 FINAL S1: PASS` and directs `bỏ qua phần
      test`; D-060 records S1 PASS, S2–S4 as `WAIVED_BY_USER`, and closes
      focused M9 without inferring omitted results.

## Surprises and discoveries

- M8 already delivered most of the original M9 world, lesson, audio, compiler,
  evidence, failure-recovery, and beginner-support scope. Rebuilding those
  components would reopen accepted gates without advancing product learning.
- The accepted guided run already provides enough local evidence to calculate
  a provisional 4.90 reactions/minute observation, but deliberate help and
  diagnostics make it unsuitable as the final representative baseline.
- The current root experience exposes speech authoring and regression controls
  beside learner actions. This is useful for development but is the largest
  remaining product-surface mismatch.
- Persisted events carry step-relative active latency rather than a global
  active-time timestamp. M9 therefore measures inter-reaction gaps only for the
  currently open visit and says so explicitly instead of reconstructing false
  historical gaps after resume.
- Hiding development cards alone was insufficient because refresh could still
  auto-render an old technical compilation. Ordinary mode now suppresses that
  handoff and exposes it only after switching to the development surface.
- Full-root `npm test` exposed a reproducible Node.js 24.18.0 native teardown
  abort after all six unchanged server audio assertions execute. Contracts
  pass 46/46, web passes 82/82, and separately run compiler/persistence server
  tests pass 11/11; the root suite remains truthfully not PASS until the
  unrelated runner crash is resolved.
- The first user screenshot of the M9 completion recap reaches 9/9 and shows
  target coverage 6/6, 19 REACTION evidence rows, 0/9 unaided/assisted step
  results, 1:16 active time, 15.0 reactions/minute, and 0.0/13.5-second
  median/p95 gaps. The zero median exposes a metric-semantics defect: one
  learner attempt can emit one REACTION row per assessed target, and the M9
  calculation currently counts those simultaneous target-evidence rows as
  separate meaningful reactions. The UI path is observable, but cadence is not
  accepted until attempts are deduplicated.
- D-057 now groups those target rows without changing the event sink or SQLite
  schema. A conflict inside a group fails conservatively as an incorrect
  attempt, and the current active visit receives only one cadence timestamp per
  group.

## Plan decisions

- 2026-08-29 — Recommend one product-shell/measurement plan over a second
  vertical-slice implementation.
- 2026-08-29 — Recommend no new package, asset, utterance, dependency, service,
  model, account, key, or external data flow.
- 2026-08-29 — Recommend local reaction cadence and truthful assisted/unaided
  recap, never a mastery score.
- 2026-08-29 — Recommend retaining developer recovery routes behind an
  explicit development surface rather than deleting them.
- 2026-08-29 — D-056 accepts this plan, its zero-cost/no-new-input boundary,
  and its representative local acceptance thresholds.

## Validation

### Static and automated checks

Run from `/home/nunu/Desktop/nnlab/nn-bunbun` with Node.js 24.18.0:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. `npm run schema:check`
5. `npm test`
6. `npm run lesson:m8:content-approval-check`
7. `npm run lesson:m8:speech-approval-check`
8. `npm run lesson:m8:study-check`
9. `npm run audio:m8:runtime-check`
10. `npm run world:m8:runtime-check`
11. `npm run build`
12. `git diff --check`

Focused tests should cover zero/one/multiple reaction cadence, long gaps,
assisted/unaided recap counts, completion actions, ordinary learner mode,
explicit development mode, and accepted-profile/library regressions.

Automated browser E2E remains excluded under D-011. Docker remains not
applicable under D-015 until the user accepts a local release candidate.

### Manual happy path

1. Open ordinary Bunbun without a debug query.
2. Enter or select the approved Last Train targets and complete local review/
   publication without seeing speech-engine or technical-regression controls.
3. Start recommended guided play, complete 9/9, inspect the truthful recap,
   return to the library, and replay.
4. Record cadence and the named local performance diagnostics.

### Manual edge cases

1. Open immersive mode and request Help; assisted results remain distinct.
2. Complete with Japanese speech unavailable; recap never claims HEARD.
3. Use narrow and wide viewports; mission and completion UI do not cover the
   learning interaction.
4. Open development mode; speech gates, regression routes, diagnostics, and
   local-data controls remain available and clearly non-learner-facing.
5. Repeat target creation/publication rapidly; immutable compilation and
   library identities remain idempotent.

### Manual regression

1. Existing M7 park authoring still reaches `AUTHORING_HANDOFF`.
2. Authored park and direct fixed Last Train regression routes still play.
3. Reload/resume, background audio, forced WebGL2, missing asset, persistence,
   and confirmed reset retain their existing safe behavior.
4. Content, study, speech, audio, world, and package approval hashes remain
   unchanged.

### Manual results

| Scenario                                               | Tester  | Date       | Result                   | Evidence or notes                                                                                            |
| ------------------------------------------------------ | ------- | ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| A — learner-first guided product flow                  | User    | 2026-08-29 | Observed; metric invalid | Completed 9/9; 6/6 targets, 19 evidence rows, 1:16 active, 15.0/min, median/p95 0.0/13.5 s; no PASS inferred |
| B — immersive/help/audio-failure/responsive edge cases | User    | 2026-08-29 | Superseded by D-059/D-060 | S1 PASS; S2–S3 waived                                                                                        |
| C — development and accepted-runtime regressions       | User    | 2026-08-29 | Superseded by D-059/D-060 | S4 waived; broad matrix not run                                                                              |

D-059 replaces the broad pending B/C execution with four named smoke results:
`S1_IMMERSIVE_HELP`, `S2_AUDIO_FALLBACK`, `S3_RESPONSIVE_MISSION`, and
`S4_DEBUG_SURFACE`. The older B/C rows remain historical scope labels and are
not independently inferred as PASS.

| D-059 smoke result       | Tester | Date       | Result           | Evidence or notes                         |
| ------------------------ | ------ | ---------- | ---------------- | ----------------------------------------- |
| S1_IMMERSIVE_HELP        | User   | 2026-08-29 | PASS             | Explicit user report                      |
| S2_AUDIO_FALLBACK        | User   | 2026-08-29 | WAIVED_BY_USER   | Not run; waived under D-060               |
| S3_RESPONSIVE_MISSION    | User   | 2026-08-29 | WAIVED_BY_USER   | Not run; waived under D-060               |
| S4_DEBUG_SURFACE         | User   | 2026-08-29 | WAIVED_BY_USER   | Not run; waived under D-060               |

## Recovery and compatibility

No migration or accepted package revision is planned. Presentation changes
must preserve current API payloads, compilation IDs, lesson revisions, speech
cache rows, evidence, checkpoints, preferences, and local reset. If learner
mode fails, explicit development mode retains the current authoring/library
surface. If cadence calculation fails, omit the metric with a visible local
diagnostic rather than blocking lesson completion.

Rollback removes the product-shell and recap presentation while leaving all
accepted M8 data and runtime routes intact. No cleanup command deletes learner
or authoring data.

## Documentation updates

- Add the accepted M9 decision to `docs/DECISIONS.md` after approval.
- Update learner flow and recap semantics in `docs/BUNBUN_VISION.md`,
  `docs/GAMEPLAY.md`, and `docs/BUNBUN_ARCHITECTURE.md`.
- Record metric definition and actual observations in `docs/PERFORMANCE.md`.
- Update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, and this plan after every
  meaningful checkpoint.
- Add secret-free shared-memory records for approval and acceptance.

## Outcomes

Focused M9 is complete under D-060. The ordinary root is now a
learner surface, while `debug=1` preserves local authoring, speech, regression,
diagnostic, and data controls. Completion presents only current-visit evidence
facts and cadence with an explicit non-mastery disclaimer, plus replay and
library exits. D-057 now deduplicates target-level evidence into one meaningful
reaction per learner attempt for recap and cadence while preserving raw rows.
Supported non-browser checks pass. The corrected cadence browser retest is
`WAIVED_BY_USER` under D-058; no named cadence value is inferred from the
invalid first M9 run or from M8 evidence. Other manual learner observations
remain uncollected. Final smoke S1 is user-reported PASS; S2–S4 are
`WAIVED_BY_USER`, not PASS. These limitations carry into any later local
release-candidate review.
