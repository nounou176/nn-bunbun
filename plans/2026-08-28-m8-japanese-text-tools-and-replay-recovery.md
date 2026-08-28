# Recover speech replay and add local Japanese text study tools

Status: Approved
Owner: Codex and user
Created: 2026-08-28
Last updated: 2026-08-28 17:18 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

The M8 Last Train lesson must no longer fail when the learner replays a cached
Japanese utterance. Every Japanese learning-content block in the fixed M8
lesson should also expose a compact, collapsed study-tool row:

- `▶ / Nghe` plays an exact approved cached WAV when that text has one;
- `あ / Cách đọc` reveals authored kana/furigana and optional romaji;
- `語 / Từ vựng` reveals reviewed surface form, reading, part of speech, and a
  Vietnamese gloss when Bunbun owns one or an attributed English fallback;
- `文 / Ngữ pháp` reveals only reviewed patterns and concise explanations.

The ordinary game remains deterministic and local. It must never perform a
dictionary API, TTS, tokenizer, or LLM call while the lesson is running.
Japanese text without an approved WAV still receives reading and language
tools, but its play control is visibly unavailable rather than silently using
browser speech or inventing a character voice.

## Repository context

The fixed package lives in
`packages/contracts/fixtures/manifests/m8-last-train.json` and already owns six
reviewed learning targets, including readings, Vietnamese glosses, and two
grammar explanations. Its four approved Aoi/Tanaka utterances are hash-bound
under D-049. `apps/web/src/ui/shell.ts` currently renders instruction,
utterance, support, and authored hints as separate text blocks but offers only
one step-level audio button.

Manual testing on 2026-08-28 exposed a persistence failure after pressing
`もう一度聞く / Nghe lại` on `listen_aoi_request`:

    Event '<session>:listen_aoi_request:heard:<target>' was reused with
    different content.

The cause is concrete. `apps/web/src/lesson/events.ts` intentionally gives one
HEARD event per session, step, and target, while
`apps/web/src/lesson/controller.ts` emits that same semantic event on every
successful `AUDIO_STARTED`. The second event has a different `occurredAt` and
`activeLatencyMs`; `apps/server/src/persistence/repository.ts` correctly
rejects the reused ID because its full payload fingerprint changed. Immediate
replay therefore violates the invariant previously claimed by D-019, D-040,
and the M8 acceptance plans.

The existing `InMemoryEventSink` is insufficient as the fix because it filters
only after persistence and starts empty after reload/resume. The controller can
instead distinguish the first required playback, a successful replay, a
failure before playback started, and an interruption after playback started
without changing the persistence schema.

The project has no Japanese tokenizer, transliterator, downloadable dictionary,
or grammar corpus dependency. The sibling Bunpro extraction remains
research-only in the accepted M8 plans; its redistribution rights are not
documented. O-009 explicitly keeps production Japanese reference datasets and
licenses open.

This work is governed by D-011 (manual browser testing), D-015 (no Docker or
release work before a local release candidate), D-038 (review before any
third-party download/addition), D-040/D-049 (approved-only cached character
speech), D-050 (beginner support is evidence-honest), `docs/GAMEPLAY.md`,
`docs/LESSON_MANIFEST.md`, and `docs/BUNBUN_ARCHITECTURE.md`.

## Scope

### In scope

- Repair HEARD idempotency for first playback, replay, failure, interruption,
  reload, and resume without weakening the server's immutable-event check.
- Add a reusable, keyboard-accessible Japanese text study-tool component to
  the M8 Last Train overlay.
- Cover every Japanese instructional, utterance, authored-hint, and completion
  text unit displayed by the fixed nine-step M8 package with a reviewed local
  study record or an explicit unavailable state.
- Reuse the four exact D-049 audio assets; do not change their text, profile,
  cache key, SHA-256, or approval state.
- Create a versioned, hash-checked M8 study catalog keyed by the exact Japanese
  text fingerprint. The runtime loads only its reviewed output.
