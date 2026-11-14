# Obsidian Review Comments

Notionスタイルのレビューコメント機能。テキスト選択でフローティングボタンが出て、コメントを書ける。
コメントは **CriticMarkup形式** で `.md` ファイルに直接保存されるため、ClaudeやGPTがそのまま読んで修正できる。

## コメント形式

```markdown
原文の{==ここ==}{>>rc-3f9a2b|shirai|2026-05-13|EDIT: 直したい<<}に問題があります。
```

- `{==...==}` … ハイライト対象
- `{>>識別子|投稿者|日付|種別: 本文<<}` … コメントのメタデータ

返信は、同じ識別子を持つ `{>>...<<}` を1件目の直後へ並べる。

```markdown
{==ここ==}{>>rc-3f9a2b|shirai|2026-05-13|EDIT: 直したい<<}{>>rc-3f9a2b|claude|2026-05-14|REPLY: 直した<<}
```

古い版で書いた記法は識別子も種別も持たない。そのまま読めて今までどおり描かれ、最初に返信を付けた時点で識別子が振られる。

ノート上には記法をそのまま出さない。ハイライトの右に小さな吹き出しアイコンが付き、押すとコメント本文と削除ボタンを持つポップオーバーが開く。カーソルをハイライトの内側に入れると生の記法が現れるので、手で直すこともできる。コメント内の改行は `\n` として保存するため、1つのコメントが1行に収まり、周りのMarkdownの構文も壊れない。

## ビルド

**必要環境:** [Node.js](https://nodejs.org/) 18以上（npm同梱）、`git`。

```bash
git clone https://github.com/ShotaShirai1719/obsidian-review-comments.git
cd obsidian-review-comments
npm install
npm run build
```

`npm run build` は `esbuild` で `src/` 以下のTypeScriptソース（エントリポイントは `src/main.ts`）をリポジトリ直下の `main.js` 1ファイルにプロダクションビルドする。既存の `manifest.json` と `styles.css` と合わせれば、Obsidianがプラグインを読み込むのに必要なファイルが揃う（配置先は下記の[インストール](#インストール)を参照）。

開発中は保存のたびに `main.js` を自動で再ビルドするウォッチモードを使うと便利:

```bash
npm run dev
```

リポジトリをVaultのプラグインフォルダにシンボリックリンクしている場合（下記[インストール](#インストール)参照）、再ビルドのたびにObsidianを再読み込み（開発者コンソールで `Ctrl/Cmd + R`、またはプラグインの無効化→有効化）すれば変更が反映される。

## インストール

ObsidianのVaultパスを `$VAULT` とすると:

```bash
mkdir -p "$VAULT/.obsidian/plugins/review-comments"
cp main.js manifest.json styles.css "$VAULT/.obsidian/plugins/review-comments/"
```

または開発時はシンボリックリンク:

```bash
ln -s "$(pwd)" "$VAULT/.obsidian/plugins/review-comments"
```

その後Obsidianで:
1. 設定 → コミュニティプラグイン → インストール済みプラグインで「Review Comments」を有効化
2. 設定 → Review Comments で `Author name` を自分の名前に変更

## 表示言語

プラグインのUIは日本語・英語・スペイン語・簡体字中国語・フランス語・ドイツ語・ポルトガル語・韓国語に対応しています。繁体字中国語は未翻訳のため、`zh-TW` と `zh-HK` は簡体字ではなく英語にフォールバックします。デフォルトではObsidian本体の表示言語設定（設定 → 全般 → 言語）に従いますが、設定 → Review Comments → `Language` で個別に指定することもできます。

言語を切り替えると、フローティングバー、コメント入力モーダル、通知、サイドパネルとそのタブ名、設定画面はその場で切り替わります。コマンド名とリボンアイコンのツールチップは読み込み時に一度登録されるため、こちらはObsidianの再読み込みが必要です。

## 使い方

1. テキストをドラッグで選択
2. 選択範囲の右上に表示される **💬 Comment** ボタンをクリック
3. モーダルにコメントを入力する。複数行や箇条書きもそのまま書ける

打ち終えたコメントを直すときは、サイドパネルのカードで **Edit** を押し、本文を書き換えて **Save** を押す（`Enter` で保存、`Shift + Enter` で改行、`Esc` で取消）。コメントに記録された投稿者と日付は元の値を保つ。カードを開いている間にノート側が変わっていた場合は、別の範囲を書き換えないよう保存を中止する。

または:
- 選択 → コマンドパレット → `Review Comments: Add comment to selection`
- ホットキー割り当て推奨（例: `Cmd + Shift + M`）

## 音声入力

設定の「音声入力」を「別の宛先」にすると、コメントの入力欄とサイドパネルの編集欄にマイクのボタンが出る。押すと始まり、もう一度押すと止まり、喋った内容がカーソルの位置に入る。録音は16kHzモノラルのWAVにして、「文字起こしの宛先」のURLへ送る。

宛先を自分の端末で動かしているサーバーにすれば、音声は端末の外へ出ず、料金も発生しない。`whisper.cpp` は Windows でも macOS でも動く。

```bash
brew install whisper.cpp                      # Windows では自分でビルドする
curl -L -o ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
whisper-server -m ggml-small.bin --port 8765  # 宛先: http://127.0.0.1:8765/inference
```

`multipart/form-data` の `file` を受け取り、`text` を持つ JSON を返す宛先なら何でも使える。鍵は任意で、端末の中のサーバーなら空のままでよい。既定の「使わない」ではマイクのボタンが出ず、プラグインは一切通信しない。

## サイドパネル

左リボンの吹き出しアイコン、または `Review Comments: Open comments panel` コマンドで開く。

- カードクリック / `Jump` … 該当箇所にジャンプ
- `Reply` ボタン … スレッドの末尾へ返信を足す
- `Resolve` ボタン … 対応済みコメントのファイルへ控えを追記してから、`{==text==}{>>...<<}` を `text` に置換。カードを描いたあとにノートが変わっていた場合は、別の範囲を書き換えないよう解決を断る

## AI連携

`.md` をそのままClaude Codeなどに渡して:

> このファイル内のCriticMarkup記法（`{==...==}{>>...<<}`）のコメント指示に従って本文を修正し、対応したコメント記法は削除して、ハイライト部分も通常テキストに戻してください。

これで「Notionでコメント → AIに渡して修正」のフローが完結する。

### vault 横断でコメントを引く

参照元はノートの記法だけ。以下はすべて記法から作り直せる派生物なので、消しても戻せる。

- `Review Comments: コメントノートを作り直す` … 設定で指定したフォルダに、コメント1件ごとのノートを書く。フロントマターに `id` `source` `type` `author` `date` `replies` `offset` が入るため、Bases と Dataview でそのまま絞り込める
- `Review Comments: すべてのコメントをJSONで書き出す` … 同じフォルダへ `comments.json` を書く。vault 全体のコメントをまとめてエージェントへ渡すときの入力になる
- 設定の「コメントノートを自動で更新する」をオンにすると、ノートを保存した時点でそのファイルのコメントノートだけ書き直す。読むのは保存したファイル1つなので、vault が大きくなっても負荷は増えない。Obsidian の外で直した分は作り直すコマンドで拾う
- 解決したコメントは、対応済みコメントのフォルダの中に `2026-09.md` のような月ごとのファイルとして追記される。1つのファイルへ足し続けると開けない大きさになるため、月で切る

## ライセンス

AGPL-3.0-or-later。詳細は [LICENSE](./LICENSE) を参照。
