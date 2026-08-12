import type { TypeInteraction } from "./schema/index.js";

export type TypeNormalizationRule = TypeInteraction["normalization"][number];

export function normalizeTypeAnswer(
  input: string,
  rules: readonly TypeNormalizationRule[],
): string {
  let value = input;

  for (const rule of rules) {
    switch (rule) {
      case "UNICODE_NFKC":
        value = value.normalize("NFKC");
        break;
      case "TRIM":
        value = value.trim();
        break;
      case "COLLAPSE_WHITESPACE":
        value = value.replace(/\s+/gu, " ");
        break;
      case "IGNORE_JAPANESE_PUNCTUATION":
        value = value.replace(/[。、！？「」『』（）・…!?]/gu, "");
        break;
      case "KANA_EQUIVALENCE":
        value = [...value]
          .map((character) => {
            const codePoint = character.codePointAt(0);
            if (
              codePoint !== undefined &&
              codePoint >= 0x30a1 &&
              codePoint <= 0x30f6
            ) {
              return String.fromCodePoint(codePoint - 0x60);
            }
            return character;
          })
          .join("");
        break;
    }
  }

  return value;
}

export function unicodeCodePointLength(input: string): number {
  return [...input].length;
}

export function truncateToUnicodeCodePoints(
  input: string,
  maximumLength: number,
): string {
  return [...input].slice(0, Math.max(0, maximumLength)).join("");
}
