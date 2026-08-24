import {
  APPROVED_AUTHORING_PROMPT_PACK,
  AUTHORING_FIXTURE_DISCLOSURE_V2,
  type LessonAuthoringRequest,
  type LessonAuthoringRequestV2,
  type LessonAuthoringResult,
  type LessonAuthoringResultV2,
} from "../schema/index.js";
import { validateLessonAuthoringExchange } from "./authoring.js";
import {
  type BunbunValidationError,
  type ValidationResult,
  semanticError,
  validationFailure,
  validationSuccess,
} from "./errors.js";

export interface ValidatedAuthoringExchangeV2 {
  request: LessonAuthoringRequestV2;
  result: LessonAuthoringResultV2;
}

export function validateLessonAuthoringExchangeV2(
  request: LessonAuthoringRequestV2,
  result: LessonAuthoringResultV2,
  computedInputSha256: string,
): ValidationResult<ValidatedAuthoringExchangeV2> {
  const errors: BunbunValidationError[] = [];
  const v1Validation = validateLessonAuthoringExchange(
    toV1Request(request),
    toV1Result(result),
    computedInputSha256,
  );
  if (!v1Validation.ok) {
    errors.push(...v1Validation.errors);
  }

  validateRepairContext(request, errors);
  validatePracticeAuthority(request, result, errors);
  validateRuntimePlan(request, errors);

  return errors.length === 0
    ? validationSuccess({ request, result })
    : validationFailure(errors);
}

function validateRepairContext(
  request: LessonAuthoringRequestV2,
  errors: BunbunValidationError[],
): void {
  if (request.attempt === 1) {
    if (request.repair !== null) {
      errors.push(
        authoringV2Error(
          "REPAIR_NOT_ALLOWED_ON_INITIAL_ATTEMPT",
          "/request/repair",
          "Attempt 1 must not include repair context.",
        ),
      );
    }
    return;
  }

  const repair = request.repair;
  if (repair === null) {
    errors.push(
      authoringV2Error(
        "REPAIR_CONTEXT_REQUIRED",
        "/request/repair",
        "Attempt 2 requires one closed repair context.",
      ),
    );
    return;
  }

  if (repair.failureStage !== "SEMANTIC" && repair.priorResult !== null) {
    errors.push(
      authoringV2Error(
        "UNTRUSTED_PRIOR_RESULT_FORBIDDEN",
        "/request/repair/priorResult",
        "JSON parse and structural failures cannot carry an untrusted prior result.",
      ),
    );
  }
  if (repair.failureStage === "SEMANTIC" && repair.priorResult === null) {
    errors.push(
      authoringV2Error(
        "STRUCTURED_PRIOR_RESULT_REQUIRED",
        "/request/repair/priorResult",
        "Semantic repair requires the structurally valid prior result.",
      ),
    );
  }

  if (repair.priorResult !== null) {
    if (
      repair.priorResult.requestId !== request.requestId ||
      repair.priorResult.inputSha256 !== request.inputSha256 ||
      JSON.stringify(repair.priorResult.promptPack) !==
        JSON.stringify(request.promptPack)
    ) {
      errors.push(
        authoringV2Error(
          "REPAIR_PRIOR_IDENTITY_MISMATCH",
          "/request/repair/priorResult",
          "Prior result identity must match the repair request.",
        ),
      );
    }
  }

  const allowedSources =
    repair.failureStage === "SEMANTIC"
      ? new Set(["SEMANTIC", "NORMALIZATION", "RUNTIME_CAPABILITY"])
      : new Set([repair.failureStage]);
  const diagnosticIdentities = new Set<string>();
  repair.diagnostics.forEach((diagnostic, index) => {
    if (!allowedSources.has(diagnostic.source)) {
      errors.push(
        authoringV2Error(
          "REPAIR_DIAGNOSTIC_STAGE_MISMATCH",
          `/request/repair/diagnostics/${index}/source`,
          `Diagnostic source '${diagnostic.source}' is incompatible with failure stage '${repair.failureStage}'.`,
        ),
      );
    }
    const identity = `${diagnostic.source}\n${diagnostic.code}\n${diagnostic.path}`;
    if (diagnosticIdentities.has(identity)) {
      errors.push(
        authoringV2Error(
          "DUPLICATE_REPAIR_DIAGNOSTIC",
          `/request/repair/diagnostics/${index}`,
          "Repair diagnostics must have unique source, code, and path identities.",
        ),
      );
    }
    diagnosticIdentities.add(identity);
  });
}