- Qualify two exact authoring-only npm candidates and one bounded dictionary
  data candidate after plan approval:
  - `kuromoji@0.1.2` for Japanese morphological segmentation, base forms,
    readings, pronunciation, conjugation, and part-of-speech proposals;
  - `wanakana@5.3.1` for deterministic kana-to-romaji proposals;
  - one English-without-examples JMdict-for-Yomitan snapshot as a candidate
    vocabulary-gloss source, retained first in ignored local staging.
- Retain all applicable license/notice files, source URLs, versions, hashes,
  byte counts, update obligations, and attribution copy.
- Add focused controller, catalog-validation, authoring-tool, and DOM-rendering
  tests plus a manual happy/edge/regression checklist.

### Out of scope

- Runtime dictionary, tokenizer, TTS, LLM, analytics, or other network calls.
- New Aoi/Tanaka utterances, a narrator voice, browser SpeechSynthesis fallback,
  pronunciation audio from Yomitan/Jisho/JapanesePod101/Wikimedia, or any other
  remote audio source.
- Importing the Yomitan browser extension or its GPL-3.0 application code.
- Shipping Sudachi/SudachiPy, MeCab, a Python/Java/Rust service, or a WASM NLP
  runtime.
- Copying or adapting Tae Kim's CC BY-NC-SA grammar guide, Bunpro content, the
  sibling research-only extraction, or another grammar corpus with unclear or
  noncommercial redistribution terms.
- Claiming that kuromoji or JMdict explains grammar. Grammar remains
  Bunbun-authored and reviewable.
- A Japanese-Vietnamese dictionary whose redistribution license has not been
  proven. Vietnamese explanations remain project-authored; qualified JMdict
  content is English fallback only.
- Automatic browser E2E, Playwright, Docker, hosting, staging, accounts,
  credentials, secrets, environment variables, OpenAI API, Amazon Polly, or a
  paid/free-tier service.

## Decisions and constraints

- Plan approval authorizes the replay fix, study-tool implementation, exact
  npm package intake, and one bounded ignored JMdict candidate download. It
  does not authorize promotion or shipment of JMdict-derived entries. A second
  exact `source + version/date + SHA-256 + license + selected entry` packet
  must be approved before generated JMdict data enters the repository/runtime.
- Expected and worst recurring provider cost are USD 0. The selected candidates
  require no account, credential, key, subscription, metered API, or remote
  runtime. The only external data transfer is the approved dependency/data
  download itself.
- The combined candidate download must stop above 128 MiB and ignored extracted
  staging must stop above 512 MiB. The generated M8 study catalog must stay
  below 256 KiB and no kuromoji dictionary files may enter the browser bundle.
- `kuromoji@0.1.2` is Apache-2.0, but its included
  `mecab-ipadic-2.7.0-20070801` data carries additional retained copyright,
  redistribution, and no-warranty notices. Both license families must ship
  with any distributed tool or data that requires them.
- `wanakana@5.3.1` is MIT. It transliterates known kana; it does not discover
  correct readings for arbitrary kanji and is never treated as a dictionary.
- JMdict data is CC BY-SA 4.0. Application use requires visible attribution,
  retained documentation/license links, and a regular update procedure. Its
  official license permits commercial use but its ShareAlike and update
  obligations apply to the data. Generated JMdict-derived records must remain
  separately attributable and licensed; Bunbun code is not re-licensed by
  implication. This is an engineering interpretation, not legal advice.
- The selected JMdict candidate contains English glosses. No Vietnamese JMdict
  release is assumed. Bunbun must label the fallback language and never present
  English data as a Vietnamese translation.
- A tokenizer or dictionary result is a proposal, not lesson truth. Every
  shipped M8 study record is reviewed, exact-text-bound, versioned, and
  validated before the runtime sees it.
