import type { LessonManifest, LessonStep, Scaffold } from "../schema/index.js";
import type { CatalogIndexes } from "./catalog-semantic.js";
import { normalizeTypeAnswer } from "../type-normalization.js";
import { type BunbunValidationError, semanticError } from "./errors.js";
import {
  duplicateStrings,
  indexUnique,
  isSubset,
  pushUnknownReference,
} from "./helpers.js";
import type { ManifestIndexes } from "./manifest-indexes.js";

const INTERACTION_DIFFICULTY: Record<
  LessonStep["interaction"]["type"],
  number
> = {
  LISTEN: 1,
  CLICK_OBJECT: 2,
  CHOOSE: 2,
  MOVE_TO: 2,
  PICK_UP: 2,
  GIVE: 3,
  ARRANGE: 4,
  TYPE: 5,
};

export function validateManifestInteractions(
  manifest: LessonManifest,
  catalogIndexes: CatalogIndexes,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  manifest.steps.forEach((step, stepIndex) => {
    validateStimulus(step, stepIndex, manifestIndexes, errors);
    validateInteraction(
      step,
      stepIndex,
      catalogIndexes,
      manifestIndexes,
      errors,
    );
    validateScaffolds(step, stepIndex, manifestIndexes, errors);
  });

  validateQualityCounts(manifest, errors);
}

function validateStimulus(
  step: LessonStep,
  stepIndex: number,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  const utterance = step.stimulus.utterance;
  if (utterance === undefined) {
    return;
  }

  if (
    utterance.speakerEntityId !== undefined &&
    !manifestIndexes.entities.has(utterance.speakerEntityId)
  ) {
    pushUnknownReference(
      errors,
      "MANIFEST",
      "UNKNOWN_SPEAKER_ENTITY",
      `/steps/${stepIndex}/stimulus/utterance/speakerEntityId`,
      "speaker entity",
      utterance.speakerEntityId,
    );
  }

  if (utterance.audioAssetId !== undefined) {
    const audio = manifestIndexes.audioAssets.get(
      utterance.audioAssetId,
    )?.value;
    if (audio === undefined) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_AUDIO_REFERENCE",
        `/steps/${stepIndex}/stimulus/utterance/audioAssetId`,
        "audio asset",
        utterance.audioAssetId,
      );
    } else if (audio.textJa !== utterance.textJa) {
      errors.push(
        semanticError(
          "MANIFEST",
          "AUDIO_TEXT_MISMATCH",
          `/steps/${stepIndex}/stimulus/utterance/audioAssetId`,
          `Audio '${utterance.audioAssetId}' text does not exactly match the utterance.`,
        ),
      );
    }
  }
}

