# Qualify VOICEVOX Nemo for cached Japanese speech

Status: Complete — QUALIFIED
Owner: Codex and user
Created: 2026-08-25
Last updated: 2026-08-25 11:43 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Qualify or reject one zero-incremental-cost local Japanese TTS candidate before
Bunbun implements its Milestone 8 audio cache and mixer. The candidate is the
official VOICEVOX Nemo Engine 0.24.0 Linux CPU x64 release. The user will hear a
small fixed Japanese evaluation set, compare the available character-less
voices, and decide whether two of them are suitable for Aoi and Tanaka.

Passing this plan does not yet make the evaluation files production assets. It
produces measured pronunciation, voice-fit, offline, disk, generation-time,
license, and removal evidence that can safely resolve the remaining production
voice decision. No TTS call occurs during gameplay, no cloud provider or paid
API is introduced, and no AivisSpeech, Kokoro, or other fallback is downloaded
in parallel.

## Repository context

Milestone 7 is implemented and closed under D-036. Milestone 8 is next. The
browser currently creates the temporary Web Speech adapter in
`apps/web/src/lesson/audio.ts` and activates it from
`apps/web/src/lesson/runtime.ts`. `LessonManifest` 0.1.0 already carries exact
Japanese `textJa`, a `voiceProfileId`, a deterministic `cacheKey`, and optional
`durationMs`. The catalog's voice profile is currently only a stable ID. The
compiler creates one technical `voice_guide_01` audio entry. There is no
production audio registry, file cache, metadata table, generation queue, mix
bus, or production voice asset.

The ignored `.bunbun-data/` directory already owns local SQLite state and is
the only proposed location for candidate binaries and evaluation output. The
host is Linux x86_64 and already has `/usr/bin/7z`; qualification therefore
does not require a new package manager, system dependency, Docker image, GPU,
CUDA, account, key, secret, or environment variable.

This focused qualification is a prerequisite inside the broader approved
`plans/2026-08-19-audio-complete-last-train-showcase.md` plan. It does not
authorize the complete M8 runtime implementation.

## Scope

### In scope

- Intake only the official stable VOICEVOX Nemo Engine `0.24.0` Linux CPU x64
  archive from the project's GitHub release.
- Verify the published archive SHA-256 before extraction and retain a concise
  repository-owned source, license, version, and processing record.
- Extract the candidate only to the ignored local path
  `.bunbun-data/vendor/voicevox-nemo/0.24.0/`.
- Run the official engine as a separate loopback-only HTTP process on its
  default `127.0.0.1:50121` boundary.
- Confirm `/version`, `/speakers`, `/audio_query`, and `/synthesis` behavior
  without adding an SDK or application integration.
- Generate a bounded two-stage evaluation set: four anchor utterances for all
  reported Nemo voices, then the complete twelve-utterance set for only the
  user-selected female and male finalists.
- Preserve the unmodified WAV output and a deterministic evaluation manifest
  under `.bunbun-data/audio-evaluation/voicevox-nemo-0.24.0/`.
- Record engine-reported voice UUID/style IDs, exact query parameters, exact
  Japanese text, WAV hashes, durations, generation times, total disk use, and
  user pronunciation/voice-fit results.
- Confirm that synthesis continues after the initial official download when
  the machine has no usable external network path.
- Decide `QUALIFIED`, `REJECTED`, or `INCONCLUSIVE`; only `QUALIFIED` permits a
  later M8 implementation decision to map stable Bunbun voice profiles.

### Out of scope

- Adding VOICEVOX binaries, models, generated WAV files, or copied third-party
  license text to Git-tracked product assets.
- Redistributing or bundling the engine, core, model, editor, or archive with
  Bunbun.
- Runtime TTS, browser-to-engine calls, public HTTP binding, remote access,
  server deployment, Docker, GPU/CUDA, or concurrent synthesis service work.
- Selecting final `voiceProfileId` values before the user hears the evaluation.
- Implementing the SQLite audio metadata migration, generation queue, cache
  resolver, Web Audio mixer, ambience, effects, music, or production credits
  screen.
- Voice cloning, model training, fine-tuning, morphing, imitation of a real
  person, or use of any Nemo output for machine learning.
