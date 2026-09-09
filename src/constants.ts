import { StringKey } from "./i18n";

export interface CommentType {
  id: string;
  tag: string;
  labelKey: StringKey;
  icon: string;
  // 吹き出しボタンはテーマ色に馴染む Lucide のアイコンを使う。絵文字はOS依存
  lucide: string;
}

export const COMMENT_REGEX = /\{==([\s\S]+?)==\}\{>>([\s\S]+?)<<\}/g;
export const VIEW_TYPE_COMMENTS = "review-comments-view";

export const TYPES: CommentType[] = [
  { id: "ask", tag: "ASK", labelKey: "type.ask", icon: "❓", lucide: "help-circle" },
  { id: "edit", tag: "EDIT", labelKey: "type.edit", icon: "✏️", lucide: "pencil" },
  {
    id: "praise",
    tag: "PRAISE",
    labelKey: "type.praise",
    icon: "👍",
    lucide: "thumbs-up",
  },
  { id: "note", tag: "NOTE", labelKey: "type.note", icon: "💬", lucide: "message-circle" },
];

export const TYPE_ICON: Record<string, string> = TYPES.reduce((acc, t) => {
  acc[t.tag] = t.icon;
  return acc;
}, {} as Record<string, string>);

export const TYPE_LUCIDE: Record<string, string> = TYPES.reduce((acc, t) => {
  acc[t.tag] = t.lucide;
  return acc;
}, {} as Record<string, string>);
