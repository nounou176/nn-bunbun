# M7 v1 — Compile learner targets through OpenAI Responses

Status: Proposed; preserved inactive under D-027
Owner: Codex and user
Created: 2026-08-12
Last updated: 2026-08-19 21:10 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

This document is the frozen **M7 v1** provider strategy. D-027 preserves it as
the OpenAI Responses API comparison candidate while M7 v3 browser-bridge
research is active. Its proposed model, environment-variable name, Structured
Outputs boundary, and implementation checkpoints remain unchanged and
unapproved. Do not implement this plan unless the user explicitly reactivates
and approves M7 v1.

Add the first real lesson compiler boundary to Bunbun. At completion, the user
can enter one to three Japanese vocabulary or grammar targets in a small local
pre-game view, start a compilation, observe its durable status, and play the
result in the existing park runtime only after it passes every deterministic
contract and capability check.

Compilation uses the OpenAI Responses API once per initial draft and at most
once more for a bounded repair. AI proposes authored Japanese lesson content;
it does not create code, assets, mechanics, reference facts, persistence
events, or runtime decisions. The server converts the strict model-facing
draft into an immutable LessonManifest 0.1.0 package, persists it in SQLite,
and returns it to the browser. A successfully compiled lesson remains listed
and playable after reload, server restart, loss of provider access, or removal
of the provider key.

The compiler view explains that target text is sent to OpenAI only when the
user chooses Compile. Gameplay reactions, TYPE answers, evidence, and local
progress are not sent. The existing authored eight-primitive demo remains an
explicit local regression option and is not silently replaced.

This milestone proves the AI-to-deterministic-runtime boundary. It does not
implement the D-026 production vertical slice, production content breadth,
external dictionaries, kanji decomposition, production TTS, adaptive
scheduling, accounts, cloud sync, deployment, or an LLM call during ordinary
gameplay.

## Repository context

Milestones 0 through 6 are complete. The local implementation is at commit
`a69e82a`; the Milestone 6 acceptance documentation remains as uncommitted user
work and must be preserved.

`packages/contracts` owns the strict TypeBox LessonManifest 0.1.0,
CatalogSnapshot 0.1.0, and EvidencePersistence 0.1.0 contracts, generated JSON
Schema artifacts, Ajv structural validators, pure semantic validators, catalog
fixtures, and authored lesson fixtures. D-017 explicitly anticipates that a
future Structured Outputs schema will need all fields required plus a
deterministic normalization step rather than weakening the playable manifest.

`apps/server/src/http.ts` is a testable node:http router. The server owns one
built-in Node SQLite connection, runs checksummed forward migrations, and
exposes closed `/api/v1` persistence routes. `apps/server/src/index.ts` starts
that process on loopback. There is no HTTP framework, job queue, provider SDK,
or compiler code.

`apps/web/src/lesson/content.ts` currently imports the authored complete-
primitive fixture. It validates the package and then applies a park-specific
capability gate from `apps/web/src/lesson/capabilities.ts` before the renderer
starts. `apps/web/src/main.ts` fingerprints that package, resolves durable
session state, and boots the accepted deterministic runtime. Dynamic compiled
content must enter through the same validation, capability, fingerprint,
resume, and evidence boundaries.

The basic catalog and code-owned park expose one scene, two NPCs, dog and cat
objects, two locations, three cues, one technical voice profile, and the eight
fixed primitives. They are a technical compiler target, not an implementation
of the D-026 product vertical slice.

`docs/AI_MODULES.md` inventories the six Custom GPT concepts named by the
original Bunbun source. On 2026-08-12, the user supplied six local GPT
configurations plus Knowledge assets under the Git-ignored `gpts/` directory.
The supplied set contains Story Coach, Reverse Trainer, Story Sheet, Visual
Mnemonic, HTML Anki, and JLPT N3 Anki Deck Generator. It does not contain a
distinct Tutor or JLPT assessment GPT. D-023 confirms this is the complete
intended set and accepts the Milestone 7 responsibility mapping. D-024 approves
Prompt Adaptation Pack 0.1.0 and its three selected module versions.

D-001 through D-008, D-010 through D-013, D-015 through D-021, accepted D-023,
D-024, and D-027, and proposed D-022 govern the work. Implementation must not
begin unless the user first reactivates M7 v1 and then accepts D-022, this
ExecPlan, the model/reasoning setting, and the environment-variable name
`OPENAI_API_KEY`. Prompt adaptations, source snapshot identities, and text-only
evaluations are already approved by D-024.

