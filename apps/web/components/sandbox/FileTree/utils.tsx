import {
  Braces,
  FileArchive,
  FileCode,
  FileCog,
  FileImage,
  FileText,
  FileType,
  FolderIcon,
  FolderOpen,
  Hash,
  Terminal as TerminalIcon,
} from "lucide-react";

/**
 * Icons for the file explorer.
 *
 * These used to be a single `FileText` glyph tinted twenty different colours,
 * which is the worst of both worlds: no shape to scan by, and enough
 * saturation in a dense list to swamp the one accent that actually carries
 * meaning here (the amber bar marking the open file).
 *
 * So the mapping is inverted. **Shape** distinguishes the file type — that is
 * what the eye picks up in a list anyway — and everything is a single quiet
 * grey. The extension is already spelled out in the filename beside the icon,
 * so the icon only has to say roughly what kind of thing this is.
 */

const ICON_CLASS = "size-3.5 shrink-0 text-ink-subtle";

/** Extension → glyph. Anything unlisted falls through to a plain document. */
const BY_EXTENSION: Record<string, typeof FileCode> = {
  // Source
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  py: FileCode,
  java: FileCode,
  cpp: FileCode,
  c: FileCode,
  h: FileCode,
  go: FileCode,
  rs: FileCode,
  vue: FileCode,
  php: FileCode,
  sql: FileCode,

  // Structured data
  json: Braces,
  xml: Braces,
  yml: Braces,
  yaml: Braces,
  toml: Braces,

  // Styles and markup
  css: Hash,
  scss: Hash,
  sass: Hash,
  html: FileType,
  htm: FileType,

  // Prose
  md: FileText,
  mdx: FileText,

  // Shell and config
  sh: TerminalIcon,
  bash: TerminalIcon,
  env: FileCog,

  // Binary-ish
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  svg: FileImage,
  webp: FileImage,
  pdf: FileText,
  zip: FileArchive,
  rar: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
};

/** Whole filenames worth calling out regardless of extension. */
const BY_NAME: Record<string, typeof FileCode> = {
  "package.json": FileCog,
  "package-lock.json": FileCog,
  dockerfile: FileCog,
  makefile: FileCog,
  "readme.md": FileText,
  ".gitignore": FileCog,
  ".env": FileCog,
};

export const getFileIcon = (fileName: string) => {
  const lower = fileName.toLowerCase();
  const ext = lower.split(".").pop() ?? "";
  const Icon = BY_NAME[lower] ?? BY_EXTENSION[ext] ?? FileText;
  return <Icon className={ICON_CLASS} />;
};

export const getFolderIcon = (_folderName: string, isExpanded: boolean) => {
  // Open vs closed is the only distinction worth drawing. Tinting `src` blue
  // and `tests` red is decoration that a person stops seeing within a day.
  const Icon = isExpanded ? FolderOpen : FolderIcon;
  return <Icon className={ICON_CLASS} />;
};
