# Obsidian Review Comments

> 日本語版 README: [README.ja.md](./README.ja.md)

Notion-style review comments for Obsidian. Select text, click the floating button, and add a comment. Comments are stored directly in `.md` files as **CriticMarkup**, so Claude / GPT can read the file and apply the requested edits without any export step.

## Comment format

```markdown
The original {==text==}{>>rc-3f9a2b|shirai|2026-05-13|EDIT: please rewrite<<} has an issue.
```

- `{==...==}` — highlighted span
- `{>>id|author|date|TYPE: comment<<}` — comment metadata

Replies are extra `{>>...<<}` blocks with the same id, appended directly after the first one:

```markdown
{==text==}{>>rc-3f9a2b|shirai|2026-05-13|EDIT: please rewrite<<}{>>rc-3f9a2b|claude|2026-05-14|REPLY: rewritten<<}
```

Comments written by older versions carry no id and no type. They are still read, still rendered, and get an id the first time you reply to them.

In the note itself the markup is not shown. The highlighted span is rendered with a small bubble icon next to it, and clicking the icon opens a popover with the comment and a delete button. Put the cursor inside the span and the raw markup appears, so it can still be edited by hand. Newlines inside a comment are stored as `\n`, which keeps one comment on one line and keeps the surrounding Markdown intact.

## Build

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ (includes npm) and `git`.

```bash
git clone https://github.com/ShotaShirai1719/obsidian-review-comments.git
cd obsidian-review-comments
npm install
npm run build
```

`npm run build` runs a production `esbuild` bundle of the TypeScript sources in `src/` (entry point `src/main.ts`) into a single `main.js` at the repo root. Together with the existing `manifest.json` and `styles.css`, that's everything Obsidian needs to load the plugin — see [Install](#install) below for where to put them.

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

The plugin UI is available in English, Japanese, Spanish, Chinese (Simplified), French, German, Portuguese, and Korean. Traditional Chinese is not translated yet, so `zh-TW` and `zh-HK` fall back to English rather than to Simplified Chinese. By default the UI follows Obsidian's own display language (Settings → General → Language); you can override it under Settings → Review Comments → `Language`.

Switching the language updates the floating bar, the comment modal, notices, the side panel and its tab title, and the settings tab straight away. Command names and the ribbon icon tooltip are registered once at load, so reload Obsidian to update those.

## Usage

1. Drag-select a span of text
2. Click the **💬 Comment** button that appears near the selection
3. Enter your comment in the modal. Multiline notes and bullet lists are supported.

To change a comment you have already written, open the side panel, press **Edit** on its card, rewrite the body and press **Save** (`Enter` saves, `Shift + Enter` adds a new line, `Esc` cancels). The author and the date recorded on the comment are kept as they were. If the note itself changed while the card was open, the edit is refused instead of overwriting the wrong range.

Alternatively:

- Select text → Command palette → `Review Comments: Add comment to selection`
- Assign a hotkey (recommended: `Cmd + Shift + M`)

## Dictation

Set `Dictation` to `Custom endpoint` and the comment box and the panel's edit box grow a microphone button — press it to start, press it again to stop, and what you said is inserted at the cursor. The recording is captured as 16 kHz mono WAV and posted to the URL under `Transcription endpoint`.

Point that at a server running on your own machine and the audio never leaves the device and nothing is billed. `whisper.cpp` works on Windows and macOS alike:

```bash
brew install whisper.cpp                      # or build it on Windows
curl -L -o ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
whisper-server -m ggml-small.bin --port 8765  # endpoint: http://127.0.0.1:8765/inference
```

Any endpoint that accepts `multipart/form-data` with a `file` field and answers with JSON carrying a `text` field works in its place. The API key is optional — leave it empty for a local server, fill it in only if you deliberately point the plugin at a service that charges you. `Off`, the default, removes the microphone button and the plugin makes no network requests at all.

## Side panel

Open the comments panel from the left ribbon (speech-bubble icon) or via `Review Comments: Open comments panel`.

- Click a card or `Jump` → jump to the corresponding location in the document
- `Reply` button → append a reply to the thread
- `Resolve` button → append the thread to the resolved comments file, then replace `{==text==}{>>...<<}` with `text`. If the note changed since the card was drawn, the resolve is refused instead of overwriting the wrong range.

## AI integration

Pass the `.md` file directly to Claude Code or another LLM with a prompt like:

> Apply the edits described in the CriticMarkup comments (`{==...==}{>>...<<}`) in this file. Remove the CriticMarkup once each comment has been applied, and restore the highlighted spans to plain text.

This closes the loop: comment in Obsidian → hand off to an LLM → get a clean diff back.

### Querying comments across the vault

The markup in your notes stays the only source of truth. Everything below is rebuilt from it, so deleting any of it is safe.

- `Review Comments: Rebuild comment notes` writes one note per comment under the folder named in the settings, with `id`, `source`, `type`, `author`, `date`, `replies` and `offset` in the frontmatter. Query them with Bases or Dataview.
- `Review Comments: Export all comments as JSON` writes `comments.json` into the same folder — the input to hand an agent when you want every comment in the vault at once.
- Turn on `Keep comment notes up to date automatically` in the settings and saving a note rewrites the notes for that file alone. Only the saved file is read, so the cost does not grow with the size of the vault. Changes made outside Obsidian still need the rebuild command.
- Resolved comments are appended to a file per month — `2026-09.md` and so on — inside the resolved comments folder. The split keeps any one file small enough to open; a vault that collects review comments for years would otherwise end up with a single file nobody can load.

## License

[AGPL-3.0-or-later](./LICENSE).

Any modified version that you distribute, **or expose over a network**, must be made available under the same license. If that's a constraint for your use case, please open an issue before integrating this plugin into a closed product.
