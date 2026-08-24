# Complete Milestone 7 through the reviewed file-import compiler

Status: Complete — implementation; verification waived under D-035/D-036
Owner: Codex and user
Created: 2026-08-20
Last updated: 2026-08-24 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Complete Milestone 7 through the selected M7 v3.2 strategy. The user will be
able to enter a small reviewed set of Japanese vocabulary and grammar targets
in Bunbun, explicitly export one privacy-disclosed authoring request, run the
installed `bunbun-authoring` Skill in a fresh supported ChatGPT/Codex
conversation, import the returned local JSON file, review the compiled lesson,
publish an immutable revision, and play it in the existing park runtime.

The application will make no provider call and require no API key. The
authoring transport remains human-triggered and recoverable: an unavailable
plugin leaves a durable request waiting for later import, while authored and
already published lessons remain playable without ChatGPT, Codex, a model, or
network access. Invalid, unsafe, incompatible, partial, or unreviewed output
never reaches gameplay.

This plan completes the technical compiler boundary and Milestone 7 exit
criteria. It does not implement the production neighborhood, production audio,
NPC personalities, arbitrary Japanese coverage, or direct ChatGPT-to-Bunbun
delivery.

## Repository context

Milestones 1 through 6 are complete. `packages/contracts` owns strict
LessonManifest 0.1.0, CatalogSnapshot 0.1.0, EvidencePersistence 0.1.0, their
semantic validators, and the authored park fixtures. `apps/web` can play one
statically imported eight-primitive lesson in `park_small`; it validates the
package and a web-owned capability allowlist before rendering. `apps/server`
uses `node:http`, one built-in Node SQLite database, checksummed forward
migrations, and local evidence/session endpoints. The existing
`lesson_revisions` table already stores immutable manifest/catalog packages,
but only when a play session begins; there is no compiler-owned publication or
lesson-library API.

D-031 and D-032 selected and implemented the repository-owned Skills-only
`bunbun-authoring@0.1.0` proof. D-033 classified it as conditionally viable:
ten runnable D-024 cases were accepted, one raw response was rejected for a
trailing JSON character, and four fixtures exposed request-contract gaps. The
missing inputs are compiler-owned practice text, accepted Japanese answer
truth, read-only runtime-plan fields, and meaningful attempt-2 repair context.
The application importer, compiler, request lifecycle, manifest normalizer,
and publication path do not exist.

The current authoring implementation is concentrated in
`packages/contracts/src/schema/authoring.ts`,
`packages/contracts/src/validation/authoring.ts`, the authoring scripts and
fixtures under `packages/contracts`, and
`plugins/bunbun-authoring/skills/bunbun-lesson-authoring`. The three exact
D-024 prompt fragments are approved at module version 0.1.0. Their behavior
already says that practice text, answer truth, attempts, and display durations
are code-owned; the packet failed to carry those fields. This plan therefore
versions the packet and protocol, not the three prompt modules.

The sibling `/home/nunu/Desktop/nnlab/bunbun/n5/extracted_lessons` corpus
contains useful Bunpro-derived research entries for `犬` and `猫`, but no local
redistribution license. D-026 already classifies that corpus as research input
only. The compiler must ship an independently reviewed, repository-owned
technical reference fixture and must not copy or claim the sibling corpus as a
licensed runtime source.

This plan is governed by D-001 through D-021 where applicable, D-023, D-024,
D-027, D-031, D-032, D-033, `docs/AI_MODULES.md`, `docs/M7_VARIANTS.md`,
`docs/LESSON_MANIFEST.md`, and `docs/GAMEPLAY.md`. D-011 excludes automated
browser E2E. D-015 excludes Docker and release work before a complete local
release candidate. The inactive M7 v1 proposal and M7 v2/v3.3 research do not
authorize provider, credential, extension, or MCP work here.

The repository worktree was clean when this proposed plan was prepared on
2026-08-20.

## Scope

### In scope

- Add LessonAuthoring packet/protocol 0.2.0 beside the frozen 0.1.0 proof so
  historical D-033 evidence remains reproducible.
- Add compiler-owned `practiceTextJa` and `acceptedResponsesJa` fields to every
  practice slot that needs them. The result may only echo accepted response
  text exactly; it cannot establish or mutate answer truth.
- Add `primitive`, `maximumAttempts`, and correct/incorrect/assisted
  `displayMs` values to coaching slots as read-only runtime-plan context.
