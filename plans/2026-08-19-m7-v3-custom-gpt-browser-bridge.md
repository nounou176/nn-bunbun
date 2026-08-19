# Prove a local-first Custom GPT browser bridge for lesson compilation

Status: Approved for M7 v3.1 feasibility under D-028; later implementation
gated
Owner: Codex and user
Created: 2026-08-19
Last updated: 2026-08-19 21:35 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Prove whether Bunbun can reuse the user's existing Custom GPT behavior without
`gpt-5.6-terra`, `OPENAI_API_KEY`, programmatic ChatGPT login, or an undocumented
Custom GPT API.

The recommended first outcome is deliberately human-in-the-loop. The user
enters reviewed vocabulary or grammar, Bunbun prepares a versioned prompt
packet, and the user transfers it to a selected Custom GPT in ChatGPT. The user
then imports the GPT response into Bunbun. Bunbun treats the response as
untrusted, validates the exact typed module contribution locally, combines it
only with code-owned lesson decisions, and publishes a LessonManifest only
after every existing deterministic validator passes.

The first implementation checkpoint is not unattended generation. It is a
repeatable proof that the existing GPTs can satisfy a bounded contribution
contract and that invalid, prose-heavy, image-oriented, missing, or malformed
responses fail clearly without entering gameplay.

## Repository context

Milestones 1 through 6 are complete. `packages/contracts` owns strict playable
contracts and validators; `apps/server` owns local SQLite and node:http;
`apps/web` owns the deterministic lesson runtime and manually tested DOM/Three.js
boundary. There is no compiler code, AI SDK, browser automation, provider key,
production TTS, or dynamic compiled-package UI.

D-023 accepts the Story Sheet, Reverse Trainer, and Story Coach responsibility
map and currently requires one composed structured request rather than three
independent GPT calls. D-024 approves the local Prompt Adaptation Pack 0.1.0,
its exact prompt hashes, typed contribution contract, and fifteen text-only
evaluation fixtures. D-027 preserves the old Responses API design as M7 v1,
records local self-built LLM work as M7 v2, and makes this M7 v3 browser bridge
the active research direction. D-028 accepts the v3.1 manual → v3.2 WXT → v3.3
MCP sequence and approves this plan through the v3.1 Story Sheet feasibility
gate only.

The Git-ignored `gpts/` directory contains the six captured user-owned GPT
configurations and Knowledge examples. The three M7 GPTs were designed for
interactive ChatGPT workflows, not strict machine import: Story Sheet normally
creates stories and worksheets/images; Reverse Trainer produces long sentence
analysis; Story Coach uses an iterative five-minute coaching loop. Their local
adaptations remove those unrelated behaviors, but direct use of the original
GPTs has not been evaluated against the Bunbun contribution contract.

Current OpenAI developer documentation does not expose a documented Custom GPT
ID invocation endpoint in the API reference. Workspace Agent triggers are a
different token-authenticated product and currently do not return the response
through the trigger API. ChatGPT MCP/plugin development can reach a local
service only through public HTTPS or Secure MCP Tunnel. These observations are
recorded with sources in `docs/M7_VARIANTS.md`.

The inactive M7 v1 plan remains at
`plans/2026-08-12-structured-lesson-compiler.md`. The approved audio-complete
showcase plan remains queued after an accepted M7 strategy has delivered the
compiler prerequisite.

## Scope

### In scope

- Reuse the code-owned `LessonAuthoringEnvelopeInput` and disjoint contribution
  shapes in `docs/ai-modules/CONTRACT.md` as the provider-independent boundary.
- Begin with one Story Sheet feasibility gate because it is closest to the
  required story contribution and also exposes the strongest direct-GPT risk:
  its source instructions normally continue into image/worksheet generation.
- Use the existing three expected and two rejected Story Sheet evaluation
  fixtures, then test Reverse Trainer and Story Coach only after the first gate
  passes or the user explicitly chooses a broader experiment.
- Create versioned export packets containing only normalized targets, compact
  reviewed world facts, code-owned slots/budgets, the requested module output
  schema, a request identifier, and explicit JSON-only/no-image/no-tool
  instructions.
- Create a local import boundary that accepts pasted or selected JSON text,
  rejects unknown fields and malformed/missing contributions, and shows stable
  diagnostics without attempting semantic repair.
- Keep GPT source links and any future launch configuration outside Git. A
  browser launch must result from an explicit user gesture and must not expose
  cookies, session state, or credentials to Bunbun.
- If separately approved, add a browser-assisted launcher that opens one
  locally configured GPT URL and copies or downloads its packet. Return import
  remains user-controlled in the first version.