- A play control is enabled only when exact text maps to an already approved
  `audioAssetId`. Disabled copy states `Chưa có âm thanh được duyệt`; it does
  not contact Nemo or another source.
- Study-tool use is help/scaffolding, not a meaningful reaction. Opening
  reading, vocabulary, or grammar marks subsequent assessed success assisted
  consistently with D-050. Merely replaying an already-heard WAV never creates
  a second HEARD event.
- Keep the server's existing fail-closed event fingerprint rule unchanged.

## Third-party qualification comparison

| Candidate                          | Role                                               | License/cost                                                                                                     | Decision for this plan                                                         |
| ---------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| kuromoji.js 0.1.2 + bundled IPADIC | Offline token/read/POS proposals in Node authoring | Apache-2.0 plus retained IPADIC/ICOT notices; USD 0                                                              | Bounded qualification selected; authoring-only                                 |
| WanaKana 5.3.1                     | Offline kana-to-romaji proposal                    | MIT; USD 0                                                                                                       | Bounded qualification selected; authoring-only                                 |
| JMdict English without examples    | Offline English vocabulary gloss candidate         | CC BY-SA 4.0; attribution and update procedure; USD 0                                                            | Ignored intake selected; promotion requires exact Gate 2 approval              |
| Yomitan application                | Complete popup dictionary extension                | GPL-3.0; optional audio can send terms remotely                                                                  | Rejected as an application dependency; its dictionary format is reference only |
| Sudachi/SudachiPy                  | Modern morphological analysis                      | Open source but adds Java/Python/Rust/dictionary operations and current upstream warns of breaking patch changes | Deferred; disproportionate for the M8 fixed slice                              |
| Tae Kim guide                      | Grammar explanations                               | CC BY-NC-SA                                                                                                      | Rejected for shipping; noncommercial/share-alike content constraint            |
| Bunpro extraction                  | Grammar/vocabulary research                        | Source redistribution rights not documented in this repository                                                   | Remains research-only; not copied or shipped                                   |

Primary research references:

- https://github.com/takuyaa/kuromoji.js/
- https://github.com/takuyaa/kuromoji.js/blob/master/NOTICE.md
- https://github.com/WaniKani/WanaKana/
- https://www.edrdg.org/edrdg/licence.html
- https://github.com/yomidevs/jmdict-yomitan
- https://github.com/yomidevs/yomitan
- https://guidetojapanese.org/learn/grammar

## Implementation approach

### Replay state semantics

Keep the stable HEARD event ID and immutable server behavior. For a LISTEN
step, the first `AUDIO_STARTED` from `AWAITING_AUDIO` records HEARD and enters
`PLAYING_AUDIO`. A later start from `AWAITING_CONTINUE` is a replay and does
not record HEARD unless the preceding attempt failed before playback ever
started. `AUDIO_FAILED` already receives the prior phase, so it can preserve
the distinction:

- failure from `AWAITING_AUDIO`: no HEARD exists; allow a successful retry to
  record the first HEARD;
- failure/interruption from `PLAYING_AUDIO`: HEARD already exists; recovery
  remains assisted but a replay must not record it again;
- resume from persisted `PLAYING_AUDIO` normalizes to `AWAITING_CONTINUE`, so
  the resumed replay is also evidence-free.

This uses existing `phase`, `audioFailed`, and `helpUsed` fields and requires no
EvidencePersistence schema or SQLite migration. Unit tests must prove all five
paths before browser handoff.

### Study catalog and authoring boundary

Add a small contract-owned `JapaneseTextStudyCatalog` schema/version rather
than embedding tokenizer output in DOM code. Each record is keyed by a stable
hash of exact `textJa` and contains:

- display reading in kana/furigana and optional romaji;
- reviewed vocabulary tokens with surface, base form, reading, part of speech,
  optional Bunbun Vietnamese gloss, optional attributed JMdict English gloss,
  and reference provenance;
- reviewed grammar notes with pattern, formation, Vietnamese explanation, and
  Bunbun reference provenance;
