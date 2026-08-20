# Prove the M7 v3.2 Skills-only lesson-authoring plugin

Status: Complete; conditionally viable with reviewed local JSON file import selected
Owner: Codex and user
Created: 2026-08-19
Last updated: 2026-08-20 11:50 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Create the smallest local personal ChatGPT/Codex plugin that exposes one
`bunbun-lesson-authoring` Skill. The user deliberately gives that Skill one
versioned Bunbun authoring packet, receives one exact typed contribution, and
validates it locally without `OPENAI_API_KEY`, an MCP server, a browser
extension, a new hosted Custom GPT, or an LLM call during gameplay.

The first proof uses an authored evaluation packet and contains no real learner
history. Success means the plugin can reproduce the approved Story Sheet,
Reverse Trainer, and Story Coach responsibilities in one request while the
repository remains the source of truth and local code remains the authority
that accepts or rejects the result.

## Repository context

Milestones 1 through 6 are complete. LessonManifest, CatalogSnapshot, runtime
capability validation, local evidence persistence, and deterministic gameplay
already exist. No compiler or plugin exists.

The relevant durable sources are:

- D-023 and D-024 in `docs/DECISIONS.md`;
- D-031, which selects this Skills-only route;
- `docs/AI_MODULES.md` and `docs/ai-modules/CONTRACT.md`;
- the three approved 0.1.0 prompt modules and fifteen text fixtures under
  `docs/ai-modules/`;
- `gpts/README.md` and the Git-ignored captured source configurations; and
- the provisional v3.1 evidence under `docs/ai-modules/feasibility/`.

The six captured GPTs are not six M7 agents. The first plugin uses only the
three approved lesson responsibilities. Visual Mnemonic, HTML Anki, and JLPT N3
Anki Deck Generator remain outside this plan.

## Scope

### In scope

- One repository-owned personal plugin source package.
- One learner-facing lesson-authoring Skill.
- Bundled, versioned copies or generated artifacts for the three approved M7
  prompt modules, with a deterministic drift check against their authoritative
  repository sources and hashes.
- One strict versioned request packet and one strict contribution result
  boundary sufficient for the fixed proof.
- Local structural validation and stable diagnostics for the Skill result.
- Authored success, malformed-output, identity/hash-mismatch, prohibited-data,
  and prompt-version-drift fixtures.
- A user-operated installation/reload and ChatGPT/Codex invocation runbook.
- Manual proof on one authored packet, followed by the relevant approved module
  fixtures if the first result passes.

### Out of scope

- Full Bunbun compiler jobs, SQLite compiler migrations, or learner target UI.
- Real learner target transmission during the first proof.
- Invocation of the six hosted Custom GPT objects or creation of another GPT.
- Visual Mnemonic, image generation, HTML/Anki output, APKG generation, or JLPT
  assessment.
- MCP, connectors, actions, browser extensions, WXT, Playwright/Puppeteer,
  cookies, login automation, public endpoints, tunnels, or provider SDKs.
- `OPENAI_API_KEY`, another provider credential, a new environment variable,
  or API-key billing.
- Marketplace publication, organization-wide distribution, deployment, or
  Docker.
- Changes to LessonManifest 0.1.0, the eight gameplay primitives, or ordinary
  runtime behavior.

## Decisions and constraints

- D-002 keeps AI outside ordinary gameplay and the render loop.
- D-011 keeps browser and gameplay testing manual.
- D-015 defers Docker and deployment until local release-candidate acceptance.
- D-023 keeps one composed request and three disjoint lesson responsibilities.
- D-024 fixes module versions, hashes, order, fixtures, and privacy rules.
- D-029's two-of-five direct-GPT result stays provisional and is not converted
  into a pass by this plan.
- D-031 selects one Skills-only personal plugin and keeps WXT/MCP out.
- Plugin output is untrusted authored content. It cannot assign runtime truth or
  publish a lesson without local validation.
- ChatGPT/Codex plan availability and usage limits are external account state.
  The implementation must provide a manual unavailable-surface fallback and
  must not claim unlimited or universally included usage.
- No environment-variable name or secret is introduced.

## Implementation approach

Add a narrow plugin package under a repository-owned directory selected during
implementation after reading the current plugin and skill authoring
instructions. It contains the required plugin manifest and exactly one primary
Skill. The Skill accepts only a versioned Bunbun request packet, applies the
three approved module responsibilities in D-024 order, and returns exactly one
typed contribution object. It must not emit Markdown fences, images, files,
tool instructions, or gameplay code.

