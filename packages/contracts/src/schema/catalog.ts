import Type, { type Static } from "typebox";

import {
  IdSchema,
  StrictObject,
  StringEnum,
  VersionStringSchema,
} from "./common.js";
import { CATALOG_SNAPSHOT_SCHEMA_VERSION } from "../version.js";

const TargetKindSchema = StringEnum(["VOCABULARY", "GRAMMAR", "KANJI"]);

export const SpawnPointSchema = StrictObject({
  spawnPointId: IdSchema,
  kind: StringEnum(["PLAYER", "ENTITY", "OBJECT"]),
  reachableFromPlayer: Type.Boolean(),
  exclusiveOccupancy: Type.Boolean(),
});

export const SceneCatalogEntrySchema = StrictObject({
  sceneId: IdSchema,
  variantIds: Type.Array(IdSchema, { uniqueItems: true }),
  cameraPresetIds: Type.Array(IdSchema, {
    minItems: 1,
    uniqueItems: true,
  }),
  assetBundleIds: Type.Array(IdSchema, {
    minItems: 1,
    uniqueItems: true,
  }),
  spawnPoints: Type.Array(SpawnPointSchema, {
    minItems: 1,
  }),
});

export const AssetBundleCatalogEntrySchema = StrictObject({
  assetBundleId: IdSchema,
  sceneIds: Type.Array(IdSchema, { minItems: 1, uniqueItems: true }),
});

export const LocationCatalogEntrySchema = StrictObject({
  catalogLocationId: IdSchema,
  sceneId: IdSchema,
  stateIds: Type.Array(IdSchema, { uniqueItems: true }),
});

export const EntityCatalogEntrySchema = StrictObject({
  catalogEntityId: IdSchema,
  roles: Type.Array(StringEnum(["NPC", "ANIMAL"]), {
    minItems: 1,
    uniqueItems: true,
  }),
  sceneIds: Type.Array(IdSchema, { minItems: 1, uniqueItems: true }),
  stateIds: Type.Array(IdSchema, { uniqueItems: true }),
});

export const ObjectCatalogEntrySchema = StrictObject({
  catalogObjectId: IdSchema,
  sceneIds: Type.Array(IdSchema, { minItems: 1, uniqueItems: true }),
  stateIds: Type.Array(IdSchema, { uniqueItems: true }),
  affordances: Type.Array(StringEnum(["INTERACTIVE", "PICK_UP", "GIVE"]), {
    minItems: 1,
    uniqueItems: true,
  }),
});

export const PresentationCueCatalogEntrySchema = StrictObject({
  cueId: IdSchema,
  sceneId: IdSchema,
});

export const VoiceProfileCatalogEntrySchema = StrictObject({
  voiceProfileId: IdSchema,
});

export const ReferenceRecordCatalogEntrySchema = StrictObject({
  referenceId: IdSchema,
  targetKinds: Type.Array(TargetKindSchema, {
    minItems: 1,
    uniqueItems: true,
  }),
  providerId: IdSchema,
  providerVersion: VersionStringSchema,
});

export const CatalogSnapshotSchema = StrictObject(
  {
    schemaVersion: Type.Literal(CATALOG_SNAPSHOT_SCHEMA_VERSION),
    catalogId: IdSchema,
    revision: Type.Integer({ minimum: 1 }),
    scenes: Type.Array(SceneCatalogEntrySchema, { minItems: 1 }),
    assetBundles: Type.Array(AssetBundleCatalogEntrySchema, { minItems: 1 }),
    locations: Type.Array(LocationCatalogEntrySchema),
    entities: Type.Array(EntityCatalogEntrySchema),
    objects: Type.Array(ObjectCatalogEntrySchema),
    presentationCues: Type.Array(PresentationCueCatalogEntrySchema),
    voiceProfiles: Type.Array(VoiceProfileCatalogEntrySchema),
    referenceRecords: Type.Array(ReferenceRecordCatalogEntrySchema),
  },
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://bunbun.local/schemas/catalog-snapshot-0.1.0.schema.json",
    title: "Bunbun CatalogSnapshot 0.1.0",
  },
);

export type SpawnPoint = Static<typeof SpawnPointSchema>;
export type SceneCatalogEntry = Static<typeof SceneCatalogEntrySchema>;
export type AssetBundleCatalogEntry = Static<
  typeof AssetBundleCatalogEntrySchema
>;
export type LocationCatalogEntry = Static<typeof LocationCatalogEntrySchema>;
export type EntityCatalogEntry = Static<typeof EntityCatalogEntrySchema>;
export type ObjectCatalogEntry = Static<typeof ObjectCatalogEntrySchema>;
export type PresentationCueCatalogEntry = Static<
  typeof PresentationCueCatalogEntrySchema
>;
export type VoiceProfileCatalogEntry = Static<
  typeof VoiceProfileCatalogEntrySchema
>;
export type ReferenceRecordCatalogEntry = Static<
  typeof ReferenceRecordCatalogEntrySchema
>;
export type CatalogSnapshot = Static<typeof CatalogSnapshotSchema>;
