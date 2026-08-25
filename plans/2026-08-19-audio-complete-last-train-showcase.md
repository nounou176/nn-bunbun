# Deliver an audio-complete last-train vertical slice

Status: Approved; active at the zero-incremental-cost Milestone 8 planning gate
Owner: Codex and user
Created: 2026-08-19
Last updated: 2026-08-24 18:07 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Deliver Bunbun's first production-quality micro-scenario: an N5,
Vietnamese-supported rainy-evening lesson titled `Three Minutes to the Last
Train` (`Ba phút trước chuyến tàu cuối`, `終電まであと3分`). The learner helps
Aoi recover a missing wallet by interpreting Japanese, interacting with Tanaka
the clerk, following Momo the cat's clue, and resolving a mistaken umbrella
before Aoi leaves for the last train.

The accepted build is audio-complete. Every learner-relevant Japanese NPC or
narration line has reviewed cached speech. Rain, street, convenience-store,
and distant-station ambience establish the setting. Meaningful footsteps,
object actions, cat reactions, clue discovery, feedback, and transitions have
deterministic effects. Restrained music or stings support tension and
resolution without masking speech. Captions, replay, mix controls, and text
fallback keep the lesson playable when audio is muted or fails.

The three-minute premise is narrative pressure. It is not a realtime failure
timer, game-over state, or punishment. Ordinary gameplay remains deterministic
and local, uses the eight accepted primitives, and makes no TTS or LLM call.

## Repository context

Milestones 1 through 6 are complete and manually accepted. The browser has a
deterministic Three.js `park_small` technical runtime, all eight fixed
primitive executors, strict LessonManifest and CatalogSnapshot validation,
local evidence persistence, safe resume, and a temporary browser
SpeechSynthesis `AudioPlaybackPort`. There are no production world or audio
assets.

Milestone 7 is next. D-027 preserves the old Responses API proposal as inactive
M7 v1 and keeps self-built local LLM work as M7 v2 research. D-031 selects the
Skills-only personal ChatGPT/Codex plugin as M7 v3.2. Its separate proposed
ExecPlan is `plans/2026-08-19-m7-v3-skills-plugin.md`. No M7 implementation is
approved. This plan does not choose or bypass an M7 strategy.

D-025 approves the GLB-first world-authoring pipeline and initial Kenney CC0
asset candidates. D-026 resolves O-001 and O-002 for this vertical slice and
defines its audio-complete boundary. Milestone 8 owns production speech and
the complete audio runtime. Milestone 9 owns the integrated product scenario.
O-010 still requires an exact zero-incremental-cost local/offline TTS plan,
voice policy, cache storage, and invalidation decisions before any model,
dependency, or asset is downloaded or added.

LessonManifest 0.1.0 already models exact spoken Japanese through
`AudioAsset`, approved `voiceProfileId`, deterministic `cacheKey`, utterance
text matching, and replay. It also references registered presentation cues.
The contract has no arbitrary media URL and does not need a version change for
this outcome: scene metadata will own ambience, and registered cues will own
non-speech effects and musical stings.

The sibling `/home/nunu/Desktop/nnlab/bunbun/n5/extracted_lessons` corpus is
research input only. It contains Bunpro-derived titles, meanings, and links
without a local redistribution license. The shipped Bunbun reference fixture,
Vietnamese support copy, dialogue, and examples must be independently reviewed
and repository-owned.

## Scope

### In scope

- Preserve LessonManifest, CatalogSnapshot, and EvidencePersistence at 0.1.0
  unless implementation evidence proves a versioned contract change is
  necessary and the user approves it separately.
- Complete Milestone 7 first so real learner targets can compile into the
  existing deterministic runtime.
- Select and approve a zero-incremental-cost local/offline TTS approach, two
  non-cloned Japanese NPC voice profiles, narration policy, cache storage,
  cache invalidation inputs, pronunciation review, and failure behavior. Do
  not download or add a third-party candidate before its focused plan is
  approved under D-038.
- Replace browser SpeechSynthesis as the production path with pre-generated,
  cacheable Japanese speech resolved through the application asset boundary.
- Build a learner-unlocked audio mixer with master, voice, ambience, effects,
  and music controls, voice-priority ducking, replay, pause/resume, and safe
  disposal.