The authoritative prompt modules remain under `docs/ai-modules/`. If the
plugin must bundle standalone reference files, generate or copy them in a
reproducible way and add a check that fails when content or approved hashes
drift. Do not read the raw Git-ignored GPT library at invocation time and do not
package its images, APKG, links, or private source captures.

Add the smallest local validator/inspection path needed to parse the returned
object, reject unknown fields and identity/version/hash mismatches, and emit
stable diagnostics. The proof stops at an accepted contribution; application
compiler persistence, normalization into a complete LessonManifest, and UI are
owned by a later approved implementation plan after this transport proof.

The user installs or reloads the personal plugin through the supported product
surface and runs the prompt manually. Codex does not modify the user's ChatGPT
account or claim a manual result that the user has not reported.

## Milestones

### 1. Lock the proof contract

Define the fixed request and contribution shape, limits, identities, prompt
versions, hash semantics, disclosure copy, strict-JSON behavior, and at most one
proposed repair cycle. Resolve the world-fact ambiguity exposed by v3.1 Run 001
without retroactively altering that evidence.

Observable checkpoint: authored valid and invalid fixtures produce exact,
stable local validator outcomes without ChatGPT.

### 2. Scaffold the personal plugin and Skill

Create the minimal valid plugin manifest, one Skill, its narrowly selected
references, and installation documentation. Add no MCP or other plugin
capability.

Observable checkpoint: the package structure validates locally, contains no
secret or excluded GPT assets, and its bundled prompt material matches D-024.

### 3. Run the fixed user-operated proof

The user installs/reloads the plugin, starts a fresh supported ChatGPT/Codex
conversation, invokes the Skill with the fixed authored packet, and returns the
raw result plus whether any unexpected file/image/tool behavior occurred.

Observable checkpoint: local inspection accepts the exact typed result or
returns stable diagnostics. No result is inferred when the product surface is
unavailable.

### 4. Evaluate and choose the application handoff

Run the relevant text-only module fixtures, record actual results, and decide
whether the next implementation uses manual file/clipboard import or promotes a
more direct handoff. MCP remains a separate v3.3 decision.

Observable checkpoint: the plugin route is classified as viable, conditionally
viable, or unsuitable with retained evidence and a named next action.

## Progress

- [x] 2026-08-19 22:53 — Accept D-031 and create this proposed successor plan.
- [x] 2026-08-19 23:03 — User approved the M7 v3.2 ExecPlan.
- [x] 2026-08-19 23:15 — Implement closed request/result TypeBox schemas,
      canonical identity checks, claim-level world traceability, generated success
      and rejection fixtures, stable semantic validation, and the local inspector.
- [x] 2026-08-19 23:20 — Scaffold and validate `bunbun-authoring@0.1.0`
      with exactly one `bunbun-lesson-authoring` Skill, three locked prompt
      fragments, generated schema references, and no MCP/app capability.
- [x] 2026-08-19 23:23 — Pass prompt drift/media/secret scan, official Skill
      validation, official plugin validation, and all 30 contract tests.
- [x] 2026-08-20 — User installs `bunbun-authoring@0.1.0`, invokes the fixed
      packet, and returns one strict JSON response accepted by the local
      exchange inspector.
- [x] 2026-08-20 — User confirms a new conversation, a finished response, and
      no unexpected plugin-initiated image, file, or tool flow. The initial
      `yes` referred only to the required `valid-request.json` input attachment.
- [x] 2026-08-20 — Map all fifteen D-024 fixtures to the executable contract,
      run eleven independent text-only Skill requests, accept ten, retain one
      strict-JSON rejection, and record four contract gaps.
- [x] 2026-08-20 — Accept D-033: classify the route as conditionally viable
      and select reviewed local JSON file import after a forward contract
      version closes the gaps.

## Surprises and discoveries

- The six supplied GPTs are a source library, not a six-agent compiler. Only
  three have accepted M7 responsibilities.
- The v3.1 manual gate proved transport shape only provisionally and exposed a
  world-fact discipline gap; a Skill does not remove the need for deterministic
  validation.
- A Skills-only plugin avoids a local endpoint and ChatGPT DOM coupling, but it
  still depends on plan/workspace feature availability and normal usage limits.
- The repository marketplace must live at `.agents/plugins/marketplace.json`;
  `codex plugin marketplace add` accepts the repository directory and rejects
  the JSON file path. The user made `.agents/` writable and created the required
  directory during the user-operated install.
- The shell resolves `/home/nunu/.nvm/versions/node/v22.18.0/bin/codex` first.
  That CLI is version `0.121.0` and does not expose `codex plugin add`. The
  installed `/home/nunu/.local/bin/codex` version `0.147.0` completed the plugin
  installation successfully.
