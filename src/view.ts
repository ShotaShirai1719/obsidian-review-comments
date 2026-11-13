import {
  ItemView,
  MarkdownView,
  Notice,
  Setting,
  WorkspaceLeaf,
} from "obsidian";
import type ReviewCommentsPlugin from "./main";
import { TYPE_ICON, VIEW_TYPE_COMMENTS } from "./constants";
import {
  CommentThread,
  buildReplyThread,
  buildThreadWithNewBody,
  formatDate,
  parseThreads,
  prepareCommentBody,
  sanitizeAuthor,
} from "./comment-format";
import { CommentInputModal } from "./modal";
import { attachDictationButton } from "./dictation";
import { appendResolved } from "./store";
import { isSubmitEnter } from "./keys";

// 打鍵ごとに全文を読み直すと大きなノートで重くなるため、少し待ってから描画する
const RENDER_DELAY_MS = 150;

export class CommentsView extends ItemView {
  plugin: ReviewCommentsPlugin;
  lastMarkdownView: MarkdownView | null = null;
  // 編集中のコメントの開始位置。編集していないときは null
  editingOffset: number | null = null;
  private renderDebounce: number | null = null;

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
      this.app.workspace.on("active-leaf-change", () => {
        // 別のファイルへ移ったら編集中の入力は破棄する
        this.editingOffset = null;
        this.scheduleRender();
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-change", () => {
        // 編集中の再描画はテキストエリアの入力を消すため走らせない
        if (this.editingOffset !== null) return;
        this.scheduleRender();
      })
    );
  }

  async onClose() {
    this.clearScheduledRender();
  }

  // 言語を切り替えたときに呼ぶ。タブのタイトルは作成時の値が残る
  refreshLocale() {
    this.renderComments();
    void this.leaf.setViewState(this.leaf.getViewState());
  }

  private clearScheduledRender() {
    if (this.renderDebounce !== null) {
      this.containerEl.win.clearTimeout(this.renderDebounce);
      this.renderDebounce = null;
    }
  }

  private scheduleRender() {
    this.clearScheduledRender();
    this.renderDebounce = this.containerEl.win.setTimeout(() => {
      this.renderDebounce = null;
      this.renderComments();
    }, RENDER_DELAY_MS);
  }

  getMarkdownView(): MarkdownView | null {
    const activeMdView =
      this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeMdView) {
      this.lastMarkdownView = activeMdView;
      return activeMdView;
    }

    // 覚えていたビューがまだ開かれているときだけ使う
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

  async resolveComment(mdView: MarkdownView, match: CommentThread) {
    const editor = mdView.editor;
    const startPos = editor.offsetToPos(match.offset);
    const endPos = editor.offsetToPos(match.offset + match.full.length);
    // 再描画は待ち時間を挟むため、押した時点の位置が古くなっていることがある
    if (editor.getRange(startPos, endPos) !== match.full) {
      new Notice(this.plugin.i18n.t("notice.noteChangedDuringEdit"));
      this.renderComments();
      return;
    }

    const sourcePath = mdView.file?.path ?? "";
    const path = await appendResolved(this.plugin, sourcePath, match);
    // 位置で置き換える。同じ本文のコメントが2つあると文字列検索では別の方が消える
    editor.replaceRange(match.highlighted, startPos, endPos);
    new Notice(this.plugin.i18n.t("notice.resolvedArchived", { path }));
    this.renderComments();
  }

  /** スレッドの末尾へ返信を足す。識別子の無い記法にはここで識別子を振る */
  replyToComment(mdView: MarkdownView, match: CommentThread) {
    new CommentInputModal(
      this.plugin,
      this.plugin.i18n.t("type.reply"),
      (body) => {
        const prepared = prepareCommentBody(body);
        if (!prepared.body) {
          new Notice(this.plugin.i18n.t("notice.emptyCommentBody"));
          return;
        }

        const editor = mdView.editor;
        const startPos = editor.offsetToPos(match.offset);
        const endPos = editor.offsetToPos(match.offset + match.full.length);
        if (editor.getRange(startPos, endPos) !== match.full) {
          new Notice(this.plugin.i18n.t("notice.noteChangedDuringEdit"));
          this.renderComments();
          return;
        }

        editor.replaceRange(
          buildReplyThread(match.rawHighlighted, match.entries, prepared.body, {
            author: sanitizeAuthor(this.plugin.settings.authorName),
            date: formatDate(new Date(), this.plugin.settings.dateFormat),
          }),
          startPos,
          endPos
        );
        if (prepared.adjusted) {
          new Notice(this.plugin.i18n.t("notice.commentBodyAdjusted"));
        }
        this.renderComments();
      }
    ).open();
  }

  renderEditForm(card: HTMLElement, mdView: MarkdownView, match: CommentThread) {
    const t = (key: Parameters<ReviewCommentsPlugin["i18n"]["t"]>[0]) =>
      this.plugin.i18n.t(key);

    const form = card.createDiv({ cls: "review-comment-card-edit" });
    const textarea = form.createEl("textarea", {
      cls: "review-comment-card-textarea",
    });
    textarea.value = match.entries[0].body;
    textarea.rows = Math.min(
      8,
      Math.max(3, match.entries[0].body.split("\n").length + 1)
    );

    const cancelEdit = () => {
      this.editingOffset = null;
      this.renderComments();
    };
    const save = () => this.saveEdit(mdView, match, textarea.value);

    const actions = form.createDiv({ cls: "review-comment-card-actions" });
    const stopDictation = attachDictationButton(
      actions,
      textarea,
      this.plugin
    );
    this.register(() => stopDictation());
    const saveBtn = actions.createEl("button", {
      text: t("panel.save"),
      cls: "review-comment-action-btn review-comment-save-btn",
    });
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      save();
    });
    const cancelBtn = actions.createEl("button", {
      text: t("panel.cancel"),
      cls: "review-comment-action-btn",
    });
    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      cancelEdit();
    });

    form.createDiv({
      cls: "review-comment-card-hint",
      text: t("panel.editHint"),
    });

    textarea.addEventListener("keydown", (e: KeyboardEvent) => {
      if (isSubmitEnter(e)) {
        e.preventDefault();
        save();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    });
    // テキストエリア内のクリックでノートへ飛ばないよう、カードのクリックを遮る
    form.addEventListener("click", (e) => e.stopPropagation());

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  saveEdit(mdView: MarkdownView, match: CommentThread, input: string) {
    const prepared = prepareCommentBody(input);
    if (!prepared.body) {
      new Notice(this.plugin.i18n.t("notice.emptyCommentBody"));
      return;
    }

    const editor = mdView.editor;
    const startPos = editor.offsetToPos(match.offset);
    const endPos = editor.offsetToPos(match.offset + match.full.length);
    if (editor.getRange(startPos, endPos) !== match.full) {
      // 編集中にノート側が変わっていると、無関係な範囲を書き換えてしまう
      new Notice(this.plugin.i18n.t("notice.noteChangedDuringEdit"));
      this.editingOffset = null;
      this.renderComments();
      return;
    }

    const rebuilt = buildThreadWithNewBody(
      match.rawHighlighted,
      match.entries,
      prepared.body,
      {
        author: sanitizeAuthor(this.plugin.settings.authorName),
        date: formatDate(new Date(), this.plugin.settings.dateFormat),
      }
    );

    this.editingOffset = null;
    editor.replaceRange(rebuilt, startPos, endPos);
    if (prepared.adjusted) {
      new Notice(this.plugin.i18n.t("notice.commentBodyAdjusted"));
    }
    this.renderComments();
  }

  renderComments() {
    const container = this.contentEl;
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

    const matches = parseThreads(mdView.editor.getValue());

    if (matches.length === 0) {
      container.createEl("p", {
        text: this.plugin.i18n.t("panel.noComments"),
        cls: "review-comment-empty",
      });
      return;
    }

    matches.forEach((match) => {
      const card = container.createDiv({ cls: "review-comment-card" });
      card.dataset.type = match.entries[0].type;

      const header = card.createDiv({ cls: "review-comment-card-header" });
      const icon = header.createSpan({ cls: "review-comment-card-icon" });
      icon.textContent = TYPE_ICON[match.entries[0].type] || "💬";
      const meta = header.createSpan({ cls: "review-comment-card-meta" });
      meta.textContent = `${match.entries[0].author} · ${match.entries[0].date}`;

      const original = card.createDiv({ cls: "review-comment-card-original" });
      original.textContent = `"${match.highlighted}"`;

      if (this.editingOffset === match.offset) {
        this.renderEditForm(card, mdView, match);
        return;
      }

      const body = card.createDiv({ cls: "review-comment-card-body" });
      body.textContent = match.entries[0].body;

      for (const reply of match.entries.slice(1)) {
        const item = card.createDiv({ cls: "review-comment-card-reply" });
        item
          .createDiv({ cls: "review-comment-card-meta" })
          .setText(`${reply.author} · ${reply.date}`);
        item
          .createDiv({ cls: "review-comment-card-body" })
          .setText(reply.body);
      }

      const actions = card.createDiv({ cls: "review-comment-card-actions" });
      const jumpBtn = actions.createEl("button", {
        text: this.plugin.i18n.t("panel.jump"),
        cls: "review-comment-action-btn",
      });
      jumpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.jumpTo(mdView, match.offset, match.full.length);
      });

      const replyBtn = actions.createEl("button", {
        text: this.plugin.i18n.t("panel.reply"),
        cls: "review-comment-action-btn",
      });
      replyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.replyToComment(mdView, match);
      });

      const editBtn = actions.createEl("button", {
        text: this.plugin.i18n.t("panel.edit"),
        cls: "review-comment-action-btn",
      });
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.editingOffset = match.offset;
        this.renderComments();
      });

      const resolveBtn = actions.createEl("button", {
        text: this.plugin.i18n.t("panel.resolve"),
        cls: "review-comment-action-btn review-comment-resolve-btn",
      });
      resolveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        void this.resolveComment(mdView, match);
      });

      card.addEventListener("click", () => {
        this.jumpTo(mdView, match.offset, match.full.length);
      });
    });
  }
}
