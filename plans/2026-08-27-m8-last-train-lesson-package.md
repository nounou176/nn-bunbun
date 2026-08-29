# Author the complete last-train lesson package

Status: Complete; gates and manual A/B/C accepted under D-053
Owner: Codex and user
Created: 2026-08-27
Last updated: 2026-08-28 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Deliver parent M8 Milestone 4 as one repository-owned, strictly validated,
audio-complete N5 lesson package for the already accepted
`neighborhood_small` rainy-evening world. The learner completes `Three Minutes
to the Last Train` (`Ba phút trước chuyến tàu cuối`, `終電まであと3分`) by
helping Aoi recover her wallet, respecting Tanaka's rule, following Momo's
clue, and resolving the mistaken umbrella without a theft accusation or hard
countdown.

This milestone ends with a fixed authored package that can be selected from the
local lesson library and completed offline through correct, wrong, assisted,
muted-audio, and failed-audio paths. It does not yet make the M7 compiler or a
Custom GPT produce/select this production profile; that remains parent M8
Milestone 5.

## Current implementation state

- Parent M8 Milestones 2 and 3 are complete and manually accepted. The local
  mixer, reviewed cached-speech boundary, accepted non-speech catalog, and
  accepted rainy-neighborhood world are present.
- The world registry already resolves `park_small` and `neighborhood_small`,
  including Aoi, Tanaka, Momo, `wallet_clue`, `mistaken_umbrella`, and all
  required locations.
- LessonManifest and CatalogSnapshot remain strict at version `0.1.0`; all
  eight gameplay primitives already execute in the technical park.
- Runtime capability validation is still hard-coded to the park catalog and
  presentation cues. The authored demo loader still imports park fixtures.
- The fixed production manifest/catalog, two-scene runtime capability gate,
  deterministic assisted recovery, approved cue mapping, manifest-selected
  neighborhood runtime, and local library entry are implemented.
- Four exact production WAVs were generated through local VOICEVOX Nemo and
  approved under D-049. The runtime checks their immutable approved SHA-256
  identity through the server ETag; Nemo is not running during gameplay.
- The M7 compiler still targets its accepted park/Bunbun Core profile. It must
  remain unchanged in this milestone except for regressions required to keep
  the existing profile valid.
- One reviewed Aoi technical WAV exists for `財布を探してください。`, but it
  is not automatically production dialogue for this package. Production lines
  require exact text review and their own immutable reviewed cache records.

## Approved constraints carried into this plan

- D-026 fixes the N5/Vietnamese scenario, requested targets, characters,
  narrative-only urgency, no-theft resolution, and audio-complete outcome.
- D-038 prohibits adding or selecting any new third-party service, dependency,
  model, or asset without another approved cost/license/data/operations plan.
- D-039 through D-043 already authorize the local VOICEVOX Nemo engine,
  `voice_aoi_01`, `voice_tanaka_01`, exact-text reviewed speech cache, and the
  16 accepted non-speech assets. This plan uses only that existing boundary.
- D-045 and the completed world plan fix the exact world assets and stable
  runtime IDs. No new model or visual asset is needed.
- Ordinary gameplay remains deterministic and local. No TTS, LLM, Custom GPT,
  provider, or external asset host is contacted during gameplay.
- The user performs browser/gameplay acceptance under D-011. No Playwright is
  added or run. Docker remains not applicable under D-015 until a complete
  local release candidate is accepted.

## Cost, license, data, and operations

- Incremental and recurring service cost: USD 0. No paid API, free-tier API,
  account, credential, or new environment variable is introduced.
- Speech generation: the already qualified local VOICEVOX Nemo 0.24.0
  loopback engine only, outside ordinary gameplay. Aoi keeps style `10006` and
  Tanaka keeps style `10000` behind code-owned profile IDs.
- World and non-speech licenses: unchanged from the already approved D-043 and
  D-045 inventories. This plan does not download, replace, or register another
  asset.
- Data flow: only exact repository-owned Japanese utterance text is submitted
  to the loopback engine. No learner input, evidence, Vietnamese support text,
  account data, or network transport leaves the machine.
