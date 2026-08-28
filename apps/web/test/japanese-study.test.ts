import assert from "node:assert/strict";
import test from "node:test";

import { loadLastTrainLesson } from "../src/lesson/content.js";
import {
  japaneseStudyUnavailableReason,
  loadM8JapaneseStudyIndex,
} from "../src/lesson/japanese-study.js";

test("M8 study catalog covers the opening sentence with reviewed learning tools", () => {
  const { manifest } = loadLastTrainLesson(false);
  const index = loadM8JapaneseStudyIndex(manifest);
  const opening = index.find(
    "財布がありません。終電まであと三分です。財布を探してください。",
  );

  assert.ok(opening);
  assert.equal(opening.audioAssetId, "audio_aoi_opening");
  assert.equal(
    opening.readingKana,
    "さいふ が ありません。しゅうでん まで あと さんぷん です。さいふ を さがして ください。",
  );
  assert.ok(opening.romaji.includes("sanpun"));
  assert.ok(
    opening.vocabulary.some(
      (entry) => entry.dictionaryFormJa === "財布" && entry.meaningVi === "ví",
    ),
  );
  assert.ok(
    opening.grammar.some((entry) => entry.patternJa === "動詞のて形＋ください"),
  );
});

test("M8 study catalog exposes the requested pattern pronunciation", () => {
  const { manifest } = loadLastTrainLesson(false);
  const index = loadM8JapaneseStudyIndex(manifest);
  const pattern = index.find("財布を［動詞のて形］ください。");

  assert.ok(pattern);
  assert.equal(pattern.readingKana, "さいふ を［どうし の てけい］ください。");
  assert.ok(
    pattern.grammar.some((entry) => entry.explanationVi.includes("thể て")),
  );
  assert.equal(
    japaneseStudyUnavailableReason(pattern, "AUDIO"),
    "Câu này chưa có âm thanh đã duyệt.",
  );
});

test("study catalog reports explicit unavailable states instead of remote fallback", () => {
  const { manifest } = loadLastTrainLesson(false);
  const index = loadM8JapaneseStudyIndex(manifest);
  const title = index.find("終電まであと3分");

  assert.ok(title);
  assert.equal(
    japaneseStudyUnavailableReason(title, "GRAMMAR"),
    "Câu này chưa có ghi chú ngữ pháp riêng.",
  );
  assert.equal(
    japaneseStudyUnavailableReason(undefined, "READING"),
    "Chưa có dữ liệu đã duyệt cho câu này.",
  );
});

test("M8 study catalog audio bindings match exact approved manifest text", () => {
  const { manifest } = loadLastTrainLesson(false);
  const index = loadM8JapaneseStudyIndex(manifest);

  for (const audio of manifest.audioAssets) {
    assert.equal(index.find(audio.textJa)?.audioAssetId, audio.audioAssetId);
  }
});
