import type { DirEntry } from "./index";

/**
 * Path helpers for the explorer.
 *
 * Every path the explorer handles is relative to the workspace root,
 * `/`-separated, with no leading or trailing slash; `""` is the root itself.
 * The runner joins these onto `/workspaces`.
 *
 * The page used to build paths as `${dir}/${name}`, which for the root gave
 * `/name` — harmless to the runner's `filepath.Join`, but it leaked into
 * toasts, into the editor's path, and into every comparison between a path
 * the page built and one the tree built.
 */

export const joinPath = (dir: string, name: string) =>
  dir ? `${dir}/${name}` : name;

export const parentOf = (path: string) => {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
};

export const baseName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** True when `path` is `ancestor` or lives somewhere underneath it. */
export const isSameOrInside = (path: string, ancestor: string) =>
  ancestor === "" || path === ancestor || path.startsWith(`${ancestor}/`);

/** `path` with its `from` prefix swapped for `to`. Assumes isSameOrInside. */
export const rebasePath = (path: string, from: string, to: string) =>
  path === from ? to : `${to}${path.slice(from.length)}`;

/**
 * Why a name can't be used, or null when it can.
 *
 * Duplicates matter more than they look: the runner creates files with
 * `os.Create`, which truncates an existing file, and renames with
 * `os.Rename`, which replaces one. Without this check, "New file" with the
 * name of a file that already existed silently emptied it.
 *
 * `allowNested` lets a create take `src/lib/util.ts` and make the folders on
 * the way (the runner does `MkdirAll`); a rename must stay in its folder.
 */
export function validateName(
  raw: string,
  {
    siblings,
    allowNested,
    current,
  }: { siblings: DirEntry[]; allowNested: boolean; current?: string },
): string | null {
  const name = raw.trim();
  if (!name) return "Enter a name.";
  if (name.includes("\\")) return "Names can't contain \\.";
  if (name.startsWith("/") || name.endsWith("/")) {
    return "A name can't start or end with /.";
  }
  if (!allowNested && name.includes("/")) {
    return "Use a plain name. To move it, cut and paste instead.";
  }

  const segments = name.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) {
    return "A name can't be . or .., or contain //.";
  }
  if (segments.some((s) => s.length > 255)) return "That name is too long.";

  const first = segments[0];
  if (first === current) return null;
  const clash = siblings.find((entry) => entry.name === first);
  // `src/new.ts` into a folder that already has `src/` is fine; the clash is
  // with a file of that name, or with the exact name being created.
  if (clash && (segments.length === 1 || !clash.isDir)) {
    return `"${first}" already exists here.`;
  }
  return null;
}

/**
 * A free name for a pasted copy: `app.ts` → `app copy.ts` → `app copy 2.ts`.
 *
 * Pasting into the folder something came from used to hand the runner the
 * same path for source and destination; its copy opens the destination with
 * `os.Create` first, which truncated the source before reading it.
 */
export function copyName(name: string, isDir: boolean, taken: Set<string>) {
  if (!taken.has(name)) return name;

  // Dotfiles (`.env`) and folders have no extension to keep at the end.
  const dot = isDir ? -1 : name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";

  for (let n = 1; ; n++) {
    const candidate = `${stem} copy${n === 1 ? "" : ` ${n}`}${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
}
