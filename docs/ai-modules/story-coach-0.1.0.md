# Story Coach Prompt Module 0.1.0

Status: Approved for Milestone 7 implementation; not implemented
Module ID: `story_coach`
Roadmap owner: Milestone 7

## Provenance

- Captured Custom GPT: `Nunu JP Story Coach 5 minutes`
- Captured source: `gpts/Nunu JP Story Coach 5 minutes/config.md`
- Capture date: 2026-08-12
- Source revision identity:
  `sha256:96e18deb08463db0b8e462b99d40771d8020b30e49149a9572a7dec4a47cb8f9`
- Approved prompt:
  `docs/ai-modules/prompts/story-coach-0.1.0.txt`
- Prompt content hash:
  `sha256:73a74c5f55bc7ab2fd9e4850c3414f86f161b882168d89c22cd2c2b433dad1d7`
- GPT editor model, capabilities, actions, conversation starters, and version-
  history label: not supplied and not inherited
- Knowledge assets: none

## Source behavior retained

- Keep first-pass learning concise rather than aiming for perfect explanation.
- Divide support into manageable steps and avoid learner overload.
- Use natural Japanese phrasing and short Vietnamese explanation when support
  is permitted.
- Escalate from a light cue toward focused or direct help only when authorized.
- Give immediate feedback and keep the learner moving.

## Source behavior removed

- Literal five-minute schedules, countdowns, and per-minute lesson sections.
- Multi-turn ChatGPT checklists, self-rating state, and remembered difficult
  sentences.
- Kana/romaji tables, writing drills, kanji decomposition, and sound mnemonics.
- Unverified JLPT N3 labels and detailed grammar/reference instruction.
- Choosing steps, primitives, difficulty, attempts, scaffold activation,
  `afterAttempt`, timings, transitions, answer truth, or completion.

## Typed responsibility

Input subset:

- normalized targets and read-only story/practice contributions;
- compiler-owned step IDs, difficulty, scaffold slot IDs and kinds, reveal
  levels, support permissions, feedback outcomes, and text budgets.

Owned output:

- `coaching.value.steps[*].instructionJa` and permitted `instructionVi`;
- bounded `hintJa` and permitted `hintVi`;
- text fields for compiler-provided scaffold slots only; and
- short correct, incorrect, and assisted feedback copy.

Pedagogical cadence means brevity, one immediate action per message, and
progressive wording across already planned support levels. It does not mean the
module can emit or change runtime time values.

## Data boundary

Allowed:

- the compact `LessonAuthoringEnvelopeInput` fields required for coaching;
- Story Sheet and Reverse Trainer contributions as read-only context; and
- stable redacted validator diagnostics during the single permitted repair.

Forbidden:

- raw input, learner identity, past ratings, evidence, progress, checkpoints,
  TYPE responses, or mastery state;
- Custom GPT links/configuration, images/APKG, or unrelated knowledge;
- external tools, URLs, files, secrets, and authoritative reference claims.

## Deterministic validators

- Exact step and scaffold-slot coverage with no extra, duplicate, or reordered
  ID.
- Text appears only where the scaffold kind permits it.
- Indirect hints do not contain normalized accepted answers or direct candidate
  identity; focused/direct reveals match their declared level.
- Japanese-first and support-locale rules are respected.
- Correct, incorrect, and assisted copy remains outcome-consistent and does not
  make a mastery claim.
- Every field respects compiler-supplied character limits and plain-text safety.
- Attempts, reveal timing, display duration, and graph fields remain identical
  to the deterministic plan.

## Failure behavior

Return `coaching.status = "CANNOT_COMPLY"`, a stable non-sensitive failure
code, and `coaching.value = null` when useful safe copy cannot fit the supplied
slot and reveal constraints. The compiler may perform one bounded repair but
must never add an extra support step or relax a deterministic limit.

## Evaluation

Text-only fixture set:
`docs/ai-modules/evals/story-coach-0.1.0.json`

Minimum approval bar:

- all three expected-behavior fixtures satisfy every assertion;
- both rejected-behavior fixtures prove no early answer leak and no lesson-plan
  mutation; and
- feedback remains concise, recoverable, and non-punitive.

## Approval

- Source identity: Confirmed through D-023
- Responsibility mapping: Accepted through D-023
- Approved module version: `0.1.0`
- Typed adaptation: Approved on 2026-08-12 under D-024
- Prompt fragment and hash: Approved on 2026-08-12 under D-024
- Evaluation fixtures: Approved on 2026-08-12 under D-024
- Activation: Approved for implementation; not implemented or runtime-active
