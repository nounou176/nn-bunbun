# Milestone 7 Compiler Strategy Registry

Last updated: 2026-08-20

## Purpose

Milestone 7 is the provider-independent outcome that turns reviewed learner
vocabulary and grammar into a validated, revisioned LessonManifest. This file
keeps the alternative compiler strategies distinct so research on one path
does not silently approve, erase, or implement another.

D-027 accepts the three-strategy registry and makes M7 v3 the active research
direction. D-029 closes the v3.1 manual Story Sheet gate early after two of five
fixtures as provisionally viable evidence; it does not claim complete
qualification. D-031 supersedes D-028's WXT stage and selects a Skills-only
personal ChatGPT/Codex plugin as M7 v3.2 and the next implementation direction.
MCP remains conditional v3.3 work.

## Shared outcome and invariants

Every M7 strategy must follow this boundary:

Learner targets
→ deterministic normalization and reference lookup
→ code-owned world, primitive, difficulty, and budget envelope
→ untrusted authored contribution
→ typed structural validation
→ deterministic LessonManifest normalization
→ existing semantic and runtime-capability validation
→ immutable local lesson revision
→ deterministic local gameplay.

The strategy may change how authored text is obtained. It may not change these
rules:

- AI does not generate Three.js code, assets, mechanics, IDs, transitions,
  timing, answer truth, or executable behavior.
- No external response becomes playable without the same local validators.
- Ordinary gameplay never needs a browser chat, provider, model, or network.
- The renderer and interaction loop never call an LLM.
- Prompt/module versions and source identities remain explicit provenance.
- Learner progress, checkpoints, evidence, and TYPE responses are not authoring
  inputs.
- Images and APKG files in the local GPT library remain style/output examples
  only unless a later decision changes their scope.

## Strategy status

| Strategy | Provider path                                                                                                 | Current status                                                                        | Credential position                                                                                       | Durable source                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| M7 v1    | OpenAI Responses API with strict Structured Outputs                                                           | Preserved inactive proposal                                                           | Proposed `OPENAI_API_KEY`; not approved                                                                   | D-022 and `plans/2026-08-12-structured-lesson-compiler.md`                |
| M7 v2    | Self-built or locally adapted open-weight LLM running locally                                                 | Research backlog                                                                      | No remote provider credential assumed                                                                     | This registry; a future research record and ExecPlan are required         |
| M7 v3    | Captured Custom GPT behavior through a repository-owned ChatGPT/Codex skill, with optional later MCP delivery | V3.2 fixed product-surface proof accepted; broader fixtures pending; v3.3 conditional | No `OPENAI_API_KEY`; normal ChatGPT plan usage applies; any later token or tunnel needs separate approval | D-027, D-029, D-031, D-032, and `plans/2026-08-19-m7-v3-skills-plugin.md` |

## M7 v1 — OpenAI Responses API

M7 v1 is the exact proposal already recorded in D-022. It uses
`gpt-5.6-terra`, medium reasoning, the Responses API, strict Structured
Outputs, an all-required LessonContentDraft schema, at most one repair call,
durable local jobs, and deterministic normalization.

This version is intentionally frozen as a comparison baseline. The model,
reasoning setting, provider integration, environment-variable name, D-022,
and ExecPlan remain Proposed. Research or implementation of v3 must not edit
v1 into a different design.

## M7 v2 — Self-built local LLM

M7 v2 explores a model stack that runs on user-controlled local hardware and
can be adapted to Bunbun's typed authoring tasks. “Self-built” is not yet
defined as training from scratch. The future study must distinguish:

- running an existing open-weight model locally;
- prompt adaptation or retrieval over Bunbun-owned sources;
- parameter-efficient fine-tuning;
- full fine-tuning; and
- pretraining a new model.

Before an implementation plan, v2 must record the target hardware, model and
dataset licenses, inference runtime, quantization, Japanese/Vietnamese quality,
structured-output reliability, latency, memory use, reproducibility, and the
same fifteen approved module evaluations. OpenAI's current model catalog lists
open-weight `gpt-oss` models as possible research inputs, but D-027 does not
select them or any other model:

- https://developers.openai.com/api/docs/models/gpt-oss-120b

