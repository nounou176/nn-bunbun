import Type, { type Static } from "typebox";

import {
  IdSchema,
  JapaneseTextSchema,
  OneOf,
  StrictObject,
  StringEnum,
} from "./common.js";

export const ListenInteractionSchema = StrictObject({
  type: Type.Literal("LISTEN"),
  completion: StringEnum(["AUDIO_ENDED", "LEARNER_CONTINUES"]),
  minimumPlaybackRatio: Type.Number({ minimum: 0, maximum: 1 }),
});

export const ClickObjectInteractionSchema = StrictObject({
  type: Type.Literal("CLICK_OBJECT"),
  candidateObjectIds: Type.Array(IdSchema, {
    minItems: 2,
    maxItems: 12,
    uniqueItems: true,
  }),
  acceptedObjectIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 12,
    uniqueItems: true,
  }),
});

export const ChoiceOptionSchema = StrictObject({
  optionId: IdSchema,
  textJa: JapaneseTextSchema,
});

export const ChooseInteractionSchema = StrictObject({
  type: Type.Literal("CHOOSE"),
  options: Type.Array(ChoiceOptionSchema, { minItems: 2, maxItems: 8 }),
  acceptedOptionIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 8,
    uniqueItems: true,
  }),
  shuffle: Type.Boolean(),
});

export const ArrangeTokenSchema = StrictObject({
  tokenId: IdSchema,
  textJa: JapaneseTextSchema,
});

export const ArrangeInteractionSchema = StrictObject({
  type: Type.Literal("ARRANGE"),
  tokens: Type.Array(ArrangeTokenSchema, { minItems: 2, maxItems: 12 }),
  acceptedSequences: Type.Array(
    Type.Array(IdSchema, { minItems: 2, maxItems: 12 }),
    { minItems: 1, maxItems: 8 },
  ),
  shuffle: Type.Boolean(),
});

export const TypeInteractionSchema = StrictObject({
  type: Type.Literal("TYPE"),
  acceptedAnswers: Type.Array(JapaneseTextSchema, {
    minItems: 1,
    maxItems: 20,
    uniqueItems: true,
  }),
  normalization: Type.Array(
    StringEnum([
      "UNICODE_NFKC",
      "TRIM",
      "COLLAPSE_WHITESPACE",
      "IGNORE_JAPANESE_PUNCTUATION",
      "KANA_EQUIVALENCE",
    ]),
    { uniqueItems: true },
  ),
  inputMode: Type.Literal("JAPANESE_TEXT"),
  maximumLength: Type.Integer({ minimum: 1, maximum: 200 }),
});

export const MoveToInteractionSchema = StrictObject({
  type: Type.Literal("MOVE_TO"),
  candidateLocationIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 12,
    uniqueItems: true,
  }),
  acceptedLocationIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 12,
    uniqueItems: true,
  }),
  arrivalRadius: Type.Number({ exclusiveMinimum: 0, maximum: 5 }),
});

export const PickUpInteractionSchema = StrictObject({
  type: Type.Literal("PICK_UP"),
  candidateObjectIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 12,
    uniqueItems: true,
  }),
  acceptedObjectIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 12,
    uniqueItems: true,
  }),
});

export const GivePairSchema = StrictObject({
  objectId: IdSchema,
  recipientEntityId: IdSchema,
});

export const GiveInteractionSchema = StrictObject({
  type: Type.Literal("GIVE"),
  candidateObjectIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 8,
    uniqueItems: true,
  }),
  candidateRecipientEntityIds: Type.Array(IdSchema, {
    minItems: 1,
    maxItems: 5,
    uniqueItems: true,
  }),
  acceptedPairs: Type.Array(GivePairSchema, { minItems: 1, maxItems: 12 }),
});

export const InteractionSchema = OneOf([
  ListenInteractionSchema,
  ClickObjectInteractionSchema,
  ChooseInteractionSchema,
  ArrangeInteractionSchema,
  TypeInteractionSchema,
  MoveToInteractionSchema,
  PickUpInteractionSchema,
  GiveInteractionSchema,
]);

export type ListenInteraction = Static<typeof ListenInteractionSchema>;
export type ClickObjectInteraction = Static<
  typeof ClickObjectInteractionSchema
>;
export type ChoiceOption = Static<typeof ChoiceOptionSchema>;
export type ChooseInteraction = Static<typeof ChooseInteractionSchema>;
export type ArrangeToken = Static<typeof ArrangeTokenSchema>;
export type ArrangeInteraction = Static<typeof ArrangeInteractionSchema>;
export type TypeInteraction = Static<typeof TypeInteractionSchema>;
export type MoveToInteraction = Static<typeof MoveToInteractionSchema>;
export type PickUpInteraction = Static<typeof PickUpInteractionSchema>;
export type GivePair = Static<typeof GivePairSchema>;
export type GiveInteraction = Static<typeof GiveInteractionSchema>;
export type Interaction = Static<typeof InteractionSchema>;