function validateInteraction(
  step: LessonStep,
  stepIndex: number,
  catalogIndexes: CatalogIndexes,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  const interactionPath = `/steps/${stepIndex}/interaction`;
  const interaction = step.interaction;

  switch (interaction.type) {
    case "LISTEN": {
      if (step.stimulus.utterance?.audioAssetId === undefined) {
        errors.push(
          semanticError(
            "MANIFEST",
            "LISTEN_AUDIO_REQUIRED",
            interactionPath,
            "LISTEN requires a stimulus utterance with audioAssetId.",
          ),
        );
      }
      break;
    }

    case "CLICK_OBJECT": {
      validateObjectCandidates(
        interaction.candidateObjectIds,
        interactionPath,
        "INTERACTIVE",
        catalogIndexes,
        manifestIndexes,
        errors,
      );
      validateSubset(
        interaction.candidateObjectIds,
        interaction.acceptedObjectIds,
        `${interactionPath}/acceptedObjectIds`,
        "ACCEPTED_OBJECT_NOT_CANDIDATE",
        errors,
      );
      break;
    }

    case "CHOOSE": {
      indexUnique(
        interaction.options,
        (option) => option.optionId,
        `${interactionPath}/options`,
        "MANIFEST",
        "DUPLICATE_CHOICE_OPTION_ID",
        errors,
      );
      validateSubset(
        interaction.options.map((option) => option.optionId),
        interaction.acceptedOptionIds,
        `${interactionPath}/acceptedOptionIds`,
        "ACCEPTED_OPTION_NOT_CANDIDATE",
        errors,
      );
      break;
    }

    case "ARRANGE": {
      const tokenIndex = indexUnique(
        interaction.tokens,
        (token) => token.tokenId,
        `${interactionPath}/tokens`,
        "MANIFEST",
        "DUPLICATE_ARRANGE_TOKEN_ID",
        errors,
      );
      const expectedTokenIds = [...tokenIndex.keys()].sort();
      const seenSequences = new Set<string>();
      interaction.acceptedSequences.forEach((sequence, sequenceIndex) => {
        const sequencePath = `${interactionPath}/acceptedSequences/${sequenceIndex}`;
        const sequenceIds = [...sequence].sort();
        if (
          sequenceIds.length !== expectedTokenIds.length ||
          sequenceIds.some((id, index) => id !== expectedTokenIds[index])
        ) {
          errors.push(
            semanticError(
              "MANIFEST",
              "INVALID_ARRANGE_SEQUENCE",
              sequencePath,
              "Each accepted ARRANGE sequence must contain every token ID exactly once.",
            ),
          );
        }
        const key = sequence.join("\u0000");
        if (seenSequences.has(key)) {
          errors.push(
            semanticError(
              "MANIFEST",
              "DUPLICATE_ARRANGE_SEQUENCE",
              sequencePath,
              "Accepted ARRANGE sequences must be unique.",
            ),
          );
        }
        seenSequences.add(key);
      });
      break;
    }

    case "TYPE": {
      const normalizedAnswers = interaction.acceptedAnswers.map((answer) =>
        normalizeTypeAnswer(answer, interaction.normalization),
      );
      for (const duplicate of duplicateStrings(normalizedAnswers)) {
        errors.push(
          semanticError(
            "MANIFEST",
            "CONFLICTING_NORMALIZED_ANSWER",
            `${interactionPath}/acceptedAnswers`,
            `Multiple accepted answers normalize to '${duplicate}'.`,
          ),
        );
      }
      interaction.acceptedAnswers.forEach((answer, answerIndex) => {
        if ([...answer].length > interaction.maximumLength) {
          errors.push(
            semanticError(
              "MANIFEST",
              "ANSWER_EXCEEDS_INPUT_LIMIT",
              `${interactionPath}/acceptedAnswers/${answerIndex}`,
              "Accepted TYPE answer exceeds maximumLength.",
            ),
          );
        }
      });
      break;
    }

    case "MOVE_TO": {
      validateLocationCandidates(
        interaction.candidateLocationIds,
        interactionPath,
        manifestIndexes,
        errors,
      );
      validateSubset(
        interaction.candidateLocationIds,
        interaction.acceptedLocationIds,
        `${interactionPath}/acceptedLocationIds`,
        "ACCEPTED_LOCATION_NOT_CANDIDATE",
        errors,
      );
      break;
    }

    case "PICK_UP": {
      validateObjectCandidates(
        interaction.candidateObjectIds,
        interactionPath,
        "PICK_UP",
        catalogIndexes,
        manifestIndexes,
        errors,
      );
      validateSubset(
        interaction.candidateObjectIds,
        interaction.acceptedObjectIds,
        `${interactionPath}/acceptedObjectIds`,
        "ACCEPTED_OBJECT_NOT_CANDIDATE",
        errors,
      );
      break;
    }

    case "GIVE": {
      validateObjectCandidates(
        interaction.candidateObjectIds,
        interactionPath,
        "GIVE",
        catalogIndexes,
        manifestIndexes,
        errors,
      );
      interaction.candidateRecipientEntityIds.forEach(
        (entityId, entityIndex) => {
          if (!manifestIndexes.entities.has(entityId)) {
            pushUnknownReference(
              errors,
              "MANIFEST",
              "UNKNOWN_RECIPIENT_ENTITY",
              `${interactionPath}/candidateRecipientEntityIds/${entityIndex}`,
              "recipient entity",
              entityId,
            );
          }
        },
      );

      const pairKeys = new Set<string>();
      interaction.acceptedPairs.forEach((pair, pairIndex) => {
        const pairPath = `${interactionPath}/acceptedPairs/${pairIndex}`;
        if (!interaction.candidateObjectIds.includes(pair.objectId)) {
          errors.push(
            semanticError(
              "MANIFEST",
              "GIVE_OBJECT_NOT_CANDIDATE",
              `${pairPath}/objectId`,
              `Accepted GIVE object '${pair.objectId}' is not a candidate.`,
            ),
          );
        }
        if (
          !interaction.candidateRecipientEntityIds.includes(
            pair.recipientEntityId,
          )
        ) {
          errors.push(
            semanticError(
              "MANIFEST",
              "GIVE_RECIPIENT_NOT_CANDIDATE",
              `${pairPath}/recipientEntityId`,
              `Accepted GIVE recipient '${pair.recipientEntityId}' is not a candidate.`,
            ),
          );
        }
        const key = `${pair.objectId}\u0000${pair.recipientEntityId}`;
        if (pairKeys.has(key)) {
          errors.push(
            semanticError(
              "MANIFEST",
              "DUPLICATE_GIVE_PAIR",
              pairPath,
              "Accepted GIVE pairs must be unique.",
            ),
          );
        }
        pairKeys.add(key);
      });
      break;
    }
  }
}