- Add a closed repair context. Attempt 1 requires `repair: null`. Attempt 2
  requires a failure stage, the prior response SHA-256, a prior structured
  result when one exists, and bounded stable redacted diagnostics. JSON parse
  and structural failures explicitly use `priorResult: null`; no raw rejected
  response is embedded in a repair request.
- Add separate authored-fixture and learner-target data-policy variants. A
  learner request carries normalized target text only after an explicit export
  action and states that learner identity, progress, evidence, TYPE answers,
  checkpoints, secrets, and private chat history are excluded.
- Preserve `story_sheet@0.1.0`, `reverse_trainer@0.1.0`, and
  `story_coach@0.1.0` byte-for-byte with their approved hashes. Change their
  versions only if implementation proves that prompt behavior must change, in
  which case stop for a new explicit prompt approval.
- Bump the plugin's real compatibility version to 0.2.0, update its Skill,
  protocol, schemas, generated copies, validator, fixtures, and runbook, then
  apply the plugin-creator cachebuster/reinstall flow. Do not hand-edit the
  configured marketplace during the update.
- Make all fifteen D-024 identities representable in the 0.2.0 evaluation
  suite. Rerun the four former contract gaps and the malformed Story Sheet
  case in fresh, independent, text-only Skill conversations. Exercise one real
  attempt-2 repair packet. Retain exact first responses and report observed
  outcomes without rewriting failures.
- Add a repository-owned `bunbun_core@0.1.0` technical reference fixture for
  `犬` / `いぬ` / `chó`, `猫` / `ねこ` / `mèo`, and `〜てください` / `hãy
làm...`, with explicit project-authored provenance. Do not import Bunpro
  definitions or claim a third-party license.
- Normalize one to three ordered input rows using NFKC, trim, controlled
  whitespace collapse, exact normalized duplicate removal, stable order,
  Unicode code-point limits, and rejection of markup, URLs, control characters,
  or embedded instructions.
- For the technical M7 profile, accept only unique combinations of those three
  reviewed core targets. Use a bounded `park_small` FIND_SOMETHING profile for
  vocabulary-only requests and HELP_SOMEONE when `〜てください` is included.
  Reject unknown or incompatible input with stable actionable diagnostics.
- Build a deterministic 8–12 step plan from the eight approved primitives.
  Code owns scene/scenario compatibility, target/reference records, world
  facts and claims, IDs, primary object selection, primitive order, target
  bindings, attempts, scaffolds, timings, transitions, completion, quality
  budgets, seed, and answer truth.
- Add a pure authoring-request builder and contribution-to-LessonManifest
  normalizer. AI text may fill only the approved story, phrase-analysis,
  practice-copy, hint, scaffold-copy, and feedback slots.
- Promote the park runtime capability profile to a browser-safe shared module
  used by server publication and the web client. Generalize the temporary
  speech-synthesis check to accept manifest-registered audio IDs with the
  approved technical voice profile instead of one hard-coded lesson audio ID.
- Run authoring structure/semantic validation, LessonManifest structure and
  semantic validation, CatalogSnapshot validation, and shared runtime
  capability validation before a package becomes reviewable or publishable.
- Keep `node:http` and the one local SQLite process. Add a durable human-handoff
  compilation state machine instead of a model worker or job queue:
  `AWAITING_AUTHORING`, `REPAIR_REQUIRED`, `READY_FOR_REVIEW`, `PUBLISHED`, and
  `FAILED`.
- Add migration 2 for compilation requests, attempts/import metadata, stable
  diagnostics, validated contribution JSON, pending normalized package JSON,
  and final lesson/revision linkage. Reuse `lesson_revisions` for publication.
- Hash the exact imported raw string. Persist the hash and, only after strict
  parsing and validation, canonical structured content. Do not persist raw
  invalid output, hidden reasoning, chat history, or account/session data.
- Add an idempotent compilation cache key over normalized targets, compiler
  profile/version, authoring contract, exact prompt pack, reference fixture,
  and catalog/runtime profile. Reuse an identical published package; create a
  later immutable revision only when a relevant versioned input changes.
- Add closed local APIs to create/list/read a compilation, download its current
  authoring request, import a local result file as an exact raw string, publish
  a reviewed package, list published lessons, and load one package.
