import Type, { type Static } from "typebox";

import { JAPANESE_TEXT_STUDY_CATALOG_SCHEMA_VERSION } from "../version.js";
import {
  IdSchema,
  JapaneseTextSchema,
  NonBlankStringSchema,
  StrictObject,
  StringEnum,
  VersionStringSchema,
} from "./common.js";

const Sha256Schema = Type.String({ pattern: "^[a-f0-9]{64}$" });

export const JapaneseStudyVocabularySchema = StrictObject({
  entryId: IdSchema,
  surfaceJa: JapaneseTextSchema,
  dictionaryFormJa: JapaneseTextSchema,
  readingKana: JapaneseTextSchema,
  partOfSpeech: StringEnum([
    "NOUN",
    "VERB",
    "ADJECTIVE",
    "ADVERB",
    "PARTICLE",
    "AUXILIARY",
    "EXPRESSION",
    "OTHER",
  ] as const),
  meaningVi: NonBlankStringSchema,
});

export const JapaneseStudyGrammarSchema = StrictObject({
  entryId: IdSchema,
  patternJa: JapaneseTextSchema,
  labelVi: NonBlankStringSchema,
  explanationVi: NonBlankStringSchema,
});

export const JapaneseTextStudyRecordSchema = StrictObject({
  textId: IdSchema,
  textSha256: Sha256Schema,
  textJa: Type.String({ minLength: 1, maxLength: 320 }),
  readingKana: Type.String({ minLength: 1, maxLength: 480 }),
  romaji: Type.String({ minLength: 1, maxLength: 640 }),
  vocabulary: Type.Array(JapaneseStudyVocabularySchema, {
    maxItems: 24,
  }),
  grammar: Type.Array(JapaneseStudyGrammarSchema, { maxItems: 8 }),
  audioAssetId: Type.Optional(IdSchema),
});

export const JapaneseTextStudyCatalogSchema = StrictObject(
  {
    schemaVersion: Type.Literal(JAPANESE_TEXT_STUDY_CATALOG_SCHEMA_VERSION),
    catalogId: IdSchema,
    lessonId: IdSchema,
    lessonRevision: Type.Integer({ minimum: 1 }),
    sources: Type.Array(
      StrictObject({
        sourceId: IdSchema,
        version: VersionStringSchema,
        role: StringEnum(["CONTENT", "AUTHORING_PROPOSAL_TOOL"] as const),
      }),
      { minItems: 1, maxItems: 8 },
    ),
    records: Type.Array(JapaneseTextStudyRecordSchema, {
      minItems: 1,
      maxItems: 128,
    }),
  },
  {
    $id: "https://bunbun.local/schemas/japanese-text-study-catalog-0.1.0.json",
  },
);

export type JapaneseStudyVocabulary = Static<
  typeof JapaneseStudyVocabularySchema
>;
export type JapaneseStudyGrammar = Static<typeof JapaneseStudyGrammarSchema>;
export type JapaneseTextStudyRecord = Static<
  typeof JapaneseTextStudyRecordSchema
>;
export type JapaneseTextStudyCatalog = Static<
  typeof JapaneseTextStudyCatalogSchema
>;
