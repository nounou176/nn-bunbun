import { createHash } from "node:crypto";

import {
  APPROVED_AUTHORING_PROMPT_PACK,
  AUTHORING_INPUT_HASH_CANONICALIZATION,
  AUTHORING_LEARNER_TARGET_DISCLOSURE_V2,
  AUTHORING_REQUEST_FORMAT,
  AUTHORING_PACKET_VERSION_V2,
  type CatalogSnapshot,
  type LessonAuthoringEnvelopeInputV2,
  type LessonAuthoringRequestV2,
  type LessonAuthoringResultV2,
  type LessonManifest,
  type LearningTarget,
  type NormalizedTargetInput,
  type ValidatedLessonPackage,
  validateLessonAuthoringExchangeV2,
  validateLessonPackage,
  validateParkRuntimeCapabilities,
} from "@bunbun/contracts";
import catalogFixture from "@bunbun/contracts/fixtures/basic-catalog" with { type: "json" };
import coreReferenceFixture from "@bunbun/contracts/fixtures/bunbun-core-reference" with { type: "json" };
import manifestFixture from "@bunbun/contracts/fixtures/valid-complete-primitive-loop" with { type: "json" };

import { canonicalJson } from "../persistence/canonical-json.js";

export const COMPILER_VERSION = "0.1.0";
export const REFERENCE_VERSION = coreReferenceFixture.version;

export interface CompilerDiagnostic {
  source: "NORMALIZATION" | "STRUCTURAL" | "SEMANTIC" | "RUNTIME_CAPABILITY";
  code: string;
  path: string;
  message: string;
}

export interface CompilationDraft {
  compilationId: string;
  cacheKey: string;
  normalizedTargetKeys: string[];
  request: LessonAuthoringRequestV2;
}

interface CoreTargetDefinition {
  key: "inu" | "neko" | "te_kudasai";
  aliases: readonly string[];
  input: NormalizedTargetInput;
  manifest: LearningTarget;
  referenceId: string;
}

type DeepMutable<Value> = Value extends readonly (infer Item)[]
  ? DeepMutable<Item>[]
  : Value extends object
    ? { -readonly [Key in keyof Value]: DeepMutable<Value[Key]> }
    : Value;
type MutableLessonManifest = DeepMutable<LessonManifest>;
type MutableCatalogSnapshot = DeepMutable<CatalogSnapshot>;

const CORE_TARGETS: readonly CoreTargetDefinition[] = [
  {
    key: "inu",
    aliases: ["犬", "いぬ"],
    referenceId: "bunbun_core_inu",
    input: {
      targetId: "target_inu",
      kind: "VOCABULARY",
      writtenForm: "犬",
      reading: "いぬ",
      grammarPattern: null,
      supportGlossesVi: ["chó"],
      referenceAuthority: "REVIEWED",
    },
    manifest: {
      targetId: "target_inu",
      kind: "VOCABULARY",
      role: "REQUESTED",
      priority: 5,
      content: {
        kind: "VOCABULARY",
        writtenForms: ["犬"],
        readings: ["いぬ"],
        supportGlosses: ["chó"],
        partOfSpeech: "NOUN",
      },
      referenceIds: ["bunbun_core_inu"],
      goal: targetGoal("PRIMARY"),
    },
  },
  {
    key: "neko",
    aliases: ["猫", "ねこ"],
    referenceId: "bunbun_core_neko",
    input: {
      targetId: "target_neko",
      kind: "VOCABULARY",
      writtenForm: "猫",
      reading: "ねこ",
      grammarPattern: null,
      supportGlossesVi: ["mèo"],
      referenceAuthority: "REVIEWED",
    },
    manifest: {
      targetId: "target_neko",
      kind: "VOCABULARY",
      role: "REQUESTED",
      priority: 5,
      content: {
        kind: "VOCABULARY",
        writtenForms: ["猫"],
        readings: ["ねこ"],
        supportGlosses: ["mèo"],
        partOfSpeech: "NOUN",
      },
      referenceIds: ["bunbun_core_neko"],
      goal: targetGoal("PRIMARY"),
    },
  },
  {
    key: "te_kudasai",
    aliases: ["〜てください", "～てください", "てください"],
    referenceId: "bunbun_core_te_kudasai",
    input: {
      targetId: "target_te_kudasai",
      kind: "GRAMMAR",
      writtenForm: null,
      reading: null,
      grammarPattern: "〜てください",
      supportGlossesVi: ["hãy…", "xin hãy…"],
      referenceAuthority: "REVIEWED",
    },
    manifest: {
      targetId: "target_te_kudasai",
      kind: "GRAMMAR",
      role: "REQUESTED",
      priority: 5,
      content: {
        kind: "GRAMMAR",
        pattern: "〜てください",
        labelJa: "〜てください",
        supportExplanation: "Mẫu yêu cầu lịch sự: hãy hoặc xin hãy làm gì đó.",
      },
      referenceIds: ["bunbun_core_te_kudasai"],
      goal: targetGoal("GRAMMAR"),
    },
  },
];

