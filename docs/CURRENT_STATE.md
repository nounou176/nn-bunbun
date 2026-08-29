# Bunbun Current State

Last updated: 2026-08-29

## Current milestone

Milestone 8 — Japanese voice and complete audio runtime is complete under
D-055. Milestone 9 — First product vertical slice is implemented under D-056
and awaits the user's focused learner-browser acceptance.

Active focused M9 ExecPlan:

- plans/2026-08-29-m9-first-product-slice-polish.md — Approved under D-056;
  reuse the
  accepted M8 world/lesson/audio/compiler and add only a learner-first product
  shell, truthful completion recap, local reaction-cadence measurement, and
  bounded product polish. Implementation and supported non-browser checks are
  complete; manual guided/immersive acceptance is pending.

Milestone 7's
provider-independent implementation is closed under D-036: authoring 0.2.0,
the Skills-only plugin, project-authored Bunbun Core reference, deterministic
park compiler, shared package/runtime capability gate, SQLite human-handoff
lifecycle, exact local JSON import, bounded repair, review, explicit immutable
publication, published lesson library, and browser revalidation are present.

D-035's five external reruns and real repair remain `WAIVED_BY_USER`, not
passed. D-036 also records the user's explicit request to skip new automated
tests and manual browser/gameplay acceptance while closing M7. The complete M7
flow is therefore `UNVERIFIED_USER_WAIVED`, and authoring transport 0.2.0
remains `UNVERIFIED`. Static typecheck, lint, plugin validation, formatting,
production build, and diff hygiene are implementation checks only. No provider
API, runtime AI, MCP, browser automation, external GPT edit, secret, or new
environment variable was added.

Most recently completed ExecPlan:

- plans/2026-08-20-complete-m7-file-import-compiler.md — Complete;
  implementation delivered, requalification and testing/manual acceptance
  waived under D-035/D-036

Most recently completed M8 parent ExecPlan:

- plans/2026-08-19-audio-complete-last-train-showcase.md — Complete under
  D-055; Milestones 2–6 are handed off, with focused M5 C2–C6 explicitly
  waived rather than passed

Completed focused M8 compiler-integration plan:

- plans/2026-08-29-m8-approved-profile-compiler-integration.md — Complete
  under D-054/D-055; manual A/B/C1 accepted and C2–C6
  `WAIVED_BY_USER`

Completed focused M8 lesson plans:

- plans/2026-08-27-m8-last-train-lesson-package.md — Complete under D-046
  through D-053; exact content and speech gates, the locally playable fixed
  package, and the complete manual A/B/C matrix are accepted
- plans/2026-08-28-m8-beginner-guidance-recovery.md — Complete under D-050;
  guided/immersive launch, bilingual controls, operational cues, authored help,
  and evidence-honest assistance are accepted through
  `M8 LESSON B RETEST: PASS`
- plans/2026-08-28-m8-japanese-text-tools-and-replay-recovery.md — Complete
  under D-051/D-053; implementation and supported automated checks pass, and
  scenarios B/C accept ordinary replay/study tools plus lifecycle/failure
  recovery
- plans/2026-08-28-m8-type-guided-retry-and-visibility.md — Complete under
  D-052; TYPE guided correction and world layout/runtime `1.0.1` are
  implemented, fully checked, and manually accepted through the user's
  `M8 D-052 TYPE: PASS` and `M8 D-052 VISIBILITY: PASS` reports

Completed focused M8 qualification plan:

- plans/2026-08-25-qualify-voicevox-nemo.md — Complete under D-038/D-039;
  VOICEVOX Nemo and exact Aoi/Tanaka voices are `QUALIFIED`

Completed focused M8 implementation plans:

- plans/2026-08-25-m8-reviewed-cached-japanese-speech.md — Approved under
  D-040 and accepted under D-041; complete
- plans/2026-08-25-m8-zero-cost-non-speech-audio-mixer.md — Approved under
  D-038/D-042/D-043; exact assets, implementation, and A/B/C manual
  browser/audio matrix complete

Completed focused M8 world plan:

- plans/2026-08-27-m8-rainy-neighborhood-world.md — Approved under
  D-025/D-038/D-044/D-045; exact selection, deterministic assembly, validation,
  local preview registration, and user-reported A/B/C browser acceptance are
  complete

Historical M7 v3.1 evidence plan:

- plans/2026-08-19-m7-v3-custom-gpt-browser-bridge.md — Superseded as the
  implementation route; retained for provisional direct-GPT evidence

Preserved inactive candidate:

- plans/2026-08-12-structured-lesson-compiler.md — Proposed M7 v1; inactive

Completed ExecPlans:

- plans/2026-08-10-project-foundation.md
- plans/2026-08-10-contracts-and-catalog-fixtures.md
- plans/2026-08-11-isometric-runtime-foundation.md
- plans/2026-08-11-first-deterministic-learning-loop.md
- plans/2026-08-12-complete-mvp-primitive-runtime.md
- plans/2026-08-12-local-evidence-sqlite-persistence.md

## Completed work

- D-054 accepts deterministic approved-profile selection. SQLite migration 4
  records `mode` and `profile_id`; exact aliases and target permutations map to
  one `m8_last_train_approved_v1` identity; the compiler validates the locked
  D-053 package, study binding, runtime capabilities, and four exact `READY`
  speech hashes before review or play.
- The selection route creates `READY_FOR_REVIEW` with zero authoring-attempt
  rows, forbids request export/result import, retains explicit publication,
  reuses an exact immutable lesson revision, and keeps truthful `AUTHORED`
  provenance. The published library now follows publication linkage rather
  than an `AI_ASSISTED` filter.
- The authoring home includes a Last Train preset and a mode-aware local review
  with requested/supporting targets and no GPT handoff controls. Published Last
  Train recommends guided play and offers immersive play; missing or changed
  speech identities disable both with a recovery message. Published park
  lessons remain immersive.
- D-047 accepts the exact M8 last-train Content Gate 1 packet SHA-256
  `5e3cb41ab76b0f02958236c1c2241bc0d6c7e70b35a58996fa9f0072f7c403a6`.
  The repository now owns one strict six-target, four-utterance, nine-step
  CatalogSnapshot/LessonManifest package for `neighborhood_small`.
- D-048 extends only deterministic `CONTINUE_ASSISTED` cases. MOVE_TO reaches
  the unique accepted location, PICK_UP sets the unique carried object, and
  GIVE performs the unique transfer before assisted completion; ambiguous
  answer truth remains invalid.
- D-049 accepts Speech Gate 2 packet SHA-256
  `f14d677762915f9c8bc868c7a624f17ac018d9ddb57fec315df9819461ff8d50`.
  Four exact Aoi/Tanaka WAVs are local immutable `READY`; runtime playback is
  bound to their approved SHA-256 ETags and does not require Nemo.
- The lesson library can select `終電まであと3分`, resolve its world from the
  manifest rather than a preview query, and preserve the existing park and
  technical speech demos as regression paths.
- D-050 adds a recommended Vietnamese-guided Last Train entry and an explicit
  immersive entry. All eight primitive types expose concise operational cues;
  required lesson controls are Japanese-first bilingual; guided/helped results
  remain assisted; and attempt-zero help never forges an active scaffold ID.
- D-051 makes LISTEN replay idempotent across normal replay,
  failure-before-start retry, interruption recovery, and resume. The server
  still rejects a changed payload for a reused immutable event identity.
- D-052 prevents every wrong TYPE submission from transitioning. Bounded
  authored attempts escalate into an explicit model-answer correction state;
  later accepted normalized input completes as assisted while raw text and
  post-limit wrong edits remain unpersisted.
- The rainy-neighborhood layout/runtime bundle is revised to `1.0.1`. Two
  project-authored decorative tree transforms move behind Momo and the initial
  Bunbun sight line; all D-045 source assets, actors, clues, locations, camera,
  navigation, identities, byte budget, and performance facts remain intact.
- D-053 accepts `M8 LESSON C: PASS`. Together with the accepted A, repaired B,
  TYPE, and visibility reports, the exact fixed-package manual A/B/C matrix is
  complete and parent M8 Milestone 4 is closed.
- `JapaneseTextStudyCatalog 0.1.0` covers all 40 fixed M8 Japanese content
  units with reviewed kana/romaji and bounded project-authored Vietnamese
  vocabulary/grammar notes. The UI exposes compact play/reading/vocabulary/
  grammar controls; only the four D-049 exact utterances enable play.
- `kuromoji@0.1.2` and `wanakana@5.3.1` are qualified authoring-only
  dependencies with retained notices and no runtime code. The ignored JMdict
  candidate is hash-qualified but has zero promoted records pending Gate 2.
- Established the durable product vision, architecture, gameplay primitives,
  LessonManifest 0.1.0 specification, performance direction, decisions,
  roadmap, current-state record, and ExecPlan standard.
- Recorded manual browser/gameplay testing, repository continuity, and the
  local-first release gate as accepted operating decisions.
- Created the Node.js 24.18.0/npm 11.16.0 workspace with separate Vite web,
  node:http server, and shared-contract packages.
- Created the responsive Milestone 1 foundation page and deterministic health
  and JSON 404 endpoints.
- Received the user's manual acceptance of Milestone 1 and recorded the
  supplied desktop screenshot.
- Accepted D-017: TypeBox 1.x is the schema-first source, Ajv performs strict
  structural validation, and pure TypeScript performs semantic validation.
- Implemented the complete LessonManifest 0.1.0 schema, including all three
  learning-target variants, eight interaction variants, ten scaffold variants,
  completion, quality, provenance, and closed nested records.
- Implemented CatalogSnapshot 0.1.0 for scenes, spawn points, cameras, asset
  bundles, locations, entities, objects and affordances, cues, voices, and
  reference records.
