import { App, Component, MarkdownRenderer, setIcon } from "obsidian";
import { TYPE_LUCIDE } from "../constants";
import type { ParsedMeta } from "../comment-format";
import type { I18n } from "../i18n";

/**
 * MarkdownRenderer.render は常にブロック要素で包んで返すため、ハイライト対象が
 * 単一の p になっている場合は中身だけを取り出して地の文へ溶け込ませる。見出しや
 * リストのブロック構文はそのまま挿入し、同じ行へ流し込むのは CSS 側で行う。
 */
export async function renderIntoInlineContext(
  app: App,
  markdown: string,
  target: HTMLElement,
  sourcePath: string,
  component: Component
) {
  const tmp = target.ownerDocument.createElement("div");
  await MarkdownRenderer.render(app, markdown, tmp, sourcePath, component);
  if (tmp.children.length === 1 && tmp.firstElementChild?.tagName === "P") {
    const p = tmp.firstElementChild;
    while (p.firstChild) target.appendChild(p.firstChild);
  } else {
    while (tmp.firstChild) target.appendChild(tmp.firstChild);
  }
}

/**
 * 吹き出しボタンと、クリックで開閉するポップオーバーを container へ足す。
 * onDelete を渡すと右上に削除ボタンが付き、押すと記法を外してハイライトされて
 * いたテキストだけが残る。
 */
export function appendCommentBubble(
  container: HTMLElement,
  meta: ParsedMeta,
  i18n: I18n,
  onDelete?: () => void
) {
  container.addClass("review-comment-anchor");
  container.dataset.type = meta.type;

  const btn = container.createEl("button", {
    cls: "review-comment-bubble-btn",
    attr: { type: "button", "aria-label": i18n.t("bubble.show") },
  });
  setIcon(btn, TYPE_LUCIDE[meta.type] || "message-circle");

  const popover = container.createDiv({ cls: "review-comment-bubble-popover" });

  if (onDelete) {
    const deleteBtn = popover.createEl("button", {
      cls: "review-comment-bubble-popover-close",
      attr: { type: "button", "aria-label": i18n.t("bubble.delete") },
    });
    setIcon(deleteBtn, "x");
    deleteBtn.addEventListener("mousedown", (e) => e.preventDefault());
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAllCommentPopovers(container.ownerDocument);
      onDelete();
    });
  }

  const header = popover.createDiv({
    cls: "review-comment-bubble-popover-header",
  });
  header.setText(`${meta.author} · ${meta.date}`);
  const body = popover.createDiv({ cls: "review-comment-bubble-popover-body" });
  body.setText(meta.body);

  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = popover.hasClass("is-open");
    closeAllCommentPopovers(container.ownerDocument);
    if (!isOpen) popover.addClass("is-open");
  });
}

export function closeAllCommentPopovers(doc: Document = activeDocument) {
  doc
    .querySelectorAll(".review-comment-bubble-popover.is-open")
    .forEach((el) => el.removeClass("is-open"));
}
