import { moment } from "obsidian";

export type Locale = "en" | "ja" | "es" | "zh" | "fr" | "de" | "pt" | "ko";
export type LanguageSetting = "auto" | Locale;

export const SUPPORTED_LOCALES: Locale[] = [
  "en",
  "ja",
  "es",
  "zh",
  "fr",
  "de",
  "pt",
  "ko",
];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  es: "Español",
  zh: "简体中文",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ko: "한국어",
};

const en = {
  "type.ask": "Ask",
  "type.edit": "Edit",
  "type.praise": "Praise",
  "type.note": "Note",

  "modal.titleTemplate": "Add {type} comment",
  "modal.help": "Multi-line text and bullet lists are supported.",
  "modal.placeholder":
    "e.g.:\n1. This needs a rewrite\n- Reason\n- Additional notes",
  "modal.cancel": "Cancel",
  "modal.addComment": "Add comment",

  "notice.selectTextFirst": "Please select some text first",
  "notice.alreadyHasComment": "The selection already contains comment markup",
  "defaultCommentBody": "Write a comment",

  "ribbon.tooltip": "Review Comments",
  "command.addCommentTemplate": "Add {type} comment {icon} to selection",
  "command.openPanel": "Open comments panel",

  "panel.viewTitle": "Review Comments",
  "panel.openMarkdownFile": "Open a markdown file to see its comments",
  "panel.noComments":
    "No comments yet. Select some text and choose a type from the bar that appears.",
  "panel.jump": "Jump",
  "panel.resolve": "Resolve",

  "settings.authorName": "Author name",
  "settings.authorNameDesc": "The name recorded on each comment",
  "settings.dateFormat": "Date format",
  "settings.language": "Language",
  "settings.languageDesc": "Language used for the plugin's interface",
  "settings.languageReloadNotice":
    "Reload Obsidian to fully apply the new language to command names and the ribbon icon",
  "settings.commentTypesHeading": "Comment types",
  "settings.commentTypesDesc":
    "Each type is registered as its own command, so you can assign a hotkey to it under Settings → Hotkeys.",
  "settings.commentTypeItemTemplate":
    "{icon} {label} → tag: {tag} (command: {command})",
  "locale.auto": "Auto (match Obsidian)",
  "panel.edit": "Edit",
  "panel.save": "Save",
  "panel.cancel": "Cancel",
  "panel.editHint": "Cmd/Ctrl + Enter to save, Esc to cancel",
  "notice.emptyCommentBody": "The comment body is empty",
  "notice.commentBodyAdjusted": "Comment markup in the body was escaped so the comment stays readable",
  "notice.noteChangedDuringEdit": "The note changed while editing, so nothing was saved",
  "notice.panelOpenFailed": "Could not open the comments panel",
};

export type StringKey = keyof typeof en;

const ja: Record<StringKey, string> = {
  "type.ask": "質問",
  "type.edit": "編集",
  "type.praise": "称賛",
  "type.note": "メモ",

  "modal.titleTemplate": "{type}コメントを追加",
  "modal.help": "複数行や箇条書きもそのまま入力できます。",
  "modal.placeholder": "例:\n1. ここを修正したい\n・理由\n・補足",
  "modal.cancel": "キャンセル",
  "modal.addComment": "コメントを追加",

  "notice.selectTextFirst": "先にテキストを選択してください",
  "notice.alreadyHasComment": "選択範囲に既にコメント記法が含まれています",
  "defaultCommentBody": "コメントを書く",

  "ribbon.tooltip": "レビューコメント",
  "command.addCommentTemplate": "{type}コメント {icon} を選択範囲に追加",
  "command.openPanel": "コメントパネルを開く",

  "panel.viewTitle": "レビューコメント",
  "panel.openMarkdownFile": "マークダウンファイルを開いてください",
  "panel.noComments":
    "コメントはまだありません。テキストを選択して上に出るバーから種類を選んでください。",
  "panel.jump": "移動",
  "panel.resolve": "解決",

  "settings.authorName": "投稿者名",
  "settings.authorNameDesc": "コメントに記録される名前",
  "settings.dateFormat": "日付形式",
  "settings.language": "言語",
  "settings.languageDesc": "プラグインの表示言語",
  "settings.languageReloadNotice":
    "コマンド名やリボンアイコンに完全に反映するにはObsidianを再読み込みしてください",
  "settings.commentTypesHeading": "コメント種別",
  "settings.commentTypesDesc":
    "各タイプは個別コマンドとして登録されているので、設定 → ホットキーで好きなショートカットを割り当てられます。",
  "settings.commentTypeItemTemplate":
    "{icon} {label} → タグ: {tag}（コマンド: {command}）",
  "locale.auto": "自動（Obsidianに合わせる）",
  "panel.edit": "編集",
  "panel.save": "保存",
  "panel.cancel": "取消",
  "panel.editHint": "Cmd/Ctrl + Enter で保存、Esc で取消",
  "notice.emptyCommentBody": "コメント本文が空です",
  "notice.commentBodyAdjusted": "本文に含まれるコメント記法を退避しました",
  "notice.noteChangedDuringEdit": "編集中にノートが変わったため保存しませんでした",
  "notice.panelOpenFailed": "コメントパネルを開けませんでした",
};

