import {
  Component,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  Notice,
  editorInfoField,
} from "obsidian";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { COMMENT_THREAD_REGEX } from "./constants";
import {
  CommentThread,
  ParsedMeta,
  buildReplyThread,
  buildThreadWithNewBody,
  formatDate,
  parseThreads,
  prepareCommentBody,
  sanitizeAuthor,
} from "./comment-format";
import { TYPES } from "./constants";
import { CommentInputModal } from "./modal";
import {
  appendCommentBubble,
  renderIntoInlineContext,
} from "./ui/comment-bubble";
import type ReviewCommentsPlugin from "./main";

class CommentWidget extends WidgetType {
  // Markdown の再描画が登録する子コンポーネントの受け皿。decoration を作り直す
  // たびに widget は捨てられるため、destroy() で unload して溜めない
  private renderComponent: Component | null = null;

  constructor(
    private readonly highlighted: string,
    private readonly rawHighlighted: string,
    private readonly entries: ParsedMeta[],
    private readonly plugin: ReviewCommentsPlugin,
    private readonly sourcePath: string,
    private readonly range: { from: number; to: number },
    private readonly pulse: boolean = false
  ) {
    super();
  }

  eq(other: CommentWidget): boolean {
    // pulse は比較から外す。挿入直後に1回だけ付けた DOM は使い回してよく、
    // 比較に入れると演出が終わったあとに要素が作り直される
    return (
      other.highlighted === this.highlighted &&
      other.rawHighlighted === this.rawHighlighted &&
      other.sourcePath === this.sourcePath &&
      other.range.from === this.range.from &&
      other.range.to === this.range.to &&
      other.entries.length === this.entries.length &&
      other.entries.every((e, i) => {
        const mine = this.entries[i];
        return (
          e.id === mine.id &&
          e.type === mine.type &&
          e.author === mine.author &&
          e.date === mine.date &&
          e.body === mine.body
        );
      })
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = createSpan({ cls: "review-comment-widget" });
    if (this.pulse) {
      wrapper.addClass("review-comment-widget-pulse");
    }

    this.renderComponent = new Component();
    this.renderComponent.load();

    const content = wrapper.createSpan({
      cls: "review-comment-widget-content",
    });
    void renderIntoInlineContext(
      this.plugin.app,
      this.highlighted,
      content,
      this.sourcePath,
      this.renderComponent
    );

    // ignoreEvent が true なので CodeMirror はこの widget 上のクリックを扱わない。
    // 本文部分を押したときは、押した位置に対応する生テキストの中へカーソルを置く。
    // カーソルが内側へ入れば buildDecorations が生の記法に切り替える
    content.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, .review-comment-bubble-popover")) return;
      e.preventDefault();
      const renderedOffset = renderedOffsetAtPoint(content, e.clientX, e.clientY);
      const rawOffset = mapRenderedToRaw(
        content.textContent ?? "",
        this.rawHighlighted,
        renderedOffset
      );
      const textStart = this.range.from + 3;
      const anchor = Math.min(
        Math.max(textStart + rawOffset, this.range.from + 1),
        this.range.to - 1
      );
      view.dispatch({ selection: { anchor } });
      view.focus();
    });

    const replaceRange = (insert: string) =>
      view.dispatch({
        changes: { from: this.range.from, to: this.range.to, insert },
      });

    appendCommentBubble(wrapper, this.entries, this.plugin.i18n, {
      onDelete: () => replaceRange(this.highlighted),
      onEdit: () =>
        openCommentEditModal(this.plugin, this.entries[0], (preparedBody) =>
          replaceRange(
            buildThreadWithNewBody(
              this.rawHighlighted,
              this.entries,
              preparedBody,
              fallbackMeta(this.plugin)
            )
          )
        ),
      onReply: () =>
        openReplyModal(this.plugin, (preparedBody) =>
          replaceRange(
            buildReplyThread(
              this.rawHighlighted,
              this.entries,
              preparedBody,
              fallbackMeta(this.plugin)
            )
          )
        ),
    });
    return wrapper;
  }

  destroy(): void {
    this.renderComponent?.unload();
    this.renderComponent = null;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

// 押した座標が container の描画テキストの何文字目かを返す。取れなければ末尾
function renderedOffsetAtPoint(
  container: HTMLElement,
  x: number,
  y: number
): number {
  const doc = container.ownerDocument;
  const total = container.textContent?.length ?? 0;
  let node: Node | null = null;
  let offset = 0;
  const anyDoc = doc as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number } | null;
  };
  if (typeof anyDoc.caretPositionFromPoint === "function") {
    const pos = anyDoc.caretPositionFromPoint(x, y);
    if (pos) {
      node = pos.offsetNode;
      offset = pos.offset;
    }
  } else if (typeof doc.caretRangeFromPoint === "function") {
    const r = doc.caretRangeFromPoint(x, y);
    if (r) {
      node = r.startContainer;
      offset = r.startOffset;
    }
  }
  if (!node || !container.contains(node)) return total;
  const range = doc.createRange();
  range.setStart(container, 0);
  range.setEnd(node, offset);
  return range.toString().length;
}