- optional already-approved `audioAssetId` whose registered text must match
  exactly.

An authoring script uses kuromoji/WanaKana only to propose records. It never
writes directly into an approved catalog. A deterministic validator checks
exact text identity, bounded lengths/counts, audio text equality, known target
references, provenance, and provider versions. The M8 catalog is then reviewed
and hash-approved like other content gates.

The web runtime imports only the compact approved catalog. It never imports
kuromoji, IPADIC, WanaKana, or full JMdict data. One small reusable renderer
attaches the four controls to registered Japanese learning-content blocks.
Panels are collapsed by default and mutually exclusive to avoid repeating the
beginner-overload problem D-050 just repaired.

### Vocabulary and grammar source policy

Use current manifest learning targets first because they already own verified
M8 readings, Vietnamese glosses, and grammar explanations. Kuromoji proposes
segmentation/readings for the surrounding sentence. JMdict may fill only an
English fallback after Gate 2. Grammar notes are curated from Bunbun-owned
target/reference content; neither morphological analysis nor dictionary glosses
are allowed to fabricate grammar explanations.

## Milestones

### 1. Repair replay without changing evidence contracts

Update the lesson controller and focused tests. Preserve the server's
different-payload rejection. Observable checkpoint: first listening records
one HEARD per assessed target, any number of replays succeeds, and reload or
background recovery never triggers `RUNTIME_LESSON_FAILED`.

### 2. Qualify authoring-only language candidates

After approval, install the exact pinned npm packages, retain their complete
license/notice material, inspect lockfile integrity and transitive production
dependencies, and prove that no dictionary code enters the web bundle. Download
one English-without-examples JMdict candidate only into ignored staging, stop
at the stated size limits, compute exact hashes, and produce the Gate 2 review
packet. Do not promote dictionary entries before the user approves that packet.

### 3. Add and populate the reviewed M8 study catalog

Add the small schema, validator, proposal script, project-authored M8 records,
and exact hash gate. Use current Bunbun target data immediately; add only
Gate-2-approved JMdict English fallbacks. Cover every Japanese text unit shown
by the fixed M8 package and mark missing audio explicitly.

### 4. Add compact Japanese text tools

Add the reusable DOM controls/panels, exact approved playback mapping, assisted
help semantics, focus/keyboard behavior, narrow layout, attribution/source
copy, and graceful missing-record/audio states. Do not obscure the 3D world or
make the lesson modal larger than necessary.

### 5. Verify and hand off manual acceptance

Run supported static/unit/integration/content/build checks, confirm dependency
and bundle boundaries, and hand the user a focused replay/study-tool A/B/C
matrix. Update durable decisions/specifications only for choices actually
approved and record only manual results the user reports.

## Progress

- [x] 2026-08-28 13:17 — Analyze both attached screenshots and reproduce the
      event-identity conflict from controller/event/repository code.
- [x] 2026-08-28 13:17 — Inspect existing M8 targets, approved speech rows,
      reference records, beginner guidance, persistence checkpoint, and current
      runtime presentation boundary.
- [x] 2026-08-28 13:17 — Research official kuromoji, WanaKana, EDRDG/JMdict,
      Yomitan, Sudachi, and Tae Kim sources without downloading or selecting a
      dependency.
- [x] 2026-08-28 13:17 — Prepare this D-038-compliant proposal. No package,
      dictionary, model, service, account, credential, or audio asset was
      downloaded, installed, or activated.
- [x] 2026-08-28 17:18 — User explicitly approves the plan with
      `UYỆT PLAN M8 JAPANESE TEXT TOOLS + REPLAY FIX`; the missing initial `D`
      is treated as an unambiguous typing omission in direct response to the
      exact requested approval phrase. D-051 records the approved boundary.
- [x] 2026-08-28 — Implement Milestone 1 replay recovery and add first play,
      replay, failure-before-start, interruption, resume, and server immutable-
      identity regression coverage.
