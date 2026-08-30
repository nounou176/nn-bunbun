import {
  ADAPTIVE_LEARNING_SCHEMA_VERSION,
  type AdaptiveLearningSnapshot,
  type AdaptivePreferences,
  type AdaptiveSuggestion,
  type CatalogSnapshot,
  type ConceptEvidenceSummary,
  type LearningConcept,
  type LearningTarget,
  type LearningTargetRegistry,
  type LessonManifest,
  type RecommendationContext,
  type TargetProgressSignal,
  type UnmappedAdaptiveTarget,
  resolveLearningTargetConcept,
  validateAdaptiveLearningSnapshotStructure,
  validateAdaptivePreferencesStructure,
  validateLearningTargetRegistry,
  validateLessonPackage,
} from "@bunbun/contracts";

export interface AdaptiveLessonPackageProjection {
  manifest: LessonManifest;
  catalog: CatalogSnapshot;
}

export interface PublishedLessonProjection extends AdaptiveLessonPackageProjection {
  supportedLaunchModes: Array<"GUIDED" | "IMMERSIVE">;
}

export interface AdaptiveReactionProjection {
  eventSequence: number;
  sessionId: string;
  lessonId: string;
  revision: number;
  stepId: string;
  contextId: string;
  targetId: string;
  attempt: number;
  correct: boolean;
  assisted: boolean;
  occurredAt: string;
}

export interface DeriveAdaptiveSnapshotInput {
  registry: LearningTargetRegistry;
  preferences: AdaptivePreferences;
  lessonPackages: AdaptiveLessonPackageProjection[];
  publishedLessons: PublishedLessonProjection[];
  reactions: AdaptiveReactionProjection[];
}

export type AdaptiveDerivationErrorCode =
  | "REGISTRY_INVALID"
  | "PREFERENCES_INVALID"
  | "LESSON_PACKAGE_INVALID"
  | "DUPLICATE_LESSON_REVISION"
  | "DUPLICATE_PUBLISHED_LESSON"
  | "REACTION_INVALID"
  | "REACTION_TARGET_UNKNOWN"
  | "CONFLICTING_ATTEMPT_CONTEXT"
  | "ADAPTATION_SNAPSHOT_INVALID";

export class AdaptiveDerivationError extends Error {
  constructor(
    readonly code: AdaptiveDerivationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AdaptiveDerivationError";
  }
}

interface ResolvedTarget {
  lessonId: string;
  revision: number;
  target: LearningTarget;
  concept?: LearningConcept;
}

interface AttemptUnit {
  conceptKey: string;
  lessonId: string;
  revision: number;
  contextId: string;
  contextKey: string;
  eventSequence: number;
  correct: boolean;
  assisted: boolean;
  occurredAt: string;
}

interface ConceptMetadata {
  concept: LearningConcept;
  role: "REQUESTED" | "SUPPORTING";
  priority: number;
}

interface PublishedConceptCandidate {
  lessonId: string;
  revision: number;
  title: LessonManifest["title"];
  contextIds: string[];
  supportedLaunchModes: Array<"GUIDED" | "IMMERSIVE">;
}

const MAX_LESSONS = 100;
const MAX_REACTIONS = 100_000;

