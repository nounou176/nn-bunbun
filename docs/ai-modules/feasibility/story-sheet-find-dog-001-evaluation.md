# M7 v3.1 Story Sheet Run 001 Evaluation

Status: Rejected — structural pass, semantic fixture failure; two user
observations incomplete
Recorded: 2026-08-19
Fixture: `story_sheet_find_dog_single_target`
Request ID: `m7_v3_1_story_sheet_find_dog_001`
Raw response SHA-256:
`adb1ef122378f0f3ad09a163036b93b5503df9d794f9681571b270f763f5c667`

## Retained evidence

The exact requested response is retained in
`story-sheet-find-dog-001.response.raw.json`. It contains only the bounded
Story Sheet contribution returned by the user. No unrelated conversation,
identity, GPT URL, cookie, token, image, or browser-session data is retained.

The raw file intentionally remains in the exact one-line form supplied by the
user and is excluded from formatting rewrites.

## User observations

| Observation | Recorded value | Evaluation |
| --- | --- | --- |
| New conversation | `yes` | Confirmed |
| Image, file, or tool started | `yes/no` | Unknown; user selection still required |
| Response finished | `yes/no` | Unknown; user confirmation still required |

The textual response itself contains no image, file, worksheet, tool request,
or deferred media field. That does not prove whether the ChatGPT UI started a
separate tool operation.

## Mechanical validation

| Check | Result | Evidence |
| --- | --- | --- |
| Raw JSON parsing | Pass | Exactly one JSON object |
| Wrapper key set | Pass | Exact request/hash/module/version/story fields |
| Contribution key sets | Pass | Exact result, value, localized text, and beat fields |
| Request and input identity | Pass | Request ID and input SHA-256 match the packet |
| Module identity | Pass | `story_sheet@0.1.0` |
| Module result | Pass | `OK`, null failure code, non-null complete value |
| Beat identity | Pass | `opening`, `development`, `closing` exactly once and in order |
| Target assignment surface check | Pass | `犬` is absent from opening and present in development and closing |
| Placeholders and prohibited output scan | Pass | No template placeholder, Gloss, Romaji, worksheet, A4, URL, HTML, or Markdown fence |
| Text budgets | Pass | Every localized field, synopsis, and beat is within its packet limit |

Measured Unicode code-point counts:

| Field | Actual | Maximum |
| --- | ---: | ---: |
| `title.ja` | 7 | 28 |
| `title.vi` | 25 | 56 |
| `objective.ja` | 20 | 60 |
| `objective.vi` | 49 | 120 |
| `premise.ja` | 36 | 90 |
| `premise.vi` | 110 | 180 |
| `settingContext.ja` | 28 | 70 |
| `settingContext.vi` | 95 | 140 |
| `synopsis` | 134 | 240 |
| `opening.ja` | 27 | 56 |
| `opening.vi` | 77 | 110 |
| `development.ja` | 28 | 72 |
| `development.vi` | 86 | 140 |
| `closing.ja` | 29 | 56 |
| `closing.vi` | 74 | 110 |

## Approved fixture assertions

| Assertion | Result | Evaluation |
| --- | --- | --- |
| `STATUS_OK` | Pass | Complete `OK` result returned |
| `EXACT_KEY_SET` | Pass | All object key sets match the requested shape |
| `WITHIN_BUDGETS` | Pass | All measured fields are within limits |
| `USES_ONLY_ALLOWED_FACTS` | **Fail** | Unsupported spatial relation and guide state were added |
| `TARGET_ASSIGNMENT_PRESERVED` | Pass | Required target surface appears only in assigned beats |
| `SAFE_PLAIN_TEXT` | Pass | Safe plain text values; no markup or URL |

World-fact findings:

1. `story.value.beats[1].context` places the dog beyond the cat:
   `猫の向こうに犬` / “con chó ở phía bên kia một con mèo.” The packet allows
   both animals to be present and the cat to be a visual distractor, but it does
   not authorize this spatial relationship.
2. `story.value.beats[2].context` says the guide becomes relieved:
   `案内人も安心する` / “người hướng dẫn cũng yên tâm.” The guide allowlist
   permits presence and one request, not a new emotional state.

Under the approved strict allowlist rule, either finding rejects the complete
contribution. These are manual evaluation findings, not production diagnostic
codes; the production packet/import contract is not implemented.

This result does not by itself show that the GPT is unsuitable. It also exposes
a contract-authoring question: whether transient narrative-only relations and
NPC emotions must be explicitly supplied as world claims, or whether a narrow
safe class may be authored without implying runtime state. Run 001 must remain
rejected under its original packet; the project must resolve that rule before
creating a production contract rather than widening the allowlist after seeing
one response.

## Expected-property review

| Expected property | Result | Evaluation |
| --- | --- | --- |
| Compact park premise gives a reason to find the dog | Fail | Objective, premise, and opening ask for an unspecified “thing”; the requested dog is not named until development |
| Japanese primary; Vietnamese concise | Pass | Japanese and Vietnamese are aligned and within limits |
| Mild mystery or surreal element without a cutscene | Fail | “Mystery” appears in the title, but the beats contain no actual mystery or surreal hook |

## Run conclusion

Run 001 proves that the existing GPT can follow the exact JSON transport shape
and suppress its normal worksheet/image text output for this response. It does
not yet prove full Story Sheet viability because the approved fixture fails
world-fact discipline and two human-observation fields remain unresolved.

No repair is requested for this first response. Continue with the remaining
approved fixtures only after recording the two missing observations and using
this failure as evidence for the final `VIABLE`, `BRIDGE_MODE_REQUIRED`, or
`UNSUITABLE` classification.
