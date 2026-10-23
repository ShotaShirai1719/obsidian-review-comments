import {
  Editor,
  MarkdownView,
  Notice,
  Plugin,
  TAbstractFile,
  TFile,
  debounce,
} from "obsidian";
import { I18n, resolveLocale } from "./i18n";
import { TYPES, VIEW_TYPE_COMMENTS } from "./constants";
import {
  escapeMultiline,
  formatDate,
  newCommentId,
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
  findReadingSection,
  renderCommentsInReadingMode,
} from "./rendering";
import {
  LocateResult,
  countOccurrences,
  lineRangeToOffsets,
  locateSelection,
  visibleTextBefore,
} from "./reading-selection";
import { FloatingBar } from "./floating-bar";
import {
  dropNotesFor,
  exportComments,
  syncCommentNotes,
  syncOneFile,
} from "./store";

export default class ReviewCommentsPlugin extends Plugin {
  settings: ReviewCommentsSettings = DEFAULT_SETTINGS;
  i18n: I18n = new I18n("en");
  // 直後に吹き出しへ変わる新規コメントの開始位置。1回だけ消費して演出を出す
  pendingPulseOffset: number | null = null;
  // ウィンドウごとに1本。ポップアウトウィンドウは自分の document を持つため、
  // メインウィンドウの1本では増やした側にボタンの列が出ない
  private readonly floatingBars = new Map<Window, FloatingBar>();

