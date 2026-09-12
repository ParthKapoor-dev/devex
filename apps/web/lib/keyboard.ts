/**
 * True when the event target is somewhere the user is entering text.
 *
 * Any shortcut without a modifier needs this, or it steals the character.
 * Covers xterm's textarea and Monaco's hidden input as well as ordinary
 * fields — both are real focusable inputs in the DOM.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
