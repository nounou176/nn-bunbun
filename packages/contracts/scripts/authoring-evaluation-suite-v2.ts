import {
  APPROVED_AUTHORING_PROMPT_PACK,
  AUTHORING_FIXTURE_DISCLOSURE_V2,
  AUTHORING_INPUT_HASH_CANONICALIZATION,
  AUTHORING_REQUEST_FORMAT,
  type CoachingSlotInputV2,
  type LessonAuthoringEnvelopeInput,
  type LessonAuthoringEnvelopeInputV2,
  type LessonAuthoringRequestV2,
  type PracticeSlotInputV2,
} from "../src/schema/index.js";
import {
  AUTHORING_CONTRACT_VERSION_V2,
  AUTHORING_PACKET_VERSION_V2,
} from "../src/version.js";
import {
  authoringEvaluationCases,
  practiceSlot,
  storyFindDogInput,
  storyHelpSomeoneInput,
  targetInu,
  targetTeKudasai,
  type AuthoringEvaluationCategory,
  type AuthoringEvaluationModuleId,
} from "./authoring-evaluation-suite.js";
import { sha256CanonicalJson } from "./authoring-tools.js";

export const AUTHORING_EVALUATION_SUITE_VERSION_V2 = "0.2.0" as const;

export interface RunnableAuthoringEvaluationCaseV2 {
  fixtureId: string;
  moduleId: AuthoringEvaluationModuleId;
  category: AuthoringEvaluationCategory;
  execution: "RUNNABLE";
  request: LessonAuthoringRequestV2;
}

export const authoringEvaluationCasesV2: readonly RunnableAuthoringEvaluationCaseV2[] =
  authoringEvaluationCases.map((evaluationCase, index) => {
    const input =
      evaluationCase.execution === "RUNNABLE"
        ? upgradeInput(evaluationCase.request.input)
        : inputForFormerGap(evaluationCase.fixtureId);
    return runnableV2(
      evaluationCase.fixtureId,
      evaluationCase.moduleId,
      evaluationCase.category,
      index + 1,
      input,
    );
  });

export function findAuthoringEvaluationCaseV2(
  fixtureId: string,
): RunnableAuthoringEvaluationCaseV2 | undefined {
  return authoringEvaluationCasesV2.find(
    (candidate) => candidate.fixtureId === fixtureId,
  );
}

function runnableV2(
  fixtureId: string,
  moduleId: AuthoringEvaluationModuleId,
  category: AuthoringEvaluationCategory,
  sequence: number,
  input: LessonAuthoringEnvelopeInputV2,
): RunnableAuthoringEvaluationCaseV2 {
  const inputSha256 = sha256CanonicalJson(input);
  return {
    fixtureId,
    moduleId,
    category,
    execution: "RUNNABLE",
    request: {
      packetFormat: AUTHORING_REQUEST_FORMAT,
      packetVersion: AUTHORING_PACKET_VERSION_V2,
      requestId: `m7_v3_2_eval_v2_${String(sequence).padStart(3, "0")}`,
      requestContextId: fixtureId,
      attempt: 1,
      repair: null,
      mediaPolicy: "TEXT_ONLY",
      responseFormat: "STRICT_JSON_OBJECT",
      inputHashCanonicalization: AUTHORING_INPUT_HASH_CANONICALIZATION,
      inputSha256,
      promptPack: APPROVED_AUTHORING_PROMPT_PACK.map((module) => ({
        ...module,
      })),
      dataPolicy: {
        classification: "AUTHORED_FIXTURE",
        containsLearnerData: false,
        disclosure: AUTHORING_FIXTURE_DISCLOSURE_V2,
      },
      outputLimits: {
        title: { maxJapaneseCharacters: 28, maxVietnameseCharacters: 56 },
        objective: { maxJapaneseCharacters: 60, maxVietnameseCharacters: 120 },
        premise: { maxJapaneseCharacters: 90, maxVietnameseCharacters: 180 },
        settingContext: {
          maxJapaneseCharacters: 70,
          maxVietnameseCharacters: 140,
        },
        synopsisMaxCharacters: 240,
      },
      input,
    },
  };
}

