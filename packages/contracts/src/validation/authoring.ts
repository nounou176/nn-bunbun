import {
  APPROVED_AUTHORING_PROMPT_PACK,
  type CoachingSlotInput,
  type LessonAuthoringRequest,
  type LessonAuthoringResult,
  type PracticeSlotInput,
} from "../schema/index.js";
import { normalizeTypeAnswer } from "../type-normalization.js";
import {
  type BunbunValidationError,
  type ValidationResult,
  semanticError,
  validationFailure,
  validationSuccess,
} from "./errors.js";

export interface ValidatedAuthoringExchange {
  request: LessonAuthoringRequest;
  result: LessonAuthoringResult;
}

export function validateLessonAuthoringExchange(
  request: LessonAuthoringRequest,
  result: LessonAuthoringResult,
  computedInputSha256: string,
): ValidationResult<ValidatedAuthoringExchange> {
  const errors: BunbunValidationError[] = [];

  validateRequestSemantics(request, computedInputSha256, errors);
  validateResultIdentity(request, result, errors);

  const { contributions } = result;
  for (const [name, contribution] of Object.entries(contributions)) {
    if (contribution.status === "CANNOT_COMPLY") {
      errors.push(
        authoringError(
          "MODULE_CANNOT_COMPLY",
          `/result/contributions/${name}`,
          `Module contribution '${name}' returned ${contribution.failureCode}.`,
        ),
      );
    }
  }

  if (contributions.story.status === "OK") {
    validateStory(request, contributions.story.value, errors);
  }
  if (contributions.reverseTraining.status === "OK") {
    validateReverseTraining(
      request,
      contributions.reverseTraining.value,
      errors,
    );
  }
  if (contributions.coaching.status === "OK") {
    validateCoaching(request, contributions.coaching.value, errors);
  }

  if (errors.length > 0) {
    return validationFailure(errors);
  }

  return validationSuccess({ request, result });
}

