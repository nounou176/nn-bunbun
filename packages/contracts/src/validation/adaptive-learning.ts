import type {
  CatalogSnapshot,
  LearningConcept,
  LearningTarget,
  LearningTargetConceptResolution,
  LearningTargetRegistry,
  LearningTargetSelector,
} from "../schema/index.js";
import {
  type BunbunValidationError,
  type ValidationResult,
  semanticError,
  validationFailure,
  validationSuccess,
} from "./errors.js";
import { validateLearningTargetRegistryStructure } from "./structural.js";

const CONTENT_SIGNATURE_PREFIX = "target_content_v1:";

export function canonicalLearningTargetContentSignature(
  content: LearningTarget["content"],
): string {
  return `${CONTENT_SIGNATURE_PREFIX}${canonicalJson(content)}`;
}

export function validateLearningTargetRegistry(
  input: unknown,
): ValidationResult<LearningTargetRegistry> {
  const structural = validateLearningTargetRegistryStructure(input);
  if (!structural.ok) return structural;

  const errors: BunbunValidationError[] = [];
  const conceptKeys = new Set<string>();
  const selectorOwners = new Map<string, string>();

  structural.value.concepts.forEach((concept, conceptIndex) => {
    const conceptPath = `/concepts/${conceptIndex}`;

    if (conceptKeys.has(concept.conceptKey)) {
      errors.push(
        adaptationError(
          "DUPLICATE_CONCEPT_KEY",
          `${conceptPath}/conceptKey`,
          `Concept key '${concept.conceptKey}' is duplicated.`,
        ),
      );
    }
    conceptKeys.add(concept.conceptKey);

    concept.selectors.forEach((selector, selectorIndex) => {
      const selectorPath = `${conceptPath}/selectors/${selectorIndex}`;
      if (selector.targetKind !== concept.targetKind) {
        errors.push(
          adaptationError(
            "SELECTOR_TARGET_KIND_MISMATCH",
            `${selectorPath}/targetKind`,
            `Selector kind '${selector.targetKind}' does not match concept kind '${concept.targetKind}'.`,
          ),
        );
      }

      const key = selectorKey(selector);
      const existingOwner = selectorOwners.get(key);
      if (existingOwner !== undefined) {
        errors.push(
          adaptationError(
            "DUPLICATE_EXACT_SELECTOR",
            selectorPath,
            `Exact selector is already owned by concept '${existingOwner}'.`,
          ),
        );
      } else {
        selectorOwners.set(key, concept.conceptKey);
      }
    });

    validateReferenceAid(concept, conceptPath, errors);
  });

  return errors.length > 0
    ? validationFailure(errors)
    : validationSuccess(structural.value);
}

