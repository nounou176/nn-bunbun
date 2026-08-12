# Complete the fixed MVP interaction runtime

Status: Complete
Owner: Codex and user
Created: 2026-08-12
Last updated: 2026-08-12 11:22 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Complete Bunbun's closed eight-primitive runtime without adding a general game
engine. At completion, the user can play one authored park lesson that moves
through LISTEN, ARRANGE, CLICK_OBJECT, TYPE, MOVE_TO, PICK_UP, GIVE, and CHOOSE.
The learner hears a Japanese request, reconstructs it from stable tokens,
identifies and types the dog reading, walks to the relevant area, acquires or
escorts the dog, gives it to the requested character, and confirms the result.

The five new primitives have visible correct, incorrect, helped, and bounded
failure behavior. ARRANGE supports repeated surface text without confusing
token identity. TYPE applies only the manifest's ordered deterministic
normalization rules and remains safe during Japanese IME composition. MOVE_TO
finishes only after arrival at an authored location. PICK_UP and GIVE share one
task-scoped carry or escort slot, and a wrong recipient leaves that state
recoverable. Restart restores the authored world.

This milestone proves that the complete fixed interaction vocabulary can be
composed locally from validated data. It does not persist progress, compile
lessons with AI, add production audio, select the first product content slice,
or introduce inventory, pathfinding, physics, free-form evaluation, or new
primitive types.

## Repository context

Milestones 0 through 4 are complete. packages/contracts already defines all
eight LessonManifest 0.1.0 interaction variants and validates ARRANGE token
sequences, TYPE answers and normalization, MOVE_TO locations, PICK_UP object
affordances, and GIVE object-recipient pairs. The normalization implementation
currently lives as a private helper inside
packages/contracts/src/validation/semantic-interactions.ts, so a web executor
would risk duplicating contract semantics unless it is promoted to one shared
pure utility.

apps/web currently validates the authored package before scene activation and
then applies a closed Milestone 4 capability gate. Its pure controller accepts
only LISTEN, CLICK_OBJECT, and CHOOSE. The DOM shell has audio, choice, help,
feedback, and completion controls. The Three.js park exposes dog and cat object
selection plus generic ground movement through an atomic candidate-and-handler
input gate. It has no authored location target registry, selectable recipient,
lesson-directed arrival callback, arranged-token state, typed-answer state, or
carry state.

The existing basic catalog declares PICK_UP and GIVE affordances for dog and
cat but has no locations and only one entity. The code-owned park definition
places one guide and two animal objects. Milestone 5 therefore needs two
reviewed local locations and a second technical NPC so MOVE_TO can distinguish
destinations and GIVE can exercise a wrong recipient. These remain technical
fixtures and do not resolve the product content choices in O-001 or O-002.

D-001 through D-005, D-007, D-011, D-013, D-015, D-017, D-018, and D-019
govern the work. D-020 defines the executor, arrival, carry, normalization,
fixture, and recovery semantics; it was accepted with this ExecPlan before
implementation began.

The canonical repository is /home/nunu/Desktop/nnlab/nn-bunbun. Planning began
from a clean main worktree at local commit 8184ce3. origin/main remains behind
the accepted local Milestone 3 and 4 commits; publishing is outside this plan.

## Scope

### In scope

- Keep LessonManifest and CatalogSnapshot at contract version 0.1.0; implement
  existing variants rather than changing their shape.
- Export one shared pure TYPE normalization function from packages/contracts
  and use it in both semantic validation and the web runtime.
- Preserve the Milestone 2 one-step fixture and Milestone 4 three-step fixture.
- Add one authored eight-step HELP_SOMEONE technical fixture in this order:
  LISTEN, ARRANGE, CLICK_OBJECT, TYPE, MOVE_TO, PICK_UP, GIVE, CHOOSE.
- Include repeated ARRANGE surface text with distinct token IDs and an ordered
  accepted sequence.
- Exercise NFKC, trimming, selected Japanese punctuation removal, and kana
  equivalence through the TYPE fixture without fuzzy or semantic matching.
- Extend the basic catalog and code-owned park registry with two reachable
  locations, one second technical NPC recipient, stable spawn IDs, and only
  the cues required by the fixture.
- Extend the runtime capability gate for all eight primitives, reviewed IDs,
  supported scaffolds, authored location resolution, and world-state
  prerequisites. Unsupported valid variants still fail closed.
