# Prompt Module Contribution Contract 0.1.0

Status: Approved under D-024; implemented for the M7 v3.2 transport proof

## Boundary

The compiler sends one compact code-owned input envelope and requests one
strict LessonContentDraft. The three prompt modules own disjoint contribution
fields inside that draft. They do not call each other and do not receive hidden
conversation state.

The interfaces below are implemented as closed TypeBox schemas in
`packages/contracts/src/schema/authoring.ts`. M7 v3.2 uses them for a local
transport proof only; no application compiler job, persistence, publication,
or runtime provider is active. Every model-output property is required;
nullable values represent unavailable content or a module failure.

## Code-owned input

```ts
type TargetKind = "VOCABULARY" | "GRAMMAR";
type ReferenceAuthority = "REVIEWED" | "LEARNER_SUPPLIED";
type StoryBeatRole = "OPENING" | "DEVELOPMENT" | "TURN" | "CLOSING";
type DifficultyBand = "SUPPORTED" | "GUIDED" | "INDEPENDENT";
type Primitive =
  | "LISTEN"
  | "CLICK_OBJECT"
  | "CHOOSE"
  | "ARRANGE"
  | "TYPE"
  | "MOVE_TO"
  | "PICK_UP"
  | "GIVE";

interface NormalizedTargetInput {
  targetId: string;
  kind: TargetKind;
  writtenForm: string | null;
  reading: string | null;
  grammarPattern: string | null;
  supportGlossesVi: readonly string[];
  referenceAuthority: ReferenceAuthority;
}

interface WorldClaimInput {
  claimId: string;
  statement: string;
}

interface WorldFactInput {
  factId: string;
  catalogId: string;
  kind: "SCENE" | "ENTITY" | "OBJECT" | "LOCATION" | "CUE";
  labelJa: string;
  allowedClaims: readonly WorldClaimInput[];
}

interface StoryBeatInput {
  beatId: string;
  role: StoryBeatRole;
  requiredTargetIds: readonly string[];
  allowedWorldClaimIds: readonly string[];
  maxJapaneseCharacters: number;
  maxVietnameseCharacters: number;
}

interface PracticeSlotInput {
  slotId: string;
  stepId: string;
  beatId: string;
  primitive: Primitive;
  difficulty: DifficultyBand;
  targetIds: readonly string[];
  candidateIds: readonly string[];
  acceptedCandidateIds: readonly string[];
  normalizationRules: readonly string[];
  permitsDistractors: boolean;
  permitsAcceptedText: boolean;
  permitsArrangeSegments: boolean;
  maxJapaneseCharacters: number;
}

interface ScaffoldSlotInput {
  scaffoldSlotId: string;
  kind:
    | "REPLAY_AUDIO"
    | "SHOW_JAPANESE_TEXT"
    | "HIGHLIGHT_OBJECTS"
    | "HIGHLIGHT_ENTITIES"
    | "REDUCE_OBJECT_CANDIDATES"
    | "REDUCE_CHOICE_CANDIDATES"
    | "SHOW_READING"
    | "SHOW_MEANING"
    | "SHOW_PATTERN";
  revealLevel: "INDIRECT" | "FOCUSED" | "DIRECT";
  afterAttempt: number;
  permitsJapaneseText: boolean;
  permitsVietnameseText: boolean;
  maxJapaneseCharacters: number;
  maxVietnameseCharacters: number;
}

interface CoachingSlotInput {
  stepId: string;
  difficulty: DifficultyBand;
  targetIds: readonly string[];
  scaffoldSlots: readonly ScaffoldSlotInput[];
  permitsInstructionSupport: boolean;
  maxInstructionJapaneseCharacters: number;
  maxInstructionVietnameseCharacters: number;
  maxFeedbackJapaneseCharacters: number;
  maxFeedbackVietnameseCharacters: number;
}

interface LessonAuthoringEnvelopeInput {
  contractVersion: "0.1.0";
  targetLocale: "ja";
  supportLocale: "vi";
  sceneId: string;
  scenarioTemplate: string;
  normalizedTargets: readonly NormalizedTargetInput[];
  worldFacts: readonly WorldFactInput[];
  storyBeats: readonly StoryBeatInput[];
  practiceSlots: readonly PracticeSlotInput[];
  coachingSlots: readonly CoachingSlotInput[];
}
```

The envelope excludes raw user text after normalization, Custom GPT links and
source files, images/APKG, learner identity, gameplay evidence, TYPE responses,
progress, checkpoints, secrets, and unrelated catalog data.

## Model-owned contribution output

