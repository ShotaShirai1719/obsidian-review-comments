import { Component, MarkdownView } from "obsidian";
import type ReviewCommentsPlugin from "./main";
import { TYPES } from "./constants";
import { closeAllCommentPopovers } from "./ui/comment-bubble";

/** compositionend のあと、compositionstart が再発火しないか待つ時間 */
const COMPOSITION_END_GRACE_MS = 150;

/**
 * 選択範囲の上に出すボタンの列。1つのウィンドウに1本だけ持つ。
 *
 * ポップアウトウィンドウは自分の document と window を持ち、selectionchange も
 * getSelection もそちら側にしか無い。メインウィンドウで1本だけ作ると、増やした
 * ウィンドウにはボタンの列が出ない。ウィンドウの開閉に合わせて main 側が本体を
 * 足し引きする。
 */
export class FloatingBar extends Component {
  private readonly plugin: ReviewCommentsPlugin;
  private readonly win: Window;
  private readonly doc: Document;
  private el: HTMLDivElement | null = null;
  private selectionDebounce: number | null = null;
  // 日本語入力の変換中は true。変換候補の下線が選択として拾われるのを避ける
  private isComposing = false;
  private compositionEndGrace: number | null = null;

  constructor(plugin: ReviewCommentsPlugin, win: Window) {
    super();
    this.plugin = plugin;
    this.win = win;
    this.doc = win.document;
  }

  onload() {
    const bar = this.doc.body.createDiv({
      cls: "review-comment-floating-bar is-hidden",
    });
    this.el = bar;
    this.renderButtons();

    this.registerDomEvent(this.doc, "selectionchange", () => {
      if (this.isComposing) return;
      if (this.selectionDebounce !== null) {
        this.win.clearTimeout(this.selectionDebounce);
      }
      this.selectionDebounce = this.win.setTimeout(() => this.update(), 80);
    });

    // 変換中は候補の文字列が選択として見えてバーがちらつく。変換の間は隠す。
    // スペースキーで候補を送るときは compositionend の直後に compositionstart が
    // 再発火するため、compositionend は少し待ってから反映する
    this.registerDomEvent(this.doc, "compositionstart", () =>
      this.enterComposing()
    );
    this.registerDomEvent(this.doc, "compositionupdate", () =>
      this.enterComposing()
    );
    this.registerDomEvent(this.doc, "compositionend", () => {
      this.clearCompositionEndGrace();
      this.compositionEndGrace = this.win.setTimeout(() => {
        this.compositionEndGrace = null;
        this.isComposing = false;
        this.update();
      }, COMPOSITION_END_GRACE_MS);
    });

    this.registerDomEvent(this.win, "scroll", () => this.hide(), {
      capture: true,
    });

    this.registerDomEvent(this.doc, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.hide();
    });

    // 吹き出しは開いたウィンドウの document にしか無いため、閉じる判定もウィンドウ
    // ごとに要る。コメントのアンカーの外を押したときだけ閉じる
    this.registerDomEvent(this.doc, "click", (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest(".review-comment-anchor")) {
        closeAllCommentPopovers(this.doc);
      }
    });
  }

  onunload() {
    // 予約済みの再描画が unload 後に走らないようにする
    if (this.selectionDebounce !== null) {
      this.win.clearTimeout(this.selectionDebounce);
      this.selectionDebounce = null;
    }
    this.clearCompositionEndGrace();
    this.el?.remove();
    this.el = null;
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
        const mdView = this.activeViewInThisWindow();
        this.hide();
        if (!mdView) return;
        if (mdView.getMode() === "preview") {
          this.plugin.addCommentToReadingSelection(mdView, t.tag);
        } else if (mdView.editor.getSelection()) {
          this.plugin.addCommentToSelection(mdView.editor, t.tag);
        }
      });
    }
  }

  /**
   * このウィンドウで開いている編集面。フォーカスが別のウィンドウへ移ったあとに
   * 残っていたバーが反応すると、選択が無い側にボタンの列が出る
   */
  private activeViewInThisWindow(): MarkdownView | null {
    const mdView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) return null;
    return mdView.containerEl.ownerDocument === this.doc ? mdView : null;
  }

  private enterComposing() {
    this.clearCompositionEndGrace();
    this.isComposing = true;
    this.hide();
  }

  private clearCompositionEndGrace() {
    if (this.compositionEndGrace === null) return;
    this.win.clearTimeout(this.compositionEndGrace);
    this.compositionEndGrace = null;
  }

  private update() {
    if (!this.el) return;

    if (this.isComposing) {
      this.hide();
      return;
    }

    const mdView = this.activeViewInThisWindow();
    if (!mdView) {
      this.hide();
      return;
    }

    const sel = this.win.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      this.hide();
      return;
    }

    const range = sel.getRangeAt(0);
    // 読み取りモードでは編集面の選択が空のまま。画面の選択がこのノートの
    // 描画の中にあるかで判断する
    const hasSelection =
      mdView.getMode() === "preview"
        ? sel.toString().trim() !== "" &&
          mdView.previewMode.containerEl.contains(range.commonAncestorContainer)
        : mdView.editor.getSelection() !== "";
    if (!hasSelection) {
      this.hide();
      return;
    }

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

    if (left + barWidth > this.win.innerWidth - 8) {
      left = this.win.innerWidth - barWidth - 8;
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
