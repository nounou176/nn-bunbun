# M7 v3.2 Lesson Authoring Run 001 Evaluation

Status: Accepted — strict exchange and observed media/tool behavior pass
Recorded: 2026-08-20
Fixture: `composed_help_find_dog`
Request ID: `m7_v3_2_lesson_authoring_001`
Raw response SHA-256:
`ebe674683d907eb3550070405ae4e2b9605d173b3d07aed5eb62bb3034e30309`

## Retained evidence

The exact JSON response returned by the user is retained in
`m7-v3-2-lesson-authoring-001.response.raw.json`. It contains only authored
fixture output and no learner identity, progress, response, credential, cookie,
token, or private conversation history.

## User observations

| Observation                              | Recorded value | Evaluation                                                       |
| ---------------------------------------- | -------------- | ---------------------------------------------------------------- |
| New conversation                         | `yes`          | Confirmed                                                        |
| User attached `valid-request.json` input | `yes`          | Expected input action; not plugin-initiated output               |
| Plugin started unexpected media or tool  | `no`           | Pass — clarified explicitly by the user                          |
| Response finished                        | `yes`          | Confirmed; the complete strict JSON response is retained locally |

## Mechanical validation

Command:

```sh
npm run inspect:authoring -- --request packages/contracts/fixtures/authoring/valid-request.json --result docs/ai-modules/feasibility/m7-v3-2-lesson-authoring-001.response.raw.json
```

Result:

```text
AUTHORING_EXCHANGE_ACCEPTED requestId=m7_v3_2_lesson_authoring_001
```

The local validator accepted the exact request ID, canonical input hash, prompt
module order, versions, prompt hashes, closed result shape, contribution
statuses, beat order, world-claim bindings, target coverage, practice-slot
content, coaching-slot content, normalization rules, and output budgets.

## Content review

- Story Sheet stays inside the supplied small-park, guide, and dog claims and
  returns the permitted claim IDs for every beat.
- Reverse Trainer covers both `犬` and `～てください`, produces the accepted
  request `犬を探してください`, and splits it into valid ARRANGE segments.
- Story Coach fills only the supplied `arrange_request` and
  `show_request_meaning` slots. The Japanese scaffold remains null as required,
  while the Vietnamese meaning appears only at the authorized reveal slot.
- The Japanese and Vietnamese copy are coherent for the fixed guided exercise.
  No new mechanic, location, character, answer, or runtime transition appears.

## Run conclusion

The actual Skills-only plugin output passes the complete deterministic exchange
validator, manual text review, and observed media/tool gate. The user's initial
`imageFileOrToolStarted: yes` referred only to deliberately attaching the
required `valid-request.json` input; the plugin did not start unexpected media,
file, or tool output. This closes the fixed M7 v3.2 product-surface proof.
Broader D-024 fixtures and the application-handoff decision remain separate
Milestone 4 work.