// 描画テキストの位置を生テキストの位置へ寄せる。** などの記法の文字は描画に
// 出ないので、生テキスト側を先へ進めながら同じ文字を突き合わせる
function mapRenderedToRaw(
  rendered: string,
  raw: string,
  renderedOffset: number
): number {
  let j = 0;
  for (let i = 0; i < renderedOffset && i < rendered.length; i++) {
    const found = raw.indexOf(rendered[i], j);
    if (found === -1) break;
    j = found + 1;
  }
  return Math.min(j, raw.length);
}

export function createCommentDecorationExtension(
  plugin: ReviewCommentsPlugin
) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      // 記法の解析結果。本文が変わったときだけ作り直す。カーソルを動かすたびに
      // 全文を文字列化して正規表現を当てると、大きいノートで打鍵ごとに効く
      private threads: CommentThread[];

      constructor(view: EditorView) {
        this.threads = parseThreads(view.state.doc.toString());
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.threads = parseThreads(update.state.doc.toString());
        }
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet
        ) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const ranges = view.state.selection.ranges;
        const info = view.state.field(editorInfoField, false);
        const sourcePath = info?.file?.path ?? "";

        for (const thread of this.threads) {
          const start = thread.offset;
          const end = start + thread.full.length;
          // カーソルか選択がコメントの内側へ入っているときだけ生の記法を出す。
          // 境界に接しているだけなら吹き出しのままにする
          const cursorInside = ranges.some((r) => r.from < end && r.to > start);
          // 挿入時に改行はエスケープされるので通常は来ないが、外で手書きされた
          // 記法への保険。Decoration.replace は改行をまたぐ範囲を置き換えられない
          const spansMultipleLines = thread.full.includes("\n");

          if (cursorInside || spansMultipleLines) {
            const highlightTextStart = start + 3;
            const highlightTextEnd =
              highlightTextStart + thread.rawHighlighted.length;
            // "==}" の3文字を渡してから、続く記法すべてを薄字にする
            const metaStart = highlightTextEnd + 3;

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
          } else {
            const isPulseTarget = plugin.pendingPulseOffset === start;
            if (isPulseTarget) {
              plugin.pendingPulseOffset = null;
            }
            builder.add(
              start,
              end,
              Decoration.replace({
                widget: new CommentWidget(
                  thread.highlighted,
                  thread.rawHighlighted,
                  thread.entries,
                  plugin,
                  sourcePath,
                  { from: start, to: end },
                  isPulseTarget
                ),
              })
            );
          }
        }

        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

export async function renderCommentsInReadingMode(
  plugin: ReviewCommentsPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  // MarkdownRenderer へ渡すコンポーネントは el 専属にする。ctx.addChild へ
  // 登録しておくと、このブロックが DOM から外れた時点で unload される
  const renderChild = new MarkdownRenderChild(el);
  ctx.addChild(renderChild);
  const renderTasks: Promise<void>[] = [];
  const doc = el.ownerDocument;

  // ブロック全体がちょうど1つのコメントの場合。見出し行を丸ごと囲んだときに、
  // 通常の構文解析の外側でも見出しとして描くためハイライト部分を再描画する
  const wholeBlockRegex = new RegExp(`^${COMMENT_THREAD_REGEX.source}$`);
  const blockCandidates = Array.from(
    el.querySelectorAll("p, li, td, th, blockquote")
  ).filter((elm) => elm.children.length === 0);

  for (const blockEl of blockCandidates) {
    const blockText = blockEl.textContent || "";
    if (!wholeBlockRegex.test(blockText)) continue;
    const thread = parseThreads(blockText)[0];
    if (!thread) continue;

    const { entries, highlighted, rawHighlighted, full: fullMatch } = thread;
    const replaced = createDiv({ cls: "review-comment-block" });

    const content = replaced.createDiv({
      cls: "review-comment-block-content",
    });
    renderTasks.push(
      renderIntoInlineContext(
        plugin.app,
        highlighted,
        content,
        ctx.sourcePath,
        renderChild
      )
    );

    appendCommentBubble(replaced, entries, plugin.i18n, {
      onDelete: () =>
        void replaceCommentInFile(
          plugin,
          ctx.sourcePath,
          fullMatch,
          highlighted
        ),
      onEdit: () =>
        openCommentEditModal(plugin, entries[0], (preparedBody) =>
          void replaceCommentInFile(
            plugin,
            ctx.sourcePath,
            fullMatch,
            buildThreadWithNewBody(
              rawHighlighted,
              entries,
              preparedBody,
              fallbackMeta(plugin)
            )
          )
        ),
      onReply: () =>
        openReplyModal(plugin, (preparedBody) =>
          void replaceCommentInFile(
            plugin,
            ctx.sourcePath,
            fullMatch,
            buildReplyThread(
              rawHighlighted,
              entries,
              preparedBody,
              fallbackMeta(plugin)
            )
          )
        ),
    });
    blockEl.replaceWith(replaced);
  }

  // 表のセルの値など、ブロックの一部だけがコメントの場合
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  for (const tn of textNodes) {
    const text = tn.textContent || "";
    if (text.indexOf("{==") === -1) continue;

    let lastIndex = 0;
    const frag = createFragment();
    let matched = false;

    for (const thread of parseThreads(text)) {
      matched = true;
      if (thread.offset > lastIndex) {
        frag.appendChild(
          doc.createTextNode(text.slice(lastIndex, thread.offset))
        );
      }

      const {
        entries,
        highlighted,
        rawHighlighted,
        full: fullMatch,
      } = thread;
      const span = createSpan({ cls: "review-comment-highlight" });

      const content = span.createSpan({
        cls: "review-comment-highlight-content",
      });
      renderTasks.push(
        renderIntoInlineContext(
          plugin.app,
          highlighted,
          content,
          ctx.sourcePath,
          renderChild
        )
      );

      appendCommentBubble(span, entries, plugin.i18n, {
        onDelete: () =>
          void replaceCommentInFile(
            plugin,
            ctx.sourcePath,
            fullMatch,
            highlighted
          ),
        onEdit: () =>
          openCommentEditModal(plugin, entries[0], (preparedBody) =>
            void replaceCommentInFile(
              plugin,
              ctx.sourcePath,
              fullMatch,
              buildThreadWithNewBody(
                rawHighlighted,
                entries,
                preparedBody,
                fallbackMeta(plugin)
              )
            )
          ),
        onReply: () =>
          openReplyModal(plugin, (preparedBody) =>
            void replaceCommentInFile(
              plugin,
              ctx.sourcePath,
              fullMatch,
              buildReplyThread(
                rawHighlighted,
                entries,
                preparedBody,
                fallbackMeta(plugin)
              )
            )
          ),
      });
      frag.appendChild(span);
      lastIndex = thread.offset + fullMatch.length;
    }

    if (!matched) continue;
    if (lastIndex < text.length) {
      frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
    }
    tn.parentNode?.replaceChild(frag, tn);
  }

  await Promise.all(renderTasks);
}