- Keep named NPC voice profiles consistent across every utterance in one
  lesson revision and validate exact Japanese text-to-audio identity.
- Prepare the exact minimum rain, street, convenience-store, distant-station,
  movement, object, animal, feedback, transition, and music source list with
  cost and license review; obtain explicit approval before downloading,
  selecting, processing, hashing, or registering any third-party asset.
- Resolve scene ambience through code-owned scene audio metadata and non-speech
  event audio through registered deterministic cue handlers.
- Intake, inspect, convert, and register one bounded rainy-evening neighborhood
  GLB variant with a short road, convenience-store frontage, park edge,
  umbrella stand, two NPCs, and one cat.
- Use Aoi, Tanaka, and Momo with code-owned stable entity IDs, spawn points,
  state IDs, animations, cues, and voice assignments.
- Author and review the initial requested targets `財布（さいふ）`,
  `探す（さがす）`, and `～てください` plus only the supporting N5 targets
  needed by the accepted interaction path.
- Author a bounded `SOLVE_SMALL_PROBLEM` primitive sequence that exposes the
  requested targets across changed contexts and remains recoverable after
  wrong or assisted responses.
- Preserve captions, Japanese text replay, support-on-help, and a complete text
  path for disabled, unavailable, interrupted, or missing audio.
- Persist and resume without replaying acknowledged evidence or duplicating
  `heard` after replay, reload, or background recovery.
- Measure world and audio asset sizes, scene/first-stimulus/first-voice
  readiness, playback-start latency, simultaneous sources, frame behavior,
  draw calls, and interaction density on the named manual test environment.
- Add focused unit and integration tests for registries, cache identity,
  voice consistency, mixing state, cue mapping, audio failures, lesson package
  validation, persistence, and recovery.
- Provide a complete manual browser/gameplay/audio acceptance matrix under
  D-011.

### Out of scope

- A seamless city, loaded station scene, large crowd, traffic simulation,
  runtime procedural city growth, or unbounded NPC autonomy.
- A hard countdown, game over, combat, HP, stamina, punitive failure, or
  mandatory replay.
- Microphone capture, SPEAK, pronunciation scoring, realtime voice
  conversation, voice cloning, or imitation of a real person.
- Runtime TTS, runtime LLM dialogue, LLM answer judging, model calls in the
  render loop, or AI-authored asset URLs and playback instructions.
- A general audio middleware dependency before the native Web Audio and
  Three.js requirements are measured.
- Importing or publishing the full sibling N5 extraction, Bunpro meanings,
  Bunpro links, or unreviewed external language content.
- Additional neighborhoods, genres, scenario families, adaptive scheduling,
  accounts, cloud sync, analytics transport, Docker, hosting, or deployment.
- Automated browser E2E tooling unless D-011 is explicitly superseded.

## Decisions and constraints

- D-001 requires story, movement, and audio to protect meaningful Japanese
  reactions every 5–12 seconds where appropriate.
- D-002 keeps AI at compilation time and ordinary gameplay deterministic.
- D-003 through D-005 preserve bounded micro-scenes, eight fixed primitives,
  point-and-click control, and DOM learning UI.
- D-008 requires generated speech and other generated media to use stable,
  versioned caches outside ordinary gameplay.
- D-011 assigns browser and gameplay validation to the user and excludes
  automated browser E2E.
- D-013 and D-017 keep LessonManifest 0.1.0 strict; registered scene and cue
  metadata carry non-speech audio without arbitrary manifest fields.
- D-015 defers Docker and release infrastructure until local release-candidate
  acceptance.
- D-021 keeps evidence local and restores transient audio at safe boundaries.
- D-025 governs GLB asset intake, licensing, hashes, conversion, stable IDs,
  navigation, and performance.
- D-026 governs the exact vertical-slice premise, target set, characters,
  narrative-only urgency, audio completeness, and exclusions.
- D-038 forbids unreviewed third-party selection and any paid-capable provider
  shortcut. Free tiers and credits are not a zero-cost solution; OpenAI API and
  Amazon Polly are excluded. M8 must first use a zero-incremental-cost
  local/offline plan explicitly approved by the user.