export function deriveAdaptiveLearningSnapshot(
  input: DeriveAdaptiveSnapshotInput,
): AdaptiveLearningSnapshot {
  const registry = validatedRegistry(input.registry);
  const preferences = validatedPreferences(input.preferences);
  validateInputBounds(input);

  const conceptIndex = new Map(
    registry.concepts.map((concept) => [concept.conceptKey, concept]),
  );
  const packages = validateAndIndexPackages(
    input.lessonPackages,
    input.publishedLessons,
  );
  const published = validatePublishedLessons(input.publishedLessons);
  const targetIndex = resolveTargets(packages, registry, conceptIndex);
  const metadata = collectConceptMetadata(targetIndex);
  const publishedCandidates = collectPublishedCandidates(
    published,
    targetIndex,
  );
  const publishedConceptKeys = collectPublishedConceptKeys(
    published,
    targetIndex,
  );
  const reactionResult = aggregateReactions(input.reactions, targetIndex);
  const universe = new Set<string>([
    ...reactionResult.attemptsByConcept.keys(),
    ...publishedConceptKeys,
  ]);

  const summaries = [...universe]
    .sort()
    .map((conceptKey) =>
      summarizeConcept(
        requiredMetadata(metadata, conceptKey),
        reactionResult.attemptsByConcept.get(conceptKey) ?? [],
      ),
    )
    .sort(compareSummaries);

  const suggestions =
    preferences.adaptiveMode === "OFF"
      ? []
      : summaries
          .slice(0, 3)
          .map((summary) =>
            buildSuggestion(
              summary,
              requiredMetadata(metadata, summary.conceptKey).concept,
              publishedCandidates.get(summary.conceptKey) ?? [],
              reactionResult.attemptsByConcept.get(summary.conceptKey) ?? [],
              packages,
              targetIndex,
            ),
          );
  const unmappedTargets = collectUnmappedTargets(
    published,
    input.reactions,
    targetIndex,
  );

  const snapshot: AdaptiveLearningSnapshot = {
    contractType: "ADAPTIVE_SNAPSHOT",
    schemaVersion: ADAPTIVE_LEARNING_SCHEMA_VERSION,
    registryId: registry.registryId,
    registryVersion: registry.registryVersion,
    preferences,
    summaries,
    suggestions,
    unmappedTargets,
    publishedLessonCandidateCount: published.length,
  };
  const snapshotValidation =
    validateAdaptiveLearningSnapshotStructure(snapshot);
  if (!snapshotValidation.ok) {
    throw new AdaptiveDerivationError(
      "ADAPTATION_SNAPSHOT_INVALID",
      describeValidationFailure(snapshotValidation.errors),
    );
  }
  return snapshotValidation.value;
}

function validatedRegistry(
  input: LearningTargetRegistry,
): LearningTargetRegistry {
  const result = validateLearningTargetRegistry(input);
  if (!result.ok) {
    throw new AdaptiveDerivationError(
      "REGISTRY_INVALID",
      describeValidationFailure(result.errors),
    );
  }
  return result.value;
}

function validatedPreferences(input: AdaptivePreferences): AdaptivePreferences {
  const result = validateAdaptivePreferencesStructure(input);
  if (!result.ok) {
    throw new AdaptiveDerivationError(
      "PREFERENCES_INVALID",
      describeValidationFailure(result.errors),
    );
  }
  return result.value;
}

function validateInputBounds(input: DeriveAdaptiveSnapshotInput): void {
  if (
    input.lessonPackages.length > MAX_LESSONS ||
    input.publishedLessons.length > MAX_LESSONS
  ) {
    throw new AdaptiveDerivationError(
      "LESSON_PACKAGE_INVALID",
      `Adaptive derivation accepts at most ${MAX_LESSONS} lesson packages per input collection.`,
    );
  }
  if (input.reactions.length > MAX_REACTIONS) {
    throw new AdaptiveDerivationError(
      "REACTION_INVALID",
      `Adaptive derivation accepts at most ${MAX_REACTIONS} reaction rows.`,
    );
  }
}

function validateAndIndexPackages(
  lessonPackages: AdaptiveLessonPackageProjection[],
  publishedLessons: PublishedLessonProjection[],
): Map<string, AdaptiveLessonPackageProjection> {
  const packages = new Map<string, AdaptiveLessonPackageProjection>();
  for (const candidate of [...lessonPackages, ...publishedLessons]) {
    const result = validateLessonPackage(candidate.manifest, candidate.catalog);
    if (!result.ok) {
      throw new AdaptiveDerivationError(
        "LESSON_PACKAGE_INVALID",
        `${candidate.manifest.lessonId} revision ${candidate.manifest.revision}: ${describeValidationFailure(result.errors)}`,
      );
    }
    const key = lessonRevisionKey(
      result.value.manifest.lessonId,
      result.value.manifest.revision,
    );
    const existing = packages.get(key);
    if (existing !== undefined) {
      if (
        canonicalJson(existing.manifest) !==
          canonicalJson(result.value.manifest) ||
        canonicalJson(existing.catalog) !== canonicalJson(result.value.catalog)
      ) {
        throw new AdaptiveDerivationError(
          "DUPLICATE_LESSON_REVISION",
          `Lesson revision '${key}' was supplied with different content.`,
        );
      }
      continue;
    }
    packages.set(key, result.value);
  }
  return packages;
}