- Downloading AivisSpeech, Kokoro, MeloTTS, Open JTalk voices, COEIROINK,
  Style-Bert-VITS2, sound effects, ambience, or music.

## Decisions and constraints

- D-026 requires two consistent non-cloned Japanese NPC voices, reviewed exact
  speech, offline gameplay, captions, replay, and recoverable text fallback.
- D-037 excludes Amazon Polly, AWS accounts, credentials, SDKs, and billing.
- D-038 requires a self-contained approved plan before this third-party
  download and constrains the first route to zero incremental usage and
  recurring cost.
- D-039 records the user's approved candidate order: qualify VOICEVOX Nemo
  first; consider AivisSpeech only after an explicit Nemo rejection; retain
  Kokoro as a later licensing-oriented fallback.
- The official Nemo page describes nine character-less voices and supports
  Windows, macOS, and Linux. The Nemo output terms allow commercial and
  non-commercial use only with credit and prohibit machine-learning use.
- VOICEVOX Nemo Engine is a separate HTTP engine. Its official repository
  states that its default port is `50121` and that the remaining API follows
  VOICEVOX Engine. Engine source is dual-licensed under LGPL-3.0 and an
  alternative license; the prebuilt core has its own terms. Bunbun avoids the
  redistribution question in this qualification by treating the official
  engine as a removable local authoring tool and retaining only generated test
  WAV files outside Git.
- Pin the stable `0.24.0` release. Do not use `0.25.0-dev`,
  `0.26.0-preview.0`, an unversioned `latest` Docker tag, or the ordinary
  VOICEVOX engine.
- The official release lists
  `voicevox_engine-linux-cpu-x64-0.24.0.7z.001` at approximately 130 MB with
  SHA-256
  `c2af9ddf42dd28f55e831f0e76f605321daaec981dda3c8be558c734dc6830e7`,
  and its VVPP alternative at approximately 150 MB. This plan uses the engine
  archive, not VVPP. Reconfirm the name and hash on the official release before
  intake. Extracted size must be measured rather than inferred; reserve at most
  2 GB of ignored local disk for the complete spike and stop before exceeding
  that bound.
- Expected monetary cost is USD 0. Worst-case usage and recurring monetary
  cost is USD 0 because there is no account, subscription, metered endpoint,
  paid tier, purchase, or automatic fallback. Optional donations and paid
  voice-actor work are outside this plan.
- Initial network flow is one user-approved download from the official GitHub
  release. Synthesis sends only the fixed project-authored evaluation text over
  loopback to `127.0.0.1`; no learner input or personal data leaves the host.
- No environment-variable name is introduced. The engine path, release,
  checksum, and loopback address are explicit qualification inputs.
- Credit acceptance is part of the gate. If qualified and later shipped,
  Bunbun must visibly include `VOICEVOX Nemo` in product credits and retain the
  exact terms URL and access date in its source record.

Official sources to re-check immediately before download:

- `https://voicevox.hiroshiba.jp/nemo/`
- `https://voicevox.hiroshiba.jp/nemo/term/`
- `https://github.com/VOICEVOX/voicevox_nemo_engine`
- `https://github.com/VOICEVOX/voicevox_nemo_engine/releases/tag/0.24.0`
- `https://github.com/VOICEVOX/voicevox_nemo_engine/blob/master/LICENSE`

## Implementation approach

Qualification remains isolated from Bunbun application code. After explicit
approval, download the one pinned archive into a temporary intake directory,
verify the exact published SHA-256, and extract it to the exact ignored vendor
path. Start the engine with an explicit loopback host and port. Reject any
startup configuration that exposes the port beyond loopback.

Query engine identity and `/speakers` instead of assuming style IDs. Store the
returned identity snapshot with the evaluation manifest. Create each
`/audio_query` from exact UTF-8 Japanese text, preserve the returned query, and
send it unchanged to `/synthesis` for the baseline. Do not silently tune pitch,
speed, intonation, pauses, or pronunciation during the first pass. If a reading
needs correction, preserve both baseline and reviewed override and record the
accent-query difference explicitly.

The four anchor utterances are:

1. `財布を探してください。`
2. `終電まであと三分です。`
3. `あっ、財布がありません！`
4. `田中さん、傘の下を見てください。`

Generate those anchors for every voice reported by the installed engine. The
user selects at most two female and two male finalists. Generate this complete
set only for those finalists:

