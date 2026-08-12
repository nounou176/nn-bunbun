import Type, { type Static } from "typebox";

import { EVIDENCE_PERSISTENCE_SCHEMA_VERSION } from "../version.js";
import { CatalogSnapshotSchema } from "./catalog.js";
import { IdSchema, OneOf, StrictObject, StringEnum } from "./common.js";
import { LessonManifestSchema } from "./lesson-manifest.js";
import {
  EvidenceCategorySchema,
  TransitionTargetSchema,
} from "./manifest-core.js";

const OpaqueIdSchema = Type.String({
  minLength: 1,
  maxLength: 256,
  pattern: "^[A-Za-z0-9:_-]+$",
});

const TimestampSchema = Type.String({ format: "date-time" });

const PackageFingerprintSchema = Type.String({
  pattern: "^sha256_[0-9a-f]{64}$",
});

export const SessionEventKindSchema = StringEnum([
  "EXPOSURE",
  "HEARD",
  "REACTION",
  "STEP_COMPLETED",
  "LESSON_COMPLETED",
]);

export const LessonPhaseSchema = StringEnum([
  "AWAITING_AUDIO",
  "PLAYING_AUDIO",
  "AWAITING_CONTINUE",
  "AWAITING_ARRANGE",
  "AWAITING_OBJECT",
  "AWAITING_TYPE",
  "AWAITING_LOCATION",
  "MOVING_TO_LOCATION",
  "AWAITING_PICK_UP",
  "AWAITING_RECIPIENT",
  "AWAITING_CHOICE",
  "FEEDBACK",
  "COMPLETED",
]);

export const SessionStatusSchema = StringEnum([
  "ACTIVE",
  "COMPLETED",
  "ABANDONED",
]);

export const EvidenceEventSchema = StrictObject(
  {
    schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
    eventId: OpaqueIdSchema,
    kind: SessionEventKindSchema,
    sessionId: OpaqueIdSchema,
    lessonId: IdSchema,
    revision: Type.Integer({ minimum: 1 }),
    stepId: IdSchema,
    contextId: IdSchema,
    primitive: StringEnum([
      "LISTEN",
      "CLICK_OBJECT",
      "CHOOSE",
      "ARRANGE",
      "TYPE",
      "MOVE_TO",
      "PICK_UP",
      "GIVE",
    ]),
    targetId: Type.Optional(IdSchema),
    evidence: Type.Optional(EvidenceCategorySchema),
    responseIds: Type.Optional(
      Type.Array(IdSchema, { minItems: 1, maxItems: 12 }),
    ),
    correct: Type.Optional(Type.Boolean()),
    assisted: Type.Boolean(),
    attempt: Type.Integer({ minimum: 0, maximum: 5 }),
    activeLatencyMs: Type.Integer({ minimum: 0, maximum: 86_400_000 }),
    occurredAt: TimestampSchema,
  },
  { $id: "EvidenceEvent.0.1.0" },
);

export const TransferredObjectSchema = StrictObject({
  objectId: IdSchema,
  recipientEntityId: IdSchema,
});

export const PendingCheckpointActionSchema = OneOf([
  StrictObject({ kind: Type.Literal("RETRY") }),
  StrictObject({
    kind: Type.Literal("TRANSITION"),
    target: TransitionTargetSchema,
  }),
]);

