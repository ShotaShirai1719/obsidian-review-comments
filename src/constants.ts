import { StringKey } from "./i18n";

export interface CommentType {
  id: string;
  tag: string;
  labelKey: StringKey;
  icon: string;
}

export const COMMENT_REGEX = /\{==([\s\S]+?)==\}\{>>([\s\S]+?)<<\}/g;
export const VIEW_TYPE_COMMENTS = "review-comments-view";

export const TYPES: CommentType[] = [
  { id: "ask", tag: "ASK", labelKey: "type.ask", icon: "❓" },
  { id: "edit", tag: "EDIT", labelKey: "type.edit", icon: "✏️" },
  { id: "praise", tag: "PRAISE", labelKey: "type.praise", icon: "👍" },
  { id: "note", tag: "NOTE", labelKey: "type.note", icon: "💬" },
];

export const TYPE_ICON: Record<string, string> = TYPES.reduce((acc, t) => {
  acc[t.tag] = t.icon;
  return acc;
}, {} as Record<string, string>);