Official OpenAI documentation consulted on 2026-08-12 states that Structured
Outputs should be used instead of JSON mode where possible, that Responses API
structured response data uses `text.format`, and that every field in the
model-facing schema must be required while optional values can be represented
with null. It also identifies `gpt-5.6-terra` as the balanced intelligence/cost
model and confirms Responses API and Structured Outputs support:

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/models/gpt-5.6-terra

## Scope

### In scope

- Keep LessonManifest and CatalogSnapshot at version 0.1.0 and
  EvidencePersistence at version 0.1.0.
- Add a separately versioned LessonCompilation 0.1.0 API contract with inferred
  types, strict validators, normalized errors, generated JSON Schema, and drift
  checks.
- Use the captured source snapshots and Prompt Adaptation Pack 0.1.0 approved
  under D-024. Unknown GPT-editor model, capability/action, and version-history
  values are explicitly not inherited.
- Apply the accepted D-023 mapping: Story Sheet owns premise/story/setting,
  Story Coach owns bounded hints/scaffolds/pedagogical cadence/feedback, and
  Reverse Trainer owns phrase analysis/reverse recall/practice content.
- Keep primitive sequence, difficulty progression, IDs, transitions,
  attempt/timing limits, and hard budgets deterministic. Do not delegate those
  responsibilities to a prompt module.
- Treat every supplied image and the APKG only as a style/output example. Do
  not extract lesson/reference content from them, send them to the provider, or
  use them as evaluation fixtures.
- Preserve the approved narrow, versioned Bunbun prompt-module adaptations,
  including typed responsibilities, allowed data, exclusions, validators,
  fallback behavior, and composition order.
- Accept one to three ordered target inputs of exactly two kinds:
  `VOCABULARY` with a written form and optional learner-supplied reading, or
  `GRAMMAR` with a pattern. The technical support locale is Vietnamese without
  claiming it as the final vertical-slice choice.
- Normalize target input using NFKC, trim, controlled whitespace collapse,
  exact normalized duplicate removal, Unicode code-point length limits, stable
  ordering, and plain-text safety rejection.
- Add a small reviewed Bunbun Core 0.1.0 reference fixture owned by this
  repository for park-relevant vocabulary and grammar records. Record its
  provider ID, version, project-authored provenance, and world bindings.
- Match known targets deterministically. Require a learner-supplied reading
  for unknown vocabulary rather than asking AI to invent one. Permit
  learner-supplied grammar patterns without claiming an external authority.
- Reject KANJI in Milestone 7; arbitrary decomposition remains forbidden.
- Define a code-owned `park_small` compiler profile containing only registered
  local instance IDs, spawn points, locations, cues, voice profile, supported
  scaffolds, supported primitives, scenario compatibility, and quality budgets.
- Move or promote the existing pure park runtime-capability validation into a
  browser-safe shared module consumed by both the server compiler and web
  client, preventing publication/runtime drift.
- Select `park_small` and a compatible FIND_SOMETHING or HELP_SOMEONE scenario
  deterministically from normalized target/reference capabilities before the
  model call.
- Add an all-required LessonContentDraft 0.1.0 TypeBox schema compatible with
  the supported Structured Outputs subset. Use explicit null unions only where
  playable data may omit an optional property.
- Add a deterministic draft-schema compatibility check for a root object,
  required properties, closed objects, bounded depth/size, and disallowed
  schema keywords before provider integration.
- Add a pure draft normalizer that removes null optionals and assigns all
  server-owned manifest fields: schema version, stable lineage IDs, revision,
  manifest ID, creation time, deterministic random seed, locales, canonical
  targets, references, catalog selection, technical audio IDs/cache metadata,
  quality values, and provenance.
- Generate stable lesson lineage from normalized target identity. Include
  compiler, prompt, requested model, catalog, runtime profile, and reference
  versions in the compilation cache key. Reuse an identical successful result;
  increment the immutable lesson revision when relevant compilation inputs
  change.
- Add an injected `LessonDraftProvider` port and an OpenAI implementation using
  the official JavaScript SDK, Responses API, strict `text.format`, model
  `gpt-5.6-terra`, and `reasoning.effort: medium`.
- Keep one versioned code-owned compiler envelope and compose only the
  approved `story_sheet`, `reverse_trainer`, and `story_coach` prompt modules
  required for the selected lesson profile. Send only normalized targets, the
  compact compiler profile, budgets, and explicit data/instruction boundaries.
  Record every participating module ID and version. Do not enable model tools,
  web search, file search, or function calling.
- Read the provider credential server-side only from `OPENAI_API_KEY`; never
  log, persist, return, document, or send its value to the browser.
