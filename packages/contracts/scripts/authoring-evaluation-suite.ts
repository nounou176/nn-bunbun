import {
  APPROVED_AUTHORING_PROMPT_PACK,
  AUTHORING_INPUT_HASH_CANONICALIZATION,
  AUTHORING_REQUEST_FORMAT,
  type CoachingSlotInput,
  type LessonAuthoringEnvelopeInput,
  type LessonAuthoringRequest,
  type NormalizedTargetInput,
  type PracticeSlotInput,
  type StoryBeatInput,
  type WorldFactInput,
} from "../src/schema/index.js";
import {
  AUTHORING_CONTRACT_VERSION,
  AUTHORING_PACKET_VERSION,
} from "../src/version.js";
import { sha256CanonicalJson } from "./authoring-tools.js";

export const AUTHORING_EVALUATION_SUITE_VERSION = "0.1.0" as const;

export type AuthoringEvaluationModuleId =
  "story_sheet" | "reverse_trainer" | "story_coach";

export type AuthoringEvaluationCategory = "EXPECTED" | "REJECTED_BEHAVIOR";

export interface RunnableAuthoringEvaluationCase {
  fixtureId: string;
  moduleId: AuthoringEvaluationModuleId;
  category: AuthoringEvaluationCategory;
  execution: "RUNNABLE";
  request: LessonAuthoringRequest;
}

export interface ContractGapAuthoringEvaluationCase {
  fixtureId: string;
  moduleId: AuthoringEvaluationModuleId;
  category: AuthoringEvaluationCategory;
  execution: "CONTRACT_GAP";
  gapCode:
    | "AUTHORITATIVE_PRACTICE_TEXT_MISSING"
    | "AUTHORITATIVE_ACCEPTED_TEXT_MISSING"
    | "RUNTIME_PLAN_FIELDS_MISSING";
  reason: string;
}

export type AuthoringEvaluationCase =
  RunnableAuthoringEvaluationCase | ContractGapAuthoringEvaluationCase;

const outputLimits = {
  title: { maxJapaneseCharacters: 28, maxVietnameseCharacters: 56 },
  objective: { maxJapaneseCharacters: 60, maxVietnameseCharacters: 120 },
  premise: { maxJapaneseCharacters: 90, maxVietnameseCharacters: 180 },
  settingContext: {
    maxJapaneseCharacters: 70,
    maxVietnameseCharacters: 140,
  },
  synopsisMaxCharacters: 240,
} as const;

const requestDisclosure =
  "This authored fixture sends normalized Japanese targets and compact authoring facts to ChatGPT or Codex. It contains no learner identity, progress, evidence, TYPE response, checkpoint, secret, or private chat history." as const;

