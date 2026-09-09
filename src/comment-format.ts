export interface ParsedMeta {
  author: string;
  date: string;
  type: string;
  body: string;
}

export function parseMeta(meta: string): ParsedMeta {
  const newFmt = meta.match(/^([^|]+)\|([^|]+)\|([A-Z]+):\s*([\s\S]*)$/);
  if (newFmt) {
    return {
      author: newFmt[1].trim(),
      date: newFmt[2].trim(),
      type: newFmt[3].trim(),
      body: newFmt[4].trim(),
    };
  }

  const oldFmt = meta.match(/^([^|]+)\|([^|:]+):\s*([\s\S]*)$/);
  if (oldFmt) {
    return {
      author: oldFmt[1].trim(),
      date: oldFmt[2].trim(),
      type: "NOTE",
      body: oldFmt[3].trim(),
    };
  }

  return { author: "", date: "", type: "NOTE", body: meta };
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
  body: string;
  // 記法の退避か空行の詰めが起きたかどうか。呼び出し側が利用者へ知らせる
  adjusted: boolean;
}

// コメント記法を壊す並びを本文から取り除く。空行はコメントを段落で分断する
export function prepareCommentBody(raw: string): PreparedBody {
  const trimmed = raw.trim();
  const body = trimmed
    .replace(/\n\s*\n+/g, "\n")
    .replace(/\{==/g, "{ ==")
    .replace(/==\}/g, "== }")
    .replace(/\{>>/g, "{ >>")
    .replace(/<<\}/g, "<< }");
  return { body, adjusted: body !== trimmed };
}