- Implemented stable, sorted structural and semantic diagnostics without
  mutation, coercion, defaults, repair, or removal of unknown properties.
- Implemented deterministic catalog, reference, scene, spawn, state,
  affordance, audio, cue, provenance, interaction, scaffold, graph,
  reachability, completion, coverage, evidence, support-locale, text-safety,
  and quality checks.
- Added one valid FIND_SOMETHING lesson and catalog fixture plus the six
  roadmap-required invalid fixtures.
- Added generated LessonManifest and CatalogSnapshot JSON Schema artifacts and
  a drift check covering all eight generated artifacts.
- Added a manifest inspection command and 14 focused contract tests.
- Proved the server and web consume the same LessonManifest version through an
  isolated browser-safe export; the Milestone 2 web production JavaScript was
  1.76 kB rather than bundling validators.
- Received the user's manual acceptance of Milestone 2 on 2026-08-11; the valid
  inspector, visible LessonManifest 0.1.0 value, and health contractVersion
  0.1.0 all passed.
- Accepted D-018: Three.js 0.185.1, desktop Chromium as the reference
  environment, automatic WebGPU with a forced WebGL2 fallback path, a fixed
  orthographic isometric camera, direct convex-region movement, and explicit
  provisional performance goals.
- Implemented the asynchronous renderer lifecycle, automatic fallback,
  recoverable error UI, capped-DPR resize, visibility pause/resume, frame-delta
  cap, context-loss boundary, page/HMR teardown, and owned GPU disposal.
- Added the repository-owned park_small glTF technical fixture, code-owned
  asset registry and scene definition, required-node validation, stable
  catalog-aligned guide/dog/cat identities, authored navigation bounds, and
  placeholder Bunbun player.
- Implemented registered-object and walkable-ground raycasting, deterministic
  click-to-move with replacement destinations, dog/cat selection and highlight,
  bounded zoom, and DOM/canvas input isolation.
- Added runtime diagnostics for renderer, FPS, average/p95 frame time, draw
  calls, triangles, render size/DPR, scene-ready time, pick response, selection,
  and movement plus eight focused web runtime tests.
- Added explicit `renderer=webgl2`, `debug=1`, and one-shot
  `assetFailure=1` local query controls without adding an environment variable.
- Received the user's `PASS` for the Milestone 3 manual functional matrix on
  2026-08-11, covering normal rendering, movement and selection, forced WebGL2,
  asset-failure retry, resize, background/resume, and reload behavior. Numeric
  diagnostics and reference-device details were not included in the report.
- Received a second explicit `PASS` on 2026-08-11 for the requested diagnostics
  and performance acceptance. Milestone 3 is closed on the user's qualitative
  acceptance; exact runtime values remain unreported and are not reconstructed.
- Accepted D-019 and implemented a second reviewed FIND_SOMETHING fixture with
  the required LISTEN → CLICK_OBJECT → CHOOSE sequence while preserving the
  Milestone 2 one-step fixture.
- Added full structural and semantic lesson-package validation before renderer
  startup plus a closed Milestone 4 capability gate for the scene, object,
  audio, cue, scaffold, and primitive executors that actually exist.
- Added a pure deterministic lesson controller with bounded attempts, authored
  scaffold escalation, seeded choices, assisted outcomes, feedback input
  locking, required-step completion, and a fresh in-memory session on restart.
- Added visibility-aware active timing and idempotent session-local exposure,
  heard, reaction, step-completed, and lesson-completed records. Heard evidence
  is written only after playback starts and replay cannot duplicate it.
- Added the temporary learner-gesture SpeechSynthesis adapter behind
  AudioPlaybackPort, a visible assisted audio-failure path, Japanese-first DOM
  learning UI, deterministic focus transitions, and candidate-filtered world
  input/highlight/cue commands.
- Added `manifestFailure=1` and `audioFailure=1` local controls and expanded
  diagnostics with lesson progress, heard/terminal/assisted outcomes,
  correct/wrong reaction counts, active time, latest reaction latency, and time
  to first lesson stimulus.
- The user's first Milestone 4 browser attempt exposed a world-to-lesson bridge
  defect: picking selected `dog`, but `find_dog` remained `AWAITING_OBJECT`
  with zero reactions. Replaced the indirect post-construction callback with an
  atomic candidate-and-handler input gate and added a focused regression test.
- The same screenshot exposed a diagnostics error: `render.calls` reported
  cumulative render invocations as draw calls. Diagnostics now use the
  per-frame `render.drawCalls` value.
- The user confirmed the corrected animal click reaches the lesson, then found
  an EXPLORE affordance issue: the centered translucent lesson card made the
  world appear modal and disabled. EXPLORE now uses a compact left-side mission
  card, reduced edge dimming, an active canvas cursor, and an explicit
  Japanese/Vietnamese instruction to click an animal in the park.
- Passed schema drift, typecheck, lint, format, 38 focused tests, and the
  production build after the fixes. The Milestone 4 JavaScript is 1,229,245
  bytes minified (340.84 kB gzip); the known Vite large-chunk warning remains
  visible.
- Received the user's explicit `PASS` on 2026-08-12 for the corrected compact
  EXPLORE presentation and the complete Milestone 4 manual happy-path,
  edge-case, failure-control, renderer, resize, and regression checklist.
  Milestone 4 is closed.
- Accepted D-020 after the user's Milestone 5 plan approval and kept
  LessonManifest/CatalogSnapshot at 0.1.0 while completing the remaining fixed
  primitive executors.
- Promoted exact TYPE normalization and Unicode code-point helpers into one
  browser-safe contracts utility shared by semantic validation and gameplay.
- Added a valid eight-step HELP_SOMEONE fixture that executes LISTEN, ARRANGE,
  CLICK_OBJECT, TYPE, MOVE_TO, PICK_UP, GIVE, and CHOOSE in one acyclic required
  path while preserving both earlier valid fixtures.
- Expanded the technical catalog and code-owned park registry with animal and
  bench locations plus a second visitor NPC. The new content remains a
  technical fixture and does not resolve O-001 or O-002.
- Extended the pure lesson controller with stable duplicate ARRANGE token IDs,
  seeded ordering, exact normalized TYPE answers, Unicode input limits,
  preserveSubmittedState, authored location arrival, deterministic movement
  failure recovery, one task-scoped carry slot, assisted PICK_UP, wrong-recipient
  retention, correct GIVE transfer, and invalid-carry rejection.
- Added accessible DOM token and Japanese TYPE controls with pointer, keyboard,
  deterministic focus, and IME composition isolation. Added dynamic compact
  EXPLORE action cues for objects, locations, pickup, movement, and recipients.
- Generalized the atomic lesson input gate into isolated OBJECT, LOCATION, and
  RECIPIENT modes. Added authored location markers, arrival-radius movement,
  guide/visitor selection, dog follow/escort presentation, transfer placement,
  and clean world restart without inventory, physics, collision, or pathfinding.
- Added `movementFailure=1` and `carryFailure=1` one-shot local controls and
  diagnostics for world target mode, pending location, and carried object.
- Passed schema drift, typecheck, lint, formatting, 46 focused tests, manifest
  inspection, the production build, and local web/health/404 HTTP smoke checks.
- Received the user's explicit `PASS` on 2026-08-12 for the complete Milestone 5
  manual happy-path, edge-case, failure-control, renderer, lifecycle, and
  performance matrix. No numeric diagnostics or per-scenario notes were
  supplied, so the milestone is closed on qualitative acceptance without a
  wider browser/device or numeric runtime claim.
- Accepted D-021 and added the independent EvidencePersistence 0.1.0 TypeBox
  contract, inferred types, Ajv validators, and generated JSON Schema artifact
  without changing LessonManifest or CatalogSnapshot 0.1.0.
- Removed learner TYPE values and answer-derived content from durable event
  payloads and IDs. Persisted TYPE reactions retain only correctness, authored
  target/evidence identity, support state, attempt, active latency, and time.
- Added built-in Node SQLite ownership with an ignored
  `.bunbun-data/bunbun.sqlite`, checksummed forward migrations, foreign keys,
  WAL, busy timeout, immutable lesson fingerprints, one ACTIVE session per
  lesson revision, append-only events, versioned checkpoints, idempotent commit
  receipts, preferences, summaries, and confirmed reset.
- Refactored the Node HTTP process into a testable application and added the
  closed `/api/v1` session, resume, commit, abandon, progress, preference,
  storage-summary, and local-data routes with strict JSON validation, 256 KiB
  body limits, stable errors, and the Vite same-origin development proxy.
- Added a closed checkpoint serializer and fresh-state restore for attempts,
  scaffolds, completed steps, feedback action, active time, carry, and GIVE
  transfers. TYPE drafts clear, interrupted movement/audio normalize safely,
  and acknowledged evidence is not replayed.
- Added the browser EvidenceStore port and validated HTTP adapter, ordered
  persistence gate, explicit Resume/Start again flow, abandonment on restart,
  durable completion, visible saving/error state, and no silent memory-only
  fallback.
- Added a local-only data panel with ASK/AUTO_RESUME/START_NEW preference,
  counts, conservative `INSUFFICIENT_EVIDENCE`/`NEEDS_REVIEW`/`DEVELOPING`
  signal, privacy explanation, and two-step permanent deletion. Added
  `persistenceFailure=1` and a privacy-safe `inspect:storage` command.
- Passed schema drift, typecheck, lint, formatting, 55 focused tests, and the
  production build. The two server tests exercise real temporary SQLite files,
  reopen/migration/idempotency/reset, and the complete HTTP lifecycle over
  loopback. Browser E2E remains manual under D-011.