- The login shell starts on Node.js 18.19.1, below the pinned engine. Validation
  used `/home/nunu/.nvm/versions/node/v24.18.0/bin` explicitly; the runbook asks
  the user to run `nvm use`.
- Four D-024 fixtures cannot be represented by request contract 0.1.0 without
  inventing compiler-owned practice text, Japanese answer truth, or runtime-
  plan fields. The attempt-2 field also lacks the prior draft and diagnostics
  required for a meaningful bounded repair.
- Ten of eleven runnable first responses pass. The remaining response is
  semantically in scope but has one trailing `}` and is correctly rejected by
  strict JSON parsing.

## Plan decisions

- 2026-08-19 — Use one primary authoring Skill, not six independent Skills or
  agents, for the first proof.
- 2026-08-19 — Keep the repository prompt pack authoritative and verify any
  plugin-bundled derivative against its approved versions and hashes.
- 2026-08-19 — Stop the first plan at validated contribution proof; do not hide
  a full compiler, persistence migration, or runtime change inside plugin setup.
- 2026-08-19 — Keep installation and invocation user-operated, with no account
  automation or external write performed by Bunbun.
- 2026-08-19 — Keep the plugin source and its local marketplace entry inside
  this repository so the durable source of truth remains reviewable; do not
  install it into a product account as part of automated implementation.
- 2026-08-19 — Resolve v3.1's world-fact ambiguity conservatively: stable claim
  IDs are compiler-owned, each beat has a claim allowlist, and each authored
  beat returns the exact claim IDs it used. Presence never implies a reaction,
  state, relation, or action.
- 2026-08-19 — Wrap the contribution in identity-bearing request/result
  packets so local code can reject request ID, canonical input hash, prompt
  order, version, or content-hash drift before any application handoff.
- 2026-08-20 — Treat unrepresentable approved fixtures as `CONTRACT_GAP`, not
  model passes, and retain exact first responses without overwrite.
- 2026-08-20 — Select reviewed local JSON file import as the first application
  handoff, gated by a forward contract version and rerun of the blocked and
  malformed cases. Do not promote MCP or clipboard as the authoritative record.

## Validation

### Static and automated checks

Run from `/home/nunu/Desktop/nnlab/nn-bunbun` using the repository's pinned
Node.js/npm versions:

1. Validate the plugin manifest and required Skill structure with the current
   supported local plugin tooling.
2. Run the prompt/reference drift check and confirm the three approved module
   versions and hashes match D-024.
3. Run focused request/result validator tests covering valid, malformed,
   unknown-field, wrong-identity, wrong-hash, oversized, and prohibited-data
   fixtures.
4. Run `npm run schema:check`, `npm run typecheck`, `npm run lint`,
   `npm run format:check`, and `npm test` when the implementation touches the
   workspace or shared contracts.
5. Run `npm run build` when application or package source is added.
6. Scan the plugin tree for keys, tokens, cookies, GPT links, learner evidence,
   raw TYPE responses, PNG/APKG files, MCP configuration, and browser-extension
   permissions.

Automated browser E2E remains excluded by D-011. Docker is not applicable under
D-015 because no Dockerfiles exist and this is not a staging handoff.

Actual local result through 2026-08-20 with Node.js 24.18.0:

- official Skill and plugin validators pass;
- `npm run plugin:check` passes with three locked modules and ten plugin files;
- `npm run schema:check` passes for 34 generated artifacts;
- `npm run typecheck`, `npm run lint`, and `npm run format:check` pass;
- `npm test` passes all 70 tests: 34 contracts, 2 server, and 34 web;
- `npm run build` passes for contracts, server, and web; the known Vite large-
  chunk warning remains; and
- the fixed authored request/result passes `npm run inspect:authoring`.

Milestone 4 adds eleven generated, validated evaluation requests and one
fifteen-case coverage ledger. Eleven independent Skill runs produced ten
accepted raw results and one `RESULT_JSON_PARSE_ERROR`; four fixtures are
explicit contract gaps. The exact matrix and raw hashes are recorded in
`docs/ai-modules/feasibility/m7-v3-2-milestone-4-evaluation.md`.

The final checks pass: 34 generated artifacts are current; typecheck, lint,
source/document formatting, plugin drift scan, `git diff --check`, all 70 tests,
and the contracts/server/web production build pass. The first sandboxed full
test run reached 34/34 contract tests and then hit `listen EPERM` at the server
HTTP test; the approved rerun with loopback access passed 34 contract, 2 server,
and 34 web tests. The build retains the known Vite large-chunk warning. The
runner refuses to overwrite retained raw evidence, contract gaps exit with a
stable diagnostic, and the malformed raw response exits nonzero without
extraction or repair.

