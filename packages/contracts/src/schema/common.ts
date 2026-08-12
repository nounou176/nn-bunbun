import Type, {
  type Static,
  type TObjectOptions,
  type TProperties,
  type TSchema,
  type TSchemaOptions,
} from "typebox";

export {
  CATALOG_SNAPSHOT_SCHEMA_VERSION,
  EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
  LESSON_MANIFEST_SCHEMA_VERSION,
} from "../version.js";

export const ID_PATTERN = "^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$";
export const SEMVER_PATTERN =
  "^(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$";
export const BCP_47_PATTERN = "^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$";
export const NON_BLANK_PATTERN = "\\S";

export function StrictObject<const Properties extends TProperties>(
  properties: Properties,
  options: TObjectOptions = {},
) {
  return Type.Object(properties, {
    ...options,
    additionalProperties: false,
  });
}

export function StringEnum<const Values extends readonly string[]>(
  values: Values,
  options: TSchemaOptions = {},
) {
  return Type.Unsafe<Values[number]>({
    type: "string",
    enum: [...values],
    ...options,
  });
}

export function OneOf<const Schemas extends TSchema[]>(
  schemas: [...Schemas],
  options: TSchemaOptions = {},
) {
  return Type.Unsafe<Static<Schemas[number]>>({
    oneOf: schemas,
    ...options,
  });
}

export const IdSchema = Type.String({
  minLength: 1,
  maxLength: 64,
  pattern: ID_PATTERN,
});

export const NonBlankStringSchema = Type.String({
  minLength: 1,
  pattern: NON_BLANK_PATTERN,
});

export const JapaneseTextSchema = Type.String({
  minLength: 1,
  pattern: NON_BLANK_PATTERN,
});

export const SupportTextSchema = Type.String({
  minLength: 1,
  pattern: NON_BLANK_PATTERN,
});

export const VersionStringSchema = Type.String({
  minLength: 1,
  maxLength: 80,
});

export const SemanticVersionSchema = Type.String({
  pattern: SEMVER_PATTERN,
});

export const UniqueIdArraySchema = Type.Array(IdSchema, {
  uniqueItems: true,
});

export type BunbunId = Static<typeof IdSchema>;
