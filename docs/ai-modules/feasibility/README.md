# M7 v3 Feasibility Evidence

## M7 v3.1 direct Story Sheet gate

Status: Closed early by user decision after 2 of 5 fixtures
Scope: User-operated, text-only feasibility; no browser automation or compiler
implementation

## Run matrix

| Run | Approved fixture                                 | State                     | Current result                                        |
| --- | ------------------------------------------------ | ------------------------- | ----------------------------------------------------- |
| 001 | `story_sheet_find_dog_single_target`             | Complete                  | Rejected: structural/media pass; world-fact failure   |
| 002 | `story_sheet_help_someone_grammar_context`       | Complete                  | Accepted: structural, semantic, and media checks pass |
| 003 | `story_sheet_multiple_targets_fixed_beats`       | Canceled before execution | Packet exists; no response or result                  |
| 004 | `story_sheet_rejects_source_scope_regression`    | Not run by user decision  | No packet, response, or result                        |
| 005 | `story_sheet_rejects_favorite_unsupported_world` | Not run by user decision  | No packet, response, or result                        |

## Evidence rules

- Use a new Custom GPT conversation for every run.
- Paste the complete packet as the only first message.
- Do not repair or restyle the first response.
- Retain only the exact requested raw response and the three bounded user
  observations.
- Keep image/file/tool behavior separate from the textual JSON evaluation.
- Never retroactively change a completed packet to make its response pass.
- Do not describe the stopped 2-of-5 suite as a complete qualification.

The user's final correction records no image/file/tool operation for Runs 001
and 002. Both confirm exact JSON transport compliance. Run 001 fails strict
world-fact discipline; Run 002 passes its full structural, semantic, and media
checks after the packet supplies explicit narrative claims.

The user chose not to run the remaining fixtures. The gate is therefore
`PROVISIONALLY_VIABLE_FOR_ORCHESTRATION_PLANNING`, not a full `VIABLE`
qualification. Multi-target assignment, rejected source-scope behavior, and
unsupported favorite-world resistance remain untested risks.

## M7 v3.2 Skills-only plugin proof

The user installed `bunbun-authoring@0.1.0` and returned the first fixed
composed authoring result on 2026-08-20. The exact response is retained in
`m7-v3-2-lesson-authoring-001.response.raw.json`; its evaluation is retained in
`m7-v3-2-lesson-authoring-001-evaluation.md`.

The result passes the strict local exchange inspector and manual text review.
The user confirmed a new conversation, a finished response, and no unexpected
plugin-initiated image, file, or tool flow. Their initial `yes` referred only to
the required input attachment `valid-request.json`. The fixed product-surface
proof is accepted.

Milestone 4 evidence is retained in `m7-v3-2-evals/` and summarized in
`m7-v3-2-milestone-4-evaluation.md`. Eleven of fifteen D-024 fixtures were
runnable through request contract 0.1.0: ten first responses pass and one fails
strict JSON parsing because of a trailing character. Four fixtures are explicit
contract gaps. D-033 classifies the route as conditionally viable and selects
reviewed local JSON file import after a forward contract version closes the
gaps.