const es: Record<StringKey, string> = {
  "type.ask": "Preguntar",
  "type.edit": "Editar",
  "type.praise": "Elogio",
  "type.note": "Nota",

  "modal.titleTemplate": "Añadir comentario de {type}",
  "modal.help": "Se admite texto en varias líneas y listas con viñetas.",
  "modal.placeholder":
    "p. ej.:\n1. Esto necesita reescribirse\n- Motivo\n- Notas adicionales",
  "modal.cancel": "Cancelar",
  "modal.addComment": "Añadir comentario",

  "notice.selectTextFirst": "Selecciona primero algo de texto",
  "notice.alreadyHasComment": "La selección ya contiene marcado de comentario",
  "defaultCommentBody": "Escribe un comentario",

  "ribbon.tooltip": "Comentarios de revisión",
  "command.addCommentTemplate": "Añadir comentario de {type} {icon} a la selección",
  "command.openPanel": "Abrir panel de comentarios",

  "panel.viewTitle": "Comentarios de revisión",
  "panel.openMarkdownFile": "Abre un archivo Markdown para ver sus comentarios",
  "panel.noComments":
    "Aún no hay comentarios. Selecciona texto y elige un tipo en la barra que aparece.",
  "panel.jump": "Ir",
  "panel.resolve": "Resolver",

  "settings.authorName": "Nombre del autor",
  "settings.authorNameDesc": "El nombre que se registra en cada comentario",
  "settings.dateFormat": "Formato de fecha",
  "settings.language": "Idioma",
  "settings.languageDesc": "Idioma de la interfaz del plugin",
  "settings.languageReloadNotice":
    "Recarga Obsidian para aplicar por completo el nuevo idioma a los nombres de comandos y al icono de la cinta",
  "settings.commentTypesHeading": "Tipos de comentario",
  "settings.commentTypesDesc":
    "Cada tipo se registra como su propio comando, así que puedes asignarle un atajo en Ajustes → Atajos de teclado.",
  "settings.commentTypeItemTemplate":
    "{icon} {label} → etiqueta: {tag} (comando: {command})",
  "locale.auto": "Automático (según Obsidian)",
  "panel.edit": "Editar",
  "panel.save": "Guardar",
  "panel.cancel": "Cancelar",
  "panel.editHint": "Cmd/Ctrl + Enter para guardar, Esc para cancelar",
  "notice.emptyCommentBody": "El cuerpo del comentario está vacío",
  "notice.commentBodyAdjusted": "Se ha escapado el marcado de comentario incluido en el texto",
  "notice.noteChangedDuringEdit": "La nota cambió durante la edición, no se guardó nada",
  "notice.panelOpenFailed": "No se pudo abrir el panel de comentarios",
};