- O-010 remains unresolved. No TTS model, dependency, voice, cache path, asset,
  account, credential, or environment-variable name may be assumed before
  explicit approval.
- Every third-party or generated world/audio asset needs a canonical source,
  exact rights record, source hash, processing record, runtime hash, and
  measured budget before it ships.

## Implementation approach

Complete the compiler milestone before beginning this plan's production work.
Then approve a focused zero-incremental-cost Milestone 8 audio plan before any
third-party download or addition. After approval, implement speech/cache and
non-speech playback behind application-owned ports. The browser receives only
validated IDs and local/cache-resolved assets. It unlocks audio after one
explicit learner gesture, preloads the first required voice and ambience,
prioritizes voice over other buses, and retains captions and recovery.

Build the rainy-evening scene through the D-025 GLB pipeline. GLB owns visual
geometry, materials, rigs, and clips. Bunbun code owns stable identities,
placements, navigation, entity state, cue behavior, scene ambience metadata,
and sound positioning. Distant station sound supplies context without loading
another scene.

Author the lesson as a reviewed deterministic package first, then prove that
the completed compiler can create the same supported profile from its target
request. Code owns the primitive graph, answer truth, time/attempt budgets,
IDs, and audio references. AI may author bounded story and wording fields but
cannot invent mechanics, sources, voices, paths, or assets.

## Milestones

### 0. Lock the product and plan boundary

Record D-026, update the affected specifications and roadmap, create this
approved queued plan, and preserve Milestone 7 ordering.

Observable checkpoint: repository documentation identifies one exact first
showcase, target set, character set, world variant, audio-complete definition,
and remaining provider/asset gates without claiming implementation.

### 1. Complete the selected lesson compiler prerequisite

Approve and deliver one Milestone 7 strategy independently. Ensure compiled
utterances retain exact validated audio metadata while the technical runtime
continues using its declared temporary adapter. M7 v1, v2, and v3 remain
alternative transports and do not alter this plan's manifest/audio boundary.

Observable checkpoint: reviewed vocabulary and grammar targets compile into a
validated playable technical lesson without production audio or world claims.

### 2. Approve and implement the complete audio boundary

Prepare a focused comparison of local/offline TTS candidates with zero
incremental usage and recurring cost. Document every candidate's license,
download size, hardware fit, Japanese short-utterance quality, dependency and
data flow, fallback, and removal path. Obtain explicit approval before any
download or code addition. Then select voices, define cache/storage and
pronunciation review, approve non-speech sources, and record the Milestone 8
decision before implementing cache generation, asset resolution, mix buses,
ducking, autoplay unlock, scene ambience, cue effects, settings, fallback, and
tests.

Observable checkpoint: a technical lesson plays consistent cached Japanese
voices plus registered ambience/effects, survives failure and resume, and
makes no provider call during gameplay.

### 3. Intake and assemble the rainy-evening neighborhood

Download only approved world and audio sources, retain rights and hashes,
assemble/export the bounded GLB, register stable IDs and scene audio metadata,
and measure representative budgets.

Observable checkpoint: the named reference browser loads the neighborhood,
shows Aoi, Tanaka, Momo, and the umbrella stand, plays reviewed ambience, and
keeps required objects reachable in WebGPU and forced WebGL2.

### 4. Author and validate the complete lesson package

Create the repository-owned N5 reference slice, Vietnamese support, reviewed
dialogue, primitive sequence, clues, answers, scaffolds, feedback, voice
assets, cues, and evidence bindings. Validate every package and capability
before scene activation.

Observable checkpoint: the authored package completes through correct, wrong,
assisted, muted-audio, and failed-audio paths with exact target coverage.

### 5. Compile, integrate, and polish the vertical slice

Connect the completed compiler profile to the production scene and audio
catalog, preserve immutable revision/cache provenance, and tune pacing, camera,
animation, mixing, overlays, and interaction density without new mechanics.

Observable checkpoint: submitting the accepted target set produces or selects
the validated last-train lesson, which remains playable offline from provider
access after compilation.

### 6. Verify and hand off manual acceptance

