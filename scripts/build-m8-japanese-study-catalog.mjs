import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import kuromoji from "kuromoji";
import { toHiragana, toRomaji } from "wanakana";

const root = resolve(import.meta.dirname, "..");
const manifestPath = resolve(
  root,
  "packages/contracts/fixtures/manifests/m8-last-train.json",
);
const outputPath = resolve(
  root,
  process.argv[2] ??
    ".bunbun-data/reference-intake/japanese-study/v1/m8-last-train-study-candidate.json",
);

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const tokenizer = await new Promise((resolveBuilder, rejectBuilder) => {
  kuromoji
    .builder({ dicPath: resolve(root, "node_modules/kuromoji/dict") })
    .build((error, builtTokenizer) => {
      if (error) rejectBuilder(error);
      else resolveBuilder(builtTokenizer);
    });
});

const vocabulary = new Map(
  [
    ["財布", "ví"],
    ["探す", "tìm kiếm"],
    ["終電", "chuyến tàu cuối"],
    ["分", "phút"],
    ["傘", "ô"],
    ["駅", "ga"],
    ["公園", "công viên"],
    ["猫", "mèo"],
    ["店", "cửa hàng"],
    ["中", "bên trong"],
    ["端", "rìa; mép"],
    ["話", "câu chuyện; lời nói"],
    ["聞く", "nghe; hỏi"],
    ["助ける", "giúp đỡ"],
    ["依頼", "lời yêu cầu; lời nhờ"],
    ["文字", "chữ viết; ký tự"],
    ["見る", "nhìn; xem"],
    ["文", "câu văn"],
    ["順番", "thứ tự"],
    ["語順", "trật tự từ"],
    ["田中", "Tanaka (tên người)"],
    ["合う", "phù hợp"],
    ["選ぶ", "chọn"],
    ["通り", "đúng như; theo như"],
    ["間違える", "nhầm; làm sai"],
    ["確認", "xác nhận; kiểm tra"],
    ["丁寧", "lịch sự; cẩn thận"],
    ["頼む", "nhờ; yêu cầu"],
    ["行く", "đi"],
    ["着く", "đến nơi"],
    ["場所", "địa điểm"],
    ["考える", "suy nghĩ"],
    ["拾う", "nhặt"],
    ["見つける", "tìm thấy"],
    ["渡す", "trao; đưa"],
    ["返す", "trả lại"],
    ["書く", "viết"],
    ["終わる", "kết thúc"],
  ].map(([dictionaryFormJa, meaningVi]) => [
    dictionaryFormJa,
    { dictionaryFormJa, meaningVi },
  ]),
);

