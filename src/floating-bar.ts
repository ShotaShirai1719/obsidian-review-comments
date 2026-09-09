import { MarkdownView } from "obsidian";
import type ReviewCommentsPlugin from "./main";
import { TYPES } from "./constants";

/** compositionend のあと、compositionstart が再発火しないか待つ時間 */
const COMPOSITION_END_GRACE_MS = 150;

export class FloatingBar {
  private readonly plugin: ReviewCommentsPlugin;
  private el: HTMLDivElement | null = null;
  private selectionDebounce: number | null = null;
  // 日本語入力の変換中は true。変換候補の下線が選択として拾われるのを避ける
  private isComposing = false;
  private compositionEndGrace: number | null = null;

  constructor(plugin: ReviewCommentsPlugin) {
    this.plugin = plugin;
  }

  mount() {
    const doc = activeDocument;
    const bar = doc.body.createDiv({
      cls: "review-comment-floating-bar is-hidden",
    });
    this.el = bar;
    this.renderButtons();

    this.plugin.registerDomEvent(doc, "selectionchange", () => {
      if (this.isComposing) return;
      if (this.selectionDebounce !== null) {
        window.clearTimeout(this.selectionDebounce);
      }
      this.selectionDebounce = window.setTimeout(() => this.update(), 80);
    });

    // 変換中は候補の文字列が選択として見えてバーがちらつく。変換の間は隠す。
    // スペースキーで候補を送るときは compositionend の直後に compositionstart が
    // 再発火するため、compositionend は少し待ってから反映する
    this.plugin.registerDomEvent(doc, "compositionstart", () =>
      this.enterComposing()
    );
    this.plugin.registerDomEvent(doc, "compositionupdate", () =>
      this.enterComposing()
    );
    this.plugin.registerDomEvent(doc, "compositionend", () => {
      this.clearCompositionEndGrace();
      this.compositionEndGrace = window.setTimeout(() => {
        this.compositionEndGrace = null;
        this.isComposing = false;
        this.update();
      }, COMPOSITION_END_GRACE_MS);
    });

    this.plugin.registerDomEvent(window, "scroll", () => this.hide(), {
      capture: true,
    });

    this.plugin.registerDomEvent(doc, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.hide();
    });
  }

  // 言語を切り替えたときに呼ぶ。ボタンは一度作ると i18n の変更が届かない
  refreshLabels() {
    if (!this.el) return;
    this.renderButtons();
  }

  private renderButtons() {
    const bar = this.el;
    if (!bar) return;
    bar.empty();

    for (const t of TYPES) {
      const label = this.plugin.i18n.t(t.labelKey);
      const btn = bar.createEl("button", {
        cls: "review-comment-type-btn",
        attr: { title: `${label} (${t.tag})` },
      });
      btn.createSpan({ cls: "rc-icon", text: t.icon });
      btn.createSpan({ cls: "rc-label", text: label });
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mdView =
          this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        this.hide();
        if (mdView && mdView.editor.getSelection()) {
          this.plugin.addCommentToSelection(mdView.editor, t.tag);
        }
      });
    }
  }

  destroy() {
    // 予約済みの再描画が unload 後に走らないようにする
    if (this.selectionDebounce !== null) {
      window.clearTimeout(this.selectionDebounce);
      this.selectionDebounce = null;
    }
    this.clearCompositionEndGrace();
    this.el?.remove();
    this.el = null;
  }

  private enterComposing() {
    this.clearCompositionEndGrace();
    this.isComposing = true;
    this.hide();
  }

  private clearCompositionEndGrace() {
    if (this.compositionEndGrace === null) return;
    window.clearTimeout(this.compositionEndGrace);
    this.compositionEndGrace = null;
  }

  private update() {
    if (!this.el) return;

    if (this.isComposing) {
      this.hide();
      return;
    }

    const mdView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      this.hide();
      return;
    }

    const selText = mdView.editor.getSelection();
    if (!selText) {
      this.hide();
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      this.hide();
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      this.hide();
      return;
    }

    const bar = this.el;
    bar.removeClass("is-hidden");
    const barWidth = bar.offsetWidth || 280;
    const barHeight = bar.offsetHeight || 36;

    let left = rect.left;
    let top = rect.top - barHeight - 8;

    if (left + barWidth > window.innerWidth - 8) {
      left = window.innerWidth - barWidth - 8;
    }
    if (left < 8) left = 8;
    if (top < 8) {
      top = rect.bottom + 6;
    }

    bar.setCssProps({
      "--rc-bar-left": `${left}px`,
      "--rc-bar-top": `${top}px`,
    });
  }

  private hide() {
    this.el?.addClass("is-hidden");
  }
}