export const authoringEvaluationCases: readonly AuthoringEvaluationCase[] = [
  runnable(
    "story_sheet_find_dog_single_target",
    "story_sheet",
    "EXPECTED",
    "m7_v3_2_eval_ss_001",
    storyFindDogInput([targetInu()], false),
  ),
  runnable(
    "story_sheet_help_someone_grammar_context",
    "story_sheet",
    "EXPECTED",
    "m7_v3_2_eval_ss_002",
    storyHelpSomeoneInput(),
  ),
  runnable(
    "story_sheet_multiple_targets_fixed_beats",
    "story_sheet",
    "EXPECTED",
    "m7_v3_2_eval_ss_003",
    storyMultipleTargetsInput(),
  ),
  runnable(
    "story_sheet_rejects_source_scope_regression",
    "story_sheet",
    "REJECTED_BEHAVIOR",
    "m7_v3_2_eval_ss_004",
    storyFindDogInput([targetInu()], false),
  ),
  runnable(
    "story_sheet_rejects_favorite_unsupported_world",
    "story_sheet",
    "REJECTED_BEHAVIOR",
    "m7_v3_2_eval_ss_005",
    storyFindDogInput([targetInu()], false),
  ),
  contractGap(
    "reverse_trainer_natural_phrase_groups",
    "reverse_trainer",
    "EXPECTED",
    "AUTHORITATIVE_PRACTICE_TEXT_MISSING",
    "The D-024 fixture supplies practiceText, but request 0.1.0 has no compiler-owned practice-text field. Running it would let the model invent the phrase being analyzed.",
  ),
  contractGap(
    "reverse_trainer_reverse_recall_type",
    "reverse_trainer",
    "EXPECTED",
    "AUTHORITATIVE_ACCEPTED_TEXT_MISSING",
    "The D-024 TYPE fixture requires one compiler-owned accepted Japanese answer, but request 0.1.0 exposes only a permission to author accepted text.",
  ),
  contractGap(
    "reverse_trainer_arrange_reconstruction",
    "reverse_trainer",
    "EXPECTED",
    "AUTHORITATIVE_ACCEPTED_TEXT_MISSING",
    "The D-024 ARRANGE fixture supplies an accepted response, but request 0.1.0 cannot carry that answer truth for deterministic reconstruction checks.",
  ),
  runnable(
    "reverse_trainer_rejects_unverified_reference_claims",
    "reverse_trainer",
    "REJECTED_BEHAVIOR",
    "m7_v3_2_eval_rt_004",
    reverseUnverifiedReferenceInput(),
  ),
  runnable(
    "reverse_trainer_rejects_plan_and_answer_mutation",
    "reverse_trainer",
    "REJECTED_BEHAVIOR",
    "m7_v3_2_eval_rt_005",
    reverseChooseInput(),
  ),
  runnable(
    "story_coach_indirect_hint_without_answer",
    "story_coach",
    "EXPECTED",
    "m7_v3_2_eval_sc_001",
    coachingInput("find_dog", "CLICK_OBJECT", [], "GUIDED"),
  ),
  runnable(
    "story_coach_direct_meaning_scaffold",
    "story_coach",
    "EXPECTED",
    "m7_v3_2_eval_sc_002",
    coachingInput(
      "find_dog",
      "CLICK_OBJECT",
      [directMeaningScaffold()],
      "GUIDED",
    ),
  ),
  runnable(
    "story_coach_three_feedback_outcomes",
    "story_coach",
    "EXPECTED",
    "m7_v3_2_eval_sc_003",
    coachingInput("find_dog", "CLICK_OBJECT", [], "GUIDED", {
      maxFeedbackJapaneseCharacters: 80,
      maxFeedbackVietnameseCharacters: 160,
    }),
  ),
  runnable(
    "story_coach_rejects_early_answer_leak",
    "story_coach",
    "REJECTED_BEHAVIOR",
    "m7_v3_2_eval_sc_004",
    coachingInput("choose_dog", "CHOOSE", [], "GUIDED"),
  ),
  contractGap(
    "story_coach_rejects_source_and_runtime_regression",
    "story_coach",
    "REJECTED_BEHAVIOR",
    "RUNTIME_PLAN_FIELDS_MISSING",
    "The D-024 fixture requires TYPE answer truth plus maximumAttempts and displayMs. Request 0.1.0 carries neither the accepted text nor those runtime-owned fields, so the exact regression case cannot be presented to the composed Skill.",
  ),
];

export function findAuthoringEvaluationCase(
  fixtureId: string,
): AuthoringEvaluationCase | undefined {
  return authoringEvaluationCases.find(
    (candidate) => candidate.fixtureId === fixtureId,
  );
}

function runnable(
  fixtureId: string,
  moduleId: AuthoringEvaluationModuleId,
  category: AuthoringEvaluationCategory,
  requestId: string,
  input: LessonAuthoringEnvelopeInput,
): RunnableAuthoringEvaluationCase {
  const inputSha256 = sha256CanonicalJson(input);
  return {
    fixtureId,
    moduleId,
    category,
    execution: "RUNNABLE",
    request: {
      packetFormat: AUTHORING_REQUEST_FORMAT,
      packetVersion: AUTHORING_PACKET_VERSION,
      requestId,
      fixtureId,
      attempt: 1,
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
        disclosure: requestDisclosure,
      },
      outputLimits: structuredClone(outputLimits),
      input,
    },
  };
}

function contractGap(
  fixtureId: string,
  moduleId: AuthoringEvaluationModuleId,
  category: AuthoringEvaluationCategory,
  gapCode: ContractGapAuthoringEvaluationCase["gapCode"],
  reason: string,
): ContractGapAuthoringEvaluationCase {
  return {
    fixtureId,
    moduleId,
    category,
    execution: "CONTRACT_GAP",
    gapCode,
    reason,
  };
}

function envelope(
  targets: NormalizedTargetInput[],
  facts: WorldFactInput[],
  beats: StoryBeatInput[],
  practiceSlots: PracticeSlotInput[] = [],
  coachingSlots: CoachingSlotInput[] = [],
  scenarioTemplate = "FIND_SOMETHING",
): LessonAuthoringEnvelopeInput {
  return {
    contractVersion: AUTHORING_CONTRACT_VERSION,
    targetLocale: "ja",
    supportLocale: "vi",
    sceneId: "park_small",
    scenarioTemplate,
    normalizedTargets: targets,
    worldFacts: facts,
    storyBeats: beats,
    practiceSlots,
    coachingSlots,
  };
}

