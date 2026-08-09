import { Editor, Notice, Plugin } from "obsidian";
import { I18n, resolveLocale } from "./i18n";
import { TYPES, VIEW_TYPE_COMMENTS } from "./constants";
import { escapeCommentBody, formatDate, sanitizeAuthor } from "./comment-format";
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
import { FloatingBar } from "./floating-bar";

export default class ReviewCommentsPlugin extends Plugin {
  settings: ReviewCommentsSettings = DEFAULT_SETTINGS;
  i18n: I18n = new I18n("en");
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
      callback: () => this.activateView(),
    });

    this.addRibbonIcon("message-circle", this.i18n.t("ribbon.tooltip"), () => {
      this.activateView();
    });

    this.registerView(
      VIEW_TYPE_COMMENTS,
      (leaf) => new CommentsView(leaf, this)
    );

    this.registerEditorExtension([createCommentDecorationExtension()]);

    this.registerMarkdownPostProcessor((el, ctx) =>
      renderCommentsInReadingMode(el, ctx)
    );

    this.floatingBar = new FloatingBar(this);
    this.floatingBar.mount();

    this.addSettingTab(new ReviewCommentsSettingTab(this.app, this));
  }

  onunload() {
    console.log("[ReviewComments] onunload");
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_COMMENTS);
    this.floatingBar?.destroy();
    this.floatingBar = null;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshLocale() {
    this.i18n.setLocale(resolveLocale(this.settings.language));
  }

  addCommentToSelection(editor: Editor, typeTag: string = "NOTE") {
    const selection = editor.getSelection();
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

    const from = editor.getCursor("from");
    const to = editor.getCursor("to");
    const typeLabel = this.i18n.t(
      TYPES.find((t) => t.tag === typeTag)?.labelKey ?? "type.note"
    );
    new CommentInputModal(this.app, this.i18n, typeLabel, (body) => {
      const date = formatDate(new Date(), this.settings.dateFormat);
      const author = sanitizeAuthor(this.settings.authorName);
      const commentBody = escapeCommentBody(
        body.trim() || this.i18n.t("defaultCommentBody")
      );
      const wrapped = `{==${selection}==}{>>${author}|${date}|${typeTag}: ${commentBody}<<}`;
      editor.replaceRange(wrapped, from, to);
      editor.focus();
    }).open();
  }

  async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_COMMENTS);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE_COMMENTS, active: true });
      workspace.revealLeaf(leaf);
    }
  }
}
