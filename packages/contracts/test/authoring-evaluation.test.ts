import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  validateLessonAuthoringExchange,
  validateLessonAuthoringRequestStructure,
  type LessonAuthoringRequest,
  type LessonAuthoringResult,
} from "../src/index.js";
import { gradeAuthoringEvaluation } from "../scripts/authoring-evaluation-grader.js";
import {
  authoringEvaluationCases,
  type RunnableAuthoringEvaluationCase,
} from "../scripts/authoring-evaluation-suite.js";
import { sha256CanonicalJson } from "../scripts/authoring-tools.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryDirectory = resolve(packageDirectory, "../..");

test("evaluation suite covers every approved D-024 fixture ID exactly once", async () => {
  const approvedCases = (
    await Promise.all(
      ["story-sheet", "reverse-trainer", "story-coach"].map(async (name) => {
        const fixture = JSON.parse(
          await readFile(
            resolve(
              repositoryDirectory,
              `docs/ai-modules/evals/${name}-0.1.0.json`,
            ),
            "utf8",
          ),
        ) as {
          moduleId: string;
          cases: Array<{ id: string; category: string }>;
        };
        return fixture.cases.map((fixtureCase) => ({
          fixtureId: fixtureCase.id,
          moduleId: fixture.moduleId,
          category: fixtureCase.category,
        }));
      }),
    )
  ).flat();

  const implementedCases = authoringEvaluationCases.map((evaluationCase) => ({
    fixtureId: evaluationCase.fixtureId,
    moduleId: evaluationCase.moduleId,
    category: evaluationCase.category,
  }));

  assert.deepEqual(
    implementedCases.toSorted((left, right) =>
      left.fixtureId.localeCompare(right.fixtureId),
    ),
    approvedCases.toSorted((left, right) =>
      left.fixtureId.localeCompare(right.fixtureId),
    ),
  );
  assert.equal(
    new Set(implementedCases.map((item) => item.fixtureId)).size,
    15,
  );
});

test("suite exposes eleven runnable packets and four explicit contract gaps", () => {
  const runnable = authoringEvaluationCases.filter(
    (evaluationCase) => evaluationCase.execution === "RUNNABLE",
  );
  const gaps = authoringEvaluationCases.filter(
    (evaluationCase) => evaluationCase.execution === "CONTRACT_GAP",
  );

  assert.equal(runnable.length, 11);
  assert.equal(gaps.length, 4);
  assert.deepEqual(
    gaps.map((gap) => gap.fixtureId),
    [
      "reverse_trainer_natural_phrase_groups",
      "reverse_trainer_reverse_recall_type",
      "reverse_trainer_arrange_reconstruction",
      "story_coach_rejects_source_and_runtime_regression",
    ],
  );
});

test("every runnable evaluation packet passes request and exchange validation", () => {
  for (const evaluationCase of runnableCases()) {
    const requestStructure = validateLessonAuthoringRequestStructure(
      evaluationCase.request,
    );
    assert.equal(
      requestStructure.ok,
      true,
      `Request structure failed for ${evaluationCase.fixtureId}`,
    );
    const result = createSyntheticResult(evaluationCase.request);
    const exchange = validateLessonAuthoringExchange(
      evaluationCase.request,
      result,
      sha256CanonicalJson(evaluationCase.request.input),
    );
    assert.equal(
      exchange.ok,
      true,
      `Exchange failed for ${evaluationCase.fixtureId}`,
    );
    const grade = gradeAuthoringEvaluation(evaluationCase, result);
    assert.equal(
      grade.ok,
      true,
      `Fixture grader failed for ${evaluationCase.fixtureId}: ${
        grade.ok
          ? ""
          : grade.failures
              .map((failure) => `${failure.code} ${failure.message}`)
              .join("; ")
      }`,
    );
  }
});

test("fixed story target grader rejects target movement", () => {
  const evaluationCase = runnableCases().find(
    (candidate) =>
      candidate.fixtureId === "story_sheet_multiple_targets_fixed_beats",
  );
  assert.ok(evaluationCase);
  const result = structuredClone(
    createSyntheticResult(evaluationCase.request),
  ) as unknown as {
    contributions: {
      story: {
        status: string;
        value: {
          beats: Array<{
            beatId: string;
            context: { ja: string };
          }>;
        };
      };
    };
  };
  assert.equal(result.contributions.story.status, "OK");
  const opening = result.contributions.story.value.beats.find(
    (beat) => beat.beatId === "opening",
  );
  assert.ok(opening);
  opening.context.ja += "犬";

  const grade = gradeAuthoringEvaluation(evaluationCase, result);
  assert.equal(grade.ok, false);
  assert.ok(
    !grade.ok &&
      grade.failures.some(
        (failure) => failure.code === "TARGET_ASSIGNMENT_MOVED",
      ),
  );
});

