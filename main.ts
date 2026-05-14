import {
  App,
  Editor,
  ItemView,
  MarkdownPostProcessorContext,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
} from "obsidian";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

interface ReviewCommentsSettings {
  authorName: string;
  dateFormat: "iso" | "japanese";
}

const DEFAULT_SETTINGS: ReviewCommentsSettings = {
  authorName: "you",
  dateFormat: "iso",
};

// CriticMarkup-style with type tag:
// {==highlighted text==}{>>author|date|TYPE: comment<<}
const COMMENT_REGEX = /\{==([\s\S]+?)==\}\{>>([\s\S]+?)<<\}/g;
const VIEW_TYPE_COMMENTS = "review-comments-view";

const TYPES: { id: string; tag: string; label: string; icon: string }[] = [
  { id: "ask", tag: "ASK", label: "Ask", icon: "❓" },
  { id: "edit", tag: "EDIT", label: "Edit", icon: "✏️" },
  { id: "praise", tag: "PRAISE", label: "Praise", icon: "👍" },
  { id: "note", tag: "NOTE", label: "Note", icon: "💬" },
];

const TYPE_ICON: Record<string, string> = TYPES.reduce((acc, t) => {
  acc[t.tag] = t.icon;
  return acc;
}, {} as Record<string, string>);

interface ParsedMeta {
  author: string;
  date: string;
  type: string;
  body: string;
}

function parseMeta(meta: string): ParsedMeta {
  // New format: author|date|TYPE: body
  const newFmt = meta.match(/^([^|]+)\|([^|]+)\|([A-Z]+):\s*([\s\S]*)$/);
  if (newFmt) {
    return {
      author: newFmt[1].trim(),
      date: newFmt[2].trim(),
      type: newFmt[3].trim(),
      body: newFmt[4].trim(),
    };
  }
  // Old format: author|date: body
  const oldFmt = meta.match(/^([^|]+)\|([^|:]+):\s*([\s\S]*)$/);
  if (oldFmt) {
    return {
      author: oldFmt[1].trim(),
      date: oldFmt[2].trim(),
      type: "NOTE",
      body: oldFmt[3].trim(),
    };
  }
  return { author: "", date: "", type: "NOTE", body: meta };
}

export default class ReviewCommentsPlugin extends Plugin {
  settings: ReviewCommentsSettings = DEFAULT_SETTINGS;
  floatingBar: HTMLDivElement | null = null;
  selectionDebounce: number | null = null;

  async onload() {
    console.log("[ReviewComments] onload");
    await this.loadSettings();

    // One command per type so each can have its own hotkey
    for (const t of TYPES) {
      this.addCommand({
        id: `add-comment-${t.id}`,
        name: `Add ${t.label} comment ${t.icon} to selection`,
        editorCallback: (editor: Editor) =>
          this.addCommentToSelection(editor, t.tag),
      });
    }

    this.addCommand({
      id: "open-comments-panel",
      name: "Open comments panel",
      callback: () => this.activateView(),
    });

    this.addRibbonIcon("message-circle", "Review Comments", () => {
      void this.activateView();
    });

    this.registerView(
      VIEW_TYPE_COMMENTS,
      (leaf) => new CommentsView(leaf, this)
    );

    this.registerEditorExtension([createCommentDecorationExtension()]);

    this.registerMarkdownPostProcessor((el, ctx) =>
      this.renderCommentsInReadingMode(el, ctx)
    );

    this.setupFloatingBar();

    this.addSettingTab(new ReviewCommentsSettingTab(this.app, this));
  }

  onunload() {
    console.log("[ReviewComments] onunload");
    if (this.floatingBar) {
      this.floatingBar.remove();
      this.floatingBar = null;
    }
  }

