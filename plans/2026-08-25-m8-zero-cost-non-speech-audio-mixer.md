# Deliver zero-cost non-speech audio and a native Web Audio mixer

Status: Complete — exact assets and native mixer manually accepted
Owner: Codex and user
Created: 2026-08-25
Last updated: 2026-08-27 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Complete the remaining Milestone 8 audio foundation without adding a paid
provider, account, credential, runtime service, npm dependency, or recurring
cost. A technical Bunbun lesson will play reviewed scene ambience, movement
and interaction effects, restrained musical stings, and the already accepted
cached Japanese speech through one learner-unlocked native Web Audio mixer.

The learner can independently control master, voice, ambience, effects, and
music. Speech has priority: ambience and music duck while Aoi or Tanaka speaks
and recover smoothly afterward. Missing or interrupted non-speech audio never
blocks Japanese text, lesson input, evidence, completion, or cached-speech
replay. Backgrounding, resuming, replaying, restarting, and disposing the game
must not leave overlapping or stale sources.

This plan is also the complete D-038 review record for the proposed non-speech
sources. Approval of the plan authorized only the exact bounded intake, human
listening gate, and gated implementation described here. It did not approve
another source, pack, paid option, account registration, dependency, model,
service, or final Milestone 9 production mix.

## Repository context

Milestone 7 is implementation-complete with its D-036 verification waiver.
D-039 qualifies VOICEVOX Nemo as a removable local speech-authoring tool.
D-040 and D-041 implement and accept immutable Aoi/Tanaka profiles, reviewed
same-origin speech playback, visible credit, replay, interruption, and text
fallback. The accepted technical Aoi WAV is `READY`, and the user's A/B/C
manual matrix passes without a runtime listener on the Nemo port.

The browser currently owns one `AudioContext`, one voice gain node, decoded
speech buffers, a single active speech source, and the legacy technical
SpeechSynthesis adapter. Scene definitions have no audio metadata. The lesson
runtime forwards presentation cue IDs only to the Three.js world, where three
technical cue IDs currently control highlights. There is no ambience, effects,
music, ducking, mixer UI, or non-speech asset registry.

The accepted architecture already places exact Japanese speech in
LessonManifest `AudioAsset`, scene ambience in code-owned scene metadata, and
effects or musical stings in code-owned presentation cue handlers. Therefore
this plan does not change LessonManifest, CatalogSnapshot, or
EvidencePersistence 0.1.0 and does not permit a manifest to carry a media URL,
file path, bus, gain, loop, or playback instruction.

## Approved source route

Use a deliberately small hybrid route:

1. qualify exact CC0 field recordings or source packs for rain, distant road,
   wet footsteps, cat reactions, low station rumble, object actions, and UI
   feedback;
2. generate the store room tone, original distant-station chime, tension pulse,
   and resolution sting from repository-owned deterministic PCM authoring code;
   and
3. use the browser's native Web Audio API for runtime decoding and mixing.

This route gives the natural layers real recorded texture while keeping the
musical identity and any potentially language-bearing station/store content
under project ownership. It avoids field recordings with intelligible speech,
brand jingles, recognizable station melodies, or personal information.

### Exact third-party intake candidates

These are qualified listening candidates, not selected runtime assets, until
the later exact hash-bound listening checkpoint is approved.

