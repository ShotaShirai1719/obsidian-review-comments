import { getLanguage, moment } from "obsidian";

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
  "bubble.show": "Show comment",
  "bubble.delete": "Delete comment",
  "bubble.edit": "Edit comment",
  "modal.editTitleTemplate": "Edit {type} comment",
  "bubble.close": "Close",
  "type.reply": "Reply",
  "bubble.reply": "Reply to comment",
  "panel.reply": "Reply",
  "panel.replyPlaceholder": "Write a reply",
  "settings.commentNotesFolder": "Comment notes folder",
  "settings.autoSync": "Keep comment notes up to date automatically",
  "settings.autoSyncDesc": "Rewrite the notes for a file right after you save it. Only the saved file is read, not the whole vault. Use the rebuild command to catch changes made outside Obsidian.",
  "settings.resolvedFolder": "Resolved comments folder",
  "settings.resolvedFolderDesc": "Resolved comments are appended to a file per month inside this folder, and the markup is removed from the note.",
  "settings.commentNotesFolderDesc": "Where one note per comment is written. Rebuilt from the markup in your notes, so deleting it is safe.",
  "command.syncCommentNotes": "Rebuild comment notes",
  "command.exportComments": "Export all comments as JSON",
  "notice.commentNotesSynced": "Rebuilt {count} comment notes",
  "notice.commentsExported": "Exported {count} comments to {path}",
  "notice.resolvedArchived": "Moved the resolved comment to {path}",
  "notice.nothingToSync": "No comments found in this vault",
  "dictation.start": "Start dictation",
  "settings.dictationMode": "Dictation",
  "settings.dictationModeDesc": "How speech is turned into text. The built-in recognition costs nothing and sends no recording anywhere you have to pay for; a custom endpoint is only used if you set one up yourself.",
  "dictation.modeEndpoint": "Custom endpoint",
  "dictation.modeOff": "Off",
  "dictation.stop": "Stop and transcribe",
  "dictation.transcribing": "Transcribing",
  "notice.dictationNoKey": "Set a transcription endpoint in the settings first",
  "notice.dictationNoMic": "The microphone could not be used",
  "notice.dictationFailed": "Transcription failed: {message}",
  "settings.dictationApiKey": "Transcription API key",
  "settings.dictationApiKeyDesc": "Sent with the recording to the endpoint below. Recorded audio leaves your device; leave this empty to keep the microphone button inactive.",
  "settings.dictationEndpoint": "Transcription endpoint",
  "settings.dictationEndpointDesc": "A URL that accepts multipart/form-data with a file field and returns JSON with a text field.",
  "settings.dictationModel": "Transcription model",
  "settings.dictationModelDesc": "The model name sent alongside the recording.",
  "notice.ambiguousComment": "The same comment markup appears more than once in this note, so it cannot be told apart. Edit it in the editor instead.",
  "notice.readingSelectionNotFound": "Could not find the selected text in the note. Select text within one paragraph, or add the comment in editing mode.",
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
  "bubble.show": "コメントを表示",
  "bubble.delete": "コメントを削除",
  "bubble.edit": "コメントを編集",
  "modal.editTitleTemplate": "{type}コメントを編集",
  "bubble.close": "閉じる",
  "type.reply": "返信",
  "bubble.reply": "コメントに返信",
  "panel.reply": "返信",
  "panel.replyPlaceholder": "返信を書く",
  "settings.commentNotesFolder": "コメントノートの置き場",
  "settings.autoSync": "コメントノートを自動で更新する",
  "settings.autoSyncDesc": "ノートを保存した直後に、そのファイルのコメントノートだけ書き直す。読むのは保存したファイル1つで、vault 全体は走査しない。Obsidian の外で直した分は、作り直すコマンドで拾う",
  "settings.resolvedFolder": "対応済みコメントのフォルダ",
  "settings.resolvedFolderDesc": "解決したコメントの控えを、このフォルダの中に月ごとのファイルとして追記する。ノート側からは記法を外す",
  "settings.commentNotesFolderDesc": "コメント1件ごとにノートを作る場所。ノートの記法から作り直せるため、消しても戻せる",
  "command.syncCommentNotes": "コメントノートを作り直す",
  "command.exportComments": "すべてのコメントをJSONで書き出す",
  "notice.commentNotesSynced": "コメントノートを{count}件作り直した",
  "notice.commentsExported": "{count}件のコメントを{path}へ書き出した",
  "notice.resolvedArchived": "対応済みのコメントを{path}へ移した",
  "notice.nothingToSync": "この vault にコメントが見つからない",
  "dictation.start": "音声入力を開始",
  "settings.dictationMode": "音声入力",
  "settings.dictationModeDesc": "喋った内容を文字にする方法。内蔵の音声認識は費用がかからず、料金の発生する先へ録音を送らない。別の宛先は自分で設定したときだけ使う",
  "dictation.modeEndpoint": "別の宛先",
  "dictation.modeOff": "使わない",
  "dictation.stop": "停止して文字にする",
  "dictation.transcribing": "文字にしている",
  "notice.dictationNoKey": "先に設定で文字起こしの宛先を入れてください",
  "notice.dictationNoMic": "マイクを使えなかった",
  "notice.dictationFailed": "文字起こしに失敗した: {message}",
  "settings.dictationApiKey": "文字起こしの鍵",
  "settings.dictationApiKeyDesc": "録音と一緒に下の宛先へ送る。録音した音声は端末の外へ出る。空のままにするとマイクのボタンは動かない",
  "settings.dictationEndpoint": "文字起こしの宛先",
  "settings.dictationEndpointDesc": "multipart/form-data の file を受け取り、text を持つ JSON を返す URL",
  "settings.dictationModel": "文字起こしのモデル",
  "settings.dictationModelDesc": "録音と一緒に送るモデルの名前",
  "notice.ambiguousComment": "同じ記法がこのノートに2つ以上あり、どれを指しているか決められない。編集モードで直してください",
  "notice.readingSelectionNotFound": "選択したテキストをノートの中で見つけられなかった。1つの段落の中で選ぶか、編集モードでコメントしてください",
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
  "bubble.show": "Mostrar el comentario",
  "bubble.delete": "Eliminar el comentario",
  "bubble.edit": "Editar el comentario",
  "modal.editTitleTemplate": "Editar comentario de {type}",
  "bubble.close": "Cerrar",
  "type.reply": "Responder",
  "bubble.reply": "Responder al comentario",
  "panel.reply": "Responder",
  "panel.replyPlaceholder": "Escribe una respuesta",
  "settings.commentNotesFolder": "Carpeta de notas de comentarios",
  "settings.autoSync": "Mantener las notas de comentarios al día automáticamente",
  "settings.autoSyncDesc": "Reescribe las notas de un archivo justo después de guardarlo. Solo se lee el archivo guardado, no toda la bóveda. Usa el comando de reconstrucción para recoger los cambios hechos fuera de Obsidian.",
  "settings.resolvedFolder": "Carpeta de comentarios resueltos",
  "settings.resolvedFolderDesc": "Los comentarios resueltos se añaden a un archivo por mes dentro de esta carpeta, y el marcado se quita de la nota.",
  "settings.commentNotesFolderDesc": "Donde se escribe una nota por comentario. Se reconstruye desde el marcado de tus notas, así que borrarla no supone riesgo.",
  "command.syncCommentNotes": "Reconstruir las notas de comentarios",
  "command.exportComments": "Exportar todos los comentarios como JSON",
  "notice.commentNotesSynced": "Se reconstruyeron {count} notas de comentarios",
  "notice.commentsExported": "Se exportaron {count} comentarios a {path}",
  "notice.resolvedArchived": "El comentario resuelto se movió a {path}",
  "notice.nothingToSync": "No se encontraron comentarios en esta bóveda",
  "dictation.start": "Iniciar el dictado",
  "settings.dictationMode": "Dictado",
  "settings.dictationModeDesc": "Cómo se convierte la voz en texto. El reconocimiento integrado no cuesta nada y no envía la grabación a ningún sitio de pago; un destino propio solo se usa si tú lo configuras.",
  "dictation.modeEndpoint": "Destino propio",
  "dictation.modeOff": "Desactivado",
  "dictation.stop": "Detener y transcribir",
  "dictation.transcribing": "Transcribiendo",
  "notice.dictationNoKey": "Primero indica un destino de transcripción en los ajustes",
  "notice.dictationNoMic": "No se pudo usar el micrófono",
  "notice.dictationFailed": "La transcripción falló: {message}",
  "settings.dictationApiKey": "Clave de API de transcripción",
  "settings.dictationApiKeyDesc": "Se envía junto con la grabación al destino de abajo. El audio grabado sale del dispositivo; déjala vacía para dejar el botón del micrófono inactivo.",
  "settings.dictationEndpoint": "Destino de la transcripción",
  "settings.dictationEndpointDesc": "Una URL que acepta multipart/form-data con un campo file y devuelve JSON con un campo text.",
  "settings.dictationModel": "Modelo de transcripción",
  "settings.dictationModelDesc": "El nombre del modelo que se envía junto con la grabación.",
  "notice.ambiguousComment": "El mismo marcado de comentario aparece más de una vez en esta nota, así que no se puede distinguir. Edítalo en el editor.",
  "notice.readingSelectionNotFound": "No se encontró el texto seleccionado en la nota. Selecciona texto dentro de un párrafo o comenta en el modo de edición.",
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
  "bubble.show": "Afficher le commentaire",
  "bubble.delete": "Supprimer le commentaire",
  "bubble.edit": "Modifier le commentaire",
  "modal.editTitleTemplate": "Modifier le commentaire {type}",
  "bubble.close": "Fermer",
  "type.reply": "Répondre",
  "bubble.reply": "Répondre au commentaire",
  "panel.reply": "Répondre",
  "panel.replyPlaceholder": "Écrivez une réponse",
  "settings.commentNotesFolder": "Dossier des notes de commentaires",
  "settings.autoSync": "Tenir les notes de commentaires à jour automatiquement",
  "settings.autoSyncDesc": "Réécrit les notes d'un fichier juste après son enregistrement. Seul le fichier enregistré est lu, pas tout le coffre. Utilisez la commande de reconstruction pour récupérer les modifications faites hors d'Obsidian.",
  "settings.resolvedFolder": "Dossier des commentaires résolus",
  "settings.resolvedFolderDesc": "Les commentaires résolus sont ajoutés à un fichier par mois dans ce dossier, et le balisage est retiré de la note.",
  "settings.commentNotesFolderDesc": "Emplacement où une note est créée par commentaire. Reconstruit depuis le balisage de vos notes, donc supprimable sans risque.",
  "command.syncCommentNotes": "Reconstruire les notes de commentaires",
  "command.exportComments": "Exporter tous les commentaires en JSON",
  "notice.commentNotesSynced": "{count} notes de commentaires reconstruites",
  "notice.commentsExported": "{count} commentaires exportés vers {path}",
  "notice.resolvedArchived": "Le commentaire résolu a été déplacé vers {path}",
  "notice.nothingToSync": "Aucun commentaire trouvé dans ce coffre",
  "dictation.start": "Démarrer la dictée",
  "settings.dictationMode": "Dictée",
  "settings.dictationModeDesc": "Comment la parole devient du texte. La reconnaissance intégrée ne coûte rien et n'envoie l'enregistrement vers aucun service payant ; une destination personnalisée n'est utilisée que si vous la configurez.",
  "dictation.modeEndpoint": "Destination personnalisée",
  "dictation.modeOff": "Désactivée",
  "dictation.stop": "Arrêter et transcrire",
  "dictation.transcribing": "Transcription en cours",
  "notice.dictationNoKey": "Indiquez d'abord une destination de transcription dans les réglages",
  "notice.dictationNoMic": "Le microphone n'a pas pu être utilisé",
  "notice.dictationFailed": "La transcription a échoué : {message}",
  "settings.dictationApiKey": "Clé d'API de transcription",
  "settings.dictationApiKeyDesc": "Envoyée avec l'enregistrement vers la destination ci-dessous. L'audio enregistré quitte l'appareil ; laissez vide pour garder le bouton du microphone inactif.",
  "settings.dictationEndpoint": "Destination de la transcription",
  "settings.dictationEndpointDesc": "Une URL qui accepte multipart/form-data avec un champ file et renvoie du JSON avec un champ text.",
  "settings.dictationModel": "Modèle de transcription",
  "settings.dictationModelDesc": "Le nom du modèle envoyé avec l'enregistrement.",
  "notice.ambiguousComment": "Le même balisage de commentaire apparaît plusieurs fois dans cette note, il est donc impossible de le distinguer. Modifiez-le dans l'éditeur.",
  "notice.readingSelectionNotFound": "Le texte sélectionné est introuvable dans la note. Sélectionnez du texte dans un seul paragraphe ou commentez en mode édition.",
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
  "bubble.show": "Kommentar anzeigen",
  "bubble.delete": "Kommentar löschen",
  "bubble.edit": "Kommentar bearbeiten",
  "modal.editTitleTemplate": "{type}-Kommentar bearbeiten",
  "bubble.close": "Schließen",
  "type.reply": "Antworten",
  "bubble.reply": "Auf Kommentar antworten",
  "panel.reply": "Antworten",
  "panel.replyPlaceholder": "Antwort schreiben",
  "settings.commentNotesFolder": "Ordner für Kommentarnotizen",
  "settings.autoSync": "Kommentarnotizen automatisch aktuell halten",
  "settings.autoSyncDesc": "Schreibt die Notizen einer Datei direkt nach dem Speichern neu. Gelesen wird nur die gespeicherte Datei, nicht der ganze Vault. Änderungen außerhalb von Obsidian holt der Befehl zum Neuerzeugen nach.",
  "settings.resolvedFolder": "Ordner für erledigte Kommentare",
  "settings.resolvedFolderDesc": "Erledigte Kommentare werden in diesem Ordner an eine Datei pro Monat angefügt, und die Auszeichnung wird aus der Notiz entfernt.",
  "settings.commentNotesFolderDesc": "Ort, an dem pro Kommentar eine Notiz entsteht. Wird aus der Auszeichnung in den Notizen neu erzeugt und kann gelöscht werden.",
  "command.syncCommentNotes": "Kommentarnotizen neu erzeugen",
  "command.exportComments": "Alle Kommentare als JSON exportieren",
  "notice.commentNotesSynced": "{count} Kommentarnotizen neu erzeugt",
  "notice.commentsExported": "{count} Kommentare nach {path} exportiert",
  "notice.resolvedArchived": "Erledigten Kommentar nach {path} verschoben",
  "notice.nothingToSync": "In diesem Vault wurden keine Kommentare gefunden",
  "dictation.start": "Diktat starten",
  "settings.dictationMode": "Diktat",
  "settings.dictationModeDesc": "Wie Sprache zu Text wird. Die eingebaute Erkennung kostet nichts und schickt die Aufnahme an keinen kostenpflichtigen Dienst; ein eigenes Ziel wird nur benutzt, wenn du es selbst einrichtest.",
  "dictation.modeEndpoint": "Eigenes Ziel",
  "dictation.modeOff": "Aus",
  "dictation.stop": "Stoppen und transkribieren",
  "dictation.transcribing": "Wird transkribiert",
  "notice.dictationNoKey": "Trage zuerst ein Transkriptionsziel in den Einstellungen ein",
  "notice.dictationNoMic": "Das Mikrofon konnte nicht verwendet werden",
  "notice.dictationFailed": "Transkription fehlgeschlagen: {message}",
  "settings.dictationApiKey": "API-Schlüssel für die Transkription",
  "settings.dictationApiKeyDesc": "Wird zusammen mit der Aufnahme an das Ziel unten gesendet. Die Aufnahme verlässt das Gerät; leer lassen, damit die Mikrofontaste inaktiv bleibt.",
  "settings.dictationEndpoint": "Ziel der Transkription",
  "settings.dictationEndpointDesc": "Eine URL, die multipart/form-data mit einem file-Feld annimmt und JSON mit einem text-Feld zurückgibt.",
  "settings.dictationModel": "Transkriptionsmodell",
  "settings.dictationModelDesc": "Der Modellname, der mit der Aufnahme gesendet wird.",
  "notice.ambiguousComment": "Dieselbe Kommentar-Auszeichnung kommt in dieser Notiz mehrfach vor und lässt sich nicht unterscheiden. Bearbeite sie im Editor.",
  "notice.readingSelectionNotFound": "Der markierte Text wurde in der Notiz nicht gefunden. Markiere Text innerhalb eines Absatzes oder kommentiere im Bearbeitungsmodus.",
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
  "bubble.show": "Mostrar o comentário",
  "bubble.delete": "Excluir o comentário",
  "bubble.edit": "Editar o comentário",
  "modal.editTitleTemplate": "Editar comentário de {type}",
  "bubble.close": "Fechar",
  "type.reply": "Responder",
  "bubble.reply": "Responder ao comentário",
  "panel.reply": "Responder",
  "panel.replyPlaceholder": "Escreva uma resposta",
  "settings.commentNotesFolder": "Pasta das notas de comentários",
  "settings.autoSync": "Manter as notas de comentários atualizadas automaticamente",
  "settings.autoSyncDesc": "Reescreve as notas de um ficheiro logo depois de o guardar. Só o ficheiro guardado é lido, não o cofre todo. Usa o comando de reconstrução para apanhar as alterações feitas fora do Obsidian.",
  "settings.resolvedFolder": "Pasta dos comentários resolvidos",
  "settings.resolvedFolderDesc": "Os comentários resolvidos são acrescentados a um ficheiro por mês dentro desta pasta, e a marcação é removida da nota.",
  "settings.commentNotesFolderDesc": "Onde é criada uma nota por comentário. É reconstruída a partir da marcação das tuas notas, por isso pode ser apagada.",
  "command.syncCommentNotes": "Reconstruir as notas de comentários",
  "command.exportComments": "Exportar todos os comentários em JSON",
  "notice.commentNotesSynced": "{count} notas de comentários reconstruídas",
  "notice.commentsExported": "{count} comentários exportados para {path}",
  "notice.resolvedArchived": "O comentário resolvido foi movido para {path}",
  "notice.nothingToSync": "Não foram encontrados comentários neste cofre",
  "dictation.start": "Iniciar o ditado",
  "settings.dictationMode": "Ditado",
  "settings.dictationModeDesc": "Como a fala vira texto. O reconhecimento integrado não custa nada e não envia a gravação para nenhum serviço pago; um destino próprio só é usado se o configurares.",
  "dictation.modeEndpoint": "Destino próprio",
  "dictation.modeOff": "Desligado",
  "dictation.stop": "Parar e transcrever",
  "dictation.transcribing": "A transcrever",
  "notice.dictationNoKey": "Indica primeiro um destino de transcrição nas definições",
  "notice.dictationNoMic": "Não foi possível usar o microfone",
  "notice.dictationFailed": "A transcrição falhou: {message}",
  "settings.dictationApiKey": "Chave de API da transcrição",
  "settings.dictationApiKeyDesc": "Enviada com a gravação para o destino abaixo. O áudio gravado sai do dispositivo; deixa vazio para manter o botão do microfone inativo.",
  "settings.dictationEndpoint": "Destino da transcrição",
  "settings.dictationEndpointDesc": "Um URL que aceita multipart/form-data com um campo file e devolve JSON com um campo text.",
  "settings.dictationModel": "Modelo de transcrição",
  "settings.dictationModelDesc": "O nome do modelo enviado com a gravação.",
  "notice.ambiguousComment": "A mesma marcação de comentário aparece mais de uma vez nesta nota, por isso não se consegue distinguir. Edita-a no editor.",
  "notice.readingSelectionNotFound": "O texto selecionado não foi encontrado na nota. Seleciona texto dentro de um parágrafo ou comenta no modo de edição.",
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
  "bubble.show": "코멘트 표시",
  "bubble.delete": "코멘트 삭제",
  "bubble.edit": "코멘트 편집",
  "modal.editTitleTemplate": "{type} 코멘트 편집",
  "bubble.close": "닫기",
  "type.reply": "답글",
  "bubble.reply": "댓글에 답글",
  "panel.reply": "답글",
  "panel.replyPlaceholder": "답글 작성",
  "settings.commentNotesFolder": "댓글 노트 폴더",
  "settings.autoSync": "댓글 노트를 자동으로 갱신",
  "settings.autoSyncDesc": "노트를 저장한 직후에 그 파일의 댓글 노트만 다시 씁니다. 저장한 파일 하나만 읽고 보관소 전체는 훑지 않습니다. Obsidian 밖에서 고친 내용은 다시 만들기 명령으로 반영하세요.",
  "settings.resolvedFolder": "해결된 댓글 폴더",
  "settings.resolvedFolderDesc": "해결된 댓글을 이 폴더 안의 월별 파일에 추가하고, 노트에서는 표기를 제거합니다.",
  "settings.commentNotesFolderDesc": "댓글 하나마다 노트를 만드는 위치. 노트의 표기에서 다시 만들 수 있어 삭제해도 됩니다.",
  "command.syncCommentNotes": "댓글 노트 다시 만들기",
  "command.exportComments": "모든 댓글을 JSON으로 내보내기",
  "notice.commentNotesSynced": "댓글 노트 {count}개를 다시 만들었습니다",
  "notice.commentsExported": "댓글 {count}개를 {path}로 내보냈습니다",
  "notice.resolvedArchived": "해결된 댓글을 {path}로 옮겼습니다",
  "notice.nothingToSync": "이 보관소에서 댓글을 찾지 못했습니다",
  "dictation.start": "음성 입력 시작",
  "settings.dictationMode": "음성 입력",
  "settings.dictationModeDesc": "말을 글자로 바꾸는 방법. 내장 음성 인식은 비용이 들지 않고 요금이 발생하는 곳으로 녹음을 보내지 않습니다. 다른 주소는 직접 설정했을 때만 사용합니다.",
  "dictation.modeEndpoint": "다른 주소",
  "dictation.modeOff": "사용 안 함",
  "dictation.stop": "멈추고 글자로 바꾸기",
  "dictation.transcribing": "글자로 바꾸는 중",
  "notice.dictationNoKey": "먼저 설정에서 문자 변환 주소를 넣으세요",
  "notice.dictationNoMic": "마이크를 사용할 수 없었습니다",
  "notice.dictationFailed": "문자 변환에 실패했습니다: {message}",
  "settings.dictationApiKey": "문자 변환 키",
  "settings.dictationApiKeyDesc": "녹음과 함께 아래 주소로 보냅니다. 녹음한 음성은 기기 밖으로 나갑니다. 비워 두면 마이크 버튼이 동작하지 않습니다.",
  "settings.dictationEndpoint": "문자 변환 주소",
  "settings.dictationEndpointDesc": "multipart/form-data 의 file 을 받고 text 가 담긴 JSON 을 돌려주는 URL",
  "settings.dictationModel": "문자 변환 모델",
  "settings.dictationModelDesc": "녹음과 함께 보내는 모델 이름",
  "notice.ambiguousComment": "같은 표기가 이 노트에 두 개 이상 있어 어느 것인지 구분할 수 없습니다. 편집 모드에서 수정하세요.",
  "notice.readingSelectionNotFound": "선택한 텍스트를 노트에서 찾지 못했습니다. 한 단락 안에서 선택하거나 편집 모드에서 댓글을 다세요.",
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
  "bubble.show": "显示评论",
  "bubble.delete": "删除评论",
  "bubble.edit": "编辑评论",
  "modal.editTitleTemplate": "编辑{type}评论",
  "bubble.close": "关闭",
  "type.reply": "回复",
  "bubble.reply": "回复评论",
  "panel.reply": "回复",
  "panel.replyPlaceholder": "写回复",
  "settings.commentNotesFolder": "评论笔记文件夹",
  "settings.autoSync": "自动更新评论笔记",
  "settings.autoSyncDesc": "保存笔记后立即重写该文件的评论笔记。只读取保存的那个文件，不扫描整个仓库。在 Obsidian 之外改动的内容，用重新生成命令来补上。",
  "settings.resolvedFolder": "已解决评论的文件夹",
  "settings.resolvedFolderDesc": "已解决的评论会按月追加到该文件夹内的文件中，并从笔记中移除标记。",
  "settings.commentNotesFolderDesc": "为每条评论生成一个笔记的位置。可从笔记中的标记重新生成，删除也没关系。",
  "command.syncCommentNotes": "重新生成评论笔记",
  "command.exportComments": "将所有评论导出为 JSON",
  "notice.commentNotesSynced": "已重新生成 {count} 个评论笔记",
  "notice.commentsExported": "已将 {count} 条评论导出到 {path}",
  "notice.resolvedArchived": "已将解决的评论移动到 {path}",
  "notice.nothingToSync": "在此仓库中没有找到评论",
  "dictation.start": "开始语音输入",
  "settings.dictationMode": "语音输入",
  "settings.dictationModeDesc": "把语音转成文字的方式。内置识别不产生费用，也不会把录音发往需要付费的地方；自定义地址只有你自己设置后才会使用。",
  "dictation.modeEndpoint": "自定义地址",
  "dictation.modeOff": "关闭",
  "dictation.stop": "停止并转成文字",
  "dictation.transcribing": "正在转成文字",
  "notice.dictationNoKey": "请先在设置中填写转写地址",
  "notice.dictationNoMic": "无法使用麦克风",
  "notice.dictationFailed": "转写失败：{message}",
  "settings.dictationApiKey": "转写密钥",
  "settings.dictationApiKeyDesc": "与录音一起发送到下面的地址。录音会离开本机；留空则麦克风按钮不工作。",
  "settings.dictationEndpoint": "转写地址",
  "settings.dictationEndpointDesc": "接受 multipart/form-data 的 file 字段并返回带 text 字段的 JSON 的网址。",
  "settings.dictationModel": "转写模型",
  "settings.dictationModelDesc": "与录音一起发送的模型名称。",
  "notice.ambiguousComment": "同样的评论标记在这篇笔记中出现了多次，无法区分。请在编辑模式下修改。",
  "notice.readingSelectionNotFound": "未能在笔记中找到所选文本。请在同一段落内选择，或在编辑模式下添加评论。",
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

  // moment が使えないときの控え。getLanguage は Obsidian の表示言語を返す
  try {
    const fromApi = getLanguage();
    if (fromApi) candidates.push(fromApi);
  } catch {
    // getLanguage は 1.8.7 で入ったため、それ未満では次の候補に回す
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

  /**
   * 音声認識へ渡す言語。表示言語をそのまま使う。地域まで要る言語は、
   * 話者の多い地域を既定にする
   */
  speechLocale(): string {
    const byLocale: Record<Locale, string> = {
      en: "en-US",
      ja: "ja-JP",
      es: "es-ES",
      zh: "zh-CN",
      fr: "fr-FR",
      de: "de-DE",
      pt: "pt-BR",
      ko: "ko-KR",
    };
    return byLocale[this.locale] ?? "en-US";
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