export const SessionCheckpointSchema = StrictObject(
  {
    schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
    sessionId: OpaqueIdSchema,
    lessonId: IdSchema,
    revision: Type.Integer({ minimum: 1 }),
    sequence: Type.Integer({ minimum: 0 }),
    status: StringEnum(["ACTIVE", "COMPLETED"]),
    currentStepId: IdSchema,
    phase: LessonPhaseSchema,
    attempt: Type.Integer({ minimum: 0, maximum: 5 }),
    helpUsed: Type.Boolean(),
    audioFailed: Type.Boolean(),
    activeScaffoldIds: Type.Array(IdSchema, { uniqueItems: true }),
    arrangedTokenIds: Type.Array(IdSchema, { maxItems: 12, uniqueItems: true }),
    completedStepIds: Type.Array(IdSchema, { uniqueItems: true }),
    carriedObjectId: Type.Optional(IdSchema),
    transferredObjects: Type.Array(TransferredObjectSchema, { maxItems: 30 }),
    feedbackKind: Type.Optional(
      StringEnum(["CORRECT", "INCORRECT", "ASSISTED"]),
    ),
    pendingAction: Type.Optional(PendingCheckpointActionSchema),
    activeTimeMs: Type.Integer({ minimum: 0, maximum: 2_147_483_647 }),
    stepStartedAtActiveMs: Type.Integer({
      minimum: 0,
      maximum: 2_147_483_647,
    }),
  },
  { $id: "SessionCheckpoint.0.1.0" },
);

export const SessionCommitRequestSchema = StrictObject(
  {
    schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
    commitId: OpaqueIdSchema,
    expectedSequence: Type.Integer({ minimum: 0 }),
    events: Type.Array(EvidenceEventSchema, { maxItems: 64 }),
    checkpoint: SessionCheckpointSchema,
  },
  { $id: "SessionCommitRequest.0.1.0" },
);

export const SessionCreateRequestSchema = StrictObject(
  {
    schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
    commitId: OpaqueIdSchema,
    packageFingerprint: PackageFingerprintSchema,
    manifest: LessonManifestSchema,
    catalog: CatalogSnapshotSchema,
    events: Type.Array(EvidenceEventSchema, { maxItems: 64 }),
    checkpoint: SessionCheckpointSchema,
  },
  { $id: "SessionCreateRequest.0.1.0" },
);

export const SessionCommitResultSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  sessionId: OpaqueIdSchema,
  checkpointSequence: Type.Integer({ minimum: 0 }),
  storedEventCount: Type.Integer({ minimum: 0 }),
  lastSavedAt: TimestampSchema,
});

export const ResumableSessionSchema = StrictObject({
  sessionId: OpaqueIdSchema,
  status: SessionStatusSchema,
  packageFingerprint: PackageFingerprintSchema,
  checkpoint: SessionCheckpointSchema,
  storedEventCount: Type.Integer({ minimum: 0 }),
  lastSavedAt: TimestampSchema,
});

export const ResumableSessionResultSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  session: Type.Optional(ResumableSessionSchema),
});

export const AbandonSessionRequestSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  expectedSequence: Type.Integer({ minimum: 0 }),
});

export const AbandonSessionResultSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  sessionId: OpaqueIdSchema,
  status: Type.Literal("ABANDONED"),
  updatedAt: TimestampSchema,
});

export const LocalPreferencesSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  resumeMode: StringEnum(["ASK", "AUTO_RESUME", "START_NEW"]),
  updatedAt: TimestampSchema,
});

export const UpdatePreferencesRequestSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  resumeMode: StringEnum(["ASK", "AUTO_RESUME", "START_NEW"]),
});

export const TargetProgressSignalSchema = StringEnum([
  "INSUFFICIENT_EVIDENCE",
  "NEEDS_REVIEW",
  "DEVELOPING",
]);

export const TargetEvidenceSummarySchema = StrictObject({
  lessonId: IdSchema,
  revision: Type.Integer({ minimum: 1 }),
  targetId: IdSchema,
  exposureCount: Type.Integer({ minimum: 0 }),
  heardCount: Type.Integer({ minimum: 0 }),
  reactionCount: Type.Integer({ minimum: 0 }),
  unaidedCorrectCount: Type.Integer({ minimum: 0 }),
  assistedCorrectCount: Type.Integer({ minimum: 0 }),
  incorrectCount: Type.Integer({ minimum: 0 }),
  distinctCorrectContextCount: Type.Integer({ minimum: 0 }),
  signal: TargetProgressSignalSchema,
  lastPracticedAt: Type.Optional(TimestampSchema),
});