| Candidate                                                 | Exact proposed intake                                                | Purpose                                                | Published rights and cost                                              | Intake ceiling                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------- |
| OpenGameArt `Rain (loopable)` by Ylmir                    | `Rain OGG.zip`, four loopable recordings, 2.7 MB                     | choose one rainy-evening exterior loop                 | page marks CC0; USD 0                                                  | one archive; retain at most one runtime loop        |
| OpenGameArt `High traffic road sounds` by IgnasD          | `gatve Varniu.ogg`, 558.1 KB                                         | low distant street bed                                 | page marks CC0; USD 0                                                  | one file                                            |
| OpenGameArt `Step sound (walking)` by IgnasD              | `Ejimas1.zip`, 22.2 KB                                               | choose a short movement footstep source                | page marks CC0; USD 0                                                  | one archive; retain at most two short runtime files |
| OpenGameArt `Cat Purr & Meow` by Kerzoven                 | `cat_softmew.wav`, 218.6 KB, and `cat_purrsleepy_loop.wav`, 498.7 KB | Momo clue reaction and optional calm loop              | page marks CC0; USD 0                                                  | exactly two files                                   |
| OpenGameArt `underwater or space engine rumble` by gmason | `deep_rumble.ogg`, 553.8 KB                                          | heavily attenuated distant rail context with no speech | page marks CC0; USD 0                                                  | one file                                            |
| Kenney `Impact Sounds` 1.0                                | official pack, 130 files                                             | audition object pickup, drop/give, and clue impacts    | official page marks CC0 and offers free download; donation is optional | one archive; retain at most four runtime files      |
| Kenney `Interface Sounds` 1.0                             | official pack, 100 files                                             | audition correct, incorrect, and neutral UI feedback   | official page marks CC0 and offers free download; donation is optional | one archive; retain at most three runtime files     |

Canonical source pages:

- https://opengameart.org/content/rain-loopable
- https://opengameart.org/content/high-traffic-road-sounds
- https://opengameart.org/content/step-sound-walking
- https://opengameart.org/content/cat-purr-meow
- https://opengameart.org/content/underwater-or-space-engine-rumble
- https://kenney.nl/assets/impact-sounds
- https://kenney.nl/assets/interface-sounds
- https://creativecommons.org/publicdomain/zero/1.0/

CC0 permits copying, modification, distribution, and commercial use without
permission to the extent covered by the dedication. It does not waive patent,
trademark, publicity, privacy, or other third-party rights and supplies no
warranty. Bunbun will therefore retain source evidence and still reject any
candidate containing intelligible bystander speech, a brand identifier,
recognizable protected melody, personal information, suspicious provenance,
or an audio quality problem. Voluntary source credits will remain visible even
where attribution is not legally required.

### Repository-authored audio

A small dependency-free Node authoring script will deterministically emit
16-bit PCM WAV files from reviewed numeric parameters. It will not run in the
browser or production build and will not sample a third-party instrument,
soundfont, ROM, song, melody, or model.

The first exact authored identities are:

- `amb_store_hum_01` — restrained electrical/ventilation room tone without
  people, speech, advertising, or a real store recording;
- `cue_station_chime_01` — an original two-tone cue that does not reproduce a
  real railway melody;
- `music_tension_pulse_01` — a short low-volume urgency pulse; and
- `music_resolution_sting_01` — a short original resolution cadence.

The script source, parameter JSON, generated WAV hashes, duration, sample rate,
channel count, and peak level will be tracked together. The user must hear and
approve all four files. Rejection returns the affected role to this plan's
source gate; it does not authorize an automatic replacement from a music or
sample library.

## D-038 cost, account, data, and operational boundary

### Cost

- Expected third-party usage cost: USD 0.
- Expected recurring cost: USD 0.
- Worst-case authorized cost: USD 0.
- No free tier, trial, credit, subscription add-on, donation, paid Kenney
  all-in-one bundle, paid LEGIT Audio pack, marketplace purchase, or metered
  service is authorized.
- If any exact download presents a price, checkout, credit requirement, or
  changed non-CC0 license, stop before downloading and report the change.

### Accounts, credentials, and configuration

- No account or registration is authorized.
- No API key, cookie transfer, token, SDK, environment variable, browser
  extension, system service, Docker image, or package-manager installation is
  authorized.
- The proposed official pages expose public download links. If a site requires
  sign-in at intake time, stop; do not register or reuse an unrelated account.
- Freesound is not part of the primary route because its official FAQ requires
  a registered login to download source files. Its exact CC0 recordings remain
  a separately reviewable fallback only.

### Data flow and privacy

During approved manual intake, the developer browser or download command sends
only the ordinary HTTPS request metadata needed to retrieve the exact public
source pages and files. No learner target, Japanese line, compiled lesson,
evidence, checkpoint, local file, voice recording, secret, or Bunbun database
content leaves the machine.

After intake, all runtime files are bundled and fetched only from Bunbun's
same-origin static application boundary. Gameplay makes no request to Kenney,
OpenGameArt, Freesound, a model, TTS engine, analytics service, or remote audio
host.