- Treat a missing key as `COMPILER_NOT_CONFIGURED` while keeping the server,
  evidence APIs, authored demo, and existing compiled lessons usable.
- Permit at most two Responses calls per job. Use the second call only for one
  bounded retry or repair based on stable, redacted validation diagnostics.
  Refusal, unsafe input, missing configuration, and explicitly non-retryable
  errors fail without another model or a silent fallback.
- Validate each received draft structurally, normalize it, then run the full
  existing package validators and the shared park runtime-capability validator.
  Never persist or expose an invalid or partial package.
- Generalize the temporary SpeechSynthesis capability boundary to accept
  compiler-produced audio records only after the manifest, catalog, voice
  profile, exact utterance text, and technical cache metadata validate. This is
  a temporary local adapter, not Milestone 8 cached TTS.
- Add SQLite migration 2 for durable compilation jobs and attempt metadata,
  reusing immutable `lesson_revisions` for successful packages.
- Persist normalized request data, request/cache hashes, status, attempt count,
  requested and returned model identifiers, response ID, prompt/compiler/
  reference/catalog versions, usage metadata, stable error code/message, and
  final lesson/revision reference. Do not persist hidden reasoning or raw TYPE
  gameplay data.
- Keep one in-process FIFO worker with concurrency one. On process startup,
  mark a leftover RUNNING job as interrupted/failed rather than automatically
  repeating a billable call.
- Make request IDs idempotent and collapse concurrent work for the same cache
  key. A duplicate browser submit must resolve to the same job or cached
  package.
- Extend confirmed Reset local data to delete compiler requests, jobs,
  attempts, and compiled lesson revisions as well as existing session data,
  while preserving migration history.
- Add closed node:http routes:
  - `POST /api/v1/lesson-compilations`;
  - `GET /api/v1/lesson-compilations/:jobId`;
  - `GET /api/v1/compiled-lessons`; and
  - `GET /api/v1/compiled-lessons/:lessonId/revisions/:revision`.
- Keep route bodies within the existing 256 KiB limit, use stable status/error
  payloads, and expose no prompts or provider secrets.
- Add a small accessible pre-game compiler UI with target-kind selection,
  vocabulary/reading or grammar fields, explicit transmission disclosure,
  compile action, durable job progress, failure/retry guidance, recent compiled
  lessons, and an explicit authored technical-demo option.
- Poll only while a job is queued/running, stop on disposal/background where
  appropriate, and prevent duplicate submits. Compilation does not run in the
  render loop.
- Load server-returned packages as untrusted input. Validate structure,
  semantics, shared runtime capability, and package fingerprint before the
  existing resume/session and renderer startup.
- Add focused contract, compiler, SQLite, HTTP, and web unit/integration tests
  with an injected fake provider. Automated tests must never make a real
  OpenAI request or require a secret.
- Provide an explicit user-run browser/provider acceptance matrix under D-011.

### Out of scope

- Production asset expansion, new scenes, more world objects, polished lesson
  content, or implementation of the D-026 first product vertical slice.
- Porting or invoking Visual Mnemonic, Anki content generator, or JLPT
  assessment generator; their workflows remain deferred to later roadmap
  decisions.
- External JMdict, grammar, kanji, JLPT, or other third-party reference-data
  import; scraping; or an unreviewed license claim.
- KANJI compilation, radical/component authority, open-ended evaluation,
  SPEAK, pronunciation scoring, or any ninth primitive.
- Changes to playable LessonManifest 0.1.0 semantics or a weaker runtime
  validator.
- More than two model calls per job, automatic fallback to another model,
  multi-model voting, agent frameworks, model tools, or a prompt optimizer.
- Runtime AI, LLM-based answer checking, LLM-generated Three.js code, dynamic
  assets, arbitrary URLs, filesystem paths, scripts, or expressions.
- External queues, worker processes, Redis, an ORM, another database, a new
  backend framework, webhooks, streaming responses, or OpenAI background mode.
- Production OpenAI TTS, audio binary generation, voice choice, cache files,
  or pronunciation review; Milestone 8 owns those decisions.
- Mastery, adaptive scheduling, remote analytics, learner accounts, cloud
  sync, or cross-device progress.
- Storing raw model reasoning, provider credentials, or learner gameplay TYPE
  responses in compiler records.
- Automated browser E2E tooling, Docker, deployment, hosting, or domain work.

## Decisions and constraints

- D-001 keeps meaningful Japanese reactions per minute above game or compiler
  breadth. Generated steps must preserve the 5–12 second preferred cadence.
- D-002 requires AI to compile data and forbids it from programming runtime
  behavior.
