import { MarkdownPostProcessorContext } from "obsidian";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { COMMENT_REGEX, TYPE_ICON } from "./constants";
import { parseMeta } from "./comment-format";

export function createCommentDecorationExtension() {
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
          // "==}" の3文字を渡してから {>>...<<} を薄字にする
          const metaStart = highlightTextEnd + 3;
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

export function renderCommentsInReadingMode(
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
        frag.appendChild(doc.createTextNode(text.slice(lastIndex, m.index)));
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