- Extend the pure lesson controller with explicit ARRANGE, TYPE, MOVE_TO,
  PICK_UP, and GIVE phases and inputs while retaining bounded attempts,
  feedback locking, explicit transitions, and idempotent effects.
- Honor attemptPolicy.preserveSubmittedState for ARRANGE and TYPE.
- Render ARRANGE and TYPE as accessible DOM controls with pointer and keyboard
  support, stable token identity, explicit submission, Unicode code-point
  length enforcement, and Japanese IME-safe input handling.
- Make authored locations visible and selectable only for an active MOVE_TO
  step. Lock the step while moving and complete it only after the runtime
  confirms arrival within arrivalRadius.
- Treat a movement command failure as a runtime failure, not a learner error:
  restore the awaiting-location phase without consuming an attempt or writing
  reaction evidence.
- Add one task-scoped carriedObjectId. A successful or deterministically
  assisted PICK_UP sets it; a wrong PICK_UP does not. A correct GIVE transfers
  and clears it; a wrong GIVE preserves it.
- For PICK_UP with CONTINUE_ASSISTED, allow automatic acquisition only when the
  final active REDUCE_OBJECT_CANDIDATES scaffold exposes exactly one accepted
  object. Reject any stateful assisted path that cannot be resolved
  deterministically.
- Represent the dog carry state as a small authored escort/follow presentation,
  not as a general inventory or physics attachment system.
- Generalize the atomic world input bridge to discriminated object, location,
  and recipient target modes without adding a generic event bus.
- Add dynamic Japanese-first EXPLORE instructions and highlights so the learner
  can tell whether to click an object, a location, or a character.
- Implement HIGHLIGHT_ENTITIES, SHOW_MEANING, and SHOW_PATTERN presentation as
  needed by the fixture while preserving existing scaffold behavior.
- Record ARRANGE token IDs, normalized TYPE text, location IDs, object IDs, and
  object-recipient pairs in the existing in-memory event boundary. Do not write
  raw pre-normalized TYPE input to that event sink; the UI draft may remain
  temporarily only when preserveSubmittedState requires it.
- Add one-shot local movementFailure and carryFailure query controls for manual
  recovery validation without adding environment variables.
- Add diagnostics for active world target mode, pending location, and carried
  object while retaining the accepted renderer and lesson metrics.
- Add focused contract and web tests for deterministic normalization, all new
  controller paths, stateful effects, input isolation, movement arrival,
  invalid carry state, and the complete fixture.
- Provide a manual happy-path, edge-case, regression, and performance matrix
  covering all eight primitives.

### Out of scope

- Any ninth primitive, SPEAK, open-ended TYPE evaluation, fuzzy matching, or
  runtime LLM call.
- Schema version 0.1.1 or 1.0, new manifest fields, a general world-state
  expression language, or compiler draft normalization.
- RECOGNITION_FALLBACK execution. A manifest using it remains rejected by the
  local capability gate rather than being ignored until its rejoin semantics
  receive a separate reviewed implementation.
- General inventory UI, multiple carried items, equipment, drag-and-drop as a
  required interaction, collision, navmesh, pathfinding, rigid-body physics,
  or character AI.
- Literal production animal-handling semantics. The dog follow behavior is a
  technical acquire/escort fixture for the existing PICK_UP contract.
- SQLite, localStorage, IndexedDB, resume, evidence transport, learner identity,
  mastery, scheduling, or analytics. Milestone 6 owns persistence decisions.
- AI compilation, backend APIs, production OpenAI TTS, cached media, provider
  configuration, or secret and environment-variable changes.
- Final learner level, support locale, scene, scenario, target set, production
  art, animation, or content polish from O-001 and O-002.
- React, a state-machine package, automated browser E2E tooling, Docker,
  hosting, release automation, or deployment.

## Decisions and constraints

- Accepted D-020 governs the approved implementation. The user approved the
  decision and this plan with `PASS` on 2026-08-12.
- The authored technical flow uses all eight primitives in one forward-only
  graph. This tests composition and avoids five disconnected demos.
- Contract 0.1.0 remains authoritative. Runtime capability validation narrows
  what this local fixture can execute but never weakens schema or semantic
  validation.
- ARRANGE compares stable token ID sequences, never displayed strings. Buttons
  move tokens between a bank and ordered answer area; drag-and-drop may not be
  the only completion path.
