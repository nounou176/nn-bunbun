import Type, { type Static } from "typebox";

import { ADAPTIVE_LEARNING_SCHEMA_VERSION } from "../version.js";
import {
  IdSchema,
  JapaneseTextSchema,
  OneOf,
  SemanticVersionSchema,
  StrictObject,
  StringEnum,
  SupportTextSchema,
  VersionStringSchema,
} from "./common.js";
import { LocalizedTextSchema } from "./manifest-core.js";
import { TargetProgressSignalSchema } from "./evidence-persistence.js";

const TimestampSchema = Type.String({ format: "date-time" });

export const AdaptiveTargetKindSchema = StringEnum([
  "VOCABULARY",
  "GRAMMAR",
  "KANJI",
]);

export const TargetContentSignatureSchema = Type.String({
  minLength: 20,
  maxLength: 2048,
  pattern: "^target_content_v1:",
});

export const LearningTargetSelectorSchema = StrictObject({
  providerId: IdSchema,
  providerVersion: VersionStringSchema,
  referenceId: IdSchema,
  targetKind: AdaptiveTargetKindSchema,
  contentSignature: TargetContentSignatureSchema,
});

export const KanjiReferenceAidSchema = StrictObject({
  aidKind: Type.Literal("REFERENCE"),
  character: Type.String({ pattern: "^\\p{Script=Han}$" }),
  readings: Type.Array(JapaneseTextSchema, {
    minItems: 1,
    maxItems: 12,
    uniqueItems: true,
  }),
  providerId: IdSchema,
  providerVersion: VersionStringSchema,
  referenceId: IdSchema,
});

export const LearningConceptSchema = StrictObject({
  conceptKey: IdSchema,
  targetKind: AdaptiveTargetKindSchema,
  labelJa: Type.String({ minLength: 1, maxLength: 120, pattern: "\\S" }),
  supportLabel: Type.Optional(
    Type.String({ minLength: 1, maxLength: 240, pattern: "\\S" }),
  ),
  selectors: Type.Array(LearningTargetSelectorSchema, {
    minItems: 1,
    maxItems: 20,
  }),
  compilerPrefillText: Type.Optional(
    Type.String({ minLength: 1, maxLength: 120, pattern: "\\S" }),
  ),
  referenceAid: Type.Optional(KanjiReferenceAidSchema),
});

export const LearningTargetRegistrySchema = StrictObject(
  {
    contractType: Type.Literal("LEARNING_TARGET_REGISTRY"),
    schemaVersion: Type.Literal(ADAPTIVE_LEARNING_SCHEMA_VERSION),
    registryId: IdSchema,
    registryVersion: SemanticVersionSchema,
    provenance: StrictObject({
      source: Type.Literal("PROJECT_AUTHORED"),
      statement: Type.String({ minLength: 1, maxLength: 500, pattern: "\\S" }),
    }),
    concepts: Type.Array(LearningConceptSchema, {
      minItems: 1,
      maxItems: 100,
    }),
  },
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://bunbun.local/schemas/learning-target-registry-0.1.0.schema.json",
    title: "Bunbun LearningTargetRegistry 0.1.0",
  },
);

export const MappedConceptResolutionSchema = StrictObject({
  status: Type.Literal("MAPPED"),
  conceptKey: IdSchema,
  targetKind: AdaptiveTargetKindSchema,
  labelJa: JapaneseTextSchema,
  supportLabel: Type.Optional(SupportTextSchema),
  matchedSelectorCount: Type.Integer({ minimum: 1, maximum: 20 }),
  compilerPrefillText: Type.Optional(JapaneseTextSchema),
  referenceAid: Type.Optional(KanjiReferenceAidSchema),
});

export const UnmappedConceptResolutionSchema = StrictObject({
  status: Type.Literal("UNMAPPED_TARGET"),
  targetId: IdSchema,
  targetKind: AdaptiveTargetKindSchema,
});

export const LearningTargetConceptResolutionSchema = OneOf([
  MappedConceptResolutionSchema,
  UnmappedConceptResolutionSchema,
]);

