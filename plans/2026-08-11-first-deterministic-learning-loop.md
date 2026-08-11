# Play the first deterministic Japanese learning loop

Status: Implemented, awaiting manual acceptance
Owner: Codex and user
Created: 2026-08-11
Last updated: 2026-08-12 00:32 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Turn the accepted park runtime into the first small playable Bunbun lesson. At
completion, the user can start an authored FIND_SOMETHING lesson, hear and
replay a Japanese request, select the dog rather than the cat in the 3D world,
answer one deterministic Japanese choice, receive immediate correct, incorrect,
or assisted feedback, and reach a clear completed state.

The visible experience alternates between the existing world-dominant EXPLORE
state and a focused DOM INTERACTION overlay. Wrong answers remain recoverable,
help and authored scaffolds are observable, rapid repeated input cannot double-
advance the lesson, and in-memory diagnostic events show what the learner did
without introducing persistence or analytics transport.

This milestone proves that a fully validated LessonManifest drives fixed runtime
mechanics. It does not generate a lesson, persist evidence, claim mastery, ship
production TTS, or implement the five remaining primitives.

## Repository context

Milestones 0 through 3 are complete. packages/contracts implements strict
LessonManifest and CatalogSnapshot 0.1.0 schemas, TypeScript types, structural
and semantic validation, one authored one-step FIND_SOMETHING fixture, six
invalid fixtures, and 14 tests. apps/web renders the park_small technical
fixture through Three.js 0.185.1 with stable dog, cat, and guide IDs, canvas
picking, direct movement, lifecycle recovery, and diagnostics. Its current
runtime treats clicks as free technical selection and has no lesson controller,
lesson overlay, audio adapter, attempt policy, scaffolds, transitions, or
evidence.

The current contract fixture includes an audioAsset record and one CLICK_OBJECT
step, but it does not exercise LISTEN, CHOOSE, EXPLORE/INTERACTION transitions,
or multi-step completion. The web currently imports only the isolated contract
version. Root development commands build packages/contracts before starting the
server and web workspaces, so the client can safely consume the full validation
entry point in this milestone.

D-001, D-002, D-003, D-004, D-005, D-008, D-011, D-013, D-015, D-017, and
D-018 govern the work. Accepted D-019 defines the narrow lesson executor,
temporary audio adapter, in-memory event boundary, and input semantics used by
this implementation.

The canonical repository is /home/nunu/Desktop/nnlab/nn-bunbun. The working
tree was clean at the start of planning, with Milestone 3 recorded at 6a44abd on
main. origin/main remains at the published Milestone 2 commit 27355c0; pushing
is not part of this plan.

## Scope

### In scope

- Add one new authored, valid three-step FIND_SOMETHING lesson fixture without
  changing or removing the accepted Milestone 2 one-step fixture.
- Compose the fixture as LISTEN → CLICK_OBJECT → CHOOSE using park_small, the
  existing guide, dog, cat, catalog, and Vietnamese support text.
- Export the reviewed lesson and catalog fixtures through explicit package
  fixture subpaths rather than duplicating lesson data inside the web app.
- Validate the full manifest and catalog in the browser before renderer or scene
  activation, and show stable diagnostic errors without partial world state.
- Add a closed Milestone 4 capability validator for park_small, LISTEN,
  CLICK_OBJECT, CHOOSE, supported scaffolds, known presentation cues, and the
  reviewed audio ID.
- Add a pure lesson reducer/controller with explicit state, input events, and
  effects for step entry, attempts, feedback, scaffold escalation, transition,
  completion, and fatal runtime errors.
- Honor maximumAttempts, afterMaximum, onSuccess, onFailure, onAssisted, and
  requiredStepIds without inferring missing behavior.
- Use manifest.randomSeed for stable CHOOSE option ordering.
- Add an in-memory session clock that excludes hidden-tab time from active step
  latency.
- Record session-local reaction and evidence events with deterministic
  idempotency keys; record exposure, heard, correct, incorrect, and assisted
  outcomes without claiming mastery.
- Put audio behind an AudioPlaybackPort and use a narrowly documented desktop
  SpeechSynthesis adapter for the technical fixture after a learner gesture.
- Record heard evidence only after the adapter reports playback start, and make
  replay idempotent with respect to evidence.
- Add explicit local failure controls for invalid manifest and unavailable
  audio acceptance paths without adding an environment variable.
