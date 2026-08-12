import type { ArrangeToken, ChoiceOption, LessonStep } from "@bunbun/contracts";

export function orderedChoiceOptions(
  step: LessonStep,
  manifestSeed: number,
): readonly ChoiceOption[] {
  if (step.interaction.type !== "CHOOSE") return [];
  const options = [...step.interaction.options];
  if (!step.interaction.shuffle) return options;

  return seededOrder(options, manifestSeed, step.stepId);
}

export function orderedArrangeTokens(
  step: LessonStep,
  manifestSeed: number,
): readonly ArrangeToken[] {
  if (step.interaction.type !== "ARRANGE") return [];
  const tokens = [...step.interaction.tokens];
  if (!step.interaction.shuffle) return tokens;
  return seededOrder(tokens, manifestSeed, step.stepId);
}

function seededOrder<Value>(
  values: Value[],
  manifestSeed: number,
  stepId: string,
): Value[] {
  const random = mulberry32((manifestSeed ^ hashString(stepId)) >>> 0);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = values[index];
    const swap = values[swapIndex];
    if (current !== undefined && swap !== undefined) {
      values[index] = swap;
      values[swapIndex] = current;
    }
  }
  return values;
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
