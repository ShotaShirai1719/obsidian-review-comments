// Comment inputs: Enter submits, Shift + Enter inserts a new line.
// Cmd/Ctrl + Enter still submits for people used to the old shortcut.
// While an IME is composing (e.g. picking a Chinese/Japanese candidate),
// Enter confirms the candidate and must not submit.
export function isSubmitEnter(e: KeyboardEvent): boolean {
  if (e.key !== "Enter") return false;
  if (e.isComposing || e.keyCode === 229) return false;
  if (e.shiftKey || e.altKey) return false;
  return true;
}