export class CompilerError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly diagnostics: CompilerDiagnostic[],
    readonly statusCode = 400,
  ) {
    super(message);
  }
}

export function createCompilationDraft(
  targetTexts: readonly string[],
): CompilationDraft {
  const targets = normalizeTargets(targetTexts);
  const normalizedTargetKeys = targets.map((target) => target.key);
  const cacheKey = sha256Canonical({
    targetKeys: normalizedTargetKeys,
    compilerVersion: COMPILER_VERSION,
    authoringContractVersion: AUTHORING_PACKET_VERSION_V2,
    promptPack: APPROVED_AUTHORING_PROMPT_PACK,
    referenceVersion: REFERENCE_VERSION,
    runtimeProfile: "park_small@0.1.0",
  });
  const shortHash = cacheKey.slice(0, 20);
  const input = createAuthoringInput(targets);
  const inputSha256 = sha256Canonical(input);
  const request: LessonAuthoringRequestV2 = {
    packetFormat: AUTHORING_REQUEST_FORMAT,
    packetVersion: AUTHORING_PACKET_VERSION_V2,
    requestId: `m7_compiler_${shortHash}`,
    requestContextId: `park_targets_${shortHash}`,
    attempt: 1,
    repair: null,
    mediaPolicy: "TEXT_ONLY",
    responseFormat: "STRICT_JSON_OBJECT",
    inputHashCanonicalization: AUTHORING_INPUT_HASH_CANONICALIZATION,
    inputSha256,
    promptPack: APPROVED_AUTHORING_PROMPT_PACK.map((module) => ({ ...module })),
    dataPolicy: {
      classification: "LEARNER_TARGETS",
      containsLearnerData: true,
      disclosure: AUTHORING_LEARNER_TARGET_DISCLOSURE_V2,
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
  };
  return {
    compilationId: `compilation_${shortHash}`,
    cacheKey,
    normalizedTargetKeys,
    request,
  };
}

export function compileAuthoringResult(
  request: LessonAuthoringRequestV2,
  result: LessonAuthoringResultV2,
  createdAt: string,
): ValidatedLessonPackage {
  const exchange = validateLessonAuthoringExchangeV2(
    request,
    result,
    sha256Canonical(request.input),
  );
  if (!exchange.ok) {
    throw fromValidationErrors("AUTHORING_EXCHANGE_INVALID", exchange.errors);
  }

  const targetDefinitions = request.input.normalizedTargets.map((target) => {
    const definition = CORE_TARGETS.find(
      (candidate) => candidate.input.targetId === target.targetId,
    );
    if (definition === undefined) {
      throw new CompilerError(
        "UNSUPPORTED_NORMALIZED_TARGET",
        "The request contains a target outside Bunbun Core.",
        [
          diagnostic(
            "NORMALIZATION",
            "UNSUPPORTED_NORMALIZED_TARGET",
            "/input/normalizedTargets",
            `Target '${target.targetId}' is not in bunbun_core@${REFERENCE_VERSION}.`,
          ),
        ],
      );
    }
    return definition;
  });
  const primary =
    targetDefinitions.find((target) => target.key !== "te_kudasai") ??
    CORE_TARGETS[0]!;
  const primaryObjectId = primary.key === "neko" ? "cat" : "dog";
  const otherObjectId = primaryObjectId === "dog" ? "cat" : "dog";
  const primaryKanji = primary.key === "neko" ? "猫" : "犬";
  const primaryReading = primary.key === "neko" ? "ねこ" : "いぬ";
  const story = result.contributions.story;
  const reverse = result.contributions.reverseTraining;
  const coaching = result.contributions.coaching;
  if (
    story.status !== "OK" ||
    reverse.status !== "OK" ||
    coaching.status !== "OK"
  ) {
    throw new CompilerError(
      "INCOMPLETE_AUTHORING_RESULT",
      "All three authoring modules must succeed before compilation.",
      [
        diagnostic(
          "SEMANTIC",
          "INCOMPLETE_AUTHORING_RESULT",
          "/contributions",
          "A CANNOT_COMPLY contribution cannot produce a playable lesson.",
        ),
      ],
    );
  }
  const practice = reverse.value.practiceItems[0];
  const coach = coaching.value.steps[0];
  if (practice === undefined || coach === undefined) {
    throw new CompilerError(
      "AUTHORING_SLOT_MISSING",
      "The required practice or coaching slot is missing.",
      [
        diagnostic(
          "SEMANTIC",
          "AUTHORING_SLOT_MISSING",
          "/contributions",
          "The deterministic arrange_request slot must be present.",
        ),
      ],
    );
  }

  const manifest = structuredClone(
    manifestFixture,
  ) as unknown as MutableLessonManifest;
  const catalog = structuredClone(
    catalogFixture,
  ) as unknown as MutableCatalogSnapshot;
  const identityHash = sha256Canonical({
    targetIds: targetDefinitions.map((target) => target.input.targetId),
    requestInputHash: request.inputSha256,
    compilerVersion: COMPILER_VERSION,
  });
  const shortHash = identityHash.slice(0, 20);
  manifest.manifestId = `manifest_m7_${shortHash}`;
  manifest.lessonId = `lesson_m7_${shortHash}`;
  manifest.revision = 1;
  manifest.createdAt = createdAt;
  manifest.randomSeed = Number.parseInt(identityHash.slice(0, 7), 16);
  manifest.title = { ja: story.value.title.ja, support: story.value.title.vi };
  manifest.learningTargets = targetDefinitions.map((target) => {
    const learningTarget = structuredClone(
      target.manifest,
    ) as DeepMutable<LearningTarget>;
    learningTarget.goal = targetGoal(
      target.key === "te_kudasai"
        ? "GRAMMAR"
        : target.key === primary.key
          ? "PRIMARY"
          : "SECONDARY",
    );
    return learningTarget;
  });
  manifest.scenario = {
    template: request.input.scenarioTemplate as
      "FIND_SOMETHING" | "HELP_SOMEONE",
    objective: {
      ja: story.value.objective.ja,
      support: story.value.objective.vi,
    },
    focusTargetIds: targetDefinitions.map((target) => target.input.targetId),
    synopsis: story.value.synopsis,
  };
  const requestText =
    request.input.practiceSlots[0]?.practiceTextJa ??
    `${primaryKanji}を探してください。`;
  const typeAnswer =
    targetDefinitions.length === 1 && targetDefinitions[0]?.key !== "te_kudasai"
      ? primaryReading
      : requestText;
  manifest.audioAssets = [
    {
      audioAssetId: `audio_request_${shortHash.slice(0, 10)}`,
      textJa: requestText,
      voiceProfileId: "voice_guide_01",
      cacheKey: `bunbun_tts_${identityHash}`,
    },
  ];

  manifest.steps.forEach((step) => {
    const successEvidence = evidenceForPrimitive(step.interaction.type);
    step.targetBindings = targetDefinitions.flatMap((target) => {
      const isPrimary = target.key === primary.key;
      const isGrammar = target.key === "te_kudasai";
      const exposes =
        isPrimary ||
        isGrammar ||
        ["LISTEN", "ARRANGE", "TYPE", "CHOOSE"].includes(step.interaction.type);
      const assesses =
        isPrimary ||
        ["LISTEN", "ARRANGE", "TYPE"].includes(step.interaction.type) ||
        (!isGrammar && step.interaction.type === "CHOOSE");
      return [
        ...(exposes
          ? [{ targetId: target.input.targetId, relation: "EXPOSES" as const }]
          : []),
        ...(assesses
          ? [
              {
                targetId: target.input.targetId,
                relation: "ASSESSES" as const,
                successEvidence,
              },
            ]
          : []),
      ];
    });
  });

  const listen = requiredStep(manifest, "listen_request");
  if (listen.stimulus.utterance !== undefined) {
    listen.stimulus.utterance.textJa = requestText;
    listen.stimulus.utterance.audioAssetId =
      manifest.audioAssets[0]!.audioAssetId;
  }
  const arrange = requiredStep(manifest, "arrange_request");
  arrange.stimulus.instructionJa = coach.instructionJa;
  if (coach.instructionVi !== null) {
    arrange.stimulus.supportText = coach.instructionVi;
  }
  if (arrange.interaction.type === "ARRANGE") {
    arrange.interaction.tokens = practice.arrangeSegmentsJa.map(
      (textJa, index) => ({
        tokenId: `token_${index + 1}`,
        textJa,
      }),
    );
    arrange.interaction.acceptedSequences = [
      arrange.interaction.tokens.map((token) => token.tokenId),
    ];
  }
  arrange.feedback.correct.textJa = coach.correct.textJa;
  if (coach.correct.textVi === null)
    delete arrange.feedback.correct.supportText;
  else arrange.feedback.correct.supportText = coach.correct.textVi;
  arrange.feedback.incorrect.textJa = coach.incorrect.textJa;
  if (coach.incorrect.textVi === null)
    delete arrange.feedback.incorrect.supportText;
  else arrange.feedback.incorrect.supportText = coach.incorrect.textVi;
  arrange.feedback.assisted.textJa = coach.assisted.textJa;
  if (coach.assisted.textVi === null)
    delete arrange.feedback.assisted.supportText;
  else arrange.feedback.assisted.supportText = coach.assisted.textVi;

  adaptPrimaryObject(
    manifest,
    primaryObjectId,
    otherObjectId,
    primaryKanji,
    primaryReading,
    typeAnswer,
  );
  manifest.completion.closingMessage = {
    ja:
      story.value.beats.at(-1)?.context.ja ?? `${primaryKanji}を見つけました。`,
    support:
      story.value.beats.at(-1)?.context.vi ?? "Đã hoàn thành tình huống.",
  };
  manifest.provenance = {
    compilerVersion: COMPILER_VERSION,
    contractVersion: "0.1.0",
    source: "AI_ASSISTED",
    inputHash: `sha256_${request.inputSha256}`,
    promptModuleVersions: request.promptPack.map((module) => ({
      id: module.moduleId,
      version: module.moduleVersion,
    })),
    referenceDataVersions: [{ id: "bunbun_core", version: REFERENCE_VERSION }],
  };
  catalog.catalogId = `bunbun_compiler_catalog_${shortHash}`;
  catalog.referenceRecords = targetDefinitions.map((target) => ({
    referenceId: target.referenceId,
    targetKinds: [target.input.kind],
    providerId: "bunbun_core",
    providerVersion: REFERENCE_VERSION,
  }));

  const validated = validateLessonPackage(manifest, catalog);
  if (!validated.ok) {
    throw fromValidationErrors("COMPILED_PACKAGE_INVALID", validated.errors);
  }
  const runtimeErrors = validateParkRuntimeCapabilities(validated.value);
  if (runtimeErrors.length > 0) {
    throw new CompilerError(
      "COMPILED_RUNTIME_UNSUPPORTED",
      "The compiled package exceeds the local park runtime profile.",
      runtimeErrors.map((error) => ({
        source: "RUNTIME_CAPABILITY",
        ...error,
      })),
    );
  }
  return validated.value;
}

export function createRepairRequest(
  request: LessonAuthoringRequestV2,
  failureStage: "JSON_PARSE" | "STRUCTURAL" | "SEMANTIC",
  priorResponseSha256: string,
  priorResult: LessonAuthoringResultV2 | null,
  diagnostics: readonly CompilerDiagnostic[],
): LessonAuthoringRequestV2 {
  return {
    ...structuredClone(request),
    attempt: 2,
    repair: {
      failureStage,
      priorResponseSha256,
      priorResult,
      diagnostics: diagnostics.slice(0, 24).map((item) => ({
        source: failureStage === "JSON_PARSE" ? "JSON_PARSE" : item.source,
        code: item.code,
        path: item.path,
        message: item.message.slice(0, 320),
      })),
    },
  };
}

function normalizeTargets(
  targetTexts: readonly string[],
): CoreTargetDefinition[] {
  if (targetTexts.length < 1 || targetTexts.length > 3) {
    throw normalizationError(
      "TARGET_COUNT_INVALID",
      "/targets",
      "Enter one to three Bunbun Core targets.",
    );
  }
  const seen = new Set<string>();
  const targets = targetTexts.map((raw, index) => {
    const normalized = raw.normalize("NFKC").trim().replace(/\s+/gu, " ");
    const path = `/targets/${index}`;
    if ([...normalized].length === 0 || [...normalized].length > 40) {
      throw normalizationError(
        "TARGET_LENGTH_INVALID",
        path,
        "Target text must contain 1–40 Unicode characters.",
      );
    }
    if (
      /https?:\/\/|<[^>]+>|```|\b(?:system|assistant|ignore previous)\b/iu.test(
        normalized,
      ) ||
      [...normalized].some((character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint <= 0x1f || codePoint === 0x7f;
      })
    ) {
      throw normalizationError(
        "TARGET_TEXT_UNSAFE",
        path,
        "Target text must be plain Japanese without URLs, markup, controls, or embedded instructions.",
      );
    }
    const target = CORE_TARGETS.find((candidate) =>
      candidate.aliases.some((alias) => alias.normalize("NFKC") === normalized),
    );
    if (target === undefined) {
      throw normalizationError(
        "TARGET_NOT_IN_BUNBUN_CORE",
        path,
        `Unsupported target '${normalized}'. M7 supports only 犬, 猫, and 〜てください.`,
      );
    }
    if (seen.has(target.key)) {
      throw normalizationError(
        "DUPLICATE_TARGET",
        path,
        `Target '${normalized}' duplicates an earlier normalized target.`,
      );
    }
    seen.add(target.key);
    return target;
  });
  return targets;
}

function createAuthoringInput(
  targets: readonly CoreTargetDefinition[],
): LessonAuthoringEnvelopeInputV2 {
  const targetIds = targets.map((target) => target.input.targetId);
  const primary =
    targets.find((target) => target.key !== "te_kudasai") ?? CORE_TARGETS[0]!;
  const primaryLabel = primary.key === "neko" ? "猫" : "犬";
  const primaryCatalogId =
    primary.key === "neko" ? "animal_cat_small" : "animal_dog_small";
  const hasRequestGrammar = targets.some(
    (target) => target.key === "te_kudasai",
  );
  const vocabularyLabels = targets
    .filter((target) => target.key !== "te_kudasai")
    .map((target) => (target.key === "neko" ? "猫" : "犬"));
  const practiceTextJa = `${vocabularyLabels.length > 0 ? vocabularyLabels.join("と") : primaryLabel}を探してください。`;
  return {
    contractVersion: "0.2.0",
    targetLocale: "ja",
    supportLocale: "vi",
    sceneId: "park_small",
    scenarioTemplate: hasRequestGrammar ? "HELP_SOMEONE" : "FIND_SOMETHING",
    normalizedTargets: targets.map((target) => structuredClone(target.input)),
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
            statement: `The guide may politely ask the learner to find the ${primary.key === "neko" ? "cat" : "dog"}.`,
          },
          {
            claimId: "claim_guide_thanks",
            statement:
              "The guide may thank the learner after the requested animal is found.",
          },
        ],
      },
      {
        factId: "fact_primary_animal",
        catalogId: primaryCatalogId,
        kind: "OBJECT",
        labelJa: primaryLabel,
        allowedClaims: [
          {
            claimId: "claim_animal_present",
            statement: "The requested animal is present somewhere in the park.",
          },
          {
            claimId: "claim_animal_found",
            statement:
              "The requested animal can be found by looking around the park.",
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
        requiredTargetIds: targetIds,
        allowedWorldClaimIds: [
          "claim_guide_requests_search",
          "claim_animal_present",
        ],
        maxJapaneseCharacters: 64,
        maxVietnameseCharacters: 125,
      },
      {
        beatId: "turn",
        role: "TURN",
        requiredTargetIds: [],
        allowedWorldClaimIds: ["claim_animal_found"],
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
        targetIds,
        candidateIds: [],
        acceptedCandidateIds: [],
        normalizationRules: ["UNICODE_NFKC", "TRIM"],
        permitsDistractors: false,
        permitsAcceptedText: true,
        permitsArrangeSegments: true,
        maxJapaneseCharacters: 40,
        practiceTextJa,
        acceptedResponsesJa: [practiceTextJa],
      },
    ],
    coachingSlots: [
      {
        stepId: "arrange_request",
        primitive: "ARRANGE",
        difficulty: "GUIDED",
        maximumAttempts: 2,
        feedbackDisplayMs: { correct: 500, incorrect: 650, assisted: 650 },
        targetIds,
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
  };
}

function adaptPrimaryObject(
  manifest: MutableLessonManifest,
  primaryObjectId: "dog" | "cat",
  otherObjectId: "dog" | "cat",
  primaryKanji: string,
  primaryReading: string,
  typeAnswer: string,
): void {
  for (const step of manifest.steps) {
    step.stimulus.instructionJa = (step.stimulus.instructionJa ?? "")
      .replaceAll("犬", primaryKanji)
      .replaceAll("いぬ", primaryReading);
    if (step.stimulus.utterance !== undefined) {
      step.stimulus.utterance.textJa =
        step.stimulus.utterance.textJa.replaceAll("犬", primaryKanji);
    }
    if (primaryObjectId === "cat" && step.stimulus.supportText !== undefined) {
      step.stimulus.supportText = replaceDogSupport(step.stimulus.supportText);
    }
    for (const outcome of [
      step.feedback.correct,
      step.feedback.incorrect,
      step.feedback.assisted,
    ]) {
      outcome.textJa = (outcome.textJa ?? "")
        .replaceAll("犬", primaryKanji)
        .replaceAll("いぬ", primaryReading);
      if (primaryObjectId === "cat") {
        outcome.cueIds = outcome.cueIds.filter(
          (cueId) => !cueId.startsWith("dog_"),
        );
        if (outcome.supportText !== undefined) {
          outcome.supportText = replaceDogSupport(outcome.supportText);
        }
      }
    }
    if (primaryObjectId === "cat") {
      step.presentation.onEnterCueIds = step.presentation.onEnterCueIds.filter(
        (cueId) => !cueId.startsWith("dog_"),
      );
      step.presentation.onSuccessCueIds =
        step.presentation.onSuccessCueIds.filter(
          (cueId) => !cueId.startsWith("dog_"),
        );
      step.presentation.onFailureCueIds =
        step.presentation.onFailureCueIds.filter(
          (cueId) => !cueId.startsWith("dog_"),
        );
    }
    for (const scaffold of step.scaffolds) {
      if (scaffold.kind === "HIGHLIGHT_OBJECTS")
        scaffold.objectIds = [primaryObjectId, otherObjectId];
      if (scaffold.kind === "REDUCE_OBJECT_CANDIDATES")
        scaffold.objectIds = [primaryObjectId];
      if (scaffold.kind === "SHOW_READING")
        scaffold.textJa = `${primaryKanji}（${primaryReading}）`;
      if (primaryObjectId === "cat" && scaffold.kind === "SHOW_MEANING") {
        scaffold.supportText = replaceDogSupport(scaffold.supportText);
      }
    }
    if (
      step.interaction.type === "CLICK_OBJECT" ||
      step.interaction.type === "PICK_UP"
    ) {
      step.interaction.candidateObjectIds = [primaryObjectId, otherObjectId];
      step.interaction.acceptedObjectIds = [primaryObjectId];
    }
    if (step.interaction.type === "TYPE") {
      step.interaction.acceptedAnswers = [typeAnswer];
      step.stimulus.instructionJa =
        typeAnswer === primaryReading
          ? `${primaryKanji}の読み方を入力してください。`
          : "依頼の文を日本語で入力してください。";
      for (const scaffold of step.scaffolds) {
        if (scaffold.kind === "SHOW_READING") scaffold.textJa = typeAnswer;
      }
    }
    if (step.interaction.type === "GIVE") {
      step.interaction.candidateObjectIds = [primaryObjectId];
      step.interaction.acceptedPairs = [
        { objectId: primaryObjectId, recipientEntityId: "guide" },
      ];
    }
    if (step.interaction.type === "CHOOSE") {
      step.interaction.options = [
        { optionId: `choice_${primaryObjectId}`, textJa: primaryKanji },
        {
          optionId: `choice_${otherObjectId}`,
          textJa: primaryKanji === "犬" ? "猫" : "犬",
        },
      ];
      step.interaction.acceptedOptionIds = [`choice_${primaryObjectId}`];
      for (const scaffold of step.scaffolds) {
        if (scaffold.kind === "REDUCE_CHOICE_CANDIDATES")
          scaffold.optionIds = [`choice_${primaryObjectId}`];
      }
    }
  }
}

function replaceDogSupport(value: string): string {
  return value
    .replaceAll("chú chó", "chú mèo")
    .replaceAll("con chó", "con mèo")
    .replaceAll("chó", "mèo")
    .replaceAll("dog", "cat");
}

function evidenceForPrimitive(
  type: LessonManifest["steps"][number]["interaction"]["type"],
) {
  switch (type) {
    case "LISTEN":
      return "heard" as const;
    case "ARRANGE":
      return "arranged_correctly" as const;
    case "TYPE":
      return "actively_produced" as const;
    default:
      return "selected_correctly" as const;
  }
}

function requiredStep(manifest: MutableLessonManifest, stepId: string) {
  const step = manifest.steps.find((candidate) => candidate.stepId === stepId);
  if (step === undefined)
    throw new Error(`Compiler profile step '${stepId}' is missing.`);
  return step;
}

function targetGoal(
  profile: "PRIMARY" | "SECONDARY" | "GRAMMAR",
): LearningTarget["goal"] {
  if (profile === "SECONDARY") {
    return {
      minimumEncounters: 4,
      minimumContexts: 4,
      desiredEvidence: [
        "heard",
        "arranged_correctly",
        "selected_correctly",
        "actively_produced",
      ],
    };
  }
  if (profile === "GRAMMAR") {
    return {
      minimumEncounters: 8,
      minimumContexts: 5,
      desiredEvidence: ["heard", "arranged_correctly", "actively_produced"],
    };
  }
  return {
    minimumEncounters: 8,
    minimumContexts: 5,
    desiredEvidence: [
      "heard",
      "arranged_correctly",
      "selected_correctly",
      "actively_produced",
    ],
  };
}

function normalizationError(
  code: string,
  path: string,
  message: string,
): CompilerError {
  return new CompilerError(code, message, [
    diagnostic("NORMALIZATION", code, path, message),
  ]);
}

function fromValidationErrors(
  code: string,
  errors: readonly { code: string; path: string; message: string }[],
): CompilerError {
  return new CompilerError(
    code,
    "Bunbun rejected the untrusted authoring content.",
    errors.map((error) => ({ source: "SEMANTIC", ...error })),
  );
}

function diagnostic(
  source: CompilerDiagnostic["source"],
  code: string,
  path: string,
  message: string,
): CompilerDiagnostic {
  return { source, code, path, message };
}

function sha256Canonical(value: unknown): string {
  return createHash("sha256")
    .update(canonicalJson(value), "utf8")
    .digest("hex");
}
