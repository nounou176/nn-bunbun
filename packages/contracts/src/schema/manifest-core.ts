import Type, { type Static } from "typebox";

import {
  BCP_47_PATTERN,
  IdSchema,
  JapaneseTextSchema,
  NonBlankStringSchema,
  OneOf,
  SemanticVersionSchema,
  StrictObject,
  StringEnum,
  SupportTextSchema,
  VersionStringSchema,
} from "./common.js";

export const EvidenceCategorySchema = StringEnum([
  "encountered",
  "heard",
  "recognized",
  "selected_correctly",
  "arranged_correctly",
  "typed_correctly",
  "actively_produced",
]);

export const LocalesSchema = StrictObject({
  target: Type.Literal("ja"),
  support: Type.Optional(Type.String({ pattern: BCP_47_PATTERN })),
});

export const LocalizedTextSchema = StrictObject({
  ja: Type.String({ minLength: 1, maxLength: 120, pattern: "\\S" }),
  support: Type.Optional(
    Type.String({ minLength: 1, maxLength: 240, pattern: "\\S" }),
  ),
});

export const TargetGoalSchema = StrictObject({
  minimumEncounters: Type.Integer({ minimum: 1, maximum: 10 }),
  minimumContexts: Type.Integer({ minimum: 1, maximum: 5 }),
  desiredEvidence: Type.Array(EvidenceCategorySchema, { uniqueItems: true }),
});

export const VocabularyTargetContentSchema = StrictObject({
  kind: Type.Literal("VOCABULARY"),
  writtenForms: Type.Array(JapaneseTextSchema, {
    minItems: 1,
    maxItems: 5,
    uniqueItems: true,
  }),
  readings: Type.Array(JapaneseTextSchema, {
    minItems: 1,
    maxItems: 5,
    uniqueItems: true,
  }),
  supportGlosses: Type.Optional(
    Type.Array(SupportTextSchema, {
      minItems: 1,
      maxItems: 5,
      uniqueItems: true,
    }),
  ),
  partOfSpeech: Type.Optional(
    StringEnum([
      "NOUN",
      "VERB",
      "I_ADJECTIVE",
      "NA_ADJECTIVE",
      "ADVERB",
      "EXPRESSION",
      "OTHER",
    ]),
  ),
});

export const GrammarTargetContentSchema = StrictObject({
  kind: Type.Literal("GRAMMAR"),
  pattern: Type.String({ minLength: 1, maxLength: 120, pattern: "\\S" }),
  labelJa: JapaneseTextSchema,
  supportExplanation: Type.Optional(
    Type.String({ minLength: 1, maxLength: 400, pattern: "\\S" }),
  ),
});

export const KanjiTargetContentSchema = StrictObject({
  kind: Type.Literal("KANJI"),
  character: Type.String({ pattern: "^\\p{Script=Han}$" }),
  readings: Type.Array(JapaneseTextSchema, {
    minItems: 1,
    maxItems: 12,
    uniqueItems: true,
  }),
  supportGlosses: Type.Optional(
    Type.Array(SupportTextSchema, {
      minItems: 1,
      maxItems: 8,
      uniqueItems: true,
    }),
  ),
});

const LearningTargetBase = {
  targetId: IdSchema,
  role: StringEnum(["REQUESTED", "SUPPORTING"]),
  priority: Type.Integer({ minimum: 1, maximum: 5 }),
  referenceIds: Type.Array(IdSchema, { uniqueItems: true }),
  goal: TargetGoalSchema,
};

export const VocabularyLearningTargetSchema = StrictObject({
  ...LearningTargetBase,
  kind: Type.Literal("VOCABULARY"),
  content: VocabularyTargetContentSchema,
});

export const GrammarLearningTargetSchema = StrictObject({
  ...LearningTargetBase,
  kind: Type.Literal("GRAMMAR"),
  content: GrammarTargetContentSchema,
});

export const KanjiLearningTargetSchema = StrictObject({
  ...LearningTargetBase,
  kind: Type.Literal("KANJI"),
  content: KanjiTargetContentSchema,
});

export const LearningTargetSchema = OneOf([
  VocabularyLearningTargetSchema,
  GrammarLearningTargetSchema,
  KanjiLearningTargetSchema,
]);

export const SceneSelectionSchema = StrictObject({
  sceneId: IdSchema,
  variantId: Type.Optional(IdSchema),
  playerSpawnPointId: IdSchema,
  cameraPresetId: IdSchema,
  assetBundleIds: Type.Array(IdSchema, { uniqueItems: true }),
});

export const ScenarioSchema = StrictObject({
  template: StringEnum([
    "FIND_SOMETHING",
    "HELP_SOMEONE",
    "BUY_SOMETHING",
    "GO_SOMEWHERE",
    "PREPARE_SOMETHING",
    "DELIVER_SOMETHING",
    "MEET_SOMEONE",
    "SOLVE_SMALL_PROBLEM",
  ]),
  objective: LocalizedTextSchema,
  focusTargetIds: Type.Array(IdSchema, { minItems: 1, uniqueItems: true }),
  synopsis: Type.Optional(Type.String({ maxLength: 500 })),
});

