import {
  APPROVED_AUTHORING_PROMPT_PACK,
  AUTHORING_INPUT_HASH_CANONICALIZATION,
  AUTHORING_REQUEST_FORMAT,
  AUTHORING_RESULT_FORMAT,
  type LessonAuthoringEnvelopeInput,
  type LessonAuthoringRequest,
  type LessonAuthoringResult,
} from "../src/schema/index.js";
import {
  AUTHORING_CONTRACT_VERSION,
  AUTHORING_PACKET_VERSION,
} from "../src/version.js";
import { sha256CanonicalJson } from "./authoring-tools.js";

const input = {
  contractVersion: AUTHORING_CONTRACT_VERSION,
  targetLocale: "ja",
  supportLocale: "vi",
  sceneId: "park_small",
  scenarioTemplate: "HELP_SOMEONE",
  normalizedTargets: [
    {
      targetId: "target_inu",
      kind: "VOCABULARY",
      writtenForm: "犬",
      reading: "いぬ",
      grammarPattern: null,
      supportGlossesVi: ["chó"],
      referenceAuthority: "REVIEWED",
    },
    {
      targetId: "target_te_kudasai",
      kind: "GRAMMAR",
      writtenForm: null,
      reading: null,
      grammarPattern: "～てください",
      supportGlossesVi: ["hãy…", "xin hãy…"],
      referenceAuthority: "REVIEWED",
    },
  ],
  worldFacts: [
    {
      factId: "fact_park",
      catalogId: "park_small",
      kind: "SCENE",
      labelJa: "小さい公園",
      allowedClaims: [
        {
          claimId: "claim_park_setting",
          statement: "All story action remains inside one small park.",
        },
      ],
    },
    {
      factId: "fact_guide",
      catalogId: "npc_guide_basic",
      kind: "ENTITY",
      labelJa: "案内人",
      allowedClaims: [
        {
          claimId: "claim_guide_present",
          statement: "The guide is present in the park.",
        },
        {
          claimId: "claim_guide_requests_search",
          statement: "The guide may politely ask the learner to find the dog.",
        },
        {
          claimId: "claim_guide_thanks",
          statement: "The guide may thank the learner after the dog is found.",
        },
      ],
    },
    {
      factId: "fact_dog",
      catalogId: "animal_dog_small",
      kind: "OBJECT",
      labelJa: "犬",
      allowedClaims: [
        {
          claimId: "claim_dog_present",
          statement: "The dog is present somewhere in the park.",
        },
        {
          claimId: "claim_dog_found",
          statement: "The dog can be found by looking around the park.",
        },
      ],
    },
  ],
  storyBeats: [
    {
      beatId: "opening",
      role: "OPENING",
      requiredTargetIds: [],
      allowedWorldClaimIds: ["claim_park_setting", "claim_guide_present"],
      maxJapaneseCharacters: 64,
      maxVietnameseCharacters: 125,
    },
    {
      beatId: "development",
      role: "DEVELOPMENT",
      requiredTargetIds: ["target_inu", "target_te_kudasai"],
      allowedWorldClaimIds: [
        "claim_guide_requests_search",
        "claim_dog_present",
      ],
      maxJapaneseCharacters: 64,
      maxVietnameseCharacters: 125,
    },
    {
      beatId: "turn",
      role: "TURN",
      requiredTargetIds: [],
      allowedWorldClaimIds: ["claim_dog_found"],
      maxJapaneseCharacters: 56,
      maxVietnameseCharacters: 110,
    },
    {
      beatId: "closing",
      role: "CLOSING",
      requiredTargetIds: [],
      allowedWorldClaimIds: ["claim_guide_thanks"],
      maxJapaneseCharacters: 56,
      maxVietnameseCharacters: 110,
    },
  ],
  practiceSlots: [
    {
      slotId: "arrange_request",
      stepId: "arrange_request",
      beatId: "development",
      primitive: "ARRANGE",
      difficulty: "GUIDED",
      targetIds: ["target_inu", "target_te_kudasai"],
      candidateIds: [],
      acceptedCandidateIds: [],
      normalizationRules: ["UNICODE_NFKC", "TRIM"],
      permitsDistractors: false,
      permitsAcceptedText: true,
      permitsArrangeSegments: true,
      maxJapaneseCharacters: 40,
    },
  ],
  coachingSlots: [
    {
      stepId: "arrange_request",
      difficulty: "GUIDED",
      targetIds: ["target_inu", "target_te_kudasai"],
      scaffoldSlots: [
        {
          scaffoldSlotId: "show_request_meaning",
          kind: "SHOW_MEANING",
          revealLevel: "DIRECT",
          afterAttempt: 2,
          permitsJapaneseText: false,
          permitsVietnameseText: true,
          maxJapaneseCharacters: 1,
          maxVietnameseCharacters: 80,
        },
      ],
      permitsInstructionSupport: true,
      maxInstructionJapaneseCharacters: 60,
      maxInstructionVietnameseCharacters: 120,
      maxFeedbackJapaneseCharacters: 40,
      maxFeedbackVietnameseCharacters: 80,
    },
  ],
} satisfies LessonAuthoringEnvelopeInput;

const inputSha256 = sha256CanonicalJson(input);
const promptPack = APPROVED_AUTHORING_PROMPT_PACK.map((module) => ({
  ...module,
}));