## M7 v3 — ChatGPT/Codex authoring bridge

### Local evidence available

The repository and Git-ignored local library already contain:

- six captured user-owned GPT configurations under `gpts/`;
- exact source hashes and normalized summaries in `gpts/README.md`;
- accepted Story Sheet, Reverse Trainer, and Story Coach responsibilities in
  D-023 and `docs/AI_MODULES.md`;
- Prompt Adaptation Pack 0.1.0 and fifteen text-only evaluation fixtures in
  `docs/ai-modules/`; and
- the closed contribution and privacy boundary in
  `docs/ai-modules/CONTRACT.md`.

The local `docs/additional documents/repos` research is about Three.js world
subsystems, not Custom GPT/browser integration. Shared-memory records preserve
the v1 proposal, GPT source capture, routing, and prompt-pack approval, but no
previously accepted browser bridge was found. V3 therefore begins from the
typed local assets above rather than assuming an undocumented prior solution.

### Current official product constraints

The current OpenAI API reference enumerates model, response, conversation,
file, tool, and other platform endpoints but does not document a public
endpoint that invokes one of the user's captured Custom GPT IDs. This is an
inference from the current endpoint catalog, not a claim that the product can
never add such a route:

- https://developers.openai.com/api/reference/overview

The Workspace Agents API can trigger a separately published workspace agent
with an access token, but its current documentation says the response cannot
be retrieved through that API. It is not assumed to be an API for the user's
existing Custom GPTs:

- https://developers.openai.com/workspace-agents/trigger-runs

ChatGPT plugins may contain Skills, connectors, MCP servers, browser extensions,
hooks, and tasks. The smallest selected M7 shape is a Skills-only plugin; it
needs no Bunbun MCP endpoint. Plugin and feature availability still depends on
the user's ChatGPT account or workspace:

- https://learn.chatgpt.com/docs/plugins
- https://learn.chatgpt.com/docs/pricing

If a later stage adds MCP, current documentation requires either a reachable
public HTTPS endpoint or Secure MCP Tunnel for ChatGPT access. That may support
direct ChatGPT-to-Bunbun delivery, but introduces account/workspace
availability, networking, authentication, disclosure, infrastructure cost, and
maintenance decisions that the local-first project has not approved:

- https://developers.openai.com/plugins/build/app-quickstart
- https://developers.openai.com/plugins/deploy/connect-chatgpt

### Candidate routes

| Route                                   | What it proves                                                                                                                    | Main cost or risk                                                                                                                 | V3 position                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Manual file/clipboard bridge            | Existing GPT can receive a bounded packet and return importable content without an API key                                        | Human transfer, formatting errors, no unattended generation                                                                       | Recommended first feasibility spike                                       |
| Skills-only personal plugin             | Packages the reviewed GPT-derived behaviors into one versioned ChatGPT/Codex authoring skill without an API key or local endpoint | Account/workspace availability, normal plan limits, manual result handoff                                                         | **Selected M7 v3.2; conditionally viable; reviewed file import selected** |
| Browser-assisted launcher               | Bunbun opens a reviewed GPT link after a user gesture and copies/downloads the packet                                             | Popup rules, local link configuration, still manual on return                                                                     | Candidate after the manual packet passes                                  |
| Local browser extension/userscript      | Adds copy/import affordances near ChatGPT without scraping from the Bunbun page                                                   | New extension surface, permissions, ChatGPT DOM churn                                                                             | Research-only WXT fallback                                                |
| Playwright/CDP browser automation       | Automates navigation, submission, and response capture                                                                            | Session/cookie handling, fragile selectors, product UI changes, rate limits, new dependency; no supported Custom GPT API contract | Research-only; excluded from the first plan                               |
| Custom GPT action or ChatGPT plugin/MCP | Sends structured output to Bunbun from ChatGPT                                                                                    | Requires GPT/plugin changes plus HTTPS or Secure MCP Tunnel and a reviewed auth/privacy model                                     | Conditional later spike                                                   |
| Workspace Agent trigger                 | Starts a published agent from another system                                                                                      | Different product surface, access token required, current API cannot retrieve the response                                        | Not selected for v3                                                       |

### Accepted staged route

D-031 supersedes D-028's WXT stage and sets this route:

