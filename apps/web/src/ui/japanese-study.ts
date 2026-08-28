import type { JapaneseTextStudyRecord } from "@bunbun/contracts";

import { japaneseStudyUnavailableReason } from "../lesson/japanese-study.js";

export type JapaneseStudySlot =
  "instruction" | "utterance" | "hint" | "feedback";

export function japaneseStudyToolsMarkup(slot: JapaneseStudySlot): string {
  return `
    <section class="japanese-study-tools" data-study-slot="${slot}" aria-label="Công cụ học câu tiếng Nhật" hidden>
      <div class="japanese-study-actions">
        <button type="button" data-study-action="AUDIO" aria-label="Nghe câu tiếng Nhật">▶ <span>Nghe</span></button>
        <button type="button" data-study-action="READING" aria-expanded="false">あ <span>Phiên âm</span></button>
        <button type="button" data-study-action="VOCABULARY" aria-expanded="false">語 <span>Từ vựng</span></button>
        <button type="button" data-study-action="GRAMMAR" aria-expanded="false">文 <span>Ngữ pháp</span></button>
      </div>
      <div class="japanese-study-panel" data-study-panel hidden>
        <p class="japanese-study-panel-title" data-study-title></p>
        <div data-study-content></div>
      </div>
    </section>
  `;
}

export function bindJapaneseStudyTools(root: HTMLElement): void {
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>("[data-study-action]");
    if (button === null || button.disabled) return;
    const action = button.dataset.studyAction;
    if (action === undefined || action === "AUDIO") return;
    const tools = button.closest<HTMLElement>("[data-study-slot]");
    if (tools === null) return;
    const panel = required<HTMLElement>(tools, "[data-study-panel]");
    const opening = tools.dataset.openStudyAction !== action || panel.hidden;
    tools.dataset.openStudyAction = opening ? action : "";
    panel.hidden = !opening;
    tools
      .querySelectorAll<HTMLButtonElement>("[data-study-action]")
      .forEach((candidate) => {
        if (candidate.dataset.studyAction !== "AUDIO") {
          candidate.setAttribute(
            "aria-expanded",
            String(opening && candidate.dataset.studyAction === action),
          );
        }
      });
    if (opening) renderPanel(tools, action, readRecord(tools));
  });
}

const records = new WeakMap<HTMLElement, JapaneseTextStudyRecord | undefined>();

export function renderJapaneseStudyTools(
  root: HTMLElement,
  slot: JapaneseStudySlot,
  record: JapaneseTextStudyRecord | undefined,
  visible: boolean,
): void {
  const tools = required<HTMLElement>(root, `[data-study-slot="${slot}"]`);
  tools.hidden = !visible;
  if (!visible) return;

  const nextKey = record?.textId ?? "unavailable";
  if (tools.dataset.studyTextId !== nextKey) {
    tools.dataset.studyTextId = nextKey;
    tools.dataset.openStudyAction = "";
    required<HTMLElement>(tools, "[data-study-panel]").hidden = true;
    tools
      .querySelectorAll<HTMLButtonElement>("[data-study-action]")
      .forEach((button) => button.setAttribute("aria-expanded", "false"));
  }
  records.set(tools, record);

  const audioButton = required<HTMLButtonElement>(
    tools,
    '[data-study-action="AUDIO"]',
  );
  const audioUnavailable = japaneseStudyUnavailableReason(record, "AUDIO");
  audioButton.disabled = audioUnavailable !== undefined;
  audioButton.title = audioUnavailable ?? "Phát âm thanh tiếng Nhật đã duyệt";
  if (record?.audioAssetId === undefined) {
    delete audioButton.dataset.studyAudioAssetId;
  } else {
    audioButton.dataset.studyAudioAssetId = record.audioAssetId;
  }

  const openAction = tools.dataset.openStudyAction;
  if (openAction !== undefined && openAction.length > 0) {
    renderPanel(tools, openAction, record);
  }
}

function renderPanel(
  tools: HTMLElement,
  action: string,
  record: JapaneseTextStudyRecord | undefined,
): void {
  const title = required<HTMLElement>(tools, "[data-study-title]");
  const content = required<HTMLElement>(tools, "[data-study-content]");
  content.replaceChildren();

  switch (action) {
    case "READING": {
      title.textContent = "Cách đọc / 読み方";
      const unavailable = japaneseStudyUnavailableReason(record, "READING");
      if (unavailable !== undefined)
        return appendUnavailable(content, unavailable);
      appendLine(content, "Kana", record!.readingKana, "ja");
      appendLine(content, "Romaji", record!.romaji);
      return;
    }
    case "VOCABULARY": {
      title.textContent = "Từ vựng / 単語";
      const unavailable = japaneseStudyUnavailableReason(record, "VOCABULARY");
      if (unavailable !== undefined)
        return appendUnavailable(content, unavailable);
      const list = document.createElement("dl");
      list.className = "japanese-study-list";
      for (const entry of record!.vocabulary) {
        const term = document.createElement("dt");
        term.lang = "ja";
        term.textContent = `${entry.surfaceJa}（${entry.readingKana}）`;
        const meaning = document.createElement("dd");
        meaning.textContent = `${entry.meaningVi} · ${partOfSpeechLabel(entry.partOfSpeech)}`;
        list.append(term, meaning);
      }
      content.append(list);
      return;
    }
    case "GRAMMAR": {
      title.textContent = "Ngữ pháp / 文法";
      const unavailable = japaneseStudyUnavailableReason(record, "GRAMMAR");
      if (unavailable !== undefined)
        return appendUnavailable(content, unavailable);
      for (const entry of record!.grammar) {
        const item = document.createElement("article");
        item.className = "japanese-study-grammar";
        const pattern = document.createElement("p");
        pattern.lang = "ja";
        pattern.textContent = entry.patternJa;
        const label = document.createElement("strong");
        label.textContent = entry.labelVi;
        const explanation = document.createElement("p");
        explanation.textContent = entry.explanationVi;
        item.append(pattern, label, explanation);
        content.append(item);
      }
      return;
    }
  }
}

function appendLine(
  parent: HTMLElement,
  label: string,
  value: string,
  lang?: string,
): void {
  const line = document.createElement("p");
  const key = document.createElement("strong");
  key.textContent = `${label}: `;
  const text = document.createElement("span");
  if (lang !== undefined) text.lang = lang;
  text.textContent = value;
  line.append(key, text);
  parent.append(line);
}

function appendUnavailable(parent: HTMLElement, message: string): void {
  const unavailable = document.createElement("p");
  unavailable.className = "japanese-study-unavailable";
  unavailable.textContent = message;
  parent.append(unavailable);
}

function readRecord(tools: HTMLElement): JapaneseTextStudyRecord | undefined {
  return records.get(tools);
}

function partOfSpeechLabel(value: string): string {
  return (
    {
      NOUN: "danh từ",
      VERB: "động từ",
      ADJECTIVE: "tính từ",
      ADVERB: "trạng từ",
      PARTICLE: "trợ từ",
      AUXILIARY: "trợ động từ",
      EXPRESSION: "cụm từ",
      OTHER: "từ loại khác",
    }[value] ?? value
  );
}

function required<ElementType extends Element>(
  root: ParentNode,
  selector: string,
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null)
    throw new Error(`Missing study UI element '${selector}'.`);
  return element;
}
