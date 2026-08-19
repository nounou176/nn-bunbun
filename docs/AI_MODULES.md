# Bunbun AI Module Registry

## Status

Six user-owned Custom GPT source packages were captured locally on 2026-08-12,
and the user confirmed that they are the complete intended set. This document
is the durable inventory and routing boundary for those sources and Bunbun's
earlier conceptual modules. The Milestone 7 responsibility map is accepted,
and Prompt Adaptation Pack 0.1.0 is approved. D-032 packages the three selected
modules in the local M7 v3.2 proof; no application compiler or runtime module
is activated. D-027 preserves the Responses integration as M7
v1, records the local-LLM path as M7 v2 research, and makes reuse of the
captured Custom GPT behavior the M7 v3 direction. D-029 closes the v3.1 manual
Story Sheet gate after two of five fixtures as provisionally viable evidence;
three fixtures remain explicitly unrun. D-031 supersedes the WXT stage and
selects a repository-owned, Skills-only personal ChatGPT/Codex plugin as M7
v3.2. Its local package, schemas, validator, fixtures, and runbook now exist;
user-operated installation and product-surface proof remain pending.

The local source library is intentionally excluded from Git under `gpts/`.
Prompt Adaptation Pack 0.1.0 is approved under D-024, so the three selected
modules are packaged in the Skills-only proof but remain application-inactive;
no Bunbun provider or compiler call exists yet. Accepted prompt behavior does
not by itself approve the remaining application handoff and compiler-plan
decisions.

## Purpose

Bunbun was conceived with several specialized Custom GPTs. Their useful
behavior should survive inside the product without making gameplay depend on
ChatGPT conversations or hidden external configuration.

This registry separates three things:

1. **Custom GPT source** — the user-owned ChatGPT configuration used as design
   input: name, description, instructions, knowledge files, examples,
   capabilities, and actions.
2. **Bunbun prompt module** — a reviewed, repository-owned, versioned prompt
   fragment and typed input/output responsibility behind the lesson compiler.
3. **Game capability** — deterministic runtime behavior represented by a
   validated LessonManifest and fixed interaction primitives.

The current public OpenAI API reference does not document an endpoint that
invokes one of the captured user Custom GPT IDs. M7 v1 therefore ports approved
behavior into prompt modules, while selected M7 v3.2 packages those same
repository-owned adaptations as one user-triggered ChatGPT/Codex skill. Neither
route may make ordinary gameplay depend on ChatGPT:

- https://developers.openai.com/api/reference/overview
- `docs/M7_VARIANTS.md`

## Source audit

The original 504-line Bunbun specification and BUNBUN_ARCHITECTURE.md name six
conceptual modules:

- Story Coach;
- Reverse Trainer;
- Visual Mnemonic;
- Tutor;
- Anki content generator; and
- JLPT assessment generator.

The source states that existing Custom GPT behavior may later be ported into
reusable modules and that the modules should not automatically become separate
models or services. It did not originally include their configurations.

The user later supplied six local GPT folders:

| Exact supplied GPT name       | Captured source                                              | Knowledge inventory                                   |
| ----------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| Nunu JP Story Coach 5 minutes | Name, link, description, instructions                        | None                                                  |
| Nunu JP Reverse Trainer       | Name, editor link, description, instructions, six starters   | None                                                  |
| Nunu JP Story Sheet           | Name, editor link, description, instructions, seven starters | 21 PNG examples                                       |
| Nunu JP Visual Mnemonic       | Name, editor link, description, instructions                 | 31 PNG files, 27 unique                               |
| Nunu JP HTML Anki             | Name, editor link, description, instructions                 | None                                                  |
| JLPT N3 Anki Deck Generator   | Name, description, instructions                              | Three text specs, five PNG examples, one APKG example |

The local normalized index at `gpts/README.md` records source hashes, asset
counts, summaries, conflicts, and missing confirmations without altering the
raw files. The APKG example contains 42 notes, 42 cards, and 38 mapped media
files in its primary collection.
Twenty-seven embedded media files match top-level PNG sources exactly and
eleven exist only inside the APKG.

The supplied set does not match the earlier conceptual list one-to-one. Tutor
and JLPT assessment generator were not supplied. Story Sheet and HTML Anki were
supplied instead, and two separate GPTs cover parts of Anki generation. The
user confirmed on 2026-08-12 that this is the exact complete source set; a
separate Tutor or JLPT assessment GPT is not expected for the current plan.

