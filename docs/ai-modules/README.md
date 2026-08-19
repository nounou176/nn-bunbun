# Milestone 7 Prompt Adaptation Pack

Status: Approved under D-024; not implemented
Pack version: 0.1.0
Created: 2026-08-12
Approved: 2026-08-12

## Purpose

This directory converts three captured Custom GPT configurations into narrow,
reviewable Bunbun prompt modules. It does not make the Custom GPTs callable and
does not activate an OpenAI provider.

The pack implements accepted decision D-023:

| Order | Module | Owned contribution |
| --- | --- | --- |
| 1 | `story_sheet` | Premise, story, setting context, and story-beat copy |
| 2 | `reverse_trainer` | Natural phrase analysis, reverse recall, and practice content |
| 3 | `story_coach` | Instructions, bounded hints/scaffold copy, pedagogical cadence, and feedback |

Deterministic code owns target normalization, references, scene and scenario
selection, story/practice/support slot IDs, primitive sequence, difficulty,
candidate truth, answer normalization, attempts, scaffold activation,
transitions, timings, quality budgets, final IDs, and validation.

## Contents

- `CONTRACT.md` — shared typed input/output and ownership boundary.
- `story-sheet-0.1.0.md` — Story Sheet source-to-module adaptation.
- `reverse-trainer-0.1.0.md` — Reverse Trainer adaptation.
- `story-coach-0.1.0.md` — Story Coach adaptation.
- `prompts/` — exact approved prompt fragments whose hashes are recorded in
  the module documents.
- `evals/` — text-only success and failure fixtures with observable assertions.
- `feasibility/` — user-operated M7 v3.1 packets and runbooks; these are
  research evidence, not implemented production packet schemas.

## Composition

The compiler will eventually create one request in this order:

1. code-owned compiler envelope and immutable constraints;
2. `story_sheet@0.1.0`;
3. `reverse_trainer@0.1.0`;
4. `story_coach@0.1.0`; and
5. the strict all-required LessonContentDraft output schema.

The modules are responsibilities inside one structured response. They are not
independent agents, model calls, tools, or services. A later bounded repair uses
the same versions and order plus deterministic validation diagnostics.

## Source and media policy

The source snapshot for each selected GPT is identified by the SHA-256 of its
captured `config.md`. The GPT editor's model, capability, action, and version-
history fields were not supplied and are not inherited by this adaptation.
These Milestone 7 modules require text generation only and no model tools.

All supplied images and the APKG remain local style/output examples. They are
not prompt inputs, lesson/reference content, or evaluation fixtures for this
pack.

## Approval record

The user's 2026-08-12 approval, recorded as D-024, accepts:

- the shared contribution contract;
- the three prompt fragments and their responsibility boundaries;
- composition order;
- deterministic failure and validation behavior;
- the text-only evaluation fixtures; and
- module versions `0.1.0`.

All three modules are Approved for Milestone 7 implementation but are not yet
implemented or runtime-active. D-024 does not approve a provider, model,
reasoning setting, environment-variable name, or the proposed compiler plan.