Run all supported static, unit, integration, schema, fixture, build, asset,
privacy, and local HTTP checks. Update durable documentation and provide the
full manual browser/gameplay/audio matrix.

Observable checkpoint: automated non-browser checks pass, all production
assets have provenance, measured results are recorded, and the user receives a
reproducible acceptance checklist.

## Progress

- [x] 2026-08-19 16:35 — User explicitly approved `PLAN AUDIO + SHOWCASE`.
- [x] 2026-08-19 16:35 — Record D-026 and update affected product,
      architecture, gameplay, manifest, world, performance, state, roadmap, and
      plan records.
- [x] 2026-08-24 18:04 — Close the selected Milestone 7 compiler strategy
      under D-036 with its verification waiver retained.
- [x] 2026-08-24 18:04 — Evaluate Amazon Polly as an M8 candidate and record
      the user's explicit rejection under D-037 without adding AWS code,
      configuration, credentials, or cost.
- [x] 2026-08-24 18:07 — Record D-038: no unreviewed third-party selection and
      no paid-capable provider substitution; free tiers and credits do not solve
      the budget constraint, and M8 must begin with a zero-incremental-cost
      local/offline plan.
- [ ] Approve O-010 local TTS approach/model/voice/cache and non-speech source
      decisions through the focused zero-incremental-cost plan required by D-038.
- [ ] Implement milestones 2 through 6 in dependency order.
- [ ] Hand off the manual matrix and record only results the user reports.

## Surprises and discoveries

- The current `AudioPlaybackPort` is correctly isolated but supports only
  browser SpeechSynthesis and one allowlisted technical audio ID. It provides a
  useful replacement seam but no production voice-quality or offline claim.
- LessonManifest 0.1.0 already separates exact speech identity from arbitrary
  media resolution. Scene ambience and cue effects can remain application-owned
  without changing the playable schema.
- The accepted D-025 world does not contain a station. Distant authored station
  audio and visual cues preserve the last-train premise while keeping one
  bounded scene and avoiding unnecessary traversal.
- The sibling N5 data is large enough for research but lacks the fields and
  redistribution evidence required for a shipping reference provider.
- Amazon Polly's technical fit does not override the product boundary: the user
  explicitly rejected Amazon/AWS for Bunbun before any implementation or
  provider request. Provider research must continue without AWS.
- Low unit pricing, a free tier, or promotional credits do not resolve
  Bunbun's current financial constraint. The project must solve the initial M8
  path without a new usage-billed service and without treating research as
  selection authority.

## Plan decisions

- 2026-08-19 — Use `SOLVE_SMALL_PROBLEM` with requested `財布`, `探す`, and
  `～てください`; keep additional grammar and vocabulary explicit SUPPORTING
  targets.
- 2026-08-19 — Treat three minutes as narrative urgency only.
- 2026-08-19 — Keep speech in LessonManifest `AudioAsset`, ambience in scene
  metadata, and effects/music in registered cues; do not change contract 0.1.0
  without implementation evidence.
- 2026-08-19 — Require master, voice, ambience, effects, and music controls,
  voice-priority ducking, captions, replay, and recoverable text fallback.
- 2026-08-19 — Queue this approved plan after M7 and retain O-010 as a separate
  approval gate.
- 2026-08-24 — D-037 excludes Amazon Polly, AWS dependencies, AWS local
  configuration, credentials, and billing. Keep the provider-independent audio
  design and reopen O-010 without AWS; D-038 further restricts the first route
  to zero-incremental-cost local/offline execution.
- 2026-08-24 — D-038 requires explicit plan approval before any new
  third-party service, dependency, model, or asset is selected or added. The
  first M8 TTS route must be local/offline with zero incremental usage and
  recurring cost; OpenAI API, Amazon Polly, free-tier dependency, and extra
  credits are excluded.

## Validation

### Static and automated checks

Run from `/home/nunu/Desktop/nnlab/nn-bunbun` with the repository-pinned Node
and npm versions once implementation begins:

