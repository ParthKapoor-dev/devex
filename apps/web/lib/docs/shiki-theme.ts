/**
 * The Shiki theme used to highlight fenced code in the docs.
 *
 * This is the same palette as the Monaco theme in
 * `components/sandbox/Editor/theme.ts`, in TextMate form. They have to agree:
 * a reader goes from a snippet in the docs straight into the editor, and if
 * the two colour the same keyword differently the product feels assembled
 * from parts. It was `github-dark-default` before, which is GitHub's purple
 * and blue on a background two steps lighter than ours.
 *
 * Kept near-monochrome for the same reason the editor is — three restrained
 * hues carry structure, and amber stays out of it entirely so it keeps
 * meaning "this is the thing you are on" everywhere else in the UI.
 *
 * Runs at build time only (`rehype-pretty-code` in next.config.ts), so none
 * of this reaches the browser.
 */

const INK = "#f8f8f8";
const INK_MUTED = "#9e9e9e";
const INK_SUBTLE = "#696969";
const TERM_BG = "#050505";

const PURPLE = "#c4a3ff";
const GREEN = "#8fd4a8";
const BLUE = "#9cc7f0";
const AMBER_SOFT = "#ffd230";

export const shikiTheme = {
  name: "devex-graphite",
  type: "dark" as const,
  colors: {
    "editor.background": TERM_BG,
    "editor.foreground": INK,
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: INK_SUBTLE, fontStyle: "italic" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.expression",
        "storage",
        "storage.type",
        "storage.modifier",
        "variable.language",
        "constant.language",
        "entity.name.tag",
      ],
      settings: { foreground: PURPLE },
    },
    {
      scope: ["string", "string.quoted", "string.template", "meta.attribute.value"],
      settings: { foreground: GREEN },
    },
    {
      scope: [
        "constant.numeric",
        "constant.character.escape",
        "constant.other",
        "support.constant",
      ],
      settings: { foreground: AMBER_SOFT },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
        "entity.other.attribute-name",
      ],
      settings: { foreground: BLUE },
    },
    {
      scope: ["variable", "variable.other", "meta.definition.variable"],
      settings: { foreground: INK },
    },
    {
      scope: [
        "punctuation",
        "meta.brace",
        "keyword.operator",
        "punctuation.separator",
        "punctuation.terminator",
      ],
      settings: { foreground: INK_MUTED },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "#fb2c36" },
    },
    // Shell prompts and diff markers read better with the terminal's own
    // conventions than with the prose palette.
    {
      scope: ["markup.inserted", "meta.diff.header.to-file"],
      settings: { foreground: "#5cba6a" },
    },
    {
      scope: ["markup.deleted", "meta.diff.header.from-file"],
      settings: { foreground: "#f0524f" },
    },
    {
      scope: ["markup.heading", "entity.name.section"],
      settings: { foreground: BLUE, fontStyle: "bold" },
    },
  ],
};