1. **M7 v3.1 — manual direct-GPT feasibility.** Historical evidence only.
   D-029 closed the Story Sheet gate after two of five fixtures as provisional,
   with Run 001 rejected semantically, Run 002 accepted, and three fixtures
   unexecuted.
2. **M7 v3.2 — Skills-only personal plugin.** The local plugin, one authoring
   Skill, closed contracts, validator, drift gate, fixtures, marketplace
   manifest, and runbook are implemented under D-032. Installation and the
   fixed strict product-surface proof pass, including the explicit confirmation
   that only the required input attachment occurred and the plugin started no
   unexpected media or tool. D-033 records ten accepted runnable fixtures, one
   strict-JSON rejection, and four contract gaps. The route is conditionally
   viable and selects reviewed local JSON file import after a forward contract
   version closes those gaps. It reuses reviewed behavior rather than invoking
   the six hosted GPT objects and has no MCP, browser extension, provider API,
   or endpoint.
3. **M7 v3.3 — MCP bridge.** Promote only if direct delivery becomes valuable
   and a separate decision approves endpoint reachability, tunnel or hosting,
   authentication, write confirmation, privacy, and cost.

WXT, Playwright/Puppeteer, Playwright MCP, and agentic browser controllers
remain research-only. LibreChat, AnythingLLM, and similar local
reconstructions move to the M7 v2 comparison because they replace hosted model
execution rather than providing the selected ChatGPT/Codex skill surface.

### Open-source reference set

The research is informed by, but does not vendor or install, these projects:

- Skills-only plugin guidance: https://learn.chatgpt.com/docs/plugins
- Extension fallback reference: WXT, MIT — https://github.com/wxt-dev/wxt
- Other extension references: Plasmo, MIT — https://github.com/PlasmoHQ/plasmo
  and ChatGPT Exporter, MIT — https://github.com/pionxzh/chatgpt-exporter
- Browser-automation research only: Playwright, Apache-2.0 —
  https://github.com/microsoft/playwright and Browser Use, MIT —
  https://github.com/browser-use/browser-use
- M7 v3.3 references: OpenAI Apps SDK examples, MIT —
  https://github.com/openai/openai-apps-sdk-examples and the Model Context
  Protocol TypeScript SDK —
  https://github.com/modelcontextprotocol/typescript-sdk
- M7 v2 reconstruction references: LibreChat, MIT —
  https://github.com/danny-avila/LibreChat and AnythingLLM, MIT —
  https://github.com/Mintplex-Labs/anything-llm

The archived reverse-engineered ChatGPT client at
https://github.com/acheong08/ChatGPT is explicitly rejected because it relies
on unsupported account/session access. Workspace Agent triggers remain
unselected because they are a different product surface and the current API
does not return the agent response.

### Completed first vertical proof

The completed v3.2 proof stayed human-triggered and local-first:

1. Install/reload the implemented local personal plugin with one
   lesson-authoring Skill and no MCP server.
2. Give it the fixed, privacy-reviewed authored packet rather than real learner
   history.
3. Return exactly one typed contribution result from the three approved
   modules in one request.
4. Validate the exact raw result with repository-owned contracts and stable
   diagnostics; never publish an invalid or partial lesson.
5. After the fixed proof, map all approved text fixtures, run every case the
   contract can represent honestly, and retain blocked cases as contract gaps.

This proof requires no model API, environment variable, programmatic login,
cookie access, tunnel, browser extension, MCP server, or external GPT edit.

### Remaining implementation gates

D-031 closes the transport and orchestration choice, D-032 implements the
local proof, and D-033 selects reviewed local JSON file import. Remaining gates
are:

- a forward contract version carrying compiler-owned practice text, accepted
  Japanese answer truth, read-only runtime-plan context, and repair diagnostics;
- reruns of the four blocked D-024 fixtures and one strict-JSON rejection;
- the reviewed file importer and downstream LessonManifest normalization plan;
- production-profile budgets and the real learner-target disclosure policy;
- fallback behavior when the plugin surface or normal ChatGPT plan allowance
  is unavailable.

The local plugin proof is implemented. No application compiler/provider,
external account change, real learner-data transmission, lesson publication,
or MCP infrastructure is implemented.