function validatePublishedLessons(
  publishedLessons: PublishedLessonProjection[],
): PublishedLessonProjection[] {
  const lessonIds = new Set<string>();
  return [...publishedLessons]
    .sort((left, right) =>
      left.manifest.lessonId.localeCompare(right.manifest.lessonId),
    )
    .map((candidate) => {
      if (lessonIds.has(candidate.manifest.lessonId)) {
        throw new AdaptiveDerivationError(
          "DUPLICATE_PUBLISHED_LESSON",
          `Published lesson '${candidate.manifest.lessonId}' appears more than once.`,
        );
      }
      lessonIds.add(candidate.manifest.lessonId);
      const modes = canonicalLaunchModes(candidate.supportedLaunchModes);
      if (modes.length === 0) {
        throw new AdaptiveDerivationError(
          "LESSON_PACKAGE_INVALID",
          `Published lesson '${candidate.manifest.lessonId}' must support at least one launch mode.`,
        );
      }
      return { ...candidate, supportedLaunchModes: modes };
    });
}

function resolveTargets(
  packages: Map<string, AdaptiveLessonPackageProjection>,
  registry: LearningTargetRegistry,
  conceptIndex: Map<string, LearningConcept>,
): Map<string, ResolvedTarget> {
  const targets = new Map<string, ResolvedTarget>();
  for (const [packageKey, lessonPackage] of [...packages].sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    for (const target of lessonPackage.manifest.learningTargets) {
      const resolution = resolveLearningTargetConcept(
        registry,
        target,
        lessonPackage.catalog,
      );
      if (!resolution.ok) {
        throw new AdaptiveDerivationError(
          "REGISTRY_INVALID",
          `${packageKey}/${target.targetId}: ${describeValidationFailure(resolution.errors)}`,
        );
      }
      const resolved: ResolvedTarget = {
        lessonId: lessonPackage.manifest.lessonId,
        revision: lessonPackage.manifest.revision,
        target,
      };
      if (resolution.value.status === "MAPPED") {
        const concept = conceptIndex.get(resolution.value.conceptKey);
        if (concept === undefined) {
          throw new AdaptiveDerivationError(
            "REGISTRY_INVALID",
            `Mapped concept '${resolution.value.conceptKey}' is absent from the validated registry.`,
          );
        }
        resolved.concept = concept;
      }
      targets.set(
        targetKey(resolved.lessonId, resolved.revision, target.targetId),
        resolved,
      );
    }
  }
  return targets;
}

function collectConceptMetadata(
  targets: Map<string, ResolvedTarget>,
): Map<string, ConceptMetadata> {
  const metadata = new Map<string, ConceptMetadata>();
  for (const resolved of targets.values()) {
    if (resolved.concept === undefined) continue;
    const existing = metadata.get(resolved.concept.conceptKey);
    const role =
      existing?.role === "REQUESTED" || resolved.target.role === "REQUESTED"
        ? "REQUESTED"
        : "SUPPORTING";
    metadata.set(resolved.concept.conceptKey, {
      concept: resolved.concept,
      role,
      priority: Math.max(existing?.priority ?? 1, resolved.target.priority),
    });
  }
  return metadata;
}

function collectPublishedCandidates(
  published: PublishedLessonProjection[],
  targets: Map<string, ResolvedTarget>,
): Map<string, PublishedConceptCandidate[]> {
  const candidates = new Map<string, PublishedConceptCandidate[]>();
  for (const lesson of published) {
    const contextsByConcept = new Map<string, Set<string>>();
    for (const step of lesson.manifest.steps) {
      for (const binding of step.targetBindings) {
        if (binding.relation !== "ASSESSES") continue;
        const resolved = targets.get(
          targetKey(
            lesson.manifest.lessonId,
            lesson.manifest.revision,
            binding.targetId,
          ),
        );
        if (resolved?.concept === undefined) continue;
        const contexts =
          contextsByConcept.get(resolved.concept.conceptKey) ?? new Set();
        contexts.add(step.contextId);
        contextsByConcept.set(resolved.concept.conceptKey, contexts);
      }
    }
    for (const [conceptKey, contexts] of contextsByConcept) {
      const list = candidates.get(conceptKey) ?? [];
      list.push({
        lessonId: lesson.manifest.lessonId,
        revision: lesson.manifest.revision,
        title: lesson.manifest.title,
        contextIds: [...contexts].sort(),
        supportedLaunchModes: canonicalLaunchModes(lesson.supportedLaunchModes),
      });
      candidates.set(conceptKey, list);
    }
  }
  for (const list of candidates.values()) {
    list.sort((left, right) => left.lessonId.localeCompare(right.lessonId));
  }
  return candidates;
}