### Storage and limits

Approved candidate downloads first enter ignored local staging under
`.bunbun-data/audio-intake/non-speech/v1/`. Each HTTP result must be a named
exact file, at most 64 MiB compressed. Archive inspection rejects absolute
paths, parent traversal, symlinks, executables, nested archives, more than 512
members, or more than 256 MiB expanded content. The total staging set may not
exceed 256 MiB.

Only user-approved individual runtime files cross into Git. The first tracked
non-speech set targets at most 6 MiB encoded in total and at most 1.5 MiB for
the first-interaction preload set. Actual values must be recorded; a miss
requires review rather than silent budget expansion.

### Source and credit record

For every candidate, record:

- canonical page URL, asset title, author, publication/update data, and
  observed download date;
- exact displayed license and retained CC0 legal/deed URL;
- source filename, byte size, media magic, SHA-256, duration, sample rate,
  bit depth or bitrate, and channel count;
- archive member path where applicable;
- whether the runtime file is unchanged or processed;
- processing command, inputs, output hash, peak level, and loop observations;
- application asset ID, bus, source credit, and user approval state; and
- rejection reason for every inspected candidate that does not ship.

The runtime credits surface will list title, author, source, and `CC0 1.0` for
third-party audio plus `Bunbun project-authored audio` for the four generated
files.

### Fallback and removal

If all third-party candidates for a role fail, keep that non-speech role
unavailable and preserve the playable text/cached-speech path while a new
D-038 plan is prepared. Do not silently substitute Freesound, another OGA
submission, a paid library, a browser voice, or generated model audio.

Removal is local and non-destructive to evidence:

1. remove the affected runtime file and its code-owned registry entry;
2. remove its source record only from a new lesson revision while retaining
   historical provenance for any previously published revision;
3. remove ignored staging data through the explicit bounded intake-cleanup
   command; and
4. fall back to text/cached speech or a reduced non-speech mix.

No account cancellation, remote deletion, credential rotation, SQLite
migration rollback, LessonManifest migration, or provider coordination is
required. A production lesson revision that requires the removed asset cannot
remain published as audio-complete; it must be replaced or withdrawn
explicitly.

## Alternatives considered

### Use Freesound CC0 recordings as the primary library

Not recommended for this slice. Freesound has strong exact recordings and
clear per-file Creative Commons labels, but its official FAQ says downloading
requires a registered account. Some attractive station/store recordings also
contain real speech or identifiable location context. The extra account,
privacy review, and speech screening are unnecessary for the initial mixer.

### Use only OpenGameArt/Kenney assets, including music

Viable but not recommended. It would reduce authoring code but broaden source
review and make Bunbun's narrative musical identity depend on another asset.
Project-authored short stings are small enough to own and review directly.

### Synthesize every sound in Bunbun

Zero-cost and account-free, but rain, footsteps, and animal sounds would be
noticeably less natural. The recommended hybrid route confines third-party
material to exact CC0 recordings while retaining project ownership where
synthetic sound is appropriate.

### Add an audio middleware library

Rejected for this slice. The existing Web Audio seam can provide gain buses,
buffer playback, loops, ducking, interruption, and disposal. A library would
add a dependency and D-038 review before measurements show a missing native
capability.

## Scope

### In scope

- The exact bounded candidate intake and human listening gate above.
- One code-owned non-speech asset registry with stable IDs, source record IDs,
  bus assignment, preload group, loop policy, and optional credit.
- Scene-owned ambience IDs in the existing code-owned scene definition.
- One code-owned presentation cue registry shared by visual and audio cue
  consumers.
- A native Web Audio graph with master, voice, ambience, effects, and music
  buses.
- Voice-priority ducking of ambience and music.
- Session-local learner controls for every bus and master mute. Settings do not
  enter localStorage or SQLite in this plan.
- Scene loop start/stop, one-shot cue playback, movement footsteps, speech
  replay, background interruption, resume, restart, and disposal.
- A local authoring/diagnostic preview for source review and mixer inspection.
- Credits, diagnostics, focused unit/integration tests, production build, and
  a user-operated browser/audio matrix.

### Out of scope

- Another TTS engine, final production dialogue, or changes to accepted Aoi
  and Tanaka speech profiles or cache artifacts.