- D-003/D-004 constrain generation to reusable micro-scenes and the eight fixed
  primitives.
- D-005 keeps the compiler UI in DOM and returns the world to dominance during
  play.
- D-006/D-016 retain the existing TypeScript/npm workspace and Node server.
- D-008 defers real cached TTS to Milestone 8.
- D-010 requires this plan and resulting decisions to remain durable.
- D-011 excludes automated browser E2E and requires user-reported manual
  acceptance.
- D-013/D-017 keep LessonManifest 0.1.0 strict and require a separate AI draft
  shape plus deterministic normalization.
- D-015 excludes Docker/deployment before local release-candidate acceptance.
- D-018 through D-021 preserve the accepted runtime, primitive, and persistence
  semantics.
- Proposed D-022 resolves O-006, O-009 for the technical slice, and the initial
  text-model/prompt portion of O-010 only after explicit user approval.
- D-023 accepts the complete Custom GPT source set, M7 responsibility map, and
  style-only treatment of supplied images/APKG.
- D-024 approves Prompt Adaptation Pack 0.1.0, its three exact prompt hashes,
  contribution contract, fixed composition, privacy/failure behavior, and
  fifteen text-only evaluation fixtures.
- D-026 resolves O-001 and O-002 for the later first product vertical slice but
  does not broaden this technical compiler milestone or approve production
  audio.
- `docs/AI_MODULES.md` governs Custom GPT source capture and module activation.
  A concept name or inferred purpose is insufficient; missing or unapproved
  behavior cannot be implemented as a generic substitute.
- `OPENAI_API_KEY` is a proposed environment-variable name. Its value must
  never enter a command authored by Codex, repository docs, logs, tests, or
  shared memory. The user supplies it in their own local environment.
- OpenAI model availability, rate limits, pricing, and exact output can vary by
  account and time. The compiler exposes provider errors and never claims
  access before a real user-authorized test succeeds.
- The provider receives normalized target text and compiler constraints only
  after an explicit Compile action. This is distinct from local gameplay
  evidence, which remains local under D-021.
- The existing Milestone 6 closure documentation is uncommitted and must not be
  overwritten, reverted, or folded invisibly into implementation changes.

## Implementation approach

The browser first obtains recent compiled lesson summaries and configuration
status from the local server. The user can select an existing package, choose
the authored demo, or submit a new target request. The client validates local
form constraints, but the server repeats all validation and normalization.

The server computes two identities. The target-lineage hash uses only canonical
target identity and determines a stable lesson ID. The compilation cache hash
adds compiler, prompt, model, reference, catalog, and runtime-profile versions.
An existing successful cache entry returns immediately without provider work.
An idempotent request ID returns its existing job. Otherwise the server commits
a QUEUED row and lets the single worker process it after the HTTP response.

The worker resolves reviewed references, rejects unsupported or incomplete
targets, selects the technical scene/scenario profile and deterministic
primitive/difficulty progression, and builds a small provider request from the
approved compiler envelope and the versioned Story Sheet, Reverse Trainer, and
Story Coach modules required by that profile. These are composed into one
Responses request, not invoked as independent agents. The provider returns
LessonContentDraft 0.1.0 through strict Structured Outputs.
The server explicitly handles refusal, incomplete output, transport failure,
missing parsed content, and missing required module configuration.

The pure normalizer combines the draft with deterministic compiler inputs. It
does not repair Japanese meaning, invent references, or silently remove an
unknown primitive. Full package validation and the shared runtime gate produce
stable sorted diagnostics. A retryable content failure may create one repair
request containing only those diagnostics and the prior structured draft. A
second failure ends the job. No route can retrieve an intermediate draft.

On success, one SQLite transaction inserts the immutable lesson revision,
records the successful attempt metadata, and marks the job SUCCEEDED. The web
loads the package by resource endpoint, validates it again, fingerprints it,
and enters the existing resume/evidence/runtime flow. At no point does the game
loop know which model compiled the manifest.

## Milestones

### 0. Capture and approve lesson-authoring modules — Complete

Review the six captured source packages using `docs/AI_MODULES.md`. The user
has confirmed the intended set and D-023 resolves the mismatch with the earlier
Tutor/JLPT assessment concepts. Use each captured config SHA-256 as its Bunbun
source-revision identity; do not inherit unknown GPT-editor model, capability,
action, or version-history fields. Define the three selected Milestone 7
modules' narrow Bunbun adaptations, semantic versions, content hashes, privacy
boundary, composition order, and text-only evaluation fixtures, then obtain
explicit user approval.

