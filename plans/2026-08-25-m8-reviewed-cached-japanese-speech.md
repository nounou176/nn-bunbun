# Implement reviewed cached Japanese speech for Milestone 8

Status: Implementation checkpoint complete; user WAV review pending
Owner: Codex and user
Created: 2026-08-25
Last updated: 2026-08-25 13:33 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Replace browser-dependent speech for the first production character profiles
with reviewed Japanese WAV files generated locally before gameplay. An author
can enqueue exact LessonManifest speech, explicitly start one local generation
run, listen to each result, and approve or reject it. Only approved files are
available to gameplay. A learner can then hear the approved cached line,
replay it without duplicating `heard` evidence, and continue through visible
Japanese text when speech is missing, interrupted, muted, or invalid.

This is the speech foundation of Milestone 8, not the complete audio milestone.
It does not select or add ambience, effects, music, or their third-party source
assets. Those sources and the complete multi-bus mixer remain a separate D-038
approval gate after this plan.

## Repository context

Milestone 7 is implementation-complete under D-036 with its verification
waiver retained. The browser currently creates
`createSpeechSynthesisAudioPort` in `apps/web/src/lesson/audio.ts` and invokes
it from `apps/web/src/lesson/runtime.ts`. The port already separates playback
callbacks from lesson truth, and the controller records `heard` only after
`AUDIO_STARTED`. Audio failure already exposes an assisted text path.

LessonManifest and CatalogSnapshot 0.1.0 already carry `AudioAsset.textJa`,
`voiceProfileId`, `cacheKey`, optional `durationMs`, and catalog-owned voice
IDs. `packages/contracts/src/validation/semantic-interactions.ts` checks exact
utterance/audio text identity. No arbitrary URL or path is accepted. The
contract does not need a version change for this plan.

The Node server owns `.bunbun-data/bunbun.sqlite` through built-in
`node:sqlite`. `apps/server/src/persistence/migrations.ts` has two ordered,
checksummed migrations. `apps/server/src/http.ts` exposes a closed local
`/api/v1` boundary, and Vite already proxies it. There is no audio cache table,
generation repository, engine adapter, WAV validator, file resolver, authoring
review UI, or approved runtime WAV.

D-039 has qualified the already downloaded, Git-ignored VOICEVOX Nemo Engine
0.24.0 as a removable loopback-only authoring tool. The user approved Aoi as
Female 6 style `10006`, speaker UUID
`3490c392-30be-44c2-8379-b77df27fa65e`, and Tanaka as Male 2 style `10000`,
speaker UUID `7ecc7a17-1465-4b22-a3b5-842a110ff55e`. Both use model version
0.15.0. The engine manifest UUID is
`208cf94d-43d2-4cf5-abc0-9783cac36d29`. The accepted visible credit is
`VOICEVOX Nemo`. Qualification WAV files are evaluation evidence and cannot be
promoted into the production cache.

The working tree already contains the user's and prior M8 qualification
documentation changes. Implementation must preserve them and avoid unrelated
cleanup.

## Scope

### In scope

- Add immutable application voice profile IDs `voice_aoi_01` and
  `voice_tanaka_01`, mapped in a code-owned server registry to the exact D-039
  engine, archive, manifest, model, speaker UUID, and style identities.
- Define one canonical speech cache-input format and deterministic
  `bunbun_tts_v1_<sha256>` key algorithm over exact Japanese text and every
  approved input that can change the result.
- Add SQLite migration 3 for queued generation, attempts, review state,
  artifact metadata, hashes, durations, paths, and failure codes.
- Add an explicit, serialized local generation runner that calls only the
  qualified engine at `127.0.0.1:50121`; it never starts automatically and
  never downloads, installs, or starts the engine.
- Validate engine/profile identity before synthesis, preserve the returned
  query JSON, validate bounded PCM WAV output, hash files, and write them
  atomically under Git-ignored `.bunbun-data/audio-cache/v1/`.
- Add an authoring review flow for exact text, profile, duration, WAV hash,
  preview, `VOICEVOX Nemo` credit, approve, reject, and explicit retry.
- Serve preview audio only to the authoring review path and serve gameplay
  audio only after explicit approval through a same-origin, cache-key-only
  application endpoint.