- Received the user's explicit `DUYỆT MILESTONE 6` approval on 2026-08-12.
  This closes the supplied manual acceptance matrix qualitatively. No
  scenario-level notes, named test device, screenshots, measured persistence
  latency, or numeric renderer observations were supplied, so none are inferred.
- Added the project-authored `bunbun_core@0.1.0` technical reference for `犬`,
  `猫`, and `〜てください`, plus closed normalization, stable IDs/hashes,
  deterministic FIND_SOMETHING/HELP_SOMEONE park profiles, authoring request
  construction, contribution normalization, and complete eight-primitive
  LessonManifest compilation.
- Promoted the park runtime-capability validator into browser-safe shared
  contracts so server review/publication and browser loading reject the same
  unsupported scene, world, cue, scaffold, primitive, carry, voice, and audio
  capabilities.
- Added SQLite migration 2 and a durable compilation lifecycle with exact raw
  response hashing, no raw invalid-response retention, one bounded repair,
  stable diagnostics, review state, explicit immutable publication, published
  lesson listing/loading, and confirmed reset integration.
- Added closed node:http compilation/request/import/publish/lesson endpoints and
  an accessible pre-game target, disclosure, request-download, local file-only
  import, diagnostics, review, publish, play, and offline authored-demo UI.
  Published packages are untrusted and revalidated before entering the existing
  deterministic evidence/resume/Three.js runtime.
- Reconciled repair privacy semantics: JSON parse and structural failures carry
  only exact-response hash plus stable diagnostics; only a structurally valid
  semantic failure may carry its prior structured result. Reinstalled the local
  plugin as `bunbun-authoring@0.2.0+codex.20260824095911` through the official
  cachebuster flow.
- Closed M7 under D-036 at the user's direction. Workspace TypeScript, ESLint,
  plugin/Skill validation, Prettier formatting, production builds, and diff
  hygiene pass. No M7 tests, Playwright, manual browser/gameplay acceptance, or
  Docker build were run; the new flow is `UNVERIFIED_USER_WAIVED`.
- Accepted D-040 and implemented immutable `voice_aoi_01`/
  `voice_tanaka_01` records, exact canonical cache keys, checksummed SQLite
  migration 3, durable speech/reference/attempt state, interrupted-job
  recovery, confirmed purge, and a privacy-safe audio inspector.
- Added bounded loopback-only Nemo identity/query/synthesis handling, PCM WAV
  validation, atomic ignored cache artifacts, explicit serialized generation,
  authoring preview/review/reject/retry controls, and approved-only same-origin
  runtime resolution without a new dependency or provider.
- Added a strict M8 Aoi technical fixture and native cached playback with one
  shared mixer voice bus, preload, replay, safe interruption/disposal, visible
  `VOICEVOX Nemo` credit, and deterministic text fallback. The guide's browser
  SpeechSynthesis path remains legacy-only.
- Promoted exactly 16 user-approved non-speech binaries into the Vite-owned
  runtime tree. Runtime validation binds every file to the exact approval hash
  and byte count and rejects any extra or rejected file. The encoded set is
  4,958,589 bytes and the first-interaction preload is 925,841 bytes.
- Added one native learner-unlocked Web Audio graph with master, voice,
  ambience, effects, and music buses; session-local gain/mute controls;
  voice-priority ducking; decoded-buffer reuse; bounded active sources;
  failure isolation; background/resume/restart/disposal handling; visible
  credits; and audio diagnostics.
- Registered rainy park ambience plus deterministic footsteps, cat reaction,
  pickup/give, presentation cue, correct/incorrect/assisted feedback, tension,
  and completion sounds without changing manifest or evidence contracts.
- Added closed debug-only `nonSpeechFailure=ambience|effects|music` routes so
  the user can manually verify optional-file isolation without deleting or
  mutating an approved asset.
- Completed D-044's bounded ignored intake for four official Kenney archives.
  Provenance, archive safety, CC0 evidence, GLB structure, referenced textures,
  and hashes validate for 177 models. The tracked catalog exposes 55 exact
  local-review candidates and accounts for the other 122 as outside this
  bounded review; none is selected or present in runtime.

## Current work

- D-056's M9 product shell is implemented. The ordinary root now presents
  learner target entry, the approved Last Train situation, and published
  library actions; `debug=1` explicitly restores compiler/speech regression
  tools. Gameplay diagnostics, local-data controls, renderer identity, and
  technical footer are development-only. Completion now shows a current-visit,
  non-mastery recap with target coverage, reaction/result facts, active time,
  reactions per minute, and median/p95 active-time gaps, plus replay and return
  to library. Historical gaps are not invented on resume. No accepted M8
  content, audio, world, package, persistence schema, dependency, service, or
  asset changed. D-057 repairs the first completion run's inflated cadence by
  counting one meaningful reaction per `sessionId + stepId + attempt`, while
  retaining every target-level evidence row. Web typecheck, lint, and all 86
  web tests pass; the updated production build passes. The corrected manual
  cadence retest remains pending.

- M8 Milestone 5 implementation passes supported static, unit, integration,
  approval-hash, asset, and production-build gates. Contracts pass 46/46,
  server passes 18/18, and web passes 75/75. Content, speech, study, audio, and
  world identities remain unchanged. The focused manual A/B/C browser matrix
  is the remaining acceptance gate; no PASS is inferred before the user runs
  it. During manual A, the user's first ARRANGE report was traced through the
  local evidence database: the wrong first order was rejected and the exact
  second order was accepted, leaving the checkpoint at `type_wallet_request`.
  The confusing abstract post-error hint is repaired to expose the exact
  authored token order after one wrong attempt without changing grading.
  A follow-up screenshot showed that source-bank tokens looked like a completed
  answer while the actual answer region was empty; Submit was therefore
  disabled without an explanation. The ARRANGE UI now labels unselected versus
  answer regions explicitly, shows an empty-answer prompt and live remaining
  token count, and keeps the disabled Submit label readable. The user reports
  `M8 M5 A ARRANGE UI: PASS`; the attached browser screenshot reaches
  `COMPLETE` at 9/9 and preserves visible text recovery for speech interrupted
  in the background. The user then supplied the complete runtime diagnostics;
  durable inspection confirms the exact approved-profile compilation is
  `PUBLISHED` and session `bc5aac25-cd6d-4f14-83b3-fe906f891340` is
  `COMPLETED`, saved at checkpoint 51. M5 manual A is accepted.
  The user subsequently reports `M8 M5 B1: PASS`: reordered kana aliases reuse
  the same published compilation and single library entry. Database counts
  remain exactly one profile compilation, one Last Train revision, and one
  published link. The user also reports `M8 M5 B2: PASS` for partial,
  duplicate, unknown, and mixed inputs; no rejected request created a database
  row. The user reports `M8 M5 B3 IMMERSIVE: PASS`; one session records unaided
  LISTEN followed by a correct Help-assisted ARRANGE result, saved at
  checkpoint 7 with `Assisted results = 1`. The user then reports
  `M8 M5 B4 AUDIO FALLBACK: PASS`; durable session
  `03136f52-410f-49e6-9a78-fa904af052b9` completes 9/9 with zero HEARD events,
  nine assisted step results, checkpoint 31, and 49 stored events. During that
  run, the objective/world-tools card visibly overlapped the lesson on a
  portrait-like viewport. It now starts collapsed on narrow/low viewports and
  exposes an accessible `Thu gọn / Mở nhiệm vụ` toggle. The user reports
  `M8 M5 B MISSION TOGGLE: PASS` and supplies screenshots of both collapsed
  and expanded states. M5 manual B is accepted. Manual C1 also passes: the
  supplied `犬 + ～てください + 猫` request remains
  `AUTHORING_HANDOFF · PARK_AUTHORING_V1 · AWAITING_AUTHORING` with Download
  request and Import result controls. The user then directs
  `không cần test, làm tiếp`; D-055 records C2–C6 as `WAIVED_BY_USER`, closes
  M8 Milestones 5 and 6, and advances planning to M9 without weakening the
  later local release-candidate gate.
- D-052 TYPE guided correction and the neighborhood visibility revision are
  implemented. The second wrong M8 TYPE answer now exposes the exact reading
  and a bilingual `Điền câu mẫu` action without advancing. The learner still
  submits the normalized sentence; correct post-limit input completes as
  assisted. Layout/runtime `1.0.1` moves `tree_large_north` and
  `tree_small_path` behind the reported Momo/player camera sight lines. Full
  supported checks pass, and the user reports both focused TYPE and visibility
  gates as PASS. D-053 records the later `M8 LESSON C: PASS` and closes parent
  Milestone 4. D-054 subsequently approves and implements Milestone 5's
  approved-profile selection; its manual A/B/C matrix remains open.
- D-050 beginner guidance is implemented after the user's first manual B run
  failed on onboarding. The Last Train card now offers `Chơi có hướng dẫn tiếng
Việt` and `Thử thách chủ yếu bằng tiếng Nhật`. Guided mode opts into existing
  support on every step, while immersive mode waits for the bilingual Help
  action. Runtime-owned `Cách chơi` copy explains each primitive without
  selecting an answer, and Help exposes only existing authored textual hints.
  The user's first guided TYPE-step screenshot requested pronunciation and
  exposed inactive Continue/Restart buttons. The UI now shows both the authored
  pattern and `財布（さいふ）を探（さが）してください。` reading, while an
  explicit hidden-button rule removes inactive bilingual controls.
  Automated/static gates pass, and the user reports
  `M8 LESSON B RETEST: PASS` after the repaired guided browser run.