- Final Milestone 9 asset choices or a claim that the technical mix is the
  finished last-train soundtrack.
- New LessonManifest, CatalogSnapshot, or EvidencePersistence fields or
  versions.
- Persisted audio preferences, cloud sync, remote asset CDN, service worker,
  streaming audio, microphone, speech recognition, realtime TTS, or runtime AI.
- Spatial/positional audio, convolution reverb, a general music sequencer,
  arbitrary manifest audio commands, or a general audio middleware layer.
- Downloading Freesound, another OGA submission, another Kenney pack, music
  library, sample pack, model, plugin, dependency, or authoring application.
- Docker, deployment, or automated browser E2E.

## Runtime design

### Mixer graph

Use one owned `AudioContext`:

    voice sources ----> voice gain -----------------------> master gain -> limiter -> destination
    ambience sources -> ambience user gain -> duck gain --^
    effects sources --> effects gain ---------------------^
    music sources ----> music user gain -> duck gain -----^

Initial review values are master `1.00`, voice `1.00`, ambience `0.35`,
effects `0.65`, and music `0.20`. Controls are clamped to `[0, 1]`; master
mute retains rather than overwrites the individual values.

While cached speech is active, ramp ambience to `25%` and music to `15%` of
their learner-set gains over 80 ms. Restore both over 250 ms after speech ends,
fails, is interrupted, or is stopped. Effects retain their learner gain, but
non-critical cue effects must not be scheduled over the opening of a spoken
line. A conservative native `DynamicsCompressorNode` acts only as peak safety;
it is not used to make the mix loud.

These are review defaults, not universal production mastering values. The
manual matrix may tune them only by updating this plan's recorded decision and
rerunning the listening checks.

### Asset and cue ownership

The non-speech asset registry owns static Vite-resolved URLs and metadata. The
scene definition lists ambience asset IDs only. A shared presentation cue
registry maps existing or later catalog cue IDs to fixed visual targets and
optional non-speech asset IDs. LessonManifest continues to reference only cue
IDs already present in CatalogSnapshot.

The first technical proof maps existing park cues without expanding the
manifest contract. M9 may add catalog cue IDs only through its own reviewed
lesson/world work.

### Loading and failure

The first required speech remains the highest preload priority. Scene
ambience and the first relevant effect may preload concurrently after package
validation but cannot delay the first Japanese stimulus. Later effects and
music load lazily from same-origin static URLs and are cached by the browser's
content-hashed build URL.

A missing, oversized, undecodable, or unregistered non-speech asset marks only
that asset unavailable, reports a privacy-safe diagnostic, and continues the
lesson. Missing required speech retains D-040's visible assisted text path and
never records heard evidence. No non-speech callback may dispatch a controller
answer, transition, or evidence event.

### Lifecycle

- The first explicit lesson audio action unlocks the shared context; there is
  no autoplay bypass.
- Starting a new speech source stops the prior speech source before ducking is
  applied to the new generation.
- Backgrounding interrupts speech through the accepted path, suspends the
  context, and remembers only desired ambience loops. Resume restarts loops
  safely; it does not replay a sting, effect, cue, or heard event.
- Restart stops all transient sources and rebuilds desired scene ambience from
  the fresh runtime state.
- Disposal aborts pending fetch/decode work, stops and disconnects every
  source and gain node, clears buffers, and closes the context once.

## Implementation milestones

### 0. Approve this plan — complete

The user reviewed and approved cost, rights, data, accounts, source list, mix
policy, fallback, and removal with `DUYỆT PLAN M8 NON-SPEECH + MIXER`.

Observable checkpoint: D-042 and this plan are accepted, while intake remains
ignored local data until the exact listening gate passes.

### 1. Qualify exact candidate files in ignored staging — complete

After approval, download only the seven exact candidate rows. Inspect archives
before extraction, calculate hashes and media facts, reject unsafe or changed
inputs, and generate a local text-and-audio review sheet. Generate the four
repository-authored WAV candidates from the reviewed deterministic script.

Observable checkpoint: ignored staging and a source ledger show every exact
candidate and technical result; no candidate is yet a tracked runtime asset.

### 2. Obtain exact listening approval — active

