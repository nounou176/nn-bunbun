import assert from "node:assert/strict";
import test from "node:test";

import {
  validateLessonAuthoringExchangeV2,
  validateLessonAuthoringRequestV2Structure,
  validateLessonAuthoringResultV2Structure,
  type LessonAuthoringRequestV2,
} from "../src/index.js";
import { authoringEvaluationCasesV2 } from "../scripts/authoring-evaluation-suite-v2.js";
import {
  createSyntheticAuthoringResultV2,
  gradeAuthoringEvaluationV2,
} from "../scripts/authoring-evaluation-v2.js";
import {
  validAuthoringRequestV2,
  validAuthoringResultV2,
} from "../scripts/authoring-fixtures-v2.js";
import { sha256CanonicalJson } from "../scripts/authoring-tools.js";

test("authoring 0.2.0 valid exchange preserves compiler-owned truth", () => {
  const validation = validateLessonAuthoringExchangeV2(
    structuredClone(validAuthoringRequestV2),
    structuredClone(validAuthoringResultV2),
    sha256CanonicalJson(validAuthoringRequestV2.input),
  );

  assert.equal(validation.ok, true);
});

test("authoring 0.2.0 makes all fifteen D-024 cases runnable", () => {
  assert.equal(authoringEvaluationCasesV2.length, 15);
  assert.ok(
    authoringEvaluationCasesV2.every(
      (evaluationCase) => evaluationCase.execution === "RUNNABLE",
    ),
  );

  for (const evaluationCase of authoringEvaluationCasesV2) {
    const requestStructure = validateLessonAuthoringRequestV2Structure(
      evaluationCase.request,
    );
    assert.equal(
      requestStructure.ok,
      true,
      `Request structure failed for ${evaluationCase.fixtureId}`,
    );
    const result = createSyntheticAuthoringResultV2(evaluationCase);
    const grade = gradeAuthoringEvaluationV2(evaluationCase, result);
    assert.equal(
      grade.ok,
      true,
      `Fixture failed for ${evaluationCase.fixtureId}: ${
        grade.ok
          ? ""
          : grade.failures
              .map((failure) => `${failure.code} ${failure.message}`)
              .join("; ")
      }`,
    );
  }
});

test("authoring 0.2.0 rejects mutation of compiler-owned accepted responses", () => {
  const result = structuredClone(validAuthoringResultV2);
  if (result.contributions.reverseTraining.status !== "OK") {
    throw new Error("Expected an OK reverse-training fixture.");
  }
  result.contributions.reverseTraining.value.practiceItems[0]!.acceptedResponsesJa =
    ["猫を探してください。"];

  const validation = validateLessonAuthoringExchangeV2(
    validAuthoringRequestV2,
    result,
    sha256CanonicalJson(validAuthoringRequestV2.input),
  );
  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some(
        (error) => error.code === "ACCEPTED_RESPONSE_TRUTH_MUTATED",
      ),
  );
});

test("authoring 0.2.0 requires a closed repair context only on attempt 2", () => {
  const initialWithRepair = {
    ...structuredClone(validAuthoringRequestV2),
    repair: jsonParseRepair(),
  } satisfies LessonAuthoringRequestV2;
  const initialValidation = validateLessonAuthoringExchangeV2(
    initialWithRepair,
    validAuthoringResultV2,
    sha256CanonicalJson(initialWithRepair.input),
  );
  assert.equal(initialValidation.ok, false);
  assert.ok(
    !initialValidation.ok &&
      initialValidation.errors.some(
        (error) => error.code === "REPAIR_NOT_ALLOWED_ON_INITIAL_ATTEMPT",
      ),
  );

  const repairWithoutContext = {
    ...structuredClone(validAuthoringRequestV2),
    attempt: 2,
  } satisfies LessonAuthoringRequestV2;
  const missingValidation = validateLessonAuthoringExchangeV2(
    repairWithoutContext,
    validAuthoringResultV2,
    sha256CanonicalJson(repairWithoutContext.input),
  );
  assert.equal(missingValidation.ok, false);
  assert.ok(
    !missingValidation.ok &&
      missingValidation.errors.some(
        (error) => error.code === "REPAIR_CONTEXT_REQUIRED",
      ),
  );
});

test("authoring 0.2.0 accepts parse and semantic repair shapes", () => {
  const parseRepair = {
    ...structuredClone(validAuthoringRequestV2),
    attempt: 2,
    repair: jsonParseRepair(),
  } satisfies LessonAuthoringRequestV2;
  assertValidRepair(parseRepair);

  const semanticRepair = {
    ...structuredClone(validAuthoringRequestV2),
    attempt: 2,
    repair: {
      failureStage: "SEMANTIC",
      priorResponseSha256: "b".repeat(64),
      priorResult: structuredClone(validAuthoringResultV2),
      diagnostics: [
        {
          source: "SEMANTIC",
          code: "ACCEPTED_RESPONSE_TRUTH_MUTATED",
          path: "/result/contributions/reverseTraining/value/practiceItems/0/acceptedResponsesJa",
          message: "Returned accepted responses did not match compiler truth.",
        },
      ],
    },
  } satisfies LessonAuthoringRequestV2;
  assertValidRepair(semanticRepair);
});

test("authoring 0.2.0 supports the explicit learner-target disclosure variant", () => {
  const request = structuredClone(validAuthoringRequestV2) as unknown as Record<
    string,
    unknown
  >;
  request.dataPolicy = {
    classification: "LEARNER_TARGETS",
    containsLearnerData: true,
    disclosure:
      "This request sends only the normalized Japanese targets and compact authoring facts shown here to ChatGPT or Codex after export. It contains no learner identity, progress, evidence, TYPE response, checkpoint, secret, or private chat history.",
  };
  assert.equal(validateLessonAuthoringRequestV2Structure(request).ok, true);
});

test("authoring 0.2.0 result rejects the 0.1.0 packet identity", () => {
  const result = structuredClone(validAuthoringResultV2) as unknown as Record<
    string,
    unknown
  >;
  result.packetVersion = "0.1.0";
  assert.equal(validateLessonAuthoringResultV2Structure(result).ok, false);
});

function assertValidRepair(request: LessonAuthoringRequestV2): void {
  const validation = validateLessonAuthoringExchangeV2(
    request,
    validAuthoringResultV2,
    sha256CanonicalJson(request.input),
  );
  assert.equal(
    validation.ok,
    true,
    validation.ok
      ? undefined
      : validation.errors
          .map((error) => `${error.code} ${error.path}`)
          .join("; "),
  );
}

function jsonParseRepair(): NonNullable<LessonAuthoringRequestV2["repair"]> {
  return {
    failureStage: "JSON_PARSE",
    priorResponseSha256: "a".repeat(64),
    priorResult: null,
    diagnostics: [
      {
        source: "JSON_PARSE",
        code: "RESULT_JSON_PARSE_ERROR",
        path: "/result",
        message: "File must contain exactly one valid JSON object.",
      },
    ],
  };
}