const readingOverrides = new Map([
  ["終電まであと3分", "しゅうでん まで あと さんぷん"],
  [
    "財布を探して、あおいを助けてください。",
    "さいふ を さがして、あおい を たすけて ください。",
  ],
  ["あおいの話を聞いてください。", "あおい の はなし を きいて ください。"],
  [
    "財布がありません。終電まであと三分です。財布を探してください。",
    "さいふ が ありません。しゅうでん まで あと さんぷん です。さいふ を さがして ください。",
  ],
  ["依頼が分かりました。", "いらい が わかりました。"],
  ["もう一度聞いてください。", "もう いちど きいて ください。"],
  ["文字も見て進みましょう。", "もじ も みて すすみましょう。"],
  [
    "文を正しい順番にしてください。",
    "ぶん を ただしい じゅんばん に して ください。",
  ],
  ["［もの］を探してください。", "［もの］を さがして ください。"],
  ["財布を探してください。", "さいふ を さがして ください。"],
  ["語順をもう一度見てください。", "ごじゅん を もう いちど みて ください。"],
  [
    "田中さんの話に合う文を選んでください。",
    "たなかさん の はなし に あう ぶん を えらんで ください。",
  ],
  [
    "この傘はあおいさんの傘ではありません。店の中に入ってはいけません。",
    "この かさ は あおいさん の かさ では ありません。みせ の なか に はいって は いけません。",
  ],
  [
    "その通りです。傘を間違えました。",
    "その とおり です。かさ を まちがえました。",
  ],
  [
    "傘と店のルールを確認してください。",
    "かさ と みせ の るーる を かくにんして ください。",
  ],
  [
    "この傘はあおいさんのものではありません。",
    "この かさ は あおいさん の もの では ありません。",
  ],
  [
    "田中さんに、財布を探すように丁寧に頼んでください。",
    "たなかさん に、さいふ を さがす ように ていねいに たのんで ください。",
  ],
  ["財布を［動詞のて形］ください。", "さいふ を［どうし の てけい］ください。"],
  ["財布（さいふ）を探（さが）してください。", "さいふ を さがして ください。"],
  [
    "丁寧な依頼をもう一度書いてください。",
    "ていねいな いらい を もう いちど かいて ください。",
  ],
  ["公園の端へ行ってください。", "こうえん の はし へ いって ください。"],
  [
    "猫が公園のほうへ行きました。公園を見てください。",
    "ねこ が こうえん の ほう へ いきました。こうえん を みて ください。",
  ],
  ["公園の端に着きました。", "こうえん の はし に つきました。"],
  [
    "猫が行った場所を考えてください。",
    "ねこ が いった ばしょ を かんがえて ください。",
  ],
  ["公園の端へ行きましょう。", "こうえん の はし へ いきましょう。"],
  ["モモを選んでください。", "もも を えらんで ください。"],
  ["モモが財布のそばにいます。", "もも が さいふ の そば に います。"],
  ["猫のモモを探してください。", "ねこ の もも を さがして ください。"],
  ["この猫がモモです。", "この ねこ が もも です。"],
  ["財布を拾ってください。", "さいふ を ひろって ください。"],
  ["財布を見つけました。", "さいふ を みつけました。"],
  ["モモのそばを見てください。", "もも の そば を みて ください。"],
  ["この財布を拾いましょう。", "この さいふ を ひろいましょう。"],
  ["財布をあおいに渡してください。", "さいふ を あおい に わたして ください。"],
  ["財布をあおいに返しました。", "さいふ を あおい に かえしました。"],
  ["財布をあおいに渡します。", "さいふ を あおい に わたします。"],
  [
    "ありがとうございます。財布が見つかりました。これで駅へ行けます。",
    "ありがとうございます。さいふ が みつかりました。これで えき へ いけます。",
  ],
  ["あおいを助けました。", "あおい を たすけました。"],
  ["文字も見て終わりましょう。", "もじ も みて おわりましょう。"],
  [
    "財布を返して、あおいを助けました。",
    "さいふ を かえして、あおい を たすけました。",
  ],
]);

const grammarRules = [
  {
    entryId: "grammar_te_kudasai",
    matches: (text) =>
      text.includes("てください") ||
      text.includes("でください") ||
      text.includes("動詞のて形"),
    patternJa: "動詞のて形＋ください",
    labelVi: "Lời yêu cầu lịch sự",
    explanationVi:
      "Đổi động từ sang thể て rồi thêm ください để nói ‘xin hãy làm…’. Ví dụ: 探す → 探して → 探してください。",
  },
  {
    entryId: "grammar_tewa_ikenai",
    matches: (text) => text.includes("てはいけません"),
    patternJa: "動詞のて形＋はいけません",
    labelVi: "Không được phép",
    explanationVi:
      "Dùng để nói một hành động bị cấm hoặc không được phép thực hiện.",
  },
  {
    entryId: "grammar_dewa_arimasen",
    matches: (text) => text.includes("ではありません"),
    patternJa: "名詞＋ではありません",
    labelVi: "Phủ định lịch sự của danh từ",
    explanationVi:
      "Đặt ではありません sau danh từ để nói ‘không phải là…’ một cách lịch sự.",
  },
  {
    entryId: "grammar_you_ni_tanomu",
    matches: (text) => text.includes("ように") && text.includes("頼"),
    patternJa: "普通形＋ように頼む",
    labelVi: "Nhờ ai làm một việc",
    explanationVi:
      "ように đứng trước 頼む để diễn đạt việc nhờ hoặc yêu cầu người khác thực hiện hành động.",
  },
  {
    entryId: "grammar_mou_ichido",
    matches: (text) => text.includes("もう一度"),
    patternJa: "もう一度＋動詞",
    labelVi: "Làm lại một lần nữa",
    explanationVi:
      "もう一度 có nghĩa là ‘một lần nữa’, đặt trước động từ chỉ hành động cần lặp lại.",
  },
];