- [x] 2026-08-28 — Qualify exact authoring-only dependencies, retain license/
      IPADIC notices, stage the bounded ignored JMdict candidate, and produce
      `docs/japanese-sources/M8_JAPANESE_REFERENCE_QUALIFICATION_2026-08-28.json`.
      Its exact Gate 2 packet SHA-256 is
      `4717468383091e73bcaacf09e8a94713bc68311a68ada87ce2db5b23531c17a9`;
      eight context-relevant rows are proposed and zero are promoted.
- [x] 2026-08-28 — Implement `JapaneseTextStudyCatalog 0.1.0`, cover 40/40
      fixed M8 Japanese text units, add compact audio/reading/vocabulary/
      grammar controls, and preserve assisted evidence semantics.
- [x] 2026-08-28 — Pass schema drift, catalog validation, typecheck, lint,
      contracts 46/46, server 9/9, web 66/66, production build, and runtime
      dependency scan. Kuromoji, WanaKana, IPADIC, and JMdict are absent from
      the web bundle. Playwright and Docker remain not applicable.
- [ ] Receive manual browser/gameplay acceptance.

## Surprises and discoveries

- The replay failure is not a speech-engine failure. The cached WAV starts,
  then persistence rejects a second differently timed copy of a stable HEARD
  event.
- The first M8 sentence already has one approved Aoi WAV and target-owned
  readings/glosses/grammar. The immediate feature does not need a remote
  dictionary to become useful.
- The sibling N5 extraction contains Bunpro-derived titles, meanings, and URLs.
  Existing plans correctly classify it as research-only; it cannot become a
  shipping grammar database without source-rights approval.
- JMdict solves vocabulary glosses, not grammar, and its official license adds
  attribution, ShareAlike-on-data, and regular-update obligations.
- WanaKana cannot infer kanji readings; it is only the final kana-to-romaji
  step after an authored or tokenizer-proposed reading exists.

## Plan decisions

- Accepted under D-051 on 2026-08-28 — Keep replay idempotency in the controller and preserve
  the server's fail-closed immutable-event fingerprint.
- Accepted under D-051 on 2026-08-28 — Keep all language analysis at authoring time and ship
  only a reviewed compact catalog to gameplay.
- Accepted under D-051 on 2026-08-28 — Qualify kuromoji and WanaKana as authoring-only tools;
  gate JMdict-derived data separately; keep grammar project-authored.

## Validation

### Static and automated checks

From `/home/nunu/Desktop/nnlab/nn-bunbun` with Node.js 24.18.0:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. focused controller tests for first play, immediate replay, failure-before-
   start retry, interruption-after-start replay, and reload/resume replay
5. focused contract/catalog/proposal tests for exact text, bounded records,
   provenance, missing data, wrong audio text, and rejected unknown fields
6. focused DOM tests for collapsed tools, single-open panel, keyboard labels,
   assisted semantics, approved/missing audio, and source attribution
7. `npm test`
8. `npm run schema:check`
9. `npm run lesson:m8:content-check`
10. `npm run lesson:m8:content-approval-check`
11. `npm run lesson:m8:speech-approval-check`
12. `npm run world:m8:runtime-check`
13. `npm run audio:m8:runtime-check`
14. `npm run build`
15. inspect build output and dependency graph to prove kuromoji/IPADIC, WanaKana,
    full JMdict, and Yomitan code are absent from runtime bundles
16. `git diff --check`

No Playwright is added or run under D-011. Docker is not applicable under
D-015 because Bunbun is not yet an accepted local release candidate and the
repository intentionally has no Dockerfiles.

### Manual happy path

1. Start the guided Last Train lesson from a fresh session.
2. Play Aoi's opening once, then replay it at least three times; speech plays
   each time, the lesson stays at step 1, and no fatal screen appears.
3. Open `Cách đọc`, `Từ vựng`, and `Ngữ pháp` on the opening sentence. Confirm
   one compact panel is open at a time and the data matches the exact sentence.