- Add a small accessible pre-game authoring/library view. It must show the
  disclosure before export, accept only a local `.json` file for import, show
  validation errors and repair instructions, present a review summary, require
  explicit Publish and Play actions, and retain the existing authored demo as
  an offline regression option.
- Load server-returned packages as untrusted input and pass them through the
  same validation, capability, fingerprint, resume, evidence, and renderer
  boundaries as the authored demo.
- Add focused schema, semantic, normalizer, migration, repository, HTTP, and
  web unit/integration tests. Add no automated browser E2E.
- Update all M7 architecture, AI, current-state, roadmap, decision, protocol,
  and runbook documentation; record only actual user-reported manual results.

### Out of scope

- M7 v1 provider SDK, `gpt-5.6-terra`, `OPENAI_API_KEY`, another API key, or
  any environment variable.
- M7 v2 local-model runtime, training, fine-tuning, model download, or hardware
  benchmark.
- M7 v3.3 MCP, public endpoint, Secure MCP Tunnel, action, app, connector,
  authentication scheme, direct response delivery, or hosting.
- WXT, browser extension, userscript, browser automation, programmatic login,
  cookie/session access, clipboard scraping, or ChatGPT DOM integration.
- Invoking or editing the six hosted Custom GPT objects. The implementation
  reuses only the captured and approved repository-owned adaptations.
- Visual Mnemonic, HTML Anki, APKG generation, JLPT assessment, a runtime Tutor,
  image/file generation, or any use of captured binary examples.
- Arbitrary Japanese vocabulary/grammar coverage, external reference dataset
  import, scraping, or a production license claim.
- KANJI targets, radical/decomposition authority, SPEAK, pronunciation scoring,
  open-ended LLM grading, a ninth primitive, or AI-created mechanics.
- New scenes, production neighborhood assets, new navigation, NPC personality
  simulation, animals beyond the existing registered dog/cat, collision-driven
  stories, or runtime procedural generation.
- Production TTS, cached speech binaries, ambience, sound effects, music, or
  the D-026 showcase. Those remain Milestones 8 and 9 work.
- A new backend framework, background worker, queue, ORM, database, Redis,
  streaming, webhooks, cloud sync, accounts, Docker, deployment, or staging.
- Automated Playwright/browser E2E or claims about unreported browser behavior.

## Decisions and constraints

- Approval of this plan should be recorded as a new accepted D-034 decision.
  It will resolve O-006 for M7 v3.2 by retaining `node:http` and selecting the
  durable human-handoff state machine above. It will resolve O-009 only for the
  technical park slice through the independently authored three-record Bunbun
  Core fixture; production reference selection remains deferred.
- Authoring contract/packet/protocol and plugin compatibility advance to 0.2.0.
  LessonManifest, CatalogSnapshot, and EvidencePersistence remain 0.1.0 unless
  a concrete incompatibility is discovered and discussed before changing them.
- The three approved prompt modules and hashes remain 0.1.0. This plan does not
  authorize a prompt behavior edit or hidden generic substitute.
- The technical supported target set is deliberately closed. A text box does
  not imply that arbitrary Japanese is valid; unsupported text receives a
  clear local error before any authoring packet is exported.
- The sibling N5 extraction is research context only. Runtime reference truth
  must be independently written and reviewed in this repository.
- The file is the authoritative handoff record. Clipboard import and direct
  delivery remain excluded. The browser reads the user-selected file and sends
  its exact bounded text to the local loopback server for hashing and strict
  validation.
- At most two authoring attempts exist per compilation. Attempt 1 failure may
  produce one repair packet. Attempt 2 failure is terminal for that job; the
  user can create a fresh job explicitly. No prompt/model/transport fallback
  occurs.
- A structurally and semantically valid contribution is still untrusted until
  deterministic normalization, full package/capability validation, and an
  explicit user Publish action all pass.
- No model runs inside Bunbun. A waiting request is not an error and does not
  block the authored demo or published local packages.
- Gameplay evidence, raw TYPE answers, checkpoints, progress, identity, and
  private conversation content are never authoring inputs.
- D-001's 5–12 second preferred reaction cadence, D-003's bounded micro-scene,
  D-004's eight primitives, D-005's world-dominant gameplay, and current scene
  budgets remain invariant.
