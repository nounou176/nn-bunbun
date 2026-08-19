import Type, { type Static, type TSchema } from "typebox";

import {
  AUTHORING_CONTRACT_VERSION,
  AUTHORING_PACKET_VERSION,
} from "../version.js";
import { IdSchema, OneOf, StrictObject, StringEnum } from "./common.js";

export const AUTHORING_REQUEST_FORMAT =
  "bunbun_m7_v3_2_lesson_authoring" as const;
export const AUTHORING_RESULT_FORMAT =
  "bunbun_m7_v3_2_lesson_authoring_result" as const;
export const AUTHORING_INPUT_HASH_CANONICALIZATION =
  "UTF8_SHA256_OF_RECURSIVELY_KEY_SORTED_COMPACT_JSON" as const;

export const APPROVED_AUTHORING_PROMPT_PACK = [
  {
    moduleId: "story_sheet",
    moduleVersion: "0.1.0",
    promptSha256:
      "61df189356ee388b05ef3c1564caac9c72fc840568287991999423c5d3e70def",
  },
  {
    moduleId: "reverse_trainer",
    moduleVersion: "0.1.0",
    promptSha256:
      "301f8ae5baea44afdf79501806805e3b1e775fd02a43a0f8fd60a8472305286b",
  },
  {
    moduleId: "story_coach",
    moduleVersion: "0.1.0",
    promptSha256:
      "73a74c5f55bc7ab2fd9e4850c3414f86f161b882168d89c22cd2c2b433dad1d7",
  },
] as const;

const Nullable = <Schema extends TSchema>(schema: Schema) =>
  OneOf([schema, Type.Null()]);

const Sha256Schema = Type.String({ pattern: "^[a-f0-9]{64}$" });
const BoundedTextSchema = Type.String({ minLength: 1, maxLength: 2_000 });
const NullableBoundedTextSchema = Nullable(BoundedTextSchema);
const CharacterLimitSchema = Type.Integer({ minimum: 1, maximum: 2_000 });
const IdListSchema = Type.Array(IdSchema, {
  maxItems: 64,
  uniqueItems: true,
});

export const TargetKindSchema = StringEnum(["VOCABULARY", "GRAMMAR"]);
export const ReferenceAuthoritySchema = StringEnum([
  "REVIEWED",
  "LEARNER_SUPPLIED",
]);
export const StoryBeatRoleSchema = StringEnum([
  "OPENING",
  "DEVELOPMENT",
  "TURN",
  "CLOSING",
]);
export const DifficultyBandSchema = StringEnum([
  "SUPPORTED",
  "GUIDED",
  "INDEPENDENT",
]);
export const AuthoringPrimitiveSchema = StringEnum([
  "LISTEN",
  "CLICK_OBJECT",
  "CHOOSE",
  "ARRANGE",
  "TYPE",
  "MOVE_TO",
  "PICK_UP",
  "GIVE",
]);
export const AuthoringNormalizationRuleSchema = StringEnum([
  "UNICODE_NFKC",
  "TRIM",
  "COLLAPSE_WHITESPACE",
  "IGNORE_JAPANESE_PUNCTUATION",
  "KANA_EQUIVALENCE",
]);

export const NormalizedTargetInputSchema = StrictObject({
  targetId: IdSchema,
  kind: TargetKindSchema,
  writtenForm: Nullable(Type.String({ minLength: 1, maxLength: 120 })),
  reading: Nullable(Type.String({ minLength: 1, maxLength: 120 })),
  grammarPattern: Nullable(Type.String({ minLength: 1, maxLength: 120 })),
  supportGlossesVi: Type.Array(Type.String({ minLength: 1, maxLength: 240 }), {
    minItems: 1,
    maxItems: 8,
    uniqueItems: true,
  }),
  referenceAuthority: ReferenceAuthoritySchema,
});

export const WorldClaimInputSchema = StrictObject({
  claimId: IdSchema,
  statement: Type.String({ minLength: 1, maxLength: 320 }),
});