No supplied configuration identifies its recommended model, enabled
capabilities, apps/actions, exact source revision, knowledge ownership/license,
or a complete representative success/failure evaluation set.

## Accepted source and routing decisions

The user accepted the following Milestone 7 boundaries on 2026-08-12:

- `story_sheet` authors the premise, story, and setting/context inside the
  deterministic scene and scenario profile selected by the compiler.
- `story_coach` authors bounded hint and scaffold wording, pedagogical cadence,
  and feedback inside code-owned slots and budgets.
- `reverse_trainer` authors phrase analysis, reverse-recall material, and
  practice content.
- deterministic code, not a GPT, chooses primitive order, difficulty
  progression, IDs, transitions, and hard quality/runtime budgets.
- the three selected responsibilities are composed into one structured lesson
  request; Bunbun does not call the Custom GPTs as separate agents or services.
- all supplied images and the APKG are style/output examples only. Bunbun must
  not extract their linguistic content, use them as reference truth, or turn
  them into evaluation fixtures. Text evaluation fixtures must be separately
  authored and reviewed.

`story_coach` may shape the pedagogical rhythm of authored wording and support
beats, but it cannot change the compiler-selected primitive sequence,
difficulty transitions, attempt limits, timing budgets, or runtime behavior.
This distinction keeps the approved learning role without transferring game
control to a prompt.

## Configuration fields to capture

Official OpenAI documentation distinguishes the following GPT configuration
fields. Bunbun must capture each field that exists rather than treating the
visible GPT name as the implementation:

| Field                 | Why Bunbun needs it                                   | Repository rule                                                        |
| --------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| Name                  | Trace the source GPT                                  | Record the exact visible name and a stable Bunbun module ID            |
| Description           | Understand intended audience and purpose              | Preserve verbatim source plus an approved Bunbun summary               |
| Conversation starters | Recover representative input patterns                 | Store only reviewed examples without private conversation history      |
| Instructions          | Recover behavior, workflow, tone, and prohibitions    | Treat as the primary source; version and review it before porting      |
| Knowledge files       | Recover factual/reference material                    | Store file name, hash, ownership/license, and reviewed project copy    |
| Recommended model     | Understand the original ChatGPT setup                 | Record as provenance, not as an automatic API model choice             |
| Capabilities          | Identify dependencies such as web or image generation | Re-authorize each capability for Bunbun; do not inherit it implicitly  |
| Apps or actions       | Identify external integrations                        | Capture schemas only after review; never capture credentials or tokens |
| Version history note  | Establish which GPT revision was captured             | Record a user-supplied date/version label and capture timestamp        |
| Evaluation examples   | Prove the behavior survived the port                  | Add reviewed inputs, expected properties, and unacceptable outputs     |

Do not paste or commit API keys, OAuth client secrets, bearer tokens, cookies,
private action credentials, or other secret values. For an action, record only
its purpose, authentication type, sanitized OpenAPI schema, and whether Bunbun
actually needs the integration.

## Module inventory and accepted routing

The `Documented fact` column is supported by current source. Milestone 7 uses
only the three responsibilities explicitly accepted above. All activation
states accurately distinguish an approved design from an implemented runtime
module.