- Storage: generated WAVs and review state stay in the existing ignored local
  cache. Only stable cache keys, duration, status, and approved hashes enter
  repository records according to D-040.
- Removal/failure: removing or stopping Nemo does not break accepted cached
  playback. A missing/unavailable WAV uses the existing visible assisted text
  path and never triggers runtime synthesis.

## Content boundary

### Learning targets

Keep the requested targets exactly as approved:

- `財布（さいふ）` — requested vocabulary;
- `探す（さがす）` — requested vocabulary; and
- `～てください` — requested grammar.

Track only three supporting targets needed by the accepted story path:

- `傘（かさ）` — resolves the mistaken-umbrella clue;
- `駅（えき）` — makes the last-train consequence comprehensible; and
- `～てはいけない` — expresses Tanaka's staff-only rule.

Rain and the three-minute deadline remain scene/story context rather than
additional assessed targets. The repository owns independent Japanese and
Vietnamese records for these six targets. The sibling N5 extraction is used
only to confirm scope and spelling; its Bunpro meanings, links, IDs, and full
corpus are not copied.

### Draft reviewed utterance set

The exact production content gate starts with these bounded lines:

1. Aoi opening:
   `財布がありません。終電まであと三分です。財布を探してください。`
2. Tanaka rule and mistaken-umbrella correction:
   `この傘はあおいさんの傘ではありません。店の中に入ってはいけません。`
3. Tanaka clue:
   `猫が公園のほうへ行きました。公園を見てください。`
4. Aoi resolution:
   `ありがとうございます。財布が見つかりました。これで駅へ行けます。`

Before speech generation, a tracked content-review packet must show every
Japanese line, reading-sensitive token, Vietnamese support line, speaker,
target binding, accepted answer, distractor, and story beat. The user must
approve this exact packet. Any later wording change creates a new cache key and
requires a new speech review; it cannot silently reuse an older WAV.

### Deterministic primitive graph

Use nine bounded steps so every accepted primitive executes and Aoi receives a
spoken resolution:

1. `LISTEN` — hear Aoi's missing-wallet request and narrative deadline.
2. `ARRANGE` — reconstruct `財布を探してください。`.
3. `CHOOSE` — understand Tanaka's rule and reject the mistaken umbrella as
   Aoi's property.
4. `TYPE` — actively produce `財布を探してください。` as a polite request to
   Tanaka.
5. `MOVE_TO` — follow Tanaka's Momo clue to `park_edge`.
6. `CLICK_OBJECT` — select `momo` and trigger the cat clue reaction.
7. `PICK_UP` — recover `wallet_clue` beside Momo.
8. `GIVE` — return `wallet_clue` to `aoi`.
9. `LISTEN` — hear Aoi's thanks and station resolution.

The graph has no random branch, hard timer, game-over, unbounded retry, theft
claim, or hidden answer mutation. Every assessed step has bounded attempts and
a deterministic `CONTINUE_ASSISTED` path. The carry validator must prove that
the wallet is guaranteed before GIVE.

## Implementation approach

### 1. Create and approve the exact content packet

Add a repository-owned reference-slice document/JSON packet containing the six
targets, story beats, four utterances, Vietnamese support, nine steps, answer
truth, distractors, scaffolds, feedback, evidence goals, cue intentions, and
source/provenance notes. Add a deterministic validator for packet structure and
coverage. Present its exact hash and human-readable review sheet to the user.

Gate 1: no production speech is queued until the user approves the exact
content packet and hash.

### 2. Build the production CatalogSnapshot and LessonManifest

Add a dedicated production catalog and fixed manifest rather than modifying
the generic technical fixtures in place. Register:

- scene `neighborhood_small`, variant `rainy_evening_last_train_v1`, camera,
  accepted bundles, and exact spawn points;
- entities `aoi` and `tanaka`;
- objects `momo`, `wallet_clue`, and `mistaken_umbrella`;
- locations `store_front`, `park_edge`, `umbrella_stand_area`, and
  `staff_only_door` as required by the package;
