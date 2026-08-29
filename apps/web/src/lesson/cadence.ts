export interface ReactionCadence {
  reactionsPerMinute: number;
  medianGapMs: number | undefined;
  p95GapMs: number | undefined;
}

export interface ReactionEvidence {
  sessionId: string;
  stepId: string;
  attempt: number;
  correct?: boolean;
}

export interface MeaningfulReactionSummary {
  reactionCount: number;
  correctReactionCount: number;
  incorrectReactionCount: number;
}

export function meaningfulReactionKey(event: ReactionEvidence): string {
  return `${event.sessionId}:${event.stepId}:${event.attempt}`;
}

export function summarizeMeaningfulReactions(
  events: readonly ReactionEvidence[],
): MeaningfulReactionSummary {
  const attempts = new Map<string, boolean>();
  events.forEach((event) => {
    const key = meaningfulReactionKey(event);
    const correct = event.correct === true;
    attempts.set(key, (attempts.get(key) ?? true) && correct);
  });
  const outcomes = [...attempts.values()];

  return {
    reactionCount: outcomes.length,
    correctReactionCount: outcomes.filter(Boolean).length,
    incorrectReactionCount: outcomes.filter((correct) => !correct).length,
  };
}

export function calculateReactionCadence(
  activeTimeMs: number,
  reactionActiveTimesMs: readonly number[],
): ReactionCadence {
  const boundedActiveTimeMs = Math.max(0, activeTimeMs);
  const reactionTimes = [...reactionActiveTimesMs]
    .filter(
      (value) =>
        Number.isFinite(value) && value >= 0 && value <= boundedActiveTimeMs,
    )
    .sort((left, right) => left - right);
  const reactionsPerMinute =
    boundedActiveTimeMs === 0
      ? 0
      : (reactionTimes.length * 60_000) / boundedActiveTimeMs;
  const gaps = reactionTimes
    .slice(1)
    .map((value, index) => value - reactionTimes[index]!)
    .sort((left, right) => left - right);

  return {
    reactionsPerMinute,
    medianGapMs: percentile(gaps, 0.5),
    p95GapMs: percentile(gaps, 0.95),
  };
}

function percentile(
  sortedValues: readonly number[],
  percentileValue: number,
): number | undefined {
  if (sortedValues.length === 0) return undefined;
  const index = Math.max(
    0,
    Math.ceil(sortedValues.length * percentileValue) - 1,
  );
  return sortedValues[index];
}
