import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

/**
 * The documentation content layer.
 *
 * Docs are authored as MDX under `content/docs/`. This module is the single
 * reader of that directory: the sidebar, search index, sitemap, breadcrumbs and
 * per-page metadata all derive from `getDocs()`, so adding a file is the only
 * step needed to publish a page.
 *
 * Everything here runs at build time (every docs route is statically
 * generated), so the filesystem walk never costs a request.
 */

export const DOCS_DIR = path.join(process.cwd(), "content", "docs");

/** Order in which sidebar sections appear. Unlisted sections sort last, alphabetically. */
const SECTION_ORDER = [
  "Getting started",
  "Concepts",
  "Guides",
  "Reference",
  "Self-hosting",
  "Contributing",
];

export interface DocFrontmatter {
  title: string;
  description: string;
  /** Sidebar group. Defaults to "Guides". */
  section?: string;
  /** Sort key within a section. Defaults to 100. */
  order?: number;
  /** Hide from the sidebar but keep the page routable and indexed. */
  hidden?: boolean;
  /** Keep out of the sitemap and mark noindex. */
  draft?: boolean;
}

export interface TocEntry {
  depth: 2 | 3;
  text: string;
  id: string;
}

export interface Doc {
  /** Route slug segments, e.g. `["guides", "templates"]`. `[]` is the docs root. */
  slug: string[];
  /** Site-relative URL, e.g. `/docs/guides/templates`. */
  url: string;
  /** Path relative to DOCS_DIR, e.g. `guides/templates.mdx`. */
  file: string;
  frontmatter: Required<Pick<DocFrontmatter, "title" | "description">> &
    DocFrontmatter;
  /** Headings, for the on-page table of contents. */
  toc: TocEntry[];
  /** Body text with MDX syntax stripped, for the search index. */
  plain: string;
  /** Last git commit date for the file, ISO-8601. Falls back to mtime. */
  lastModified: string;
}

/* -------------------------------------------------------------------------- */

function walk(dir: string, base = ""): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) return walk(path.join(dir, entry.name), rel);
    return entry.isFile() && entry.name.endsWith(".mdx") ? [rel] : [];
  });
}

/** `guides/templates.mdx` -> `["guides", "templates"]`; `index.mdx` -> `[]`. */
function fileToSlug(file: string): string[] {
  const segments = file.replace(/\.mdx$/, "").split(path.sep);
  const last = segments[segments.length - 1];
  if (last === "index") segments.pop();
  return segments;
}

/**
 * Extracts ATX headings for the table of contents.
 *
 * Fenced code blocks are removed first so a `# comment` inside a shell example
 * never becomes a heading.
 */
function extractToc(body: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const withoutCode = body.replace(/^```[\s\S]*?^```/gm, "");

  const entries: TocEntry[] = [];
  for (const line of withoutCode.split("\n")) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const text = match[2]
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_]/g, "")
      .trim();

    entries.push({
      depth: match[1].length as 2 | 3,
      text,
      id: slugger.slug(text),
    });
  }
  return entries;
}