- TYPE applies normalization rules exactly once, in manifest order, through a
  shared contracts utility. It compares normalized exact values, counts Unicode
  code points for maximumLength, and does not modify an in-progress IME
  composition.
- The in-memory event records the normalized TYPE value only. This keeps M5
  deterministic and minimizes unnecessary raw learner text before M6 defines
  privacy and retention.
- LOCATION_SELECTED starts authored movement but does not yet write terminal
  learner evidence. LOCATION_REACHED evaluates the stored selection while
  preserving the selection-time reaction latency. MOVEMENT_FAILED clears the
  pending selection and consumes no learner attempt.
- Generic ground clicks remain ordinary navigation only when they do not
  conflict with an active lesson target. During MOVE_TO, only authored candidate
  location targets can submit a lesson decision.
- One carried object may exist. It is controller-owned lesson state mirrored by
  the world presentation; Three.js does not decide correctness or transitions.
- A wrong recipient cannot consume, replace, hide, or teleport the carried
  object. Correct GIVE applies the accepted pair and then clears carry state.
- Restart restores object placements, recipient presentation, locations,
  highlights, pending movement, and carry state. A failed terminal GIVE also
  leaves no stale carry after lesson completion.
- CONTINUE_ASSISTED may mutate carry state only from one uniquely exposed
  accepted PICK_UP candidate. Otherwise the capability gate rejects the
  authored path before scene activation.
- The second NPC and two locations are code-owned technical registry entries.
  Their existence is not an O-002 first-scene decision and does not establish
  production assets.
- All world and overlay submissions are state-scoped and atomically configured.
  Feedback, movement, and completion phases reject rapid duplicate input.
- Evidence remains session-local under D-019. Reload starts a new session;
  restart starts a new session and resets the world.
- D-011 excludes Playwright and other automated browser E2E tooling. The user
  performs the browser matrix and only reported results may be recorded.
- D-015 excludes Docker and deployment because no local release candidate has
  been accepted and no Dockerfiles exist.
- The reference environment remains the accepted desktop Chromium pointer and
  keyboard target from D-018. No new mobile, touch, Safari, or Firefox claim is
  made.

## Implementation approach

### Shared semantics and the complete authored fixture

Move TYPE normalization from the private validator helper into a small pure
module under packages/contracts/src and export it through the browser-safe
contracts boundary. The semantic validator continues using the same function,
so normalized duplicate detection and runtime answer evaluation cannot drift.
Add focused tests for rule ordering, full-width input, whitespace, Japanese
punctuation, kana equivalence, unsupported fuzzy matches, non-mutation, and
Unicode code-point length boundaries. Generated schemas should remain byte-for-
byte unchanged.

Extend basic-catalog.json with a visitor spawn/entity and two park location
records. Add a new valid-complete-primitive-loop.json fixture while preserving
both earlier valid fixtures. The eight steps form one acyclic required path:
the guide's request is heard, arranged with two distinct tokens displaying
`を`, recognized in the world, typed as a reading, followed to the dog area,
acquired as the task object, given to the guide rather than the visitor, and
confirmed with a seeded choice. Wrong and maximum-attempt transitions continue
forward so the lesson remains completable without claiming mastery.

Export the new fixture through an explicit package subpath and make it the web
technical lesson. Validate the full package before renderer activation. Extend
apps/web/src/lesson/capabilities.ts to resolve every location, entity, object,
cue, scaffold, primitive, and stateful prerequisite against the code-owned park
registry. Keep unsupported branches explicit and sorted. In particular,
RECOGNITION_FALLBACK and nondeterministic assisted carry paths fail before the
world starts.

### Pure controller and deterministic interaction state

Extend LessonPhase with AWAITING_ARRANGE, AWAITING_TYPE, AWAITING_LOCATION,
MOVING_TO_LOCATION, AWAITING_PICK_UP, and AWAITING_RECIPIENT. Add state for the
arranged token IDs, current typed draft, visible location IDs, highlighted
entity IDs, pattern and meaning hints, pending location selection and its
selection timestamp, and carriedObjectId. Preserve current phases and event
semantics for the Milestone 4 primitives.

Use closed inputs for token insertion/removal/reset/submission, TYPE draft and
submission, location selection/arrival/failure, object acquisition, and
recipient selection. The reducer validates every submitted ID against the
active candidate set before producing effects. Refactor the existing answer
evaluation only enough to share bounded attempt, scaffold, feedback, terminal
event, and transition behavior; do not introduce a generic state-machine
dependency.