- the two approved voice profiles, repository-owned reference records, and
  only code-owned presentation cues.

Keep schemas at `0.1.0` unless implementation proves an actual contract gap;
any schema-version change requires a separate approval. Validate schema,
catalog semantics, references, target coverage, carry reachability, exact
utterance/audio identity, and runtime capability before the scene starts.

### 3. Generalize the closed runtime capability gate

Replace the park-only constant lists with a closed, code-owned capability
registry for both accepted scenes. The validator must cross-check the manifest
against the registered scene definition and approved cue/voice registries; it
must not accept arbitrary catalog IDs merely because they appear in JSON.

Add last-train cues that map only to existing visuals and D-043 audio assets,
including restrained Aoi/Tanaka gestures, umbrella correction, Momo reaction,
wallet reveal/pickup/return, correct/incorrect feedback, tension pulse, and
resolution sting. No cue may accept an asset URL or playback script from the
manifest.

### 4. Generate and approve exact production speech

After Gate 1, queue the four exact utterances through the existing local speech
service. Require the correct fixed voice profile, deterministic cache key,
valid WAV structure, duration, text identity, and immutable SHA-256 for each
row. Expose a local review flow that lets the user listen to every file with
its Japanese text and profile.

Gate 2: all four exact rows must be explicitly approved as `READY` by hash.
Rejected or changed rows remain unavailable and cannot be bundled into the
playable package.

### 5. Load the fixed package through the registered world boundary

Add one local lesson-library entry for `Three Minutes to the Last Train`. The
web runtime resolves `manifest.scene.sceneId` through the existing world
registry, rather than using the `?world=neighborhood` preview flag. Preserve
the preview and existing park lessons as regressions.

Scene activation is atomic: invalid content, unsupported capability, missing
required world data, or non-READY required speech produces a clear recoverable
error before learner evidence begins. Audio-disabled or simulated playback
failure is different: the valid lesson starts and completes through captions,
replay state, and the assisted text path.

### 6. Verify and document Milestone 4

Add focused contract/server/web tests for production package validity, exact
coverage, wrong and assisted transitions, carry order, cue resolution, voice
consistency, cache readiness, fixed-world selection, persistence/resume, and
park regression. Update D-026's implementation consequences, CURRENT_STATE,
ROADMAP, the parent M8 plan, and this plan with measured results and remaining
Milestone 5 work.

## Files expected to change

- `packages/contracts/fixtures/catalogs/` and
  `packages/contracts/fixtures/manifests/` for the fixed production package;
- `packages/contracts/src/runtime-capabilities.ts` and focused validation
  tests for the two-scene closed gate;
- `apps/server/src/audio/` plus existing local review surfaces only as needed
  for exact production speech registration;
- `apps/web/src/lesson/`, `apps/web/src/game/`, `apps/web/src/audio/cues.ts`,
  and focused tests for package selection and execution;