- Add an accessible Japanese-first lesson overlay for stimulus, audio replay,
  continue, help, choices, feedback, progress, completion, and restart.
- Keep support text hidden until authored ALWAYS visibility or learner help
  reveals it.
- Bridge registered world-object activations into CLICK_OBJECT only when the
  active step permits them; keep noncandidate and DOM input from advancing.
- Add world highlight and candidate-reduction behavior needed by the authored
  scaffolds and existing cue registry.
- Preserve Milestone 3 renderer fallback, movement where EXPLORE permits it,
  resize, pause/resume, diagnostics, failure recovery, and disposal.
- Add focused Node tests for the pure controller, capability validation,
  deterministic shuffle, idempotent events, active timing, and the new fixture.
- Record build-size and manual time-to-first-stimulus/reaction results without
  adding automated browser E2E tooling.

### Out of scope

- ARRANGE, TYPE, MOVE_TO as a lesson primitive, PICK_UP, GIVE, SPEAK, or any new
  interaction type.
- A general narrative engine, expression language, arbitrary branching, timers
  used as punishment, physics, inventory, or combat.
- AI lesson compilation, prompts, model calls, open-ended evaluation, or runtime
  content generation.
- Production OpenAI TTS, cache files, provider keys, voice-quality acceptance,
  offline audio guarantees, or the Milestone 8 audio pipeline.
- SQLite, localStorage, IndexedDB, evidence upload, analytics, mastery,
  scheduling, learner identity, reload resume, or cross-device behavior.
- Final product learner level, first product scene, target set, or content polish
  from O-001 and O-002.
- React, a generic state-machine dependency, a general event bus, a new server
  API, Docker, deployment, or automated browser testing.

## Decisions and constraints

Accepted D-019 fixes these important choices:

- The authored technical lesson has exactly three sequential steps: a LISTEN
  exposure, a dog-versus-cat CLICK_OBJECT recognition task, and a seeded CHOOSE
  confirmation task. It is sufficient to prove the loop without expanding
  content breadth.
- A reducer-style pure controller returns state plus explicit effects. Browser
  orchestration owns timers, audio, DOM, and world calls; Three.js does not own
  lesson truth.
- Full shared validation runs before scene activation. Runtime capability
  validation is an additional allowlist, not a weaker replacement.
- Session and evidence records live in memory and reset on reload. This is
  explicit temporary behavior until Milestone 6, not accidental data loss.
- The technical SpeechSynthesis adapter is isolated behind AudioPlaybackPort,
  starts only after a user gesture, and never counts heard evidence before its
  start event. D-008 remains the production direction and Milestone 8 replaces
  the adapter with cached audio.
- If speech is unavailable, the learner sees a clear error, may reveal the
  Japanese text/support path, and can complete with assisted status. The runtime
  does not silently claim heard evidence.
- LISTEN playback or replay is exposure and does not count as a meaningful
  Japanese reaction by itself. CLICK_OBJECT and CHOOSE attempts do count,
  including genuine wrong attempts.
- A correct answer after help or an active scaffold is assisted. A maximum-
  attempt CONTINUE_ASSISTED outcome completes and transitions without claiming
  unaided correctness.
- Feedback locks new submissions until its authored short interval ends. A
  rapid duplicate submission cannot emit a second event or transition.
- No environment variable is needed. The query controls are
  `manifestFailure=1` and `audioFailure=1`, alongside the accepted Milestone 3
  controls.

## Implementation approach

### Validated fixture and capability gate

Add a second contracts fixture, valid-find-dog-loop.json, and leave
valid-find-dog.json unchanged as the Milestone 2 baseline. The new manifest has
three forward-only required steps and enough EXPOSES/ASSESSES bindings to meet
its vocabulary goal across at least two contexts. Its graph ends only after all
three steps. Contract tests and the inspector prove the manifest against
basic-catalog.json.

Expose only these reviewed JSON fixtures through package subpaths. The web loads
them as unknown input and calls validateLessonPackage before it creates the
renderer. A narrow web capability check then confirms that scene, IDs,
primitive types, scaffold kinds, cue IDs, and audio IDs have local executors.
Either layer returns sorted stable diagnostics to the existing recoverable DOM
error boundary. A developer failure query mutates a disposable parsed copy, not
the imported fixture object, so retry can use the original known-good data.

### Pure lesson controller