const fr: Record<StringKey, string> = {
  "type.ask": "Question",
  "type.edit": "Modifier",
  "type.praise": "Éloge",
  "type.note": "Note",

  "modal.titleTemplate": "Ajouter un commentaire {type}",
  "modal.help": "Le texte multiligne et les listes à puces sont pris en charge.",
  "modal.placeholder":
    "ex. :\n1. Ceci doit être réécrit\n- Raison\n- Remarques complémentaires",
  "modal.cancel": "Annuler",
  "modal.addComment": "Ajouter le commentaire",

  "notice.selectTextFirst": "Veuillez d'abord sélectionner du texte",
  "notice.alreadyHasComment": "La sélection contient déjà une balise de commentaire",
  "defaultCommentBody": "Rédigez un commentaire",

  "ribbon.tooltip": "Commentaires de relecture",
  "command.addCommentTemplate": "Ajouter un commentaire {type} {icon} à la sélection",
  "command.openPanel": "Ouvrir le panneau des commentaires",

  "panel.viewTitle": "Commentaires de relecture",
  "panel.openMarkdownFile": "Ouvrez un fichier Markdown pour voir ses commentaires",
  "panel.noComments":
    "Aucun commentaire pour l'instant. Sélectionnez du texte et choisissez un type dans la barre qui apparaît.",
  "panel.jump": "Aller à",
  "panel.resolve": "Résoudre",

  "settings.authorName": "Nom de l'auteur",
  "settings.authorNameDesc": "Le nom enregistré sur chaque commentaire",
  "settings.dateFormat": "Format de date",
  "settings.language": "Langue",
  "settings.languageDesc": "Langue de l'interface du plugin",
  "settings.languageReloadNotice":
    "Rechargez Obsidian pour appliquer entièrement la nouvelle langue aux noms de commandes et à l'icône du ruban",
  "settings.commentTypesHeading": "Types de commentaire",
  "settings.commentTypesDesc":
    "Chaque type est enregistré comme une commande distincte ; vous pouvez donc lui assigner un raccourci dans Paramètres → Raccourcis clavier.",
  "settings.commentTypeItemTemplate":
    "{icon} {label} → balise : {tag} (commande : {command})",
  "locale.auto": "Automatique (selon Obsidian)",
  "panel.edit": "Modifier",
  "panel.save": "Enregistrer",
  "panel.cancel": "Annuler",
  "panel.editHint": "Cmd/Ctrl + Entrée pour enregistrer, Échap pour annuler",
  "notice.emptyCommentBody": "Le corps du commentaire est vide",
  "notice.commentBodyAdjusted": "Le balisage de commentaire présent dans le texte a été échappé",
  "notice.noteChangedDuringEdit": "La note a changé pendant la modification, rien n'a été enregistré",
  "notice.panelOpenFailed": "Impossible d'ouvrir le panneau des commentaires",
};

