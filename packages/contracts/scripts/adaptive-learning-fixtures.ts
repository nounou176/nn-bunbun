import type {
  LearningTarget,
  LearningTargetRegistry,
  LearningTargetSelector,
} from "../src/schema/index.js";
import { canonicalLearningTargetContentSignature } from "../src/validation/adaptive-learning.js";

const coreDogContent = {
  kind: "VOCABULARY",
  writtenForms: ["犬"],
  readings: ["いぬ"],
  supportGlosses: ["chó"],
  partOfSpeech: "NOUN",
} as const satisfies LearningTarget["content"];

const coreCatContent = {
  kind: "VOCABULARY",
  writtenForms: ["猫"],
  readings: ["ねこ"],
  supportGlosses: ["mèo"],
  partOfSpeech: "NOUN",
} as const satisfies LearningTarget["content"];

const coreTeKudasaiContent = {
  kind: "GRAMMAR",
  pattern: "〜てください",
  labelJa: "〜てください",
  supportExplanation: "Mẫu yêu cầu lịch sự: hãy hoặc xin hãy làm gì đó.",
} as const satisfies LearningTarget["content"];

const lastTrainWalletContent = {
  kind: "VOCABULARY",
  writtenForms: ["財布"],
  readings: ["さいふ"],
  supportGlosses: ["ví"],
  partOfSpeech: "NOUN",
} as const satisfies LearningTarget["content"];

const lastTrainSearchContent = {
  kind: "VOCABULARY",
  writtenForms: ["探す"],
  readings: ["さがす"],
  supportGlosses: ["tìm kiếm"],
  partOfSpeech: "VERB",
} as const satisfies LearningTarget["content"];

const lastTrainTeKudasaiContent = {
  kind: "GRAMMAR",
  pattern: "～てください",
  labelJa: "丁寧な依頼",
  supportExplanation: "Dùng để đưa ra một yêu cầu lịch sự: xin hãy làm…",
} as const satisfies LearningTarget["content"];

const lastTrainUmbrellaContent = {
  kind: "VOCABULARY",
  writtenForms: ["傘"],
  readings: ["かさ"],
  supportGlosses: ["ô"],
  partOfSpeech: "NOUN",
} as const satisfies LearningTarget["content"];

const lastTrainStationContent = {
  kind: "VOCABULARY",
  writtenForms: ["駅"],
  readings: ["えき"],
  supportGlosses: ["ga"],
  partOfSpeech: "NOUN",
} as const satisfies LearningTarget["content"];

const lastTrainTewaIkenaiContent = {
  kind: "GRAMMAR",
  pattern: "～てはいけない",
  labelJa: "禁止",
  supportExplanation: "Dùng để nói rằng không được phép làm một việc.",
} as const satisfies LearningTarget["content"];

const testKanjiContent = {
  kind: "KANJI",
  character: "学",
  readings: ["がく", "まなぶ"],
  supportGlosses: ["học"],
} as const satisfies LearningTarget["content"];