ARRANGE shuffling derives from manifest.randomSeed plus step identity and does
not mutate the manifest. Sequence correctness compares token IDs in order.
TYPE submission normalizes the draft and every accepted answer with the shared
function and then performs exact comparison. An empty or over-limit normalized
submission cannot advance. preserveSubmittedState determines whether an
incorrect draft remains visible after feedback.

For MOVE_TO, the controller stores a candidate selection and requests movement.
Only the matching arrival callback can resolve it. The reaction event uses the
selection timestamp, while feedback begins after arrival. A movement adapter
failure returns to AWAITING_LOCATION with a visible technical recovery message,
no attempt increment, and no reaction event.

For PICK_UP, a correct candidate produces a SET_CARRIED_OBJECT effect before
the authored transition. A wrong candidate does not change carry. At a bounded
CONTINUE_ASSISTED outcome, the reducer may set the single reduced accepted
candidate and record assisted completion. GIVE combines the current carried
object with the clicked recipient. It applies TRANSFER_CARRIED_OBJECT only for
an accepted pair; a wrong pair writes one reaction and retains the carry slot.
Missing or contradictory carry at GIVE is a stable runtime error, not an
invented learner answer.

### DOM interaction and focus ownership

Extend apps/web/src/ui/shell.ts with a token bank, ordered answer region,
ARRANGE submit/reset controls, and a real TYPE form with label, Japanese input
mode, status text, and submit control. Create all authored text with textContent.
Use token IDs in data attributes so duplicate displayed text remains distinct.
Token buttons and answer buttons must support the full interaction without
dragging. Keep focus on a predictable next token or the submit button after
each action.

During TYPE input, compositionstart and compositionend isolate IME composition
from draft truncation or submission. Enforce the contract's maximumLength by
Unicode code points after composition, not only through HTML's UTF-16 maxlength
behavior. Enter submits only outside composition. Wrong input follows the
manifest preservation rule, help and scaffold text remain explicit, and raw
pre-normalized text is never written to the event sink. The temporary UI draft
is cleared after evaluation unless preserveSubmittedState keeps it for retry.

Keep ARRANGE and TYPE in INTERACTION mode with world picking suspended. Keep
CLICK_OBJECT, MOVE_TO, PICK_UP, and GIVE world-dominant in EXPLORE mode. Render
a compact instruction card whose action cue changes by primitive and explicitly
names the selectable target class. Do not reintroduce a full-screen-looking dim
layer over interactive world states.

### Authored world targets, movement, and carry presentation

Evolve the code-owned park definition from one guide plus a fixed object tuple
to explicit entity, object, and location registries. Each location maps a
catalog location ID to a reachable point and visible selection marker. Make
guide and visitor selectable only while GIVE expects recipient IDs; ordinary
character clicks remain inert outside that phase.

Replace the object-only input configuration with a discriminated world target
configuration for OBJECT, LOCATION, or RECIPIENT. Each configuration contains
one enabled candidate set and one matching callback, preserving the atomic gate
that fixed the Milestone 4 dropped-input defect. Raycasting prioritizes the
active registered target type. Noncandidates, overlay clicks, feedback clicks,
and rapid duplicates cannot reach the controller.

Add a lesson-directed movement request that resolves an authored location,
stops within arrivalRadius, and calls exactly one arrival or failure callback.
Generic movement continues to use the existing convex bounds. Reconfiguration,
restart, visibility pause, or disposal cancels pending callbacks safely. The
one-shot movementFailure query exercises the recoverable failure branch.

Keep a map of initial object transforms. When the controller sets the dog as
carried, present it at a fixed authored follow/escort anchor near Bunbun; do not
simulate collisions or physics. Correct GIVE places it at a reviewed point by
the recipient and clears the carry marker. Wrong GIVE leaves it following.
Restart restores all initial transforms. The one-shot carryFailure query clears
the mirrored carry just before GIVE so the runtime's fail-closed error and
retry-from-clean-world path can be manually verified.

### Orchestration, diagnostics, and failure boundaries

Extend apps/web/src/lesson/runtime.ts to translate controller effects into DOM
and world adapter calls. Stateful effects must either succeed synchronously
against prevalidated IDs or raise a BunbunRuntimeError that tears down the
lesson and world together. The controller remains the source of truth; world
callbacks contain IDs only and cannot decide correctness.