  async loadSettings() {
    const data = (await this.loadData()) as Partial<ReviewCommentsSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  addCommentToSelection(editor: Editor, typeTag: string = "NOTE") {
    const selection = editor.getSelection();
    if (!selection) {
      new Notice("先にテキストを選択してください");
      return;
    }
    const date = formatDate(new Date(), this.settings.dateFormat);
    const author = this.settings.authorName;
    const placeholder = "コメントを書く";
    const wrapped = `{==${selection}==}{>>${author}|${date}|${typeTag}: ${placeholder}<<}`;
    editor.replaceSelection(wrapped);

    const cursor = editor.getCursor();
    const tailLen = "<<}".length;
    const newCh = cursor.ch - tailLen - placeholder.length;
    const startPos = { line: cursor.line, ch: newCh };
    const endPos = { line: cursor.line, ch: newCh + placeholder.length };
    editor.setSelection(startPos, endPos);
    editor.focus();
  }

  async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_COMMENTS);
    if (existing.length > 0) {
      await workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE_COMMENTS, active: true });
      await workspace.revealLeaf(leaf);
    }
  }

  // --- Floating bar (4 type buttons) ---
  setupFloatingBar() {
    const doc = activeDocument;
    const bar = doc.body.createDiv({ cls: "review-comment-floating-bar is-hidden" });
    this.floatingBar = bar;

    for (const t of TYPES) {
      const btn = bar.createEl("button", {
        cls: "review-comment-type-btn",
        attr: { title: `${t.label} (insert ${t.tag})` },
      });
      btn.createSpan({ cls: "rc-icon", text: t.icon });
      btn.createSpan({ cls: "rc-label", text: t.label });
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (mdView && mdView.editor.getSelection()) {
          this.addCommentToSelection(mdView.editor, t.tag);
        }
        this.hideFloatingBar();
      });
    }

    this.registerDomEvent(doc, "selectionchange", () => {
      if (this.selectionDebounce !== null) {
        window.clearTimeout(this.selectionDebounce);
      }
      this.selectionDebounce = window.setTimeout(
        () => this.updateFloatingBar(),
        80
      );
    });

    this.registerDomEvent(window, "scroll", () => this.hideFloatingBar(), {
      capture: true,
    });

    this.registerDomEvent(doc, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.hideFloatingBar();
    });
  }

  updateFloatingBar() {
    if (!this.floatingBar) return;

    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      this.hideFloatingBar();
      return;
    }

    const selText = mdView.editor.getSelection();
    if (!selText) {
      this.hideFloatingBar();
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      this.hideFloatingBar();
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      this.hideFloatingBar();
      return;
    }

    const bar = this.floatingBar;
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

  hideFloatingBar() {
    if (this.floatingBar) {
      this.floatingBar.addClass("is-hidden");
    }
  }

  renderCommentsInReadingMode(
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext
  ) {
    const doc = el.ownerDocument;
    const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }
    for (const tn of textNodes) {
      const text = tn.textContent || "";
      if (text.indexOf("{==") === -1) continue;
      const regex = new RegExp(COMMENT_REGEX);
      let m: RegExpExecArray | null;
      let lastIndex = 0;
      const frag = doc.createDocumentFragment();
      let matched = false;
      while ((m = regex.exec(text))) {
        matched = true;
        if (m.index > lastIndex) {
          frag.appendChild(
            doc.createTextNode(text.slice(lastIndex, m.index))
          );
        }
        const meta = parseMeta(m[2]);
        const span = doc.createElement("span");
        span.className = "review-comment-highlight";
        span.dataset.type = meta.type;
        span.textContent = m[1];
        span.setAttribute(
          "title",
          `${TYPE_ICON[meta.type] || ""} ${meta.author} | ${meta.date}\n${meta.body}`
        );
        frag.appendChild(span);
        lastIndex = m.index + m[0].length;
      }
      if (!matched) continue;
      if (lastIndex < text.length) {
        frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
      }
      tn.parentNode?.replaceChild(frag, tn);
    }
  }
}

function formatDate(d: Date, format: "iso" | "japanese"): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (format === "japanese") return `${y}年${m}月${day}日`;
  return `${y}-${m}-${day}`;
}

// Live-preview decoration
function createCommentDecorationExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const text = view.state.doc.toString();
        const regex = new RegExp(COMMENT_REGEX);
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text))) {
          const start = m.index;
          const highlightTextStart = start + 3;
          const highlightTextEnd = highlightTextStart + m[1].length;
          const metaStart = highlightTextEnd + 2;
          const end = start + m[0].length;

          builder.add(
            highlightTextStart,
            highlightTextEnd,
            Decoration.mark({ class: "review-comment-highlight-live" })
          );
          builder.add(
            metaStart,
            end,
            Decoration.mark({ class: "review-comment-meta-live" })
          );
        }
        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

class CommentsView extends ItemView {
  plugin: ReviewCommentsPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: ReviewCommentsPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_COMMENTS;
  }

  getDisplayText() {
    return "Review Comments";
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
    new Setting(container).setName("Review Comments").setHeading();

    const mdView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      container.createEl("p", {
        text: "マークダウンファイルを開いてください",
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
        text: "コメントはまだありません。テキストを選択して上に出るバーから種類を選んでください。",
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
        text: "Jump",
        cls: "review-comment-action-btn",
      });
      jumpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.jumpTo(mdView, match.offset, match.full.length);
      });

      const resolveBtn = actions.createEl("button", {
        text: "Resolve",
        cls: "review-comment-action-btn review-comment-resolve-btn",
      });
      resolveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const editor = mdView.editor;
        const startPos = editor.offsetToPos(match.offset);
        const endPos = editor.offsetToPos(match.offset + match.full.length);
        editor.replaceRange(match.highlighted, startPos, endPos);
        this.renderComments();
      });

      card.addEventListener("click", () => {
        this.jumpTo(mdView, match.offset, match.full.length);
      });
    });
  }
}

class ReviewCommentsSettingTab extends PluginSettingTab {
  plugin: ReviewCommentsPlugin;

  constructor(app: App, plugin: ReviewCommentsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Author name")
      .setDesc("コメントに記録される名前")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.authorName)
          .onChange(async (value) => {
            this.plugin.settings.authorName = value || "you";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Date format")
      .addDropdown((dd) =>
        dd
          .addOption("iso", "2026-05-13")
          .addOption("japanese", "2026年05月13日")
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value: string) => {
            this.plugin.settings.dateFormat = value as "iso" | "japanese";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("コメント種別").setHeading();
    const list = containerEl.createEl("ul");
    for (const t of TYPES) {
      const li = list.createEl("li");
      li.textContent = `${t.icon} ${t.label} → タグ: ${t.tag}（コマンド: Add ${t.label} comment）`;
    }
    containerEl.createEl("p", {
      text: "各タイプは個別コマンドとして登録されているので、設定→ホットキーで好きなショートカットを割り当てられます。",
      cls: "setting-item-description",
    });
  }
}