export const projectLearningTargetRegistry = {
  contractType: "LEARNING_TARGET_REGISTRY",
  schemaVersion: "0.1.0",
  registryId: "bunbun_learning_targets",
  registryVersion: "0.1.0",
  provenance: {
    source: "PROJECT_AUTHORED",
    statement:
      "Exact aliases for reviewed Bunbun Core and M8 Last Train targets. No text heuristic or external linguistic dataset is used.",
  },
  concepts: [
    {
      conceptKey: "vocabulary_dog",
      targetKind: "VOCABULARY",
      labelJa: "犬",
      supportLabel: "chó",
      selectors: [
        selector(
          "bunbun_core",
          "0.1.0",
          "bunbun_core_inu",
          "VOCABULARY",
          coreDogContent,
        ),
      ],
      compilerPrefillText: "犬",
    },
    {
      conceptKey: "vocabulary_cat",
      targetKind: "VOCABULARY",
      labelJa: "猫",
      supportLabel: "mèo",
      selectors: [
        selector(
          "bunbun_core",
          "0.1.0",
          "bunbun_core_neko",
          "VOCABULARY",
          coreCatContent,
        ),
      ],
      compilerPrefillText: "猫",
    },
    {
      conceptKey: "grammar_te_kudasai",
      targetKind: "GRAMMAR",
      labelJa: "～てください",
      supportLabel: "yêu cầu lịch sự",
      selectors: [
        selector(
          "bunbun_core",
          "0.1.0",
          "bunbun_core_te_kudasai",
          "GRAMMAR",
          coreTeKudasaiContent,
        ),
        selector(
          "bunbun_core",
          "1.0.0",
          "bunbun_grammar_te_kudasai",
          "GRAMMAR",
          lastTrainTeKudasaiContent,
        ),
      ],
      compilerPrefillText: "〜てください",
    },
    {
      conceptKey: "vocabulary_wallet",
      targetKind: "VOCABULARY",
      labelJa: "財布",
      supportLabel: "ví",
      selectors: [
        selector(
          "bunbun_core",
          "1.0.0",
          "bunbun_vocab_wallet",
          "VOCABULARY",
          lastTrainWalletContent,
        ),
      ],
    },
    {
      conceptKey: "vocabulary_search",
      targetKind: "VOCABULARY",
      labelJa: "探す",
      supportLabel: "tìm kiếm",
      selectors: [
        selector(
          "bunbun_core",
          "1.0.0",
          "bunbun_vocab_search",
          "VOCABULARY",
          lastTrainSearchContent,
        ),
      ],
    },
    {
      conceptKey: "vocabulary_umbrella",
      targetKind: "VOCABULARY",
      labelJa: "傘",
      supportLabel: "ô",
      selectors: [
        selector(
          "bunbun_core",
          "1.0.0",
          "bunbun_vocab_umbrella",
          "VOCABULARY",
          lastTrainUmbrellaContent,
        ),
      ],
    },
    {
      conceptKey: "vocabulary_station",
      targetKind: "VOCABULARY",
      labelJa: "駅",
      supportLabel: "ga",
      selectors: [
        selector(
          "bunbun_core",
          "1.0.0",
          "bunbun_vocab_station",
          "VOCABULARY",
          lastTrainStationContent,
        ),
      ],
    },
    {
      conceptKey: "grammar_tewa_ikenai",
      targetKind: "GRAMMAR",
      labelJa: "～てはいけない",
      supportLabel: "không được phép",
      selectors: [
        selector(
          "bunbun_core",
          "1.0.0",
          "bunbun_grammar_tewa_ikenai",
          "GRAMMAR",
          lastTrainTewaIkenaiContent,
        ),
      ],
    },
  ],
} as const satisfies LearningTargetRegistry;

export const testKanjiReferenceRegistry = {
  contractType: "LEARNING_TARGET_REGISTRY",
  schemaVersion: "0.1.0",
  registryId: "test_kanji_reference_registry",
  registryVersion: "0.1.0",
  provenance: {
    source: "PROJECT_AUTHORED",
    statement:
      "Test-only project-authored provenance fixture; not production lesson or dictionary content.",
  },
  concepts: [
    {
      conceptKey: "kanji_gaku_test",
      targetKind: "KANJI",
      labelJa: "学",
      supportLabel: "học",
      selectors: [
        selector(
          "bunbun_fixture",
          "0.1.0",
          "bunbun_fixture_kanji_gaku",
          "KANJI",
          testKanjiContent,
        ),
      ],
      referenceAid: {
        aidKind: "REFERENCE",
        character: "学",
        readings: ["がく", "まなぶ"],
        providerId: "bunbun_fixture",
        providerVersion: "0.1.0",
        referenceId: "bunbun_fixture_kanji_gaku",
      },
    },
  ],
} as const satisfies LearningTargetRegistry;

function selector(
  providerId: string,
  providerVersion: string,
  referenceId: string,
  targetKind: LearningTarget["kind"],
  content: LearningTarget["content"],
): LearningTargetSelector {
  return {
    providerId,
    providerVersion,
    referenceId,
    targetKind,
    contentSignature: canonicalLearningTargetContentSignature(content),
  };
}