The user hears every proposed runtime file at normal and ducked levels. Record
approval or rejection against exact SHA-256 values. For Kenney packs, retain
only up to four impact and three interface files. Reject background speech,
brand audio, copied melody, noise, click, bad loop, excessive loudness, or an
unclear gameplay role.

Observable checkpoint: one immutable approved list names every runtime file,
hash, role, bus, and credit. Nothing unapproved crosses into Git.

### 3. Add the registry and native mixer

Copy only approved files, add the source/credit record, add deterministic
authored-audio generation and drift checks, refactor the existing speech seam
into the shared mixer, and implement gain controls, mute, ducking, preload,
failure isolation, diagnostics, and disposal without a new dependency.

Observable checkpoint: the audio preview plays each bus independently and
shows source, state, active source count, and current gains.

### 4. Integrate scene, cues, movement, and lifecycle

Attach technical ambience to `park_small`, route existing presentation cues to
the shared registry, emit bounded movement footsteps, and connect lesson
visibility/restart/disposal to the mixer. Preserve speech text fallback,
replay, evidence semantics, and Three.js/DOM input isolation.

Observable checkpoint: the technical cached-speech lesson demonstrates all
five buses, ducking, mute, cue effects, movement audio, interruption, resume,
and completion with the Nemo engine stopped.

### 5. Verify and hand off

Run source/hash drift checks, focused tests, schema check, typecheck, lint,
format check, all existing non-browser tests, production build, and diff
hygiene. Do not add Playwright. Do not run Docker under D-015. Hand off the
manual matrix below and record only user-supplied results.

Observable checkpoint: supported automated checks pass, every shipped file has
accepted provenance, actual audio/build budgets are recorded, and the user has
a reproducible browser checklist.

## Progress

- [x] 2026-08-25 14:58 — Read the accepted architecture, gameplay, manifest,
      decision, current-state, roadmap, performance, world, and parent showcase
      boundaries.
- [x] 2026-08-25 14:58 — Audit the current speech-only Web Audio seam, scene
      definition, presentation cue path, and preference contract.
- [x] 2026-08-25 14:58 — Compare official Kenney, OpenGameArt, Freesound, CC0,
      and project-authored routes through read-only research.
- [x] 2026-08-25 14:58 — Prepare this self-contained D-038 proposal without
      downloading or adding a third-party asset.
- [x] 2026-08-25 — User explicitly approved with
      `DUYỆT PLAN M8 NON-SPEECH + MIXER`.
- [x] 2026-08-25 15:25 — Qualify all seven exact source rows in ignored
      staging. Eight downloads total 6,223,378 bytes; four archives pass the
      bounded path/member/size/type inspection; 26 listening candidates and
      their retained source-page evidence pass byte/hash validation. Generate
      four deterministic authored WAVs and expose the complete local review
      catalog without registering any runtime asset.
- [x] 2026-08-25 — User supplied an exact 26/26 hash-bound decision: 16
      candidates approved and 10 rejected. The accepted record is
      `docs/audio-sources/M8_NON_SPEECH_APPROVAL_2026-08-25.json`.
- [x] 2026-08-27 — Promote only the 16 unchanged approved binaries. Runtime
      validation confirms every hash and byte count, rejects extras, and
      records 4,958,589 total bytes with a 925,841-byte first preload.
- [x] 2026-08-27 — Implement and statically verify the one-context five-bus
      mixer, speech ducking, scene ambience, cue/gameplay effects, music,
      controls, credits, diagnostics, failure isolation, and lifecycle.
- [x] 2026-08-27 — User reports `M8 MIX A: PASS` for the learner-unlocked
      happy path: scene ambience, Aoi speech priority and smooth duck/recovery,
      all five bus controls, mute, and replacement preview behavior.
- [x] 2026-08-27 — User reports `M8 MIX B: PASS` for all three closed
      non-speech failure routes. Missing rain, correct-feedback effect, or
      tension music remains visible in diagnostics while unaffected buses,
      cached speech, feedback, and lesson completion continue.