The HTTP test required a rerun outside the filesystem/network sandbox so it
could bind `127.0.0.1`; it then passed. No product-surface result is recorded by
these local checks.

### Manual happy path

1. Install or reload the local personal plugin on a supported surface.
2. Start a fresh conversation and invoke `bunbun-lesson-authoring` with the
   fixed authored packet.
3. Confirm the response finishes as exactly one JSON object and starts no
   unexpected image, file, or tool flow.
4. Validate the raw response locally and confirm module IDs, versions, hashes,
   content sections, world facts, target assignments, and budgets pass.

### Manual edge cases

1. Omit or alter the request identity, module version, or input hash and confirm
   the Skill or local validator fails visibly.
2. Return prose, fenced JSON, an unknown field, oversized text, or an image/file
   and confirm no contribution is accepted.
3. Make the plugin surface unavailable or hit the plan limit and confirm the
   runbook falls back to a pending/manual state without publishing a lesson.
4. If one bounded repair is approved in milestone 1, return a second invalid
   result and confirm the attempt stops.

### Manual regression

1. Confirm no original GPT, GPT editor link, credential, browser extension,
   MCP server, or public endpoint is needed.
2. Confirm the existing authored game and persistence flows remain unchanged.
3. Confirm no generated contribution can bypass local validators or introduce a
   ninth primitive, arbitrary asset, URL, script, transition, or answer truth.

### Manual results

| Scenario                     | Tester  | Date       | Result              | Evidence or notes                                                                                                    |
| ---------------------------- | ------- | ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Plugin install/reload        | User    | 2026-08-20 | Pass                | Installed `bunbun-authoring@0.1.0` from local marketplace `personal`                                                 |
| Fixed authored packet        | User    | 2026-08-20 | Pass                | Exact JSON accepted; required input attachment only; no unexpected plugin-started media/tool flow                    |
| Invalid output rejection     | Codex   | 2026-08-19 | Pass locally        | Malformed, unknown-field, wrong identity/hash, drift, oversized, claim, answer-leak, and module-failure cases reject |
| D-024 runnable fixture suite | Codex   | 2026-08-20 | 10 pass, 1 rejected | Eleven independent first responses; strict JSON rejection retained without repair                                    |
| D-024 contract coverage      | Codex   | 2026-08-20 | 4 gaps              | Missing authoritative practice text, accepted Japanese text, and runtime-plan fields                                 |
| Authored runtime regression  | Pending | Pending    | Not run             | No runtime change planned                                                                                            |

## Recovery and compatibility

The plugin source is additive and removable. Removing or disabling it leaves
the authored runtime, persisted evidence, and v3.1 records unchanged. No
database migration or manifest version change occurs in this plan.

If the plugin surface is unavailable or the result fails validation, retain the
fixed packet and diagnostics, publish nothing, and classify the proof honestly.
Do not fall back to an API key, WXT, MCP, browser automation, or a generic prompt
without a new decision.

## Documentation updates

- Keep D-031, `docs/M7_VARIANTS.md`, and `docs/AI_MODULES.md` current.
- Record the final plugin/Skill paths and exact verification commands.
- Update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `plans/README.md`, and this
  plan at each lifecycle transition.
- Record only privacy-safe milestone summaries in shared memory.

## Outcomes

All four milestones are complete. The durable implementation now includes:

- `plugins/bunbun-authoring/` and `.agents/plugins/marketplace.json`;
- `packages/contracts/src/schema/authoring.ts` and
  `packages/contracts/src/validation/authoring.ts`;
- generated authoring schemas and fixtures under `packages/contracts/`;
- the fifteen-case evaluation ledger, eleven runnable packets, fixture grader,
  execution/inspection CLIs, and exact raw first-response evidence;
- `npm run inspect:authoring`, `npm run inspect:authoring-eval`,
  `npm run run:authoring-eval`, and `npm run plugin:check`; and
- `docs/ai-modules/M7_V3_2_RUNBOOK.md`.

Local validation passes. The user-installed plugin returned a strict result
that the exchange inspector accepted, and the observed media/tool gate passes.
Milestone 4 is complete with a `CONDITIONALLY_VIABLE` classification: ten of
eleven runnable fixture responses pass, one fails strict JSON parsing, and four
approved fixtures expose request-contract gaps. D-033 selects reviewed local
JSON file import after a forward contract version and rerun. No application
compiler, importer, provider connection, publication path, or runtime behavior
was added.