function validateScaffolds(
  step: LessonStep,
  stepIndex: number,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  const scaffoldPath = `/steps/${stepIndex}/scaffolds`;
  indexUnique(
    step.scaffolds,
    (scaffold) => scaffold.scaffoldId,
    scaffoldPath,
    "MANIFEST",
    "DUPLICATE_SCAFFOLD_ID",
    errors,
  );

  let previousAttempt = 0;
  step.scaffolds.forEach((scaffold, scaffoldIndex) => {
    const path = `${scaffoldPath}/${scaffoldIndex}`;
    if (scaffold.afterAttempt < previousAttempt) {
      errors.push(
        semanticError(
          "MANIFEST",
          "SCAFFOLDS_NOT_ORDERED",
          `${path}/afterAttempt`,
          "Scaffolds must be ordered by non-decreasing afterAttempt.",
        ),
      );
    }
    previousAttempt = scaffold.afterAttempt;

    if (scaffold.afterAttempt > step.attemptPolicy.maximumAttempts) {
      errors.push(
        semanticError(
          "MANIFEST",
          "SCAFFOLD_AFTER_MAXIMUM_ATTEMPTS",
          `${path}/afterAttempt`,
          "Scaffold afterAttempt exceeds the step maximumAttempts.",
        ),
      );
    }

    validateScaffold(step, scaffold, path, manifestIndexes, errors);
  });

  if (
    step.attemptPolicy.afterMaximum === "CONTINUE_ASSISTED" &&
    !hasDeterministicAssistedCompletion(step)
  ) {
    errors.push(
      semanticError(
        "MANIFEST",
        "ASSISTED_COMPLETION_NOT_DETERMINISTIC",
        `/steps/${stepIndex}/attemptPolicy/afterMaximum`,
        "CONTINUE_ASSISTED requires a recognition fallback or a final scaffold that exposes one accepted action.",
      ),
    );
  }
}