Add diagnostics for current target mode, pending location, and carried object.
Retain the event and performance counters, but ensure MOVE_TO reaction latency
uses decision time rather than travel time. Keep hidden-tab active timing and
feedback timer pause behavior. Restart creates a new event sink, resets the
clock, cancels owned audio/movement, and resets the world before starting the
entry step.

## Milestones

### 1. Lock shared semantics and authored content

Export the shared TYPE normalizer, extend the technical catalog and park
registry, author the valid eight-step fixture, add its package export, and add
contract tests. Extend the capability gate for reviewed IDs and deterministic
stateful prerequisites. The observable checkpoint is that the new package
passes full validation and capability checks while unsupported mutations fail
before scene activation.

### 2. Extend the pure controller for DOM primitives

Implement ARRANGE and TYPE phases, stable seeded token ordering, duplicate
surface-token behavior, exact shared normalization, Unicode length checks,
preserveSubmittedState, scaffold hints, events, and focused reducer tests. The
observable checkpoint is a headless correct, wrong, helped, maximum-attempt,
and rapid-input simulation for both primitives.

### 3. Add ARRANGE and TYPE interaction UI

Build the token and typing DOM controls, IME-safe orchestration, keyboard and
pointer focus behavior, responsive styling, and dynamic feedback/help display.
The observable checkpoint is a local INTERACTION flow that completes both
primitives without canvas input leakage.

### 4. Implement authored MOVE_TO execution

Add location registry entries, markers, location-mode input gating, pending
movement state, arrival-radius completion, failure recovery, cancellation, and
diagnostics. The observable checkpoint is that correct and wrong location
choices resolve only after arrival while a simulated movement failure consumes
no learner attempt.

### 5. Implement task-scoped PICK_UP and GIVE

Add object acquisition, the single carry/escort slot, recipient-mode input,
correct transfer, wrong-recipient retention, deterministic assisted PICK_UP,
invalid-carry rejection, world reset, highlights, diagnostics, and tests. The
observable checkpoint is that the dog can be acquired and given to the guide,
remains carried after choosing the visitor, and restores on restart.

### 6. Integrate, regress, and hand off

Run the complete eight-step fixture, finish capability and event coverage,
exercise all supported scaffolds and failure controls, run every repository
check, inspect bundle changes, update durable documentation, and provide the
manual matrix. The plan stays open until the user reports the actual browser
results.

## Progress

- [x] 2026-08-12 01:07 — Re-read the vision, architecture, gameplay, manifest,
  decisions, current state, roadmap, performance specification, and ExecPlan
  standard.
- [x] 2026-08-12 01:07 — Inspect the clean accepted Milestone 4 contracts,
  fixtures, controller, capability gate, DOM shell, world input, movement,
  diagnostics, tests, package scripts, and recent commits.
- [x] 2026-08-12 01:07 — Confirm that contract 0.1.0 already models all five
  remaining primitives and identify the exact runtime, fixture, location,
  recipient, normalization, carry, and recovery gaps.
- [x] 2026-08-12 01:07 — Draft proposed D-020 and this self-contained ExecPlan.
- [x] 2026-08-12 10:20 — User approved D-020 and this ExecPlan with `PASS`;
  changed the decision to Accepted and the plan to Approved.
- [x] 2026-08-12 10:20 — Implemented milestone 1: shared TYPE normalization,
  expanded catalog, eight-step fixture, package export, and closed capability
  gate.
- [x] 2026-08-12 10:20 — Implemented milestone 2: pure ARRANGE and TYPE state,
  exact normalization, Unicode limits, preservation, scaffolds, and events.
- [x] 2026-08-12 10:20 — Implemented milestone 3: accessible token controls,
  TYPE form, IME composition isolation, responsive styling, and focus routing.
- [x] 2026-08-12 10:20 — Implemented milestone 4: authored location targets,
  MOVE_TO request/arrival/failure behavior, cancellation, and diagnostics.
- [x] 2026-08-12 10:20 — Implemented milestone 5: one carry/escort slot,
  deterministic assisted PICK_UP, recipient input, GIVE transfer/recovery, and
  clean restart.
- [x] 2026-08-12 10:20 — Implemented milestone 6 code and verification: schema
  check, typecheck, lint, formatting, 46 focused tests, production build,
  manifest inspection, HTTP smoke checks, durable docs, and manual handoff.