function validateRequestSemantics(
  request: LessonAuthoringRequest,
  computedInputSha256: string,
  errors: BunbunValidationError[],
): void {
  if (request.inputSha256 !== computedInputSha256) {
    errors.push(
      authoringError(
        "INPUT_SHA256_MISMATCH",
        "/request/inputSha256",
        "Request inputSha256 does not match the canonical input payload.",
      ),
    );
  }
  if (
    JSON.stringify(request.promptPack) !==
    JSON.stringify(APPROVED_AUTHORING_PROMPT_PACK)
  ) {
    errors.push(
      authoringError(
        "UNAPPROVED_PROMPT_PACK",
        "/request/promptPack",
        "Request promptPack does not match the approved module order, versions, and hashes.",
      ),
    );
  }

  const targetIds = new Set<string>();
  request.input.normalizedTargets.forEach((target, index) => {
    addUniqueId(
      targetIds,
      target.targetId,
      `/request/input/normalizedTargets/${index}/targetId`,
      "DUPLICATE_TARGET_ID",
      errors,
    );
  });

  const claimIds = new Set<string>();
  const factIds = new Set<string>();
  request.input.worldFacts.forEach((fact, factIndex) => {
    addUniqueId(
      factIds,
      fact.factId,
      `/request/input/worldFacts/${factIndex}/factId`,
      "DUPLICATE_WORLD_FACT_ID",
      errors,
    );
    fact.allowedClaims.forEach((claim, claimIndex) => {
      addUniqueId(
        claimIds,
        claim.claimId,
        `/request/input/worldFacts/${factIndex}/allowedClaims/${claimIndex}/claimId`,
        "DUPLICATE_WORLD_CLAIM_ID",
        errors,
      );
    });
  });

  const beatIds = new Set<string>();
  request.input.storyBeats.forEach((beat, beatIndex) => {
    addUniqueId(
      beatIds,
      beat.beatId,
      `/request/input/storyBeats/${beatIndex}/beatId`,
      "DUPLICATE_STORY_BEAT_ID",
      errors,
    );
    validateKnownIds(
      beat.requiredTargetIds,
      targetIds,
      `/request/input/storyBeats/${beatIndex}/requiredTargetIds`,
      "UNKNOWN_TARGET_REFERENCE",
      errors,
    );
    validateKnownIds(
      beat.allowedWorldClaimIds,
      claimIds,
      `/request/input/storyBeats/${beatIndex}/allowedWorldClaimIds`,
      "UNKNOWN_WORLD_CLAIM_REFERENCE",
      errors,
    );
  });

  const practiceSlotIds = new Set<string>();
  request.input.practiceSlots.forEach((slot, slotIndex) => {
    addUniqueId(
      practiceSlotIds,
      slot.slotId,
      `/request/input/practiceSlots/${slotIndex}/slotId`,
      "DUPLICATE_PRACTICE_SLOT_ID",
      errors,
    );
    validateKnownId(
      slot.beatId,
      beatIds,
      `/request/input/practiceSlots/${slotIndex}/beatId`,
      "UNKNOWN_STORY_BEAT_REFERENCE",
      errors,
    );
    validateKnownIds(
      slot.targetIds,
      targetIds,
      `/request/input/practiceSlots/${slotIndex}/targetIds`,
      "UNKNOWN_TARGET_REFERENCE",
      errors,
    );
    slot.acceptedCandidateIds.forEach((candidateId, candidateIndex) => {
      if (!slot.candidateIds.includes(candidateId)) {
        errors.push(
          authoringError(
            "ACCEPTED_CANDIDATE_NOT_AVAILABLE",
            `/request/input/practiceSlots/${slotIndex}/acceptedCandidateIds/${candidateIndex}`,
            `Accepted candidate '${candidateId}' is absent from candidateIds.`,
          ),
        );
      }
    });
  });

  const coachingStepIds = new Set<string>();
  request.input.coachingSlots.forEach((slot, slotIndex) => {
    addUniqueId(
      coachingStepIds,
      slot.stepId,
      `/request/input/coachingSlots/${slotIndex}/stepId`,
      "DUPLICATE_COACHING_STEP_ID",
      errors,
    );
    validateKnownIds(
      slot.targetIds,
      targetIds,
      `/request/input/coachingSlots/${slotIndex}/targetIds`,
      "UNKNOWN_TARGET_REFERENCE",
      errors,
    );
    const scaffoldIds = new Set<string>();
    slot.scaffoldSlots.forEach((scaffold, scaffoldIndex) => {
      addUniqueId(
        scaffoldIds,
        scaffold.scaffoldSlotId,
        `/request/input/coachingSlots/${slotIndex}/scaffoldSlots/${scaffoldIndex}/scaffoldSlotId`,
        "DUPLICATE_SCAFFOLD_SLOT_ID",
        errors,
      );
    });
  });
}

function validateResultIdentity(
  request: LessonAuthoringRequest,
  result: LessonAuthoringResult,
  errors: BunbunValidationError[],
): void {
  if (result.requestId !== request.requestId) {
    errors.push(
      authoringError(
        "REQUEST_ID_MISMATCH",
        "/result/requestId",
        "Result requestId does not match the request.",
      ),
    );
  }
  if (result.inputSha256 !== request.inputSha256) {
    errors.push(
      authoringError(
        "RESULT_INPUT_SHA256_MISMATCH",
        "/result/inputSha256",
        "Result inputSha256 does not match the request.",
      ),
    );
  }
  if (
    JSON.stringify(result.promptPack) !== JSON.stringify(request.promptPack)
  ) {
    errors.push(
      authoringError(
        "PROMPT_PACK_MISMATCH",
        "/result/promptPack",
        "Result promptPack does not match the request.",
      ),
    );
  }
}