/** Strips MDX/Markdown syntax down to prose, for the search index. */
function toPlainText(body: string): string {
  return body
    .replace(/^```[\s\S]*?^```/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

let gitDates: Map<string, string> | null = null;

/**
 * Last-commit date per docs file, for accurate sitemap `lastModified`.
 *
 * Filesystem mtime is wrong in CI — a fresh clone stamps every file with the
 * checkout time, which tells search engines the whole site changed.
 */
function getGitDate(file: string): string {
  if (gitDates === null) {
    gitDates = new Map();
    try {
      // Lazy require: this must not end up in a client bundle.
      const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
      const out = execFileSync(
        "git",
        ["log", "--format=%cI", "--name-only", "--", "content/docs"],
        { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );

      let date = "";
      for (const line of out.split("\n")) {
        if (!line.trim()) continue;
        if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
          date = line.trim();
        } else if (date && !gitDates.has(line)) {
          gitDates.set(line.trim(), date);
        }
      }
    } catch {
      // Not a git checkout, or git is unavailable. mtime is the fallback.
    }
  }

  const key = path.posix.join("content/docs", file.split(path.sep).join("/"));
  const fromGit = gitDates.get(key);
  if (fromGit) return fromGit;

  try {
    return fs.statSync(path.join(DOCS_DIR, file)).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/* -------------------------------------------------------------------------- */

let cache: Doc[] | null = null;

/** Every doc, sorted by section order then by `order` then by title. */
export function getDocs(): Doc[] {
  if (cache) return cache;

  const docs = walk(DOCS_DIR).map<Doc>((file) => {
    const raw = fs.readFileSync(path.join(DOCS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const fm = data as DocFrontmatter;

    if (!fm.title) {
      throw new Error(`content/docs/${file}: frontmatter is missing "title"`);
    }
    if (!fm.description) {
      throw new Error(
        `content/docs/${file}: frontmatter is missing "description" (it is the meta description and the search snippet)`,
      );
    }

    const slug = fileToSlug(file);

    return {
      slug,
      url: slug.length ? `/docs/${slug.join("/")}` : "/docs",
      file,
      frontmatter: {
        section: "Guides",
        order: 100,
        ...fm,
        title: fm.title,
        description: fm.description,
      },
      toc: extractToc(content),
      plain: toPlainText(content),
      lastModified: getGitDate(file),
    };
  });

  docs.sort((a, b) => {
    const sectionA = SECTION_ORDER.indexOf(a.frontmatter.section ?? "");
    const sectionB = SECTION_ORDER.indexOf(b.frontmatter.section ?? "");
    const rankA = sectionA === -1 ? SECTION_ORDER.length : sectionA;
    const rankB = sectionB === -1 ? SECTION_ORDER.length : sectionB;
    if (rankA !== rankB) return rankA - rankB;

    const orderA = a.frontmatter.order ?? 100;
    const orderB = b.frontmatter.order ?? 100;
    if (orderA !== orderB) return orderA - orderB;

    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  });

  cache = docs;
  return docs;
}

export function getDoc(slug: string[] = []): Doc | undefined {
  const target = slug.join("/");
  return getDocs().find((doc) => doc.slug.join("/") === target);
}

export interface DocSection {
  title: string;
  docs: Doc[];
}

/** Docs grouped into sidebar sections, hidden pages removed. */
export function getSections(): DocSection[] {
  const groups = new Map<string, Doc[]>();

  for (const doc of getDocs()) {
    if (doc.frontmatter.hidden) continue;
    const section = doc.frontmatter.section ?? "Guides";
    const existing = groups.get(section);
    if (existing) existing.push(doc);
    else groups.set(section, [doc]);
  }

  return [...groups.entries()].map(([title, docs]) => ({ title, docs }));
}

/** Previous/next page in reading order, for the footer pager. */
export function getNeighbours(slug: string[]): {
  previous?: Doc;
  next?: Doc;
} {
  const visible = getDocs().filter((doc) => !doc.frontmatter.hidden);
  const index = visible.findIndex((doc) => doc.slug.join("/") === slug.join("/"));
  if (index === -1) return {};
  return {
    previous: index > 0 ? visible[index - 1] : undefined,
    next: index < visible.length - 1 ? visible[index + 1] : undefined,
  };
}

/** Trail of `{ name, path }` from the docs root to this page. */
export function getBreadcrumbs(doc: Doc): { name: string; path: string }[] {
  const trail = [{ name: "Docs", path: "/docs" }];
  if (doc.slug.length === 0) return trail;

  if (doc.frontmatter.section) {
    trail.push({ name: doc.frontmatter.section, path: "/docs" });
  }
  trail.push({ name: doc.frontmatter.title, path: doc.url });
  return trail;
}