- Add one repository-owned M8 technical speech fixture using Aoi and the exact
  line `財布を探してください。`. It proves the path but is not accepted M9
  dialogue or a production world asset.
- Replace the production-character playback path with fetched cached WAV and a
  native browser audio voice gain. Keep captions, replay, current evidence
  rules, safe interruption, disposal, and visible text fallback.
- Retain `voice_guide_01` and the current SpeechSynthesis adapter only as an
  explicitly named legacy compatibility path for the existing M4–M7 technical
  fixtures. Aoi and Tanaka must never fall back to SpeechSynthesis.
- Add visible `VOICEVOX Nemo` credit wherever an approved Nemo result is
  previewed or played.
- Add a confirmed local authoring action that removes only generated speech
  cache files and their migration-3 metadata; it does not delete learning
  evidence, lessons, the qualified engine, or migration history.
- Add focused static, unit, SQLite, HTTP, cache, WAV, runtime, privacy, and
  recovery verification plus a manual browser/audio checklist.

### Out of scope

- Ambience, footsteps, animal sounds, object effects, feedback sounds, music,
  stings, source selection, downloads, processing, or registration.
- The complete master/voice/ambience/effects/music settings UI, ducking, spatial
  audio, or scene/cue audio registry. This plan leaves a small voice-gain seam
  for that approved successor but does not add empty product systems.
- Final M9 dialogue, all last-train utterances, a production rainy scene, Aoi
  or Tanaka models, Momo audio, or acceptance of the showcase lesson.
- Treating qualification WAVs as runtime assets or copying them into the new
  cache.
- Runtime TTS, browser-to-engine calls, automatic engine startup, public engine
  binding, remote generation, cloud fallback, OpenAI API, Amazon Polly,
  AivisSpeech, Kokoro, or another provider/model.
- New npm, system, browser, audio-middleware, SDK, database, or web-framework
  dependencies.
- Voice cloning, training, fine-tuning, morphing, microphone capture, SPEAK,
  pronunciation scoring, or machine-learning use of Nemo output.
- Docker, deployment, public endpoints, accounts, credentials, secrets, or a
  new application environment variable.
- Automated browser E2E tooling under D-011.

## Decisions and constraints

- D-008 requires ahead-of-game generation and stable cache reuse.
- D-011 assigns browser/gameplay/audio acceptance to the user and excludes
  Playwright or another automated browser E2E suite.
- D-013 and D-017 keep LessonManifest and CatalogSnapshot 0.1.0 strict. This
  plan uses their existing audio boundary and does not add URLs or paths.
- D-015 makes Docker and deployment not applicable before local release-
  candidate acceptance.
- D-019 preserves the `AudioPlaybackPort`, `AUDIO_STARTED`, assisted failure,
  and no-duplicate replay semantics.
- D-021 keeps SQLite server-owned, stores no typed learner response, and
  restores transient audio at a safe boundary.
- D-026 requires exact reviewed speech, stable named-character voices,
  captions, replay, text fallback, and no TTS call in ordinary gameplay.
- D-037 excludes Amazon Polly, AWS configuration, credentials, SDKs, endpoints,
  and billing.
- D-038 requires this self-contained cost, license, data, operations, fallback,
  and removal review before production integration.
- D-039 is the only selected TTS source. It qualifies Nemo for removable local
  authoring and exact F6/M2 voice assignments but does not itself authorize
  this implementation.

The intended stable profile records are immutable:

| Profile ID        | Character | Nemo voice | Style | Speaker UUID                           | Model  |
| ----------------- | --------- | ---------- | ----: | -------------------------------------- | ------ |
| `voice_aoi_01`    | Aoi       | Female 6   | 10006 | `3490c392-30be-44c2-8379-b77df27fa65e` | 0.15.0 |
| `voice_tanaka_01` | Tanaka    | Male 2     | 10000 | `7ecc7a17-1465-4b22-a3b5-842a110ff55e` | 0.15.0 |

Changing a character's qualified engine, model, speaker, style, or baseline
policy creates a new profile ID such as `voice_aoi_02`; an accepted profile is
never silently remapped. These character-owned IDs are intentionally not used
for the technical guide.

The canonical cache input is sorted canonical JSON with these fields:

- format and version: `bunbun_speech_cache_input` version `1`;
- exact `textJa` bytes with no trim, case, whitespace, or Unicode
  normalization performed by the cache layer;
