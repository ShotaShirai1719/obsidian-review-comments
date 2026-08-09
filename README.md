# Obsidian Review Comments

> 日本語版 README: [README.ja.md](./README.ja.md)

Notion-style review comments for Obsidian. Select text, click the floating button, and add a comment. Comments are stored directly in `.md` files as **CriticMarkup**, so Claude / GPT can read the file and apply the requested edits without any export step.

## Comment format

```markdown
The original {==text==}{>>shirai|2026-05-13: please rewrite<<} has an issue.
```

- `{==...==}` — highlighted span (rendered in yellow)
- `{>>author|date: comment<<}` — comment metadata

## Build

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ (includes npm) and `git`.

```bash
git clone https://github.com/ShotaShirai1719/obsidian-review-comments.git
cd obsidian-review-comments
npm install
npm run build
```

`npm run build` runs a production `esbuild` bundle of `main.ts` (and `src/i18n.ts`) into a single `main.js` at the repo root. Together with the existing `manifest.json` and `styles.css`, that's everything Obsidian needs to load the plugin — see [Install](#install) below for where to put them.

For active development, use watch mode instead, which rebuilds `main.js` automatically on save:

```bash
npm run dev
```

If you symlinked the repo into your vault's plugins folder (see [Install](#install)), just reload Obsidian (`Ctrl/Cmd + R` in the developer console, or disable/re-enable the plugin) after each rebuild to pick up changes.

## Install

Let `$VAULT` be the absolute path to your Obsidian vault:

```bash
mkdir -p "$VAULT/.obsidian/plugins/review-comments"
cp main.js manifest.json styles.css "$VAULT/.obsidian/plugins/review-comments/"
```

Or, for development, symlink the working directory:

```bash
ln -s "$(pwd)" "$VAULT/.obsidian/plugins/review-comments"
```

Then in Obsidian:

1. Settings → Community plugins → enable **Review Comments**
2. Settings → Review Comments → set `Author name` to your own name

## Language

The plugin UI (modal, notices, side panel, settings) is available in English, Japanese, Spanish, Chinese (Simplified), French, German, Portuguese, and Korean. By default it follows Obsidian's own display language (Settings → General → Language); you can override it under Settings → Review Comments → `Language`. Changing it takes effect immediately for most of the UI — reload Obsidian to also update command names and the ribbon icon tooltip.

## Usage

1. Drag-select a span of text
2. Click the **💬 Comment** button that appears near the selection
3. Enter your comment in the modal. Multiline notes and bullet lists are supported.

Alternatively:

- Select text → Command palette → `Review Comments: Add comment to selection`
- Assign a hotkey (recommended: `Cmd + Shift + M`)

## Side panel

Open the comments panel from the left ribbon (speech-bubble icon) or via `Review Comments: Open comments panel`.

- Click a card or `Jump` → jump to the corresponding location in the document
- `Resolve` button → replace `{==text==}{>>...<<}` with `text` (deletes the comment, keeps the original text)

## AI integration

Pass the `.md` file directly to Claude Code or another LLM with a prompt like:

> Apply the edits described in the CriticMarkup comments (`{==...==}{>>...<<}`) in this file. Remove the CriticMarkup once each comment has been applied, and restore the highlighted spans to plain text.

This closes the loop: comment in Obsidian → hand off to an LLM → get a clean diff back.

## License

[AGPL-3.0-or-later](./LICENSE).

Any modified version that you distribute, **or expose over a network**, must be made available under the same license. If that's a constraint for your use case, please open an issue before integrating this plugin into a closed product.