1. `財布を探してください。`
2. `終電まであと三分です。`
3. `財布はどこですか。`
4. `駅へ急いでください。`
5. `ここで待ってください。`
6. `そこに入ってはいけません。`
7. `一緒に探しませんか。`
8. `電車に乗らなくてはいけません。`
9. `あっ、財布がありません！`
10. `田中さん、傘の下を見てください。`
11. `モモ、こっちです。`
12. `ありがとうございました。`

The evaluation records human observations separately from deterministic file
facts. It must not claim pronunciation or personality quality from hashes or
engine success alone. A later production cache will use an application-owned
identity over exact text, engine and model identity, voice UUID/style ID,
canonical synthesis parameters, pronunciation/accent override, user-dictionary
snapshot, output format, and sample rate. That cache and its proposed
`.bunbun-data/audio-cache/` location are not implemented by this qualification.

## Milestones

### 1. Reconfirm rights and intake the pinned engine

Re-open all official sources, record access date and any changed terms, resolve
the exact Linux CPU x64 asset and published SHA-256, download only that asset,
verify it, and measure compressed and extracted sizes. Stop if the terms,
release identity, hash, zero-cost boundary, or loopback operation differs from
this plan.

Observable checkpoint: the ignored local engine directory has one verified
source identity and Bunbun still has no tracked binary, model, WAV, SDK, key,
account, or environment variable.

### 2. Prove local API and offline synthesis

Start the engine on `127.0.0.1:50121`, record identity and speakers, generate
one anchor through `/audio_query` and `/synthesis`, stop external network
availability, and repeat generation. Capture duration, elapsed time, WAV
format, and process/resource observations.

Observable checkpoint: two valid local WAV files exist, including one created
offline, and the engine is not reachable through a non-loopback interface.

### 3. Run bounded voice and pronunciation evaluation

Generate the anchor matrix, let the user select finalists, generate the full
matrix for those finalists, and collect explicit per-line pronunciation,
clarity, personality fit, and fatigue observations.

Observable checkpoint: the user can name acceptable Aoi and Tanaka candidates
or explain why Nemo is rejected.

### 4. Record qualification and cleanly hand off

Record `QUALIFIED`, `REJECTED`, or `INCONCLUSIVE`, measured cost/disk/runtime,
accepted credit text, exact voice identities if qualified, known pronunciation
overrides, and remaining M8 work. Update D-039, O-010, the roadmap, current
state, the active showcase plan, and this plan. Do not begin production
integration without the resulting decision.

Observable checkpoint: repository documentation alone explains whether M8 may
implement Nemo or must prepare the AivisSpeech fallback plan.

## Progress

- [x] 2026-08-25 08:45 — Completed read-only comparison and received user
      approval for the candidate order: Nemo first, AivisSpeech second, Kokoro as a
      later fallback.
- [x] 2026-08-25 08:45 — Confirmed the dedicated Nemo engine, stable 0.24.0
      Linux CPU x64 release, default port 50121, host x86_64, and existing system
      7z support without downloading anything.
- [x] 2026-08-25 09:04 — User explicitly approved the complete D-038 plan with
      `DUYỆT PLAN QUALIFY VOICEVOX NEMO`.
- [x] 2026-08-25 09:15 — Reconfirmed official terms and release, recovered from
      one corrupted concurrent transfer, verified the clean archive against the
      published SHA-256, extracted the engine, measured 316 MiB on disk, and added
      `docs/audio-sources/VOICEVOX_NEMO_0.24.0.md`.
- [x] 2026-08-25 09:14 — User explicitly confirmed the process-local
      `XDG_DATA_HOME` name and isolated
      `.bunbun-data/vendor/voicevox-nemo/user-data` value.
- [x] 2026-08-25 09:33 — Proved `/version`, `/speakers`, `/audio_query`, and
      `/synthesis` through a live engine bound only to `127.0.0.1:50121`.
      Generated 36 unchanged-baseline anchor WAV files for all nine reported
      voices and independently verified every query, WAV hash, sample rate, and
      listening-page control.
- [x] 2026-08-25 09:36 — Repeated one anchor in an isolated network namespace
      with only loopback, zero external routes, and a blocked external connection.
      The offline 24 kHz mono PCM WAV was byte-identical to its online-baseline
      counterpart. The engine was stopped after the check.