```ts
interface LocalizedDraftText {
  ja: string;
  vi: string;
}

interface ModuleResult<T> {
  status: "OK" | "CANNOT_COMPLY";
  failureCode: string | null;
  value: T | null;
}

interface StoryBeatDraft {
  beatId: string;
  usedWorldClaimIds: string[];
  context: LocalizedDraftText;
}

interface StorySheetContribution {
  title: LocalizedDraftText;
  objective: LocalizedDraftText;
  premise: LocalizedDraftText;
  settingContext: LocalizedDraftText;
  synopsis: string;
  beats: StoryBeatDraft[];
}

interface PhraseSegmentDraft {
  surfaceJa: string;
  readingKana: string | null;
  meaningVi: string;
  functionVi: string;
}

interface TargetPhraseAnalysisDraft {
  targetId: string;
  segments: PhraseSegmentDraft[];
}

interface PracticeItemDraft {
  slotId: string;
  stimulusJa: string;
  acceptedResponsesJa: string[];
  arrangeSegmentsJa: string[];
  distractorsJa: string[];
}

interface ReverseTrainerContribution {
  targetAnalysis: TargetPhraseAnalysisDraft[];
  practiceItems: PracticeItemDraft[];
}

interface ScaffoldCopyDraft {
  scaffoldSlotId: string;
  textJa: string | null;
  textVi: string | null;
}

interface FeedbackCopyDraft {
  textJa: string;
  textVi: string | null;
}

interface StepCoachingDraft {
  stepId: string;
  instructionJa: string;
  instructionVi: string | null;
  hintJa: string;
  hintVi: string | null;
  scaffoldCopy: ScaffoldCopyDraft[];
  correct: FeedbackCopyDraft;
  incorrect: FeedbackCopyDraft;
  assisted: FeedbackCopyDraft;
}

interface StoryCoachContribution {
  steps: StepCoachingDraft[];
}

interface LessonContentDraftContributions {
  story: ModuleResult<StorySheetContribution>;
  reverseTraining: ModuleResult<ReverseTrainerContribution>;
  coaching: ModuleResult<StoryCoachContribution>;
}
```

## M7 v3.2 transport packets

The Skills-only proof wraps the compiler envelope and contribution object in
two closed identity-bearing packet schemas:

- request format `bunbun_m7_v3_2_lesson_authoring@0.1.0`; and
- result format `bunbun_m7_v3_2_lesson_authoring_result@0.1.0`.

The request includes `requestId`, authored `fixtureId`, attempt `1` or `2`,
text-only and strict-JSON policies, explicit authored-fixture disclosure, story
output budgets, the fixed ordered prompt pack, and `inputSha256`. The input hash
is SHA-256 over UTF-8 recursively key-sorted compact JSON of the `input` object.
The result echoes `requestId`, `inputSha256`, and the exact prompt pack before
returning one `LessonContentDraftContributions` object.

The approved prompt pack remains, in order:

1. `story_sheet@0.1.0` —
   `61df189356ee388b05ef3c1564caac9c72fc840568287991999423c5d3e70def`;
2. `reverse_trainer@0.1.0` —
   `301f8ae5baea44afdf79501806805e3b1e775fd02a43a0f8fd60a8472305286b`;
3. `story_coach@0.1.0` —
   `73a74c5f55bc7ab2fd9e4850c3414f86f161b882168d89c22cd2c2b433dad1d7`.

Generated JSON Schemas live under `packages/contracts/schemas/` and exact
copies required by the Skill live under
`plugins/bunbun-authoring/skills/bunbun-lesson-authoring/references/`.

## Ownership and conflict resolution

| Concern                                                                | Owner                    | Other modules must do                  |
| ---------------------------------------------------------------------- | ------------------------ | -------------------------------------- |
| Premise, story, setting, beat context                                  | Story Sheet              | Treat as read-only context             |
| Phrase segmentation and practice response text                         | Reverse Trainer          | Do not redefine answer truth           |
| Instructions, hints, scaffold copy, feedback                           | Story Coach              | Do not create extra support stages     |
| IDs, primitives, sequence, difficulty, candidates, timing, transitions | Deterministic code       | Echo only permitted slot/step/beat IDs |
| Readings, glosses, grammar/reference truth                             | Deterministic references | Reuse without invention                |

If two module instructions appear to overlap, this table wins. The code-owned
compiler envelope wins over every module prompt.

## Deterministic normalization and validation

The server must reject the draft when any of these checks fails:

- a module returns `CANNOT_COMPLY` or an `OK` result with a null value;
- any unknown, missing, duplicate, reordered, or unfilled beat/slot/step ID;
- a story beat declares a world claim not allowed for that beat;
- target coverage moves away from the compiler-owned beat or practice slot;
- phrase readings or meanings conflict with authoritative input;
- a practice field is populated for a response shape that forbids it;
- a distractor normalizes to an accepted response;
- ARRANGE segments do not reconstruct the accepted Japanese response exactly;
- a hint reveals an answer before its allowed reveal level;
- scaffold copy conflicts with its closed scaffold kind;
- feedback claims unaided success for an assisted result;
- text exceeds a compiler-provided limit or contains markup, URLs, control
  instructions, or unsafe content; or
- the resulting LessonManifest fails structural, semantic, or runtime-
  capability validation.

The normalizer assigns final manifest, option, token, audio, and provenance IDs
and never accepts model-generated replacements for those identifiers.

The claim-ID refinement closes the ambiguity recorded by v3.1 Run 001 without
changing that historical result: plausible real-world implications are not
automatically authorized. A dog being present does not imply a reaction,
relationship, movement, or state. The author must conservatively bind each beat
to exact compiler-supplied claim IDs, and local code rejects out-of-beat claims.
Claim binding improves deterministic traceability but does not turn model copy
into truth; later compiler publication still requires catalog and runtime
validation.

## Failure behavior

One failed module contribution fails the complete draft. The compiler may issue
one bounded repair using the same module versions and stable redacted validator
diagnostics. A second failure ends the durable job. There is no generic-prompt,
alternate-model, authored-content, or partial-manifest fallback.

## Privacy boundary

Allowed provider data is limited to the fields in
`LessonAuthoringEnvelopeInput` and, for one repair, the prior structured draft
plus stable redacted diagnostics. No local gameplay or identity data is a
module input. Prompt source files and evaluation fixtures stay code-owned and
are not learner data.