  async onload() {
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

    this.addCommand({
      id: "sync-comment-notes",
      name: this.i18n.t("command.syncCommentNotes"),
      callback: () => void this.runSyncCommentNotes(),
    });

    this.addCommand({
      id: "export-comments",
      name: this.i18n.t("command.exportComments"),
      callback: () => void this.runExportComments(),
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

    // 起動時に復元されたポップアウトウィンドウも拾うため、レイアウトが整うまで待つ
    this.app.workspace.onLayoutReady(() => this.mountFloatingBars());
    this.registerEvent(
      this.app.workspace.on("window-open", (_leaf, win) =>
        this.addFloatingBar(win)
      )
    );
    this.registerEvent(
      this.app.workspace.on("window-close", (_leaf, win) =>
        this.removeFloatingBar(win)
      )
    );

    // 保存は打鍵の区切りごとに来る。落ち着いてから、溜まったファイルを順に書き直す。
    // 1件ずつ debounce に渡すと、続けて別のファイルを保存したときに前の分が消える
    const pending = new Set<TFile>();
    const flush = debounce(
      () => {
        const files = Array.from(pending);
        pending.clear();
        void (async () => {
          for (const file of files) await syncOneFile(this, file);
        })();
      },
      1500,
      true
    );
    const onVaultChange = (file: TAbstractFile) => {
      if (!this.settings.autoSync) return;
      if (!(file instanceof TFile)) return;
      if (file.extension !== "md") return;
      pending.add(file);
      flush();
    };
    this.registerEvent(this.app.vault.on("modify", onVaultChange));
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!this.settings.autoSync) return;
        if (!(file instanceof TFile)) return;
        if (file.extension !== "md") return;
        // 名前を変えると、前のパスを指したコメントノートが残る
        void dropNotesFor(this, oldPath);
        pending.add(file);
        flush();
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!this.settings.autoSync) return;
        void dropNotesFor(this, file.path);
      })
    );

    this.addSettingTab(new ReviewCommentsSettingTab(this.app, this));
  }

  onunload() {
    // コミュニティプラグインの規約でリーフは閉じない。利用者の画面構成を壊すため。
    // バーは addChild で繋いであり、本体の unload で一緒に外れる
    this.floatingBars.clear();
  }

  /** 開いているすべてのウィンドウにバーを1本ずつ置く */
  private mountFloatingBars() {
    const windows = new Set<Window>([this.app.workspace.rootSplit.win]);
    this.app.workspace.iterateAllLeaves((leaf) => {
      windows.add(leaf.getContainer().win);
    });
    for (const win of windows) this.addFloatingBar(win);
  }

  private addFloatingBar(win: Window) {
    if (this.floatingBars.has(win)) return;
    const bar = new FloatingBar(this, win);
    this.floatingBars.set(win, bar);
    this.addChild(bar);
  }

  private removeFloatingBar(win: Window) {
    const bar = this.floatingBars.get(win);
    if (!bar) return;
    this.floatingBars.delete(win);
    this.removeChild(bar);
  }

  async loadSettings() {
    const data = (await this.loadData()) as
      | (Partial<ReviewCommentsSettings> & { resolvedFile?: string })
      | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});

    // 2.1.0 までは1つのファイルを指していた。指していた場所の親を引き継ぐ
    if (data?.resolvedFile && !data.resolvedFolder) {
      const parent = data.resolvedFile.split("/").slice(0, -1).join("/");
      this.settings.resolvedFolder = parent || DEFAULT_SETTINGS.resolvedFolder;
      await this.saveSettings();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshLocale() {
    this.i18n.setLocale(resolveLocale(this.settings.language));
    // 既に作られた DOM には i18n の変更が届かないため、作り直す側から声をかける
    for (const bar of this.floatingBars.values()) bar.refreshLabels();
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
    new CommentInputModal(this, typeLabel, (body) => {
      const { wrapped, adjusted } = this.newCommentMarkup(
        selection,
        typeTag,
        body
      );
      editor.replaceRange(wrapped, from, to);
      this.pendingPulseOffset = fromOffset;
      // 選択がハイライト全体を覆ったままだと生の記法が出続けるため、記法の
      // 直後にキャレットだけを置く。境界に接する位置は内側と見なされない
      const insertEndPos = editor.offsetToPos(fromOffset + wrapped.length);
      editor.setSelection(insertEndPos, insertEndPos);
      editor.focus();
      if (adjusted) {
        new Notice(this.i18n.t("notice.commentBodyAdjusted"));
      }
    }).open();
  }

  /** 新しいコメント1件の記法。編集モードと読み取りモードが共有する */
  private newCommentMarkup(
    selection: string,
    typeTag: string,
    body: string
  ): { wrapped: string; adjusted: boolean } {
    const date = formatDate(new Date(), this.settings.dateFormat);
    const author = sanitizeAuthor(this.settings.authorName);
    const prepared = prepareCommentBody(
      body.trim() || this.i18n.t("defaultCommentBody")
    );
    const wrapped = `{==${escapeMultiline(
      selection
    )}==}{>>${newCommentId()}|${author}|${date}|${typeTag}: ${
      prepared.body
    }<<}`;
    return { wrapped, adjusted: prepared.adjusted };
  }

  /**
   * 読み取りモードの選択へコメントを付ける。編集面が無いため、選択をブロックの
   * 元の行の中で探して記法の位置へ戻し、Vault.process で書き込む
   */
  addCommentToReadingSelection(view: MarkdownView, typeTag: string = "NOTE") {
    const file = view.file;
    const sel = view.containerEl.win.getSelection();
    if (!file || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      new Notice(this.i18n.t("notice.selectTextFirst"));
      return;
    }
    const range = sel.getRangeAt(0);
    const selected = range.toString();
    if (!selected.trim()) {
      new Notice(this.i18n.t("notice.selectTextFirst"));
      return;
    }

    // 段落をまたぐ選択は記法へ戻すと改行が潰れる。1つのブロックの中に限る
    const section = findReadingSection(range.startContainer);
    if (!section || findReadingSection(range.endContainer)?.el !== section.el) {
      new Notice(this.i18n.t("notice.readingSelectionNotFound"));
      return;
    }
    const occurrence = countOccurrences(
      visibleTextBefore(section.el, range),
      selected
    );
    const locate = (data: string): LocateResult => {
      const block = lineRangeToOffsets(data, section.lineStart, section.lineEnd);
      return block
        ? locateSelection(data, block.from, block.to, selected, occurrence)
        : { error: "notFound" };
    };

    // 本文を書かせる前に確かめる。書き終えてから断ると入力が無駄になる
    const found = locate(section.text);
    if ("error" in found) {
      new Notice(
        this.i18n.t(
          found.error === "nested"
            ? "notice.alreadyHasComment"
            : "notice.readingSelectionNotFound"
        )
      );
      return;
    }
    const target = section.text.slice(found.from, found.to);

    const typeLabel = this.i18n.t(
      TYPES.find((t) => t.tag === typeTag)?.labelKey ?? "type.note"
    );
    new CommentInputModal(this, typeLabel, (body) => {
      const { wrapped, adjusted } = this.newCommentMarkup(target, typeTag, body);
      void (async () => {
        let changed = false;
        await this.app.vault.process(file, (data) => {
          const at = locate(data);
          if ("error" in at || data.slice(at.from, at.to) !== target) {
            changed = true;
            return data;
          }
          return data.slice(0, at.from) + wrapped + data.slice(at.to);
        });
        view.containerEl.win.getSelection()?.removeAllRanges();
        if (changed) {
          new Notice(this.i18n.t("notice.noteChangedDuringEdit"));
        } else if (adjusted) {
          new Notice(this.i18n.t("notice.commentBodyAdjusted"));
        }
      })();
    }).open();
  }

  /** コメントノートを作り直す。件数が0なら置き場を作らずに知らせるだけ */
  async runSyncCommentNotes() {
    const count = await syncCommentNotes(this);
    if (count === 0) {
      new Notice(this.i18n.t("notice.nothingToSync"));
      return;
    }
    new Notice(
      this.i18n.t("notice.commentNotesSynced", { count: String(count) })
    );
  }

  async runExportComments() {
    const { count, path } = await exportComments(this);
    if (count === 0) {
      new Notice(this.i18n.t("notice.nothingToSync"));
      return;
    }
    new Notice(
      this.i18n.t("notice.commentsExported", { count: String(count), path })
    );
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
