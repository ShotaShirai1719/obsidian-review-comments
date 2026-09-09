import { Editor, Notice, Plugin } from "obsidian";
import { I18n, resolveLocale } from "./i18n";
import { TYPES, VIEW_TYPE_COMMENTS } from "./constants";
import {
  escapeMultiline,
  formatDate,
  prepareCommentBody,
  sanitizeAuthor,
} from "./comment-format";
import { CommentInputModal } from "./modal";
import { CommentsView } from "./view";
import {
  DEFAULT_SETTINGS,
  ReviewCommentsSettingTab,
  ReviewCommentsSettings,
} from "./settings";
import {
  createCommentDecorationExtension,
  renderCommentsInReadingMode,
} from "./rendering";
import { closeAllCommentPopovers } from "./ui/comment-bubble";
import { FloatingBar } from "./floating-bar";

export default class ReviewCommentsPlugin extends Plugin {
  settings: ReviewCommentsSettings = DEFAULT_SETTINGS;
  i18n: I18n = new I18n("en");
  // 直後に吹き出しへ変わる新規コメントの開始位置。1回だけ消費して演出を出す
  pendingPulseOffset: number | null = null;
  private floatingBar: FloatingBar | null = null;

  async onload() {
    console.log("[ReviewComments] onload");
    await this.loadSettings();
    this.i18n = new I18n(resolveLocale(this.settings.language));

    for (const t of TYPES) {
      const label = this.i18n.t(t.labelKey);
      this.addCommand({
        id: `add-comment-${t.id}`,
        name: this.i18n.t("command.addCommentTemplate", {
          type: label,
          icon: t.icon,
        }),
        editorCallback: (editor: Editor) =>
          this.addCommentToSelection(editor, t.tag),
      });
    }

    this.addCommand({
      id: "open-comments-panel",
      name: this.i18n.t("command.openPanel"),
      callback: () => void this.activateView(),
    });

    this.addRibbonIcon("message-circle", this.i18n.t("ribbon.tooltip"), () => {
      void this.activateView();
    });

    this.registerView(
      VIEW_TYPE_COMMENTS,
      (leaf) => new CommentsView(leaf, this)
    );

    this.registerEditorExtension([createCommentDecorationExtension(this)]);

    this.registerMarkdownPostProcessor((el, ctx) =>
      renderCommentsInReadingMode(this, el, ctx)
    );

    this.registerDomEvent(activeDocument, "click", (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest(".review-comment-anchor")) {
        closeAllCommentPopovers();
      }
    });

    this.floatingBar = new FloatingBar(this);
    this.floatingBar.mount();

    this.addSettingTab(new ReviewCommentsSettingTab(this.app, this));
  }

  onunload() {
    console.log("[ReviewComments] onunload");
    // コミュニティプラグインの規約でリーフは閉じない。利用者の画面構成を壊すため
    this.floatingBar?.destroy();
    this.floatingBar = null;
  }

  async loadSettings() {
    const data = (await this.loadData()) as Partial<ReviewCommentsSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshLocale() {
    this.i18n.setLocale(resolveLocale(this.settings.language));
    // 既に作られた DOM には i18n の変更が届かないため、作り直す側から声をかける
    this.floatingBar?.refreshLabels();
    for (const leaf of this.app.workspace.getLeavesOfType(
      VIEW_TYPE_COMMENTS
    )) {
      const view = leaf.view;
      if (view instanceof CommentsView) {
        view.refreshLocale();
      }
    }
  }

  addCommentToSelection(editor: Editor, typeTag: string = "NOTE") {
    const rawSelection = editor.getSelection();

    // 行全体を選択すると前後の改行まで記法の内側へ入り、その改行が担っていた
    // 行の区切りが消えて隣の行と繋がる。先頭を切ってから末尾を見ることで、
    // 改行だけを選んだときに前後の除去量が重なるのを避ける
    const leadingNewline = rawSelection.match(/^\n+/)?.[0] ?? "";
    const rest = rawSelection.slice(leadingNewline.length);
    const trailingNewline = rest.match(/\n+$/)?.[0] ?? "";
    const selection = trailingNewline
      ? rest.slice(0, -trailingNewline.length)
      : rest;

    if (!selection) {
      new Notice(this.i18n.t("notice.selectTextFirst"));
      return;
    }
    if (
      selection.includes("{==") ||
      selection.includes("==}") ||
      selection.includes("{>>") ||
      selection.includes("<<}")
    ) {
      new Notice(this.i18n.t("notice.alreadyHasComment"));
      return;
    }

    const fromOffset =
      editor.posToOffset(editor.getCursor("from")) + leadingNewline.length;
    const toOffset =
      editor.posToOffset(editor.getCursor("to")) - trailingNewline.length;
    const from = editor.offsetToPos(fromOffset);
    const to = editor.offsetToPos(toOffset);
    const typeLabel = this.i18n.t(
      TYPES.find((t) => t.tag === typeTag)?.labelKey ?? "type.note"
    );
    new CommentInputModal(this.app, this.i18n, typeLabel, (body) => {
      const date = formatDate(new Date(), this.settings.dateFormat);
      const author = sanitizeAuthor(this.settings.authorName);
      const prepared = prepareCommentBody(
        body.trim() || this.i18n.t("defaultCommentBody")
      );
      const wrapped = `{==${escapeMultiline(
        selection
      )}==}{>>${author}|${date}|${typeTag}: ${prepared.body}<<}`;
      editor.replaceRange(wrapped, from, to);
      this.pendingPulseOffset = fromOffset;
      // 選択がハイライト全体を覆ったままだと生の記法が出続けるため、記法の
      // 直後にキャレットだけを置く。境界に接する位置は内側と見なされない
      const insertEndPos = editor.offsetToPos(fromOffset + wrapped.length);
      editor.setSelection(insertEndPos, insertEndPos);
      editor.focus();
      if (prepared.adjusted) {
        new Notice(this.i18n.t("notice.commentBodyAdjusted"));
      }
    }).open();
  }

  async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_COMMENTS);
    if (existing.length > 0) {
      await workspace.revealLeaf(existing[0]);
      return;
    }

    // 右サイドバーの空きタブが取れないことがあるため、新しいタブでも試す
    const leaf = workspace.getRightLeaf(false) ?? workspace.getRightLeaf(true);
    if (!leaf) {
      new Notice(this.i18n.t("notice.panelOpenFailed"));
      return;
    }
    await leaf.setViewState({ type: VIEW_TYPE_COMMENTS, active: true });
    await workspace.revealLeaf(leaf);
  }
}