- [x] 2026-08-12 11:22 — User supplied an explicit `PASS` for the complete
  manual browser/gameplay matrix. Recorded the qualitative result without
  inventing diagnostics values and closed Milestone 5.

## Surprises and discoveries

- The LessonManifest and CatalogSnapshot schemas need no version change for
  Milestone 5. All five variants, location references, object affordances, and
  recipient pairs already exist and have semantic validation.
- TYPE normalization already has a deterministic implementation, but it is
  private to semantic validation. Reusing it requires a small contracts export,
  not a second algorithm in apps/web.
- The existing dog and cat catalog records already advertise PICK_UP and GIVE,
  but the world renders them only as selectable objects and has no carry state.
- GIVE accepts one or more recipient candidates, while the current scene has
  only one entity. A second technical NPC is necessary to test the roadmap's
  wrong-recipient recovery requirement.
- Catalog location entries intentionally contain identity and compatibility,
  not world coordinates. MOVE_TO therefore needs code-owned authored location
  points in the scene registry, matching the existing architecture boundary.
- CONTINUE_ASSISTED can already be proven for PICK_UP through a final
  single-object REDUCE_OBJECT_CANDIDATES scaffold. Stateful completion must also
  apply that uniquely determined object; the Milestone 4 controller had no
  persistent world action for this case.
- RECOGNITION_FALLBACK has a valid contract and graph edge but no accepted
  runtime rejoin semantics. It is unnecessary for the proposed fixture and
  remains explicitly capability-rejected rather than being guessed in M5.
- The login shell still resolved child npm scripts through system Node.js 18,
  so the first root `npm test` did not recognize Node 24's test flag. The same
  workspace suites were run directly with the pinned Node.js 24.18.0 binary and
  passed 46 of 46. Production compilation and Vite build were also run directly
  with the pinned binary.
- Sandbox networking blocked local port binding. The HTTP smoke check was
  rerun with approved local process access, then both temporary processes were
  stopped cleanly.
- Milestone 5 adds only 25,358 minified JavaScript bytes and 1,521 CSS bytes
  over the recorded Milestone 4 build. The existing single-chunk Vite warning
  remains; no new performance regression claim is made before manual browser
  measurements.

## Plan decisions

- 2026-08-12 — Adopt one eight-step HELP_SOMEONE technical fixture rather
  than five disconnected primitive demos. This exercises composition and
  regresses every Milestone 4 primitive in one manual run.
- 2026-08-12 — Retain LessonManifest 0.1.0 and share the existing
  normalization semantics instead of modifying or duplicating the contract.
- 2026-08-12 — Adopt one task-scoped carry/escort slot with no inventory UI,
  physics, or general world-state language. See accepted D-020.
- 2026-08-12 — Evaluate MOVE_TO only after confirmed arrival while
  measuring reaction latency from the location selection. Runtime movement
  failure is not a learner attempt.
- 2026-08-12 — Keep RECOGNITION_FALLBACK outside this milestone and
  rejecting it through capability validation until its execution semantics are
  reviewed separately.

## Validation

### Static and automated checks

Run from /home/nunu/Desktop/nnlab/nn-bunbun after `nvm use`, using the pinned
Node.js 24.18.0 and npm 11.16.0:

- `npm run schema:check` — generated schemas and invalid fixture artifacts have
  no drift; M5 is expected not to change the schema artifacts.
- `npm run typecheck` — contracts, server, web source, and test tooling compile.
- `npm run lint` — source and test lint rules pass.
- `npm run format:check` — supported code and root files are formatted.
- `npm test` — contract and web focused tests pass, including all eight
  primitive paths, normalization boundaries, movement, carry, input isolation,
  event idempotency, and earlier runtime regressions.
- `npm run inspect:manifest -- packages/contracts/fixtures/manifests/valid-complete-primitive-loop.json packages/contracts/fixtures/catalogs/basic-catalog.json`
  — the new fixture passes structural and semantic validation.
- `npm run inspect:manifest -- packages/contracts/fixtures/manifests/valid-find-dog-loop.json packages/contracts/fixtures/catalogs/basic-catalog.json`
  — the accepted Milestone 4 fixture remains valid.
- `npm run build` — contracts, server, and web production builds pass; record
  changed JS, CSS, fixture, and asset sizes plus existing Vite warnings.