- immutable `voiceProfileId` and profile revision;
- `voicevox_nemo` engine version `0.24.0`, the qualified archive SHA-256,
  manifest UUID, model version, speaker UUID, and style ID;
- query policy `nemo_unchanged_audio_query@1`;
- user-dictionary fingerprint `none`;
- pronunciation/accent override fingerprint `none` for the approved baseline;
  any future reviewed override must have its own content hash and cache key;
- output container `wav`, codec `pcm_s16le`, sample rate 24000 Hz, and one
  channel.

The cache key is `bunbun_tts_v1_` followed by the 64 lowercase hexadecimal
SHA-256 characters of that canonical JSON. The returned query and WAV receive
separate SHA-256 hashes after generation. A query change under otherwise
identical pinned inputs is a reproducibility failure, not an in-place cache
overwrite.

Cost, license, data, and operations boundary:

- Expected incremental usage cost: USD 0.
- Worst-case recurring or usage cost: USD 0. There is no account, subscription,
  paid tier, metered request, automatic purchase, or paid fallback.
- The official qualified engine remains a local authoring tool outside Git.
  Its source and output terms are retained in
  `docs/audio-sources/VOICEVOX_NEMO_0.24.0.md`. Generated output must display
  `VOICEVOX Nemo` credit and must not be used for machine learning.
- Generation sends only exact project-authored Japanese plus the qualified
  style ID from the Bunbun server to `127.0.0.1:50121`. No learner identity,
  evidence, TYPE response, checkpoint, secret, or personal data leaves the
  host. Gameplay sends no request to port 50121.
- No account or credential is required. No secret is stored. The already
  confirmed process-local `XDG_DATA_HOME` name may be reused only in the manual
  Nemo authoring-engine start command to keep mutable engine data under the
  qualified ignored directory. It is not read by application code or stored in
  `.env` or a shell profile.
- The generation runner is single-process and one-at-a-time. Each engine HTTP
  call has a bounded timeout and response limit. One enqueue accepts at most 60
  speech assets. Each query sidecar is at most 1 MiB and each WAV at most 5 MiB.
  The cache refuses new work before ready plus staging files exceed 512 MiB.
- Host CPU, memory, electricity, and disk are local operational resources, not
  provider charges. Qualification measured about 386 MiB engine RSS and
  409–841 ms for finalist utterances on this host.
- Zero-cost alternatives remain text-only playback fallback and retaining the
  legacy technical SpeechSynthesis path for old fixtures. No alternative TTS
  engine is installed or selected by this plan.
- If Nemo is unavailable, mismatched, rejected, or removed, generation stops
  with a stable local error and gameplay uses reviewed text. It never switches
  provider, profile, style, or billing route automatically.

## Implementation approach

Add `apps/server/src/audio/voice-profiles.ts` as the sole provider-specific
profile registry and `apps/server/src/audio/cache-key.ts` as the deterministic
identity implementation. Provider details remain server-owned; manifests and
the browser see only stable profile IDs and opaque cache keys.

Migration 3 adds one mutable speech-asset row per cache key and append-only
generation attempts. The asset row moves through `PENDING`, `RUNNING`,
`REVIEW_REQUIRED`, `READY`, `REJECTED`, or `FAILED`. A `READY` row is immutable.
Attempts retain engine identity, timing, query/WAV hashes, and stable failure
codes without secrets or learner data. Server startup marks an interrupted
`RUNNING` row `FAILED` with `AUTHORING_INTERRUPTED`; it does not silently rerun
work.

`apps/server/src/audio/nemo-client.ts` uses Node's built-in `fetch` against the
fixed loopback URL. Before synthesis it verifies `/version`,
`/engine_manifest`, and `/speakers` against the exact selected profile. It then
calls `/audio_query` and `/synthesis`, preserves the unmodified query, and
rejects an unknown or mismatched style before synthesis. There is no provider
SDK and no engine process management.

`apps/server/src/audio/wav.ts` validates RIFF/WAVE, PCM format 1, one channel,
24000 Hz, 16-bit samples, a bounded data chunk, and a positive bounded duration
using Node buffers. Generation writes query and WAV to a cache-owned staging
file, validates and hashes them, then uses an atomic rename. A review decision
is required before the row becomes `READY`. Runtime resolution performs a DB
lookup and never derives an arbitrary filesystem path from an HTTP parameter.