function validateStory(
  request: LessonAuthoringRequest,
  story: NonNullable<
    Extract<
      LessonAuthoringResult["contributions"]["story"],
      { status: "OK" }
    >["value"]
  >,
  errors: BunbunValidationError[],
): void {
  validateOrderedIds(
    request.input.storyBeats.map((beat) => beat.beatId),
    story.beats.map((beat) => beat.beatId),
    "/result/contributions/story/value/beats",
    "STORY_BEAT_COVERAGE_MISMATCH",
    errors,
  );

  validateLocalizedLimit(
    story.title,
    request.outputLimits.title,
    "/result/contributions/story/value/title",
    errors,
  );
  validateLocalizedLimit(
    story.objective,
    request.outputLimits.objective,
    "/result/contributions/story/value/objective",
    errors,
  );
  validateLocalizedLimit(
    story.premise,
    request.outputLimits.premise,
    "/result/contributions/story/value/premise",
    errors,
  );
  validateLocalizedLimit(
    story.settingContext,
    request.outputLimits.settingContext,
    "/result/contributions/story/value/settingContext",
    errors,
  );
  validateTextLimit(
    story.synopsis,
    request.outputLimits.synopsisMaxCharacters,
    "/result/contributions/story/value/synopsis",
    errors,
  );

  story.beats.forEach((beat, index) => {
    const plannedBeat = request.input.storyBeats[index];
    if (plannedBeat === undefined || beat.beatId !== plannedBeat.beatId) {
      return;
    }
    beat.usedWorldClaimIds.forEach((claimId, claimIndex) => {
      if (!plannedBeat.allowedWorldClaimIds.includes(claimId)) {
        errors.push(
          authoringError(
            "WORLD_CLAIM_NOT_ALLOWED_FOR_BEAT",
            `/result/contributions/story/value/beats/${index}/usedWorldClaimIds/${claimIndex}`,
            `World claim '${claimId}' is not allowed for beat '${beat.beatId}'.`,
          ),
        );
      }
    });
    validateTextLimit(
      beat.context.ja,
      plannedBeat.maxJapaneseCharacters,
      `/result/contributions/story/value/beats/${index}/context/ja`,
      errors,
    );
    validateTextLimit(
      beat.context.vi,
      plannedBeat.maxVietnameseCharacters,
      `/result/contributions/story/value/beats/${index}/context/vi`,
      errors,
    );
  });

  validatePlainTextTree(story, "/result/contributions/story/value", errors);
}

function validateReverseTraining(
  request: LessonAuthoringRequest,
  reverseTraining: NonNullable<
    Extract<
      LessonAuthoringResult["contributions"]["reverseTraining"],
      { status: "OK" }
    >["value"]
  >,
  errors: BunbunValidationError[],
): void {
  validateOrderedIds(
    request.input.normalizedTargets.map((target) => target.targetId),
    reverseTraining.targetAnalysis.map((analysis) => analysis.targetId),
    "/result/contributions/reverseTraining/value/targetAnalysis",
    "TARGET_ANALYSIS_COVERAGE_MISMATCH",
    errors,
  );
  validateOrderedIds(
    request.input.practiceSlots.map((slot) => slot.slotId),
    reverseTraining.practiceItems.map((item) => item.slotId),
    "/result/contributions/reverseTraining/value/practiceItems",
    "PRACTICE_SLOT_COVERAGE_MISMATCH",
    errors,
  );

  reverseTraining.practiceItems.forEach((item, index) => {
    const slot = request.input.practiceSlots[index];
    if (slot === undefined || item.slotId !== slot.slotId) {
      return;
    }
    validatePracticeItem(slot, item, index, errors);
  });

  validatePlainTextTree(
    reverseTraining,
    "/result/contributions/reverseTraining/value",
    errors,
  );
}