| Module ID         | Custom GPT / concept                              | Documented fact                                                                                            | Accepted or deferred Bunbun use                                                                                                                             | Roadmap owner                                      | Source status                    | Activation                           |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------- | ------------------------------------ |
| `story_coach`     | Story Coach                                       | Nunu JP Story Coach 5 minutes source captured locally; sentence-level five-minute coaching workflow        | Author bounded hint/scaffold wording, pedagogical cadence, and feedback inside compiler-owned slots; never choose primitive order or difficulty transitions | Milestone 7                                        | Approved adaptation 0.1.0        | Packaged in v3.2 proof; app inactive |
| `reverse_trainer` | Reverse Trainer                                   | Nunu JP Reverse Trainer source captured locally; detailed sentence analysis and recall support             | Author phrase analysis, reverse-recall material, and practice content; never establish reference truth or game progression                                  | Milestone 7                                        | Approved adaptation 0.1.0        | Packaged in v3.2 proof; app inactive |
| `tutor`           | Tutor                                             | Earlier concept only; no standalone GPT exists in the confirmed source set                                 | No separate Milestone 7 module; bounded lesson support is assigned to `story_coach`; runtime explanations remain a later decision                           | Later runtime opportunity only                     | Not part of confirmed source set | Not selected                         |
| `story_sheet`     | Nunu JP Story Sheet                               | Supplied GPT; creates surreal stories and aligned visual worksheets                                        | Author the premise, story, and setting/context within the compiler-selected scene/profile; printable export remains later                                   | Milestone 7 for story content; later for export    | Approved adaptation 0.1.0        | Packaged in v3.2 proof; app inactive |
| `visual_mnemonic` | Visual Mnemonic                                   | Nunu JP Visual Mnemonic source and visual examples captured locally                                        | Produce a mnemonic concept or image prompt for an explicitly requested kanji aid; never establish authoritative decomposition                               | Later opportunity, after reference/image decisions | Captured; review pending         | Disabled                             |
| `anki_content`    | Nunu JP HTML Anki and JLPT N3 Anki Deck Generator | Two supplied GPTs cover HTML card content and APKG deck construction; their output/fallback rules conflict | Draft reviewed typed card fields; deterministic code must render HTML and generate `.apkg`                                                                  | Later opportunity                                  | Captured; mapping review pending | Disabled                             |
| `jlpt_assessment` | JLPT assessment generator                         | Earlier concept only; no standalone GPT exists in the confirmed source set                                 | Deferred capability requiring a later reference, content, and routing decision                                                                              | Later opportunity                                  | Not part of confirmed source set | Not selected                         |

## Accepted composed compiler routing

Under D-023, Milestone 7 should not run six independent agents. The compiler
will compose
only the three reviewed prompt modules required for one structured lesson
request. Deterministic stages do not use an AI module. There is no standalone
Tutor module in this composition.

| Compiler or game stage                                                                                         | Responsible component                                            | AI module use                                                                                                         |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Validate and normalize learner input                                                                           | Deterministic server code                                        | None                                                                                                                  |
| Resolve readings and reference records                                                                         | Deterministic reviewed reference provider                        | None                                                                                                                  |
| Select scene/scenario compatibility, primitive sequence, difficulty progression, IDs, transitions, and budgets | Deterministic compiler profile                                   | None                                                                                                                  |
| Author premise, story, and setting/context                                                                     | Structured lesson request                                        | `story_sheet@0.1.0` packaged in v3.2 proof; compiler integration pending                                              |
| Author phrase analysis, reverse recall, and practice content                                                   | Structured lesson request                                        | `reverse_trainer@0.1.0` packaged in v3.2 proof; compiler integration pending                                          |
| Author bounded hints, scaffold wording, pedagogical cadence, and feedback                                      | Structured lesson request                                        | `story_coach@0.1.0` packaged in v3.2 proof; local proof code enforces slots and budgets; compiler integration pending |
| Produce LessonContentDraft                                                                                     | One composed authoring request through the selected M7 transport | Compiler envelope plus approved versions of `story_sheet`, `reverse_trainer`, and `story_coach`                       |
| Repair one invalid draft                                                                                       | One bounded repair request when approved by the transport plan   | Same module versions plus stable validator diagnostics                                                                |
| Normalize and validate LessonManifest                                                                          | Deterministic contracts and runtime capability gate              | None                                                                                                                  |
| Run ordinary gameplay and record evidence                                                                      | Deterministic local runtime                                      | None                                                                                                                  |
| Explain an open learner question during gameplay                                                               | Not approved for MVP runtime                                     | No call until a separate decision exists                                                                              |
| Generate mnemonic, Anki, or JLPT content                                                                       | Deferred workflows                                               | Corresponding module only after its roadmap decision                                                                  |

The composed prompt must record every participating `moduleId` and version in
manifest provenance. A module that is missing, unapproved, incompatible with
the target, or outside its roadmap owner is omitted. The compiler must fail
clearly if an approved lesson profile requires a module that is unavailable;
it must not substitute an undocumented generic prompt.

## M7 v3 skill and direct-GPT boundary