function validatePracticeAuthority(
  request: LessonAuthoringRequestV2,
  result: LessonAuthoringResultV2,
  errors: BunbunValidationError[],
): void {
  const contribution = result.contributions.reverseTraining;
  if (contribution.status !== "OK") return;

  request.input.practiceSlots.forEach((slot, index) => {
    const path = `/request/input/practiceSlots/${index}`;
    validateCompilerOwnedText(
      slot.practiceTextJa,
      `${path}/practiceTextJa`,
      errors,
    );
    slot.acceptedResponsesJa.forEach((value, responseIndex) => {
      validateCompilerOwnedText(
        value,
        `${path}/acceptedResponsesJa/${responseIndex}`,
        errors,
      );
    });

    if (!slot.permitsAcceptedText && slot.acceptedResponsesJa.length > 0) {
      errors.push(
        authoringV2Error(
          "COMPILER_ACCEPTED_TEXT_NOT_PERMITTED",
          `${path}/acceptedResponsesJa`,
          "The compiler supplied accepted text for a slot that forbids it.",
        ),
      );
    }
    if (
      (slot.primitive === "TYPE" || slot.primitive === "ARRANGE") &&
      slot.acceptedResponsesJa.length === 0
    ) {
      errors.push(
        authoringV2Error(
          "COMPILER_ACCEPTED_TEXT_REQUIRED",
          `${path}/acceptedResponsesJa`,
          `${slot.primitive} requires compiler-owned Japanese answer truth.`,
        ),
      );
    }

    const item = contribution.value.practiceItems[index];
    if (item === undefined || item.slotId !== slot.slotId) return;
    if (
      JSON.stringify(item.acceptedResponsesJa) !==
      JSON.stringify(slot.acceptedResponsesJa)
    ) {
      errors.push(
        authoringV2Error(
          "ACCEPTED_RESPONSE_TRUTH_MUTATED",
          `/result/contributions/reverseTraining/value/practiceItems/${index}/acceptedResponsesJa`,
          "Returned accepted responses must exactly echo compiler-owned answer truth in order.",
        ),
      );
    }
  });
}

function validateRuntimePlan(
  request: LessonAuthoringRequestV2,
  errors: BunbunValidationError[],
): void {
  const practiceByStep = new Map(
    request.input.practiceSlots.map((slot) => [slot.stepId, slot] as const),
  );
  request.input.coachingSlots.forEach((slot, index) => {
    const matchingPractice = practiceByStep.get(slot.stepId);
    if (
      matchingPractice !== undefined &&
      matchingPractice.primitive !== slot.primitive
    ) {
      errors.push(
        authoringV2Error(
          "COACHING_PRIMITIVE_MISMATCH",
          `/request/input/coachingSlots/${index}/primitive`,
          "Coaching primitive must match the compiler-owned practice slot for the same step.",
        ),
      );
    }
    slot.scaffoldSlots.forEach((scaffold, scaffoldIndex) => {
      if (scaffold.afterAttempt > slot.maximumAttempts) {
        errors.push(
          authoringV2Error(
            "SCAFFOLD_AFTER_MAXIMUM_ATTEMPTS",
            `/request/input/coachingSlots/${index}/scaffoldSlots/${scaffoldIndex}/afterAttempt`,
            "Scaffold activation cannot exceed the compiler-owned maximum attempt count.",
          ),
        );
      }
    });
  });
}

function validateCompilerOwnedText(
  value: string,
  path: string,
  errors: BunbunValidationError[],
): void {
  if (
    /https?:\/\//iu.test(value) ||
    /```/u.test(value) ||
    /<[^>]+>/u.test(value) ||
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint !== undefined &&
        (codePoint <= 8 ||
          codePoint === 11 ||
          codePoint === 12 ||
          (codePoint >= 14 && codePoint <= 31) ||
          codePoint === 127)
      );
    })
  ) {
    errors.push(
      authoringV2Error(
        "UNSAFE_COMPILER_TEXT",
        path,
        "Compiler-owned practice text must be plain text without URLs, markup, or control characters.",
      ),
    );
  }
}

function toV1Request(
  request: LessonAuthoringRequestV2,
): LessonAuthoringRequest {
  return {
    packetFormat: request.packetFormat,
    packetVersion: "0.1.0",
    requestId: request.requestId,
    fixtureId: request.requestContextId,
    attempt: request.attempt,
    mediaPolicy: request.mediaPolicy,
    responseFormat: request.responseFormat,
    inputHashCanonicalization: request.inputHashCanonicalization,
    inputSha256: request.inputSha256,
    promptPack: APPROVED_AUTHORING_PROMPT_PACK.map((module) => ({ ...module })),
    dataPolicy: {
      classification: "AUTHORED_FIXTURE",
      containsLearnerData: false,
      disclosure: AUTHORING_FIXTURE_DISCLOSURE_V2,
    },
    outputLimits: request.outputLimits,
    input: {
      ...request.input,
      contractVersion: "0.1.0",
      practiceSlots: request.input.practiceSlots.map((slot) => {
        const { practiceTextJa, acceptedResponsesJa, ...v1Slot } = slot;
        void practiceTextJa;
        void acceptedResponsesJa;
        return v1Slot;
      }),
      coachingSlots: request.input.coachingSlots.map((slot) => {
        const { primitive, maximumAttempts, feedbackDisplayMs, ...v1Slot } =
          slot;
        void primitive;
        void maximumAttempts;
        void feedbackDisplayMs;
        return v1Slot;
      }),
    },
  };
}

function toV1Result(result: LessonAuthoringResultV2): LessonAuthoringResult {
  return {
    ...result,
    packetVersion: "0.1.0",
  };
}

function authoringV2Error(
  code: string,
  path: string,
  message: string,
): BunbunValidationError {
  return semanticError("AUTHORING", code, path, message);
}