function validatePracticeItem(
  slot: PracticeSlotInput,
  item: Extract<
    LessonAuthoringResult["contributions"]["reverseTraining"],
    { status: "OK" }
  >["value"]["practiceItems"][number],
  index: number,
  errors: BunbunValidationError[],
): void {
  const path = `/result/contributions/reverseTraining/value/practiceItems/${index}`;
  const authoredTexts = [
    item.stimulusJa,
    ...item.acceptedResponsesJa,
    ...item.arrangeSegmentsJa,
    ...item.distractorsJa,
  ];
  authoredTexts.forEach((text, textIndex) => {
    validateTextLimit(
      text,
      slot.maxJapaneseCharacters,
      `${path}/authoredText/${textIndex}`,
      errors,
    );
  });

  validatePermittedArray(
    slot.permitsAcceptedText,
    item.acceptedResponsesJa,
    `${path}/acceptedResponsesJa`,
    "ACCEPTED_TEXT_NOT_PERMITTED",
    errors,
  );
  validatePermittedArray(
    slot.permitsArrangeSegments,
    item.arrangeSegmentsJa,
    `${path}/arrangeSegmentsJa`,
    "ARRANGE_SEGMENTS_NOT_PERMITTED",
    errors,
  );
  validatePermittedArray(
    slot.permitsDistractors,
    item.distractorsJa,
    `${path}/distractorsJa`,
    "DISTRACTORS_NOT_PERMITTED",
    errors,
  );

  if (
    (slot.primitive === "TYPE" || slot.primitive === "ARRANGE") &&
    item.acceptedResponsesJa.length === 0
  ) {
    errors.push(
      authoringError(
        "ACCEPTED_TEXT_REQUIRED",
        `${path}/acceptedResponsesJa`,
        `${slot.primitive} requires at least one accepted Japanese response.`,
      ),
    );
  }

  if (slot.primitive === "ARRANGE") {
    if (item.arrangeSegmentsJa.length === 0) {
      errors.push(
        authoringError(
          "ARRANGE_SEGMENTS_REQUIRED",
          `${path}/arrangeSegmentsJa`,
          "ARRANGE requires at least one authored segment.",
        ),
      );
    } else if (
      !item.acceptedResponsesJa.includes(item.arrangeSegmentsJa.join(""))
    ) {
      errors.push(
        authoringError(
          "ARRANGE_RECONSTRUCTION_MISMATCH",
          `${path}/arrangeSegmentsJa`,
          "Ordered ARRANGE segments do not reconstruct an accepted response exactly.",
        ),
      );
    }
  }

  const normalizedAccepted = new Set(
    item.acceptedResponsesJa.map((value) =>
      normalizeTypeAnswer(value, [...slot.normalizationRules]),
    ),
  );
  item.distractorsJa.forEach((distractor, distractorIndex) => {
    const normalized = normalizeTypeAnswer(distractor, [
      ...slot.normalizationRules,
    ]);
    if (normalizedAccepted.has(normalized)) {
      errors.push(
        authoringError(
          "DISTRACTOR_COLLIDES_WITH_ACCEPTED_TEXT",
          `${path}/distractorsJa/${distractorIndex}`,
          "Distractor normalizes to an accepted Japanese response.",
        ),
      );
    }
  });
}

function validateCoaching(
  request: LessonAuthoringRequest,
  coaching: NonNullable<
    Extract<
      LessonAuthoringResult["contributions"]["coaching"],
      { status: "OK" }
    >["value"]
  >,
  errors: BunbunValidationError[],
): void {
  validateOrderedIds(
    request.input.coachingSlots.map((slot) => slot.stepId),
    coaching.steps.map((step) => step.stepId),
    "/result/contributions/coaching/value/steps",
    "COACHING_STEP_COVERAGE_MISMATCH",
    errors,
  );

  coaching.steps.forEach((step, index) => {
    const slot = request.input.coachingSlots[index];
    if (slot === undefined || step.stepId !== slot.stepId) {
      return;
    }
    validateCoachingStep(request, slot, step, index, errors);
  });

  validatePlainTextTree(
    coaching,
    "/result/contributions/coaching/value",
    errors,
  );
}