- [x] 2026-08-25 10:38 — The user shortlisted Aoi styles `10005` (Female 1)
      and `10006` (Female 6), plus Tanaka styles `10001` (Male 1) and `10000`
      (Male 2). Generated all twelve fixed lines for all four finalists: 48 valid
      WAV files with unchanged queries, verified identities, hashes, query JSON,
      24 kHz mono PCM format, and listening-page controls. The engine was stopped.
- [x] 2026-08-25 11:43 — The user explicitly approved `F6/M2`: Aoi uses
      Female 6 style `10006`, speaker UUID
      `3490c392-30be-44c2-8379-b77df27fa65e`; Tanaka uses Male 2 style `10000`,
      speaker UUID `7ecc7a17-1465-4b22-a3b5-842a110ff55e`. No line-specific
      pronunciation issue was reported with the approval.
- [x] 2026-08-25 11:43 — Recorded `QUALIFIED` for removable local authoring and
      reviewed cached-output generation only. Production integration, stable
      code-owned profile IDs, cache storage/invalidation, and non-speech assets
      remain later M8 work.

## Surprises and discoveries

- The earlier general research report cited the much larger ordinary VOICEVOX
  Linux package. Nemo has a distinct official engine and release stream; its
  stable Linux CPU x64 0.24.0 archive is 136,493,982 bytes and the extracted
  engine occupies 316 MiB.
- Nemo's engine default port is 50121, not the ordinary VOICEVOX Engine's 50021. The official Nemo Docker example remaps a different port, so this plan
  uses the repository's explicit default-port statement and verifies the live
  manifest before synthesis.
- The binary resolves its user-data directory before argument parsing and
  attempted to write `/home/nunu/.local/share/voicevox-nemo-engine`. The CLI
  has no user-data-directory flag. A process-local `XDG_DATA_HOME` override is
  the smallest way to keep all mutable qualification data in the approved
  ignored directory, but repository rules require explicit confirmation of
  that environment-variable name before use.
- The first transfer was still writing after the tool yielded, and a concurrent
  resume appended trailing data. Its hash failed and 7-Zip reported trailing
  bytes. The exact failed archive was removed; a clean single-process transfer
  matches the published hash and passes archive testing.
- The unchanged baseline produced 36 valid 24 kHz, 16-bit, mono PCM WAV files
  totaling 3,686,448 bytes. Synthesis took 471.1–982.5 ms per line, averaging
  711.1 ms, with an average realtime factor of 0.335 on this host. An observed
  post-generation process snapshot used 385,928 KiB RSS.
- A network-namespace run exposed only loopback and zero external routes. It
  generated the same anchor with SHA-256
  `1864116b23b6d6c7237c55de29e199eb76bfcb76ce1d14c2af6eca09a8150516`,
  exactly matching the normal loopback run.
- An unknown style ID is rejected without an output file, but engine 0.24.0
  reports HTTP 500 with an invalid-speaker core error rather than a 4xx response.

## Plan decisions

- 2026-08-25 — Qualify only VOICEVOX Nemo first to minimize download, disk,
  license, and evaluation work. AivisSpeech is conditional fallback work, not a
  second simultaneous experiment. See D-039.
- 2026-08-25 — Use the official stable CPU x64 engine archive outside Git,
  without Docker, SDKs, GPU dependencies, or bundling.
- 2026-08-25 — Do not assign final voice IDs until the user hears exact Bunbun
  lines; character fit is a manual product decision.
- 2026-08-25 — The user approved Aoi Female 6 (`10006`) and Tanaka Male 2
  (`10000`). The accepted credit remains `VOICEVOX Nemo`; no pronunciation
  override is currently recorded.

## Validation

### Static and automated checks

Run from `/home/nunu/Desktop/nnlab/nn-bunbun` after intake approval:

1. Verify the downloaded archive with `sha256sum` against the exact checksum
   published on the official 0.24.0 release.
2. Confirm the engine binds only to loopback with `ss -ltnp`.
3. Validate every WAV with existing system file inspection and hash each file;
   do not add an audio parsing dependency for the spike.