- Parent M8 Milestone 3 has passed its second user gate. The user approved the
  complete 55/55 proposal: 18 approved, 37 rejected, Aoi
  `world_character_n`, Tanaka `world_character_q`, Momo `world_animal_cat`, and
  storefront `world_building_type_n`. The proposal packet SHA-256 is
  `e9b6fa88597815d1178a35c4f63651a4504f212eec1b8fe9b340bf3a380b9390`.
  D-045 and the immutable approval artifact authorize exactly that set.
- Four self-contained deterministic GLBs are registered behind the closed
  `?world=neighborhood` route. The neighborhood has Aoi, Tanaka, Momo, clue and
  location anchors, a bounded direct-movement area, idle animation, code-owned
  rain presentation, and D-043 ambience. The default park path remains intact.
  The D-052 layout/runtime `1.0.1` manifest SHA-256 is
  `7e78b86ea5df42d86246e83e9cc8a394f5865678d104b5226c6d28e598b259ae`;
  its revised static GLB SHA-256 is
  `e3e0ce67ef368d6d974ad7dacc7eb2b46b5a6a4e3c4dae080b288eb04be01f98`.
  The user reports `M8 WORLD A: PASS` for the automatic-renderer visual,
  movement, picking, animation, ambience, and diagnostics checklist. No numeric
  diagnostics were supplied. The user also reports `M8 WORLD B: PASS` for the
  forced-WebGL2 path with no reported visual, interaction, animation, or audio
  regression. Finally, `M8 WORLD C: PASS` accepts required-asset failure and
  retry, background/resume, reload/disposal, and default lesson-library/park
  regression. The focused world plan and parent M8 Milestone 3 are complete.
- The user's first review screenshot showed static page chrome but no
  assignment controls, candidate cards, or model. The reviewer no longer lets
  GPU initialization block catalog DOM rendering, automatically requests the
  first model after renderer startup, contains malformed saved local state,
  and reports module/renderer failures visibly. A second screenshot reproduced
  the failure and exposed the root cause: `three.module.js` imported the
  unserved `/vendor/three.core.js`. The complete local module chain now returns
  HTTP 200 and has a focused regression test; the corrected browser path awaits
  the user's retest. The user subsequently reported explicit `PASS` after the
  stale server process was replaced: model display, assignments, and candidate
  cards are now available. This accepts the review tool path, not an exact
  asset selection; Gate 2 still requires the exported JSON packet.
- D-041 records the user's approval of the exact Aoi WAV for
  `財布を探してください。` and their successful cached-gameplay check. The row
  is immutable `READY`; repository inspection confirms its reviewed hash,
  duration, and byte length. Port 50121 was not listening during confirmation,
  so gameplay used the Bunbun cache rather than the Nemo authoring engine.
  D-043 now separately selects the exact non-speech runtime set and mixer.
- The renderer fallback regression is fixed and manually reconfirmed by the
  user's 2026-08-25 screenshot: the park renders under WebGL2 and the lesson UI
  starts. That screenshot exercised the legacy `voice_guide_01` authored demo,
  not the M8 cached Aoi fixture. Browser SpeechSynthesis failed there, while the
  assisted-text fallback remained visible. The user subsequently selected the
  correct M8 cached demo and reported it as OK.
- Test A of the remaining speech matrix exposed a resume-prompt UX regression:
  `Resume lesson` looked disabled because a generic group-button rule overrode
  its primary background, and the renderer badge remained `STARTING…` while
  startup waited for the user's choice. The prompt now shows `WAITING…`, both
  choices are explicitly enabled, the primary style remains visible, and the
  loading state resumes immediately after either selection. Automated checks
  pass. The user's `A RETEST: PASS` screenshot confirms the M8 session resumes
  at `listen_aoi_request` in `AWAITING_AUDIO` under WebGL2. The observed run
  reports 61 FPS, 16.5/25.0 ms average/p95 frame time, 32 draw calls, 2,053
  triangles, and 78 ms scene-ready time; these are not generalized as a
  performance baseline.
- Test B exposed a controller/persistence mismatch on simulated audio failure:
  the client activated `afterAttempt: 1` scaffolds at attempt 0, and the server
  correctly rejected the invalid checkpoint before storage. `AUDIO_FAILED` now
  preserves authored scaffold timing and exposes fallback through `helpUsed`
  and `audioFailed`. The regression test asserts the persisted checkpoint stays
  at attempt 0 with no premature scaffold. All 89 tests and supported static/
  build checks pass. The user's retest screenshot confirms a saved sequence-1
  `AWAITING_CONTINUE` checkpoint with `Heard / step results` 0/0 and visible
  Japanese/support text. The user then reports `B RETEST: PASS` after `次へ`:
  assisted completion succeeds without heard evidence or a runtime/checkpoint
  failure.
- Test C passes by explicit user report. The supplied screenshot confirms the
  background-interruption message, visible Japanese, replay control, and Nemo
  credit; the user confirms replay has no overlapping source or duplicate
  heard evidence and assisted completion succeeds. The D-040 focused
  cached-speech plan is complete. Full M7 gameplay regression remains waived
  under D-036 rather than inferred from this M8 acceptance.
- D-042 is accepted and its bounded ignored intake is complete. Eight files
  from seven exact CC0 source rows total 6,223,378 bytes. Four archives pass
  member, traversal, symlink, nested-archive, executable, and expanded-size
  checks. Retained page/license evidence, source downloads, and 26 listening
  candidates all pass byte/hash validation. Four Bunbun-authored mono 48 kHz
  16-bit PCM WAVs regenerate byte-identically under 2/2 focused tests. The
  candidate catalog and loopback-only review server are present. The user then
  supplied an exact hash-bound result: 16 candidates are approved and 10 are
  rejected. The durable decision is
  `docs/audio-sources/M8_NON_SPEECH_APPROVAL_2026-08-25.json`; the catalog is
  now `APPROVED_BY_USER`.
- D-043 promotes only the approved binaries unchanged and implements the
  native mixer. The runtime set totals 4,958,589 bytes: 3,676,430 ambience,
  538,071 effects, and 744,088 music. The first preload is 925,841 bytes. The
  implementation uses no new provider, service, account, key, environment
  variable, dependency, or incremental cost. Automated checks pass.
- The user reports `M8 MIX A: PASS`: the learner-unlocked happy path confirms
  scene ambience, clear Aoi playback, ambience/music duck and smooth recovery,
  master/voice/ambience/effects/music controls, mute, and non-overlapping
  replacement previews.
- The user reports `M8 MIX B: PASS` across the closed debug routes
  `nonSpeechFailure=ambience|effects|music`. Missing rain, correct-feedback
  effect, or tension music is diagnosed without trapping cached speech,
  unaffected buses, feedback, or completion. Optional-file isolation is now
  manually accepted.
- The user reports `M8 MIX C: PASS` under forced WebGL2. Backgrounded one-shots
  do not replay, only desired loops return, interrupted Aoi playback clears
  ducking, replay keeps one voice source without duplicate heard evidence,
  restart/reload leaves no stale sound or growing active-source count, credits
  remain visible, and full reload resets session-local controls. This closes
  the focused D-043 manual matrix qualitatively; no numeric runtime or device
  measurements are inferred.
- Milestone 7 implementation is closed under D-036. Milestone 8 audio work is
  active. D-039 resolves its local TTS engine and exact Aoi/Tanaka Nemo voices;
  D-040 resolves and implements the speech cache foundation; D-042 resolves
  the bounded source route; D-043 selects, implements, and manually accepts the
  exact non-speech set and mixer. Final production utterance approval,
  dialogue, vertical-slice mix acceptance, and measured runtime acceptance
  remain open.
- D-037 explicitly excludes Amazon Polly, the AWS SDK, AWS configuration,
  credentials, and billing from Milestone 8. No AWS change or request was made;
  D-038 now constrains O-010 to a zero-incremental-cost local/offline route.
- D-038 generalizes the budget boundary: no new third-party service,
  dependency, model, or asset may be selected or added before an explicit
  reviewed plan; any option capable of incremental cost is excluded from the
  current route. Free tiers and credits do not satisfy
  the constraint. OpenAI API and Amazon Polly are excluded, and M8 must first
  pursue a zero-incremental-cost local/offline route.
- D-039 qualifies the dedicated stable Nemo Engine 0.24.0 Linux CPU x64 release
  as a removable local authoring tool. Aoi uses Female 6 style `10006`, UUID
  `3490c392-30be-44c2-8379-b77df27fa65e`; Tanaka uses Male 2 style `10000`,
  UUID `7ecc7a17-1465-4b22-a3b5-842a110ff55e`. Expected/worst recurring cost
  is USD 0 and accepted credit is `VOICEVOX Nemo`. AivisSpeech remains an
  uninstalled conditional fallback. The verified engine remains ignored local
  data; gameplay never calls it and no product dependency was added.
- The approved D-039 intake archive is 136,493,982 bytes and matches published
  SHA-256
  `c2af9ddf42dd28f55e831f0e76f605321daaec981dda3c8be558c734dc6830e7`;
  extracted disk use is 316 MiB. Its default user-data path is outside the
  workspace; the user has now explicitly confirmed the process-local
  `XDG_DATA_HOME` name and ignored Bunbun value, so engine state remained inside
  the approved project-local path. The loopback API, 36 unchanged-baseline anchors,
  independent hash/query/WAV validation, invalid-style rejection, and isolated
  offline synthesis now pass. The user shortlisted Female 1 and Female 6 for
  Aoi, plus Male 1 and Male 2 for Tanaka. Their 48-file, twelve-line finalist
  matrix also passes identity, unchanged-query, WAV, hash, and page validation.
  The user then explicitly approved `F6/M2` with no line-specific pronunciation
  issue reported. Qualification is complete; D-040 now implements the stable
  profiles and reviewed-cache path without promoting qualification WAVs.