function validateCoachingStep(
  request: LessonAuthoringRequest,
  slot: CoachingSlotInput,
  step: Extract<
    LessonAuthoringResult["contributions"]["coaching"],
    { status: "OK" }
  >["value"]["steps"][number],
  index: number,
  errors: BunbunValidationError[],
): void {
  const path = `/result/contributions/coaching/value/steps/${index}`;
  validateTextLimit(
    step.instructionJa,
    slot.maxInstructionJapaneseCharacters,
    `${path}/instructionJa`,
    errors,
  );
  validateNullableTextLimit(
    step.instructionVi,
    slot.maxInstructionVietnameseCharacters,
    `${path}/instructionVi`,
    errors,
  );
  validateTextLimit(
    step.hintJa,
    slot.maxInstructionJapaneseCharacters,
    `${path}/hintJa`,
    errors,
  );
  validateNullableTextLimit(
    step.hintVi,
    slot.maxInstructionVietnameseCharacters,
    `${path}/hintVi`,
    errors,
  );
  if (
    !slot.permitsInstructionSupport &&
    (step.instructionVi !== null || step.hintVi !== null)
  ) {
    errors.push(
      authoringError(
        "INSTRUCTION_SUPPORT_NOT_PERMITTED",
        path,
        "Vietnamese instruction or hint text is not permitted for this step.",
      ),
    );
  }

  for (const [outcome, feedback] of [
    ["correct", step.correct],
    ["incorrect", step.incorrect],
    ["assisted", step.assisted],
  ] as const) {
    validateTextLimit(
      feedback.textJa,
      slot.maxFeedbackJapaneseCharacters,
      `${path}/${outcome}/textJa`,
      errors,
    );
    validateNullableTextLimit(
      feedback.textVi,
      slot.maxFeedbackVietnameseCharacters,
      `${path}/${outcome}/textVi`,
      errors,
    );
  }

  validateOrderedIds(
    slot.scaffoldSlots.map((scaffold) => scaffold.scaffoldSlotId),
    step.scaffoldCopy.map((copy) => copy.scaffoldSlotId),
    `${path}/scaffoldCopy`,
    "SCAFFOLD_SLOT_COVERAGE_MISMATCH",
    errors,
  );
  step.scaffoldCopy.forEach((copy, scaffoldIndex) => {
    const scaffold = slot.scaffoldSlots[scaffoldIndex];
    if (
      scaffold === undefined ||
      copy.scaffoldSlotId !== scaffold.scaffoldSlotId
    ) {
      return;
    }
    validateNullableTextLimit(
      copy.textJa,
      scaffold.maxJapaneseCharacters,
      `${path}/scaffoldCopy/${scaffoldIndex}/textJa`,
      errors,
    );
    validateNullableTextLimit(
      copy.textVi,
      scaffold.maxVietnameseCharacters,
      `${path}/scaffoldCopy/${scaffoldIndex}/textVi`,
      errors,
    );
    if (!scaffold.permitsJapaneseText && copy.textJa !== null) {
      errors.push(
        authoringError(
          "SCAFFOLD_JAPANESE_TEXT_NOT_PERMITTED",
          `${path}/scaffoldCopy/${scaffoldIndex}/textJa`,
          "Japanese scaffold text is not permitted for this slot.",
        ),
      );
    }
    if (!scaffold.permitsVietnameseText && copy.textVi !== null) {
      errors.push(
        authoringError(
          "SCAFFOLD_VIETNAMESE_TEXT_NOT_PERMITTED",
          `${path}/scaffoldCopy/${scaffoldIndex}/textVi`,
          "Vietnamese scaffold text is not permitted for this slot.",
        ),
      );
    }
    if (scaffold.revealLevel !== "DIRECT") {
      validateNoAnswerLeak(
        request,
        slot,
        [copy.textJa, copy.textVi],
        `${path}/scaffoldCopy/${scaffoldIndex}`,
        errors,
      );
    }
  });

  validateNoAnswerLeak(
    request,
    slot,
    [step.hintJa, step.hintVi],
    `${path}/hint`,
    errors,
  );
}

function validateNoAnswerLeak(
  request: LessonAuthoringRequest,
  slot: CoachingSlotInput,
  texts: readonly (string | null)[],
  path: string,
  errors: BunbunValidationError[],
): void {
  const forbidden = request.input.normalizedTargets
    .filter((target) => slot.targetIds.includes(target.targetId))
    .flatMap((target) => [
      target.writtenForm,
      target.reading,
      target.grammarPattern,
      ...target.supportGlossesVi,
    ])
    .filter((value): value is string => value !== null)
    .map(normalizeLeakText)
    .filter((value) => value.length >= 2);

  for (const text of texts) {
    if (text === null) {
      continue;
    }
    const normalizedText = normalizeLeakText(text);
    const leaked = forbidden.find((value) => normalizedText.includes(value));
    if (leaked !== undefined) {
      errors.push(
        authoringError(
          "EARLY_ANSWER_LEAK",
          path,
          "Hint or non-direct scaffold contains a supplied target form or gloss.",
        ),
      );
      return;
    }
  }
}