Create a small lesson/ directory in apps/web. The controller state contains the
current step, runtime mode, phase, attempt count, active support/scaffolds,
completed required steps, seen event keys, and completion status. Inputs are
closed events such as AUDIO_STARTED, AUDIO_ENDED, CONTINUE, OBJECT_SELECTED,
OPTION_SELECTED, HELP_REQUESTED, FEEDBACK_ELAPSED, and AUDIO_FAILED. The reducer
checks the active primitive before accepting an event and returns explicit
effects such as PLAY_AUDIO, SHOW_FEEDBACK, APPLY_WORLD_PRESENTATION,
WRITE_SESSION_EVENTS, ENTER_STEP, or COMPLETE_LESSON.

Wrong attempts emit one reaction/evidence result. Before maximumAttempts they
apply authored scaffolds for that attempt, show incorrect feedback, and return
to the same step. At the maximum, FOLLOW_FAILURE_TRANSITION follows onFailure;
CONTINUE_ASSISTED applies the final support, records an assisted terminal
result, and follows onAssisted. A correct unassisted attempt follows onSuccess;
a correct attempt after help follows onAssisted. Completion asserts that every
required step completed even though semantic validation has already proven the
graph.

CHOOSE order uses a small deterministic shuffle derived from randomSeed plus
step identity. It never mutates the manifest options. Restarting the lesson with
the same manifest produces the same ordering.

### In-memory events and active time

Use a monotonic injected clock for response latency and a wall-clock timestamp
only for diagnostics. Pause active elapsed time while document.hidden is true.
Give the session a runtime-generated ID, then derive each idempotency key from
session, step, attempt, target, category, and result kind. Store events in a
Map keyed by that ID so repeated effects are harmless.

Step entry records encountered exposure once per exposed target. Successful
audio start records heard once even after replay. CLICK_OBJECT and CHOOSE record
every genuine attempt with submitted stable IDs, correctness, attempt number,
support/help state, and active latency. No record leaves memory, no learner ID
is invented, and diagnostics show counts and sanitized technical values only.

### Audio, DOM, and world orchestration

AudioPlaybackPort accepts only a reviewed audio ID. Its initial adapter creates
a SpeechSynthesisUtterance from the validated registry text, requests ja-JP,
and resolves start/end/error callbacks. A start button provides the required
browser gesture. Replay reuses the port but cannot create duplicate heard
evidence. Disposal cancels owned speech. The audio-failure query returns a
controlled adapter failure for manual recovery testing.

Extend the DOM shell with one lesson region above the world: concise Japanese
stimulus, optional speaker, replay, continue, help, choice buttons, feedback,
step progress, completion, and restart. Build dynamic text with textContent and
real elements rather than interpolating manifest strings into innerHTML. Keep
focus inside the active interaction controls when appropriate and return focus
to the canvas for CLICK_OBJECT.

Refactor the world runtime into a narrow lesson bridge: report stable object IDs
instead of deciding lesson outcomes, accept the active candidate allowlist,
highlight authored IDs, apply known cue effects, and suspend conflicting world
input during INTERACTION. Ground movement remains a technical EXPLORE behavior
but never counts as a lesson reaction. The bridge owns no attempts, feedback,
transitions, or evidence.

Main composition validates content, boots the world, constructs the controller,
connects effects to the shell/audio/world adapters, and owns one teardown path.
It retains one-shot retry behavior for simulated startup failures.

## Milestones

### 1. Establish the playable content boundary

Add the three-step fixture, fixture exports, contract test, browser-side package
validation, capability allowlist, and stable error presentation. The observable
checkpoint is that the valid package reaches runtime boot while a simulated
invalid or unsupported package fails before the 3D scene activates.

### 2. Implement deterministic lesson state and events

Add the reducer, seeded shuffle, bounded attempt/scaffold rules, transitions,
completion invariant, active clock, idempotent in-memory event sink, and focused
tests. The observable checkpoint is a headless simulation of correct, wrong,
helped, maximum-attempt, repeated-input, and completion paths.

### 3. Add Japanese audio and learning overlays

Add AudioPlaybackPort, the SpeechSynthesis technical adapter, start/replay/error
behavior, Japanese-first DOM interaction UI, help, feedback, choices, progress,
completion, restart, and focus management. The observable checkpoint is a full
LISTEN and CHOOSE path without world-input leakage.

### 4. Connect the lesson to the park