export const validAuthoringRequest = {
  packetFormat: AUTHORING_REQUEST_FORMAT,
  packetVersion: AUTHORING_PACKET_VERSION,
  requestId: "m7_v3_2_lesson_authoring_001",
  fixtureId: "composed_help_find_dog",
  attempt: 1,
  mediaPolicy: "TEXT_ONLY",
  responseFormat: "STRICT_JSON_OBJECT",
  inputHashCanonicalization: AUTHORING_INPUT_HASH_CANONICALIZATION,
  inputSha256,
  promptPack,
  dataPolicy: {
    classification: "AUTHORED_FIXTURE",
    containsLearnerData: false,
    disclosure:
      "This authored fixture sends normalized Japanese targets and compact authoring facts to ChatGPT or Codex. It contains no learner identity, progress, evidence, TYPE response, checkpoint, secret, or private chat history.",
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
} satisfies LessonAuthoringRequest;

export const validAuthoringResult = {
  packetFormat: AUTHORING_RESULT_FORMAT,
  packetVersion: AUTHORING_PACKET_VERSION,
  requestId: validAuthoringRequest.requestId,
  inputSha256,
  promptPack: promptPack.map((module) => ({ ...module })),
  contributions: {
    story: {
      status: "OK",
      failureCode: null,
      value: {
        title: { ja: "公園の小さなお願い", vi: "Lời nhờ nhỏ trong công viên" },
        objective: {
          ja: "お願いを聞いて、犬を見つける。",
          vi: "Nghe lời nhờ và tìm chú chó.",
        },
        premise: {
          ja: "小さい公園で、案内人が探しものを頼む。",
          vi: "Trong công viên nhỏ, người hướng dẫn nhờ tìm một thứ.",
        },
        settingContext: {
          ja: "案内人と犬がいる小さい公園。",
          vi: "Một công viên nhỏ có người hướng dẫn và chú chó.",
        },
        synopsis:
          "In a small park, the guide asks the learner to find the dog. The learner finds it and receives thanks.",
        beats: [
          {
            beatId: "opening",
            usedWorldClaimIds: ["claim_park_setting", "claim_guide_present"],
            context: {
              ja: "小さい公園に案内人がいる。",
              vi: "Người hướng dẫn đang ở trong công viên nhỏ.",
            },
          },
          {
            beatId: "development",
            usedWorldClaimIds: [
              "claim_guide_requests_search",
              "claim_dog_present",
            ],
            context: {
              ja: "案内人は「犬を探してください」と頼む。",
              vi: "Người hướng dẫn nhờ: “Xin hãy tìm chú chó.”",
            },
          },
          {
            beatId: "turn",
            usedWorldClaimIds: ["claim_dog_found"],
            context: {
              ja: "公園を見回すと、犬が見つかる。",
              vi: "Nhìn quanh công viên, bạn tìm thấy chú chó.",
            },
          },
          {
            beatId: "closing",
            usedWorldClaimIds: ["claim_guide_thanks"],
            context: {
              ja: "案内人は「ありがとう」と言う。",
              vi: "Người hướng dẫn nói: “Cảm ơn.”",
            },
          },
        ],
      },
    },
    reverseTraining: {
      status: "OK",
      failureCode: null,
      value: {
        targetAnalysis: [
          {
            targetId: "target_inu",
            segments: [
              {
                surfaceJa: "犬",
                readingKana: "いぬ",
                meaningVi: "chó",
                functionVi: "danh từ chỉ con vật cần tìm",
              },
            ],
          },
          {
            targetId: "target_te_kudasai",
            segments: [
              {
                surfaceJa: "～てください",
                readingKana: null,
                meaningVi: "xin hãy…",
                functionVi: "mẫu yêu cầu lịch sự",
              },
            ],
          },
        ],
        practiceItems: [
          {
            slotId: "arrange_request",
            stimulusJa: "「Xin hãy tìm chú chó」になるように並べましょう。",
            acceptedResponsesJa: ["犬を探してください。"],
            arrangeSegmentsJa: ["犬を", "探してください。"],
            distractorsJa: [],
          },
        ],
      },
    },
    coaching: {
      status: "OK",
      failureCode: null,
      value: {
        steps: [
          {
            stepId: "arrange_request",
            instructionJa: "ことばを順番に並べましょう。",
            instructionVi: "Hãy sắp xếp các cụm từ theo đúng thứ tự.",
            hintJa: "まず、探すものから始めます。",
            hintVi: "Hãy bắt đầu bằng thứ cần tìm.",
            scaffoldCopy: [
              {
                scaffoldSlotId: "show_request_meaning",
                textJa: null,
                textVi: "Nghĩa cần tạo là: “Xin hãy tìm chú chó.”",
              },
            ],
            correct: {
              textJa: "はい、正しいお願いです。",
              textVi: "Đúng rồi, đây là lời nhờ chính xác.",
            },
            incorrect: {
              textJa: "もう一度、順番を見ましょう。",
              textVi: "Hãy xem lại thứ tự một lần nữa.",
            },
            assisted: {
              textJa: "ヒントを使って完成できました。",
              textVi: "Bạn đã hoàn thành với gợi ý.",
            },
          },
        ],
      },
    },
  },
} satisfies LessonAuthoringResult;