export const LocationInstanceSchema = StrictObject({
  locationId: IdSchema,
  catalogLocationId: IdSchema,
  initialStateId: Type.Optional(IdSchema),
});

export const EntityInstanceSchema = StrictObject({
  entityId: IdSchema,
  catalogEntityId: IdSchema,
  role: StringEnum(["NPC", "ANIMAL"]),
  spawnPointId: IdSchema,
  displayNameJa: Type.Optional(
    Type.String({ minLength: 1, maxLength: 40, pattern: "\\S" }),
  ),
  initialStateId: Type.Optional(IdSchema),
});

export const ObjectInstanceSchema = StrictObject({
  objectId: IdSchema,
  catalogObjectId: IdSchema,
  spawnPointId: IdSchema,
  initialStateId: Type.Optional(IdSchema),
  interactive: Type.Boolean(),
});

export const AudioAssetSchema = StrictObject({
  audioAssetId: IdSchema,
  textJa: Type.String({ minLength: 1, maxLength: 500, pattern: "\\S" }),
  voiceProfileId: IdSchema,
  cacheKey: Type.String({ minLength: 16, maxLength: 128 }),
  durationMs: Type.Optional(Type.Integer({ minimum: 1 })),
});

export const UtteranceSchema = StrictObject({
  speakerEntityId: Type.Optional(IdSchema),
  textJa: Type.String({ minLength: 1, maxLength: 500, pattern: "\\S" }),
  audioAssetId: Type.Optional(IdSchema),
  textVisibility: StringEnum(["ALWAYS", "ON_REPLAY", "ON_HELP", "NEVER"]),
  replayAllowed: Type.Boolean(),
});

export const StimulusSchema = StrictObject(
  {
    instructionJa: Type.Optional(
      Type.String({ minLength: 1, maxLength: 300, pattern: "\\S" }),
    ),
    utterance: Type.Optional(UtteranceSchema),
    supportText: Type.Optional(
      Type.String({ minLength: 1, maxLength: 400, pattern: "\\S" }),
    ),
    supportVisibility: Type.Optional(StringEnum(["ALWAYS", "ON_HELP"])),
  },
  {
    anyOf: [
      {
        type: "object",
        properties: { instructionJa: {} },
        required: ["instructionJa"],
      },
      {
        type: "object",
        properties: { utterance: {} },
        required: ["utterance"],
      },
    ],
  },
);

export const ExposesTargetBindingSchema = StrictObject({
  targetId: IdSchema,
  relation: Type.Literal("EXPOSES"),
});

export const AssessesTargetBindingSchema = StrictObject({
  targetId: IdSchema,
  relation: Type.Literal("ASSESSES"),
  successEvidence: EvidenceCategorySchema,
});

export const TargetBindingSchema = OneOf([
  ExposesTargetBindingSchema,
  AssessesTargetBindingSchema,
]);

export const AttemptPolicySchema = StrictObject({
  maximumAttempts: Type.Integer({ minimum: 1, maximum: 5 }),
  afterMaximum: StringEnum(["CONTINUE_ASSISTED", "FOLLOW_FAILURE_TRANSITION"]),
  preserveSubmittedState: Type.Boolean(),
});

const ScaffoldBase = {
  scaffoldId: IdSchema,
  afterAttempt: Type.Integer({ minimum: 1, maximum: 5 }),
};

export const ScaffoldSchema = OneOf([
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("REPLAY_AUDIO"),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("SHOW_JAPANESE_TEXT"),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("HIGHLIGHT_OBJECTS"),
    objectIds: Type.Array(IdSchema, { minItems: 1, uniqueItems: true }),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("HIGHLIGHT_ENTITIES"),
    entityIds: Type.Array(IdSchema, { minItems: 1, uniqueItems: true }),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("REDUCE_OBJECT_CANDIDATES"),
    objectIds: Type.Array(IdSchema, { minItems: 1, uniqueItems: true }),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("REDUCE_CHOICE_CANDIDATES"),
    optionIds: Type.Array(IdSchema, { minItems: 1, uniqueItems: true }),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("SHOW_READING"),
    textJa: Type.String({ minLength: 1, maxLength: 120, pattern: "\\S" }),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("SHOW_MEANING"),
    supportText: Type.String({
      minLength: 1,
      maxLength: 240,
      pattern: "\\S",
    }),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("SHOW_PATTERN"),
    textJa: Type.String({ minLength: 1, maxLength: 240, pattern: "\\S" }),
  }),
  StrictObject({
    ...ScaffoldBase,
    kind: Type.Literal("RECOGNITION_FALLBACK"),
    fallbackStepId: IdSchema,
  }),
]);