const de: Record<StringKey, string> = {
  "type.ask": "Frage",
  "type.edit": "Bearbeiten",
  "type.praise": "Lob",
  "type.note": "Notiz",

  "modal.titleTemplate": "{type}-Kommentar hinzufügen",
  "modal.help": "Mehrzeiliger Text und Aufzählungslisten werden unterstützt.",
  "modal.placeholder":
    "z. B.:\n1. Das muss überarbeitet werden\n- Grund\n- Weitere Hinweise",
  "modal.cancel": "Abbrechen",
  "modal.addComment": "Kommentar hinzufügen",

  "notice.selectTextFirst": "Bitte zuerst Text auswählen",
  "notice.alreadyHasComment": "Die Auswahl enthält bereits eine Kommentarmarkierung",
  "defaultCommentBody": "Kommentar schreiben",

  "ribbon.tooltip": "Review-Kommentare",
  "command.addCommentTemplate": "{type}-Kommentar {icon} zur Auswahl hinzufügen",
  "command.openPanel": "Kommentar-Panel öffnen",

  "panel.viewTitle": "Review-Kommentare",
  "panel.openMarkdownFile": "Öffne eine Markdown-Datei, um ihre Kommentare zu sehen",
  "panel.noComments":
    "Noch keine Kommentare. Wähle Text aus und wähle einen Typ in der erscheinenden Leiste.",
  "panel.jump": "Springen",
  "panel.resolve": "Auflösen",

  "settings.authorName": "Autorenname",
  "settings.authorNameDesc": "Der Name, der bei jedem Kommentar gespeichert wird",
  "settings.dateFormat": "Datumsformat",
  "settings.language": "Sprache",
  "settings.languageDesc": "Sprache der Plugin-Oberfläche",
  "settings.languageReloadNotice":
    "Lade Obsidian neu, damit die neue Sprache vollständig auf Befehlsnamen und das Ribbon-Symbol angewendet wird",
  "settings.commentTypesHeading": "Kommentartypen",
  "settings.commentTypesDesc":
    "Jeder Typ ist als eigener Befehl registriert, sodass du ihm unter Einstellungen → Hotkeys eine Tastenkombination zuweisen kannst.",
  "settings.commentTypeItemTemplate":
    "{icon} {label} → Tag: {tag} (Befehl: {command})",
  "locale.auto": "Automatisch (wie Obsidian)",
  "panel.edit": "Bearbeiten",
  "panel.save": "Speichern",
  "panel.cancel": "Abbrechen",
  "panel.editHint": "Cmd/Ctrl + Enter zum Speichern, Esc zum Abbrechen",
  "notice.emptyCommentBody": "Der Kommentartext ist leer",
  "notice.commentBodyAdjusted": "Kommentar-Markup im Text wurde maskiert",
  "notice.noteChangedDuringEdit": "Die Notiz hat sich während der Bearbeitung geändert, es wurde nichts gespeichert",
  "notice.panelOpenFailed": "Das Kommentar-Panel konnte nicht geöffnet werden",
};

const pt: Record<StringKey, string> = {
  "type.ask": "Pergunta",
  "type.edit": "Editar",
  "type.praise": "Elogio",
  "type.note": "Nota",

  "modal.titleTemplate": "Adicionar comentário de {type}",
  "modal.help": "Texto em várias linhas e listas com marcadores são suportados.",
  "modal.placeholder":
    "ex.:\n1. Isso precisa ser reescrito\n- Motivo\n- Notas adicionais",
  "modal.cancel": "Cancelar",
  "modal.addComment": "Adicionar comentário",

  "notice.selectTextFirst": "Selecione algum texto primeiro",
  "notice.alreadyHasComment": "A seleção já contém marcação de comentário",
  "defaultCommentBody": "Escreva um comentário",

  "ribbon.tooltip": "Comentários de revisão",
  "command.addCommentTemplate": "Adicionar comentário de {type} {icon} à seleção",
  "command.openPanel": "Abrir painel de comentários",

  "panel.viewTitle": "Comentários de revisão",
  "panel.openMarkdownFile": "Abra um arquivo Markdown para ver os comentários",
  "panel.noComments":
    "Ainda não há comentários. Selecione um texto e escolha um tipo na barra que aparece.",
  "panel.jump": "Ir para",
  "panel.resolve": "Resolver",

  "settings.authorName": "Nome do autor",
  "settings.authorNameDesc": "O nome registrado em cada comentário",
  "settings.dateFormat": "Formato de data",
  "settings.language": "Idioma",
  "settings.languageDesc": "Idioma da interface do plugin",
  "settings.languageReloadNotice":
    "Recarregue o Obsidian para aplicar totalmente o novo idioma aos nomes dos comandos e ao ícone da faixa",
  "settings.commentTypesHeading": "Tipos de comentário",
  "settings.commentTypesDesc":
    "Cada tipo é registrado como seu próprio comando, então você pode atribuir um atalho em Configurações → Atalhos de teclado.",
  "settings.commentTypeItemTemplate":
    "{icon} {label} → etiqueta: {tag} (comando: {command})",
  "locale.auto": "Automático (seguir o Obsidian)",
  "panel.edit": "Editar",
  "panel.save": "Salvar",
  "panel.cancel": "Cancelar",
  "panel.editHint": "Cmd/Ctrl + Enter para salvar, Esc para cancelar",
  "notice.emptyCommentBody": "O corpo do comentário está vazio",
  "notice.commentBodyAdjusted": "A marcação de comentário presente no texto foi escapada",
  "notice.noteChangedDuringEdit": "A nota mudou durante a edição, nada foi salvo",
  "notice.panelOpenFailed": "Não foi possível abrir o painel de comentários",
};