- Plugin source changes must follow the loaded plugin-creator update guidance:
  set the real 0.2.0 base version, run `update_plugin_cachebuster.py`, reinstall
  from the already configured local `personal` marketplace with
  `/home/nunu/.local/bin/codex`, and validate in a new thread.
- The user performs browser/gameplay acceptance manually under D-011. No test
  may infer a browser pass from static or unit results.

## Implementation approach

The pre-game UI sends target rows to the local server. The server normalizes
them, resolves only the Bunbun Core fixture, selects the park scenario/profile,
creates every deterministic plan field, and persists one immutable compilation
request. The response exposes a downloadable authoring request 0.2.0 only after
the user has seen the exact data disclosure and explicitly clicks Export.

The user attaches that file in a fresh conversation and invokes the installed
Skill. Bunbun never opens or controls the conversation. The returned result is
saved as a local JSON file and selected through a file input. The browser sends
an envelope containing the exact bounded file text to the loopback server. The
server hashes it before parsing, rejects trailing bytes or any other parse
failure, checks packet/request/input/prompt identities, validates every module
contribution and code-owned echo, and records only the hash plus stable
diagnostics for invalid output.

After an attempt-1 failure, the server creates exactly one request 0.2.0 repair
packet. It includes the prior structured result only when structural validation
succeeded, plus the prior raw-response hash, failure stage, and bounded stable
diagnostics generated by local code. An invalid attempt 2 ends the compilation.
This makes JSON and structure failures repairable without treating a parsed but
invalid object as accepted truth.

For valid contributions, a pure server normalizer combines model-owned copy
with the immutable compiler plan. It assigns all manifest IDs, target records,
world instances, interaction truth, timing, transitions, seed, quality, and
provenance, then runs the same package and runtime-capability gates as the web.
The resulting unpublished package is stored in the compilation row and shown
as `READY_FOR_REVIEW`. The UI displays the title, objective, story beats,
practice prompts, answer/scaffold summary, module versions, and validation
status. Only Publish inserts or confirms the immutable `lesson_revisions` row
and changes the job to `PUBLISHED`.

The lesson library returns authored demo and published revisions separately.
Selecting Play downloads the package, validates it again in the browser,
computes the existing package fingerprint, and then enters the unchanged
resume/evidence/runtime flow. The game never knows whether its manifest came
from the authored fixture or the Skills-only handoff.

The compiler lifecycle is synchronous around local user actions, so an
in-process background worker would add failure modes without doing useful
work. SQLite durability is still necessary because request files, attempts,
review state, and published revisions must survive reloads and server restarts.

## Milestones

### 1. Approve architecture and close contract 0.2.0

Record D-034, mark this plan Approved, add versioned 0.1.0/0.2.0 TypeBox
schemas and validators, implement the new code-owned fields and repair
semantics, generate drift-checked artifacts, and update the plugin source to
protocol 0.2.0 without changing the three prompt files or hashes.

Observable checkpoint: every D-024 fixture maps to a structurally valid 0.2.0
request; old 0.1.0 proof fixtures and evidence remain inspectable.

### 2. Requalify the Skills-only boundary — waived under D-035

Validate the updated plugin, apply its 0.2.0 cachebuster, reinstall it from the
configured `personal` marketplace, and use a new thread for execution. Run the
four former contract-gap cases and the formerly malformed Story Sheet case in
fresh conversations. Exercise a real attempt-2 packet and grade every returned
file locally.

Observable checkpoint: all former gaps are exercised honestly, bounded repair
is demonstrated, and the route is either promoted to viable for application
integration or stopped with exact retained failures. Application importer work
must not continue if answer truth, runtime-plan integrity, or repair identity
cannot pass.

D-035 supersedes this execution gate at the user's explicit direction. No case
was rerun and no bounded repair is counted as passing. Application integration
may continue with repository-owned 0.2.0 fixtures, while the external
ChatGPT/Codex transport remains `UNVERIFIED`.

### 3. Implement the deterministic compiler core

Add the independent Bunbun Core fixture, target normalizer/reference resolver,
park scenario/profile builder, request builder, manifest normalizer, shared
runtime-capability validator, stable hashes/IDs, and pure tests. Keep prompt
content and transport outside these modules.

Observable checkpoint: fixture authoring results compile deterministically
into complete valid LessonManifest 0.1.0 packages; invalid or mutated
contributions return stable sorted errors and no package.

### 4. Add durable compilation and publication APIs

