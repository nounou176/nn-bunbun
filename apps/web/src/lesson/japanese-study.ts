import {
  validateJapaneseTextStudyCatalogStructure,
  type JapaneseTextStudyCatalog,
  type JapaneseTextStudyRecord,
  type LessonManifest,
} from "@bunbun/contracts";
import studyCatalogFixture from "@bunbun/contracts/fixtures/m8-last-train-study-catalog" with { type: "json" };

export interface JapaneseStudyIndex {
  catalog: JapaneseTextStudyCatalog;
  find: (textJa: string) => JapaneseTextStudyRecord | undefined;
}

export function loadM8JapaneseStudyIndex(
  manifest: LessonManifest,
): JapaneseStudyIndex {
  const input = structuredClone(studyCatalogFixture) as unknown;
  const structural = validateJapaneseTextStudyCatalogStructure(input);
  if (!structural.ok) {
    const first = structural.errors[0];
    throw new Error(
      first === undefined
        ? "The Japanese study catalog did not pass validation."
        : `${first.code} at ${first.path}: ${first.message}`,
    );
  }
  const catalog = structural.value;
  if (
    catalog.lessonId !== manifest.lessonId ||
    catalog.lessonRevision !== manifest.revision
  ) {
    throw new Error(
      "The Japanese study catalog targets another lesson revision.",
    );
  }

  const recordsByText = new Map<string, JapaneseTextStudyRecord>();
  for (const record of catalog.records) {
    if (recordsByText.has(record.textJa)) {
      throw new Error(`Japanese study text '${record.textJa}' is duplicated.`);
    }
    if (record.audioAssetId !== undefined) {
      const audio = manifest.audioAssets.find(
        (candidate) => candidate.audioAssetId === record.audioAssetId,
      );
      if (audio?.textJa !== record.textJa) {
        throw new Error(
          `Japanese study audio '${record.audioAssetId}' does not match its exact text.`,
        );
      }
    }
    recordsByText.set(record.textJa, record);
  }

  return {
    catalog,
    find: (textJa) => recordsByText.get(textJa),
  };
}

export function japaneseStudyUnavailableReason(
  record: JapaneseTextStudyRecord | undefined,
  section: "AUDIO" | "READING" | "VOCABULARY" | "GRAMMAR",
): string | undefined {
  if (record === undefined) return "Chưa có dữ liệu đã duyệt cho câu này.";
  switch (section) {
    case "AUDIO":
      return record.audioAssetId === undefined
        ? "Câu này chưa có âm thanh đã duyệt."
        : undefined;
    case "READING":
      return undefined;
    case "VOCABULARY":
      return record.vocabulary.length === 0
        ? "Câu này chưa có mục từ cần giải thích."
        : undefined;
    case "GRAMMAR":
      return record.grammar.length === 0
        ? "Câu này chưa có ghi chú ngữ pháp riêng."
        : undefined;
  }
}