const textUnits = collectTextUnits(manifest);
const audioByText = new Map(
  manifest.audioAssets.map((asset) => [asset.textJa, asset.audioAssetId]),
);
const records = textUnits.map(({ textId, textJa }) => {
  const tokens = tokenizer.tokenize(textJa);
  const readingKana = readingOverrides.get(textJa) ?? readingFromTokens(tokens);
  const seenVocabulary = new Set();
  const reviewedVocabulary = [];
  for (const token of tokens) {
    const dictionaryFormJa =
      token.surface_form === "行っ" && textJa.includes("行った")
        ? "行く"
        : token.basic_form === "*"
          ? token.surface_form
          : token.basic_form;
    const qualified = vocabulary.get(dictionaryFormJa);
    if (qualified === undefined || seenVocabulary.has(dictionaryFormJa)) {
      continue;
    }
    seenVocabulary.add(dictionaryFormJa);
    reviewedVocabulary.push({
      entryId: `vocab_${slug(dictionaryFormJa)}`,
      surfaceJa: token.surface_form,
      dictionaryFormJa,
      readingKana: toHiragana(token.reading ?? token.surface_form),
      partOfSpeech: partOfSpeech(token.pos),
      meaningVi: qualified.meaningVi,
    });
  }
  const audioAssetId = audioByText.get(textJa);
  return {
    textId,
    textSha256: sha256(textJa),
    textJa,
    readingKana,
    romaji: spacedRomaji(readingKana),
    vocabulary: reviewedVocabulary,
    grammar: grammarRules
      .filter((rule) => rule.matches(textJa))
      .map((rule) => ({
        entryId: rule.entryId,
        patternJa: rule.patternJa,
        labelVi: rule.labelVi,
        explanationVi: rule.explanationVi,
      })),
    ...(audioAssetId === undefined ? {} : { audioAssetId }),
  };
});

const catalog = {
  schemaVersion: "0.1.0",
  catalogId: "m8_last_train_japanese_study",
  lessonId: manifest.lessonId,
  lessonRevision: manifest.revision,
  sources: [{ sourceId: "bunbun_core", version: "1.0.0", role: "CONTENT" }],
  records,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      outputPath,
      records: records.length,
      bytes: Buffer.byteLength(JSON.stringify(catalog)),
      sha256: sha256(JSON.stringify(catalog)),
    },
    null,
    2,
  ),
);

function collectTextUnits(input) {
  const units = [];
  const seen = new Set();
  const add = (textId, textJa) => {
    if (typeof textJa !== "string" || textJa.length === 0 || seen.has(textJa)) {
      return;
    }
    seen.add(textJa);
    units.push({ textId, textJa });
  };
  add("lesson_title", input.title.ja);
  add("lesson_objective", input.scenario.objective.ja);
  for (const step of input.steps) {
    add(`${step.stepId}_instruction`, step.stimulus.instructionJa);
    add(`${step.stepId}_utterance`, step.stimulus.utterance?.textJa);
    for (const scaffold of step.scaffolds) {
      add(`${scaffold.scaffoldId}_hint`, scaffold.textJa);
    }
    for (const [kind, feedback] of Object.entries(step.feedback)) {
      add(`${step.stepId}_${kind}_feedback`, feedback.textJa);
    }
  }
  add("lesson_completion", input.completion.closingMessage?.ja);
  return units;
}

function readingFromTokens(tokens) {
  let result = "";
  for (const token of tokens) {
    const reading = toHiragana(token.reading ?? token.surface_form);
    if (/^[。、！？,.!?）］】]$/u.test(reading)) {
      result = `${result.trimEnd()}${reading}`;
    } else if (/^[（［【]$/u.test(reading)) {
      result += reading;
    } else {
      result += `${result.length === 0 || /[（［【]$/u.test(result) ? "" : " "}${reading}`;
    }
  }
  return result.trim();
}

function spacedRomaji(readingKana) {
  return toRomaji(readingKana)
    .replace(/\s+([。、！？,.!?])/gu, "$1")
    .replace(/\s+/gu, " ")
    .replace(/\bha\b/gu, "wa")
    .replace(/\bhe\b/gu, "e")
    .replace(/\bwo\b/gu, "o")
    .trim();
}

function partOfSpeech(value) {
  return (
    {
      名詞: "NOUN",
      動詞: "VERB",
      形容詞: "ADJECTIVE",
      副詞: "ADVERB",
      助詞: "PARTICLE",
      助動詞: "AUXILIARY",
    }[value] ?? "OTHER"
  );
}

function slug(value) {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