function storyFindDogInput(
  targets: NormalizedTargetInput[],
  includeCatTarget: boolean,
): LessonAuthoringEnvelopeInput {
  const developmentTargets = targets
    .filter((target) =>
      includeCatTarget
        ? ["target_inu", "target_neko"].includes(target.targetId)
        : target.targetId === "target_inu",
    )
    .map((target) => target.targetId);
  return envelope(
    targets,
    [parkFact(), guideFact(), dogFact(), catFact()],
    [
      beat(
        "opening",
        "OPENING",
        [],
        ["claim_park_setting", "claim_guide_present"],
      ),
      beat("development", "DEVELOPMENT", developmentTargets, [
        "claim_guide_requests_search",
        "claim_dog_present",
        "claim_cat_present",
      ]),
      beat("closing", "CLOSING", [], ["claim_dog_found", "claim_guide_thanks"]),
    ],
  );
}

function storyHelpSomeoneInput(): LessonAuthoringEnvelopeInput {
  return envelope(
    [targetTeKudasai()],
    [parkFact(), guideFact(), dogFact(), visitorFact(), benchFact()],
    [
      beat(
        "opening",
        "OPENING",
        [],
        [
          "claim_park_setting",
          "claim_visitor_near_bench",
          "claim_guide_present",
        ],
      ),
      beat(
        "development",
        "DEVELOPMENT",
        ["target_te_kudasai"],
        ["claim_visitor_requests_search", "claim_dog_present"],
      ),
      beat("turn", "TURN", [], ["claim_dog_found"]),
      beat("closing", "CLOSING", [], ["claim_visitor_thanks"]),
    ],
    [],
    [],
    "HELP_SOMEONE",
  );
}

function storyMultipleTargetsInput(): LessonAuthoringEnvelopeInput {
  return envelope(
    [targetInu(), targetNeko(), targetTeKudasai()],
    [parkFact(), guideFact(), dogFact(), catFact()],
    [
      beat(
        "opening",
        "OPENING",
        ["target_te_kudasai"],
        [
          "claim_park_setting",
          "claim_guide_present",
          "claim_guide_requests_search",
        ],
      ),
      beat(
        "development",
        "DEVELOPMENT",
        ["target_inu", "target_neko"],
        ["claim_dog_present", "claim_cat_present"],
      ),
      beat(
        "closing",
        "CLOSING",
        ["target_inu"],
        ["claim_dog_found", "claim_guide_thanks"],
      ),
    ],
  );
}

function reverseUnverifiedReferenceInput(): LessonAuthoringEnvelopeInput {
  return envelope(
    [targetTeKudasai()],
    [parkFact()],
    [beat("opening", "OPENING", [], ["claim_park_setting"])],
  );
}

function reverseChooseInput(): LessonAuthoringEnvelopeInput {
  return envelope(
    [targetInu()],
    [parkFact(), dogFact(), catFact()],
    [
      beat(
        "opening",
        "OPENING",
        ["target_inu"],
        ["claim_park_setting", "claim_dog_present", "claim_cat_present"],
      ),
    ],
    [
      practiceSlot("choose_meaning", "choose_meaning", "CHOOSE", "GUIDED", {
        candidateIds: ["dog", "cat"],
        acceptedCandidateIds: ["dog"],
        permitsDistractors: true,
      }),
    ],
  );
}

function coachingInput(
  stepId: string,
  primitive: "CLICK_OBJECT" | "CHOOSE",
  scaffoldSlots: CoachingSlotInput["scaffoldSlots"],
  difficulty: CoachingSlotInput["difficulty"],
  budgetOverrides: Partial<
    Pick<
      CoachingSlotInput,
      "maxFeedbackJapaneseCharacters" | "maxFeedbackVietnameseCharacters"
    >
  > = {},
): LessonAuthoringEnvelopeInput {
  const candidates = ["dog", "cat"];
  return envelope(
    [targetInu()],
    [parkFact(), dogFact(), catFact()],
    [
      beat(
        "opening",
        "OPENING",
        ["target_inu"],
        ["claim_park_setting", "claim_dog_present", "claim_cat_present"],
      ),
    ],
    [
      practiceSlot(stepId, stepId, primitive, difficulty, {
        candidateIds: candidates,
        acceptedCandidateIds: ["dog"],
      }),
    ],
    [
      {
        stepId,
        difficulty,
        targetIds: ["target_inu"],
        scaffoldSlots,
        permitsInstructionSupport: true,
        maxInstructionJapaneseCharacters: 60,
        maxInstructionVietnameseCharacters: 120,
        maxFeedbackJapaneseCharacters:
          budgetOverrides.maxFeedbackJapaneseCharacters ?? 40,
        maxFeedbackVietnameseCharacters:
          budgetOverrides.maxFeedbackVietnameseCharacters ?? 80,
      },
    ],
  );
}

