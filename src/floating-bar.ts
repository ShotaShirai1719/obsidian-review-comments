import { MarkdownView } from "obsidian";
import type ReviewCommentsPlugin from "./main";
import { TYPES } from "./constants";

export class FloatingBar {
  private readonly plugin: ReviewCommentsPlugin;
  private el: HTMLDivElement | null = null;
  private selectionDebounce: number | null = null;

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
      if (this.selectionDebounce !== null) {
        window.clearTimeout(this.selectionDebounce);
      }
      this.selectionDebounce = window.setTimeout(() => this.update(), 80);
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
        if (mdView && mdView.editor.getSelection()) {
          this.plugin.addCommentToSelection(mdView.editor, t.tag);
        }
        this.hide();
      });
    }
  }

  destroy() {
    // 予約済みの再描画が unload 後に走らないようにする
    if (this.selectionDebounce !== null) {
      window.clearTimeout(this.selectionDebounce);
      this.selectionDebounce = null;
    }
    this.el?.remove();
    this.el = null;
  }

  private update() {
    if (!this.el) return;

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
