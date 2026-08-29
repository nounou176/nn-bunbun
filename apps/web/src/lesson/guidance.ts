import type { LessonStep } from "@bunbun/contracts";

export type LessonSupportMode = "GUIDED" | "IMMERSIVE";

export interface OperationalGuidance {
  ja: string;
  support: string;
}

export interface AuthoredTextualHint {
  kind: "MEANING" | "PATTERN" | "READING";
  labelJa: string;
  labelSupport: string;
  text: string;
}

export function operationalGuidance(step: LessonStep): OperationalGuidance {
  switch (step.interaction.type) {
    case "LISTEN":
      return {
        ja: "音声を聞いて、次へ進みます。",
        support: "Bấm Nghe câu thoại. Nghe xong, bấm Tiếp tục.",
      };
    case "ARRANGE":
      return {
        ja: "ことばを順番に選んで、答えます。",
        support:
          "Bấm từng mảnh từ theo thứ tự đọc từ trái sang phải. Có thể bấm lại mảnh đã chọn để bỏ xuống, rồi bấm Kiểm tra.",
      };
    case "CHOOSE":
      return {
        ja: "いちばん合う文を一つ選びます。",
        support: "Bấm một câu phù hợp nhất. Bạn có thể xem Gợi ý trước.",
      };
    case "TYPE":
      return {
        ja: "日本語を入力して、答えます。",
        support:
          "Nhập câu tiếng Nhật vào ô, rồi bấm Kiểm tra. Không cần dấu câu cuối câu.",
      };
    case "MOVE_TO":
      return {
        ja: "3Dの場所をクリックして移動します。",
        support: "Bấm trực tiếp vào một địa điểm được đánh dấu trong cảnh 3D.",
      };
    case "CLICK_OBJECT":
      return {
        ja: "3Dのものを一つクリックします。",
        support: "Bấm trực tiếp vào một vật hoặc con vật trong cảnh 3D.",
      };
    case "PICK_UP":
      return {
        ja: "3Dのものをクリックして拾います。",
        support: "Bấm trực tiếp vào đồ vật bạn muốn nhặt trong cảnh 3D.",
      };
    case "GIVE":
      return {
        ja: "3Dの相手をクリックして渡します。",
        support:
          "Bạn đang mang đồ vật. Bấm trực tiếp vào người sẽ nhận nó trong cảnh 3D.",
      };
  }
}

export function arrangeRecoveryHint(
  step: LessonStep,
  attempt: number,
): string | undefined {
  if (step.interaction.type !== "ARRANGE" || attempt < 1) return undefined;
  const acceptedSequence = step.interaction.acceptedSequences[0];
  if (acceptedSequence === undefined) return undefined;
  const tokens = new Map(
    step.interaction.tokens.map((token) => [token.tokenId, token.textJa]),
  );
  const answer = acceptedSequence.map((tokenId) => tokens.get(tokenId));
  if (answer.some((token) => token === undefined)) return undefined;
  return `答えの順番 / Thứ tự đúng: ${answer.join(" → ")}`;
}

export function authoredTextualHints(
  step: LessonStep,
): readonly AuthoredTextualHint[] {
  const hints: AuthoredTextualHint[] = [];
  for (const scaffold of step.scaffolds) {
    switch (scaffold.kind) {
      case "SHOW_MEANING":
        hints.push({
          kind: "MEANING",
          labelJa: "意味のヒント",
          labelSupport: "Gợi ý nghĩa",
          text: scaffold.supportText,
        });
        break;
      case "SHOW_PATTERN":
        hints.push({
          kind: "PATTERN",
          labelJa: "文型のヒント",
          labelSupport: "Gợi ý mẫu câu",
          text: scaffold.textJa,
        });
        break;
      case "SHOW_READING":
        hints.push({
          kind: "READING",
          labelJa: "読み方",
          labelSupport: "Cách đọc",
          text: scaffold.textJa,
        });
        break;
      default:
        break;
    }
  }
  return hints;
}
