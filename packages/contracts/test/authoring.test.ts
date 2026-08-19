import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  validateLessonAuthoringExchange,
  validateLessonAuthoringRequestStructure,
  validateLessonAuthoringResultStructure,
  type LessonAuthoringRequest,
  type LessonAuthoringResult,
} from "../src/index.js";
import {
  parseStrictJson,
  sha256CanonicalJson,
} from "../scripts/authoring-tools.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDirectory = resolve(packageDirectory, "fixtures/authoring");

test("valid composed authoring exchange passes structural and semantic validation", async () => {
  const { request, result } = await readValidExchange();
  const validation = validateLessonAuthoringExchange(
    request,
    result,
    sha256CanonicalJson(request.input),
  );

  assert.equal(validation.ok, true);
  if (validation.ok) {
    assert.equal(
      validation.value.request.requestId,
      "m7_v3_2_lesson_authoring_001",
    );
  }
});

test("request rejects prohibited learner data as an unknown field", async () => {
  const input = await readJson("invalid-request-prohibited-data.json");
  const validation = validateLessonAuthoringRequestStructure(input);

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some(
        (error) =>
          error.code === "STRUCTURAL_ADDITIONAL_PROPERTIES" &&
          error.path === "/input/learnerIdentity",
      ),
  );
});

test("request canonical input hash mismatch is rejected", async () => {
  const request = requireValidRequest(
    await readJson("invalid-request-wrong-hash.json"),
  );
  const result = requireValidResult(await readJson("valid-result.json"));
  const validation = validateLessonAuthoringExchange(
    request,
    result,
    sha256CanonicalJson(request.input),
  );

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some((error) => error.code === "INPUT_SHA256_MISMATCH"),
  );
});

test("request rejects prompt version or hash drift", async () => {
  const input = await readJson("invalid-request-prompt-drift.json");
  const validation = validateLessonAuthoringRequestStructure(input);

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some((error) => error.path.includes("/promptPack/0")),
  );
});

test("result rejects an unknown top-level field", async () => {
  const input = await readJson("invalid-result-unknown-field.json");
  const validation = validateLessonAuthoringResultStructure(input);

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some(
        (error) =>
          error.code === "STRUCTURAL_ADDITIONAL_PROPERTIES" &&
          error.path === "/learnerIdentity",
      ),
  );
});

test("result identity mismatch is rejected with a stable diagnostic", async () => {
  const request = requireValidRequest(await readJson("valid-request.json"));
  const result = requireValidResult(
    await readJson("invalid-result-wrong-identity.json"),
  );
  const validation = validateLessonAuthoringExchange(
    request,
    result,
    sha256CanonicalJson(request.input),
  );

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some((error) => error.code === "REQUEST_ID_MISMATCH"),
  );
});

test("result text over a compiler budget is rejected", async () => {
  const request = requireValidRequest(await readJson("valid-request.json"));
  const result = requireValidResult(
    await readJson("invalid-result-oversized.json"),
  );
  const validation = validateLessonAuthoringExchange(
    request,
    result,
    sha256CanonicalJson(request.input),
  );

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some(
        (error) =>
          error.code === "TEXT_BUDGET_EXCEEDED" &&
          error.path.endsWith("/story/value/title/ja"),
      ),
  );
});

test("story beat rejects a world claim allowed only in another beat", async () => {
  const { request, result } = await readValidExchange();
  const story = requireOkStory(result.contributions.story);
  story.beats[0]?.usedWorldClaimIds.push("claim_guide_thanks");
  const validation = validateLessonAuthoringExchange(
    request,
    result,
    sha256CanonicalJson(request.input),
  );

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some(
        (error) => error.code === "WORLD_CLAIM_NOT_ALLOWED_FOR_BEAT",
      ),
  );
});

test("indirect coaching hint rejects a supplied answer gloss", async () => {
  const request = requireValidRequest(await readJson("valid-request.json"));
  const rawResult = asObject(await readJson("valid-result.json"));
  const contributions = asObject(rawResult.contributions);
  const coachingResult = asObject(contributions.coaching);
  const coachingValue = asObject(coachingResult.value);
  const steps = coachingValue.steps;
  assert.ok(Array.isArray(steps));
  asObject(steps[0]).hintVi = "Hãy nghĩ đến chú chó.";
  const result = requireValidResult(rawResult);
  const validation = validateLessonAuthoringExchange(
    request,
    result,
    sha256CanonicalJson(request.input),
  );

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some((error) => error.code === "EARLY_ANSWER_LEAK"),
  );
});

test("one module CANNOT_COMPLY fails the complete exchange", async () => {
  const request = requireValidRequest(await readJson("valid-request.json"));
  const rawResult = asObject(await readJson("valid-result.json"));
  asObject(rawResult.contributions).coaching = {
    status: "CANNOT_COMPLY",
    failureCode: "COACHING_BUDGET_CONFLICT",
    value: null,
  };
  const result = requireValidResult(rawResult);
  const validation = validateLessonAuthoringExchange(
    request,
    result,
    sha256CanonicalJson(request.input),
  );

  assert.equal(validation.ok, false);
  assert.ok(
    !validation.ok &&
      validation.errors.some((error) => error.code === "MODULE_CANNOT_COMPLY"),
  );
});

test("strict parser rejects non-JSON model output without extraction", async () => {
  const raw = await readFile(
    resolve(fixtureDirectory, "invalid-result-malformed.txt"),
    "utf8",
  );

  assert.throws(() => parseStrictJson(raw), SyntaxError);
});

async function readValidExchange(): Promise<{
  request: LessonAuthoringRequest;
  result: LessonAuthoringResult;
}> {
  return {
    request: requireValidRequest(await readJson("valid-request.json")),
    result: requireValidResult(await readJson("valid-result.json")),
  };
}

function requireValidRequest(input: unknown): LessonAuthoringRequest {
  const result = validateLessonAuthoringRequestStructure(input);
  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected a structurally valid authoring request fixture.");
  }
  return result.value;
}

function requireValidResult(input: unknown): LessonAuthoringResult {
  const result = validateLessonAuthoringResultStructure(input);
  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected a structurally valid authoring result fixture.");
  }
  return result.value;
}

function requireOkStory(
  contribution: LessonAuthoringResult["contributions"]["story"],
) {
  assert.equal(contribution.status, "OK");
  if (contribution.status !== "OK") {
    throw new Error("Expected an OK contribution.");
  }
  return contribution.value;
}

function asObject(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}

async function readJson(fileName: string): Promise<unknown> {
  return JSON.parse(
    await readFile(resolve(fixtureDirectory, fileName), "utf8"),
  ) as unknown;
}