export const ProgressSummaryResultSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  targets: Type.Array(TargetEvidenceSummarySchema),
});

export const StorageSummarySchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  databaseSchemaVersion: Type.Integer({ minimum: 0 }),
  lessonRevisionCount: Type.Integer({ minimum: 0 }),
  sessionCount: Type.Integer({ minimum: 0 }),
  activeSessionCount: Type.Integer({ minimum: 0 }),
  eventCount: Type.Integer({ minimum: 0 }),
  checkpointCount: Type.Integer({ minimum: 0 }),
  sessions: Type.Array(
    StrictObject({
      sessionId: OpaqueIdSchema,
      lessonId: IdSchema,
      revision: Type.Integer({ minimum: 1 }),
      status: SessionStatusSchema,
      checkpointSequence: Type.Integer({ minimum: 0 }),
      updatedAt: TimestampSchema,
    }),
    { maxItems: 100 },
  ),
});

export const ResetLocalDataRequestSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  confirmation: Type.Literal("DELETE_LOCAL_BUNBUN_DATA"),
});

export const ResetLocalDataResultSchema = StrictObject({
  schemaVersion: Type.Literal(EVIDENCE_PERSISTENCE_SCHEMA_VERSION),
  deleted: Type.Literal(true),
});

export const PersistenceApiErrorSchema = StrictObject({
  status: Type.Literal("error"),
  code: Type.String({ minLength: 1, maxLength: 80 }),
  message: Type.String({ minLength: 1, maxLength: 500 }),
});

export const EvidencePersistenceSchema = OneOf(
  [
    EvidenceEventSchema,
    SessionCheckpointSchema,
    SessionCreateRequestSchema,
    SessionCommitRequestSchema,
    SessionCommitResultSchema,
    ResumableSessionResultSchema,
    AbandonSessionRequestSchema,
    AbandonSessionResultSchema,
    LocalPreferencesSchema,
    UpdatePreferencesRequestSchema,
    ProgressSummaryResultSchema,
    StorageSummarySchema,
    ResetLocalDataRequestSchema,
    ResetLocalDataResultSchema,
    PersistenceApiErrorSchema,
  ],
  { $id: "EvidencePersistence.0.1.0" },
);

export type SessionEventKind = Static<typeof SessionEventKindSchema>;
export type EvidenceEvent = Static<typeof EvidenceEventSchema>;
export type TransferredObject = Static<typeof TransferredObjectSchema>;
export type PendingCheckpointAction = Static<
  typeof PendingCheckpointActionSchema
>;
export type SessionCheckpoint = Static<typeof SessionCheckpointSchema>;
export type SessionCommitRequest = Static<typeof SessionCommitRequestSchema>;
export type SessionCreateRequest = Static<typeof SessionCreateRequestSchema>;
export type SessionCommitResult = Static<typeof SessionCommitResultSchema>;
export type ResumableSession = Static<typeof ResumableSessionSchema>;
export type ResumableSessionResult = Static<
  typeof ResumableSessionResultSchema
>;
export type AbandonSessionRequest = Static<typeof AbandonSessionRequestSchema>;
export type AbandonSessionResult = Static<typeof AbandonSessionResultSchema>;
export type LocalPreferences = Static<typeof LocalPreferencesSchema>;
export type UpdatePreferencesRequest = Static<
  typeof UpdatePreferencesRequestSchema
>;
export type TargetProgressSignal = Static<typeof TargetProgressSignalSchema>;
export type TargetEvidenceSummary = Static<typeof TargetEvidenceSummarySchema>;
export type ProgressSummaryResult = Static<typeof ProgressSummaryResultSchema>;
export type StorageSummary = Static<typeof StorageSummarySchema>;
export type ResetLocalDataRequest = Static<typeof ResetLocalDataRequestSchema>;
export type ResetLocalDataResult = Static<typeof ResetLocalDataResultSchema>;
export type PersistenceApiError = Static<typeof PersistenceApiErrorSchema>;