Add SQLite migration 2, compilation repository/service methods, the bounded
raw-file import envelope, state transitions, repair packet creation, review and
publish actions, idempotent cache behavior, lesson list/load resources, reset
semantics, and node:http integration tests.

Observable checkpoint: a request can survive server restart, reject a bad file,
accept one repair, reach review, publish exactly one immutable revision, and be
loaded later without the plugin.

### 5. Add the pre-game compiler, review, and lesson library UI

Add target entry, local disclosure/export, file-only import, stable diagnostic
display, repair download guidance, review summary, explicit publish/play, and
authored-demo selection. Refactor content loading so both server packages and
the static fixture enter the same browser validators and existing runtime.

Observable checkpoint: the user can complete the whole local handoff and play
the resulting park lesson while the existing authored eight-primitive demo,
resume flow, evidence persistence, renderer fallback, and failure controls
still work.

### 6. Close Milestone 7 with verification waived under D-036

D-036 supersedes the required automated/manual verification at the user's
explicit direction. Run only implementation-level static/build hygiene, record
every omitted test and manual result as `UNVERIFIED_USER_WAIVED`, update durable
docs, mark M7 implementation complete, and leave M8 next.

Observable checkpoint: the implementation and retained verification risk are
fully represented in repository source; no skipped check is called a pass.

## Progress

- [x] 2026-08-20 12:04 — Read the required product, architecture, gameplay,
      manifest, decisions, current-state, roadmap, performance, AI-module, world-
      authoring, M7 strategy, and ExecPlan documents; inspect contracts, plugin,
      server persistence/API, web boot/runtime capability gate, fixtures, and the
      sibling N5 research source.
- [x] 2026-08-20 12:04 — Confirm that M7 v3.2 proof is complete but the
      application compiler/import/revision flow is absent, and prepare this
      proposed completion plan.
- [x] 2026-08-20 12:13 — User approved the complete M7 plan and its proposed
      architecture by replying `DUYỆT PLAN HOÀN TẤT M7`.
- [x] 2026-08-20 12:36 — Milestone 1 completed: add side-by-side authoring
      contract, packet, schemas, validators, generated artifacts, fixtures,
      fifteen runnable evaluation requests, and plugin protocol 0.2.0 while
      preserving all three prompt modules and hashes at 0.1.0. Contract tests
      pass 41/41; schema drift and plugin validation pass.
- [x] 2026-08-24 — Milestone 2 was explicitly waived by the user under D-035.
      It was not run and is not a pass. The installed registry reports plugin
      `0.2.0+codex.20260820053513`; transport qualification remains unverified.
- [x] 2026-08-24 — Milestone 3 implemented the Bunbun Core fixture, closed
      target normalizer, deterministic park request/manifest compiler, stable
      identities, and shared runtime capability gate.
- [x] 2026-08-24 — Milestone 4 implemented SQLite migration 2, exact file
      hashing, bounded repair, durable compilation states, review/publication,
      reset, and closed node:http lesson resources.
- [x] 2026-08-24 — Milestone 5 implemented the pre-game target/export/import/
      review/publish/library flow and routed published packages through the
      existing browser validators and runtime.
- [x] 2026-08-24 — Milestone 6 closed under D-036. Automated tests and manual
      acceptance were not run; static/build checks pass and the complete flow
      is `UNVERIFIED_USER_WAIVED`.

## Surprises and discoveries

- The existing `lesson_revisions` table already stores exactly the immutable
  manifest/catalog package needed after publication. M7 needs a compilation
  lifecycle and earlier publication path, not a second lesson store.
- The current web audio adapter resolves every manifest-registered audio asset
  dynamically, but the capability validator unnecessarily hard-codes
  `audio_find_dog`. Sharing the park profile and validating voice/profile
  capability is sufficient for technical generated speech.
- The approved 0.1.0 prompt text already declares practice text, answer truth,
  attempts, and display durations code-owned. The four gaps can be closed by a
  packet/protocol version without changing the three prompt modules.
- The sibling N5 extraction has no local redistribution license and is already
  classified by an approved plan as research-only. It cannot become M7 runtime
  reference truth by convenience.
- Because v3.2 has no in-app model call, a queued/running provider worker from
  inactive M7 v1 would be the wrong job model. Durable human-handoff states are
  smaller and make transport unavailability naturally recoverable.