The local API is closed and same-origin:

- enqueue an exact bounded list of manifest `AudioAsset` values and their
  lesson/revision provenance;
- explicitly start or retry the serialized local queue;
- list generation/review status;
- preview only `REVIEW_REQUIRED` or `READY` audio in the authoring UI;
- explicitly approve or reject one exact result;
- resolve only `READY` speech for gameplay by validated cache key; and
- explicitly purge generated speech after a typed confirmation.

The pre-game authoring surface shows the exact Japanese, Bunbun profile,
duration, hashes, state, failure reason, and credit. It contains one bounded M8
technical fixture so the pipeline is observable before final M9 dialogue is
authored. Approval promotes that newly generated artifact; qualification files
are never copied.

For `voice_aoi_01` and `voice_tanaka_01`, `apps/web/src/lesson/audio.ts`
preloads the same-origin ready WAV and decodes it through a native
`AudioContext`. One voice gain connects to the context destination and is the
future seam for the complete mixer. The port resumes only after the learner's
explicit play gesture, reports start only after the context is running and the
source starts, reports end once, and cancels fetch/source/context ownership on
stop or dispose. Hiding the document interrupts current speech exactly once and
returns the controller to its existing recoverable audio-failure path.

The old SpeechSynthesis factory remains isolated and is selected only for the
existing `voice_guide_01` technical fixtures. No Aoi or Tanaka path falls back
to it. The later complete-mixer plan can remove the compatibility adapter after
the production scenario and its regression replacement are manually accepted.

## Milestones

### 1. Accept and record the remaining O-010 speech boundary

Discuss this proposal. If accepted, record the stable profile, cache, local
generation, review, runtime fallback, cost, data, credit, and removal decision
in `docs/DECISIONS.md`; update this plan to Approved and align the affected
architecture, gameplay, performance, state, roadmap, and active showcase plan.

Observable checkpoint: repository documentation authorizes exactly one local
speech implementation and still leaves non-speech sources unselected.

### 2. Implement immutable identity and durable cache state

Add the code-owned profiles, canonical key function, migration 3, repository,
state transitions, interrupted-run recovery, bounded paths, purge behavior,
and unit/SQLite tests. Keep LessonManifest and CatalogSnapshot 0.1.0.

Observable checkpoint: identical exact inputs return the same key and one
idempotent row; every relevant input change produces a new key; migration
reopen and interrupted-state recovery pass.

### 3. Implement bounded local Nemo generation and review

Add the loopback client, exact identity checks, unchanged-query synthesis, WAV
validation, staging/atomic files, queue runner, HTTP endpoints, structured
errors, and authoring preview/approve/reject/retry UI. Do not auto-start or
download the engine.

Observable checkpoint: with the qualified engine manually running, the M8
fixture reaches `REVIEW_REQUIRED`; invalid style, mismatched identity, stopped
engine, malformed query, invalid WAV, timeout, and disk cap never create a
runtime-ready asset.

### 4. Register one newly generated technical WAV

Generate `財布を探してください。` afresh through `voice_aoi_01`, show its
exact metadata and credit, and wait for user listening approval. Only the
explicitly approved result becomes `READY`. Record its source inputs, query
hash, WAV hash, duration, and review time in SQLite and the plan; do not copy an
evaluation WAV.

Observable checkpoint: the same-origin gameplay endpoint serves the approved
technical WAV and rejects unapproved, rejected, missing, or traversal-like
keys.

### 5. Replace production-character browser speech with cached playback

Add cached preload/playback, voice gain, safe visibility interruption,
disposal, same-origin resolution, text fallback, diagnostics, and the M8 demo
selection. Preserve the legacy guide adapter only for old technical fixtures.

Observable checkpoint: the M8 fixture plays the approved Aoi WAV without a
request to port 50121, replay does not duplicate `heard`, and missing/failed
audio remains completable through visible text.

### 6. Verify and hand off the next M8 gate

Run supported non-browser checks, inspect the cache and HTTP boundary, update
durable records, and hand the manual browser/audio matrix to the user. Record
only actual user reports. Then prepare, but do not execute, the separate D-038
plan for exact ambience/effect/music sources and the complete mixer.