Observable checkpoint: every required module is `Approved`, its source revision
and evaluation examples are traceable, conflicts are resolved, and the user can
see exactly which module owns each LessonContentDraft responsibility. No secret
or private ChatGPT conversation is captured.

Checkpoint achieved on 2026-08-12 through D-023 and D-024. The modules are
Approved for implementation but remain unimplemented and runtime-inactive.

### 1. Lock compiler contracts and the Structured Outputs boundary

Add LessonCompilation 0.1.0 request/response/job/summary schemas and
LessonContentDraft 0.1.0. Export types and validators, generate artifacts, and
add schema-compatibility tests proving the model schema is closed,
all-required, bounded, and separate from LessonManifest.

Observable checkpoint: fixture requests and drafts pass; unknown fields,
missing required draft fields, unsafe target strings, too many targets, kanji,
and unsupported schema shapes fail with stable errors.

### 2. Add deterministic input, references, selection, and normalization

Create compiler modules under `apps/server/src/compiler/` for input
normalization, Bunbun Core references, the park compiler profile, target and
cache identities, draft normalization, technical audio metadata, and package
validation. Promote the current pure runtime-capability gate to a shared
browser-safe module and retain web coverage.

Observable checkpoint: a reviewed fake draft becomes the same valid playable
package for the same inputs; unknown vocabulary without reading fails before a
provider call; every invalid package remains unpublished.

### 3. Persist compilation jobs and immutable lesson revisions

Add checksummed migration 2, repository methods, startup interruption
recovery, cache/idempotency behavior, reset coverage, and privacy-safe
inspection. Reuse the existing `lesson_revisions` table instead of creating a
second package source of truth.

Observable checkpoint: a temporary SQLite database survives close/reopen,
returns cached packages, collapses duplicate requests, marks interrupted work
failed, and deletes compiler-local data only after confirmed reset.

### 4. Integrate the OpenAI Responses provider behind a port

Add the official SDK dependency, a versioned compiler envelope, composition of
the approved prompt modules, provider response parsing, redacted errors,
module-version/usage provenance capture, and the two-call ceiling. The server
must start without a key, and all automated provider cases use a fake port.

Observable checkpoint: fake success, repair success, double validation
failure, refusal, incomplete output, missing key, provider unavailability, and
idempotent retry behavior all pass without network access.

### 5. Expose closed compiler resources through node:http

Add create/status/list/package routes and inject a compilation service into the
existing testable server factory. Preserve health, persistence, body-limit,
content-type, and JSON 404 behavior.

Observable checkpoint: HTTP integration tests drive a complete fake-provider
job from request through stored package and prove invalid/cached/failure/reset
paths.

### 6. Add the compiler view and dynamic package boot

Extend the DOM shell and web service boundary with accessible target controls,
disclosure, job polling, compiled lesson selection, status/error UI, and the
authored demo path. Refactor boot to accept a validated selected package rather
than importing a single global fixture. Generalize technical SpeechSynthesis
audio acceptance only within the validated profile.

Observable checkpoint: focused web tests prove duplicate-submit locking,
polling disposal, untrusted-package rejection, dynamic boot, cached selection,
authored-demo regression, and unchanged persistence fingerprint behavior.

### 7. Verify, document, and hand off manual acceptance

Run supported schema drift, typecheck, lint, format, focused tests, manifest
inspection, production build, SQLite/HTTP smoke, and privacy scans. Update
architecture, manifest/compiler docs, decisions, current state, roadmap,
README, and this plan. Provide the exact manual browser and provider matrix.

Observable checkpoint: all non-browser checks pass, no secret or raw gameplay
answer appears in artifacts, and the user receives a reproducible local
acceptance checklist.

## Progress

- [x] 2026-08-12 12:51 — Read required repository specifications, current
  implementation, shared memory, and current official OpenAI Structured Outputs
  and model documentation.
- [x] 2026-08-12 12:51 — Inspect server HTTP/SQLite boundaries, shared schemas
  and validators, park capability gate, authored content loading, temporary
  audio adapter, and environment configuration.
- [x] 2026-08-12 12:51 — Draft proposed D-022 and this self-contained ExecPlan.
- [x] 2026-08-12 13:20 — Audit the original Bunbun source, repository, known
  local attachments, and shared memory for the six named Custom GPT concepts;
  create `docs/AI_MODULES.md` with their source status, proposed routing,
  capture template, privacy boundary, and activation gates.
- [x] 2026-08-12 17:16 — Read and inventory the six user-supplied local GPT
  configurations, three Knowledge text specs, 57 PNG files, and one example
  APKG; preserve raw inputs and add a Git-ignored normalized local index with
  six source summaries.
