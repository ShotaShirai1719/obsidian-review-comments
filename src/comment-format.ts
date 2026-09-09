export interface ParsedMeta {
  author: string;
  date: string;
  type: string;
  body: string;
}

/**
 * CodeMirror の ViewPlugin 由来の Decoration.replace は改行をまたぐ範囲に使えない。
 * 記法自体に生の改行を残さないよう、ハイライト対象と本文は保存時にここを通す。
 */
export function escapeMultiline(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
}

export function unescapeMultiline(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\" && i + 1 < text.length) {
      const next = text[i + 1];
      if (next === "n") {
        result += "\n";
        i++;
        continue;
      }
      if (next === "\\") {
        result += "\\";
        i++;
        continue;
      }
    }
    result += text[i];
  }
  return result;
}

export function parseMeta(meta: string): ParsedMeta {
  const newFmt = meta.match(/^([^|]+)\|([^|]+)\|([A-Z]+):\s*([\s\S]*)$/);
  if (newFmt) {
    return {
      author: newFmt[1].trim(),
      date: newFmt[2].trim(),
      type: newFmt[3].trim(),
      body: unescapeMultiline(newFmt[4].trim()),
    };
  }

  const oldFmt = meta.match(/^([^|]+)\|([^|:]+):\s*([\s\S]*)$/);
  if (oldFmt) {
    return {
      author: oldFmt[1].trim(),
      date: oldFmt[2].trim(),
      type: "NOTE",
      body: unescapeMultiline(oldFmt[3].trim()),
    };
  }

  return { author: "", date: "", type: "NOTE", body: unescapeMultiline(meta) };
}

export function sanitizeAuthor(name: string): string {
  const trimmed = (name || "").trim();
  const stripped = trimmed.replace(/[|<>{}=]/g, "_");
  return stripped || "you";
}

export function formatDate(d: Date, format: "iso" | "japanese"): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (format === "japanese") return `${y}年${m}月${day}日`;
  return `${y}-${m}-${day}`;
}

export interface PreparedBody {
  // ノートへ書き込む形。改行はエスケープ済み
  body: string;
  // 記法の退避が起きたかどうか。呼び出し側が利用者へ知らせる
  adjusted: boolean;
}

// コメント記法を壊す並びを本文から取り除き、改行をエスケープして1行に収める
export function prepareCommentBody(raw: string): PreparedBody {
  const trimmed = raw.trim();
  const escaped = trimmed
    .replace(/\{==/g, "{ ==")
    .replace(/==\}/g, "== }")
    .replace(/\{>>/g, "{ >>")
    .replace(/<<\}/g, "<< }");
  return { body: escapeMultiline(escaped), adjusted: escaped !== trimmed };
}