export const WorldFactInputSchema = StrictObject({
  factId: IdSchema,
  catalogId: IdSchema,
  kind: StringEnum(["SCENE", "ENTITY", "OBJECT", "LOCATION", "CUE"]),
  labelJa: Type.String({ minLength: 1, maxLength: 80 }),
  allowedClaims: Type.Array(WorldClaimInputSchema, {
    minItems: 1,
    maxItems: 16,
  }),
});

export const StoryBeatInputSchema = StrictObject({
  beatId: IdSchema,
  role: StoryBeatRoleSchema,
  requiredTargetIds: IdListSchema,
  allowedWorldClaimIds: IdListSchema,
  maxJapaneseCharacters: CharacterLimitSchema,
  maxVietnameseCharacters: CharacterLimitSchema,
});

export const PracticeSlotInputSchema = StrictObject({
  slotId: IdSchema,
  stepId: IdSchema,
  beatId: IdSchema,
  primitive: AuthoringPrimitiveSchema,
  difficulty: DifficultyBandSchema,
  targetIds: IdListSchema,
  candidateIds: IdListSchema,
  acceptedCandidateIds: IdListSchema,
  normalizationRules: Type.Array(AuthoringNormalizationRuleSchema, {
    maxItems: 5,
    uniqueItems: true,
  }),
  permitsDistractors: Type.Boolean(),
  permitsAcceptedText: Type.Boolean(),
  permitsArrangeSegments: Type.Boolean(),
  maxJapaneseCharacters: CharacterLimitSchema,
});

export const ScaffoldSlotInputSchema = StrictObject({
  scaffoldSlotId: IdSchema,
  kind: StringEnum([
    "REPLAY_AUDIO",
    "SHOW_JAPANESE_TEXT",
    "HIGHLIGHT_OBJECTS",
    "HIGHLIGHT_ENTITIES",
    "REDUCE_OBJECT_CANDIDATES",
    "REDUCE_CHOICE_CANDIDATES",
    "SHOW_READING",
    "SHOW_MEANING",
    "SHOW_PATTERN",
  ]),
  revealLevel: StringEnum(["INDIRECT", "FOCUSED", "DIRECT"]),
  afterAttempt: Type.Integer({ minimum: 1, maximum: 10 }),
  permitsJapaneseText: Type.Boolean(),
  permitsVietnameseText: Type.Boolean(),
  maxJapaneseCharacters: CharacterLimitSchema,
  maxVietnameseCharacters: CharacterLimitSchema,
});

export const CoachingSlotInputSchema = StrictObject({
  stepId: IdSchema,
  difficulty: DifficultyBandSchema,
  targetIds: IdListSchema,
  scaffoldSlots: Type.Array(ScaffoldSlotInputSchema, { maxItems: 12 }),
  permitsInstructionSupport: Type.Boolean(),
  maxInstructionJapaneseCharacters: CharacterLimitSchema,
  maxInstructionVietnameseCharacters: CharacterLimitSchema,
  maxFeedbackJapaneseCharacters: CharacterLimitSchema,
  maxFeedbackVietnameseCharacters: CharacterLimitSchema,
});

export const LessonAuthoringEnvelopeInputSchema = StrictObject({
  contractVersion: Type.Literal(AUTHORING_CONTRACT_VERSION),
  targetLocale: Type.Literal("ja"),
  supportLocale: Type.Literal("vi"),
  sceneId: IdSchema,
  scenarioTemplate: Type.String({ minLength: 1, maxLength: 80 }),
  normalizedTargets: Type.Array(NormalizedTargetInputSchema, {
    minItems: 1,
    maxItems: 16,
  }),
  worldFacts: Type.Array(WorldFactInputSchema, {
    minItems: 1,
    maxItems: 64,
  }),
  storyBeats: Type.Array(StoryBeatInputSchema, {
    minItems: 1,
    maxItems: 4,
  }),
  practiceSlots: Type.Array(PracticeSlotInputSchema, { maxItems: 24 }),
  coachingSlots: Type.Array(CoachingSlotInputSchema, { maxItems: 24 }),
});

const LocalizedFieldLimitSchema = StrictObject({
  maxJapaneseCharacters: CharacterLimitSchema,
  maxVietnameseCharacters: CharacterLimitSchema,
});

