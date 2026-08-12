# Bunbun AI Module Registry

## Status

Source capture is in progress. This document is the durable inventory and
routing boundary for Bunbun's existing Custom GPT concepts. It does not claim
that any Custom GPT configuration has been captured, approved, or implemented.

All six known modules are disabled for compiler use until their actual source
configuration is supplied by the user, reviewed, versioned, and explicitly
approved. A module name or an inferred purpose is not enough to authorize a
prompt implementation.

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

A Custom GPT is not a game service and is not called by GPT link or GPT ID.
OpenAI's current documentation states that GPTs are designed to run in ChatGPT
and that an external product should use the API. Bunbun therefore ports only
approved behavior into prompt modules and keeps the game runtime independent:

- https://help.openai.com/en/articles/8554407-gpts-in-chatgpt
- https://help.openai.com/en/articles/8554397-creating-a-gpt

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
models or services. It does not include any GPT link, exact name from the GPT
editor, description, instructions, conversation starter, knowledge file,
recommended model, enabled capability, action schema, version history, example
conversation, or per-gameplay routing rule.

No other repository file, local attachment, or shared-memory record contains
those missing configurations as of 2026-08-12.

## Configuration fields to capture

Official OpenAI documentation distinguishes the following GPT configuration
fields. Bunbun must capture each field that exists rather than treating the
visible GPT name as the implementation:

| Field | Why Bunbun needs it | Repository rule |
| --- | --- | --- |
| Name | Trace the source GPT | Record the exact visible name and a stable Bunbun module ID |
| Description | Understand intended audience and purpose | Preserve verbatim source plus an approved Bunbun summary |
| Conversation starters | Recover representative input patterns | Store only reviewed examples without private conversation history |
| Instructions | Recover behavior, workflow, tone, and prohibitions | Treat as the primary source; version and review it before porting |
| Knowledge files | Recover factual/reference material | Store file name, hash, ownership/license, and reviewed project copy |
| Recommended model | Understand the original ChatGPT setup | Record as provenance, not as an automatic API model choice |
| Capabilities | Identify dependencies such as web or image generation | Re-authorize each capability for Bunbun; do not inherit it implicitly |
| Apps or actions | Identify external integrations | Capture schemas only after review; never capture credentials or tokens |
| Version history note | Establish which GPT revision was captured | Record a user-supplied date/version label and capture timestamp |
| Evaluation examples | Prove the behavior survived the port | Add reviewed inputs, expected properties, and unacceptable outputs |

Do not paste or commit API keys, OAuth client secrets, bearer tokens, cookies,
private action credentials, or other secret values. For an action, record only
its purpose, authentication type, sanitized OpenAPI schema, and whether Bunbun
actually needs the integration.

## Module inventory and proposed routing

The `Documented fact` column is supported by current source. The `Proposed
Bunbun use` column is a planning hypothesis that requires the user's review of
the real GPT configuration. No proposed mapping is accepted merely because it
appears here.

| Module ID | Custom GPT / concept | Documented fact | Proposed Bunbun use | Roadmap owner | Source status | Activation |
| --- | --- | --- | --- | --- | --- | --- |
| `story_coach` | Story Coach | Name only | Author the short premise, objective, contextual Japanese, and coherent micro-scenario using a compiler-selected scene/template | Milestone 7 | Missing source | Disabled |
| `reverse_trainer` | Reverse Trainer | Name only | Turn requested targets into frequent recognition-to-production interactions, exposure contexts, and difficulty progression | Milestone 7 | Missing source | Disabled |
| `tutor` | Tutor | Name only; requested explanations are an approved later AI use | Author concise Japanese-first feedback, scaffold wording, hints, and optional support explanations inside the draft | Milestone 7 for authored lesson support; later decision for runtime explanations | Missing source | Disabled |
| `visual_mnemonic` | Visual Mnemonic | Visual mnemonics are part of the kanji philosophy; generated mnemonic images are later, on-demand, and cached | Produce a mnemonic concept or image prompt for an explicitly requested kanji aid | Later opportunity, after reference/image decisions | Missing source | Disabled |
| `anki_content` | Anki content generator | AI may draft learning content; deterministic code must generate `.apkg` | Draft reviewed card fields from accepted targets, evidence, and examples; never emit the package binary | Later opportunity | Missing source | Disabled |
| `jlpt_assessment` | JLPT assessment generator | JLPT assessment flows are deferred | Draft assessment content against an approved JLPT/reference policy without declaring authoritative level from model output alone | Later opportunity | Missing source | Disabled |

## Proposed Milestone 7 compiler routing

Milestone 7 should not run six independent agents. The proposed compiler
composes only the reviewed prompt modules required for one structured lesson
request. Deterministic stages do not use an AI module.

| Compiler or game stage | Responsible component | AI module use |
| --- | --- | --- |
| Validate and normalize learner input | Deterministic server code | None |
| Resolve readings and reference records | Deterministic reviewed reference provider | None |
| Select scene, scenario compatibility, IDs, and budgets | Deterministic compiler profile | None |
| Author contextual premise and Japanese scenario copy | Structured lesson request | `story_coach`, after source approval |
| Author exposure, reaction, and difficulty progression | Structured lesson request | `reverse_trainer`, after source approval |
| Author bounded scaffolds, feedback, and support wording | Structured lesson request | `tutor`, after source approval |
| Produce LessonContentDraft | One composed Responses API request | Compiler envelope plus the approved modules above |
| Repair one invalid draft | One bounded repair request | Same module versions plus stable validator diagnostics |
| Normalize and validate LessonManifest | Deterministic contracts and runtime capability gate | None |
| Run ordinary gameplay and record evidence | Deterministic local runtime | None |
| Explain an open learner question during gameplay | Not approved for MVP runtime | No call until a separate decision exists |
| Generate mnemonic, Anki, or JLPT content | Deferred workflows | Corresponding module only after its roadmap decision |

The composed prompt must record every participating `moduleId` and version in
manifest provenance. A module that is missing, unapproved, incompatible with
the target, or outside its roadmap owner is omitted. The compiler must fail
clearly if an approved lesson profile requires a module that is unavailable;
it must not substitute an undocumented generic prompt.

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

~~~markdown
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
| --- | --- | --- | --- | --- |

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
~~~

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
7. Create evaluation fixtures from the supplied examples.
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

- its source configuration is complete and the intended revision is identified;
- every knowledge file has ownership/license and privacy review;
- its Bunbun purpose, inputs, outputs, exclusions, and roadmap owner are clear;
- representative success and failure examples exist;
- deterministic validators and fallback behavior are defined;
- its interactions with other modules contain no unresolved conflict;
- its API data disclosure is explicit; and
- the user approves the Bunbun adaptation and version.

Milestone 7 implementation must not begin its real provider/prompt work while
`story_coach`, `reverse_trainer`, or `tutor` remains `Missing source`, unless
the user explicitly changes the compiler scope and records a replacement
decision. Contract, persistence, and fake-provider plumbing may be designed,
but it must not invent the missing pedagogical behavior.

## Current next action

Collect the source package for `story_coach`, `reverse_trainer`, and `tutor`
first because they are the proposed Milestone 7 lesson-authoring modules. Keep
Visual Mnemonic, Anki content, and JLPT assessment in this inventory, but defer
their porting until their roadmap owner is active.