- [x] 2026-08-12 18:43 — Record D-023 after the user confirmed the exact
  six-GPT set, accepted the Story Sheet/Story Coach/Reverse Trainer mapping,
  retained deterministic primitive/difficulty control, and restricted all
  supplied images/APKG to style/output examples only.
- [x] 2026-08-12 19:10 — Create the candidate `docs/ai-modules/` pack with one
  shared contribution contract, three source-to-module adaptation records,
  exact 0.1.0 prompt fragments and hashes, fixed composition order, privacy and
  deterministic failure rules, and fifteen text-only evaluation fixtures.
- [x] 2026-08-12 19:26 — Record D-024 after the user explicitly approved Prompt
  Adaptation Pack 0.1.0; close phase 0 and mark the three selected modules
  Approved for implementation but not runtime-active.
- [x] 2026-08-19 16:35 — Record D-026 and the approved queued audio-complete
  last-train showcase plan; keep M7's technical park and temporary audio scope
  unchanged.
- [x] 2026-08-19 21:10 — Preserve this proposal as inactive M7 v1 under D-027;
  move active research to the separate M7 v3 browser-bridge ExecPlan.
- [ ] If the user later reactivates M7 v1, obtain explicit approval for D-022,
  this ExecPlan,
  `gpt-5.6-terra`, `reasoning.effort: medium`, and the environment-variable
  name `OPENAI_API_KEY`.
- [ ] Implement milestones 1 through 7 in dependency order, updating this plan
  after every checkpoint.
- [ ] Hand off the manual matrix and record only results the user reports.

## Surprises and discoveries

- `docs/CURRENT_STATE.md` called Milestone 7 “content-library growth,” but the
  accepted ROADMAP and architecture define it as the Structured Outputs lesson
  compiler. This plan follows the roadmap and proposes correcting the stale
  state wording.
- The existing CatalogSnapshot reference records contain provider metadata but
  no linguistic values, readings, or world bindings. M7 therefore needs a
  small reviewed compiler reference fixture or a licensed external dataset;
  this proposal chooses the former and makes unsupported vocabulary explicit.
- The existing SpeechSynthesis port can already play any validated AudioAsset
  text, but the capability gate still allowlists one authored audio ID. Dynamic
  compilation needs a carefully bounded capability update without pretending
  Milestone 8 audio caching exists.
- The playable manifest's omit-optional semantics are intentionally
  incompatible with Structured Outputs' all-fields-required rule. A separate
  nullable draft and deterministic normalizer are mandatory, not optional
  cleanup.
- Current official OpenAI documentation recommends Structured Outputs over
  JSON mode and describes `gpt-5.6-terra` as the balanced GPT-5.6 option. Model
  access for the user's account is not established by documentation.
- The original 504-line Bunbun source names six conceptual GPT modules but did
  not contain their actual source packages. The later local capture supplies
  six configurations, but not the same six concepts: Tutor and JLPT assessment
  are absent, Story Sheet and HTML Anki are additional, and Anki responsibilities
  overlap. D-023 confirms that this is intentional and closes the M7 mapping
  question. The captured config hashes now identify the Bunbun source
  revisions. Unknown GPT-editor model, capability/action, and version-history
  fields are explicitly not inherited.
- The standalone Reverse Trainer and Visual Mnemonic configurations differ from
  the older/partial copies embedded in the Anki generator's Knowledge folder.
  M7 uses the confirmed standalone Reverse Trainer capture; the embedded copy
  remains deferred with the Anki workflow.
- The HTML Anki source has a four-column table header with a five-column data
  row. The Anki generator advertises APKG/TSV, later requires APKG only, while
  its embedded builder spec permits a CSV/media ZIP fallback. These conflicts
  require explicit resolution rather than silent normalization.

## Plan decisions

- 2026-08-12 — Recommend node:http plus one durable local FIFO worker instead
  of a framework or external queue; current scale and recovery needs do not
  justify another service.
- 2026-08-12 — Recommend a separate LessonContentDraft 0.1.0 schema and pure
  normalizer; never send the playable manifest schema directly to Structured
  Outputs or relax its optional semantics.
- 2026-08-12 — Recommend `gpt-5.6-terra` at medium reasoning with no automatic
  model fallback and at most two provider calls per job.
- 2026-08-12 — Recommend a project-authored technical reference fixture for M7
  and explicit reading input for unknown vocabulary; defer external datasets
  until their content and license are reviewed.
- 2026-08-12 — Recommend the single environment name `OPENAI_API_KEY`; it is
  not approved or used until the user explicitly confirms it.