- The official plugin update helper emitted the cachebuster form
  `0.2.0+codex.<timestamp>` on this machine. Source and plugin validators accept
  that helper-owned build suffix while treating 0.2.0 as the compatibility
  line.
- Structural failures cannot safely carry their rejected object in a repair
  packet while also honoring the rule that invalid structured content is not
  retained. Contract 0.2.0 now sends only hash and diagnostics for JSON parse
  and structural failures; a semantic failure alone may carry the previously
  structure-valid result.
- The official cachebuster/reinstall flow succeeded after the protocol
  reconciliation. The installed plugin is
  `0.2.0+codex.20260824095911`; no new-thread behavior was tested under D-036.

## Plan decisions

- 2026-08-20 — Recommend authoring packet/protocol and plugin 0.2.0 while
  preserving all three approved prompt modules at 0.1.0. The contract, not the
  approved behavior, caused D-033's gaps.
- 2026-08-20 — Recommend a durable human-handoff SQLite state machine with no
  worker, provider SDK, credential, or background model call.
- 2026-08-20 — Recommend a three-record independently authored Bunbun Core
  technical reference and a closed target set for M7. This proves the complete
  boundary without making an unsupported arbitrary-Japanese or license claim.
- 2026-08-20 — Recommend file-only import, exact raw-string hashing, explicit
  review, and explicit publication. Structural validity alone is insufficient
  to publish natural-language model output.
- 2026-08-20 — Recommend side-by-side authoring 0.1.0 compatibility so D-033
  evidence remains reproducible instead of silently rewriting history.
- 2026-08-20 — User accepted all recommendations above under D-034. Begin with
  contract/plugin protocol 0.2.0 and stop at the required new-thread
  requalification checkpoint before application importer work.
- 2026-08-24 — User accepted D-035, waived the requalification checkpoint, and
  authorized direct continuation into deterministic compiler Milestone 3. The
  waiver changes sequencing and completion claims only; it does not relax any
  validation, privacy, ownership, review, or publication gate.
- 2026-08-24 — User directed completion of M7 while skipping the test portion.
  D-036 closes implementation, records tests/manual acceptance as waived, and
  advances the roadmap to M8 without creating runtime acceptance evidence.

## Validation

### Static and automated checks

D-036 explicitly waives the planned automated tests and manual acceptance.
Implementation-level checks actually run on 2026-08-24:

- workspace `npm run typecheck`: passed;
- workspace `npm run lint`: passed after replacing a lint-rejected control-
  character regular expression with equivalent Unicode code-point checks;
- Prettier write: completed with no remaining changed formatting;
- plugin manifest validator and Skill validator: passed;
- contracts, server, and web production build: passed; and
- final `git diff --check`: passed.

Vite reports 1,290.77 kB JavaScript (357.34 kB gzip), 14.60 kB CSS (3.80 kB
gzip), the 5.89 kB glTF fixture, and the known large-chunk warning. No contract,
compiler, persistence, HTTP, or web test command was run. No Playwright/manual
browser result is inferred. Docker is not applicable because the repository
has no Dockerfiles and D-015 keeps release work after local acceptance.

### Manual happy path

1. Start the local server/web application and select Create lesson.
2. Enter `犬`, optionally add `〜てください`, and confirm that reviewed
   reading/meaning data and the exact export disclosure appear.
3. Export the request JSON, open a fresh supported ChatGPT/Codex conversation,
   invoke `$bunbun-lesson-authoring`, and attach only that request.
4. Save the strict result as JSON and select it through Bunbun's file input.
5. Confirm that local validation reaches Ready for review, shows the expected
   title/story/practice/coaching summary and the three module versions, but has
   not published the lesson.
6. Publish, then Play. Complete the generated park lesson through its planned
   interactions and confirm evidence saves locally.
7. Reload, select the published lesson, and confirm it plays without invoking
   the plugin or exporting another request.

### Manual edge cases

1. Enter an empty target, duplicate target, unknown target, overlong text, URL,
   markup, or instruction-like text; expect local rejection before export.
2. Cancel the file picker or select a non-JSON/oversized file; expect no import
   and an actionable non-destructive message.
3. Import a result for another request, wrong hash, wrong prompt pack, unknown
   field, missing module, `CANNOT_COMPLY`, trailing JSON content, changed answer
   truth, changed attempt/display timing, unsupported world claim, or runtime
   capability; expect no reviewable or playable package.