export const AdaptiveModeSchema = StringEnum(["SUGGEST", "OFF"]);
export const AdaptiveSupportPreferenceSchema = StringEnum([
  "ASK_EACH_TIME",
  "MORE_SUPPORT",
  "LESS_SUPPORT",
]);

export const AdaptivePreferencesSchema = StrictObject(
  {
    contractType: Type.Literal("ADAPTIVE_PREFERENCES"),
    schemaVersion: Type.Literal(ADAPTIVE_LEARNING_SCHEMA_VERSION),
    adaptiveMode: AdaptiveModeSchema,
    supportPreference: AdaptiveSupportPreferenceSchema,
    updatedAt: TimestampSchema,
  },
  { $id: "AdaptivePreferences.0.1.0" },
);

export const UpdateAdaptivePreferencesRequestSchema = StrictObject(
  {
    contractType: Type.Literal("UPDATE_ADAPTIVE_PREFERENCES"),
    schemaVersion: Type.Literal(ADAPTIVE_LEARNING_SCHEMA_VERSION),
    adaptiveMode: AdaptiveModeSchema,
    supportPreference: AdaptiveSupportPreferenceSchema,
  },
  { $id: "UpdateAdaptivePreferencesRequest.0.1.0" },
);

export const ConceptEvidenceSummarySchema = StrictObject({
  conceptKey: IdSchema,
  targetKind: AdaptiveTargetKindSchema,
  labelJa: JapaneseTextSchema,
  supportLabel: Type.Optional(SupportTextSchema),
  role: StringEnum(["REQUESTED", "SUPPORTING"]),
  priority: Type.Integer({ minimum: 1, maximum: 5 }),
  attemptCount: Type.Integer({ minimum: 0 }),
  unaidedCorrectAttemptCount: Type.Integer({ minimum: 0 }),
  assistedCorrectAttemptCount: Type.Integer({ minimum: 0 }),
  incorrectAttemptCount: Type.Integer({ minimum: 0 }),
  distinctUnaidedCorrectContextCount: Type.Integer({ minimum: 0 }),
  signal: TargetProgressSignalSchema,
  lastPracticedAt: Type.Optional(TimestampSchema),
  lastContextKey: Type.Optional(
    Type.String({
      minLength: 3,
      maxLength: 129,
      pattern: "^[a-z0-9_]+:[a-z0-9_]+$",
    }),
  ),
  referenceAid: Type.Optional(KanjiReferenceAidSchema),
});

export const RecommendationReasonSchema = StringEnum([
  "NEEDS_REVIEW",
  "INSUFFICIENT_EVIDENCE",
  "READY_FOR_VARIATION",
]);

export const ChangedContextAvailableSchema = StrictObject({
  availability: Type.Literal("CHANGED_CONTEXT_AVAILABLE"),
  lessonId: IdSchema,
  revision: Type.Integer({ minimum: 1 }),
  title: LocalizedTextSchema,
  contextIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 100,
    uniqueItems: true,
  }),
  supportedLaunchModes: Type.Array(StringEnum(["GUIDED", "IMMERSIVE"]), {
    minItems: 1,
    maxItems: 2,
    uniqueItems: true,
  }),
});

export const NoChangedContextAvailableSchema = StrictObject({
  availability: Type.Literal("NO_CHANGED_CONTEXT_AVAILABLE"),
});

export const NoPublishedLessonAvailableSchema = StrictObject({
  availability: Type.Literal("NO_PUBLISHED_LESSON_AVAILABLE"),
});

export const RecommendationContextSchema = OneOf([
  ChangedContextAvailableSchema,
  NoChangedContextAvailableSchema,
  NoPublishedLessonAvailableSchema,
]);

export const AdaptiveSuggestionSchema = StrictObject({
  conceptKey: IdSchema,
  reason: RecommendationReasonSchema,
  context: RecommendationContextSchema,
  compilerPrefillText: Type.Optional(JapaneseTextSchema),
});