4. Validate the evaluation manifest with a small repository-owned Node script
   only if implementation evidence justifies creating one; otherwise retain a
   reviewed JSON record and avoid premature product tooling.

No Playwright test, production build, Docker build, application unit test, or
schema migration is relevant because this qualification must not change
runtime application code.

### Manual happy path

1. Start the pinned engine, generate the anchor and complete matrices, and play
   each file locally.
2. Confirm every Japanese line is understandable and matches the displayed
   text.
3. Confirm one female voice suits Aoi and one male voice suits Tanaka without
   cloning, real-person imitation, or character identity leakage.
4. Confirm the user accepts visible `VOICEVOX Nemo` product credit if these
   voices later ship.

### Manual edge cases

1. Generate `三分`, `財布`, `探してください`, the negative prohibition, and
   `なくてはいけません`; reject or explicitly override any wrong reading or
   unacceptable accent.
2. Stop the engine and confirm qualification tooling reports unavailability
   instead of falling back to a cloud endpoint.
3. Disable external network access after initial intake and confirm synthesis
   still succeeds.
4. Supply an unknown style ID and confirm the engine rejects it without
   producing a file that could be mistaken for accepted output.

### Manual regression

1. Confirm no generated or third-party file is Git-tracked.
2. Confirm ordinary authored-demo gameplay still uses the existing temporary
   browser adapter and no application request reaches port 50121.
3. Confirm no OpenAI, AWS, Aivis, or other provider account, key, endpoint,
   dependency, or fallback appears.

### Manual results

| Scenario                | Tester | Date       | Result | Evidence or notes                     |
| ----------------------- | ------ | ---------- | ------ | ------------------------------------- |
| Rights and intake       | Codex  | 2026-08-25 | Pass   | Pinned hash, terms, size, source file |
| Local/offline synthesis | Codex  | 2026-08-25 | Pass   | 36 anchors plus isolated offline WAV  |
| Aoi voice fit           | User   | 2026-08-25 | Pass   | Female 6 style 10006 approved         |
| Tanaka voice fit        | User   | 2026-08-25 | Pass   | Male 2 style 10000 approved           |
| Pronunciation matrix    | User   | 2026-08-25 | Pass   | Approved; no line issue reported      |
| Removal                 | Codex  | 2026-08-25 | Ready  | Exact isolated paths documented       |

## Recovery and compatibility

The candidate is isolated under two exact ignored directories. Rejection or a
partial intake is recovered by stopping the exact engine process and removing
only `.bunbun-data/vendor/voicevox-nemo/0.24.0/` and
`.bunbun-data/audio-evaluation/voicevox-nemo-0.24.0/` after resolving and
confirming those targets. No migration, manifest, published lesson, or browser
asset needs rollback because product code does not consume the candidate.

If the engine passes but one line fails, preserve the baseline and one reviewed
pronunciation override rather than silently changing all synthesis. If no two
voices pass, classify Nemo as rejected, remove the ignored local candidate,
and prepare a separate D-038 plan for AivisSpeech. Do not download the fallback
automatically.

## Documentation updates

- Add D-039 and update O-010 in `docs/DECISIONS.md` as qualification progresses.
- Update M8 in `docs/ROADMAP.md` and the media boundary in
  `docs/BUNBUN_ARCHITECTURE.md` without claiming integration.
- Keep `docs/CURRENT_STATE.md`, `plans/README.md`, the active showcase plan, and
  this plan synchronized.
- Add a focused source/intake record only after the approved official archive
  is actually resolved and verified.

## Outcomes

`QUALIFIED`: the pinned zero-cost candidate passed intake, loopback API, WAV
integrity, performance observation, invalid-style rejection, isolated offline
synthesis, anchor comparison, complete finalist generation, and explicit user
voice approval. Aoi maps to Nemo Female 6 style `10006`; Tanaka maps to Nemo
Male 2 style `10000`. Both use model version 0.15.0 and require visible
`VOICEVOX Nemo` credit. No pronunciation override is currently recorded.

Qualification does not make the ignored evaluation WAV files production
assets and does not integrate the engine into Bunbun. M8 may now propose stable
code-owned profile IDs, canonical cache identity, SQLite metadata, queued local
generation, reviewed production WAV intake, runtime asset resolution, and
fallback behavior. Gameplay must remain deterministic and must never call the
engine.