- [x] 2026-08-27 — User reports `M8 MIX C: PASS` under forced WebGL2.
      Backgrounded one-shots do not replay, only desired scene loops return,
      interrupted Aoi playback clears ducking, rapid replay retains one voice
      source without duplicate heard evidence, restart/reload leaves no stale
      sound or growing active-source count, credits remain visible, and a full
      reload resets session-local controls.
- [x] Obtain manual browser/audio acceptance.

## Surprises and discoveries

- The existing cached-speech implementation already owns the one
  `AudioContext` needed for the mixer; replacing it with middleware is not
  justified.
- EvidencePersistence preferences currently contain only resume behavior.
  Session-local mixer controls satisfy the accepted audio requirement without
  silently versioning that contract or adding browser storage.
- Freesound provides strong exact CC0 candidates, but its official FAQ requires
  account login for downloads. This makes it a worse first route under D-038
  than direct public CC0 intake.
- Real convenience-store and station recordings commonly contain speech,
  identifiable places, brands, or recognizable chimes. Project-authored store
  tone and station/music cues reduce both pedagogical masking and rights risk.
- CC0 is broad copyright permission, not a provenance guarantee or waiver of
  privacy, publicity, patent, or trademark rights. Exact human review remains
  necessary.
- The extracted walking source peaks at only -24.2 dBFS, while several raw
  Kenney/interface candidates peak near -1 dBFS. The review page therefore
  keeps Raw separate from the proposed bus gains; any later normalization or
  edit creates a new hash and requires a new listening decision.
- The deep-rumble candidate is 96 kHz stereo and 84.589 seconds. It remains a
  deliberately attenuated loop. The user approved its exact hash as distant
  rail; final interaction with rain/road and speech remains part of the manual
  browser mix checkpoint.
- The exact approved set is smaller than both plan ceilings without editing or
  normalizing a source: 4,958,589 encoded bytes total and 925,841 bytes in the
  first-interaction preload. Preserving bytes keeps the listening decision and
  runtime artifact identity aligned.

## Validation

### Static and automated checks

After implementation approval and work:

1. validate exact source ledger, archive boundaries, media magic, hashes, and
   generated-audio drift;
2. test duplicate/unknown registry IDs, bus assignment, preload groups, and
   cue mappings;
3. test one-context graph construction, gain clamping, mute retention, duck
   attack/release, interruption, replay replacement, failed decode, visibility,
   restart, and idempotent disposal with injected audio doubles;
4. test that non-speech failure cannot produce heard evidence, a controller
   transition, or a persistence write;
5. test same-origin static asset resolution and absence of remote runtime URLs;
6. run `npm run schema:check`;
7. run `npm run typecheck`;
8. run `npm run lint`;
9. run `npm run format:check`;
10. run `npm test`;
11. run `npm run build`; and
12. run `git diff --check`.

No automated browser E2E is added under D-011. Docker is not applicable under
D-015.

Implementation checkpoint on 2026-08-27: exact approval and runtime media
validators pass 16 approved files / 10 rejected candidates / 4,958,589 runtime
bytes; deterministic authored audio passes 2/2; schema drift, workspace
typecheck, lint, formatting, production build, and diff hygiene pass. All 96
workspace tests pass with the server loopback boundary enabled: contracts
41/41, server 9/9, and web 46/46. The restricted sandbox cannot bind
`127.0.0.1`; the server suite therefore required the documented unrestricted
loopback rerun and then passed 9/9. The web build reports 1,322,650 JavaScript
bytes (367.94 kB gzip), 16,253 CSS bytes (4.02 kB gzip), all 4,958,589 media
bytes, and the existing large-chunk warning. These checks do not replace the
manual audio matrix.

### Manual source listening gate

For each exact candidate:

1. verify the local review sheet title, author, source URL, CC0 label, filename,
   SHA-256, duration, format, and role;
2. listen through headphones and speakers at raw, normal-mix, and ducked level;
3. reject clipping, DC offset, harsh loop seams, intelligible speech, brand
   identity, recognizable melody, irrelevant foreground events, or mismatch
   with the rainy Japanese-neighborhood scene;
4. compare every Kenney alternative for its one declared role and approve no
   more than the bounded count; and
5. approve the exact file hash or record a rejection. Approval of a title or
   source page alone is insufficient.

### Manual happy path