export const FeedbackMessageSchema = StrictObject(
  {
    textJa: Type.Optional(
      Type.String({ minLength: 1, maxLength: 240, pattern: "\\S" }),
    ),
    supportText: Type.Optional(
      Type.String({ minLength: 1, maxLength: 240, pattern: "\\S" }),
    ),
    displayMs: Type.Integer({ minimum: 0, maximum: 4000 }),
    cueIds: Type.Array(IdSchema, { uniqueItems: true }),
  },
  {
    anyOf: [
      {
        type: "object",
        properties: { textJa: {} },
        required: ["textJa"],
      },
      {
        type: "object",
        required: ["cueIds"],
        properties: { cueIds: { type: "array", minItems: 1 } },
      },
    ],
  },
);

export const FeedbackSchema = StrictObject({
  correct: FeedbackMessageSchema,
  incorrect: FeedbackMessageSchema,
  assisted: FeedbackMessageSchema,
});

export const PresentationCuesSchema = StrictObject({
  onEnterCueIds: Type.Array(IdSchema, { uniqueItems: true }),
  onSuccessCueIds: Type.Array(IdSchema, { uniqueItems: true }),
  onFailureCueIds: Type.Array(IdSchema, { uniqueItems: true }),
});

export const TransitionTargetSchema = OneOf([
  StrictObject({
    kind: Type.Literal("STEP"),
    stepId: IdSchema,
  }),
  StrictObject({
    kind: Type.Literal("COMPLETE"),
  }),
]);

export const TransitionsSchema = StrictObject({
  onSuccess: TransitionTargetSchema,
  onFailure: TransitionTargetSchema,
  onAssisted: TransitionTargetSchema,
});

export const CompletionPolicySchema = StrictObject({
  requiredStepIds: Type.Array(IdSchema, { uniqueItems: true }),
  closingMessage: Type.Optional(LocalizedTextSchema),
});

export const QualityTargetsSchema = StrictObject({
  intendedReactionCount: Type.Integer({ minimum: 1, maximum: 60 }),
  preferredReactionIntervalMinSeconds: Type.Literal(5),
  preferredReactionIntervalMaxSeconds: Type.Literal(12),
  estimatedActiveMinutes: Type.Number({ exclusiveMinimum: 0, maximum: 30 }),
  maximumNpcCount: Type.Integer({ minimum: 0, maximum: 5 }),
  maximumInteractiveObjectCount: Type.Integer({ minimum: 0, maximum: 30 }),
  preferredMaximumDrawCalls: Type.Integer({ minimum: 1, maximum: 100 }),
});

export const VersionReferenceSchema = StrictObject({
  id: Type.String({ minLength: 1, maxLength: 80, pattern: "\\S" }),
  version: VersionStringSchema,
});

export const ProvenanceSchema = StrictObject({
  compilerVersion: SemanticVersionSchema,
  contractVersion: Type.Literal("0.1.0"),
  source: StringEnum(["AI_ASSISTED", "AUTHORED"]),
  inputHash: NonBlankStringSchema,
  promptModuleVersions: Type.Array(VersionReferenceSchema),
  referenceDataVersions: Type.Array(VersionReferenceSchema),
});

export type EvidenceCategory = Static<typeof EvidenceCategorySchema>;
export type Locales = Static<typeof LocalesSchema>;
export type LocalizedText = Static<typeof LocalizedTextSchema>;
export type TargetGoal = Static<typeof TargetGoalSchema>;
export type LearningTarget = Static<typeof LearningTargetSchema>;
export type SceneSelection = Static<typeof SceneSelectionSchema>;
export type Scenario = Static<typeof ScenarioSchema>;
export type LocationInstance = Static<typeof LocationInstanceSchema>;
export type EntityInstance = Static<typeof EntityInstanceSchema>;
export type ObjectInstance = Static<typeof ObjectInstanceSchema>;
export type AudioAsset = Static<typeof AudioAssetSchema>;
export type Utterance = Static<typeof UtteranceSchema>;
export type Stimulus = Static<typeof StimulusSchema>;
export type TargetBinding = Static<typeof TargetBindingSchema>;
export type AttemptPolicy = Static<typeof AttemptPolicySchema>;
export type Scaffold = Static<typeof ScaffoldSchema>;
export type FeedbackMessage = Static<typeof FeedbackMessageSchema>;
export type Feedback = Static<typeof FeedbackSchema>;
export type PresentationCues = Static<typeof PresentationCuesSchema>;
export type TransitionTarget = Static<typeof TransitionTargetSchema>;
export type Transitions = Static<typeof TransitionsSchema>;
export type CompletionPolicy = Static<typeof CompletionPolicySchema>;
export type QualityTargets = Static<typeof QualityTargetsSchema>;
export type VersionReference = Static<typeof VersionReferenceSchema>;
export type Provenance = Static<typeof ProvenanceSchema>;