- Accepted D-027 and `docs/M7_VARIANTS.md` now separate three M7 strategies:
  inactive M7 v1 preserves proposed D-022 and the Responses/Structured Outputs
  plan; M7 v2 preserves self-built local LLM research; active M7 v3 reuses
  captured Custom GPT behavior without `gpt-5.6-terra` or `OPENAI_API_KEY`.
- D-031 supersedes D-028's WXT stage and selects M7 v3.2 as a local personal
  ChatGPT/Codex plugin containing one composed lesson-authoring Skill and no
  MCP server. WXT is now a research-only fallback; v3.3 MCP remains conditional.
  The selected route has no `OPENAI_API_KEY` and uses normal ChatGPT plan
  allowance, subject to account/workspace availability and plan limits.
- D-032 implements the local `bunbun-authoring@0.1.0` plugin with one
  `bunbun-lesson-authoring` Skill. Closed `0.1.0` request/result schemas,
  canonical input hashing, exact prompt-pack identity, claim-level world
  bindings, strict local validation, generated fixtures, inspection CLI, drift
  gate, local marketplace manifest, and user-run proof instructions now exist.
  The plugin is installed and the fixed supported-surface response is one
  strict JSON object accepted by the local inspector as
  `m7_v3_2_lesson_authoring_001`. The user confirmed the plugin started no
  unexpected image, file, or tool flow; attaching the required input packet was
  the only file action.
- D-033 closes the broader D-024 evaluation. Eleven generated requests were
  run through independent ephemeral Skill conversations; ten raw results pass
  strict validation and fixture grading, while
  `story_sheet_rejects_source_scope_regression` is retained as a strict-JSON
  rejection because of one trailing `}`. Four fixtures remain honest contract
  gaps because 0.1.0 cannot carry authoritative practice text, accepted
  Japanese answer truth, or all required runtime-plan fields. Authoring 0.2.0
  closes those gaps, and reviewed local JSON file import is now implemented
  instead of clipboard or direct handoff.
- Prepared the first user-operated Story Sheet feasibility packet from the
  approved `story_sheet_find_dog_single_target` fixture. The packet fixes the
  request/module/source/prompt identities, reviewed `犬` target, catalog-backed
  park facts, three story beats, JSON-only response templates, privacy boundary,
  and canonical input hash
  `56a69ce3153d3ad7e7fcc5e4502340a78246cd416cec9a4c1195b018dd38da6c`.
  The user returned a raw result from a new conversation. Exact JSON shape,
  identity, beat order, target surface assignment, prohibited-output scan, and
  all text budgets pass. The fixture is nevertheless rejected because the
  response invents a dog/cat spatial relation and a relieved guide state. Its
  target motivation is vague and the promised mystery does not appear in the
  beats. The user's latest explicit correction records
  `imageFileOrToolStarted=no`; the evaluation retains the earlier value as an
  audit note. Run 001 passes its media policy and remains rejected only by its
  semantic fixture.
- Prepared and locally validated Run 002 from the approved
  `story_sheet_help_someone_grammar_context` fixture. It uses the reviewed
  `～てください` grammar target, four fixed beats, and explicit park, guide,
  visitor, dog, and bench claims. Its canonical input SHA-256 is
  `d5bdca9c5ff55c260235b707d2ad6a5cba0b4618bb96d18bcc14d6ef78d6b3cc`;
  its packet SHA-256 is
  `f902a092294e8fc06533243d7e28d4d47ed21dd704b22b7be7a08f3dc4cf8794`.
  The returned response passes exact JSON, identities, beat order, grammar
  assignment, world-fact discipline, all expected properties, and all budgets.
  The user's latest explicit correction records
  `imageFileOrToolStarted=no`; Run 002 is accepted as a complete structural,
  semantic, and media pass. Raw response SHA-256 is
  `79ded3dbb5a0691a79fc11b75450ca55911f61e69bf4c4f5f3f4e6df02aec350`.
- Prepared and locally validated Run 003 from the approved
  `story_sheet_multiple_targets_fixed_beats` fixture. It fixes `～てください` to
  opening, `犬` and `猫` to development, and `犬` to closing. Its canonical
  input SHA-256 is
  `020cf7f1d346576d3f3f0742e676ce850dce1690e660da42d6528526749f9896`;
  its packet SHA-256 is
  `37f830fec7d422f1ed7e21d68bd410187260fb46899d0eda182f7776e741e4e7`.
  D-029 records that the user canceled this run before execution; it is not
  evidence. Runs 004 and 005 were not prepared or executed.
- Accepted D-029: stop the Story Sheet gate after two of five fixtures and
  classify it as `PROVISIONALLY_VIABLE_FOR_ORCHESTRATION_PLANNING`, not a full
  qualification. D-031 keeps this as historical evidence and rejects proposed
  D-030's dedicated bridge-mode GPT.
- The proposed v3.2 ExecPlan packages only the three D-024-approved lesson
  responsibilities into one repository-owned Skill. The other three captured
  GPT behaviors remain disabled for M7. The plan excludes programmatic login,
  cookies, persistent browser profiles, UI scraping, browser automation, WXT,
  actions, tunnels, MCP, external GPT edits, provider keys, and real
  learner-data transmission until separately approved.
- Playwright/Puppeteer, Playwright MCP, and browser-use remain research-only.
  LibreChat/AnythingLLM reconstruction belongs to the M7 v2 comparison because
  it reuses GPT designs rather than the hosted GPT objects.
- The old M7 v1 plan remains intact as a comparison baseline. None of its
  D-022, model, reasoning, environment-name, provider, job, or implementation
  gates are approved.
- Captured six user-owned Custom GPT configurations and their Knowledge assets
  in the Git-ignored local `gpts/` library. Added a normalized index and six
  source summaries without changing the raw inputs. The source set contains six
  configs, three Knowledge text specs, 57 PNG files representing 53 unique
  images, and one example APKG with 42 notes/cards and 38 mapped media files.
- Accepted D-023 after the user confirmed that the supplied six GPTs are the
  exact complete set. Milestone 7 maps Story Sheet to premise/story/setting,
  Story Coach to bounded hints/scaffolds/pedagogical cadence/feedback, and
  Reverse Trainer to phrase analysis/reverse recall/practice content. Code
  retains primitive sequence, difficulty progression, IDs, transitions, and
  hard budgets.
- Classified every supplied image and the APKG as a local style/output example
  only. They cannot supply lesson/reference content or evaluation fixtures.
- Accepted D-024 after the user approved Prompt Adaptation Pack 0.1.0. Its
  shared contract, three exact prompt fragments and hashes, fixed composition
  order, deterministic failure/privacy boundaries, and fifteen text-only
  fixtures are now approved. Milestone 7 phase 0 is complete.
- All three selected M7 prompt modules are packaged in the local plugin and
  their typed results may be imported at compile time, but they never run in
  ordinary gameplay. D-031 preserves D-023's one-composed-request rule through
  one lesson-authoring Skill and does not call the three original hosted GPTs
  sequentially.
- Added the approved `docs/ai-modules/` adaptation pack: one shared typed
  contribution contract, three exact lean prompt fragments, source and prompt
  hashes, three module adaptation records, and fifteen text-only evaluation
  fixtures. The pack explicitly removes image/worksheet/Anki, unverified JLPT/
  reference claims, long ChatGPT teaching flows, and deterministic runtime
  control from the selected modules. Pack approval does not enable any provider
  or API call.
- Accepted D-025 after the user approved the practical Three.js world-authoring
  proposal. The approved direction uses Three.js Editor, reviewed Kenney CC0
  city/character/pet candidates, optional authoring-time THREE.Terrain, bounded
  GLB chunks, and code-owned world metadata. The first production-world
  envelope is a small Japanese neighborhood with road, convenience-store, and
  park areas, two NPCs, and one animal. No asset or dependency has been added.
- Accepted D-026 after the user approved the audio-complete showcase plan. The
  first product vertical slice is now an N5, Vietnamese-supported rainy-evening
  `Three Minutes to the Last Train` scenario with Aoi, Tanaka, Momo the cat,
  requested `財布`, `探す`, and `～てください` targets, recoverable narrative
  pressure, voiced Japanese, authored ambience, deterministic effects, and
  restrained music or stings. O-001 and O-002 are resolved for this slice.
  Exact production assets, TTS/provider/voice/cache choices, dialogue, and
  acceptance thresholds remain unimplemented or open.

## Repository inventory

Present:

- AGENTS.md, `docs/AI_MODULES.md`, `docs/WORLD_AUTHORING.md`, and the required
  docs/ durable project records;
- .agent/PLANS.md, the completed Milestones 1–7 ExecPlans, one preserved
  inactive M7 v1 proposal, historical v3 proof plans, and one approved next
  audio-complete showcase ExecPlan;
- root npm workspace and shared TypeScript, ESLint, Prettier, NVM, npm, and
  environment-example configuration;
- apps/web with Vite, Three.js, the park_small glTF fixture, isometric runtime,
  deterministic eight-step/eight-primitive lesson executor, durable
  EvidenceStore adapter, safe checkpoint restore, task-scoped carry/transfer
  reconstruction, local data controls, DOM learning shell, reviewed-speech
  authoring controls, native cached-voice playback, diagnostics, and focused
  tests;
- apps/server with health, local persistence, M7 compilation/publication, and
  M8 speech-authoring/cache APIs, built-in SQLite lifecycle, three checksummed
  migrations, evidence/compiler/speech repositories, privacy-safe inspectors,
  bounded Nemo/WAV adapters, and integration tests;