function collectPublishedConceptKeys(
  published: PublishedLessonProjection[],
  targets: Map<string, ResolvedTarget>,
): Set<string> {
  const conceptKeys = new Set<string>();
  for (const lesson of published) {
    for (const target of lesson.manifest.learningTargets) {
      const concept = targets.get(
        targetKey(
          lesson.manifest.lessonId,
          lesson.manifest.revision,
          target.targetId,
        ),
      )?.concept;
      if (concept !== undefined) conceptKeys.add(concept.conceptKey);
    }
  }
  return conceptKeys;
}

function aggregateReactions(
  reactions: AdaptiveReactionProjection[],
  targets: Map<string, ResolvedTarget>,
): { attemptsByConcept: Map<string, AttemptUnit[]> } {
  const sequences = new Set<number>();
  const groups = new Map<string, AdaptiveReactionProjection[]>();
  for (const reaction of reactions) {
    validateReaction(reaction, sequences);
    const resolved = targets.get(
      targetKey(reaction.lessonId, reaction.revision, reaction.targetId),
    );
    if (resolved === undefined) {
      throw new AdaptiveDerivationError(
        "REACTION_TARGET_UNKNOWN",
        `Reaction sequence ${reaction.eventSequence} references unknown target '${reaction.lessonId}/${reaction.revision}/${reaction.targetId}'.`,
      );
    }
    if (resolved.concept === undefined) continue;
    const key = [
      resolved.concept.conceptKey,
      reaction.sessionId,
      reaction.stepId,
      reaction.attempt,
    ].join("\u0000");
    const rows = groups.get(key) ?? [];
    rows.push(reaction);
    groups.set(key, rows);
  }

  const attemptsByConcept = new Map<string, AttemptUnit[]>();
  for (const [groupKey, rows] of groups) {
    rows.sort((left, right) => left.eventSequence - right.eventSequence);
    const first = rows[0]!;
    if (
      rows.some(
        (row) =>
          row.lessonId !== first.lessonId ||
          row.revision !== first.revision ||
          row.contextId !== first.contextId,
      )
    ) {
      throw new AdaptiveDerivationError(
        "CONFLICTING_ATTEMPT_CONTEXT",
        `Attempt group '${groupKey}' spans more than one lesson revision or context.`,
      );
    }
    const conceptKey = groupKey.split("\u0000", 1)[0]!;
    const last = rows.at(-1)!;
    const attempt: AttemptUnit = {
      conceptKey,
      lessonId: first.lessonId,
      revision: first.revision,
      contextId: first.contextId,
      contextKey: globalContextKey(first.lessonId, first.contextId),
      eventSequence: last.eventSequence,
      correct: rows.every((row) => row.correct),
      assisted: rows.some((row) => row.assisted),
      occurredAt: last.occurredAt,
    };
    const list = attemptsByConcept.get(conceptKey) ?? [];
    list.push(attempt);
    attemptsByConcept.set(conceptKey, list);
  }
  for (const attempts of attemptsByConcept.values()) {
    attempts.sort((left, right) => left.eventSequence - right.eventSequence);
  }
  return { attemptsByConcept };
}

function validateReaction(
  reaction: AdaptiveReactionProjection,
  sequences: Set<number>,
): void {
  if (
    !Number.isSafeInteger(reaction.eventSequence) ||
    reaction.eventSequence < 1
  ) {
    throw new AdaptiveDerivationError(
      "REACTION_INVALID",
      "Reaction eventSequence must be a positive safe integer.",
    );
  }
  if (sequences.has(reaction.eventSequence)) {
    throw new AdaptiveDerivationError(
      "REACTION_INVALID",
      `Reaction eventSequence ${reaction.eventSequence} is duplicated.`,
    );
  }
  sequences.add(reaction.eventSequence);
  if (
    !Number.isInteger(reaction.attempt) ||
    reaction.attempt < 0 ||
    reaction.attempt > 5 ||
    !Number.isInteger(reaction.revision) ||
    reaction.revision < 1 ||
    !isTimestamp(reaction.occurredAt)
  ) {
    throw new AdaptiveDerivationError(
      "REACTION_INVALID",
      `Reaction sequence ${reaction.eventSequence} has invalid revision, attempt, or occurredAt.`,
    );
  }
}

