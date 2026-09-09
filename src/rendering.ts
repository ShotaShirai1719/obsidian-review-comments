import {
  App,
  Component,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TFile,
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
import { COMMENT_REGEX } from "./constants";
import {
  ParsedMeta,
  parseMeta,
  unescapeMultiline,
} from "./comment-format";
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
    private readonly meta: ParsedMeta,
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
      other.sourcePath === this.sourcePath &&
      other.range.from === this.range.from &&
      other.range.to === this.range.to &&
      other.meta.type === this.meta.type &&
      other.meta.author === this.meta.author &&
      other.meta.date === this.meta.date &&
      other.meta.body === this.meta.body
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = activeDocument.createElement("span");
    wrapper.className = "review-comment-widget";
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

    appendCommentBubble(wrapper, this.meta, this.plugin.i18n, () => {
      view.dispatch({
        changes: {
          from: this.range.from,
          to: this.range.to,
          insert: this.highlighted,
        },
      });
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

export function createCommentDecorationExtension(
  plugin: ReviewCommentsPlugin
) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
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
        const text = view.state.doc.toString();
        const regex = new RegExp(COMMENT_REGEX);
        let m: RegExpExecArray | null;
        const ranges = view.state.selection.ranges;
        const info = view.state.field(editorInfoField, false);
        const sourcePath = info?.file?.path ?? "";

        while ((m = regex.exec(text))) {
          const start = m.index;
          const end = start + m[0].length;
          // カーソルか選択がコメントの内側へ入っているときだけ生の記法を出す。
          // 境界に接しているだけなら吹き出しのままにする
          const cursorInside = ranges.some((r) => r.from < end && r.to > start);
          // 挿入時に改行はエスケープされるので通常は来ないが、外で手書きされた
          // 記法への保険。Decoration.replace は改行をまたぐ範囲を置き換えられない
          const spansMultipleLines = m[0].includes("\n");

          if (cursorInside || spansMultipleLines) {
            const highlightTextStart = start + 3;
            const highlightTextEnd = highlightTextStart + m[1].length;
            // "==}" の3文字を渡してから {>>...<<} を薄字にする
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
            const meta = parseMeta(m[2]);
            const isPulseTarget = plugin.pendingPulseOffset === start;
            if (isPulseTarget) {
              plugin.pendingPulseOffset = null;
            }
            builder.add(
              start,
              end,
              Decoration.replace({
                widget: new CommentWidget(
                  unescapeMultiline(m[1]),
                  meta,
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
  const wholeBlockRegex = new RegExp(`^${COMMENT_REGEX.source}$`);
  const blockCandidates = Array.from(
    el.querySelectorAll("p, li, td, th, blockquote")
  ).filter((elm) => elm.children.length === 0);

  for (const blockEl of blockCandidates) {
    const m = (blockEl.textContent || "").match(wholeBlockRegex);
    if (!m) continue;

    const meta = parseMeta(m[2]);
    const highlighted = unescapeMultiline(m[1]);
    const fullMatch = m[0];
    const replaced = doc.createElement("div");
    replaced.className = "review-comment-block";

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

    appendCommentBubble(replaced, meta, plugin.i18n, () =>
      deleteCommentInFile(plugin.app, ctx.sourcePath, fullMatch, highlighted)
    );
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

    const regex = new RegExp(COMMENT_REGEX);
    let m: RegExpExecArray | null;
    let lastIndex = 0;
    const frag = doc.createDocumentFragment();
    let matched = false;

    while ((m = regex.exec(text))) {
      matched = true;
      if (m.index > lastIndex) {
        frag.appendChild(doc.createTextNode(text.slice(lastIndex, m.index)));
      }

      const meta = parseMeta(m[2]);
      const fullMatch = m[0];
      const highlighted = unescapeMultiline(m[1]);
      const span = doc.createElement("span");
      span.className = "review-comment-highlight";

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

      appendCommentBubble(span, meta, plugin.i18n, () =>
        deleteCommentInFile(plugin.app, ctx.sourcePath, fullMatch, highlighted)
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

  await Promise.all(renderTasks);
}

/**
 * 読み取りモードの削除。post processor には編集中の Editor が渡らないため、
 * Vault.process でファイルを読み込みから保存まで一続きに書き換える。
 */
async function deleteCommentInFile(
  app: App,
  sourcePath: string,
  fullMatch: string,
  highlighted: string
) {
  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return;
  await app.vault.process(file, (data) => {
    const at = data.indexOf(fullMatch);
    if (at === -1) return data;
    // 位置で切り貼りする。String.replace はハイライト側の $& を置換指定として扱う
    return data.slice(0, at) + highlighted + data.slice(at + fullMatch.length);
  });
}