// 記法が読めなかったときに埋める投稿者と日付
function fallbackMeta(plugin: ReviewCommentsPlugin) {
  return {
    author: sanitizeAuthor(plugin.settings.authorName),
    date: formatDate(new Date(), plugin.settings.dateFormat),
  };
}

// 本文を入れたモーダルを開き、書き込める形にしてから渡す
function openCommentEditModal(
  plugin: ReviewCommentsPlugin,
  meta: ParsedMeta,
  onSave: (preparedBody: string) => void
) {
  const typeLabel = plugin.i18n.t(
    TYPES.find((t) => t.tag === meta.type)?.labelKey ?? "type.note"
  );
  new CommentInputModal(
    plugin,
    typeLabel,
    (body) => {
      const prepared = prepareCommentBody(body);
      if (!prepared.body) {
        new Notice(plugin.i18n.t("notice.emptyCommentBody"));
        return;
      }
      onSave(prepared.body);
      if (prepared.adjusted) {
        new Notice(plugin.i18n.t("notice.commentBodyAdjusted"));
      }
    },
    { initialBody: meta.body }
  ).open();
}

/**
 * 返信の本文を受け取るモーダルを開く。新規コメントと同じ入力欄を使い、
 * 見出しだけ返信の語に差し替える
 */
function openReplyModal(
  plugin: ReviewCommentsPlugin,
  onSave: (preparedBody: string) => void
) {
  new CommentInputModal(
    plugin,
    plugin.i18n.t("type.reply"),
    (body) => {
      const prepared = prepareCommentBody(body);
      if (!prepared.body) {
        new Notice(plugin.i18n.t("notice.emptyCommentBody"));
        return;
      }
      onSave(prepared.body);
      if (prepared.adjusted) {
        new Notice(plugin.i18n.t("notice.commentBodyAdjusted"));
      }
    }
  ).open();
}

/**
 * 読み取りモードから書き込む唯一の経路。post processor には編集中の Editor が
 * 渡らないため、Vault.process でファイルを読み込みから保存まで一続きに扱う
 */
async function replaceCommentInFile(
  plugin: ReviewCommentsPlugin,
  sourcePath: string,
  fullMatch: string,
  replacement: string
) {
  const file = plugin.app.vault.getFileByPath(sourcePath);
  if (!file) return;

  let ambiguous = false;
  await plugin.app.vault.process(file, (data) => {
    const at = data.indexOf(fullMatch);
    if (at === -1) return data;
    // 同じ記法が2つあると、押した吹き出しと違う方を書き換える。識別子が付いた
    // 記法なら重ならないが、識別子の無い古い記法では起こりうる
    if (data.indexOf(fullMatch, at + fullMatch.length) !== -1) {
      ambiguous = true;
      return data;
    }
    // 位置で切り貼りする。String.replace は置換側の $& を置換指定として扱う
    return data.slice(0, at) + replacement + data.slice(at + fullMatch.length);
  });

  if (ambiguous) {
    new Notice(plugin.i18n.t("notice.ambiguousComment"));
  }
}