function summarizeConcept(
  metadata: ConceptMetadata,
  attempts: AttemptUnit[],
): ConceptEvidenceSummary {
  const unaidedCorrect = attempts.filter(
    (attempt) => attempt.correct && !attempt.assisted,
  );
  const assistedCorrect = attempts.filter(
    (attempt) => attempt.correct && attempt.assisted,
  );
  const incorrect = attempts.filter((attempt) => !attempt.correct);
  const lastWeakIndex = findLastIndex(
    attempts,
    (attempt) => !attempt.correct || attempt.assisted,
  );
  const recoveryContexts = new Set(
    attempts
      .slice(lastWeakIndex + 1)
      .filter((attempt) => attempt.correct && !attempt.assisted)
      .map((attempt) => attempt.contextKey),
  );
  const allUnaidedContexts = new Set(
    unaidedCorrect.map((attempt) => attempt.contextKey),
  );
  const signal: TargetProgressSignal =
    lastWeakIndex >= 0
      ? recoveryContexts.size >= 2
        ? "DEVELOPING"
        : "NEEDS_REVIEW"
      : allUnaidedContexts.size >= 2
        ? "DEVELOPING"
        : "INSUFFICIENT_EVIDENCE";
  const last = attempts.at(-1);
  return {
    conceptKey: metadata.concept.conceptKey,
    targetKind: metadata.concept.targetKind,
    labelJa: metadata.concept.labelJa,
    ...(metadata.concept.supportLabel === undefined
      ? {}
      : { supportLabel: metadata.concept.supportLabel }),
    role: metadata.role,
    priority: metadata.priority,
    attemptCount: attempts.length,
    unaidedCorrectAttemptCount: unaidedCorrect.length,
    assistedCorrectAttemptCount: assistedCorrect.length,
    incorrectAttemptCount: incorrect.length,
    distinctUnaidedCorrectContextCount: allUnaidedContexts.size,
    signal,
    ...(last === undefined
      ? {}
      : {
          lastPracticedAt: last.occurredAt,
          lastContextKey: last.contextKey,
        }),
    ...(metadata.concept.referenceAid === undefined
      ? {}
      : { referenceAid: metadata.concept.referenceAid }),
  };
}

function compareSummaries(
  left: ConceptEvidenceSummary,
  right: ConceptEvidenceSummary,
): number {
  const signal = signalRank(left.signal) - signalRank(right.signal);
  if (signal !== 0) return signal;
  if (left.role !== right.role) return left.role === "REQUESTED" ? -1 : 1;
  if (left.priority !== right.priority) return right.priority - left.priority;
  if (left.lastPracticedAt === undefined && right.lastPracticedAt !== undefined)
    return -1;
  if (left.lastPracticedAt !== undefined && right.lastPracticedAt === undefined)
    return 1;
  if (
    left.lastPracticedAt !== undefined &&
    right.lastPracticedAt !== undefined &&
    left.lastPracticedAt !== right.lastPracticedAt
  ) {
    return left.lastPracticedAt.localeCompare(right.lastPracticedAt);
  }
  return left.conceptKey.localeCompare(right.conceptKey);
}

function buildSuggestion(
  summary: ConceptEvidenceSummary,
  concept: LearningConcept,
  candidates: PublishedConceptCandidate[],
  attempts: AttemptUnit[],
  packages: Map<string, AdaptiveLessonPackageProjection>,
  targets: Map<string, ResolvedTarget>,
): AdaptiveSuggestion {
  const context = chooseContext(
    candidates,
    attempts,
    packages,
    targets,
    concept,
  );
  return {
    conceptKey: summary.conceptKey,
    reason:
      summary.signal === "NEEDS_REVIEW"
        ? "NEEDS_REVIEW"
        : summary.signal === "INSUFFICIENT_EVIDENCE"
          ? "INSUFFICIENT_EVIDENCE"
          : "READY_FOR_VARIATION",
    context,
    ...(context.availability === "CHANGED_CONTEXT_AVAILABLE" ||
    concept.compilerPrefillText === undefined
      ? {}
      : { compilerPrefillText: concept.compilerPrefillText }),
  };
}

function chooseContext(
  candidates: PublishedConceptCandidate[],
  attempts: AttemptUnit[],
  packages: Map<string, AdaptiveLessonPackageProjection>,
  targets: Map<string, ResolvedTarget>,
  concept: LearningConcept,
): RecommendationContext {
  if (candidates.length === 0) {
    return { availability: "NO_PUBLISHED_LESSON_AVAILABLE" };
  }
  const last = attempts.at(-1);
  if (last === undefined) return changedContext(candidates[0]!);

  const lastContextIds = assessmentContextIds(
    last.lessonId,
    last.revision,
    concept.conceptKey,
    packages,
    targets,
  );
  const candidate = candidates.find(
    (item) =>
      item.lessonId !== last.lessonId &&
      !sameStringSet(item.contextIds, lastContextIds),
  );
  return candidate === undefined
    ? { availability: "NO_CHANGED_CONTEXT_AVAILABLE" }
    : changedContext(candidate);
}

