import {
  validateLessonAuthoringExchange,
  validateLessonAuthoringResultStructure,
  type LessonAuthoringResult,
} from "../src/index.js";
import { normalizeTypeAnswer } from "../src/type-normalization.js";
import { sha256CanonicalJson } from "./authoring-tools.js";
import type { RunnableAuthoringEvaluationCase } from "./authoring-evaluation-suite.js";

export type AuthoringResultForFixtureGrading = Pick<
  LessonAuthoringResult,
  "contributions"
>;

export interface AuthoringEvaluationFailure {
  code: string;
  message: string;
}

export type AuthoringEvaluationGrade =
  | {
      ok: true;
      result: LessonAuthoringResult;
    }
  | {
      ok: false;
      failures: AuthoringEvaluationFailure[];
    };

export function gradeAuthoringEvaluation(
  evaluationCase: RunnableAuthoringEvaluationCase,
  rawResult: unknown,
): AuthoringEvaluationGrade {
  const structure = validateLessonAuthoringResultStructure(rawResult);
  if (!structure.ok) {
    return {
      ok: false,
      failures: structure.errors.map((error) => ({
        code: error.code,
        message: `${error.path} ${error.message}`,
      })),
    };
  }

  const exchange = validateLessonAuthoringExchange(
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

export function applyAuthoringFixtureChecks(
  evaluationCase: Pick<RunnableAuthoringEvaluationCase, "fixtureId">,
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  switch (evaluationCase.fixtureId) {
    case "story_sheet_find_dog_single_target":
      requireStoryTarget(result, "development", "犬", failures);
      break;
    case "story_sheet_help_someone_grammar_context":
      requireStoryTarget(result, "development", "てください", failures);
      break;
    case "story_sheet_multiple_targets_fixed_beats":
      validateFixedStoryTargetAssignments(result, failures);
      break;
    case "story_sheet_rejects_source_scope_regression":
      rejectTerms(
        storyStrings(result),
        [
          "gloss",
          "romaji",
          "worksheet",
          "a4",
          "image prompt",
          "page layout",
          "anki",
          "jlpt",
        ],
        "DEFERRED_FEATURE_OUTPUT",
        failures,
      );
      break;
    case "story_sheet_rejects_favorite_unsupported_world":
      rejectTerms(
        storyStrings(result),
        [
          "train",
          "station",
          "red button",
          "locked door",
          "abandoned building",
          "weapon",
          "disappearing city",
          "電車",
          "駅",
          "赤いボタン",
          "鍵のかかったドア",
          "廃墟",
          "武器",
          "消える町",
          "nhà ga",
          "nút đỏ",
          "vũ khí",
          "thành phố biến mất",
        ],
        "UNSUPPORTED_FAVORITE_WORLD_OUTPUT",
        failures,
      );
      break;
    case "reverse_trainer_rejects_unverified_reference_claims":
      validateUnverifiedReferenceResult(result, failures);
      break;
    case "reverse_trainer_rejects_plan_and_answer_mutation":
      validateChooseDistractors(result, failures);
      break;
    case "reverse_trainer_natural_phrase_groups":
      validateNaturalPhraseGroups(result, failures);
      break;
    case "reverse_trainer_reverse_recall_type":
      validateReverseRecallType(result, failures);
      break;
    case "reverse_trainer_arrange_reconstruction":
      validateArrangeReconstruction(result, failures);
      break;
    case "story_coach_indirect_hint_without_answer":
    case "story_coach_rejects_early_answer_leak":
      rejectCoachCandidateIdentity(result, "dog", failures);
      break;
    case "story_coach_direct_meaning_scaffold":
      requireDirectMeaning(result, failures);
      break;
    case "story_coach_three_feedback_outcomes":
      validateFeedbackOutcomes(result, failures);
      break;
    case "story_coach_rejects_source_and_runtime_regression":
      rejectTerms(
        coachingStrings(result),
        [
          "five-minute",
          "5-minute",
          "self-rating",
          "jlpt",
          "romaji",
          "worksheet",
          "image prompt",
          "mnemonic",
          "kanji writing",
        ],
        "COACHING_SOURCE_OR_RUNTIME_REGRESSION",
        failures,
      );
      break;
    default:
      failures.push({
        code: "UNKNOWN_RUNNABLE_FIXTURE",
        message: `No fixture-specific grader exists for '${evaluationCase.fixtureId}'.`,
      });
  }
}

function validateNaturalPhraseGroups(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  const reverseTraining = okReverseTraining(result, failures);
  const analysis = reverseTraining?.targetAnalysis.find(
    (candidate) => candidate.targetId === "target_inu",
  );
  const surfaces = analysis?.segments.map((segment) => segment.surfaceJa) ?? [];
  if (!surfaces.includes("犬を") || !surfaces.includes("探してください。")) {
    failures.push({
      code: "NATURAL_PHRASE_GROUPS_MISSING",
      message:
        "Phrase analysis must preserve the compiler-owned groups 犬を and 探してください。",
    });
  }
}

function validateReverseRecallType(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  const reverseTraining = okReverseTraining(result, failures);
  const item = reverseTraining?.practiceItems.find(
    (candidate) => candidate.slotId === "type_request",
  );
  if (
    item === undefined ||
    item.acceptedResponsesJa.length !== 1 ||
    item.acceptedResponsesJa[0] !== "犬を探してください。" ||
    item.arrangeSegmentsJa.length !== 0 ||
    item.distractorsJa.length !== 0
  ) {
    failures.push({
      code: "REVERSE_RECALL_TYPE_SHAPE_INVALID",
      message:
        "TYPE must echo the one compiler-owned Japanese answer and leave ARRANGE/distractor fields empty.",
    });
  }
}

function validateArrangeReconstruction(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  const reverseTraining = okReverseTraining(result, failures);
  const item = reverseTraining?.practiceItems.find(
    (candidate) => candidate.slotId === "arrange_find_dog",
  );
  if (
    item === undefined ||
    item.arrangeSegmentsJa.join("") !== "犬を探してください。"
  ) {
    failures.push({
      code: "ARRANGE_RECONSTRUCTION_INVALID",
      message:
        "ARRANGE segments must reconstruct the compiler-owned Japanese answer exactly.",
    });
  }
}

function requireStoryTarget(
  result: AuthoringResultForFixtureGrading,
  beatId: string,
  targetText: string,
  failures: AuthoringEvaluationFailure[],
): void {
  const story = okStory(result, failures);
  const beat = story?.beats.find((candidate) => candidate.beatId === beatId);
  if (beat !== undefined && !beat.context.ja.includes(targetText)) {
    failures.push({
      code: "TARGET_ASSIGNMENT_MISSING",
      message: `Beat '${beatId}' does not contain required target text '${targetText}'.`,
    });
  }
}

function validateFixedStoryTargetAssignments(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  const story = okStory(result, failures);
  if (story === undefined) {
    return;
  }
  const expected = new Map<string, string[]>([
    ["opening", ["てください"]],
    ["development", ["犬", "猫"]],
    ["closing", ["犬"]],
  ]);
  const allTargets = ["犬", "猫", "てください"];

  for (const beat of story.beats) {
    const required = expected.get(beat.beatId) ?? [];
    for (const target of allTargets) {
      const present = beat.context.ja.includes(target);
      if (required.includes(target) && !present) {
        failures.push({
          code: "TARGET_ASSIGNMENT_MISSING",
          message: `Beat '${beat.beatId}' does not contain '${target}'.`,
        });
      }
      if (!required.includes(target) && present) {
        failures.push({
          code: "TARGET_ASSIGNMENT_MOVED",
          message: `Beat '${beat.beatId}' contains unassigned target '${target}'.`,
        });
      }
    }
  }
}

function validateUnverifiedReferenceResult(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  const reverseTraining = okReverseTraining(result, failures);
  const analysis = reverseTraining?.targetAnalysis.find(
    (candidate) => candidate.targetId === "target_te_kudasai",
  );
  if (analysis === undefined) {
    return;
  }
  const targetSegment = analysis.segments.find((segment) =>
    normalize(segment.surfaceJa).includes("てください"),
  );
  if (targetSegment === undefined) {
    failures.push({
      code: "REFERENCE_TARGET_SURFACE_MISSING",
      message:
        "Target analysis does not preserve the supplied 〜てください surface.",
    });
  } else {
    if (targetSegment.readingKana !== null) {
      failures.push({
        code: "UNVERIFIED_READING_INVENTED",
        message:
          "Grammar target has no reviewed reading, but the result supplied one.",
      });
    }
    if (normalize(targetSegment.meaningVi) !== normalize("hãy làm...")) {
      failures.push({
        code: "REFERENCE_MEANING_DRIFT",
        message:
          "Grammar meaning does not preserve the reviewed Vietnamese input.",
      });
    }
  }
  rejectTerms(
    reverseTrainingStrings(result),
    [
      "jlpt",
      "romaji",
      "etymology",
      "kanji decomposition",
      "exam frequency",
      "n5",
      "n4",
      "n3",
      "n2",
      "n1",
    ],
    "UNVERIFIED_REFERENCE_CLAIM",
    failures,
  );
}

function validateChooseDistractors(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  const reverseTraining = okReverseTraining(result, failures);
  const item = reverseTraining?.practiceItems.find(
    (candidate) => candidate.slotId === "choose_meaning",
  );
  if (item === undefined) {
    return;
  }
  const accepted = normalizeTypeAnswer("犬", ["UNICODE_NFKC", "TRIM"]);
  if (
    item.distractorsJa.some(
      (distractor) =>
        normalizeTypeAnswer(distractor, ["UNICODE_NFKC", "TRIM"]) === accepted,
    )
  ) {
    failures.push({
      code: "DISTRACTOR_COLLIDES_WITH_TARGET_TRUTH",
      message:
        "A CHOOSE distractor normalizes to the reviewed accepted text 犬.",
    });
  }
}

function rejectCoachCandidateIdentity(
  result: AuthoringResultForFixtureGrading,
  candidateId: string,
  failures: AuthoringEvaluationFailure[],
): void {
  const coaching = okCoaching(result, failures);
  for (const step of coaching?.steps ?? []) {
    const hint = normalize([step.hintJa, step.hintVi ?? ""].join(" "));
    if (hint.includes(normalize(candidateId))) {
      failures.push({
        code: "EARLY_CANDIDATE_ID_LEAK",
        message: `Indirect hint contains accepted candidate identity '${candidateId}'.`,
      });
    }
  }
}

function requireDirectMeaning(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  const coaching = okCoaching(result, failures);
  const directCopy = coaching?.steps
    .flatMap((step) => step.scaffoldCopy)
    .find((copy) => copy.scaffoldSlotId === "show_dog_meaning");
  if (
    directCopy === undefined ||
    directCopy.textVi === null ||
    !normalize(directCopy.textVi).includes(normalize("chó"))
  ) {
    failures.push({
      code: "DIRECT_MEANING_NOT_REVEALED",
      message:
        "Direct SHOW_MEANING scaffold does not contain reviewed meaning 'chó'.",
    });
  }
}

function validateFeedbackOutcomes(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
): void {
  const coaching = okCoaching(result, failures);
  for (const step of coaching?.steps ?? []) {
    const values = [
      combinedFeedback(step.correct),
      combinedFeedback(step.incorrect),
      combinedFeedback(step.assisted),
    ];
    if (new Set(values).size !== values.length) {
      failures.push({
        code: "FEEDBACK_OUTCOMES_NOT_DISTINCT",
        message: "Correct, incorrect, and assisted feedback must be distinct.",
      });
    }
    if (!/(もう一度|考え|見|thử|lại|xem|chưa)/iu.test(values[1] ?? "")) {
      failures.push({
        code: "INCORRECT_FEEDBACK_NOT_RECOVERABLE",
        message: "Incorrect feedback does not visibly invite another attempt.",
      });
    }
    if (!/(ヒント|助け|サポート|gợi ý|hỗ trợ)/iu.test(values[2] ?? "")) {
      failures.push({
        code: "ASSISTED_FEEDBACK_NOT_ACKNOWLEDGED",
        message: "Assisted feedback does not acknowledge learner support.",
      });
    }
    if (/(mastered|thành thạo|完全に覚え)/iu.test(values[0] ?? "")) {
      failures.push({
        code: "CORRECT_FEEDBACK_INFERS_MASTERY",
        message: "Correct feedback makes an unsupported mastery claim.",
      });
    }
  }
}

function okStory(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
) {
  const contribution = result.contributions.story;
  if (contribution.status !== "OK") {
    failures.push({
      code: "STORY_NOT_OK",
      message: `Story returned ${contribution.failureCode}.`,
    });
    return undefined;
  }
  return contribution.value;
}

function okReverseTraining(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
) {
  const contribution = result.contributions.reverseTraining;
  if (contribution.status !== "OK") {
    failures.push({
      code: "REVERSE_TRAINING_NOT_OK",
      message: `Reverse Trainer returned ${contribution.failureCode}.`,
    });
    return undefined;
  }
  return contribution.value;
}

function okCoaching(
  result: AuthoringResultForFixtureGrading,
  failures: AuthoringEvaluationFailure[],
) {
  const contribution = result.contributions.coaching;
  if (contribution.status !== "OK") {
    failures.push({
      code: "COACHING_NOT_OK",
      message: `Story Coach returned ${contribution.failureCode}.`,
    });
    return undefined;
  }
  return contribution.value;
}

function storyStrings(result: AuthoringResultForFixtureGrading): string[] {
  return result.contributions.story.status === "OK"
    ? collectStrings(result.contributions.story.value)
    : [];
}

function reverseTrainingStrings(
  result: AuthoringResultForFixtureGrading,
): string[] {
  return result.contributions.reverseTraining.status === "OK"
    ? collectStrings(result.contributions.reverseTraining.value)
    : [];
}

function coachingStrings(result: AuthoringResultForFixtureGrading): string[] {
  return result.contributions.coaching.status === "OK"
    ? collectStrings(result.contributions.coaching.value)
    : [];
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function rejectTerms(
  values: string[],
  forbiddenTerms: string[],
  code: string,
  failures: AuthoringEvaluationFailure[],
): void {
  const joined = normalize(values.join(" "));
  const found = forbiddenTerms.find((term) => joined.includes(normalize(term)));
  if (found !== undefined) {
    failures.push({
      code,
      message: `Authored contribution contains forbidden term '${found}'.`,
    });
  }
}

function combinedFeedback(feedback: {
  textJa: string;
  textVi: string | null;
}): string {
  return normalize(`${feedback.textJa} ${feedback.textVi ?? ""}`);
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("vi").replaceAll(/\s+/g, "");
}
