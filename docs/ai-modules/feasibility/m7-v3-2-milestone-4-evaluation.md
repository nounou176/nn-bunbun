# M7 v3.2 Milestone 4 Evaluation

Date: 2026-08-20
Classification: `CONDITIONALLY_VIABLE`
Selected application handoff: reviewed local JSON file import

## Outcome

Milestone 4 evaluated all fifteen D-024 fixture identities against the
implemented `bunbun_m7_v3_2_lesson_authoring@0.1.0` boundary. Eleven fixtures
can be represented honestly by that boundary and were run in fresh,
independent, text-only, ephemeral Codex conversations through the installed
`bunbun-authoring@0.1.0` plugin. Ten results pass the strict packet validator
and fixture-specific deterministic grader. One first response is rejected
because it contains one trailing `}` after the JSON object. The exact invalid
response is retained without repair.

Four approved fixtures cannot be represented by request contract 0.1.0. They
are recorded as contract gaps rather than run with invented compiler truth.
This prevents an incomplete evaluation surface from being reported as a full
qualification.

## Result matrix

| Module          | Fixture                                               | Result                            | Raw response SHA-256 or gap                                        |
| --------------- | ----------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| Story Sheet     | `story_sheet_find_dog_single_target`                  | Accepted                          | `54230686675082098b17113253146b9d1d88b08d3098b38c537cf996e5154f2d` |
| Story Sheet     | `story_sheet_help_someone_grammar_context`            | Accepted                          | `e2ceb7d61343947e91514ea096cfe4fac0725acba134ee232e2c1cba20a68318` |
| Story Sheet     | `story_sheet_multiple_targets_fixed_beats`            | Accepted                          | `6fc668a673cd138f7002a3393c636056b0ad7648fa2a9a7ca0a3b5fb7ff062eb` |
| Story Sheet     | `story_sheet_rejects_source_scope_regression`         | Rejected: trailing JSON character | `ffda58a25be5679c903923d9ef620c62d3438d3c75214d53a858cf69f254aa25` |
| Story Sheet     | `story_sheet_rejects_favorite_unsupported_world`      | Accepted                          | `95554361dce03acf734de54b34e138670caa8f8d24960a1956d713f373c78412` |
| Reverse Trainer | `reverse_trainer_natural_phrase_groups`               | Contract gap                      | `AUTHORITATIVE_PRACTICE_TEXT_MISSING`                              |
| Reverse Trainer | `reverse_trainer_reverse_recall_type`                 | Contract gap                      | `AUTHORITATIVE_ACCEPTED_TEXT_MISSING`                              |
| Reverse Trainer | `reverse_trainer_arrange_reconstruction`              | Contract gap                      | `AUTHORITATIVE_ACCEPTED_TEXT_MISSING`                              |
| Reverse Trainer | `reverse_trainer_rejects_unverified_reference_claims` | Accepted                          | `e59c01eee1f84b2ab41e16616d7b736bf0dc8c03041df49d7c6aef51890e2386` |
| Reverse Trainer | `reverse_trainer_rejects_plan_and_answer_mutation`    | Accepted                          | `01764be94e78ae2149b7ac2ae8fbbf10ff887d94a09e297f4bf93fdf33353051` |
| Story Coach     | `story_coach_indirect_hint_without_answer`            | Accepted                          | `96008d34eb41f736a491b539478895873e334d555132d5d2a7095c06675dc708` |
| Story Coach     | `story_coach_direct_meaning_scaffold`                 | Accepted                          | `ea533c66e3065f78993234617f44adae78b334d413a0099b7e7ec4ccb917805b` |
| Story Coach     | `story_coach_three_feedback_outcomes`                 | Accepted                          | `733c29d3840b8291c11a7202a02dba6c3a953e34b0313b26974ad63fb2914810` |
| Story Coach     | `story_coach_rejects_early_answer_leak`               | Accepted                          | `1b27374e7387603c116f72816bfafb2c095b42494cc9616f88fa916fb3dceeac` |
| Story Coach     | `story_coach_rejects_source_and_runtime_regression`   | Contract gap                      | `RUNTIME_PLAN_FIELDS_MISSING`                                      |

The ten accepted outputs also pass manual review of the D-024 expected and
rejected-behavior descriptions. The single rejected response is semantically
within the requested source scope, but strict JSON transport fails before its
content can be accepted. No accepted result produced media, files, browser
actions, or another tool flow.

## Contract findings

Request contract 0.1.0 does not carry:

- compiler-owned practice text for natural phrase analysis;
- compiler-owned accepted Japanese response text for TYPE and ARRANGE; or
- the complete read-only runtime plan required by the Story Coach TYPE
  regression fixture, including `maximumAttempts` and `displayMs`.

Running those fixtures anyway would make the model invent answer truth or
would silently weaken the approved test. Contract 0.1.0 also permits
`attempt: 2`, but the closed packet has no field for the prior draft and stable
redacted diagnostics described by the repair protocol. Milestone 4 therefore
does not claim that a meaningful bounded repair was exercised.

## Handoff decision

The first application handoff will be a user-reviewed local JSON file import,
not clipboard-first transfer and not a direct ChatGPT-to-Bunbun connection.
The file boundary preserves the exact raw response, supports hashing and audit,
and lets local code reject invalid data before persistence or publication.

The importer must not be implemented against contract 0.1.0. The named next
action is a separately approved contract-and-import plan that:

1. versions the authoring boundary forward and adds the missing compiler-owned
   practice text, answer truth, runtime-plan context, and bounded-repair input;
2. reruns the four contract-gap fixtures plus the one strict-JSON rejection;
3. accepts only a complete locally validated contribution file; and
4. keeps LessonManifest normalization, catalog/runtime validation, review, and
   publication as explicit later gates.

MCP remains conditional M7 v3.3 work. WXT and browser automation remain
research-only fallbacks.

## Evidence and reproducibility

Generated requests and the fifteen-case coverage ledger live under
`packages/contracts/fixtures/authoring/evals/`. Exact first responses live
under `docs/ai-modules/feasibility/m7-v3-2-evals/`. The runner refuses to
overwrite an existing response. `inspect:authoring-eval` applies strict JSON
parsing, request/result identity validation, prompt-pack validation, shared
semantic validation, and fixture-specific checks.

No Playwright run applies because D-011 keeps browser and gameplay validation
manual. No Docker build applies because this proof has no Dockerfile and is
not a staging handoff under D-015.