- Start the existing local server and web commands only long enough for an HTTP
  smoke check of `/`, the referenced module/assets, `/health`, and JSON 404.
  Preserve any user-owned running processes and report occupied ports honestly.
- Docker build is not applicable because Dockerfiles intentionally do not exist
  before local release-candidate acceptance.
- Do not create or run Playwright or another automated browser E2E suite under
  D-011.

### Manual happy path

1. Run `nvm use` and `npm run dev`, open
   `http://127.0.0.1:5173/?debug=1`, and confirm the park and first Japanese
   stimulus appear with the scene dominant.
2. Start and replay LISTEN, then continue. Confirm one heard record is written
   only after playback starts and replay does not duplicate it.
3. In ARRANGE, use pointer and keyboard to build the authored sentence. Confirm
   both displayed `を` tokens remain independently movable and the correct token
   ID order advances once.
4. In CLICK_OBJECT, click the dog rather than the cat and confirm compact
   EXPLORE feedback and no modal-looking world lock.
5. In TYPE, submit a configured equivalent such as full-width or katakana input
   allowed by the authored normalization rules. Confirm exact acceptance and
   no visible IME disruption.
6. In MOVE_TO, select the dog area and confirm Bunbun moves, the step stays
   pending during travel, and success appears only after arrival.
7. In PICK_UP, select the dog and confirm the visible follow/escort state plus
   carriedObjectId diagnostics.
8. In GIVE, select the guide and confirm the dog transfers, carry clears, and
   one accepted object-recipient pair is recorded.
9. Complete the final seeded CHOOSE step and confirm all eight required steps,
   lesson completion, reaction counts, and one lesson-completed event.
10. Restart and confirm a fresh session, initial dog position, no carried
    object, reset locations/highlights, and the same seeded token/choice order.

### Manual edge cases

1. Submit a wrong ARRANGE order containing the duplicate `を` tokens. Confirm
   one wrong attempt, authored scaffold escalation, and the configured
   preserveSubmittedState behavior; rapid double-submit must not add a second
   event.
2. Exercise ARRANGE only with keyboard, remove tokens from the answer, reset the
   sequence, and resize to a narrow supported desktop viewport. Controls remain
   reachable and token identity remains stable.
3. TYPE empty text, a real wrong answer, surrounding whitespace/punctuation, a
   configured kana equivalent, an unconfigured near-match, and input beyond
   maximumLength. Only exact authored normalized answers pass; length counts
   Unicode code points.
4. Begin Japanese IME composition and press Enter. It must not submit until
   composition ends. A wrong TYPE response must preserve or reset the draft
   exactly as authored and a later helped correct response must be assisted.
5. During MOVE_TO, click a noncandidate ground point, then a wrong candidate
   location. The noncandidate is not a lesson reaction; the wrong candidate
   resolves once after arrival and remains retryable.
6. Rapidly click two locations while moving, background and resume during
   travel, and use `?movementFailure=1`. There is at most one arrival result;
   simulated runtime failure returns to selection without consuming an attempt.
7. Choose the cat during PICK_UP. It must not enter carry state. At the bounded
   assisted path, the single exposed accepted dog is acquired and clearly
   marked assisted before GIVE.
8. In GIVE, click the visitor first. Confirm one wrong reaction and that the dog
   remains carried; then click the guide and complete correctly.
9. Use `?carryFailure=1` and reach GIVE. Confirm the missing/contradictory carry
   is rejected as a stable runtime error rather than counted as learner input,
   and Retry starts a clean world and session.
10. Request help at each new primitive, click controls during feedback, and
    repeatedly click world candidates. Help must mark later success assisted;
    locked phases must not duplicate attempts or skip steps.
11. Reload during ARRANGE, movement, carry, and completion. Reload starts a
    fresh session and initial world because persistence is intentionally M6.

### Manual regression

1. LISTEN still handles start, replay, audio failure, assisted continue, and
   heard idempotency. Verify `?audioFailure=1`.
2. CLICK_OBJECT still routes dog/cat IDs atomically, ignores noncandidates, and
   keeps the EXPLORE world visibly interactive.
3. CHOOSE still uses deterministic manifest-seeded order, bounded help, and one
   terminal transition.
4. `?manifestFailure=1` still fails before scene activation and Retry uses the
   untouched valid package.
5. `?assetFailure=1` still shows the recoverable asset error and one Retry boots
   a clean world.