export function resolveLearningTargetConcept(
  registryInput: unknown,
  target: LearningTarget,
  catalog: CatalogSnapshot,
): ValidationResult<LearningTargetConceptResolution> {
  const registryResult = validateLearningTargetRegistry(registryInput);
  if (!registryResult.ok) return registryResult;

  if (target.kind === "KANJI" && target.referenceIds.length === 0) {
    return validationFailure([
      adaptationError(
        "KANJI_REFERENCE_REQUIRED",
        "/target/referenceIds",
        "KANJI targets require an exact reviewed reference before adaptation.",
      ),
    ]);
  }

  const catalogReferences = new Map(
    catalog.referenceRecords.map((record) => [record.referenceId, record]),
  );
  const selectorIndex = buildSelectorIndex(registryResult.value);
  const matches: Array<{
    concept: LearningConcept;
    selector: LearningTargetSelector;
  }> = [];
  const errors: BunbunValidationError[] = [];

  target.referenceIds.forEach((referenceId, referenceIndex) => {
    const record = catalogReferences.get(referenceId);
    if (record === undefined) {
      errors.push(
        adaptationError(
          "UNKNOWN_TARGET_REFERENCE_RECORD",
          `/target/referenceIds/${referenceIndex}`,
          `Catalog does not contain reference '${referenceId}'.`,
        ),
      );
      return;
    }

    if (!record.targetKinds.includes(target.kind)) {
      errors.push(
        adaptationError(
          "REFERENCE_TARGET_KIND_MISMATCH",
          `/target/referenceIds/${referenceIndex}`,
          `Reference '${referenceId}' does not support target kind '${target.kind}'.`,
        ),
      );
      return;
    }

    const key = selectorKey({
      providerId: record.providerId,
      providerVersion: record.providerVersion,
      referenceId,
      targetKind: target.kind,
    });
    const match = selectorIndex.get(key);
    if (match !== undefined) matches.push(match);
  });

  if (errors.length > 0) return validationFailure(errors);

  if (matches.length === 0) {
    return validationSuccess({
      status: "UNMAPPED_TARGET",
      targetId: target.targetId,
      targetKind: target.kind,
    });
  }

  const conceptKeys = new Set(matches.map((match) => match.concept.conceptKey));
  if (conceptKeys.size !== 1) {
    return validationFailure([
      adaptationError(
        "AMBIGUOUS_TARGET_SELECTOR",
        "/target/referenceIds",
        `Target references resolve to multiple concepts: ${[...conceptKeys].sort().join(", ")}.`,
      ),
    ]);
  }

  const actualSignature = canonicalLearningTargetContentSignature(
    target.content,
  );
  const driftedMatchIndex = matches.findIndex(
    (match) => match.selector.contentSignature !== actualSignature,
  );
  if (driftedMatchIndex >= 0) {
    return validationFailure([
      adaptationError(
        "TARGET_CONTENT_SIGNATURE_MISMATCH",
        "/target/content",
        "Target content does not match the reviewed selector signature.",
      ),
    ]);
  }

  const concept = matches[0]!.concept;
  return validationSuccess({
    status: "MAPPED",
    conceptKey: concept.conceptKey,
    targetKind: concept.targetKind,
    labelJa: concept.labelJa,
    ...(concept.supportLabel === undefined
      ? {}
      : { supportLabel: concept.supportLabel }),
    matchedSelectorCount: matches.length,
    ...(concept.compilerPrefillText === undefined
      ? {}
      : { compilerPrefillText: concept.compilerPrefillText }),
    ...(concept.referenceAid === undefined
      ? {}
      : { referenceAid: concept.referenceAid }),
  });
}

function validateReferenceAid(
  concept: LearningConcept,
  conceptPath: string,
  errors: BunbunValidationError[],
): void {
  if (concept.targetKind === "KANJI") {
    if (concept.referenceAid === undefined) {
      errors.push(
        adaptationError(
          "KANJI_REFERENCE_AID_REQUIRED",
          `${conceptPath}/referenceAid`,
          "KANJI concepts require reviewed REFERENCE provenance.",
        ),
      );
      return;
    }

    if (concept.referenceAid.character !== concept.labelJa) {
      errors.push(
        adaptationError(
          "KANJI_REFERENCE_CHARACTER_MISMATCH",
          `${conceptPath}/referenceAid/character`,
          "KANJI reference character must match the concept label.",
        ),
      );
    }

    const aidSelectorExists = concept.selectors.some(
      (selector) =>
        selector.providerId === concept.referenceAid?.providerId &&
        selector.providerVersion === concept.referenceAid.providerVersion &&
        selector.referenceId === concept.referenceAid.referenceId &&
        selector.targetKind === "KANJI",
    );
    if (!aidSelectorExists) {
      errors.push(
        adaptationError(
          "KANJI_REFERENCE_AID_SELECTOR_MISSING",
          `${conceptPath}/referenceAid`,
          "KANJI reference provenance must match one exact concept selector.",
        ),
      );
    }
    return;
  }

  if (concept.referenceAid !== undefined) {
    errors.push(
      adaptationError(
        "REFERENCE_AID_FOR_NON_KANJI",
        `${conceptPath}/referenceAid`,
        "REFERENCE aids are reserved for KANJI concepts in AdaptiveLearning 0.1.0.",
      ),
    );
  }
}

function buildSelectorIndex(
  registry: LearningTargetRegistry,
): Map<string, { concept: LearningConcept; selector: LearningTargetSelector }> {
  const index = new Map<
    string,
    { concept: LearningConcept; selector: LearningTargetSelector }
  >();
  registry.concepts.forEach((concept) => {
    concept.selectors.forEach((selector) => {
      index.set(selectorKey(selector), { concept, selector });
    });
  });
  return index;
}

function selectorKey(
  selector: Pick<
    LearningTargetSelector,
    "providerId" | "providerVersion" | "referenceId" | "targetKind"
  >,
): string {
  return [
    selector.providerId,
    selector.providerVersion,
    selector.referenceId,
    selector.targetKind,
  ].join("\u0000");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
  return `{${entries.join(",")}}`;
}

function adaptationError(
  code: string,
  path: string,
  message: string,
): BunbunValidationError {
  return semanticError("ADAPTATION", code, path, message);
}
