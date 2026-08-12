# Prompt Module Evaluation Fixtures

Status: Approved under D-024; not implemented
Fixture format version: 0.1.0

These fixtures describe representative text-only behavior for each approved
prompt module. They intentionally grade observable properties instead of one
exact natural-language answer.

Each module has:

- three expected-behavior cases;
- two rejected-behavior or regression cases; and
- assertions that can later become deterministic checks or reviewed semantic
  graders.

The future implementation must run the same fixture IDs when a prompt, model,
reasoning setting, schema, compiler profile, or module version changes. It must
record pass/fail without storing hidden reasoning.

Images, the APKG, their notes, and their embedded media are excluded. They are
not source text, expected outputs, grader references, or evaluation inputs.

Assertion vocabulary in version 0.1.0:

- `STATUS_OK` — module result is complete and not a failure.
- `STATUS_CANNOT_COMPLY` — module fails explicitly with no partial value.
- `EXACT_KEY_SET` — returned IDs equal the compiler-owned IDs.
- `WITHIN_BUDGETS` — every text field respects its supplied character limit.
- `USES_ONLY_ALLOWED_FACTS` — no unsupported world/reference claim appears.
- `TARGET_ASSIGNMENT_PRESERVED` — target coverage stays in code-owned slots.
- `REFERENCE_FIELDS_PRESERVED` — reading/meaning agrees with input authority.
- `PRIMITIVE_SHAPE_PRESERVED` — output fields match the planned primitive.
- `NO_DISTRACTOR_COLLISION` — distractors do not normalize to accepted text.
- `ARRANGE_RECONSTRUCTS_ANSWER` — segments rebuild one accepted response.
- `NO_EARLY_ANSWER_REVEAL` — indirect support omits answer identity/text.
- `OUTCOME_LANGUAGE_CORRECT` — feedback matches correct/incorrect/assisted truth.
- `NO_PLAN_MUTATION` — output does not replace deterministic fields.
- `NO_DEFERRED_FEATURES` — no worksheet/image/Anki/JLPT/romaji/kanji-analysis
  output appears unless a later contract explicitly permits it.
- `SAFE_PLAIN_TEXT` — output is safe plain text with no markup, URL, or embedded
  instruction.

The fixture JSON is design data in this phase, not an executable test harness.
Milestone 7 phase 1 must validate its shape before phase 4 uses it with a fake
or real provider.