export const UnmappedAdaptiveTargetSchema = StrictObject({
  lessonId: IdSchema,
  revision: Type.Integer({ minimum: 1 }),
  targetId: IdSchema,
  targetKind: AdaptiveTargetKindSchema,
  reason: Type.Literal("UNMAPPED_TARGET"),
});

export const AdaptiveLearningSnapshotSchema = StrictObject(
  {
    contractType: Type.Literal("ADAPTIVE_SNAPSHOT"),
    schemaVersion: Type.Literal(ADAPTIVE_LEARNING_SCHEMA_VERSION),
    registryId: IdSchema,
    registryVersion: SemanticVersionSchema,
    preferences: AdaptivePreferencesSchema,
    summaries: Type.Array(ConceptEvidenceSummarySchema, { maxItems: 100 }),
    suggestions: Type.Array(AdaptiveSuggestionSchema, { maxItems: 3 }),
    unmappedTargets: Type.Array(UnmappedAdaptiveTargetSchema, {
      maxItems: 100,
    }),
    publishedLessonCandidateCount: Type.Integer({
      minimum: 0,
      maximum: 100,
    }),
  },
  { $id: "AdaptiveLearningSnapshot.0.1.0" },
);

export const AdaptiveApiErrorSchema = StrictObject(
  {
    contractType: Type.Literal("ADAPTIVE_API_ERROR"),
    status: Type.Literal("error"),
    code: StringEnum([
      "ADAPTATION_UNAVAILABLE",
      "INVALID_ADAPTIVE_PREFERENCES",
      "REGISTRY_INVALID",
      "ADAPTATION_RESPONSE_TOO_LARGE",
    ]),
    message: Type.String({ minLength: 1, maxLength: 500, pattern: "\\S" }),
  },
  { $id: "AdaptiveApiError.0.1.0" },
);

export const AdaptiveLearningSchema = OneOf(
  [
    LearningTargetRegistrySchema,
    AdaptivePreferencesSchema,
    UpdateAdaptivePreferencesRequestSchema,
    AdaptiveLearningSnapshotSchema,
    AdaptiveApiErrorSchema,
  ],
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://bunbun.local/schemas/adaptive-learning-0.1.0.schema.json",
    title: "Bunbun AdaptiveLearning 0.1.0",
  },
);

export type AdaptiveTargetKind = Static<typeof AdaptiveTargetKindSchema>;
export type TargetContentSignature = Static<
  typeof TargetContentSignatureSchema
>;
export type LearningTargetSelector = Static<
  typeof LearningTargetSelectorSchema
>;
export type KanjiReferenceAid = Static<typeof KanjiReferenceAidSchema>;
export type LearningConcept = Static<typeof LearningConceptSchema>;
export type LearningTargetRegistry = Static<
  typeof LearningTargetRegistrySchema
>;
export type MappedConceptResolution = Static<
  typeof MappedConceptResolutionSchema
>;
export type UnmappedConceptResolution = Static<
  typeof UnmappedConceptResolutionSchema
>;
export type LearningTargetConceptResolution = Static<
  typeof LearningTargetConceptResolutionSchema
>;
export type AdaptiveMode = Static<typeof AdaptiveModeSchema>;
export type AdaptiveSupportPreference = Static<
  typeof AdaptiveSupportPreferenceSchema
>;
export type AdaptivePreferences = Static<typeof AdaptivePreferencesSchema>;
export type UpdateAdaptivePreferencesRequest = Static<
  typeof UpdateAdaptivePreferencesRequestSchema
>;
export type ConceptEvidenceSummary = Static<
  typeof ConceptEvidenceSummarySchema
>;
export type RecommendationReason = Static<typeof RecommendationReasonSchema>;
export type RecommendationContext = Static<typeof RecommendationContextSchema>;
export type AdaptiveSuggestion = Static<typeof AdaptiveSuggestionSchema>;
export type UnmappedAdaptiveTarget = Static<
  typeof UnmappedAdaptiveTargetSchema
>;
export type AdaptiveLearningSnapshot = Static<
  typeof AdaptiveLearningSnapshotSchema
>;
export type AdaptiveApiError = Static<typeof AdaptiveApiErrorSchema>;