1. `npm run schema:check`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run format:check`
5. `npm test`
6. `npm run inspect:manifest -- <showcase-manifest> <showcase-catalog>`
7. `npm run build`
8. Run asset provenance, GLB inspection, audio-registry, cache, privacy, and
   local HTTP smoke checks added by the approved implementation plans.

No automated browser E2E test is added or run under D-011. Docker is not
applicable before the D-015 local release-candidate acceptance gate.

### Manual happy path

1. Start from clean local data, choose the accepted target set, and compile or
   select the last-train lesson.
2. Use the explicit start action and confirm rain/scene ambience begins without
   masking Aoi's first Japanese line.
3. Complete every clue, movement, object, NPC, and language step through the
   intended path.
4. Confirm Aoi and Tanaka retain distinct consistent voices, Momo and object
   actions have relevant effects, voice ducks other layers, and resolution
   audio plays once.
5. Confirm evidence, completion, reload, and provider-independent replay work.

### Manual edge cases

1. Mute each bus and master independently; captions and completion remain
   available.
2. Deny autoplay, fail first speech, remove an optional effect, and interrupt
   audio; the lesson exposes a recoverable text/replay path.
3. Replay speech repeatedly; heard evidence is not duplicated.
4. Background and resume during voice, ambience, movement, and feedback; no
   overlapping stale source or lost safe boundary appears.
5. Choose wrong objects, NPCs, destinations, responses, and the restricted
   area; bounded character reactions and scaffolds recover without game over.
6. Reload at every safe boundary and confirm voice, carry, clue, and completion
   projection restore deterministically.

### Manual regression

1. Repeat the authored eight-primitive technical demo and persistence matrix.
2. Force WebGL2, resize, use capped DPR, and repeat scene entry/exit.
3. Confirm overlays isolate world input and audio controls do not trigger world
   picking.
4. Confirm compilation and audio generation never run in ordinary gameplay or
   produce frame-loop stalls.
5. Record cold/warm scene, first-stimulus, first-voice, playback-start, FPS,
   frame-time, draw-call, audio-size, and interaction-density observations.

### Manual results

| Scenario                                            | Tester  | Date    | Result  | Evidence or notes                    |
| --------------------------------------------------- | ------- | ------- | ------- | ------------------------------------ |
| Complete voiced showcase                            | Pending | Pending | Not run | Awaiting prerequisite implementation |
| Audio controls and fallback                         | Pending | Pending | Not run | Awaiting prerequisite implementation |
| Background, resume, and replay                      | Pending | Pending | Not run | Awaiting prerequisite implementation |
| WebGPU/WebGL2 and performance                       | Pending | Pending | Not run | Awaiting prerequisite implementation |
| Compiler, persistence, and authored-demo regression | Pending | Pending | Not run | Awaiting prerequisite implementation |

## Recovery and compatibility

Production audio and scene assets are immutable by content hash. Changing
Japanese text, voice profile, model/settings, source file, processing, cue
mapping, scene version, or compiler inputs creates a new cache or lesson
revision rather than mutating an active session. Missing optional ambience,
effect, or music degrades visibly but does not corrupt lesson truth. Missing
required speech activates the reviewed text fallback and never claims heard.

Existing technical fixtures remain selectable until the product slice is
manually accepted. Applied SQLite migrations are never edited or removed.
Reset behavior remains explicit and confirmed. A partially generated speech
set or invalid world package is never published as playable.

## Documentation updates

- Keep D-026 and any later provider/asset decisions current in
  `docs/DECISIONS.md`.
- Update `docs/BUNBUN_ARCHITECTURE.md`, `docs/GAMEPLAY.md`,
  `docs/LESSON_MANIFEST.md`, `docs/WORLD_AUTHORING.md`, and
  `docs/PERFORMANCE.md` when implementation evidence changes a boundary.
- Update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `plans/README.md`, and this
  plan after every milestone checkpoint.
- Record exact world/audio source, rights, hashes, processing, runtime IDs, and
  measurements in repository-owned intake records before shipping.

## Outcomes

The product, content, world, and audio-complete outcome is approved and
documented. Milestone 7 is implementation-complete with verification waived
under D-036. No production world or production audio code or asset has been
implemented. D-037 excludes Amazon Polly, and D-038 excludes OpenAI API,
paid-capable provider substitution, unreviewed third-party additions, and
free-tier dependency. O-010 remains open at a zero-incremental-cost
local/offline planning gate; production source intake also remains open.