- Preserve deterministic ownership of references, world selection, primitive
  sequence, difficulty, candidates, answer truth, IDs, transitions, attempt
  limits, timing, budgets, normalization, persistence, and final validation.
- Preserve the authored demo and all existing persistence/runtime behavior.
- Add focused contract, parser, validation, state-machine, SQLite/HTTP, and web
  unit or integration tests that use authored responses only.
- Provide a manual ChatGPT/browser/gameplay checklist under D-011.

### Out of scope

- `gpt-5.6-terra`, the OpenAI Responses API, `OPENAI_API_KEY`, or another model
  API/provider key.
- Training, fine-tuning, serving, or benchmarking the M7 v2 local LLM.
- Programmatic ChatGPT sign-in, password handling, cookie extraction, browser
  profile reuse, response DOM scraping, Playwright/CDP automation, CAPTCHA
  handling, or unattended generation.
- A browser extension, userscript, Custom GPT action, ChatGPT plugin/MCP
  connection, public tunnel, Secure MCP Tunnel, Workspace Agent token, or GPT
  editor mutation in the first implementation.
- Importing raw Markdown, images, files, or freeform prose through a heuristic
  or model-based parser. The first contract accepts exact JSON only.
- Uploading local GPT source files, Knowledge images, APKG data, learner
  evidence, TYPE answers, progress, checkpoints, or identity data.
- More than one manual repair packet per module unless a later decision changes
  the budget.
- Runtime AI, new primitives, production TTS/audio, world assets, Docker,
  deployment, hosting, or automated browser E2E.

## Decisions and constraints

- D-001 through D-008 keep learning density, deterministic runtime, fixed
  primitives, and media generation outside ordinary gameplay.
- D-010 makes repository documentation the durable source of truth.
- D-011 keeps browser and gameplay testing manual. It also prevents adding a
  Playwright browser-automation proof as an incidental test.
- D-013 and D-017 keep LessonManifest 0.1.0 strict. Browser-sourced output is a
  draft contribution, never a playable manifest.
- D-015 prevents public deployment work before local release-candidate
  acceptance. A later tunnel experiment requires explicit scope review.
- D-021 keeps gameplay evidence and progress local and outside authoring
  packets.
- D-023 currently conflicts with sequential direct use of three Custom GPTs.
  Implementation beyond a single-module feasibility spike requires a new
  accepted decision that either revises the one-composed-request rule or
  selects a dedicated bridge-mode GPT.
- D-024's module responsibilities, hashes, fixtures, deterministic validation,
  and privacy boundaries remain the comparison baseline even when the original
  GPT UI is used.
- D-027 authorizes the research direction. D-028 approves the no-code,
  user-operated v3.1 Story Sheet feasibility gate. Full manual-bridge code still
  requires the post-gate orchestration and privacy decisions in milestone 2.
- D-028 keeps v3.2 WXT and v3.3 MCP conditional. Neither may be pulled into this
  plan without a separate approved scope and security review.
- No new environment-variable name is proposed. Any future URL, token, tunnel,
  or browser-profile configuration requires user confirmation before use.

## Implementation approach

Separate the local compiler core from the external authoring transport. The
core builds a canonical `ContributionRequestPacket` from deterministic inputs
and serializes it as readable JSON plus a short wrapper instruction. The packet
identifies one module, one request, one contract version, the approved source
and adaptation versions, the allowed contribution schema, and a hash of the
canonical payload. It contains no executable instruction from learner input.

The browser view first offers Copy packet and Download packet. The user opens
the relevant Custom GPT independently for the first feasibility cycle. A later
explicitly approved enhancement may add Open GPT, using only a local ignored
URL configuration and a direct user click. Bunbun never observes the ChatGPT
page or login session.

The user pastes or selects the returned JSON. The server repeats parsing and
strict validation, confirms request/module/version/hash identity, and stores
the accepted contribution or stable diagnostics in a durable local compilation
record. The user may export one repair packet containing only redacted
diagnostics. A second invalid response fails that module attempt. No heuristic
parser extracts JSON from commentary or Markdown in the initial version.

Only after the single-module proof passes should the project decide how to
obtain all three contributions. If the user approves sequential direct GPT
use, deterministic orchestration supplies Story Sheet context to the Reverse
Trainer packet and both accepted contributions to the Story Coach packet while
keeping answer truth and runtime planning local. If the user keeps D-023's
single-request rule, v3 must instead use a dedicated bridge-mode GPT or the
approved local prompt composition in one manually operated ChatGPT session.