function normalizeLeakText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("vi").replaceAll(/\s+/g, "");
}

function validateLocalizedLimit(
  value: { ja: string; vi: string },
  limits: {
    maxJapaneseCharacters: number;
    maxVietnameseCharacters: number;
  },
  path: string,
  errors: BunbunValidationError[],
): void {
  validateTextLimit(
    value.ja,
    limits.maxJapaneseCharacters,
    `${path}/ja`,
    errors,
  );
  validateTextLimit(
    value.vi,
    limits.maxVietnameseCharacters,
    `${path}/vi`,
    errors,
  );
}

function validateNullableTextLimit(
  value: string | null,
  maximum: number,
  path: string,
  errors: BunbunValidationError[],
): void {
  if (value !== null) {
    validateTextLimit(value, maximum, path, errors);
  }
}

function validateTextLimit(
  value: string,
  maximum: number,
  path: string,
  errors: BunbunValidationError[],
): void {
  const length = Array.from(value).length;
  if (length > maximum) {
    errors.push(
      authoringError(
        "TEXT_BUDGET_EXCEEDED",
        path,
        `Text uses ${length} Unicode code points; maximum is ${maximum}.`,
      ),
    );
  }
}

function validatePlainTextTree(
  value: unknown,
  path: string,
  errors: BunbunValidationError[],
): void {
  if (typeof value === "string") {
    if (
      /https?:\/\//iu.test(value) ||
      /```/u.test(value) ||
      /<[^>]+>/u.test(value) ||
      hasDisallowedControlCharacter(value)
    ) {
      errors.push(
        authoringError(
          "UNSAFE_AUTHORED_TEXT",
          path,
          "Authored content must be plain text without URLs, markup, or control characters.",
        ),
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      validatePlainTextTree(item, `${path}/${index}`, errors),
    );
    return;
  }
  if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, item]) =>
      validatePlainTextTree(item, `${path}/${key}`, errors),
    );
  }
}

function hasDisallowedControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint !== undefined &&
      (codePoint <= 8 ||
        codePoint === 11 ||
        codePoint === 12 ||
        (codePoint >= 14 && codePoint <= 31) ||
        codePoint === 127)
    );
  });
}

function validatePermittedArray(
  permitted: boolean,
  values: readonly string[],
  path: string,
  code: string,
  errors: BunbunValidationError[],
): void {
  if (!permitted && values.length > 0) {
    errors.push(
      authoringError(code, path, "The compiler-owned slot forbids this field."),
    );
  }
}

function validateOrderedIds(
  expected: readonly string[],
  actual: readonly string[],
  path: string,
  code: string,
  errors: BunbunValidationError[],
): void {
  if (
    expected.length !== actual.length ||
    expected.some((value, index) => actual[index] !== value)
  ) {
    errors.push(
      authoringError(
        code,
        path,
        `Expected ordered IDs [${expected.join(", ")}], received [${actual.join(", ")}].`,
      ),
    );
  }
}

function addUniqueId(
  ids: Set<string>,
  id: string,
  path: string,
  code: string,
  errors: BunbunValidationError[],
): void {
  if (ids.has(id)) {
    errors.push(authoringError(code, path, `Duplicate identifier '${id}'.`));
  } else {
    ids.add(id);
  }
}

function validateKnownIds(
  ids: readonly string[],
  known: Set<string>,
  basePath: string,
  code: string,
  errors: BunbunValidationError[],
): void {
  ids.forEach((id, index) =>
    validateKnownId(id, known, `${basePath}/${index}`, code, errors),
  );
}

function validateKnownId(
  id: string,
  known: Set<string>,
  path: string,
  code: string,
  errors: BunbunValidationError[],
): void {
  if (!known.has(id)) {
    errors.push(authoringError(code, path, `Unknown identifier '${id}'.`));
  }
}

function authoringError(
  code: string,
  path: string,
  message: string,
): BunbunValidationError {
  return semanticError("AUTHORING", code, path, message);
}