function upgradeInput(
  input: LessonAuthoringEnvelopeInput,
): LessonAuthoringEnvelopeInputV2 {
  const practiceSlots = input.practiceSlots.map((slot) => ({
    ...slot,
    practiceTextJa: defaultPracticeText(input),
    acceptedResponsesJa: [] as string[],
  }));
  const practiceByStep = new Map(
    practiceSlots.map((slot) => [slot.stepId, slot] as const),
  );
  return {
    ...input,
    contractVersion: AUTHORING_CONTRACT_VERSION_V2,
    practiceSlots,
    coachingSlots: input.coachingSlots.map((slot) => {
      const matchingPractice = practiceByStep.get(slot.stepId);
      const maximumAttempts = Math.max(
        2,
        ...slot.scaffoldSlots.map((scaffold) => scaffold.afterAttempt),
      );
      return {
        ...slot,
        primitive: matchingPractice?.primitive ?? "CLICK_OBJECT",
        maximumAttempts,
        feedbackDisplayMs: {
          correct: 500,
          incorrect: 650,
          assisted: 650,
        },
      };
    }),
  };
}

function inputForFormerGap(fixtureId: string): LessonAuthoringEnvelopeInputV2 {
  switch (fixtureId) {
    case "reverse_trainer_natural_phrase_groups":
      return withPlan(storyFindDogInput([targetInu()], false), [
        {
          ...practiceSlot(
            "listen_request",
            "listen_request",
            "LISTEN",
            "SUPPORTED",
          ),
          practiceTextJa: "犬を探してください。",
          acceptedResponsesJa: [],
        },
      ]);
    case "reverse_trainer_reverse_recall_type":
      return withPlan(storyHelpSomeoneInput(), [
        {
          ...practiceSlot(
            "type_request",
            "type_request",
            "TYPE",
            "INDEPENDENT",
            {
              beatId: "development",
              targetIds: ["target_te_kudasai"],
              permitsAcceptedText: true,
            },
          ),
          practiceTextJa: "犬を探してください。",
          acceptedResponsesJa: ["犬を探してください。"],
        },
      ]);
    case "reverse_trainer_arrange_reconstruction": {
      const base = storyFindDogInput([targetInu(), targetTeKudasai()], false);
      base.storyBeats[1]?.requiredTargetIds.push("target_te_kudasai");
      return withPlan(base, [
        {
          ...practiceSlot(
            "arrange_find_dog",
            "arrange_find_dog",
            "ARRANGE",
            "GUIDED",
            {
              beatId: "development",
              targetIds: ["target_inu", "target_te_kudasai"],
              permitsAcceptedText: true,
              permitsArrangeSegments: true,
            },
          ),
          practiceTextJa: "犬を探してください。",
          acceptedResponsesJa: ["犬を探してください。"],
        },
      ]);
    }
    case "story_coach_rejects_source_and_runtime_regression": {
      const practice: PracticeSlotInputV2 = {
        ...practiceSlot("type_request", "type_request", "TYPE", "INDEPENDENT", {
          beatId: "development",
          targetIds: ["target_te_kudasai"],
          permitsAcceptedText: true,
        }),
        practiceTextJa: "犬を探してください。",
        acceptedResponsesJa: ["犬を探してください。"],
      };
      const coaching: CoachingSlotInputV2 = {
        stepId: "type_request",
        primitive: "TYPE",
        difficulty: "INDEPENDENT",
        maximumAttempts: 2,
        feedbackDisplayMs: {
          correct: 900,
          incorrect: 900,
          assisted: 900,
        },
        targetIds: ["target_te_kudasai"],
        scaffoldSlots: [
          {
            scaffoldSlotId: "show_pattern",
            kind: "SHOW_PATTERN",
            revealLevel: "DIRECT",
            afterAttempt: 2,
            permitsJapaneseText: true,
            permitsVietnameseText: false,
            maxJapaneseCharacters: 40,
            maxVietnameseCharacters: 1,
          },
        ],
        permitsInstructionSupport: true,
        maxInstructionJapaneseCharacters: 60,
        maxInstructionVietnameseCharacters: 120,
        maxFeedbackJapaneseCharacters: 80,
        maxFeedbackVietnameseCharacters: 160,
      };
      return withPlan(storyHelpSomeoneInput(), [practice], [coaching]);
    }
    default:
      throw new Error(`No 0.2.0 input mapping exists for '${fixtureId}'.`);
  }
}

function withPlan(
  input: LessonAuthoringEnvelopeInput,
  practiceSlots: PracticeSlotInputV2[],
  coachingSlots: CoachingSlotInputV2[] = [],
): LessonAuthoringEnvelopeInputV2 {
  return {
    ...input,
    contractVersion: AUTHORING_CONTRACT_VERSION_V2,
    practiceSlots,
    coachingSlots,
  };
}

function defaultPracticeText(input: LessonAuthoringEnvelopeInput): string {
  const surfaces = input.normalizedTargets
    .map((target) => target.writtenForm ?? target.grammarPattern)
    .filter((value): value is string => value !== null);
  return surfaces.length === 0 ? "公園を見てください。" : surfaces.join("、");
}