- packages/contracts source schemas for LessonManifest, CatalogSnapshot,
  EvidencePersistence, and authoring 0.1.0/0.2.0, inferred types, shared runtime
  capabilities, validators, fixtures, generated JSON Schema artifacts,
  inspector, and existing tests; and
- package.json and package-lock.json.

Not present:

- approved world and non-speech assets are present, but the four exact
  production speech rows and complete production lesson package are not; the
  accepted technical Aoi speech WAV remains ignored local cache data and is not
  promoted by the Content Gate 1 proposal;
- learner identity, cross-device sync, mastery, scheduler, or analytics
  transport;
- application AI/model calls, runtime TTS calls, or remote/paid provider
  integrations;
- automated browser E2E configuration or tests;
- Dockerfiles; and
- deployment configuration.

The canonical repository is `/home/nunu/Desktop/nnlab/nn-bunbun`. The current
documentation and implementation changes are uncommitted.

## Known issues

1. The first rainy-neighborhood bundle has exact source/hash/license and
   asset-budget evidence plus qualitative automatic-renderer and forced-WebGL2
   acceptance. Numeric cold/warm timings, frame-local diagnostics, picking
   latency, and movement duration were not supplied and remain unclaimed.
2. Contract 0.1.0 rejects every graph cycle because it has no counter or
   condition language with which to prove an arbitrary cycle bounded.
3. Deterministic validators cannot judge natural Japanese quality or future
   physical reachability from 3D geometry; those require later review/runtime
   systems.
4. Forced WebGL2, the functional matrix, and the provisional performance matrix
   passed by user report, but numeric runtime measurements and named-device
   details were not supplied. No wider browser, mobile, or touch support is
   claimed.
5. On the accepted reference run, Vite's client console intermittently logged
   a Three.js WebGPU-to-WebGL2 initialization rejection (`Vector4.fromArray`)
   while the runtime recovered and the user completed the A/B/C matrix. This
   does not invalidate the accepted visible fallback path, but the console-level
   upstream/backend behavior remains a known diagnostic risk for later renderer
   maintenance.
6. D-047/D-050 approve exact dialogue, Vietnamese support, six targets, the
   nine-step graph, and four production WAV hashes. The validated fixed runtime
   package is implemented, and the user reports `M8 LESSON A: PASS` for the
   pre-recovery happy path. D-050 repairs the reported beginner-onboarding
   failure with guided/immersive launch, bilingual controls, operational cues,
   and authored help. The user reports `M8 LESSON B RETEST: PASS` and
   `M8 LESSON C: PASS`; the exact manual A/B/C matrix is complete. Numeric
   runtime measurements remain open for later acceptance criteria.
7. The cached-speech replay regression reported on 2026-08-28 is repaired in
   code and covered by controller/server regression tests. Ordinary replay and
   the new study controls are accepted through `M8 LESSON B RETEST: PASS`.
   Reload/resume, interruption recovery, replay recovery, and audio-failure
   completion are accepted through `M8 LESSON C: PASS`. No broader browser or
   device claim is inferred.
8. D-052 repairs automatic wrong-TYPE advancement and the reported tree
   occlusion in code/assets. Automated controller, persistence, assembly,
   runtime, and build checks pass, and the user reports both
   `M8 D-052 TYPE: PASS` and `M8 D-052 VISIBILITY: PASS`. No numeric visibility
   measurement or wider device/browser claim is inferred from those reports.
9. Cross-lesson mastery aggregation, weak-target scheduling, remote analytics,
   and progress synchronization remain deferred. M7 compiler normalization is
   implemented only for the closed three-target Bunbun Core technical profile;
   arbitrary Japanese coverage remains unsupported.
10. The login shell resolves system Node.js 18.19.1 until NVM is sourced;
    contributors must run nvm use to activate Node.js 24.18.0.
11. M8 Milestone 5 manual A is accepted. Its reported ARRANGE block
    was instructional rather than a rejected correct answer: durable evidence
    records correct attempt 2 and progression to TYPE. The repaired ARRANGE
    UI now has both automated coverage and the user's explicit
    `M8 M5 A ARRANGE UI: PASS`, with a `COMPLETE` 9/9 screenshot. The supplied
    diagnostics and local durable profile/session records close A; the B/C
    matrix stays open.
12. Deployment topology remains intentionally deferred until local
    release-candidate acceptance.
13. The current WebGPU-capable web build is 1,425.15 kB minified and triggers
    Vite's default uncompressed chunk warning; measured gzip size is 392.12 kB.
    Reported browser measurements must guide any future splitting.
14. Browser SpeechSynthesis voice quality and availability vary by installed
    desktop voice. D-040 confines it to legacy `voice_guide_01` technical
    fixtures; Aoi and Tanaka never fall back to it.
15. Milestone 6 has only qualitative overall manual approval. There are no
    scenario-level observations, measured save/reload latency, named device or
    browser details, or numeric renderer metrics; the approval must not be
    represented as evidence for those finer-grained claims.
16. RECOGNITION_FALLBACK is valid in contract 0.1.0 but has no accepted web
    runtime rejoin semantics. D-020 keeps it capability-rejected in
    Milestone 5 rather than guessing behavior.
17. PICK_UP uses a technical dog follow/escort presentation and one carry slot;
    it is not production animal handling, an inventory, or a physics system.
18. Milestone 5 browser behavior is manually accepted, but the user supplied no
    numeric diagnostics, named-device details, or per-scenario evidence. The
    result does not establish broader browser, mobile, or touch support.
19. Six Custom GPT configurations and their local Knowledge assets are
    captured, their Milestone 7 mapping is accepted, and Prompt Adaptation Pack
    0.1.0 is approved. The three selected modules are compile-time inputs via
    manual file handoff and remain absent from gameplay. GPT-editor model,
    capability/action, and version-history metadata was not supplied and is not
    inherited; config hashes identify the reviewed local source snapshots.
    Supplied images and the APKG remain style/output examples only.
20. M7 v3 cannot assume that the original GPTs satisfy the approved typed
    adaptations. Story Sheet normally generates worksheets/images, while
    Reverse Trainer and Story Coach are long interactive flows. Run 001 proves
    strong structural compliance but fails strict world-fact discipline; Run
    002 passes; three fixtures are unrun. D-031 avoids making direct hosted-GPT
    viability an implementation dependency by selecting the repository-owned
    prompt adaptations inside one Skill, but the truncated v3.1 evidence remains
    a quality risk and must not be upgraded to a full pass.
21. D-032 closes the transport-proof output-budget gap by putting explicit
    title, objective, premise, setting-context, and synopsis limits in the
    request packet. These authored fixture values are proof inputs, not yet
    accepted production-profile defaults.
22. D-032 resolves the v3.1 world-fact ambiguity conservatively with stable
    claim IDs, per-beat claim allowlists, and returned claim bindings. This
    makes unknown or out-of-beat claims deterministically rejectable, but code
    still cannot prove that every nuance of free-form natural-language copy is
    semantically entailed. Application publication therefore remains gated by
    later catalog/runtime validation and review.
23. Product-surface availability, install behavior, and strict composed output
    validation now pass for `bunbun-authoring@0.1.0`. Installation exposed two
    local setup constraints now recorded in the runbook: a repository
    marketplace manifest belongs at `.agents/plugins/marketplace.json`, and the
    NVM-preferred Codex CLI `0.121.0` does not expose `plugin add`, while
    `/home/nunu/.local/bin/codex` `0.147.0` does. The fixed media/file/tool gate
    passes after distinguishing the expected input attachment from unexpected
    plugin output. Plan-limit behavior remains unverified. The Codex IDE
    extension does not support plugins; a supported app/CLI or ChatGPT surface
    is required.
24. Authoring 0.2.0 now represents all fifteen D-024 fixtures and carries
    compiler-owned practice text, exact accepted Japanese answer truth,
    read-only runtime-plan context, and bounded repair diagnostics. The
    installed plugin is 0.2.0, but D-035 waives rather than passes external
    requalification. No transport result may be inferred from source validation
    or the waiver.
25. D-036 closes M7 implementation without focused compiler/repository/API/web
    tests or manual end-to-end gameplay. Static checks and build pass, but
    create/import/repair/restart/publish/play behavior, idempotency, reset, and
    authored-demo regressions remain `UNVERIFIED_USER_WAIVED`. A fresh job after
    terminal failure receives a retry-suffixed identity so prior attempt audit
    rows remain intact.
26. M9 current-visit cadence is intentionally session-local in the browser.
    EvidencePersistence stores step-relative active latency but no global
    active-time event timestamp, so a resumed visit cannot reconstruct prior
    inter-reaction gaps. The recap states that it is not a mastery score; manual
    guided and immersive threshold observations are still pending.
27. The unchanged server audio test file executes all six assertions, then the
    Node.js 24.18.0 process aborts during native callback teardown with
    `InternalCallbackScope::Close` / `execution_async_id`. The crash reproduces
    when that file runs alone. The separate compiler and persistence suites
    pass 11/11 when local loopback binding is permitted. This blocks a truthful
    full-root `npm test` PASS but does not implicate an M9-changed server file.
28. The first M9 completion screenshot proves the recap renders at 9/9, but its
    15.0 reactions/minute and 0.0-second median are not accepted. D-057 repairs
    the source semantics by grouping target-level REACTION rows per learner
    attempt and timestamping the group once. Under D-058, the user waives the
    fresh guided and immersive cadence retest; its result is `WAIVED_BY_USER`,
    not PASS, and M9 retains no accepted named cadence measurement.

## Next recommended work

Complete the focused M9 learner-browser acceptance without expanding M7's
provider scope:

1. Run the remaining non-cadence M9 learner-browser checks only if the user
   chooses to retain them; D-058 waives the corrected cadence retest.
2. Confirm `debug=1` retains development tools if that remaining regression is
   kept in scope.