1. Start the cached-speech technical lesson with the Nemo engine stopped.
2. Unlock audio once and confirm scene ambience starts without delaying or
   masking the first Japanese line.
3. Confirm speech ducks ambience and music, then both recover smoothly.
4. Trigger movement, object/cue, feedback, animal, station, tension, and
   resolution roles through the preview or technical lesson.
5. Adjust and mute each bus independently; captions, replay, interaction, and
   completion remain available.
6. Confirm the credits view lists every accepted third-party and project-owned
   audio source.

### Manual edge cases

1. Block the initial audio unlock, then retry from a learner gesture.
2. Simulate one missing ambience, effect, and music file separately with
   `?nonSpeechFailure=ambience`, `effects`, or `music`; use the existing
   `?audioFailure=1` route for required speech. Confirm the affected ID appears
   in audio diagnostics while the lesson remains usable.
3. Replay speech rapidly and confirm no overlapping voice or stuck ducking.
4. Background during voice, ambience, effect, and music; resume and confirm no
   stale one-shot or duplicate heard evidence.
5. Set every bus to zero, use master mute/unmute, and confirm retained values.
6. Restart and leave/re-enter the lesson repeatedly; active source count and
   decoded buffers do not grow without bound.

### Manual regression

1. Repeat D-040 A/B/C cached-speech checks.
2. Repeat current WebGPU/WebGL2, resize, scene retry, and context-loss checks.
3. Confirm audio controls never trigger canvas picking or steal Japanese form
   focus unexpectedly.
4. Confirm the authoring page still previews/reviews immutable speech and the
   accepted Aoi artifact remains `READY`.
5. Confirm no browser/runtime call reaches Nemo, Kenney, OpenGameArt,
   Freesound, or any paid provider.

## Acceptance evidence to record

- Exact approved source/runtime hashes and listening decisions.
- Encoded bytes by ambience/effects/music, first-preload bytes, decode times,
  audio unlock latency, first-voice latency, and maximum simultaneous sources.
- Duck attack/release observations and whether speech remains intelligible.
- User-reported happy-path, edge-case, and regression results.
- Web build size and the existing renderer diagnostics during the audio matrix.

No result is inferred from source inspection, automated tests, or plan
approval alone.

## Recovery and compatibility

Existing cached speech, the legacy `voice_guide_01` fixtures, lesson packages,
evidence, and SQLite migrations remain compatible. Non-speech registry entries
are code-owned and content-addressed by the production build. A changed source
file, generated-audio parameter set, mix mapping, or cue mapping creates a new
runtime asset identity or lesson revision rather than mutating a published
audio-complete lesson.

If implementation fails before registry activation, remove only the new
untracked/ignored intake and mixer changes and retain D-040 speech playback. If
one optional runtime asset fails later, disable that asset and continue the
text/cached-speech lesson while exposing a diagnostic. Never edit or delete the
accepted Aoi WAV, migration history, learning evidence, or published lesson
revision as a cleanup shortcut.

## Documentation updates after approval or implementation

- Change D-042 and this plan from `Proposed` only after explicit user approval.
- Add the exact source/hash/license ledger after candidate intake.
- Update `docs/BUNBUN_ARCHITECTURE.md` and `docs/GAMEPLAY.md` with the
  implemented mixer and lifecycle boundary.
- Update `docs/PERFORMANCE.md` with actual asset and runtime observations.
- Update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `plans/README.md`, and the
  parent showcase plan after every accepted checkpoint.

## Outcomes

D-042 and this plan are approved, and D-043 records the second exact listening
gate. Sixteen unchanged approved binaries are tracked in the Vite runtime; ten
rejected alternatives remain outside it. The code-owned registry and runtime
checker bind the tracked set to the accepted hashes, roles, buses, rights, and
byte counts. One learner-unlocked native mixer now owns cached voice,
rain/road/rail ambience, bounded gameplay/cue effects, restrained music,
session controls, ducking, diagnostics, and lifecycle without a new dependency
or cost. Static, unit, type, lint, hash, and production-build checks pass. The
user's `M8 MIX A/B/C: PASS` results complete the planned qualitative browser/
audio matrix and close this focused plan. No numeric latency, frame, memory,
source-growth, device, or loudness baseline is inferred from those reports.