function validateScaffold(
  step: LessonStep,
  scaffold: Scaffold,
  path: string,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  switch (scaffold.kind) {
    case "REPLAY_AUDIO":
      if (step.stimulus.utterance?.audioAssetId === undefined) {
        errors.push(
          semanticError(
            "MANIFEST",
            "REPLAY_SCAFFOLD_WITHOUT_AUDIO",
            path,
            "REPLAY_AUDIO requires a stimulus audioAssetId.",
          ),
        );
      } else if (!step.stimulus.utterance.replayAllowed) {
        errors.push(
          semanticError(
            "MANIFEST",
            "REPLAY_NOT_ALLOWED",
            path,
            "REPLAY_AUDIO requires stimulus replayAllowed to be true.",
          ),
        );
      }
      break;
    case "SHOW_JAPANESE_TEXT":
      if (step.stimulus.utterance === undefined) {
        errors.push(
          semanticError(
            "MANIFEST",
            "TEXT_SCAFFOLD_WITHOUT_UTTERANCE",
            path,
            "SHOW_JAPANESE_TEXT requires a stimulus utterance.",
          ),
        );
      }
      break;
    case "HIGHLIGHT_OBJECTS":
      validateExistingObjects(
        scaffold.objectIds,
        `${path}/objectIds`,
        manifestIndexes,
        errors,
      );
      break;
    case "HIGHLIGHT_ENTITIES":
      scaffold.entityIds.forEach((entityId, index) => {
        if (!manifestIndexes.entities.has(entityId)) {
          pushUnknownReference(
            errors,
            "MANIFEST",
            "UNKNOWN_SCAFFOLD_ENTITY",
            `${path}/entityIds/${index}`,
            "entity",
            entityId,
          );
        }
      });
      break;
    case "REDUCE_OBJECT_CANDIDATES": {
      validateExistingObjects(
        scaffold.objectIds,
        `${path}/objectIds`,
        manifestIndexes,
        errors,
      );
      const candidates = objectCandidates(step);
      if (
        candidates === undefined ||
        !isSubset(candidates, scaffold.objectIds)
      ) {
        errors.push(
          semanticError(
            "MANIFEST",
            "INVALID_REDUCED_OBJECT_CANDIDATES",
            `${path}/objectIds`,
            "Reduced object candidates must be a subset of this interaction's candidates.",
          ),
        );
      }
      break;
    }
    case "REDUCE_CHOICE_CANDIDATES": {
      if (
        step.interaction.type !== "CHOOSE" ||
        !isSubset(
          step.interaction.options.map((option) => option.optionId),
          scaffold.optionIds,
        )
      ) {
        errors.push(
          semanticError(
            "MANIFEST",
            "INVALID_REDUCED_CHOICE_CANDIDATES",
            `${path}/optionIds`,
            "Reduced choice candidates must be a subset of this CHOOSE interaction's options.",
          ),
        );
      }
      break;
    }
    case "RECOGNITION_FALLBACK": {
      const fallback = manifestIndexes.steps.get(
        scaffold.fallbackStepId,
      )?.value;
      if (fallback === undefined) {
        pushUnknownReference(
          errors,
          "MANIFEST",
          "UNKNOWN_FALLBACK_STEP",
          `${path}/fallbackStepId`,
          "fallback step",
          scaffold.fallbackStepId,
        );
      } else if (
        INTERACTION_DIFFICULTY[fallback.interaction.type] >=
        INTERACTION_DIFFICULTY[step.interaction.type]
      ) {
        errors.push(
          semanticError(
            "MANIFEST",
            "FALLBACK_NOT_EASIER",
            `${path}/fallbackStepId`,
            `Fallback '${scaffold.fallbackStepId}' is not easier than '${step.stepId}'.`,
          ),
        );
      }
      break;
    }
    case "SHOW_READING":
    case "SHOW_MEANING":
    case "SHOW_PATTERN":
      break;
  }
}

function validateObjectCandidates(
  objectIds: readonly string[],
  interactionPath: string,
  requiredAffordance: "INTERACTIVE" | "PICK_UP" | "GIVE",
  catalogIndexes: CatalogIndexes,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  objectIds.forEach((objectId, objectIndex) => {
    const object = manifestIndexes.objects.get(objectId)?.value;
    const path = `${interactionPath}/candidateObjectIds/${objectIndex}`;
    if (object === undefined) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_OBJECT_REFERENCE",
        path,
        "object",
        objectId,
      );
      return;
    }

    if (!object.interactive) {
      errors.push(
        semanticError(
          "MANIFEST",
          "NON_INTERACTIVE_OBJECT_CANDIDATE",
          path,
          `Object '${objectId}' is not interactive.`,
        ),
      );
    }

    const catalogObject = catalogIndexes.objects.get(
      object.catalogObjectId,
    )?.value;
    if (
      catalogObject !== undefined &&
      !catalogObject.affordances.includes(requiredAffordance)
    ) {
      errors.push(
        semanticError(
          "MANIFEST",
          "MISSING_OBJECT_AFFORDANCE",
          path,
          `Object '${objectId}' lacks '${requiredAffordance}' affordance.`,
        ),
      );
    }
  });
}