const ko: Record<StringKey, string> = {
  "type.ask": "질문",
  "type.edit": "편집",
  "type.praise": "칭찬",
  "type.note": "메모",

  "modal.titleTemplate": "{type} 댓글 추가",
  "modal.help": "여러 줄 텍스트와 글머리 기호 목록도 그대로 입력할 수 있습니다.",
  "modal.placeholder": "예:\n1. 이 부분을 다시 써야 해요\n- 이유\n- 추가 메모",
  "modal.cancel": "취소",
  "modal.addComment": "댓글 추가",

  "notice.selectTextFirst": "먼저 텍스트를 선택하세요",
  "notice.alreadyHasComment": "선택 영역에 이미 댓글 마크업이 포함되어 있습니다",
  "defaultCommentBody": "댓글을 작성하세요",

  "ribbon.tooltip": "리뷰 댓글",
  "command.addCommentTemplate": "선택 영역에 {type} 댓글 {icon} 추가",
  "command.openPanel": "댓글 패널 열기",

  "panel.viewTitle": "리뷰 댓글",
  "panel.openMarkdownFile": "마크다운 파일을 열어 댓글을 확인하세요",
  "panel.noComments":
    "아직 댓글이 없습니다. 텍스트를 선택하고 나타나는 바에서 유형을 선택하세요.",
  "panel.jump": "이동",
  "panel.resolve": "해결",

  "settings.authorName": "작성자 이름",
  "settings.authorNameDesc": "각 댓글에 기록되는 이름",
  "settings.dateFormat": "날짜 형식",
  "settings.language": "언어",
  "settings.languageDesc": "플러그인 인터페이스 언어",
  "settings.languageReloadNotice":
    "명령어 이름과 리본 아이콘에 새 언어를 완전히 적용하려면 Obsidian을 다시 로드하세요",
  "settings.commentTypesHeading": "댓글 유형",
  "settings.commentTypesDesc":
    "각 유형은 개별 명령으로 등록되므로 설정 → 단축키에서 원하는 단축키를 지정할 수 있습니다.",
  "settings.commentTypeItemTemplate": "{icon} {label} → 태그: {tag} (명령: {command})",
  "locale.auto": "자동 (Obsidian 설정에 따름)",
  "panel.edit": "편집",
  "panel.save": "저장",
  "panel.cancel": "취소",
  "panel.editHint": "Cmd/Ctrl + Enter로 저장, Esc로 취소",
  "notice.emptyCommentBody": "코멘트 내용이 비어 있습니다",
  "notice.commentBodyAdjusted": "본문에 포함된 코멘트 표기를 이스케이프했습니다",
  "notice.noteChangedDuringEdit": "편집 중에 노트가 변경되어 저장하지 않았습니다",
  "notice.panelOpenFailed": "코멘트 패널을 열 수 없습니다",
};

