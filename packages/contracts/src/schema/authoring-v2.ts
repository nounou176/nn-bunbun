import Type, { type Static } from "typebox";

import {
  AUTHORING_CONTRACT_VERSION_V2,
  AUTHORING_PACKET_VERSION_V2,
} from "../version.js";
import {
  AUTHORING_INPUT_HASH_CANONICALIZATION,
  AUTHORING_REQUEST_FORMAT,
  AUTHORING_RESULT_FORMAT,
  AuthoringBoundedTextSchema,
  AuthoringOutputLimitsSchema,
  AuthoringPromptPackSchema,
  AuthoringSha256Schema,
  CoachingSlotInputSchema,
  LessonAuthoringEnvelopeInputSchema,
  LessonContentDraftContributionsSchema,
  PracticeSlotInputSchema,
} from "./authoring.js";
import { IdSchema, OneOf, StrictObject, StringEnum } from "./common.js";

export const AUTHORING_FIXTURE_DISCLOSURE_V2 =
  "This authored fixture sends normalized Japanese targets and compact authoring facts to ChatGPT or Codex. It contains no learner identity, progress, evidence, TYPE response, checkpoint, secret, or private chat history." as const;

export const AUTHORING_LEARNER_TARGET_DISCLOSURE_V2 =
  "This request sends only the normalized Japanese targets and compact authoring facts shown here to ChatGPT or Codex after export. It contains no learner identity, progress, evidence, TYPE response, checkpoint, secret, or private chat history." as const;

export const PracticeSlotInputV2Schema = StrictObject({
  ...PracticeSlotInputSchema.properties,
  practiceTextJa: AuthoringBoundedTextSchema,
  acceptedResponsesJa: Type.Array(AuthoringBoundedTextSchema, {
    maxItems: 16,
    uniqueItems: true,
  }),
});

export const FeedbackDisplayPlanInputSchema = StrictObject({
  correct: Type.Integer({ minimum: 0, maximum: 4_000 }),
  incorrect: Type.Integer({ minimum: 0, maximum: 4_000 }),
  assisted: Type.Integer({ minimum: 0, maximum: 4_000 }),
});

export const CoachingSlotInputV2Schema = StrictObject({
  ...CoachingSlotInputSchema.properties,
  primitive: PracticeSlotInputSchema.properties.primitive,
  maximumAttempts: Type.Integer({ minimum: 1, maximum: 5 }),
  feedbackDisplayMs: FeedbackDisplayPlanInputSchema,
});

export const LessonAuthoringEnvelopeInputV2Schema = StrictObject({
  ...LessonAuthoringEnvelopeInputSchema.properties,
  contractVersion: Type.Literal(AUTHORING_CONTRACT_VERSION_V2),
  practiceSlots: Type.Array(PracticeSlotInputV2Schema, { maxItems: 24 }),
  coachingSlots: Type.Array(CoachingSlotInputV2Schema, { maxItems: 24 }),
});

const LessonAuthoringResultV2Properties = {
  packetFormat: Type.Literal(AUTHORING_RESULT_FORMAT),
  packetVersion: Type.Literal(AUTHORING_PACKET_VERSION_V2),
  requestId: IdSchema,
  inputSha256: AuthoringSha256Schema,
  promptPack: AuthoringPromptPackSchema,
  contributions: LessonContentDraftContributionsSchema,
};

export const LessonAuthoringResultV2Schema = StrictObject(
  LessonAuthoringResultV2Properties,
  { $id: "https://bunbun.local/schemas/lesson-authoring-result-0.2.0.json" },
);

export const AuthoringRepairDiagnosticSchema = StrictObject({
  source: StringEnum([
    "JSON_PARSE",
    "STRUCTURAL",
    "SEMANTIC",
    "NORMALIZATION",
    "RUNTIME_CAPABILITY",
  ]),
  code: Type.String({ pattern: "^[A-Z][A-Z0-9_]{2,63}$" }),
  path: Type.String({ minLength: 1, maxLength: 240 }),
  message: Type.String({ minLength: 1, maxLength: 320 }),
});

export const AuthoringRepairContextSchema = StrictObject({
  failureStage: StringEnum(["JSON_PARSE", "STRUCTURAL", "SEMANTIC"]),
  priorResponseSha256: AuthoringSha256Schema,
  priorResult: OneOf([
    StrictObject(LessonAuthoringResultV2Properties),
    Type.Null(),
  ]),
  diagnostics: Type.Array(AuthoringRepairDiagnosticSchema, {
    minItems: 1,
    maxItems: 24,
  }),
});

export const AuthoringDataPolicyV2Schema = OneOf([
  StrictObject({
    classification: Type.Literal("AUTHORED_FIXTURE"),
    containsLearnerData: Type.Literal(false),
    disclosure: Type.Literal(AUTHORING_FIXTURE_DISCLOSURE_V2),
  }),
  StrictObject({
    classification: Type.Literal("LEARNER_TARGETS"),
    containsLearnerData: Type.Literal(true),
    disclosure: Type.Literal(AUTHORING_LEARNER_TARGET_DISCLOSURE_V2),
  }),
]);

export const LessonAuthoringRequestV2Schema = StrictObject(
  {
    packetFormat: Type.Literal(AUTHORING_REQUEST_FORMAT),
    packetVersion: Type.Literal(AUTHORING_PACKET_VERSION_V2),
    requestId: IdSchema,
    requestContextId: IdSchema,
    attempt: Type.Integer({ minimum: 1, maximum: 2 }),
    repair: OneOf([AuthoringRepairContextSchema, Type.Null()]),
    mediaPolicy: Type.Literal("TEXT_ONLY"),
    responseFormat: Type.Literal("STRICT_JSON_OBJECT"),
    inputHashCanonicalization: Type.Literal(
      AUTHORING_INPUT_HASH_CANONICALIZATION,
    ),
    inputSha256: AuthoringSha256Schema,
    promptPack: AuthoringPromptPackSchema,
    dataPolicy: AuthoringDataPolicyV2Schema,
    outputLimits: AuthoringOutputLimitsSchema,
    input: LessonAuthoringEnvelopeInputV2Schema,
  },
  { $id: "https://bunbun.local/schemas/lesson-authoring-request-0.2.0.json" },
);

export type PracticeSlotInputV2 = Static<typeof PracticeSlotInputV2Schema>;
export type CoachingSlotInputV2 = Static<typeof CoachingSlotInputV2Schema>;
export type LessonAuthoringEnvelopeInputV2 = Static<
  typeof LessonAuthoringEnvelopeInputV2Schema
>;
export type AuthoringRepairDiagnostic = Static<
  typeof AuthoringRepairDiagnosticSchema
>;
export type AuthoringRepairContext = Static<
  typeof AuthoringRepairContextSchema
>;
export type LessonAuthoringRequestV2 = Static<
  typeof LessonAuthoringRequestV2Schema
>;
export type LessonAuthoringResultV2 = Static<
  typeof LessonAuthoringResultV2Schema
>;