Convert world selection into candidate-filtered CLICK_OBJECT input, add
highlights and known cues, preserve EXPLORE movement, suspend conflicting input
in INTERACTION, and connect diagnostics. The observable checkpoint is the
complete LISTEN → dog selection → CHOOSE → completion loop.

### 5. Verify and hand off

Run clean install, schemas, typecheck, lint, format, tests, inspector, build,
bundle measurement, HTTP regression, and scope review. Update durable docs and
provide the manual happy/edge/regression matrix. The plan remains open until
the user reports actual browser results.

## Progress

- [x] 2026-08-11 23:21 — Re-read vision, architecture, gameplay, manifest,
  decisions, current state, roadmap, performance, and ExecPlan instructions.
- [x] 2026-08-11 23:21 — Inspect the clean Milestone 3 runtime, contracts,
  fixtures, validation exports, package scripts, recent commits, and durable
  memory.
- [x] 2026-08-11 23:21 — Draft D-019 and this plan without beginning
  implementation.
- [x] 2026-08-11 23:30 — Receive explicit user approval for D-019 and this
  ExecPlan.
- [x] 2026-08-11 23:54 — Add the reviewed three-step fixture, fixture exports,
  strict pre-render validation, and the closed runtime capability gate.
- [x] 2026-08-11 23:54 — Implement the pure lesson controller, deterministic
  shuffle, bounded scaffolds, active clock, idempotent events, audio port,
  Japanese-first UI, focus transitions, and park bridge.
- [x] 2026-08-11 23:54 — Add manifest/audio failure controls, lesson timing and
  event diagnostics, focused tests, and the web-test contract prebuild.
- [x] 2026-08-12 00:00 — Pass schema drift, typecheck, lint, format, 37 tests,
  fixture inspection, production build, diff check, scope scan, and local HTTP
  health/404/web-module regression.
- [x] 2026-08-12 00:00 — Update architecture, performance, README, decisions,
  current state, roadmap, plan index, and this ExecPlan for manual handoff.
- [x] 2026-08-12 00:05 — Record the user's first manual failure: picking showed
  `Selected ID: dog` at 7.9 ms, but `find_dog` stayed `AWAITING_OBJECT` with
  zero reactions. The screenshot also exposed the invalid cumulative 15,542
  draw-call display.
- [x] 2026-08-12 00:11 — Replace the indirect world callback with an atomic
  candidate-and-handler input gate, correct diagnostics to per-frame
  `render.drawCalls`, add the exact animal-selection regression, and pass 38
  tests plus all static and production-build gates.
- [x] 2026-08-12 00:25 — Receive user confirmation that animal clicking works;
  record the follow-up UX failure that the centered translucent EXPLORE card
  makes the world appear disabled behind a modal.
- [x] 2026-08-12 00:32 — Convert EXPLORE to a compact left-side mission card,
  reduce edge dimming, add an active-world cursor and explicit bilingual world
  click cue, then pass static checks, 38 tests, and production build.
- [ ] Receive and record the user's manual happy-path, edge-case, regression,
  audio, and performance results; then close Milestone 4.

## Surprises and discoveries

- The accepted valid fixture already contains an audioAsset and Japanese
  utterance, but its graph has only one CLICK_OBJECT step. Mutating it would
  weaken its value as the Milestone 2 baseline, so Milestone 4 should add a
  separate fixture.
- The shared package exports the full browser-compatible Ajv and semantic
  validation path, but the web intentionally imported only the version during
  Milestone 2. Milestone 4 is the first justified point to pay the validation
  bundle cost; the production build must record the change.
- The current world runtime decides selection presentation directly. It needs a
  narrow event/command bridge, not a second renderer or a general entity system.
- No persisted evidence-event schema exists despite the normative documentation
  describing its desired fields. A runtime-local in-memory record avoids
  prematurely fixing the Milestone 6 storage contract.
- The environment has no repository audio fixture, provider configuration, or
  local Japanese TTS command-line engine. Browser SpeechSynthesis is available
  as a technical adapter but needs an explicit learner gesture and cannot make
  production voice or cache guarantees.
- Full browser validation increases the production JavaScript from the
  Milestone 3 value of 852,644 bytes to 1,229,245 bytes minified (340.84 kB
  gzip). The known chunk warning remains visible pending real first-stimulus
  measurements.
- A direct web-test command must build packages/contracts first because its
  runtime export resolves to generated JavaScript. The web workspace now owns
  that pretest step so a stale local dist cannot create a false pass.