Observable checkpoint: the speech foundation is reproducible and removable,
the user has a concrete acceptance checklist, and Milestone 8 remains open for
non-speech audio.

## Progress

- [x] 2026-08-25 12:03 — Read the required product, architecture, gameplay,
      manifest, decisions, state, roadmap, performance, ExecPlan standard, and
      active showcase records; inspect the current audio port, runtime,
      compiler, capability gate, SQLite migrations, HTTP server, authoring UI,
      catalog, scripts, dependencies, and dirty worktree.
- [x] 2026-08-25 12:03 — Create this self-contained Proposed D-038 integration
      plan without adding a dependency, asset, profile registration, cache,
      engine call, or runtime change.
- [x] 2026-08-25 12:48 — User explicitly approved this exact plan with
      `DUYỆT PLAN M8 SPEECH CACHE`; record D-040 and begin implementation.
- [x] 2026-08-25 13:06 — Implement milestones 1 through 3: immutable profiles
      and exact cache identity, checksummed SQLite migration 3, durable queue/
      review/attempt state, bounded Nemo and WAV adapters, atomic ignored
      artifacts, same-origin HTTP boundary, authoring controls, privacy-safe
      inspector, and focused server tests.
- [x] 2026-08-25 13:10 — Generate the technical Aoi fixture afresh. Attempt 1
      failed closed at the initial engine-manifest response bound; explicit
      retry after the narrow bound correction produced an 83,500-byte, 1,739 ms
      valid WAV. It remains `REVIEW_REQUIRED`; no approval is inferred.
- [x] 2026-08-25 13:12 — Implement milestone 5: strict M8 fixture/capability
      registration, native cached preload/playback, voice gain, visibility
      interruption, disposal, visible credit, text fallback, and legacy-guide
      isolation. Aoi/Tanaka have no SpeechSynthesis fallback.
- [x] 2026-08-25 13:17 — Complete the supported automated portion of milestone 6. Schema drift, typecheck, lint, format, 87 tests, production build, diff
      hygiene, cache inspection, ready/review HTTP gating, and engine-stopped
      cache-state checks pass. Playwright is excluded and Docker is not
      applicable.
- [x] 2026-08-25 13:33 — Harden bounded response streaming, cache-space
      reservation, interrupted-attempt audit, immutable no-overwrite writes,
      query-plus-WAV approval integrity, purge cancellation, and full review
      metadata. Restart the local Bunbun server without Nemo and reconfirm the
      exact preview hash while the gameplay endpoint returns
      `SPEECH_ASSET_NOT_READY`.
- [ ] Receive the user's listening decision, then record `READY` or `REJECTED`
      and run the applicable manual cached-playback/fallback/regression matrix.

## Surprises and discoveries

- Nemo 0.24.0's `/engine_manifest` response is 754,265 bytes because it
  includes embedded metadata. The initial 256 KiB identity-response guard
  rejected the qualified engine before synthesis. Raise only that endpoint's
  bound to 1 MiB; keep the query and WAV limits unchanged.
- The root `inspect:audio -- --database <relative-path>` command initially
  inherited the npm workspace directory. Resolve explicit relative database
  paths against the repository root so inspection is stable without exposing
  paths in its JSON result.
- The existing `AudioPlaybackPort` and controller already protect the most
  important learning invariant: `heard` is emitted only after `onStart`, and
  replay uses an idempotent event identity.
- Catalog voice profiles are intentionally ID-only. Provider/model/style data
  can remain in a server-owned immutable registry without changing the shared
  schema.
- The current compiler always emits `voice_guide_01` and a technical
  `bunbun_tts_...` key. Migrating it to an Aoi/Tanaka production profile before
  M9 dialogue exists would misassign a character voice. This plan therefore
  preserves the guide compatibility path and proves cached playback with one
  separate Aoi technical fixture.
- The current visibility handler pauses lesson time but does not interrupt
  speech. Cached playback must explicitly report an interruption or the
  controller could remain in `PLAYING_AUDIO` after a stopped source.
- The server already has the correct ownership seam for SQLite and same-origin
  files, so no ORM, worker service, database, framework, SDK, or media library
  is justified.

## Plan decisions

- 2026-08-25 — Recommend character-owned immutable IDs `voice_aoi_01` and
  `voice_tanaka_01`; do not reuse either identity for the technical guide.