- 2026-08-12 — Keep the technical support locale `vi` and park_small profile as
  M7 fixtures. D-026 separately owns the later N5 Vietnamese production
  vertical slice.
- 2026-08-12 — Require source capture, review, versioning, evaluation fixtures,
  and user approval through `docs/AI_MODULES.md` before porting a Custom GPT
  behavior. Do not replace a missing module with an undocumented generic
  prompt. Compose approved M7 modules in one structured request rather than
  running separate agents.
- 2026-08-12 — Accept D-023: use Story Sheet for premise/story/setting, Story
  Coach for bounded hints/scaffolds/pedagogical cadence/feedback, and Reverse
  Trainer for phrase analysis/reverse recall/practice content. Keep primitive
  sequence and difficulty progression deterministic. Keep images/APKG as
  style/output examples only, never lesson/reference/evaluation data.
- 2026-08-12 — Accept D-024 and the `docs/ai-modules/` 0.1.0 adaptation pack.
  Compose
  compiler envelope → Story Sheet → Reverse Trainer → Story Coach → strict
  output schema in one request. Use config and prompt SHA-256 values for
  provenance, fifteen text-only behavioral fixtures, no model tools, and no
  binary examples.

## Validation

### Static and automated checks

Run from `/home/nunu/Desktop/nnlab/nn-bunbun` after `nvm use` with Node.js
24.18.0/npm 11.16.0:

1. `npm run schema:check`
   - All public contract artifacts and the Structured Outputs draft artifact
     match TypeBox source.
2. `npm run typecheck`
   - Contracts, server, web source, and test tooling compile without errors.
3. `npm run lint`
   - New compiler, job, API, and UI code passes repository lint rules.
4. `npm run format:check`
   - Supported source/config/README files use repository formatting.
5. `npm test`
   - Contract, SQLite, HTTP, compiler, provider-port, and web tests pass; no
     test performs a real OpenAI request. Prompt-module fixtures prove the
     approved module IDs, versions, composition order, and responsibilities.
6. `npm run inspect:manifest -- <compiled-fixture-path> <catalog-path>`
   - A deterministic compiled fixture passes full package validation.
7. `npm run build`
   - Contracts, server, and web production outputs build successfully; record
     web size changes and the existing Vite warning honestly.
8. Start the local server with no provider key and run HTTP smoke checks.
   - Health, existing compiled package access, authored demo, evidence APIs,
     JSON 404, and `COMPILER_NOT_CONFIGURED` remain correct.
9. Run privacy scans over source, fixtures, generated schemas, test output, and
   inspected SQLite metadata.
   - No provider secret, Custom GPT action credential, private ChatGPT
     conversation, hidden reasoning, or learner gameplay TYPE value is present.
10. Docker build is not applicable because D-015 intentionally keeps
    Dockerfiles absent until local release-candidate acceptance.

Automated browser E2E tooling remains excluded by D-011.

### Manual happy path

1. Set `OPENAI_API_KEY` in the user's local shell without sharing or committing
   its value, then run the normal local development command.
2. Open the compiler view and confirm the authored demo and any existing
   compiled lessons are distinct choices.
3. Enter a reviewed vocabulary target such as 犬 and compile.
4. Confirm one durable job moves from queued/running to succeeded, displays no
   secret/prompt details, and exposes a Play action.
5. Play the generated lesson through its complete authored path, including
   wrong, correct, help, audio replay, and completion behavior.
6. Confirm evidence persists once and reload offers the normal resume behavior.
7. Compile a grammar target and verify the generated lesson is still limited
   to registered park IDs and fixed primitives.
8. Submit the identical normalized target request again and confirm it returns
   the cached lesson without a visible new compilation.
9. Restart the server without provider access, select the compiled lesson, and
   confirm it validates, resumes, and plays without an LLM call.

### Manual edge cases

1. Submit blank, whitespace-only, duplicate, oversized, markup-like, and more
   than three targets; confirm local/server validation is specific and no job
   reaches the provider.
2. Submit an unknown vocabulary term without reading; confirm the server asks
   for a reading rather than inventing one. Add a reading and confirm the
   request can proceed.
3. Attempt a kanji target and confirm M7 rejects it as unsupported.
4. Start without `OPENAI_API_KEY`; confirm the server and authored/cached play
   still work while new compilation shows `COMPILER_NOT_CONFIGURED`.
5. Disconnect the network during compilation; confirm a bounded visible
   failure, no partial lesson, and no repeated background billing loop.
6. Double-click Compile and reload the page while a job is running; confirm one
   durable job is observed and polling resumes without duplicate creation.
7. Stop the server during a running job, restart it, and confirm the old job is
   marked interrupted/failed rather than automatically calling OpenAI again.
