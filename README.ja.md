# Obsidian Review Comments

Notionスタイルのレビューコメント機能。テキスト選択でフローティングボタンが出て、コメントを書ける。
コメントは **CriticMarkup形式** で `.md` ファイルに直接保存されるため、ClaudeやGPTがそのまま読んで修正できる。

## コメント形式

```markdown
原文の{==ここ==}{>>shirai|2026-05-13: 直したい<<}に問題があります。
```

- `{==...==}` … ハイライト対象（黄色でレンダリング）
- `{>>author|date: comment<<}` … コメントメタデータ

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

プラグインのUI（モーダル、通知、サイドパネル、設定画面）は日本語・英語・スペイン語・簡体字中国語・フランス語・ドイツ語・ポルトガル語・韓国語に対応しています。デフォルトではObsidian本体の表示言語設定（設定 → 全般 → 言語）に従いますが、設定 → Review Comments → `Language` で個別に指定することもできます。ほとんどのUIは即座に切り替わりますが、コマンド名とリボンアイコンのツールチップに完全に反映するにはObsidianの再読み込みが必要です。

## 使い方

1. テキストをドラッグで選択
2. 選択範囲の右上に表示される **💬 Comment** ボタンをクリック
3. モーダルにコメントを入力する。複数行や箇条書きもそのまま書ける

または:
- 選択 → コマンドパレット → `Review Comments: Add comment to selection`
- ホットキー割り当て推奨（例: `Cmd + Shift + M`）

## サイドパネル

左リボンの吹き出しアイコン、または `Review Comments: Open comments panel` コマンドで開く。

- カードクリック / `Jump` … 該当箇所にジャンプ
- `Resolve` ボタン … `{==text==}{>>...<<}` を `text` に置換（コメント削除）

## AI連携

`.md` をそのままClaude Codeなどに渡して:

> このファイル内のCriticMarkup記法（`{==...==}{>>...<<}`）のコメント指示に従って本文を修正し、対応したコメント記法は削除して、ハイライト部分も通常テキストに戻してください。

これで「Notionでコメント → AIに渡して修正」のフローが完結する。

## ライセンス

AGPL-3.0-or-later。詳細は [LICENSE](./LICENSE) を参照。
