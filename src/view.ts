import { ItemView, MarkdownView, Setting, WorkspaceLeaf } from "obsidian";
import type ReviewCommentsPlugin from "./main";
import { COMMENT_REGEX, TYPE_ICON, VIEW_TYPE_COMMENTS } from "./constants";
import { ParsedMeta, parseMeta } from "./comment-format";

export class CommentsView extends ItemView {
  plugin: ReviewCommentsPlugin;
  lastMarkdownView: MarkdownView | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: ReviewCommentsPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_COMMENTS;
  }

  getDisplayText() {
    return this.plugin.i18n.t("panel.viewTitle");
  }

  getIcon() {
    return "message-circle";
  }

  async onOpen() {
    this.renderComments();
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.renderComments())
    );
    this.registerEvent(
      this.app.workspace.on("editor-change", () => this.renderComments())
    );
  }

  async onClose() {}

  getMarkdownView(): MarkdownView | null {
    const activeMdView =
      this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeMdView) {
      this.lastMarkdownView = activeMdView;
      return activeMdView;
    }

    if (
      this.lastMarkdownView &&
      this.plugin.app.workspace
        .getLeavesOfType("markdown")
        .some((leaf) => leaf.view === this.lastMarkdownView)
    ) {
      return this.lastMarkdownView;
    }

    this.lastMarkdownView = null;
    return null;
  }

  jumpTo(mdView: MarkdownView, offset: number, length: number) {
    this.plugin.app.workspace.setActiveLeaf(mdView.leaf, { focus: true });
    const editor = mdView.editor;
    const pos = editor.offsetToPos(offset);
    const endPos = editor.offsetToPos(offset + length);
    editor.setSelection(pos, endPos);
    editor.scrollIntoView({ from: pos, to: endPos }, true);
    editor.focus();
  }

  renderComments() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    new Setting(container)
      .setName(this.plugin.i18n.t("panel.viewTitle"))
      .setHeading();

    const mdView = this.getMarkdownView();
    if (!mdView) {
      container.createEl("p", {
        text: this.plugin.i18n.t("panel.openMarkdownFile"),
      });
      return;
    }

    const text = mdView.editor.getValue();
    const regex = new RegExp(COMMENT_REGEX);
    type Match = {
      highlighted: string;
      meta: ParsedMeta;
      rawMeta: string;
      offset: number;
      full: string;
    };
    const matches: Match[] = [];
    let m: RegExpExecArray | null;

    while ((m = regex.exec(text))) {
      matches.push({
        highlighted: m[1],
        meta: parseMeta(m[2]),
        rawMeta: m[2],
        offset: m.index,
        full: m[0],
      });
    }

    if (matches.length === 0) {
      container.createEl("p", {
        text: this.plugin.i18n.t("panel.noComments"),
        cls: "review-comment-empty",
      });
      return;
    }

    matches.forEach((match) => {
      const card = container.createDiv({ cls: "review-comment-card" });
      card.dataset.type = match.meta.type;

      const header = card.createDiv({ cls: "review-comment-card-header" });
      const icon = header.createSpan({ cls: "review-comment-card-icon" });
      icon.textContent = TYPE_ICON[match.meta.type] || "💬";
      const meta = header.createSpan({ cls: "review-comment-card-meta" });
      meta.textContent = `${match.meta.author} · ${match.meta.date}`;

      const original = card.createDiv({ cls: "review-comment-card-original" });
      original.textContent = `"${match.highlighted}"`;

      const body = card.createDiv({ cls: "review-comment-card-body" });
      body.textContent = match.meta.body;

      const actions = card.createDiv({ cls: "review-comment-card-actions" });
      const jumpBtn = actions.createEl("button", {
        text: this.plugin.i18n.t("panel.jump"),
        cls: "review-comment-action-btn",
      });
      jumpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.jumpTo(mdView, match.offset, match.full.length);
      });

      const resolveBtn = actions.createEl("button", {
        text: this.plugin.i18n.t("panel.resolve"),
        cls: "review-comment-action-btn review-comment-resolve-btn",
      });
      resolveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const editor = mdView.editor;
        const value = editor.getValue();
        const newValue = value.replace(match.full, match.highlighted);
        editor.setValue(newValue);
        this.renderComments();
      });

      card.addEventListener("click", () => {
        this.jumpTo(mdView, match.offset, match.full.length);
      });
    });
  }
}