Accepted contributions feed the same pure normalizer, package validators,
runtime capability gate, immutable revision persistence, client revalidation,
fingerprint, resume, and gameplay flow intended for every M7 strategy. The
transport remains replaceable; the game never knows that a browser was used.

## Milestones

### 0. Record variants and complete the initial research audit

Create D-027, `docs/M7_VARIANTS.md`, this proposed ExecPlan, and updates to the
architecture, AI registry, roadmap, state, and plan index. Preserve M7 v1
without approving it and keep M7 v2 research-only.

Observable checkpoint: future sessions can distinguish all three versions,
their credentials, status, common invariants, and active plan without chat
history.

### 1. Run a no-code Story Sheet feasibility gate

Prepare one exact versioned Story Sheet packet from an existing approved
evaluation fixture. The user manually runs it in the existing Story Sheet GPT
and returns the raw result. Evaluate the three expected and two rejected cases
for JSON-only compliance, unwanted image/tool behavior, schema completeness,
world/target discipline, and repeatability. Do not store private conversation
history; retain only the requested packet, imported response needed for the
evaluation, stable diagnostics, and user-reported result under the approved
privacy scope.

Observable checkpoint: direct Story Sheet use is classified as viable,
viable only with a revised bridge mode, or unsuitable. No app code or GPT
configuration changes are required for this gate.

### 2. Accept the v3 orchestration decision

Based on the feasibility result, record a new decision choosing one of:

- sequential user-mediated use of the three existing GPTs, explicitly revising
  D-023;
- one dedicated bridge-mode GPT revision using the approved three-module
  responsibilities; or
- one manual ChatGPT session driven by the repository-owned prompt adaptation
  pack, with existing GPTs retained as provenance/evaluation sources.

Also approve JSON-only import, repair count, target disclosure, local GPT-link
storage, and whether the first implementation includes Open GPT.

Observable checkpoint: the provider flow, privacy copy, and configuration
surface are unambiguous and accepted before code.

### 3. Lock provider-independent packet and import contracts

Add strict versioned request-packet, contribution-import, compilation-state,
and diagnostic schemas under `packages/contracts`. Generate artifacts and
prove unknown fields, altered hashes, wrong module versions, prose/Markdown,
missing fields, unsafe text, and oversized input fail deterministically.

Observable checkpoint: authored valid packets and responses round-trip; every
invalid fixture fails with the expected stable code without a browser.

### 4. Add durable local browser-bridge compilation state

Add a checksummed forward SQLite migration and server services for packet
creation, contribution import, one bounded repair, interruption recovery,
immutable accepted contributions, and eventual lesson revision publication.
Expose closed node:http routes; keep reset, privacy inspection, body limits,
idempotency, and existing evidence APIs correct.

Observable checkpoint: temporary-database and HTTP tests complete a fully
authored fake bridge job through accepted contribution and reject replayed,
altered, stale, or invalid responses.

### 5. Add the manual bridge UI

Add the pre-game target form, disclosure, Copy/Download packet controls,
Paste/Import response, diagnostics, bounded repair packet, durable progress,
and authored-demo choice. Include Open GPT only if milestone 2 explicitly
approved local link storage and user-triggered launch.

Observable checkpoint: focused web tests cover packet state, duplicate import,
invalid text, restart/resume, failed contribution, accepted fake contribution,
and authored-demo regression without contacting ChatGPT.

### 6. Compose, normalize, persist, and play

Implement the accepted orchestration for all required module contributions,
then normalize and validate the resulting LessonManifest through the shared
server and browser gates. Persist an immutable revision and enter the existing
resume/evidence/runtime flow.

Observable checkpoint: an authored three-contribution test bundle produces a
playable technical lesson; a missing or invalid contribution never publishes a
partial lesson.

### 7. Verify and hand off manual acceptance

Run schema drift, typecheck, lint, format, tests, fixture inspection, build,
SQLite/HTTP smoke, and privacy scans. Hand off the user-run Custom GPT/browser
and gameplay matrix, record only actual results, and update durable docs.

Observable checkpoint: all non-browser checks pass and the user can verify the
full bridge without sharing an account credential or API key.

## Progress

- [x] 2026-08-19 21:10 — Read the required repository specifications, active
  v1 plan, local GPT registry/configurations, Prompt Adaptation Pack contract,
  local research note, and relevant shared-memory records.
- [x] 2026-08-19 21:10 — Review current official OpenAI API, Workspace Agents,
  and ChatGPT MCP/plugin documentation for programmatic and browser-side paths.
