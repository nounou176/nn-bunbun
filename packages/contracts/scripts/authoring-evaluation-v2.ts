import {
  validateLessonAuthoringExchangeV2,
  validateLessonAuthoringResultV2Structure,
  type LessonAuthoringRequestV2,
  type LessonAuthoringResultV2,
} from "../src/index.js";
import {
  applyAuthoringFixtureChecks,
  type AuthoringEvaluationFailure,
} from "./authoring-evaluation-grader.js";
import type { RunnableAuthoringEvaluationCaseV2 } from "./authoring-evaluation-suite-v2.js";
import { sha256CanonicalJson } from "./authoring-tools.js";

export type AuthoringEvaluationGradeV2 =
  | { ok: true; result: LessonAuthoringResultV2 }
  | { ok: false; failures: AuthoringEvaluationFailure[] };

export function gradeAuthoringEvaluationV2(
  evaluationCase: RunnableAuthoringEvaluationCaseV2,
  rawResult: unknown,
): AuthoringEvaluationGradeV2 {
  const structure = validateLessonAuthoringResultV2Structure(rawResult);
  if (!structure.ok) {
    return {
      ok: false,
      failures: structure.errors.map((error) => ({
        code: error.code,
        message: `${error.path} ${error.message}`,
      })),
    };
  }

  const exchange = validateLessonAuthoringExchangeV2(
    evaluationCase.request,
    structure.value,
    sha256CanonicalJson(evaluationCase.request.input),
  );
  if (!exchange.ok) {
    return {
      ok: false,
      failures: exchange.errors.map((error) => ({
        code: error.code,
        message: `${error.path} ${error.message}`,
      })),
    };
  }

  const failures: AuthoringEvaluationFailure[] = [];
  applyAuthoringFixtureChecks(evaluationCase, structure.value, failures);
  return failures.length === 0
    ? { ok: true, result: structure.value }
    : { ok: false, failures };
}

export function createSyntheticAuthoringResultV2(
  evaluationCase: RunnableAuthoringEvaluationCaseV2,
): LessonAuthoringResultV2 {
  const { request, fixtureId } = evaluationCase;
  return {
    packetFormat: "bunbun_m7_v3_2_lesson_authoring_result",
    packetVersion: "0.2.0",
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
            ja: "公園でお願いを聞きます。",
            vi: "Hãy nghe lời nhờ trong công viên.",
          },
          premise: {
            ja: "小さい公園で探しものをします。",
            vi: "Bạn tìm một thứ trong công viên nhỏ.",
          },
          settingContext: {
            ja: "舞台は小さい公園です。",
            vi: "Bối cảnh là một công viên nhỏ.",
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
            segments:
              fixtureId === "reverse_trainer_natural_phrase_groups" &&
              target.targetId === "target_inu"
                ? [
                    {
                      surfaceJa: "犬を",
                      readingKana: "いぬを",
                      meaningVi: "chó (làm tân ngữ)",
                      functionVi: "cụm danh từ với trợ từ を",
                    },
                    {
                      surfaceJa: "探してください。",
                      readingKana: null,
                      meaningVi: "xin hãy tìm",
                      functionVi: "cụm yêu cầu lịch sự",
                    },
                  ]
                : [
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
            stimulusJa: slot.practiceTextJa,
            acceptedResponsesJa: [...slot.acceptedResponsesJa],
            arrangeSegmentsJa:
              slot.primitive === "ARRANGE"
                ? arrangeSegments(slot.acceptedResponsesJa[0])
                : [],
            distractorsJa: slot.permitsDistractors ? ["猫"] : [],
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
                ? scaffold.kind === "SHOW_PATTERN"
                  ? "〜てください"
                  : "意味を確認します。"
                : null,
              textVi: scaffold.permitsVietnameseText
                ? scaffold.kind === "SHOW_MEANING"
                  ? "Nghĩa trực tiếp là chó."
                  : "Hãy xem hỗ trợ trực tiếp."
                : null,
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

function targetText(
  request: LessonAuthoringRequestV2,
  targetId: string,
): string {
  const target = request.input.normalizedTargets.find(
    (candidate) => candidate.targetId === targetId,
  );
  const raw = target?.writtenForm ?? target?.grammarPattern ?? "";
  return raw.replace(/^〜/u, "");
}

function arrangeSegments(accepted: string | undefined): string[] {
  if (accepted === undefined) return [];
  if (accepted === "犬を探してください。") {
    return ["犬を", "探してください。"];
  }
  return [accepted];
}
