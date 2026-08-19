# Reverse Trainer Prompt Module 0.1.0

Status: Packaged in M7 v3.2 proof; application compiler inactive
Module ID: `reverse_trainer`
Roadmap owner: Milestone 7

## Provenance

- Captured Custom GPT: `Nunu JP Reverse Trainer`
- Captured source: `gpts/Nunu JP Reverse Trainer/config.md`
- Capture date: 2026-08-12
- Source revision identity:
  `sha256:9ea33eacacc7286a07e829812ab3d0415393c2ad935a27eb4bdf5b0ee02c0a78`
- Approved prompt:
  `docs/ai-modules/prompts/reverse-trainer-0.1.0.txt`
- Prompt content hash:
  `sha256:301f8ae5baea44afdf79501806805e3b1e775fd02a43a0f8fd60a8472305286b`
- GPT editor model, capabilities, actions, and version-history label: not
  supplied and not inherited
- Knowledge assets: none

## Source behavior retained

- Segment Japanese into useful natural phrases rather than isolated kanji.
- Connect Japanese forms to concise Vietnamese meaning and grammatical
  function.
- Build reverse recall from meaning or communicative intent toward Japanese.
- Produce short practice content that helps reuse the supplied target in
  context.
- Keep grammar points separate where phrase analysis requires them.

## Source behavior removed

- The mandatory ten-section long-form explanation and large tables.
- Romaji output, kanji decomposition, memory stories, and naturalness rewriting.
- Unverified JLPT levels, frequency, exam-section claims, and test coaching.
- Automatic readings, translations, grammar truth, or dictionary facts.
- Choosing primitive order, difficulty progression, target coverage, attempts,
  scaffolds, feedback, timings, transitions, or final IDs.

## Typed responsibility

Input subset:

- normalized targets and authoritative reading/gloss/reference fields;
- read-only story contribution;
- compiler-owned practice slot IDs, primitives, difficulty bands, target
  assignments, candidate truth, normalization rules, and text budgets.

Owned output:

- `reverseTraining.value.targetAnalysis[*].segments`; and
- `reverseTraining.value.practiceItems[*]`, including Japanese stimulus,
  permitted accepted-text variants, permitted ARRANGE segments, and permitted
  distractor text.

The module returns text, not option/token IDs. Deterministic code assigns final
IDs and seeded ordering. For world-selection primitives, accepted candidate IDs
come only from the compiler plan and the model returns no replacement truth.

## Data boundary

Allowed:

- the compact `LessonAuthoringEnvelopeInput` fields required for analysis and
  practice;
- the Story Sheet contribution as read-only context; and
- stable redacted validator diagnostics during the single permitted repair.

Forbidden:

- raw input, learner identity, evidence, progress, checkpoints, or TYPE values;
- Custom GPT links/configuration text and all image/APKG assets;
- external dictionaries, JLPT sources, web/file tools, arbitrary URLs, or
  secrets.

## Deterministic validators

- Exact target and practice-slot coverage with no unknown or duplicate ID.
- Phrase readings and support meanings agree with authoritative input.
- Practice fields match the compiler-selected primitive response shape.
- Accepted text is non-empty only where permitted and normalizes consistently.
- Distractors remain distinct from accepted answers under every configured
  normalization rule.
- ARRANGE segments are non-empty and reconstruct an accepted response exactly.
- Content uses only assigned targets and stays within supplied text budgets.
- Final LessonManifest structural, semantic, evidence, and runtime-capability
  validation passes after deterministic normalization.

## Failure behavior

Return `reverseTraining.status = "CANNOT_COMPLY"`, a stable non-sensitive
failure code, and `reverseTraining.value = null` if a required practice slot
would require an invented reference fact or incompatible response shape. The
compiler may perform the one bounded repair but cannot change the slot plan or
use a generic prompt fallback.

## Evaluation

Text-only fixture set:
`docs/ai-modules/evals/reverse-trainer-0.1.0.json`

Minimum approval bar:

- all three expected-behavior fixtures satisfy every assertion;
- both rejected-behavior fixtures prove reference and deterministic-plan
  boundaries; and
- no assertion depends on unverified JLPT labels or binary examples.

## Approval

- Source identity: Confirmed through D-023
- Responsibility mapping: Accepted through D-023
- Approved module version: `0.1.0`
- Typed adaptation: Approved on 2026-08-12 under D-024
- Prompt fragment and hash: Approved on 2026-08-12 under D-024
- Evaluation fixtures: Approved on 2026-08-12 under D-024
- Activation: Packaged in the M7 v3.2 Skills-only proof; not application-
  compiler or runtime-active