- [x] 2026-08-19 21:10 — Record accepted D-027 and create the three-strategy
  registry plus this v3 plan.
- [x] 2026-08-19 — Accept D-028 and approve this ExecPlan through its
  single-module no-code v3.1 feasibility gate.
- [x] 2026-08-19 — Prepare and locally validate Run 001 from
  `story_sheet_find_dog_single_target`, including its user-operated runbook and
  canonical input SHA-256
  `56a69ce3153d3ad7e7fcc5e4502340a78246cd416cec9a4c1195b018dd38da6c`.
- [x] 2026-08-19 — Retain and evaluate the exact Run 001 response. Structural
  JSON, identities, key sets, beat order, target-surface assignment,
  prohibited-output scan, and budgets pass; strict world-fact discipline fails.
  Two user observations remain unresolved.
- [ ] Run milestone 1 with the user and record only the supplied raw result and
  reported observations allowed by the agreed privacy boundary.
- [ ] Accept the milestone 2 orchestration decision before implementation.
- [ ] Implement milestones 3 through 7 in dependency order.

## Surprises and discoveries

- The local world-repository research contains useful Three.js subsystem work
  but no accepted Custom GPT/browser bridge research.
- The current public API reference does not document invocation of a captured
  user Custom GPT ID. Direct API access therefore cannot be assumed for v3.
- Workspace Agent triggers are a distinct token-authenticated path and the
  current trigger API cannot retrieve the agent response, so they do not solve
  the initial Bunbun import loop.
- ChatGPT can connect to MCP in developer mode, but current documentation
  requires public HTTPS or Secure MCP Tunnel. That is a later network/security
  decision, not a zero-configuration local shortcut.
- Direct original-GPT reuse is not equivalent to the approved prompt pack.
  Story Sheet is image/worksheet-oriented, while Reverse Trainer and Story
  Coach are long interactive teaching flows. JSON-only direct contribution is
  an empirical question that must be tested before building a bridge around it.
- Sequential direct use of the three GPTs conflicts with D-023's accepted
  one-composed-request rule. The user must explicitly revise that rule or
  choose a single bridge-mode conversation before full v3 implementation.
- Contract 0.1.0 supplies limits for individual story beats but does not carry
  explicit title, objective, premise, setting-context, or synopsis limits in
  `LessonAuthoringEnvelopeInput`. Run 001 therefore declares conservative
  feasibility-only response limits outside the input envelope; milestone 3
  must resolve the production shape separately.
- Run 001 also exposes ambiguity between catalog-backed world claims and safe
  narrative-only relations or emotions. Its original strict packet rejects the
  inferred dog/cat position and guide relief; a later decision must define the
  production boundary without retroactively changing this evidence.

## Plan decisions

- 2026-08-19 — Preserve M7 v1 unchanged and inactive; do not repurpose its
  proposed plan as v3.
- 2026-08-19 — Keep M7 v2 as research backlog until model, hardware, runtime,
  licensing, and eval evidence exist.
- 2026-08-19 — Recommend manual file/clipboard transfer as the first v3 proof
  because it requires no key, login automation, tunnel, extension, or runtime
  provider dependency.
- 2026-08-19 — Recommend exact JSON-only import for the first proof. A response
  containing fences, commentary, or images fails visibly instead of being
  heuristically repaired.
- 2026-08-19 — Recommend one Story Sheet module gate before three-module
  orchestration because its direct source behavior presents the clearest
  feasibility risk.
- 2026-08-19 — Keep browser automation, browser extensions, Custom GPT actions,
  plugins/MCP, tunnels, and Workspace Agent triggers outside the first plan.
- 2026-08-19 — Accept the v3.1 manual → v3.2 WXT → v3.3 MCP promotion order.
  Later stages remain conditional and require separate approval.

## Validation

### Static and automated checks

After implementation approval, run from
`/home/nunu/Desktop/nnlab/nn-bunbun` with Node.js 24.18.0/npm 11.16.0:

1. `npm run schema:check`
   - Bridge and contribution artifacts match their schema sources.
2. `npm run typecheck`
   - Contracts, server, web source, and test tooling compile.
3. `npm run lint`
   - Packet, import, orchestration, persistence, and UI code passes lint.
4. `npm run format:check`
   - Tracked source and documentation formatting passes.
5. `npm test`
   - Contract, parser, compiler, SQLite, HTTP, controller, and web tests pass;
     no test opens ChatGPT or makes a model request.
6. `npm run inspect:manifest -- <compiled-fixture-path> <catalog-path>`
   - An authored bridge fixture produces a valid package.