function runnableCases(): RunnableAuthoringEvaluationCase[] {
  return authoringEvaluationCases.filter(
    (evaluationCase): evaluationCase is RunnableAuthoringEvaluationCase =>
      evaluationCase.execution === "RUNNABLE",
  );
}

function createSyntheticResult(
  request: LessonAuthoringRequest,
): LessonAuthoringResult {
  return {
    packetFormat: "bunbun_m7_v3_2_lesson_authoring_result",
    packetVersion: "0.1.0",
    requestId: request.requestId,
    inputSha256: request.inputSha256,
    promptPack: request.promptPack.map((module) => ({ ...module })),
    contributions: {
      story: {
        status: "OK",
        failureCode: null,
        value: {
          title: { ja: "公園の話", vi: "Câu chuyện trong công viên" },
          objective: {
            ja: "公園を見ましょう。",
            vi: "Hãy quan sát công viên.",
          },
          premise: {
            ja: "小さい公園にいます。",
            vi: "Bạn đang ở một công viên nhỏ.",
          },
          settingContext: {
            ja: "小さい公園です。",
            vi: "Bối cảnh là công viên nhỏ.",
          },
          synopsis: "A compact authored park fixture.",
          beats: request.input.storyBeats.map((plannedBeat) => ({
            beatId: plannedBeat.beatId,
            usedWorldClaimIds: [],
            context: {
              ja:
                plannedBeat.requiredTargetIds
                  .map((targetId) => targetText(request, targetId))
                  .join(" ") || "公園を見ます。",
              vi: "Một tình huống ngắn trong công viên.",
            },
          })),
        },
      },
      reverseTraining: {
        status: "OK",
        failureCode: null,
        value: {
          targetAnalysis: request.input.normalizedTargets.map((target) => ({
            targetId: target.targetId,
            segments: [
              {
                surfaceJa:
                  target.writtenForm ?? target.grammarPattern ?? "対象",
                readingKana: target.reading,
                meaningVi: target.supportGlossesVi[0] ?? "mục tiêu",
                functionVi: "nội dung mục tiêu đã được cung cấp",
              },
            ],
          })),
          practiceItems: request.input.practiceSlots.map((slot) => ({
            slotId: slot.slotId,
            stimulusJa: "まわりをよく見ましょう。",
            acceptedResponsesJa: [],
            arrangeSegmentsJa: [],
            distractorsJa: [],
          })),
        },
      },
      coaching: {
        status: "OK",
        failureCode: null,
        value: {
          steps: request.input.coachingSlots.map((slot) => ({
            stepId: slot.stepId,
            instructionJa: "まわりをよく見ましょう。",
            instructionVi: slot.permitsInstructionSupport
              ? "Hãy quan sát xung quanh."
              : null,
            hintJa: "近くをもう一度見ましょう。",
            hintVi: slot.permitsInstructionSupport
              ? "Hãy nhìn lại khu vực gần đó."
              : null,
            scaffoldCopy: slot.scaffoldSlots.map((scaffold) => ({
              scaffoldSlotId: scaffold.scaffoldSlotId,
              textJa: scaffold.permitsJapaneseText
                ? "意味を確認します。"
                : null,
              textVi: scaffold.permitsVietnameseText ? "Nghĩa là chó." : null,
            })),
            correct: {
              textJa: "正解です。次へ進みましょう。",
              textVi: "Đúng rồi. Hãy tiếp tục.",
            },
            incorrect: {
              textJa: "もう一度見てみましょう。",
              textVi: "Hãy thử lại một lần nữa.",
            },
            assisted: {
              textJa: "ヒントを使ってできました。",
              textVi: "Bạn đã hoàn thành với gợi ý hỗ trợ.",
            },
          })),
        },
      },
    },
  };
}

function targetText(request: LessonAuthoringRequest, targetId: string): string {
  const target = request.input.normalizedTargets.find(
    (candidate) => candidate.targetId === targetId,
  );
  const raw = target?.writtenForm ?? target?.grammarPattern ?? "";
  return raw.replaceAll(/[〜～]/gu, "");
}