8. Exercise an injected invalid/refusal/incomplete provider result through
   focused tests and confirm the browser receives only stable safe errors.
9. Open Reset local data, cancel once, then confirm deletion. Verify compiler
   requests/jobs/packages and evidence disappear while migrations remain.

### Manual regression

1. Play the explicit authored eight-primitive demo and repeat the complete
   Milestone 5 happy path.
2. Verify compiled and authored packages both pass client package/capability
   validation before renderer startup.
3. Verify EXPLORE cards remain compact and the world remains visibly
   interactive; INTERACTION overlays still isolate canvas input.
4. Repeat renderer fallback, resize, background/resume, persistence failure,
   and local-data panel checks relevant to Milestones 3 through 6.
5. Confirm compilation activity does not run during gameplay or produce frame
   stalls after the lesson starts.
6. Record renderer, first-stimulus, compilation duration, provider attempts,
   and cache-hit observations without inventing values.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Real target compilation and play | Pending | Pending | Not run | Awaiting implementation and user validation |
| Grammar and custom-reading target | Pending | Pending | Not run | Awaiting implementation and user validation |
| Cache and provider-independent replay | Pending | Pending | Not run | Awaiting implementation and user validation |
| Missing key, network, restart, and duplicate submit | Pending | Pending | Not run | Awaiting implementation and user validation |
| Privacy, reset, and local persistence | Pending | Pending | Not run | Awaiting implementation and user validation |
| Authored M5 and renderer regression | Pending | Pending | Not run | Awaiting implementation and user validation |

## Recovery and compatibility

Migration 2 is forward-only, checksummed, transactional, and covered by a real
temporary SQLite reopen test. Existing migration 1 databases gain compiler
tables without rewriting evidence rows or changing existing lesson revisions.
A newer or checksum-mismatched database still fails closed.

Successful lesson revisions are immutable. A failed job never points to a
partially inserted revision. Re-running the same request ID returns its job;
re-running an identical successful cache key returns its stored package.
Changing compiler, prompt, model, catalog, runtime profile, or reference
version changes the cache key and creates the next revision within the same
target lineage.

The server remains usable without provider configuration. Existing compiled
lessons and the authored demo never depend on a provider call. A provider
failure affects only its job. Process restart does not auto-repeat RUNNING
work. The user can submit a new explicit request after reviewing the failure.

Reset local data remains destructive only after confirmation and expands to
compiler-local target requests and packages because those are user data. The
migration ledger remains. This behavior must be called out in the confirmation
copy and manual matrix.

If implementation must be reverted before acceptance, the new code and routes
can be removed while migration 2 tables remain harmless. Do not edit or delete
an applied migration. A later cleanup requires a new forward migration.

## Documentation updates

- Change proposed D-022 to Accepted only after explicit user approval; leave it
  Proposed otherwise.
- Correct CURRENT_STATE's stale “content-library growth” wording to “Lesson
  compiler with Structured Outputs.”
- Update BUNBUN_ARCHITECTURE.md with compiler job, draft normalization,
  provider, cache, API, and privacy boundaries after approval.
- Keep `docs/AI_MODULES.md` current with captured source revisions, approved
  adaptations, module versions, routing, and evaluation ownership.
- Add a focused compiler specification documenting request, job, draft,
  normalization, retry, cache, provenance, errors, and provider disclosure.
- Update LESSON_MANIFEST.md only to describe the compiler boundary; do not
  change playable contract 0.1.0 semantics.
- Update PERFORMANCE.md with measured build size and user-reported compilation
  and runtime observations.
- Update README.md with configuration names and local compiler flow without
  storing a secret value.
- Keep CURRENT_STATE.md, ROADMAP.md, plans/README.md, and this plan current at
  every lifecycle transition.
- Add a durable shared-memory record after plan approval, implementation
  handoff, and final user acceptance without recording secret values.

## Outcomes

No compiler implementation outcome exists. D-027 preserves D-022 and this
ExecPlan as inactive M7 v1; neither is approved, superseded, or eligible for
implementation while M7 v3 research is active. D-026 and the later
audio-complete showcase plan remain approved but do not select an M7 provider
strategy. Milestone 7 phase 0 is complete: six local GPT source configurations
and Knowledge assets are captured, D-023 resolves their identity set and
routing, and D-024 approves Prompt Adaptation Pack 0.1.0. Story Sheet, Reverse
Trainer, and Story Coach are Approved as local adaptations but are not active.
If the user later reactivates v1, all original D-022, model, reasoning,
environment-name, and ExecPlan approval gates still apply.