- `docs/DECISIONS.md`, `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, and the
  parent/focused ExecPlans.

Do not change the M7 prompt/plugin contract or introduce a production compiler
profile in this milestone.

## Validation

Run with the repository-pinned Node/npm toolchain:

1. the new content-packet validation and hash check;
2. `npm run audio:m8:runtime-check`;
3. `npm run world:m8:runtime-check`;
4. `npm run schema:check`;
5. `npm run typecheck`;
6. `npm run lint`;
7. `npm run format:check`;
8. focused contract, server, and web tests;
9. `npm test`;
10. `npm run build`; and
11. `git diff --check`.

No Playwright is added or run under D-011. Docker is not applicable under
D-015 because the complete local game has not yet been accepted as a release
candidate.

## Manual acceptance matrix

### Gate 1 — language and story

1. Review all six targets, four exact utterances, Vietnamese support lines,
   nine-step graph, answer truth, distractors, and scaffolds.
2. Confirm Aoi is anxious but not punished, Tanaka is formal without accusing
   anyone, Momo supplies the clue, the umbrella is a mistake, and the wallet
   was dropped rather than stolen.
3. Approve the exact content-packet SHA-256 before speech generation.

### Gate 2 — production speech

1. Listen to all exact Aoi and Tanaka files from the local review page.
2. Confirm pronunciation, pacing, emotion, consistent profile assignment,
   exact displayed text, and no clipping/noise.
3. Approve each immutable speech SHA-256. Any rejected line is regenerated and
   reviewed under a new hash.

### A — happy path

1. Open the local lesson library and select the last-train lesson without the
   world-preview query parameter.
2. Confirm the rainy neighborhood, Aoi, Tanaka, Momo, umbrella, and wallet load
   from the manifest-selected scene.
3. Complete all nine steps correctly and verify every requested target gains
   its declared heard/recognized/arranged/typed/active evidence.
4. Confirm rain/road/rail ambience, voice ducking, Momo clue, wallet actions,
   tension, and resolution remain balanced and deterministic.
5. Confirm the final Aoi line plays from reviewed cache and no runtime Nemo,
   GPT, provider, or external asset request occurs.

### B — wrong, assisted, and audio failure

1. Submit a wrong CHOOSE, ARRANGE, TYPE, CLICK_OBJECT, PICK_UP, and GIVE where
   applicable; verify bounded feedback and no impossible state.
2. Exhaust attempts on each assessable primitive; verify deterministic
   scaffolds and completion without answer leakage before its configured gate.
3. Mute voice, deny initial audio unlock, simulate one missing speech file,
   and interrupt playback; captions and assisted text keep the lesson
   completable without duplicate heard evidence.
4. Verify a non-READY required production row blocks package activation rather
   than silently playing an old or technical WAV.

### C — persistence, lifecycle, and regressions

1. Reload/resume before and after PICK_UP and confirm the wallet carry state,
   acknowledged evidence, current step, and audio boundary restore safely.
2. Background/resume during speech, movement, ambience, and a cue; no duplicate
   source, cue, reaction, or evidence appears.
3. Restart the lesson and switch between last-train, neighborhood preview, and
   existing park lessons; scene/audio resources dispose once and IDs do not
   leak across packages.
4. Repeat in automatic renderer mode and forced WebGL2, including narrow and
   desktop layouts. Record the existing automatic WebGPU-fallback console risk
   separately if it recurs while visible WebGL2 recovery succeeds.

## Acceptance criteria

- The exact content packet and all four production speech hashes have explicit
  user approval.
- The production CatalogSnapshot and LessonManifest pass strict schema,
  semantic, coverage, capability, carry, cue, voice, cache, and world checks.
- The package is selectable and completable locally through correct, wrong,
  assisted, muted, and failed-audio paths in the accepted neighborhood.
- Every NPC utterance uses reviewed cached speech with its exact text and fixed
  voice profile; gameplay makes no synthesis or model call.
- Existing park lessons, neighborhood preview, mixer controls, persistence,
  and renderer fallback remain functional.
- Parent M8 Milestone 4 is documented complete only after supported automated
  checks and explicit manual A/B/C acceptance. Parent Milestone 5 remains the
  compiler integration and polish step.

## Progress

- [x] 2026-08-27 — Inspect the clean post-Milestone-3 repository and confirm
      commit `073259c` contains the accepted rainy-neighborhood preview.
- [x] 2026-08-27 — Confirm the fixed world IDs, two approved voice profiles,
      existing D-043 cue assets, park-only capability gate, and M7 compiler
      boundary.
- [x] 2026-08-27 — Prepare this proposed focused Milestone 4 plan without
      changing gameplay, generating speech, or adding any third party.
- [x] 2026-08-27 — User explicitly approves the plan with
      `DUYỆT PLAN M8 LESSON M4`; D-046 records the fixed-package-first,
      two-gate, zero-incremental-cost implementation boundary.
- [x] 2026-08-27 — Implement the deterministic Content Gate 1 packet,
      human-readable review sheet, validation script, and nine focused tests
      (one accepted packet plus eight rejection paths). Packet SHA-256
      `5e3cb41ab76b0f02958236c1c2241bc0d6c7e70b35a58996fa9f0072f7c403a6`
      remains `PROPOSED_FOR_USER_APPROVAL`; speech generation and runtime
      activation remain false.
- [x] 2026-08-27 — Content validation passes 6 targets, 4 utterances, 9 steps,
      and all 8 primitive identities. Focused tests pass 9/9; lint, relevant
      and extended-document formatting, schema drift for 56 generated files,
      workspace typecheck, and diff hygiene pass. No speech, runtime asset,
      provider call, browser automation, or Docker work occurs.
- [x] 2026-08-27 — Obtain Gate 1 exact content approval under D-047.
- [x] 2026-08-27 — Implement the fixed package, two-scene closed capability
      gate, deterministic assisted state correction, neighborhood selection,
      production cue map, and non-blocking speech playback.
- [x] 2026-08-28 — Generate four exact production WAVs, verify their local
      query/WAV hashes and sizes, receive exact Gate 2 packet approval under
      D-049, and promote only those four rows to immutable `READY`.
- [x] 2026-08-28 — Pass content/speech approval checks, manifest inspection,
      audio/world runtime checks, schema drift, typecheck, lint, formatting,
      aggregate tests (contracts 43/43, server 9/9, web 52/52), production
      build, and diff hygiene. Docker remains not applicable under D-015;
      Playwright remains excluded under D-011.
- [x] 2026-08-28 — User reports `M8 LESSON A: PASS`; the complete nine-step
      happy path, accepted neighborhood package, reviewed cached speech, and
      deterministic production audio path are manually accepted.
- [ ] 2026-08-28 — Manual scenario B is not accepted. The user reports that a
      beginner cannot identify the Japanese-only controls, receives no useful
      guidance before becoming stuck, and keeps trying to choose a correct
      answer without understanding the expected action. Treat this as an
      onboarding/scaffold UX failure, not learner failure.
- [x] 2026-08-28 — D-050 beginner guidance repair is implemented: recommended
      guided and optional immersive launch, Japanese-first bilingual controls,
      eight primitive-specific operational cues, bounded authored text help,
      and assisted evidence semantics. Supported automated/static gates pass;
      manual B/C retest was still open at this checkpoint.
- [x] 2026-08-28 — D-051 repairs the replay persistence regression and adds
      the fixed local Japanese study catalog/tools. Supported checks pass
      (contracts 46/46, server 9/9, web 66/66); JMdict is not promoted. Manual
      replay/tools and repaired B/C acceptance were still open at this
      checkpoint.
- [x] 2026-08-28 — D-052 replaces automatic wrong-TYPE assisted completion
      with explicit guided correction and revises the world layout/runtime to
      `1.0.1` so decorative trees no longer occupy the reported Momo/player
      sight lines. Contracts 46/46, server 10/10, web 68/68, world tests, all
      relevant gates, and build pass.
- [x] 2026-08-28 — User reports `M8 D-052 TYPE: PASS` and
      `M8 D-052 VISIBILITY: PASS`. The focused D-052 manual gates are closed;
      replay/study and the broader repaired B/C acceptance were still open at
      this checkpoint.
- [x] 2026-08-28 — User reports `M8 LESSON B RETEST: PASS` after the repaired
      guided path, ordinary repeated replay, and compact Japanese study-tool
      checks. Scenario C lifecycle/failure acceptance was the final open gate.
- [x] 2026-08-28 — User reports `M8 LESSON C: PASS`, accepting reload/resume,
      background interruption, replay recovery, simulated audio failure,
      assisted text continuation, and full completion.
- [x] Complete user-reported manual A/B/C acceptance.

## Plan decision

Recommend the fixed authored package first and compiler integration second.
This exposes content, runtime, audio, and world defects against one immutable
reference before M7-generated variation is allowed to select the production
profile. It also keeps the financial and provider boundary closed: Milestone 4
uses only already approved local assets and tools at zero incremental cost.