- 2026-08-25 — Recommend exact-string cache identity with no cache-layer text
  normalization. Japanese punctuation, whitespace, and Unicode byte changes
  may affect speech and therefore must invalidate the cache.
- 2026-08-25 — Recommend one code-owned, explicitly triggered in-process queue
  and server-owned SQLite/file cache instead of a background service or CLI
  process opening the database independently.
- 2026-08-25 — Recommend native browser audio for the new cached voice path and
  keep SpeechSynthesis only as a named legacy fixture adapter until M9 replaces
  its regression coverage.
- 2026-08-25 — Keep non-speech source intake and the complete mixer in a later
  D-038 plan. No sound source is selected by this speech plan.

## Validation

### Static and automated checks

Run from `/home/nunu/Desktop/nnlab/nn-bunbun` with the repository-pinned Node
24.18.0 and npm 11.16.0 after implementation:

1. `npm run schema:check`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run format:check`
5. `npm test`
6. Run the added server audio-cache inspector against a temporary database and
   the normal ignored database; confirm no path, secret, learner response, or
   provider credential is printed.
7. Start the already-qualified engine manually on `127.0.0.1:50121`, run the
   explicit M8 fixture generation once, and confirm identity, query, WAV, hash,
   review, approval, and ready-resolution checks.
8. Stop the engine and confirm the approved runtime WAV remains resolvable while
   a new generation request fails locally without fallback.
9. `npm run build`
10. `git diff --check`

No Playwright or automated browser E2E test is added or run under D-011.
Docker is not applicable because no Dockerfiles exist and D-015 remains active.

Actual implementation result on 2026-08-25:

- `schema:check`: pass, 56 generated files current;
- workspace typecheck, lint, format check, production build, and
  `git diff --check`: pass;
- tests: pass, 87/87 — contracts 41/41, server 9/9, web 37/37;
- M8 manifest inspection and shared runtime capability gate: pass;
- normal ignored database inspection: schema version 3, one
  `REVIEW_REQUIRED` row, no authored text, file path, learner response, secret,
  or credential printed;
- WAV validation: pass, 24 kHz 16-bit mono PCM, 83,500 bytes, 1,739 ms;
- unreviewed gameplay resolution: correctly rejected; preview resolution:
  available only through the authoring endpoint;
- qualified Nemo engine: stopped after generation; no listener remains on
  port 50121; and
- production web build: pass with the existing large-chunk warning, 1,301.39
  kB JavaScript / 361.11 kB gzip and 14.70 kB CSS / 3.81 kB gzip.

Ready resolution with the real WAV and engine-stopped browser playback remain
pending because only the user may approve the reviewed artifact. The HTTP and
service integration tests cover the same state boundary with isolated test
artifacts.

### Manual happy path

1. Start the qualified Nemo engine with the documented process-local data path
   and open the Bunbun authoring home.
2. Enqueue the M8 speech fixture and explicitly start generation. Confirm the
   UI shows Aoi, exact Japanese, profile ID, review state, duration, hashes, and
   `VOICEVOX Nemo` credit.
3. Preview the newly generated WAV, verify that it says exactly
   `財布を探してください。`, and approve it.
4. Stop the Nemo engine, start the M8 technical lesson, click the audio button,
   and confirm the same approved voice plays from the Bunbun cache.
5. Replay, complete the lesson, reload, and resume. Confirm normal completion
   and one durable `heard` result.

### Manual edge cases

1. Try to play before approval, after rejection, with a missing cache file, and
   with `audioFailure=1`. Confirm visible Japanese/support remains available,
   no `heard` is claimed, and the lesson can continue assisted.
2. Stop the engine before generation, return a mismatched engine/profile/style
   in a test double, and retry an interrupted run. Confirm stable local errors,
   no cloud fallback, no ready file, and no silent rerun after restart.
3. Rapidly click generate, approve, replay, and lesson audio. Confirm one
   serialized generation, one active playback source, one terminal callback,
   and no duplicate evidence.
4. Hide and restore the tab during preload and playback. Confirm the active
   source is safely interrupted, text fallback appears, replay remains
   possible, and no stale overlapping voice survives.
5. Supply an unknown, malformed, too-long, conflicting, or traversal-like
   cache key/input through the local API. Confirm deterministic rejection and
   no filesystem escape.
6. Reach the 512 MiB cache guard with test metadata rather than large real
   files. Confirm new work stops without deleting ready assets.
7. Invoke cache removal and cancel, then confirm nothing changes. Invoke it with
   the exact confirmation and confirm only generated speech rows/files are
   removed; lessons and learning evidence remain.

### Manual regression

1. Play the existing authored eight-primitive demo and one published M7
   technical lesson. Confirm `voice_guide_01` retains its explicitly legacy
   behavior and the rest of the lesson/persistence flow is unchanged.
2. Repeat correct, wrong, assisted, replay, restart, reload, and resume paths;
   confirm checkpoint and evidence identities are unchanged.
3. Force WebGL2, resize, background/resume, and dispose/re-enter the scene;
   confirm no audio source or context leaks and world input remains isolated
   from authoring/audio controls.
4. Inspect network requests during cached Aoi playback. Confirm no request to
   `50121`, OpenAI, AWS, Aivis, Kokoro, or any external host.
5. Confirm the repository and build contain no Nemo engine/model/evaluation WAV,
   SDK, credential, Docker, Playwright, or non-speech third-party asset.

### Manual results

| Scenario                              | Tester       | Date       | Result  | Evidence or notes                             |
| ------------------------------------- | ------------ | ---------- | ------- | --------------------------------------------- |
| Generate and review M8 speech fixture | Codex + user | 2026-08-25 | Partial | Generation passed; listening decision pending |
| Cached playback with engine stopped   | Pending      | Pending    | Not run | Requires approved WAV                         |
| Missing/interrupted/rejected fallback | Pending      | Pending    | Not run | Awaiting user browser check                   |
| Replay, reload, resume, and evidence  | Pending      | Pending    | Not run | Awaiting user browser check                   |
| Legacy M4–M7 audio regression         | Pending      | Pending    | Not run | Awaiting user browser check                   |

## Recovery and compatibility

Migration 3 is forward-only and checksummed; it is never edited or removed
after application. Old databases migrate in place. Old manifests, catalogs,
lesson revisions, sessions, events, and `voice_guide_01` remain readable. The
new Aoi/Tanaka cache-key algorithm applies only to the new immutable profiles.

Enqueue is idempotent by cache key. A partial write remains staging-only and is
never served to gameplay. A failed or interrupted run retains a stable failure
record and needs explicit retry. A review rejection is terminal for that cache
row and cannot be changed into a ready file. Changed text, profile, engine,
model, style, dictionary, pronunciation override, policy, or output format
creates a new key.

Ready resolution first verifies the DB row and code-owned relative path, then
checks the file hash before serving if required by recovery evidence. HTTP
input never becomes a direct path. Missing files degrade to text and never
claim heard evidence.

The confirmed purge operation resolves the exact Bunbun audio-cache root,
refuses symlinks or paths outside it, removes only migration-3 speech rows and
generated cache files, and preserves migration history. Removing Nemo entirely
also requires stopping the exact engine and following the separate D-039
removal paths. Runtime then remains text-completable with no provider switch.

## Documentation updates

- Add the accepted successor decision to `docs/DECISIONS.md` only after user
  approval and narrow O-010 to the remaining non-speech/mixer work.
- Update `docs/BUNBUN_ARCHITECTURE.md`, `docs/GAMEPLAY.md`,
  `docs/LESSON_MANIFEST.md`, and `docs/PERFORMANCE.md` with implemented cache,
  playback, review, failure, and measured behavior.
- Update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `plans/README.md`, this
  plan, and `plans/2026-08-19-audio-complete-last-train-showcase.md` at every
  checkpoint.
- Extend `docs/audio-sources/VOICEVOX_NEMO_0.24.0.md` with production-capable
  authoring rules and record the newly generated technical fixture separately
  from qualification evidence.
- Document the exact manual engine-start and cache inspection/removal commands
  without adding a secret or application environment variable.

## Outcomes

The approved D-040 implementation checkpoint is complete and all supported
automated checks pass. One freshly generated Aoi WAV is intentionally held at
`REVIEW_REQUIRED`, so the plan remains open for the user's listening decision
and applicable manual browser/audio checks. Approval of this plan does not
authorize a different provider, dependency, model, non-speech asset, paid
fallback, or runtime engine call.
