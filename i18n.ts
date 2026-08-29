import { getLanguage } from "obsidian";

// English is the source of truth: every key must exist here.
// Other locales are Partial — missing keys fall back to English.
const en = {
  // Commands & ribbon
  commandAddComment: (label: string, icon: string) =>
    `Add ${label} comment ${icon} to selection`,
  commandOpenPanel: "Open comments panel",
  ribbonTooltip: "Review Comments",

  // Comment type labels
  typeAsk: "Ask",
  typeEdit: "Edit",
  typePraise: "Praise",
  typeNote: "Note",

  // Input modal
  modalTitle: (tag: string) => `Add ${tag} comment`,
  modalHelp: "Multi-line text and bullet lists work as-is.",
  modalPlaceholder: "e.g.\n1. Fix this part\n- Reason\n- Details",
  cancel: "Cancel",
  addComment: "Add comment",

  // Notices
  noticeSelectText: "Select some text first",
  noticeAlreadyCommented: "The selection already contains comment markup",

  // Written into the document when a comment is submitted empty
  emptyCommentBody: "Write a comment",

  // Floating bar
  floatingBtnTooltip: (label: string, tag: string) =>
    `${label} (insert ${tag})`,

  // Comments panel
  panelTitle: "Review Comments",
  panelOpenMarkdownFile: "Open a Markdown file",
  panelEmpty:
    "No comments yet. Select some text and pick a type from the bar that appears.",
  jump: "Jump",
  resolve: "Resolve",

  // Settings tab
  settingAuthorName: "Author name",
  settingAuthorNameDesc: "The name recorded in your comments",
  settingDateFormat: "Date format",
  settingTypesHeading: "Comment types",
  settingTypeItem: (icon: string, label: string, tag: string) =>
    `${icon} ${label} → tag: ${tag} (command: Add ${label} comment)`,
  settingHotkeysHint:
    "Each type is registered as its own command, so you can assign shortcuts under Settings → Hotkeys.",
};

type Locale = typeof en;

const ja: Partial<Locale> = {
  commandAddComment: (label, icon) => `選択範囲に${label}コメント${icon}を追加`,
  commandOpenPanel: "コメントパネルを開く",
  ribbonTooltip: "レビューコメント",

  typeAsk: "質問",
  typeEdit: "修正",
  typePraise: "称賛",
  typeNote: "メモ",

  modalTitle: (tag) => `${tag}コメントを追加`,
  modalHelp: "複数行や箇条書きもそのまま入力できます。",
  modalPlaceholder: "例:\n1. ここを修正したい\n・理由\n・補足",
  cancel: "キャンセル",
  addComment: "コメントを追加",

  noticeSelectText: "先にテキストを選択してください",
  noticeAlreadyCommented: "選択範囲に既にコメント記法が含まれています",

  emptyCommentBody: "コメントを書く",

  floatingBtnTooltip: (label, tag) => `${label}（${tag}を挿入）`,

  panelTitle: "レビューコメント",
  panelOpenMarkdownFile: "マークダウンファイルを開いてください",
  panelEmpty:
    "コメントはまだありません。テキストを選択して上に出るバーから種類を選んでください。",
  jump: "移動",
  resolve: "解決",

  settingAuthorName: "著者名",
  settingAuthorNameDesc: "コメントに記録される名前",
  settingDateFormat: "日付形式",
  settingTypesHeading: "コメント種別",
  settingTypeItem: (icon, label, tag) =>
    `${icon} ${label} → タグ: ${tag}（コマンド: 選択範囲に${label}コメントを追加）`,
  settingHotkeysHint:
    "各タイプは個別コマンドとして登録されているので、設定→ホットキーで好きなショートカットを割り当てられます。",
};

const locales: Record<string, Partial<Locale>> = { en, ja };

// Obsidian relaunches on language change, so resolving once at load is safe.
const lang = getLanguage();
const locale = locales[lang] ?? locales[lang.split("-")[0]] ?? en;

export function t<K extends keyof Locale>(key: K): Locale[K] {
  return locale[key] ?? en[key];
}