function validateLocationCandidates(
  locationIds: readonly string[],
  interactionPath: string,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  locationIds.forEach((locationId, locationIndex) => {
    if (!manifestIndexes.locations.has(locationId)) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_LOCATION_REFERENCE",
        `${interactionPath}/candidateLocationIds/${locationIndex}`,
        "location",
        locationId,
      );
    }
  });
}

function validateExistingObjects(
  objectIds: readonly string[],
  path: string,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  objectIds.forEach((objectId, objectIndex) => {
    if (!manifestIndexes.objects.has(objectId)) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_SCAFFOLD_OBJECT",
        `${path}/${objectIndex}`,
        "object",
        objectId,
      );
    }
  });
}

function validateSubset(
  candidates: readonly string[],
  accepted: readonly string[],
  path: string,
  code: string,
  errors: BunbunValidationError[],
): void {
  if (!isSubset(candidates, accepted)) {
    errors.push(
      semanticError(
        "MANIFEST",
        code,
        path,
        "Accepted identifiers must be a subset of candidate identifiers.",
      ),
    );
  }
}

function objectCandidates(step: LessonStep): readonly string[] | undefined {
  switch (step.interaction.type) {
    case "CLICK_OBJECT":
    case "PICK_UP":
    case "GIVE":
      return step.interaction.candidateObjectIds;
    default:
      return undefined;
  }
}

function hasDeterministicAssistedCompletion(step: LessonStep): boolean {
  if (
    step.scaffolds.some((scaffold) => scaffold.kind === "RECOGNITION_FALLBACK")
  ) {
    return true;
  }

  for (const scaffold of step.scaffolds) {
    if (
      scaffold.kind === "REDUCE_OBJECT_CANDIDATES" &&
      scaffold.objectIds.length === 1
    ) {
      const accepted =
        step.interaction.type === "CLICK_OBJECT" ||
        step.interaction.type === "PICK_UP"
          ? step.interaction.acceptedObjectIds
          : undefined;
      if (accepted?.includes(scaffold.objectIds[0] ?? "") === true) {
        return true;
      }
    }

    if (
      scaffold.kind === "REDUCE_CHOICE_CANDIDATES" &&
      scaffold.optionIds.length === 1 &&
      step.interaction.type === "CHOOSE" &&
      step.interaction.acceptedOptionIds.includes(scaffold.optionIds[0] ?? "")
    ) {
      return true;
    }
  }

  if (step.scaffolds.length === 0) return false;

  switch (step.interaction.type) {
    case "LISTEN":
      return true;
    case "ARRANGE":
      return step.interaction.acceptedSequences.length === 1;
    case "TYPE": {
      const normalization = step.interaction.normalization;
      return (
        new Set(
          step.interaction.acceptedAnswers.map((answer) =>
            normalizeTypeAnswer(answer, normalization),
          ),
        ).size === 1
      );
    }
    case "MOVE_TO":
      return step.interaction.acceptedLocationIds.length === 1;
    case "CLICK_OBJECT":
    case "PICK_UP":
      return step.interaction.acceptedObjectIds.length === 1;
    case "CHOOSE":
      return step.interaction.acceptedOptionIds.length === 1;
    case "GIVE":
      return (
        new Set(
          step.interaction.acceptedPairs.map(
            (pair) => `${pair.objectId}\u0000${pair.recipientEntityId}`,
          ),
        ).size === 1
      );
  }
}

function validateQualityCounts(
  manifest: LessonManifest,
  errors: BunbunValidationError[],
): void {
  if (manifest.entities.length > manifest.quality.maximumNpcCount) {
    errors.push(
      semanticError(
        "MANIFEST",
        "ENTITY_COUNT_EXCEEDS_DECLARED_QUALITY",
        "/quality/maximumNpcCount",
        "Manifest entity count exceeds maximumNpcCount.",
      ),
    );
  }

  const interactiveObjectCount = manifest.objects.filter(
    (object) => object.interactive,
  ).length;
  if (interactiveObjectCount > manifest.quality.maximumInteractiveObjectCount) {
    errors.push(
      semanticError(
        "MANIFEST",
        "OBJECT_COUNT_EXCEEDS_DECLARED_QUALITY",
        "/quality/maximumInteractiveObjectCount",
        "Manifest interactive object count exceeds maximumInteractiveObjectCount.",
      ),
    );
  }
}