function assessmentContextIds(
  lessonId: string,
  revision: number,
  conceptKey: string,
  packages: Map<string, AdaptiveLessonPackageProjection>,
  targets: Map<string, ResolvedTarget>,
): string[] {
  const contexts = new Set<string>();
  const lessonPackage = packages.get(lessonRevisionKey(lessonId, revision));
  if (lessonPackage === undefined) return [];
  for (const step of lessonPackage.manifest.steps) {
    const assessesConcept = step.targetBindings.some((binding) => {
      if (binding.relation !== "ASSESSES") return false;
      return (
        targets.get(targetKey(lessonId, revision, binding.targetId))?.concept
          ?.conceptKey === conceptKey
      );
    });
    if (assessesConcept) contexts.add(step.contextId);
  }
  return [...contexts].sort();
}

function changedContext(
  candidate: PublishedConceptCandidate,
): RecommendationContext {
  return {
    availability: "CHANGED_CONTEXT_AVAILABLE",
    lessonId: candidate.lessonId,
    revision: candidate.revision,
    title: candidate.title,
    contextIds: candidate.contextIds,
    supportedLaunchModes: candidate.supportedLaunchModes,
  };
}

function collectUnmappedTargets(
  published: PublishedLessonProjection[],
  reactions: AdaptiveReactionProjection[],
  targets: Map<string, ResolvedTarget>,
): UnmappedAdaptiveTarget[] {
  const keys = new Set<string>();
  for (const lesson of published) {
    for (const target of lesson.manifest.learningTargets) {
      const key = targetKey(
        lesson.manifest.lessonId,
        lesson.manifest.revision,
        target.targetId,
      );
      if (targets.get(key)?.concept === undefined) keys.add(key);
    }
  }
  for (const reaction of reactions) {
    const key = targetKey(
      reaction.lessonId,
      reaction.revision,
      reaction.targetId,
    );
    if (targets.get(key)?.concept === undefined) keys.add(key);
  }
  return [...keys]
    .sort()
    .map((key) => {
      const target = targets.get(key)!;
      return {
        lessonId: target.lessonId,
        revision: target.revision,
        targetId: target.target.targetId,
        targetKind: target.target.kind,
        reason: "UNMAPPED_TARGET" as const,
      };
    })
    .slice(0, 100);
}

function requiredMetadata(
  metadata: Map<string, ConceptMetadata>,
  conceptKey: string,
): ConceptMetadata {
  const value = metadata.get(conceptKey);
  if (value === undefined) {
    throw new AdaptiveDerivationError(
      "REGISTRY_INVALID",
      `Concept '${conceptKey}' has evidence or publication but no target metadata.`,
    );
  }
  return value;
}

function signalRank(signal: TargetProgressSignal): number {
  switch (signal) {
    case "NEEDS_REVIEW":
      return 0;
    case "INSUFFICIENT_EVIDENCE":
      return 1;
    case "DEVELOPING":
      return 2;
  }
}

function canonicalLaunchModes(
  modes: Array<"GUIDED" | "IMMERSIVE">,
): Array<"GUIDED" | "IMMERSIVE"> {
  const unique = new Set(modes);
  return (["GUIDED", "IMMERSIVE"] as const).filter((mode) => unique.has(mode));
}

function lessonRevisionKey(lessonId: string, revision: number): string {
  return `${lessonId}\u0000${revision}`;
}

function targetKey(
  lessonId: string,
  revision: number,
  targetId: string,
): string {
  return `${lessonId}\u0000${revision}\u0000${targetId}`;
}

function globalContextKey(lessonId: string, contextId: string): string {
  return `${lessonId}:${contextId}`;
}

function sameStringSet(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index]!)) return index;
  }
  return -1;
}

function isTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value)) && value.includes("T");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function describeValidationFailure(
  errors: Array<{ code: string; path: string; message: string }>,
): string {
  const first = errors[0];
  return first === undefined
    ? "Validation failed."
    : `${first.code} at ${first.path}: ${first.message}`;
}