export const AuthoringOutputLimitsSchema = StrictObject({
  title: LocalizedFieldLimitSchema,
  objective: LocalizedFieldLimitSchema,
  premise: LocalizedFieldLimitSchema,
  settingContext: LocalizedFieldLimitSchema,
  synopsisMaxCharacters: CharacterLimitSchema,
});

const PromptPackEntrySchema = OneOf([
  StrictObject({
    moduleId: Type.Literal(APPROVED_AUTHORING_PROMPT_PACK[0].moduleId),
    moduleVersion: Type.Literal(
      APPROVED_AUTHORING_PROMPT_PACK[0].moduleVersion,
    ),
    promptSha256: Type.Literal(APPROVED_AUTHORING_PROMPT_PACK[0].promptSha256),
  }),
  StrictObject({
    moduleId: Type.Literal(APPROVED_AUTHORING_PROMPT_PACK[1].moduleId),
    moduleVersion: Type.Literal(
      APPROVED_AUTHORING_PROMPT_PACK[1].moduleVersion,
    ),
    promptSha256: Type.Literal(APPROVED_AUTHORING_PROMPT_PACK[1].promptSha256),
  }),
  StrictObject({
    moduleId: Type.Literal(APPROVED_AUTHORING_PROMPT_PACK[2].moduleId),
    moduleVersion: Type.Literal(
      APPROVED_AUTHORING_PROMPT_PACK[2].moduleVersion,
    ),
    promptSha256: Type.Literal(APPROVED_AUTHORING_PROMPT_PACK[2].promptSha256),
  }),
]);

const PromptPackSchema = Type.Array(PromptPackEntrySchema, {
  minItems: 3,
  maxItems: 3,
});

export const LessonAuthoringRequestSchema = StrictObject(
  {
    packetFormat: Type.Literal(AUTHORING_REQUEST_FORMAT),
    packetVersion: Type.Literal(AUTHORING_PACKET_VERSION),
    requestId: IdSchema,
    fixtureId: IdSchema,
    attempt: Type.Integer({ minimum: 1, maximum: 2 }),
    mediaPolicy: Type.Literal("TEXT_ONLY"),
    responseFormat: Type.Literal("STRICT_JSON_OBJECT"),
    inputHashCanonicalization: Type.Literal(
      AUTHORING_INPUT_HASH_CANONICALIZATION,
    ),
    inputSha256: Sha256Schema,
    promptPack: PromptPackSchema,
    dataPolicy: StrictObject({
      classification: Type.Literal("AUTHORED_FIXTURE"),
      containsLearnerData: Type.Literal(false),
      disclosure: Type.Literal(
        "This authored fixture sends normalized Japanese targets and compact authoring facts to ChatGPT or Codex. It contains no learner identity, progress, evidence, TYPE response, checkpoint, secret, or private chat history.",
      ),
    }),
    outputLimits: AuthoringOutputLimitsSchema,
    input: LessonAuthoringEnvelopeInputSchema,
  },
  { $id: "https://bunbun.local/schemas/lesson-authoring-request-0.1.0.json" },
);

export const LocalizedDraftTextSchema = StrictObject({
  ja: BoundedTextSchema,
  vi: BoundedTextSchema,
});

export const StoryBeatDraftSchema = StrictObject({
  beatId: IdSchema,
  usedWorldClaimIds: IdListSchema,
  context: LocalizedDraftTextSchema,
});

export const StorySheetContributionSchema = StrictObject({
  title: LocalizedDraftTextSchema,
  objective: LocalizedDraftTextSchema,
  premise: LocalizedDraftTextSchema,
  settingContext: LocalizedDraftTextSchema,
  synopsis: BoundedTextSchema,
  beats: Type.Array(StoryBeatDraftSchema, { minItems: 1, maxItems: 4 }),
});

export const PhraseSegmentDraftSchema = StrictObject({
  surfaceJa: BoundedTextSchema,
  readingKana: NullableBoundedTextSchema,
  meaningVi: BoundedTextSchema,
  functionVi: BoundedTextSchema,
});

export const TargetPhraseAnalysisDraftSchema = StrictObject({
  targetId: IdSchema,
  segments: Type.Array(PhraseSegmentDraftSchema, {
    minItems: 1,
    maxItems: 16,
  }),
});