D-027 authorized research into reusing the three existing GPTs without
`gpt-5.6-terra` or `OPENAI_API_KEY`. V3.1 began with an exact prompt packet and
manual response import. D-031 now selects the repository-owned Skills-only
plugin rather than direct hosted-GPT orchestration. It does not authorize a
provider call, programmatic login, cookie/session access, browser automation,
extension, GPT action, public tunnel, MCP connection, or GPT editor change.

Direct original-GPT use is not assumed to behave like Prompt Adaptation Pack
0.1.0. Story Sheet normally continues into worksheet/image creation, Reverse
Trainer emits long sentence analysis, and Story Coach expects an iterative
coaching loop. D-029 stops the Story Sheet gate after two of five fixtures: Run
001 passes transport/media but fails strict world-fact discipline; Run 002
passes its complete expected-behavior checks. The multi-target and two rejected-
behavior fixtures remain unrun and must not be inferred as passing.

Sequential direct browser use of Story Sheet, Reverse Trainer, and Story Coach
would conflict with D-023's one-composed-request rule. D-031 therefore does not
select it and does not select the proposed dedicated bridge-mode GPT. M7 v3.2
uses one Skills-only plugin authoring entry point that composes the three D-024
modules in their accepted order. This reuses the captured behavior and source
lineage, not the hosted GPT objects or hidden editor state.

Only the three approved Milestone 7 adaptations participate in the initial
skill. `visual_mnemonic`, `html-anki`, and `jlpt-n3-anki-deck-generator` remain
captured but inactive because their image, HTML, file, APKG, reference, and
workflow decisions belong to later milestones. Packaging six independent
skills or agents into the first plugin would incorrectly broaden M7.

The implemented local plugin has no connector, MCP server, browser extension,
action, provider API, or external endpoint. It may prepare an untrusted typed
result, but only Bunbun's local contracts and validators can accept it. No
publication path exists yet. D-024 remains the responsibility, privacy,
version, and evaluation baseline.

## Approved Milestone 7 adaptation pack

The user approved the 0.1.0 pack on 2026-08-12 under D-024. It is stored under
`docs/ai-modules/`:

- `CONTRACT.md` defines the code-owned input envelope, three disjoint model
  contribution types, deterministic validators, failure behavior, and privacy
  boundary.
- `story-sheet-0.1.0.md`, `reverse-trainer-0.1.0.md`, and
  `story-coach-0.1.0.md` record source behavior retained/removed, exact typed
  ownership, source identity, and approved prompt hashes.
- `prompts/` contains the three exact lean prompt fragments.
- `evals/` contains fifteen text-only fixtures: three expected and two rejected
  behavior cases per module.

The approved composition order is compiler envelope, Story Sheet, Reverse
Trainer, Story Coach, then the strict output schema. This order lets story
context inform practice and lets coaching copy refer to both while keeping the
three output sections disjoint. It remains one structured request.

The captured config SHA-256 values are the Bunbun source-revision identities.
Unknown GPT-editor model, capability, action, and version-history fields are
not inherited. The M7 adaptations require no tools and exclude every image and
the APKG. Any prompt behavior edit requires an appropriate module version
change, an updated content hash, evaluation rerun, and explicit approval before
activation.

## Source package required for each module

The user should provide one source package per Custom GPT. Plain text and
original knowledge files are preferred over screenshots because prompts,
examples, and file contents must be reviewable and diffable.

Required capture checklist:

1. Exact Custom GPT name.
2. GPT link for provenance when the user is comfortable recording it. The link
   is never a runtime dependency.
3. Description.
4. Complete Instructions field.
5. All conversation starters.
6. Original knowledge files or an explicit statement that there are none.
7. Recommended model shown by the editor.
8. Enabled capabilities.
9. Apps or actions, if any: purpose, authentication type, and sanitized schema
   only. Do not provide authentication values.
10. The GPT revision/date the capture represents.
11. At least three representative requests and the properties expected in a
    good answer.
12. At least two failure examples or behaviors the port must avoid.
13. The intended Bunbun area and whether that GPT may send learner data to an
    external provider.

Official OpenAI documentation currently places these settings in the web GPT
editor. The user can open **GPTs → My GPTs → choose a GPT → Edit GPT**, then
copy the configuration fields and attach the original knowledge files. The
version-history menu can identify or restore the intended source revision.

## Capture template

