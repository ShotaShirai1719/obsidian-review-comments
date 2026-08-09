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
    const bar = document.createElement("div");
    bar.className = "review-comment-floating-bar";
    bar.style.display = "none";
    document.body.appendChild(bar);
    this.el = bar;

    for (const t of TYPES) {
      const label = this.plugin.i18n.t(t.labelKey);
      const btn = document.createElement("button");
      btn.className = "review-comment-type-btn";
      btn.title = `${label} (${t.tag})`;
      btn.createSpan({ cls: "rc-icon", text: t.icon });
      btn.createSpan({ cls: "rc-label", text: label });
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mdView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (mdView && mdView.editor.getSelection()) {
          this.plugin.addCommentToSelection(mdView.editor, t.tag);
        }
        this.hide();
      });
      bar.appendChild(btn);
    }

    this.plugin.registerDomEvent(document, "selectionchange", () => {
      if (this.selectionDebounce !== null) {
        window.clearTimeout(this.selectionDebounce);
      }
      this.selectionDebounce = window.setTimeout(() => this.update(), 80);
    });

    this.plugin.registerDomEvent(window, "scroll", () => this.hide(), {
      capture: true,
    });

    this.plugin.registerDomEvent(document, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.hide();
    });
  }

  destroy() {
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
    bar.style.display = "flex";
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

    bar.style.left = `${left}px`;
    bar.style.top = `${top}px`;
  }

  private hide() {
    if (this.el) {
      this.el.style.display = "none";
    }
  }
}