export const PracticeItemDraftSchema = StrictObject({
  slotId: IdSchema,
  stimulusJa: BoundedTextSchema,
  acceptedResponsesJa: Type.Array(BoundedTextSchema, {
    maxItems: 16,
    uniqueItems: true,
  }),
  arrangeSegmentsJa: Type.Array(BoundedTextSchema, {
    maxItems: 16,
  }),
  distractorsJa: Type.Array(BoundedTextSchema, {
    maxItems: 16,
    uniqueItems: true,
  }),
});

export const ReverseTrainerContributionSchema = StrictObject({
  targetAnalysis: Type.Array(TargetPhraseAnalysisDraftSchema, {
    minItems: 1,
    maxItems: 16,
  }),
  practiceItems: Type.Array(PracticeItemDraftSchema, { maxItems: 24 }),
});

export const ScaffoldCopyDraftSchema = StrictObject({
  scaffoldSlotId: IdSchema,
  textJa: NullableBoundedTextSchema,
  textVi: NullableBoundedTextSchema,
});

export const FeedbackCopyDraftSchema = StrictObject({
  textJa: BoundedTextSchema,
  textVi: NullableBoundedTextSchema,
});

export const StepCoachingDraftSchema = StrictObject({
  stepId: IdSchema,
  instructionJa: BoundedTextSchema,
  instructionVi: NullableBoundedTextSchema,
  hintJa: BoundedTextSchema,
  hintVi: NullableBoundedTextSchema,
  scaffoldCopy: Type.Array(ScaffoldCopyDraftSchema, { maxItems: 12 }),
  correct: FeedbackCopyDraftSchema,
  incorrect: FeedbackCopyDraftSchema,
  assisted: FeedbackCopyDraftSchema,
});

export const StoryCoachContributionSchema = StrictObject({
  steps: Type.Array(StepCoachingDraftSchema, { maxItems: 24 }),
});

function ModuleResultSchema<Schema extends TSchema>(schema: Schema) {
  return OneOf([
    StrictObject({
      status: Type.Literal("OK"),
      failureCode: Type.Null(),
      value: schema,
    }),
    StrictObject({
      status: Type.Literal("CANNOT_COMPLY"),
      failureCode: Type.String({ pattern: "^[A-Z][A-Z0-9_]{2,63}$" }),
      value: Type.Null(),
    }),
  ]);
}

export const LessonContentDraftContributionsSchema = StrictObject({
  story: ModuleResultSchema(StorySheetContributionSchema),
  reverseTraining: ModuleResultSchema(ReverseTrainerContributionSchema),
  coaching: ModuleResultSchema(StoryCoachContributionSchema),
});

export const LessonAuthoringResultSchema = StrictObject(
  {
    packetFormat: Type.Literal(AUTHORING_RESULT_FORMAT),
    packetVersion: Type.Literal(AUTHORING_PACKET_VERSION),
    requestId: IdSchema,
    inputSha256: Sha256Schema,
    promptPack: PromptPackSchema,
    contributions: LessonContentDraftContributionsSchema,
  },
  { $id: "https://bunbun.local/schemas/lesson-authoring-result-0.1.0.json" },
);

export type NormalizedTargetInput = Static<typeof NormalizedTargetInputSchema>;
export type WorldClaimInput = Static<typeof WorldClaimInputSchema>;
export type WorldFactInput = Static<typeof WorldFactInputSchema>;
export type StoryBeatInput = Static<typeof StoryBeatInputSchema>;
export type PracticeSlotInput = Static<typeof PracticeSlotInputSchema>;
export type ScaffoldSlotInput = Static<typeof ScaffoldSlotInputSchema>;
export type CoachingSlotInput = Static<typeof CoachingSlotInputSchema>;
export type LessonAuthoringEnvelopeInput = Static<
  typeof LessonAuthoringEnvelopeInputSchema
>;
export type LessonAuthoringRequest = Static<
  typeof LessonAuthoringRequestSchema
>;
export type LessonContentDraftContributions = Static<
  typeof LessonContentDraftContributionsSchema
>;
export type LessonAuthoringResult = Static<typeof LessonAuthoringResultSchema>;