Use this template for each supplied GPT. A future repository record must keep
source facts separate from Bunbun adaptations.

```markdown
# <Exact Custom GPT name>

Source status: Captured | Reviewed | Approved
Bunbun module ID: <stable_id>
Captured at: <RFC 3339 timestamp>
Source revision note: <user-supplied label/date>
GPT link: <optional provenance only>

## Source configuration

### Description

<verbatim description>

### Instructions

<complete verbatim instructions>

### Conversation starters

- <starter>

### Knowledge files

| File | SHA-256 | Ownership/license | Purpose | Included for Bunbun? |
| ---- | ------- | ----------------- | ------- | -------------------- |

### Recommended model and capabilities

- Recommended model: <source editor value>
- Capabilities: <source editor values>
- Apps/actions: <none or sanitized description>

## Evaluation examples

### Expected behavior

1. Input: <example>
   Expected properties: <observable behavior>

### Rejected behavior

1. Input or condition: <example>
   Must not: <observable failure>

## Proposed Bunbun adaptation

- Pipeline stage:
- Typed input responsibility:
- Typed output responsibility:
- Allowed learner data:
- Forbidden data:
- Deterministic validators:
- Fallback behavior:
- Roadmap owner:

## Approval

- User approval: Pending
- Approved Bunbun module version: Pending
```

## Review and porting process

For each source package:

1. Verify completeness against the GPT editor fields.
2. Separate instructions from reference knowledge.
3. Identify duplicated or conflicting behavior across modules.
4. Remove ChatGPT-only UI assumptions, hidden conversation state, unsupported
   tools, and unrelated features.
5. Define a narrow typed input/output responsibility compatible with the
   Structured Outputs draft.
6. Define deterministic validators and failure behavior. A prompt is never its
   own validator.
7. Create separately authored text evaluation fixtures from reviewed textual
   requests and expected properties. Never use supplied images or the APKG as
   evaluation fixtures.
8. Assign a semantic module version and content hash.
9. Present the adaptation and routing to the user for explicit approval.
10. Only then implement the module and include it in compiler provenance.

If a GPT contains reference claims about vocabulary, grammar, kanji, JLPT, or
another authoritative dataset, those claims require a reviewed reference
source and license. Instructions or model output alone do not become Bunbun
reference truth.

## Privacy and security boundary

- Custom GPT links and source configuration are development provenance, not
  learner-facing content or runtime credentials.
- Secret values are never captured in this registry, source packages,
  repository history, logs, tests, or shared memory.
- Knowledge files must be reviewed for personal, confidential, licensed, or
  unrelated data before entering the repository.
- Learner targets may be sent to the approved lesson compiler only after the
  explicit Compile action and disclosure defined by Milestone 7.
- Gameplay evidence, progress, raw TYPE answers, local profile data, and
  persistence checkpoints are not module inputs.
- A future runtime Tutor call would require a separate decision specifying
  transmission, latency, cost, privacy, and deterministic fallback.

## Readiness gates

A module is `Approved` only when all of the following are true:

- its reviewed source snapshot is identified and missing editor fields are
  either supplied or explicitly excluded from inheritance;
- every knowledge file used by the module has ownership/license and privacy
  review, while excluded style examples remain outside prompts and evals;
- its Bunbun purpose, inputs, outputs, exclusions, and roadmap owner are clear;
- representative success and failure examples exist;
- deterministic validators and fallback behavior are defined;
- its interactions with other modules contain no unresolved conflict;
- its API data disclosure is explicit; and
- the user approves the Bunbun adaptation and version.

The source-to-module mapping and Prompt Adaptation Pack 0.1.0 are accepted
under D-023 and D-024. The three selected modules meet the design-level
readiness gate and are Approved for implementation, but remain inactive until
the provider/compiler implementation is separately approved and completed.
Implementation must not invent missing pedagogical behavior or transfer
deterministic game sequencing to a prompt.

## Current next action

Follow `docs/ai-modules/M7_V3_2_RUNBOOK.md` for the user-operated install and
fixed authored proof. Record the exact raw result and local diagnostics before
choosing manual file/clipboard import or proposing a later direct handoff. Keep
inactive M7 v1, research-only M7 v2, conditional v3.3 MCP, WXT fallback
research, Visual Mnemonic, and both Anki workflows out of this proof.
