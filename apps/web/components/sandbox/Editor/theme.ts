import { token } from "@/lib/tokens";

/**
 * The editor theme, matched to the product's palette.
 *
 * Monaco parses these itself and accepts only 6-digit hex — no `var()`, no
 * `oklch()`, no alpha shorthand — so the values come from `lib/tokens`, which
 * holds the sRGB mirrors of the `--ds-*` variables. Colours with alpha use the
 * 8-digit `#rrggbbaa` form, which Monaco does accept for editor colours (but
 * not for token rules).
 *
 * Two deliberate choices:
 *
 * - **Syntax stays near-monochrome.** A rainbow theme would put far more than
 *   the 1-2% colour budget on screen, and it would fight the amber that marks
 *   the open file in the explorer. Structure is carried by weight and by three
 *   restrained hues instead, which is also what the better editor themes of
 *   the last few years converged on.
 * - **Amber is reserved for the cursor and the current line.** In the editor
 *   the accent answers "where am I?", exactly as it does everywhere else.
 */
export const EDITOR_THEME_NAME = "devex-graphite";

export const editorTheme = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: token.ink.slice(1) },
    { token: "comment", foreground: token.inkSubtle.slice(1), fontStyle: "italic" },
    { token: "keyword", foreground: "c4a3ff" },
    { token: "keyword.control", foreground: "c4a3ff" },
    { token: "operator", foreground: token.inkMuted.slice(1) },
    { token: "string", foreground: "8fd4a8" },
    { token: "string.escape", foreground: token.brand300.slice(1) },
    { token: "number", foreground: token.brand300.slice(1) },
    { token: "regexp", foreground: "8fd4a8" },
    { token: "type", foreground: "9cc7f0" },
    { token: "type.identifier", foreground: "9cc7f0" },
    { token: "identifier", foreground: token.ink.slice(1) },
    { token: "function", foreground: "9cc7f0" },
    { token: "variable", foreground: token.ink.slice(1) },
    { token: "variable.predefined", foreground: "c4a3ff" },
    { token: "constant", foreground: token.brand300.slice(1) },
    { token: "tag", foreground: "c4a3ff" },
    { token: "attribute.name", foreground: "9cc7f0" },
    { token: "attribute.value", foreground: "8fd4a8" },
    { token: "delimiter", foreground: token.inkMuted.slice(1) },
    { token: "invalid", foreground: token.danger.slice(1) },
  ],
  colors: {
    "editor.background": token.termBg,
    "editor.foreground": token.ink,

    // The gutter is the same surface as the editor; separation comes from the
    // line-number colour, not from a second background.
    "editorGutter.background": token.termBg,
    "editorLineNumber.foreground": "#3d3d3d",
    "editorLineNumber.activeForeground": token.brand500,

    "editorCursor.foreground": token.brand500,
    "editor.lineHighlightBackground": "#ffffff08",
    "editor.lineHighlightBorder": "#00000000",

    "editor.selectionBackground": "#fe9a0026",
    "editor.inactiveSelectionBackground": "#ffffff0f",
    "editor.selectionHighlightBackground": "#fe9a0014",
    "editor.wordHighlightBackground": "#ffffff12",
    "editor.wordHighlightStrongBackground": "#fe9a001a",
    "editor.findMatchBackground": "#fe9a0040",
    "editor.findMatchHighlightBackground": "#fe9a0020",

    "editorIndentGuide.background1": "#ffffff0d",
    "editorIndentGuide.activeBackground1": "#ffffff26",
    "editorBracketMatch.background": "#fe9a001a",
    "editorBracketMatch.border": "#fe9a0059",

    "editorWhitespace.foreground": "#ffffff14",
    "editorRuler.foreground": "#ffffff0d",
    "editorOverviewRuler.border": "#00000000",

    "scrollbarSlider.background": "#ffffff14",
    "scrollbarSlider.hoverBackground": "#ffffff26",
    "scrollbarSlider.activeBackground": "#ffffff33",

    "editorWidget.background": token.overlay,
    "editorWidget.border": "#ffffff17",
    "editorSuggestWidget.background": token.overlay,
    "editorSuggestWidget.border": "#ffffff17",
    "editorSuggestWidget.selectedBackground": token.raised,
    "editorSuggestWidget.highlightForeground": token.brand500,
    "editorHoverWidget.background": token.overlay,
    "editorHoverWidget.border": "#ffffff17",

    "editorError.foreground": token.danger,
    "editorWarning.foreground": token.warning,
    "editorInfo.foreground": token.info,
  },
};