3. Carry M8 C2–C6 as `WAIVED_BY_USER`; do not infer their results or weaken the
   later local release-candidate acceptance gate.
4. Preserve M7's `UNVERIFIED_USER_WAIVED` label until explicit later evidence
   is supplied; keep v1 inactive, v2 research-only, and v3.3 MCP conditional.

D-025 and D-026 now have an approved queued implementation plan at
`plans/2026-08-19-audio-complete-last-train-showcase.md`. It covers world and
audio source/license intake, reproducible GLB export, the representative
neighborhood chunk, catalog registration, audio completeness, performance, and
manual browser validation. It does not reorder Milestone 7, and production
work remains gated by rainy-neighborhood approval, final speech review, and
measurable vertical-slice acceptance choices.

## Verification status

- M9 D-056/D-057 implementation: full typecheck passes, lint passes, formatting
  passes, all 57 schema artifacts pass, 86/86 web tests pass, and the full
  contracts/server/web production build passes. The production output is
  1,435.45 kB JavaScript (395.18 kB gzip) and 21.57 kB CSS (5.13 kB gzip), with
  the existing Vite large-chunk warning. Playwright remains excluded under
  D-011 and Docker is not applicable under D-015. The first cadence screenshot
  is invalid; corrected manual guided and immersive cadence results are
  `WAIVED_BY_USER` under D-058 and are not PASS.
- Full-root `npm test` is not PASS: contracts pass 46/46, web passes 86/86,
  and separately rerun server compiler/persistence tests pass 11/11, but the
  unchanged server audio test process aborts after its six passing assertions
  due to the reproducible Node.js 24.18.0 native teardown assertion recorded in
  Known issue 27.

- D-052 TYPE guided correction and visibility: contracts 46/46, server 10/10,
  web 68/68, deterministic world tests, typecheck, lint, formatting, 57 schema
  artifacts, content/speech/study/audio/world gates, production build, and diff
  hygiene pass. World runtime manifest SHA-256 is
  `7e78b86ea5df42d86246e83e9cc8a394f5865678d104b5226c6d28e598b259ae`;
  static GLB SHA-256 is
  `e3e0ce67ef368d6d974ad7dacc7eb2b46b5a6a4e3c4dae080b288eb04be01f98`.
  Build output is 1,425.15 kB JavaScript (392.12 kB gzip) and 18.96 kB CSS
  (4.61 kB gzip), with the known large-chunk warning. Playwright remains
  excluded under D-011 and Docker is not applicable under D-015. The user
  reports `M8 D-052 TYPE: PASS` and `M8 D-052 VISIBILITY: PASS`; both focused
  manual gates are accepted.
- D-051 replay and Japanese study tools: the compact catalog validator passes
  40/40 exact Japanese units at 49,116 bytes with SHA-256
  `fc7fa9b9f700c5b570446274e311a97d11a2ece95dc221251905357ff9949ccd`
  and zero JMdict-derived records. Full supported checks pass contracts 46/46,
  server 9/9, web 66/66, schema drift for 57 artifacts, typecheck, lint,
  production build, and bundle dependency scan. The restricted aggregate run
  reproduced the known Node native abort after six server tests; the required
  unrestricted server rerun passes 9/9. The build reports 1,423.46 kB
  JavaScript (391.69 kB gzip), 18.43 kB CSS (4.51 kB gzip), and the known
  large-chunk warning. The user reports `M8 LESSON B RETEST: PASS` for ordinary
  repeated replay and the compact audio/reading/vocabulary/grammar controls.
  `M8 LESSON C: PASS` accepts reload/resume, background interruption, replay
  recovery, simulated audio failure, assisted continuation, and completion.
  The separate JMdict Gate 2 review packet SHA-256 is
  `4717468383091e73bcaacf09e8a94713bc68311a68ada87ce2db5b23531c17a9`;
  all eight exact proposed rows match the ignored archive and zero are
  promoted.
- D-050 beginner guidance: focused support-mode/guidance and hidden-control
  regression tests pass. Full
  workspace checks pass under Node.js 24.18.0: contracts 43/43, server 9/9,
  web 58/58, typecheck, lint, formatting, schema drift for 56 artifacts,
  content/speech approval checks, audio/world runtime checks, production build,
  and diff hygiene. The restricted test run reproduced the known Node native
  abort after server loopback tests began; the required unrestricted rerun
  passes all 9 server tests. The build reports 1,382.03 kB JavaScript (381.79
  kB gzip), 17.02 kB CSS (4.20 kB gzip), and the known large-chunk warning.
  Playwright remains excluded by D-011 and Docker remains not applicable under
  D-015.
- D-049 Speech Gate 2: the review validator re-hashes all four ignored local
  WAV and query artifacts, checks byte lengths and manifest identities, and
  passes with packet SHA-256
  `f14d677762915f9c8bc868c7a624f17ac018d9ddb57fec315df9819461ff8d50`.
  The approval promotion reports all four exact rows as `READY`; compiler
  integration remains false.
- D-048/fixed-package checks: strict manifest inspection passes 6 targets, 9
  steps, 8 primitive identities, 3 interactive objects, and the closed
  `neighborhood_small` capability gate. Focused contract and web controller
  tests pass deterministic unique-truth assistance and existing park
  regressions. Full workspace checks pass: contracts 43/43, server 9/9, web
  52/52, typecheck, lint, schema drift, formatting, production build, content
  and speech approval validation, audio/world runtime validation, and diff
  hygiene. Server HTTP tests require execution outside the network sandbox to
  bind loopback. Playwright is excluded by D-011 and Docker is not applicable
  before local release-candidate acceptance under D-015.
- D-046 M8 Content Gate 1 proposal: deterministic validation passes six
  targets, four exact utterances, nine steps, all eight primitive identities,
  fixed Aoi/Tanaka voice assignments, bounded assistance, target evidence,
  carry order, USD 0 cost, and closed provider/runtime authority. Focused tests
  pass 9/9, covering one valid packet plus authority, provider, primitive,
  scaffold, voice, attempt, carry, and evidence rejection paths. Lint,
  relevant and extended-document formatting, schema drift for 56 generated
  files, workspace typecheck, and `git diff --check` pass. The exact packet
  SHA-256 is
  `5e3cb41ab76b0f02958236c1c2241bc0d6c7e70b35a58996fa9f0072f7c403a6`.
  This proposal was subsequently approved under D-047; D-049 separately
  approves the four resulting WAV hashes and local runtime activation.
  Playwright is excluded by D-011 and Docker is not
  applicable under D-015.
- D-039 VOICEVOX Nemo qualification: the official 0.24.0 CPU archive matches
  its published hash and passes archive validation. The live API reported nine
  voices and bound only to `127.0.0.1:50121`. All 36 unchanged-baseline WAVs
  pass format, query, identity, and SHA-256 verification; average synthesis was
  711.1 ms and average realtime factor was 0.335. A separate namespace with
  only loopback and zero external routes generated a byte-identical offline
  WAV. Unknown style `999999` was rejected with HTTP 500 and no output. The user
  then shortlisted four voices; all 48 twelve-line finalist WAVs pass identity,
  query, format, hash, and page validation, averaging 560.7 ms and a realtime
  factor of 0.342. The user explicitly approved Female 6 style `10006` for Aoi
  and Male 2 style `10000` for Tanaka, with no line-specific issue reported.
  Result: `QUALIFIED`. The engine is stopped. No app tests, builds, Docker, or
  browser automation apply to this isolated ignored-data qualification.
- D-040 M8 speech-cache implementation: schema drift, workspace typecheck,
  lint, format, production build, and `git diff --check` pass. All 89 tests
  pass: contracts 41/41, server 9/9, and web 39/39. The M8 fixture passes the
  shared contract/runtime gate. Fresh loopback generation produced one valid
  83,500-byte, 1,739 ms, 24 kHz mono PCM Aoi WAV with query SHA-256
  `668f6128cf9197f3441f7bf060922a38b6eff15eaf944c3e908f215f2dafac37`
  and WAV SHA-256
  `516bdac89cfeb577911d6ea3d287b789f6ebbfede28d12e0923a5ce57b76b5de`.
  The user explicitly approved that exact artifact, moving it to immutable
  `READY`, and reported the cached gameplay path as OK. Repository inspection
  confirms the same metadata, and no listener was present on port 50121. The
  user's earlier screenshot also confirms WebGL2 park startup and records the
  separate legacy `voice_guide_01` SpeechSynthesis failure with assisted text
  visible. Test A found the misleading resume-prompt state described above;
  its fix passes automated checks and the user's retest passes. Test B found a
  premature scaffold checkpoint; the server rejected it without storing
  invalid state, and its fix plus retest pass. Test C background interruption,
  replay, evidence, and completion pass by explicit user report. A focused
  Node 24.18.0 rerun passes 25/25 web playback,
  interruption, fallback, resume, and evidence checks plus 7/7 server cache,
  review, recovery, capacity, identity, purge, and HTTP-boundary checks. The
  real `READY` artifact was not mutated. Playwright remains excluded by D-011
  and Docker is not applicable under D-015.
- D-043 M8 non-speech/mixer implementation: exact approval validation passes
  16 approved / 10 rejected; runtime validation passes 16 files / 4,958,589
  bytes; deterministic authored-audio tests pass 2/2; schema drift checks 56
  generated files; workspace typecheck, lint, repository and extended-document
  formatting, production build, and `git diff --check` pass. All 96 workspace
  tests pass when the server's loopback integration boundary is permitted:
  contracts 41/41, server 9/9, and web 46/46. The restricted sandbox blocks
  `listen(127.0.0.1)` and causes Node 24 to abort inside the server test runner;
  the required rerun outside that network restriction passes 9/9. The build
  reports 1,322,650 bytes of JavaScript (367.94 kB gzip), 16,253 bytes of CSS
  (4.02 kB gzip), and the known large-chunk warning. Playwright remains
  excluded by D-011; Docker is not applicable because no Dockerfiles exist and
  D-015 defers release packaging. The user's qualitative `M8 MIX A/B/C: PASS`
  reports complete the focused manual browser/audio matrix without supplying a
  numeric performance baseline.
