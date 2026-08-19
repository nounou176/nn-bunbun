# Milestone 7 Compiler Strategy Registry

Last updated: 2026-08-19

## Purpose

Milestone 7 is the provider-independent outcome that turns reviewed learner
vocabulary and grammar into a validated, revisioned LessonManifest. This file
keeps the alternative compiler strategies distinct so research on one path
does not silently approve, erase, or implement another.

D-027 accepts the three-strategy registry and makes M7 v3 the active research
direction. It does not approve implementation.

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

| Strategy | Provider path | Current status | Credential position | Durable source |
| --- | --- | --- | --- | --- |
| M7 v1 | OpenAI Responses API with strict Structured Outputs | Preserved inactive proposal | Proposed `OPENAI_API_KEY`; not approved | D-022 and `plans/2026-08-12-structured-lesson-compiler.md` |
| M7 v2 | Self-built or locally adapted open-weight LLM running locally | Research backlog | No remote provider credential assumed | This registry; a future research record and ExecPlan are required |
| M7 v3 | Existing Custom GPT behavior through a user-authorized browser or ChatGPT-side bridge | Active research; implementation unapproved | No `OPENAI_API_KEY`; any later token, tunnel, or browser-session access needs separate approval | D-027 and `plans/2026-08-19-m7-v3-custom-gpt-browser-bridge.md` |

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

## M7 v3 — Custom GPT browser bridge

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

ChatGPT plugins can connect to an MCP server in developer mode. Current
documentation requires either a reachable public HTTPS endpoint or Secure MCP
Tunnel for ChatGPT access. This may later support a ChatGPT-to-Bunbun delivery
path, but it introduces account/workspace availability, networking,
authentication, disclosure, and maintenance decisions that the local-first
project has not approved:

- https://developers.openai.com/plugins/build/app-quickstart
- https://developers.openai.com/plugins/deploy/connect-chatgpt

### Candidate routes

| Route | What it proves | Main cost or risk | V3 position |
| --- | --- | --- | --- |
| Manual file/clipboard bridge | Existing GPT can receive a bounded packet and return importable content without an API key | Human transfer, formatting errors, no unattended generation | Recommended first feasibility spike |
| Browser-assisted launcher | Bunbun opens a reviewed GPT link after a user gesture and copies/downloads the packet | Popup rules, local link configuration, still manual on return | Candidate after the manual packet passes |
| Local browser extension/userscript | Adds copy/import affordances near ChatGPT without scraping from the Bunbun page | New extension surface, permissions, ChatGPT DOM churn | Later candidate only |
| Playwright/CDP browser automation | Automates navigation, submission, and response capture | Session/cookie handling, fragile selectors, product UI changes, rate limits, new dependency; no supported Custom GPT API contract | Research-only; excluded from the first plan |
| Custom GPT action or ChatGPT plugin/MCP | Sends structured output to Bunbun from ChatGPT | Requires GPT/plugin changes plus HTTPS or Secure MCP Tunnel and a reviewed auth/privacy model | Conditional later spike |
| Workspace Agent trigger | Starts a published agent from another system | Different product surface, access token required, current API cannot retrieve the response | Not selected for v3 |

### Recommended first vertical proof

The smallest credible v3 proof is human-in-the-loop and local-first:

1. Bunbun creates one versioned, privacy-reviewed prompt packet from a fixed
   authored test envelope.
2. The user deliberately opens the corresponding Custom GPT and pastes the
   packet.
3. The user copies the response back into a local import field or file.
4. Bunbun parses it as untrusted input, validates the exact module contribution
   schema, and returns stable diagnostics.
5. The same approved success and rejection fixtures are evaluated manually.
6. Only after one module passes does the project decide whether to test all
   three GPTs sequentially, create a dedicated bridge-mode GPT revision, or
   stop direct-GPT reuse and use the local prompt adaptations instead.

This proof does not require a model API, environment variable, programmatic
login, cookie access, tunnel, browser extension, or automation dependency.

### Unresolved decision gates

Implementation cannot begin until the user approves the v3 ExecPlan and
resolves these choices:

- whether v3 may invoke Story Sheet, Reverse Trainer, and Story Coach as three
  separate user-mediated conversations, explicitly revising D-023's current
  one-composed-request rule;
- whether the first spike tests only one module or all three;
- whether GPT links may be stored in a Git-ignored local configuration or the
  user will open them independently;
- whether imported responses must be strict JSON or may pass through a
  deterministic text-extraction review step;
- how many manual repair rounds are allowed;
- whether learner-entered targets may leave the local machine through
  ChatGPT, and what disclosure appears before export; and
- whether any later extension, tunnel, action, session access, or browser
  automation is acceptable.

Until those gates close, v3 is research and documentation only.