6. `?renderer=webgl2&debug=1` still forces WebGL2. Normal automatic renderer,
   resize, capped DPR, zoom, background/resume, context loss, and disposal
   behavior remain intact.
7. DOM INTERACTION phases do not move or select the world. EXPLORE phases do not
   allow overlay clicks to reach world picking.
8. Run the full fixture with diagnostics open and record FPS, average/p95 frame
   time, draw calls, triangles, DPR, scene-ready time, first stimulus, picking
   response, longest MOVE_TO duration, and obvious stutter. Compare against
   PERFORMANCE.md and the accepted Milestone 4 observations.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Happy path for all eight primitives | User | 2026-08-12 | PASS | Explicit overall PASS; no per-scenario notes supplied |
| ARRANGE and TYPE edge matrix | User | 2026-08-12 | PASS | Explicit overall PASS; no per-scenario notes supplied |
| MOVE_TO and movement recovery | User | 2026-08-12 | PASS | Explicit overall PASS; no per-scenario notes supplied |
| PICK_UP, GIVE, and invalid carry | User | 2026-08-12 | PASS | Explicit overall PASS; no per-scenario notes supplied |
| M4 lesson/input/audio regressions | User | 2026-08-12 | PASS | Explicit overall PASS; no per-scenario notes supplied |
| Renderer, lifecycle, and performance regression | User | 2026-08-12 | PASS | Qualitative acceptance; no numeric diagnostics supplied |

## Recovery and compatibility

There is no database, stored-data migration, or schema-version migration.
LessonManifest and CatalogSnapshot remain 0.1.0, and the previous valid fixtures
remain inspectable. The new fixture and catalog changes are additive technical
content. Runtime capability checks reject an ID, primitive variant, scaffold,
location, or stateful path that lacks a reviewed executor before partial scene
activation.

All controller transitions and world effects are deterministic and safe to
rerun in a fresh session. Runtime restart cancels audio and movement, disposes
owned handlers and GPU resources, clears the in-memory event sink, restores
initial object transforms, clears carry and highlights, and reloads the known-
good package. The failure query controls affect only the first boot attempt so
Retry can prove recovery.

If implementation reveals that contract 0.1.0 cannot express a required
behavior, stop work and discuss a versioned contract decision instead of
silently adding runtime semantics. If world state and controller state diverge,
fail closed through the existing recoverable runtime boundary; do not invent a
learner attempt, guess a recipient, or continue with stale carry.

Source rollback is ordinary Git reversion of this milestone's changes; no
durable user data exists. Do not reset or overwrite unrelated user changes.

## Documentation updates

- Change D-020 from Proposed to Accepted only after explicit user approval;
  update it if the approved semantics differ.
- Update GAMEPLAY.md only where implementation evidence clarifies ARRANGE,
  TYPE, MOVE_TO, PICK_UP, GIVE, or task-scoped carry semantics.
- Update LESSON_MANIFEST.md only if shared normalization documentation needs a
  non-schema clarification; do not change contract fields silently.
- Update PERFORMANCE.md with measured build artifacts and only the browser
  values the user reports.
- Update README.md for the complete fixture and new failure query controls.
- Keep this plan's Progress, Surprises, Plan decisions, Validation results, and
  Outcomes current during implementation.
- Update CURRENT_STATE.md, ROADMAP.md, and plans/README.md at each approval and
  completion boundary.

## Outcomes

Implementation outcome: accepted D-020 now exists as one complete authored
eight-primitive flow with shared exact TYPE normalization, stable duplicate
ARRANGE tokens, authored MOVE_TO arrival, one task-scoped dog escort slot,
recoverable PICK_UP/GIVE, state-scoped world targets, IME-safe DOM controls,
failure queries, diagnostics, and clean restart. Schema check, typecheck, lint,
formatting, 18 contract tests, 28 web tests, manifest inspection, production
build, and local HTTP boundaries pass. The build is 1,254,603 bytes JavaScript
(346.59 kB gzip reported by Vite), 10,696 bytes CSS (2.90 kB gzip), 5,899 bytes
glTF, and 520 bytes HTML; the known large-chunk warning remains.

The user supplied an explicit `PASS` on 2026-08-12 for the complete manual
browser/gameplay matrix under D-011. No per-scenario notes or numeric runtime
diagnostics were supplied, so the closure records qualitative acceptance only.
Milestone 5 and this plan are Complete. Milestone 6 persistence remains
unstarted and requires its deferred decisions and a separately approved plan.