const zh: Record<StringKey, string> = {
  "type.ask": "提问",
  "type.edit": "编辑",
  "type.praise": "赞赏",
  "type.note": "备注",

  "modal.titleTemplate": "添加{type}评论",
  "modal.help": "支持多行文本和项目符号列表，可直接输入。",
  "modal.placeholder": "例如：\n1. 这里需要重写\n- 原因\n- 补充说明",
  "modal.cancel": "取消",
  "modal.addComment": "添加评论",

  "notice.selectTextFirst": "请先选择文本",
  "notice.alreadyHasComment": "所选内容已包含评论标记",
  "defaultCommentBody": "写下评论",

  "ribbon.tooltip": "审阅评论",
  "command.addCommentTemplate": "为所选内容添加{type}评论 {icon}",
  "command.openPanel": "打开评论面板",

  "panel.viewTitle": "审阅评论",
  "panel.openMarkdownFile": "请打开一个 Markdown 文件以查看其评论",
  "panel.noComments":
    "还没有评论。选择文本，然后在出现的工具栏中选择类型。",
  "panel.jump": "跳转",
  "panel.resolve": "解决",

  "settings.authorName": "作者姓名",
  "settings.authorNameDesc": "记录在每条评论上的名字",
  "settings.dateFormat": "日期格式",
  "settings.language": "语言",
  "settings.languageDesc": "插件界面使用的语言",
  "settings.languageReloadNotice":
    "重新加载 Obsidian 后，命令名称和功能区图标才会完全应用新语言",
  "settings.commentTypesHeading": "评论类型",
  "settings.commentTypesDesc":
    "每种类型都注册为独立命令，因此你可以在“设置 → 快捷键”中为其指定快捷键。",
  "settings.commentTypeItemTemplate": "{icon} {label} → 标签：{tag}（命令：{command}）",
  "locale.auto": "自动（跟随 Obsidian）",
  "panel.edit": "编辑",
  "panel.save": "保存",
  "panel.cancel": "取消",
  "panel.editHint": "Cmd/Ctrl + Enter 保存，Esc 取消",
  "notice.emptyCommentBody": "评论内容为空",
  "notice.commentBodyAdjusted": "已转义正文中的评论标记",
  "notice.noteChangedDuringEdit": "编辑期间笔记已更改，未保存",
  "notice.panelOpenFailed": "无法打开评论面板",
};

const STRINGS: Record<Locale, Record<StringKey, string>> = {
  en,
  ja,
  es,
  zh,
  fr,
  de,
  pt,
  ko,
};

// zh は簡体字なので、繁体字の地域を base だけ見て zh に寄せてはいけない
const TRADITIONAL_CHINESE = ["zh-tw", "zh-hk", "zh-mo", "zh-hant"];

const REGION_TO_LOCALE: Record<string, Locale> = {
  "zh-cn": "zh",
  "zh-sg": "zh",
  "zh-hans": "zh",
};

function matchLocale(code: string): Locale | null {
  const tag = code.trim().toLowerCase().replace(/_/g, "-");
  if (REGION_TO_LOCALE[tag]) return REGION_TO_LOCALE[tag];
  // 繁体字の利用者には簡体字より en の方が読める
  if (TRADITIONAL_CHINESE.some((t) => tag === t || tag.startsWith(`${t}-`))) {
    return null;
  }
  const base = tag.split("-")[0];
  return (SUPPORTED_LOCALES as string[]).includes(base)
    ? (base as Locale)
    : null;
}

export function detectObsidianLocale(): Locale {
  const candidates: string[] = [];

  // moment の locale は Obsidian の表示言語を追うため、これを最優先で見る
  try {
    const fromMoment = moment.locale();
    if (fromMoment) candidates.push(fromMoment);
  } catch {
    // moment を参照できない環境では次の候補に回す
  }

  // moment が使えないときの控え。localStorage の language は Obsidian の内部値
  try {
    const stored = window.localStorage.getItem("language");
    if (stored) candidates.push(stored);
  } catch {
    // localStorage inaccessible (e.g. restricted context); ignore.
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    candidates.push(navigator.language);
  }

  for (const candidate of candidates) {
    const matched = matchLocale(candidate);
    if (matched) return matched;
  }
  return "en";
}

export function resolveLocale(setting: LanguageSetting): Locale {
  if (setting === "auto") return detectObsidianLocale();
  return setting;
}

export class I18n {
  locale: Locale;

  constructor(locale: Locale) {
    this.locale = locale;
  }

  setLocale(locale: Locale) {
    this.locale = locale;
  }

  t(key: StringKey, vars?: Record<string, string>): string {
    const table = STRINGS[this.locale] ?? STRINGS.en;
    let str = table[key] ?? STRINGS.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        str = str.split(`{${name}}`).join(value);
      }
    }
    return str;
  }
}