function targetInu(): NormalizedTargetInput {
  return {
    targetId: "target_inu",
    kind: "VOCABULARY",
    writtenForm: "犬",
    reading: "いぬ",
    grammarPattern: null,
    supportGlossesVi: ["chó"],
    referenceAuthority: "REVIEWED",
  };
}

function targetNeko(): NormalizedTargetInput {
  return {
    targetId: "target_neko",
    kind: "VOCABULARY",
    writtenForm: "猫",
    reading: "ねこ",
    grammarPattern: null,
    supportGlossesVi: ["mèo"],
    referenceAuthority: "REVIEWED",
  };
}

function targetTeKudasai(): NormalizedTargetInput {
  return {
    targetId: "target_te_kudasai",
    kind: "GRAMMAR",
    writtenForm: null,
    reading: null,
    grammarPattern: "〜てください",
    supportGlossesVi: ["hãy làm..."],
    referenceAuthority: "REVIEWED",
  };
}

function parkFact(): WorldFactInput {
  return {
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
  };
}

function guideFact(): WorldFactInput {
  return {
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
  };
}

function dogFact(): WorldFactInput {
  return {
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
  };
}

function catFact(): WorldFactInput {
  return {
    factId: "fact_cat",
    catalogId: "animal_cat_small",
    kind: "OBJECT",
    labelJa: "猫",
    allowedClaims: [
      {
        claimId: "claim_cat_present",
        statement: "The cat is present somewhere in the park.",
      },
    ],
  };
}

function visitorFact(): WorldFactInput {
  return {
    factId: "fact_visitor",
    catalogId: "npc_visitor_basic",
    kind: "ENTITY",
    labelJa: "訪問者",
    allowedClaims: [
      {
        claimId: "claim_visitor_near_bench",
        statement: "The visitor is beside the bench in the park.",
      },
      {
        claimId: "claim_visitor_requests_search",
        statement: "The visitor may politely ask the learner to find the dog.",
      },
      {
        claimId: "claim_visitor_thanks",
        statement: "The visitor may thank the learner after the dog is found.",
      },
    ],
  };
}

function benchFact(): WorldFactInput {
  return {
    factId: "fact_bench",
    catalogId: "prop_bench_basic",
    kind: "OBJECT",
    labelJa: "ベンチ",
    allowedClaims: [
      {
        claimId: "claim_bench_present",
        statement: "The bench is present in the park.",
      },
    ],
  };
}

function beat(
  beatId: string,
  role: StoryBeatInput["role"],
  requiredTargetIds: string[],
  allowedWorldClaimIds: string[],
): StoryBeatInput {
  return {
    beatId,
    role,
    requiredTargetIds,
    allowedWorldClaimIds,
    maxJapaneseCharacters: 64,
    maxVietnameseCharacters: 125,
  };
}

function practiceSlot(
  slotId: string,
  stepId: string,
  primitive: PracticeSlotInput["primitive"],
  difficulty: PracticeSlotInput["difficulty"],
  overrides: Partial<PracticeSlotInput> = {},
): PracticeSlotInput {
  return {
    slotId,
    stepId,
    beatId: "opening",
    primitive,
    difficulty,
    targetIds: ["target_inu"],
    candidateIds: [],
    acceptedCandidateIds: [],
    normalizationRules: ["UNICODE_NFKC", "TRIM"],
    permitsDistractors: false,
    permitsAcceptedText: false,
    permitsArrangeSegments: false,
    maxJapaneseCharacters: 40,
    ...overrides,
  };
}

function directMeaningScaffold(): CoachingSlotInput["scaffoldSlots"][number] {
  return {
    scaffoldSlotId: "show_dog_meaning",
    kind: "SHOW_MEANING",
    revealLevel: "DIRECT",
    afterAttempt: 2,
    permitsJapaneseText: false,
    permitsVietnameseText: true,
    maxJapaneseCharacters: 1,
    maxVietnameseCharacters: 80,
  };
}
