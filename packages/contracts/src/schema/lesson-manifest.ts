import Type, { type Static } from "typebox";

import { IdSchema, StrictObject, StringEnum } from "./common.js";
import { LESSON_MANIFEST_SCHEMA_VERSION } from "../version.js";
import { InteractionSchema } from "./interactions.js";
import {
  AttemptPolicySchema,
  AudioAssetSchema,
  CompletionPolicySchema,
  EntityInstanceSchema,
  FeedbackSchema,
  LearningTargetSchema,
  LocalesSchema,
  LocalizedTextSchema,
  LocationInstanceSchema,
  ObjectInstanceSchema,
  PresentationCuesSchema,
  ProvenanceSchema,
  QualityTargetsSchema,
  ScaffoldSchema,
  ScenarioSchema,
  SceneSelectionSchema,
  StimulusSchema,
  TargetBindingSchema,
  TransitionsSchema,
} from "./manifest-core.js";

export const LessonStepSchema = StrictObject({
  stepId: IdSchema,
  contextId: IdSchema,
  mode: StringEnum(["EXPLORE", "INTERACTION"]),
  stimulus: StimulusSchema,
  interaction: InteractionSchema,
  targetBindings: Type.Array(TargetBindingSchema, { minItems: 1 }),
  attemptPolicy: AttemptPolicySchema,
  scaffolds: Type.Array(ScaffoldSchema),
  feedback: FeedbackSchema,
  presentation: PresentationCuesSchema,
  transitions: TransitionsSchema,
});

export const LessonManifestSchema = StrictObject(
  {
    schemaVersion: Type.Literal(LESSON_MANIFEST_SCHEMA_VERSION),
    manifestId: IdSchema,
    lessonId: IdSchema,
    revision: Type.Integer({ minimum: 1 }),
    createdAt: Type.String({ format: "date-time" }),
    randomSeed: Type.Integer({ minimum: 0, maximum: 2_147_483_647 }),
    locales: LocalesSchema,
    title: LocalizedTextSchema,
    learningTargets: Type.Array(LearningTargetSchema, {
      minItems: 1,
      maxItems: 30,
    }),
    scene: SceneSelectionSchema,
    scenario: ScenarioSchema,
    locations: Type.Array(LocationInstanceSchema),
    entities: Type.Array(EntityInstanceSchema, { maxItems: 5 }),
    objects: Type.Array(ObjectInstanceSchema, { maxItems: 30 }),
    audioAssets: Type.Array(AudioAssetSchema),
    steps: Type.Array(LessonStepSchema, { minItems: 1, maxItems: 60 }),
    entryStepId: IdSchema,
    completion: CompletionPolicySchema,
    quality: QualityTargetsSchema,
    provenance: ProvenanceSchema,
  },
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://bunbun.local/schemas/lesson-manifest-0.1.0.schema.json",
    title: "Bunbun LessonManifest 0.1.0",
  },
);

export type LessonStep = Static<typeof LessonStepSchema>;
export type LessonManifest = Static<typeof LessonManifestSchema>;