- Manual picking proved that selection presentation and lesson submission can
  diverge when candidates and the callback are registered through separate
  lifecycle paths. The world gate now configures them as one atomic boundary.
- WebGPURenderer 0.185.1 exposes cumulative `render.calls` separately from
  current-frame `render.drawCalls`; the original diagnostics used the wrong
  field even though triangle reporting was frame-local.

## Plan decisions

- 2026-08-11 — Propose D-019 as one coherent narrow slice; do not implement
  until the user approves or changes it.
- 2026-08-11 — Preserve valid-find-dog.json and add a separate multi-step
  fixture so Milestone 2 regression evidence remains stable.
- 2026-08-11 — Keep the controller pure and persistence-free; browser adapters
  own side effects and Milestone 6 owns durable event contracts.
- 2026-08-11 — Recommend a temporary SpeechSynthesis AudioPlaybackPort because
  it proves real LISTEN start/replay/failure semantics without pulling the
  OpenAI TTS/cache milestone forward.
- 2026-08-11 — Accept D-019 and the ExecPlan on the user's explicit `DUYỆT
  MILESTONE 4`, then implement only the approved three-primitive slice.

## Validation

### Static and automated checks

Run from /home/nunu/Desktop/nnlab/nn-bunbun with Node.js 24.18.0/npm 11.16.0:

- npm ci
- npm run schema:check
- npm run typecheck
- npm run lint
- npm run format:check
- npm test
- npm run inspect:manifest -- \
  packages/contracts/fixtures/manifests/valid-find-dog-loop.json \
  packages/contracts/fixtures/catalogs/basic-catalog.json
- npm run build
- git diff --check
- record the web JavaScript/CSS and authored content sizes;
- verify the web bundle and source contain no persistence, network analytics,
  AI, provider keys, new primitive types, physics runtime, Playwright, Docker,
  or deployment code.

Focused tests must cover:

- the new fixture passes structural and semantic validation;
- unsupported primitive, scaffold, cue, scene, and audio IDs fail capability
  validation before scene activation;
- LISTEN records encountered and heard once, including replay;
- SpeechSynthesis failure creates no heard evidence and remains recoverable;
- correct CLICK_OBJECT and CHOOSE paths transition and complete;
- wrong attempts increment exactly once and activate only the authored support;
- maximum attempts follow assisted or failure transitions correctly;
- help marks later success assisted;
- seeded option order is stable and does not mutate the manifest;
- repeated submissions during feedback cannot duplicate events or transitions;
- required-step completion is asserted;
- hidden time is excluded from active response latency; and
- restart creates a new in-memory session without retaining prior events.

D-011 excludes automated browser E2E tooling.

### Manual happy path

1. Run nvm use, npm ci, and npm run dev, then open the default local URL.
2. Confirm Japanese stimulus appears promptly and a clear learner action starts
   audio without relying on blocked autoplay.
3. Start audio, replay it, and continue; confirm replay does not increase heard
   evidence twice in diagnostics.
4. Confirm the overlay yields to the world for CLICK_OBJECT, click the dog, and
   observe short correct Japanese feedback.
5. Confirm the CHOOSE overlay appears with seeded options, select 犬, and observe
   the completion message.
6. Confirm two meaningful reactions, completed required steps, one terminal
   result per step, and expected assisted/unaided flags in diagnostics.
7. Restart and confirm the same option order with a fresh session and empty
   event history.

### Manual edge cases

1. Click the cat once and confirm one incorrect event, short feedback, and the
   authored highlight/retry state; no step transition occurs.
2. Reach maximum wrong attempts and confirm the authored assisted path completes
   without claiming unaided success or trapping the learner.
3. Choose the wrong Japanese option, use help, and complete correctly; confirm
   support text visibility and assisted status.
4. Double-click dog, choices, continue, replay, help, and restart; confirm each
   accepted action emits once and no step is skipped.
5. Click noncandidate scenery, ground, and world objects during INTERACTION;
   confirm they do not advance the lesson or steal overlay focus.
6. Open with `?audioFailure=1`, confirm a visible recoverable audio state, no
   heard evidence, and an assisted text path that can finish the lesson.
7. Open with `?manifestFailure=1`, confirm validation fails before scene
   activation with a stable code and retry restores the known-good fixture.
8. Background the tab during stimulus, feedback, and active response; confirm no
   huge latency, skipped feedback, or duplicate transition on resume.
9. Reload mid-lesson and confirm the documented Milestone 4 behavior starts a
   clean new session rather than pretending persistence exists.
10. Resize narrow/wide and force WebGL2; confirm Japanese overlay readability,
    picking alignment, and completion remain intact.

### Manual regression

1. Confirm the Milestone 3 technical selection, movement, zoom, diagnostics,
   renderer fallback, asset retry, resize, background/resume, and disposal paths
   still work outside conflicting INTERACTION input.
2. Confirm GET /health and JSON 404 still report contractVersion 0.1.0.
3. Run all original contract fixtures and confirm their intended outcomes remain
   unchanged.
4. Confirm lesson strings render as text, no arbitrary HTML or asset URL is
   interpreted, and an unsupported valid primitive fails closed.
5. Confirm no localStorage, IndexedDB, SQLite, evidence upload, AI, production
   TTS, or hidden network call appears.
6. Observe FPS, frame time, draw calls, scene-ready time, time to first Japanese
   stimulus, and reaction latency; report any visible regression rather than
   hiding it.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| First dog-selection handoff | User | 2026-08-12 | Fail | WebGL2 picked `dog`, but `find_dog` remained `AWAITING_OBJECT`; events/reactions stayed 4/0 |
| Corrected dog/cat handoff | User | 2026-08-12 | Pass | User confirms animal is clickable after the atomic input-gate fix |
| Initial EXPLORE affordance | User | 2026-08-12 | Fail | Centered translucent card looked modal; user could not tell the dimmed world remained interactive |
| Compact EXPLORE presentation and full loop | Pending user | Pending | Ready to retest | Mission card moved aside, dimming reduced, canvas cursor and bilingual click cue added |

## Recovery and compatibility

The change introduces no database, browser storage, API, migration, or secret.
Reload intentionally discards the technical session. The existing one-step
contract fixture remains unchanged. Browser validation and the capability gate
fail before renderer activation, so invalid content cannot leave a partial
lesson world.

Each runtime instance owns one AbortController, feedback timer set, audio port,
lesson controller, world runtime, and event sink. Restart and retry dispose those
resources before creating replacements. HMR and pagehide follow the same path.
SpeechSynthesis cancellation is limited to utterances owned by Bunbun where the
browser API permits it; no unrelated application state is stored.

If SpeechSynthesis cannot produce acceptable Japanese on the user's reference
browser, stop and amend D-019. The safe alternatives are a user-supplied reviewed
local audio fixture or resequencing production cached TTS; do not silently add a
provider, key, remote URL, or misleading tone.

## Documentation updates

- Accept or amend D-019 before implementation.
- Update BUNBUN_ARCHITECTURE.md with the controller, capability, audio, and
  in-memory event boundaries.
- Update GAMEPLAY.md only if implementation reveals a semantic conflict; do not
  silently redefine attempts, assisted outcomes, or meaningful reactions.
- Update LESSON_MANIFEST.md if executable contract behavior needs clarification;
  preserve contract version 0.1.0 unless semantics materially change.
- Record time-to-stimulus, reaction, audio, bundle, and render observations in
  PERFORMANCE.md.
- Update README.md with the lesson and failure-query controls.
- Update CURRENT_STATE.md, ROADMAP.md, plans/README.md, and this plan throughout
  implementation and acceptance.

## Outcomes

The approved implementation is complete and ready for manual acceptance. One
strictly validated authored package now drives a deterministic LISTEN →
CLICK_OBJECT → CHOOSE lesson through the existing park. The runtime owns no
arbitrary lesson code, AI, provider call, persistence, or mastery claim.

Static verification passes: schema artifacts 8/8, contracts 15/15 tests, web
23/23 tests, typecheck, lint, format, fixture inspection, production build,
diff check, scope scan, server health 200 with contractVersion 0.1.0, JSON 404,
and current Vite module delivery. The build contains 1,229,245-byte JavaScript
(340.84 kB gzip), 9,175-byte CSS (2.58 kB gzip), the 5,899-byte glTF fixture,
10,131-byte authored lesson JSON, 2,259-byte catalog JSON, and 520-byte HTML.

No dependency or lockfile changed, so the previously accepted isolated clean
offline install remains the install result; `npm ci` was not repeated in the
dirty implementation worktree. Docker remains not applicable because local-RC
acceptance intentionally precedes Dockerfiles. Browser automation remains
excluded by D-011. This plan stays open until the user completes and reports
the manual matrix above.