4. Continue through all nine steps. Confirm every Japanese learning-content
   block has its study-tool row and all four approved utterances play normally.
5. Complete the lesson and confirm evidence/completion persists.

### Manual edge cases

1. Reload/resume after the first successful Aoi playback, replay it, and verify
   no duplicate-event failure.
2. Background the tab during playback, return, and replay; recovery is assisted
   and does not duplicate HEARD evidence.
3. Simulate failure before audio starts, retry successfully, and verify the
   first HEARD evidence is recorded once.
4. Open tools rapidly and press play repeatedly; only one panel and one owned
   voice source remain active.
5. Open a Japanese text unit without approved audio; the play control explains
   unavailability and no SpeechSynthesis, Nemo, or network request occurs.
6. Open a text unit without a matching study record; gameplay remains usable,
   shows a bounded unavailable state, and does not guess content.
7. Confirm no English JMdict fallback is visible before its separate Gate 2 is
   approved.

### Manual regression

1. Guided and immersive support remain distinguishable; opening any language
   tool makes later assessed success assisted.
2. Wrong-answer scaffolds, deterministic correction, world movement, carry,
   GIVE, completion, resume, and local-data reset remain unchanged.
3. Cached speech hashes, VOICEVOX Nemo credit, audio mixer ducking, mute,
   background handling, and four approved utterances remain unchanged.
4. Technical park, cached-speech demo, neighborhood preview, automatic renderer,
   and forced WebGL2 paths still start.
5. Narrow and desktop layouts keep the 3D world dominant and controls usable.

### Manual results

| Scenario            | Tester  | Date       | Result  | Evidence or notes                                                                                            |
| ------------------- | ------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Pre-fix replay      | User    | 2026-08-28 | FAIL    | Second playback reused a stable HEARD ID with different timing payload and triggered `RUNTIME_LESSON_FAILED` |
| Replay recovery     | Pending | Pending    | Not run | Implementation and automated regression pass; awaiting user browser test                                     |
| Japanese text tools | Pending | Pending    | Not run | 40/40 reviewed records implemented; awaiting user browser test                                               |
| Regression matrix   | Pending | Pending    | Not run | Awaiting user browser test                                                                                   |

## Recovery and compatibility

The replay repair changes no database schema and no stored event. Existing
failed sessions remain recoverable: their last successful checkpoint resumes,
and the corrected controller stops resubmitting the acknowledged HEARD event.
The server continues rejecting a genuinely changed event payload.

All third-party inputs are removable. Delete the ignored intake and authoring
dependencies, regenerate without optional proposals, and the existing M8
package remains playable with its current authored support. The compact study
catalog is separately versioned and fails closed; its absence disables only
the new study panels, not lesson truth, evidence, world, or approved audio.

The JMdict candidate is not promoted automatically. If Gate 2 is rejected,
delete its ignored staging data and ship only Bunbun-authored Vietnamese and
reference content. If later accepted, its source version and attribution remain
visible and its update procedure must be run before release qualification.

## Documentation updates

- Add an accepted D-XXX record only after explicit plan approval.
- Update `docs/BUNBUN_ARCHITECTURE.md`, `docs/GAMEPLAY.md`, and
  `docs/LESSON_MANIFEST.md` with the authoring-only reference-data boundary and
  study-tool semantics after approval.
- Record exact third-party versions, hashes, licenses, notices, data scope, and
  update/removal procedure in the dedicated `docs/japanese-sources/` records.
- Update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, the parent M8 plan, and the
  beginner-recovery plan as implementation and manual results change.

## Outcomes

Implementation is complete and awaits manual browser acceptance. Replay no
longer resubmits acknowledged LISTEN HEARD events. The fixed M8 runtime has a
compact reviewed local study catalog and no runtime NLP/dictionary dependency.
JMdict remains unpromoted behind its exact Gate 2 packet.
