import { parseThreads } from "./comment-format";

/**
 * 読み取りモードの選択をノートの記法の位置へ戻す。描画後の文字列は書式の記号が
 * 消えているため、記号を読み飛ばしながら探す。Obsidian に依存しないので単体で
 * 確かめられる
 */

// 描画で見えなくなる書式の記号。語中の _ は書式にならないため含めない
const MARKUP_CHAR = "[*~=`]";
const MARKUP_RUN = `${MARKUP_CHAR}*`;

export type LocateResult =
  | { from: number; to: number }
  | { error: "notFound" | "nested" };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 選んだ文字列から、書式の記号と改行の揺れを許す正規表現を作る */
function selectionPattern(selected: string): RegExp {
  const parts = selected
    .split(/(\s+)/)
    .filter((part) => part.length > 0)
    .map((part) =>
      /^\s+$/.test(part)
        ? "\\s+"
        : Array.from(part).map(escapeRegExp).join(MARKUP_RUN)
    );
  return new RegExp(parts.join(MARKUP_RUN), "g");
}

/**
 * 書式の記号が開いたまま閉じていないか。半端に囲むと周りの書式が崩れる。
 * `**` のような連なりは1つの区切りとして数える
 */
function isBalanced(s: string): boolean {
  const count = (re: RegExp) => (s.match(re) ?? []).length;
  return (
    count(/\*+/g) % 2 === 0 &&
    count(/~~/g) % 2 === 0 &&
    count(/==/g) % 2 === 0 &&
    count(/`+/g) % 2 === 0 &&
    count(/\[\[/g) === count(/\]\]/g)
  );
}

/**
 * block の中で、描画後の文字列 selected の occurrence 番目（0 始まり）にあたる
 * 範囲を返す。位置は source 全体の先頭から数える。
 *
 * 数えるのは既存コメントの `{>>...<<}` の外側だけ。描画後の画面ではこの部分が
 * 吹き出しに隠れ、選択の対象にならない
 */
export function locateSelection(
  source: string,
  blockFrom: number,
  blockTo: number,
  selected: string,
  occurrence: number
): LocateResult {
  const text = selected.trim();
  if (!text) return { error: "notFound" };

  const block = source.slice(blockFrom, blockTo);
  const threads = parseThreads(block).map((t) => {
    const metaFrom = t.offset + 3 + t.rawHighlighted.length + 3;
    return { from: t.offset, metaFrom, to: t.offset + t.full.length };
  });

  const matches: { from: number; to: number }[] = [];
  const re = selectionPattern(text);
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const from = m.index;
    const to = from + m[0].length;
    if (!threads.some((t) => from < t.to && to > t.metaFrom)) {
      matches.push({ from, to });
    }
    if (m[0].length === 0) re.lastIndex++;
  }

  // 画面側で数えた順番が記法側とずれても、候補が1つなら迷わない
  const picked =
    matches.length === 1 ? matches[0] : matches[occurrence] ?? null;
  if (!picked) return { error: "notFound" };

  let { from, to } = picked;
  if (!isBalanced(block.slice(from, to))) {
    // 太字の内側から選び始めた場合など。両脇の記号まで広げて閉じるか試す
    while (from > 0 && new RegExp(MARKUP_CHAR).test(block[from - 1])) from--;
    while (to < block.length && new RegExp(MARKUP_CHAR).test(block[to])) to++;
    if (!isBalanced(block.slice(from, to))) return { error: "notFound" };
  }

  if (threads.some((t) => from < t.to && to > t.from)) {
    return { error: "nested" };
  }
  return { from: blockFrom + from, to: blockFrom + to };
}

/** 行番号の範囲を、source の先頭からの文字位置へ直す。終端は最終行の行末 */
export function lineRangeToOffsets(
  source: string,
  lineStart: number,
  lineEnd: number
): { from: number; to: number } | null {
  const lines = source.split("\n");
  if (lineStart < 0 || lineEnd >= lines.length || lineStart > lineEnd) {
    return null;
  }
  let from = 0;
  for (let i = 0; i < lineStart; i++) from += lines[i].length + 1;
  let to = from;
  for (let i = lineStart; i <= lineEnd; i++) to += lines[i].length + 1;
  return { from, to: to - 1 };
}

/**
 * ブロックの先頭から選択の手前までに見えている文字列。吹き出しの中身は
 * 隠れていて選べないため外す
 */
export function visibleTextBefore(section: HTMLElement, range: Range): string {
  const before = section.ownerDocument.createRange();
  before.setStart(section, 0);
  before.setEnd(range.startContainer, range.startOffset);
  const frag = before.cloneContents();
  frag
    .querySelectorAll(
      ".review-comment-bubble-popover, .review-comment-bubble-btn"
    )
    .forEach((el) => el.remove());
  return frag.textContent ?? "";
}

/** 文字列の中で needle が重ならずに何回現れるか。空白の揺れは1つに畳む */
export function countOccurrences(haystack: string, needle: string): number {
  const h = haystack.replace(/\s+/g, " ");
  const n = needle.trim().replace(/\s+/g, " ");
  if (!n) return 0;
  let count = 0;
  let at = h.indexOf(n);
  while (at !== -1) {
    count++;
    at = h.indexOf(n, at + n.length);
  }
  return count;
}