4. After an attempt-1 failure, export the one repair packet and confirm a valid
   repaired file can reach review. Fail attempt 2 and confirm the job becomes
   terminal without a third request or silent fallback.
5. Close/reload the browser and restart the server while a job is waiting for
   authoring or review; expect the exact durable state and request to return.
6. Make the plugin surface unavailable; expect the job to remain waiting, with
   the authored demo and published lessons still playable.
7. Double-click Export, Import, Publish, or Play; expect idempotent behavior and
   no duplicate job, import attempt, revision, or session.
8. Exercise narrow/wide viewport, focus transfer between file/form controls and
   canvas, forced WebGL2, simulated audio failure, background/resume, and local
   persistence failure. The learning path must remain recoverable.

### Manual regression

1. Play the authored complete-primitive demo and verify all eight primitives,
   assisted paths, restart, and completion remain unchanged.
2. Reload/resume an active authored and compiled lesson; verify no evidence or
   completed interaction is duplicated.
3. Verify invalid manifests still fail before renderer startup and WebGPU
   failure still falls back clearly to WebGL2.
4. Verify the game world remains dominant during play and the authoring UI is
   not left over the active lesson.
5. Verify Reset local data clearly includes compilation requests and published
   local lesson revisions before deletion, and does not affect plugin files or
   external conversations.

### Manual results

| Scenario                                                    | Tester | Date       | Result                 | Evidence or notes            |
| ----------------------------------------------------------- | ------ | ---------- | ---------------------- | ---------------------------- |
| Full export → Skill → file import → review → publish → play | —      | 2026-08-24 | UNVERIFIED_USER_WAIVED | User explicitly skipped test |
| Invalid import and one bounded repair                       | —      | 2026-08-24 | UNVERIFIED_USER_WAIVED | No real repair run           |
| Offline published lesson and authored-demo regression       | —      | 2026-08-24 | UNVERIFIED_USER_WAIVED | No browser acceptance        |
| Renderer/audio/persistence/reload edge matrix               | —      | 2026-08-24 | UNVERIFIED_USER_WAIVED | No manual matrix             |

## Recovery and compatibility

Migration 2 must be checksummed, forward-only, transactional, and safe on an
existing Milestone 6 database. It adds tables and indexes without rewriting
existing evidence/session rows. Existing `lesson_revisions` identities remain
immutable. A compilation may reference a revision only after publication.

The 0.1.0 request/result schemas, validators, fixtures, and exact D-033 evidence
remain frozen and inspectable. New application routes accept only 0.2.0.
Plugin 0.2.0 is a real compatibility change; the cachebuster suffix exists
only so Codex reloads the local source. Reinstall occurs from the already
configured local marketplace. The source is installed as
`0.2.0+codex.20260824095911`; new-thread behavior was not tested under D-036.

Create, import, and publish operations use client/request identity plus
payload hashes so safe retries return the existing outcome. A reused identity
with different content fails with a conflict. Raw invalid model content is not
stored; its SHA-256 and stable diagnostics are sufficient to associate a
repair attempt with the user-retained local file.

If implementation stops after contract requalification, the old 0.1.0 proof
and existing application remain usable. If it stops after migration/API work,
the authored demo remains the default playable fallback and incomplete jobs
remain visibly non-published. No cleanup command may delete user data during
development; reset behavior is exercised only through the existing confirmed
local-data UI/API.

## Documentation updates

- [x] Record D-034 through D-036 and the retained M7 verification labels.
- [x] Reconcile the authoring contract and plugin protocol with safe structural
      repair semantics without changing approved prompt content.
- [x] Update architecture, manifest, AI, strategy, current-state, roadmap,
      plans index, and this ExecPlan for the implemented file lifecycle and
      shared runtime gate.
- [x] Record one secret-free M7 closure summary in shared memory after updating
      repository documentation; repository documentation remains authoritative
      under AGENTS.md.

## Outcomes

M7 implementation is complete: the authoring contract/plugin, deterministic
compiler, durable file handoff, review/publication APIs, and pre-game library
are present. D-035/D-036 explicitly waive external requalification, automated
tests, and manual browser/gameplay acceptance. The flow is closed as
`UNVERIFIED_USER_WAIVED`, not as tested or release-candidate accepted. M8 is
next.
