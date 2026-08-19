# Story Sheet Prompt Module 0.1.0

Status: Packaged in M7 v3.2 proof; application compiler inactive
Module ID: `story_sheet`
Roadmap owner: Milestone 7

## Provenance

- Captured Custom GPT: `Nunu JP Story Sheet`
- Captured source: `gpts/Nunu JP Story Sheet/config.md`
- Capture date: 2026-08-12
- Source revision identity:
  `sha256:1c4bd4b19b0c1fc0ae80f3359cbe1044c8e85e098c7a65b2d998ca0a071a9684`
- Approved prompt:
  `docs/ai-modules/prompts/story-sheet-0.1.0.txt`
- Prompt content hash:
  `sha256:61df189356ee388b05ef3c1564caac9c72fc840568287991999423c5d3e70def`
- GPT editor model, capabilities, actions, and version-history label: not
  supplied and not inherited
- Knowledge assets: 21 local PNG style/output examples; excluded from M7 prompt
  input, lesson/reference content, and evaluation

## Source behavior retained

- Convert supplied learning targets into one memorable short story.
- Prefer coherent, safe, mildly mysterious or surreal context when compatible
  with the selected scene.
- Use a clear opening, development, turn, and closing when the compiler provides
  those beat roles.
- Keep Japanese intact and provide concise Vietnamese support.
- Avoid overloading one beat with too many learning targets.

## Source behavior removed

- Image generation, A4 worksheets, pagination, layout, typography, and icons.
- Gloss/JP/Romaji/VI tables and automatic romaji generation.
- Automatic translation, reading, grammar, or reference inference.
- Unbounded story length and favorite themes that are absent from the selected
  world, such as trains, stations, boxes, or disappearing cities.
- Choosing target distribution, interaction steps, mechanics, difficulty,
  scaffolds, feedback, timings, or transitions.

## Typed responsibility

Input subset:

- normalized target IDs and reviewed/learner-supplied linguistic fields;
- selected scene and scenario template;
- allowed world facts;
- compiler-owned story beat IDs, roles, target assignments, and text budgets.

Owned output:

- `story.value.title`;
- `story.value.objective`;
- `story.value.premise`;
- `story.value.settingContext`;
- `story.value.synopsis`; and
- `story.value.beats[*].context` keyed by the supplied `beatId`.

The module does not own any field in `reverseTraining` or `coaching`. See
`CONTRACT.md` for the complete contribution types.

## Data boundary

Allowed:

- the compact `LessonAuthoringEnvelopeInput` fields required for story work;
- the other contribution fields inside the same structured request as read-only
  context; and
- stable redacted validator diagnostics during the single permitted repair.

Forbidden:

- raw user input before normalization;
- learner identity, evidence, progress, checkpoints, or TYPE responses;
- Custom GPT links, source instructions, images, APKG, or unrelated knowledge;
- secrets, URLs, arbitrary files, tools, or external reference access.

## Deterministic validators

- Exact one-to-one beat ID coverage with no reordering or duplicate beat.
- Exact target assignment and world-fact allowlist compliance per beat.
- Japanese and Vietnamese character limits from the compiler envelope.
- Plain-text and content-safety checks.
- No unsupported world noun or action represented as a real scene capability.
- Complete LessonManifest target coverage, graph, budget, and runtime validation
  after deterministic normalization.

## Failure behavior

Return `story.status = "CANNOT_COMPLY"`, a stable non-sensitive failure code,
and `story.value = null` when coherent safe text cannot be written from the
allowed facts. The whole draft then fails or receives the one bounded repair.
There is no generic story fallback and no substitution of another scene.

## Evaluation

Text-only fixture set:
`docs/ai-modules/evals/story-sheet-0.1.0.json`

Minimum approval bar:

- all three expected-behavior fixtures satisfy every assertion;
- both rejected-behavior fixtures trigger their required rejection or omission
  behavior; and
- no fixture requires an image or APKG.

## Approval

- Source identity: Confirmed through D-023
- Responsibility mapping: Accepted through D-023
- Approved module version: `0.1.0`
- Typed adaptation: Approved on 2026-08-12 under D-024
- Prompt fragment and hash: Approved on 2026-08-12 under D-024
- Evaluation fixtures: Approved on 2026-08-12 under D-024
- Activation: Packaged in the M7 v3.2 Skills-only proof; not application-
  compiler or runtime-active