7. `npm run build`
   - Contracts, server, and web production builds pass; bundle changes and the
     known Vite warning are reported honestly.
8. Run local server/HTTP smoke and privacy scans.
   - Existing health/evidence/404 behavior works; no GPT link, cookie, token,
     private chat, TYPE response, or learner progress enters tracked artifacts.
9. Docker build is not applicable because D-015 intentionally keeps
   Dockerfiles absent before local release-candidate acceptance.

Automated browser E2E remains excluded by D-011.

### Manual happy path

1. Start Bunbun with no OpenAI environment variable or provider SDK.
2. Enter one reviewed target and create the selected module packet.
3. Copy or download the packet and verify its disclosure and contents.
4. Open the user-owned GPT manually, transfer the packet, and obtain a result.
5. Import exact JSON and confirm Bunbun reports the matching module, request,
   contract, and accepted state.
6. Complete the approved orchestration, publish the validated lesson, and play
   it through the existing deterministic runtime.
7. Reload and confirm accepted bridge state, immutable lesson revision,
   evidence, and resume behavior remain local and stable.

### Manual edge cases

1. Import blank text, prose, fenced JSON, malformed JSON, an image response,
   unknown fields, wrong module/request IDs, altered hashes, or oversized text;
   confirm specific rejection and no partial publication.
2. Close or reload Bunbun before import; confirm the pending packet resumes.
3. Import the same accepted response twice; confirm idempotent behavior.
4. Import a response for a stale or different packet; confirm fail-closed.
5. Use one repair packet after stable diagnostics, then return another invalid
   response; confirm the attempt fails without an unlimited loop.
6. Cancel before exporting or importing and confirm no ChatGPT access occurs.
7. Verify the authored demo remains playable when ChatGPT is unavailable.

### Manual regression

1. Repeat the authored eight-primitive lesson and persistence/resume flow.
2. Confirm client structural, semantic, capability, and fingerprint validation
   still run before renderer startup.
3. Confirm compiler UI never overlays or drives ordinary gameplay.
4. Repeat relevant renderer fallback, resize, background/resume, input
   isolation, persistence failure, and local-data reset checks.
5. Confirm no browser automation process, hidden login, API request, public
   tunnel, or provider key is started by Bunbun.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Story Sheet direct JSON feasibility | Pending | Pending | Not run | Requires plan approval and user-operated GPT |
| Rejected/malformed output behavior | Pending | Pending | Not run | Requires plan approval |
| Full accepted v3 orchestration | Pending | Pending | Not run | Blocked by milestone 2 decision and implementation |
| Authored runtime/persistence regression | Pending | Pending | Not run | Awaiting implementation |

## Recovery and compatibility

M7 v3 adds no change to LessonManifest 0.1.0 or existing evidence semantics.
Every new contract is independently versioned. Any SQLite change is forward-
only, checksummed, transactional, and covered by temporary reopen tests.
Accepted lesson revisions remain immutable.

A pending packet can be resumed or explicitly abandoned. An invalid import
cannot create a lesson revision. Accepted contributions record their source
module, source/adaptation version, packet hash, import time, and diagnostics;
they do not store a ChatGPT cookie, credential, hidden reasoning, or full
private conversation. Reset behavior must explicitly describe whether it
deletes packets, contributions, and compiled lessons before implementation.

If direct Custom GPT feasibility fails, no runtime rollback is needed. Keep the
evaluation result, mark the route unsuitable, and return to the milestone 2
choice among a bridge-mode GPT, manual composed prompt pack, M7 v1, or M7 v2.
Do not weaken schemas or scrape ChatGPT to hide the failure.

## Documentation updates

- Keep D-027 and `docs/M7_VARIANTS.md` current.
- Add the milestone 2 orchestration decision before implementation.
- Update `docs/AI_MODULES.md` with direct-GPT feasibility and activation state.
- Update `docs/BUNBUN_ARCHITECTURE.md` and `docs/LESSON_MANIFEST.md` without
  changing playable contract 0.1.0 semantics.
- Add a focused bridge/compiler contract document when milestone 3 begins.
- Update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `plans/README.md`, README,
  and this plan at every lifecycle transition.
- Record meaningful milestones in shared memory without secrets, GPT links,
  cookies, tokens, or private conversations.

## Outcomes

The three M7 strategies and accepted staged v3 route are documented. V3.1 is
approved through its no-code Story Sheet feasibility gate. No
compiler, packet contract, UI, persistence migration, browser launch,
automation, GPT edit, external connection, dependency, or environment variable
has been implemented. The next action is to prepare and run the approved
single-module manual feasibility gate with the user.
