# M7 v3.1 Story Sheet Feasibility Run 001

Status: Run received; structural and media pass; semantic fixture rejected
Packet version: 0.1.0
Fixture: `story_sheet_find_dog_single_target`
Request ID: `m7_v3_1_story_sheet_find_dog_001`
Input SHA-256: `56a69ce3153d3ad7e7fcc5e4502340a78246cd416cec9a4c1195b018dd38da6c`
Packet file SHA-256: `49047bf246d28f1a733c08f019bcd690aa59a9dc072652cbc31ed1c2d3e6c288`

Recorded response and evaluation:

- `story-sheet-find-dog-001.response.raw.json`
- `story-sheet-find-dog-001-evaluation.md`

## Purpose

Test whether the existing `Nunu JP Story Sheet` Custom GPT can obey the narrow
Bunbun contribution boundary even though its captured default behavior normally
continues into Gloss/Romaji worksheets and image generation.

This is a feasibility artifact, not an implemented production packet schema.
The elaborated world claims, beat target assignments, and conservative output
limits are fixed authored inputs for this run only. Any production packet
contract still requires the separately gated M7 v3.1 compiler decision.

## Privacy review

The packet contains only one reviewed vocabulary fixture, catalog-derived world
facts, authored beat constraints, version identities, output limits, and the
requested response shape. It contains no learner identity, raw learner input,
gameplay evidence, TYPE response, progress, checkpoint, Custom GPT URL, chat
history, cookie, token, secret, image, APKG, or arbitrary local file content.

## User-operated procedure

1. Open a new conversation in the existing `Nunu JP Story Sheet` GPT. Bunbun
   does not open, inspect, automate, or authenticate the browser.
2. Paste the complete raw contents of
   `story-sheet-find-dog-001.packet.json` as the only user message.
3. Wait for the GPT response to finish. Do not ask it to repair or restyle the
   first response.
4. Record whether it started an image/file/tool operation.
5. Return the exact textual response to Bunbun without removing prose,
   Markdown fences, fields, or whitespace. Do not include unrelated chat
   history.

## First-run observations to return

Alongside the exact response, report only:

- `newConversation`: `yes` or `no`;
- `imageFileOrToolStarted`: `yes` or `no`;
- `responseFinished`: `yes` or `no`; and
- `rawResponse`: the exact response text.

## Acceptance checks

The first response passes structural feasibility only when all of these hold:

- exactly one raw JSON object, with no prose or Markdown fence;
- matching request, input hash, module ID, and module version;
- exact wrapper and Story Sheet contribution key sets;
- `OK` with a complete value, or an explicit `CANNOT_COMPLY` with no partial
  value;
- exact `opening`, `development`, `closing` beat IDs in that order;
- all placeholders replaced and all text within packet limits;
- only allowed world facts and compiler-assigned target use;
- Japanese first with concise Vietnamese support;
- no Gloss, Romaji, worksheet, layout, image, file, URL, or tool output; and
- safe plain text with one compact interaction-supporting story.

Natural Japanese quality, narrative coherence, and world-fact discipline still
require human review. A structural pass does not activate the module or approve
full bridge/compiler implementation.

## Classification after the complete fixture set

Run 001 is the first of the existing three expected and two rejected Story
Sheet cases. After all five approved fixtures are run, classify direct reuse as
one of:

- `VIABLE` — repeatably returns exact, valid contributions;
- `BRIDGE_MODE_REQUIRED` — source behavior is useful but the existing GPT needs
  a reviewed instruction/configuration change; or
- `UNSUITABLE` — direct GPT behavior cannot reliably satisfy the boundary.

## Recorded Run 001 outcome

The response passes exact JSON structure, identities, key sets, beat order,
target-surface assignment, prohibited-output scan, and all text budgets. It is
rejected under `USES_ONLY_ALLOWED_FACTS`: it invents a dog/cat spatial relation
and a relieved guide state that the packet did not authorize. Human review also
finds the dog-finding motivation too vague and the promised mystery absent from
the actual beats.

The user confirmed a new conversation and a completed response. Their latest
explicit report corrects image/file/tool activation from `yes` to `no`; the
evaluation retains that correction trail. The response still fails strict
world-fact discipline. See the evaluation file for exact evidence and measured
character counts.