- D-044 M8 world candidate qualification: four exact archives retain stable
  SHA-256 identities and fit the approved limits at 10,849,076 compressed
  bytes, 42,954,997 expanded bytes, and 1,017 members. All 177 GLBs and their
  21 referenced PNG textures validate; 55 enter exact visual review and 122
  are explicitly outside scope. Three focused test files, schema drift,
  workspace typecheck, lint, formatting, production build, diff hygiene, and
  all 96 workspace tests pass; the server tests require the existing permitted
  loopback boundary. Loopback smoke checks return HTTP 200 for the review HTML,
  local Three.js loader, one animated character GLB, and its exact texture.
  Automated browser E2E remains excluded by D-011; user visual acceptance is
  pending.
- M7 completion under D-036: no automated test suite, Playwright, browser/
  gameplay acceptance, external 0.2.0 transport rerun, or real repair run was
  executed at the user's explicit direction. Workspace typecheck, lint,
  formatting, plugin/Skill validation, production build, and `git diff --check`
  pass. The web build reports 1,290.77 kB JavaScript (357.34 kB gzip), 14.60 kB
  CSS (3.80 kB gzip), the 5.89 kB glTF fixture, and the known large-chunk
  warning. These are implementation checks, not runtime acceptance. Docker is
  not applicable because no Dockerfiles exist and D-015 remains active.

- M7 v3.1 Story Sheet Run 001: the raw response parses as exactly one JSON
  object; key sets, request/hash/module identity, `OK` shape, beat order, target
  surface assignment, prohibited-output scan, and all fifteen measured text
  budgets pass. Manual semantic review rejects `USES_ONLY_ALLOWED_FACTS` for
  one unsupported dog/cat spatial relation and one unsupported guide state.
  The latest user correction records `imageFileOrToolStarted=no`; the media
  check passes. Raw response SHA-256 is
  `adb1ef122378f0f3ad09a163036b93b5503df9d794f9681571b270f763f5c667`.
- M7 v3.1 Story Sheet Run 002: exact JSON, identities, key sets, beat order,
  grammar assignment, world-fact discipline, all expected properties, and all
  seventeen measured text budgets pass. The latest user correction records
  `imageFileOrToolStarted=no`, so the complete run is accepted. Raw response
  SHA-256 is
  `79ded3dbb5a0691a79fc11b75450ca55911f61e69bf4c4f5f3f4e6df02aec350`.
- M7 v3.1 Story Sheet Run 003 preparation: packet JSON, approved fixture
  identity, exact three-target beat assignments, catalog IDs, source/prompt
  hashes, canonical input hash, packet hash, and privacy scan pass. Browser/GPT
  execution was canceled by user decision; no response or result exists.
- D-031 Skills-only direction: the accepted transport/orchestration decision,
  rejected D-030 proposal, WXT fallback status, v3.3 MCP gate, pricing boundary,
  and proposed successor ExecPlan are documented without implementing a plugin,
  compiler, or external account change. `git diff --check`, the repository
  format check, and explicit Prettier checks for all changed Markdown files
  pass. This documentation-only change did not run code tests, builds, Docker,
  or browser checks.
- D-032/M7 v3.2: official plugin and Skill validators pass; the prompt
  drift/media/secret scan passes for all three approved modules; both generated
  JSON Schemas are current; and all 66 contract/server/web tests plus schema,
  typecheck, lint, format, and production build checks pass under Node.js
  24.18.0. On 2026-08-20 the user installed `bunbun-authoring@0.1.0`, invoked
  the fixed packet, and returned exactly one JSON object. The local inspector
  accepted request `m7_v3_2_lesson_authoring_001` with
  `AUTHORING_EXCHANGE_ACCEPTED`. The user confirmed `newConversation: yes`,
  `responseFinished: yes`, and no unexpected plugin-started image, file, or tool
  action; their initial `yes` referred only to the required input attachment.
  Manual gameplay regression remains pending. No Playwright or Docker check
  applies under D-011 and D-015.
- D-033/M7 v3.2 Milestone 4: all fifteen D-024 identities are covered by the
  generated evaluation ledger. Eleven requests were executed in independent
  text-only Skill conversations; ten pass strict exchange and fixture grading,
  one is rejected by `RESULT_JSON_PARSE_ERROR`, and four are explicit contract
  gaps. The raw first responses and SHA-256 values are retained in
  `docs/ai-modules/feasibility/m7-v3-2-milestone-4-evaluation.md`. Focused
  contract tests, full workspace checks, and production builds are recorded in
  the completed ExecPlan. Browser E2E and Docker remain not applicable under
  D-011 and D-015.
- D-034/M7 completion Milestone 1: authoring 0.2.0 artifact drift check passes
  for 56 generated files; plugin drift, Skill, and plugin validators pass; all
  41 contract tests and all 34 web tests pass; workspace typecheck, lint,
  format check, production build, and `git diff --check` pass. The valid 0.2.0
  exchange inspector accepts the generated fixture. The SQLite repository test
  passes, while the HTTP integration test could not bind `127.0.0.1` inside the
  restricted sandbox; its required elevated rerun and plugin reinstall were
  both blocked by the current Codex usage limit. No browser or gameplay result
  is inferred. Playwright remains excluded by D-011 and Docker is not
  applicable because the repository has no Dockerfiles under D-015.
- D-028/M7 v3 sequence documentation: `git diff --check` passed, and Prettier
  passed for all nine changed Markdown files. This decision-only change did not
  run code tests, browser checks, or builds.
- D-027/M7 strategy documentation: `git diff --check` passed, and Prettier
  passed for all twelve changed or new Markdown files. This documentation-only
  change did not run code tests, browser checks, or builds.
- Dependency installation: an isolated clean `npm ci --ignore-scripts
--offline` passed with Node.js 24.18.0/npm 11.16.0; 146 packages were added,
  150 packages were audited, and zero vulnerabilities were reported. The final
  lockfile also passes an in-place offline dry-run.
- Generated artifact drift check: passed for three schemas and six invalid
  fixtures.
- Typecheck: passed for contracts, server, web source, and web test tooling.
- Lint and format check: passed.
- Tests: passed, 55 of 55: 19 contract tests, 2 server SQLite/HTTP integration
  tests, and 34 web lesson/persistence/runtime tests.
- Fixture inspection: the valid lesson passed; all six invalid fixtures exited
  nonzero with their intended stable error codes.
- Production build: passed for contracts, server, and web workspaces; web
  output contains 1,273.78 kB JavaScript (351.53 kB gzip reported by Vite),
  12.42 kB CSS (3.17 kB gzip), a 5.89 kB local glTF fixture, and 0.52 kB
  HTML. Vite reports the known JavaScript chunk warning.
- HTTP regression: passed after starting temporary local Node 24 processes for
  updated web HTML, health contractVersion 0.1.0, and JSON 404. Sandbox port
  binding required approved local access; both processes were stopped cleanly.
- Scope regression: passed; the executor remains limited to the eight accepted
  fixed primitives, one task-scoped carry slot, server-owned local persistence,
  and the isolated temporary browser speech adapter. No AI, provider key,
  analytics transport, production TTS, physics runtime, Docker, deployment, or
  automated browser E2E artifact was added. The locked `@types/three` package
  has an unused transitive Rapier type dependency; Bunbun does not import or
  bundle it.
- Docker build: not applicable; Dockerfiles intentionally do not exist.
- Milestone 1 manual browser test: passed by user report on 2026-08-10.
- Milestone 2 manual acceptance: passed by user report on 2026-08-11; the valid
  inspector, visible LessonManifest 0.1.0 value, and health contractVersion
  0.1.0 were confirmed.
- Milestone 3 manual functional acceptance: passed by user report on
  2026-08-11. A second `PASS` closed the requested performance checklist; exact
  reference-environment and numeric diagnostics remain unreported.
- Milestone 4 manual acceptance: passed by explicit user report on 2026-08-12
  after the world-input and EXPLORE-affordance corrections.
- Milestone 5 manual acceptance: passed by explicit user report on 2026-08-12
  for the complete supplied matrix. Acceptance is qualitative because no
  numeric diagnostics or per-scenario notes were supplied.
- Milestone 6 manual acceptance: explicitly approved by the user on 2026-08-12
  as an overall qualitative result.
- Automated browser E2E tooling: intentionally excluded by D-011.

## Risks

- Any selected M7 strategy needs a typed draft contribution and deterministic
  normalization into the playable contract; it must not weaken LessonManifest
  0.1.0. The all-required Structured Outputs schema remains specific to
  inactive M7 v1.
- Catalog capability checks do not replace Milestone 3 measurements of
  navigation, object overlap, renderer compatibility, or real asset budgets.
- Milestone 4 preserves partial screenshot metrics, but browser version,
  device/GPU identity, display details, warm/cold split, and audio-start latency
  remain unreported despite qualitative acceptance.
- Manual-only browser validation depends on disciplined user reports; the
  Milestone 5 overall PASS provides no retained screenshots, numeric runtime
  measurements, or per-case evidence for later comparison.
- The Milestone 6 approval did not include per-scenario evidence or measured
  responsiveness. Future persistence or runtime changes should re-run targeted
  manual checks rather than treating this approval as a numeric baseline.
