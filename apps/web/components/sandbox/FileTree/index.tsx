"use client";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  FilePlus,
  FolderPlus,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { IconButton } from "../chrome";
import FileContextMenu, { type EntryMenuActions } from "./ContextMenu";
import { getFileIcon, getFolderIcon } from "./utils";
import {
  baseName,
  copyName,
  isSameOrInside,
  joinPath,
  parentOf,
  validateName,
} from "./paths";

export type DirEntry = {
  name: string;
  isDir: boolean;
};

export type Tree = {
  [path: string]: DirEntry[];
};

/**
 * What the explorer asks the page to do. Paths are workspace-relative (see
 * `paths.ts`); the page turns each one into a runner event.
 *
 * `copy` and `move` carry the full destination path. The first version sent
 * the runner's `paste` event instead, which pastes from a clipboard kept *on
 * the runner* — and that clipboard was only ever filled by a `cut` event the
 * explorer never sent. Copy, cut and paste therefore always failed with
 * "nothing to paste". The clipboard now lives here, where the user can see it.
 */
export type FileTreeAction =
  | { type: "create-file"; path: string; newName: string }
  | { type: "create-folder"; path: string; newName: string }
  | { type: "rename"; path: string; newName: string }
  | { type: "delete"; path: string }
  | { type: "copy"; path: string; targetPath: string }
  | { type: "move"; path: string; targetPath: string };

type Props = {
  tree: Tree;
  fetchDir: (path: string) => Promise<void>;
  fetchContent: (filePath: string) => Promise<void>;
  onAction?: (action: FileTreeAction) => void;
  projectName?: string;
  activePath: string | null;
  setActivePath: React.Dispatch<React.SetStateAction<string | null>>;
};

type Editing =
  | { mode: "create-file" | "create-folder"; dir: string }
  | { mode: "rename"; path: string; isDir: boolean };

type Clipboard = { path: string; isDir: boolean; mode: "copy" | "cut" };

type Row =
  | { kind: "entry"; path: string; name: string; isDir: boolean; depth: number }
  | { kind: "draft"; dir: string; isDir: boolean; depth: number }
  | { kind: "empty"; dir: string; depth: number };

const INDENT = 12;

function FileTree({
  tree,
  fetchDir,
  fetchContent,
  onAction,
  projectName = "Project",
  activePath,
  setActivePath,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState<Editing | null>(null);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    path: string;
    isDir: boolean;
  } | null>(null);
  const [clipboard, setClipboard] = useState<Clipboard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const treeRef = useRef<HTMLDivElement>(null);

  /* ---------------------------------------------------------------- lookup */

  const entryAt = useCallback(
    (path: string): DirEntry | undefined =>
      tree[parentOf(path)]?.find((entry) => entry.name === baseName(path)),
    [tree],
  );

  /** The folder a new item goes into when started from `path`. */
  const dirFor = useCallback(
    (path: string | null) => {
      if (!path) return "";
      return entryAt(path)?.isDir ? path : parentOf(path);
    },
    [entryAt],
  );

  // The selection can point at something that has since been renamed or
  // deleted, from a terminal or another tab. Treat that as no selection.
  const selected = activePath && entryAt(activePath) ? activePath : null;
  const targetDir = dirFor(selected);

  /* ------------------------------------------------------------- expanding */

  const expand = useCallback(
    (dir: string) => {
      if (dir === "") return;
      setExpanded((prev) => {
        const next = new Set(prev);
        // Open every folder on the way down, so the item is actually visible.
        let cursor = dir;
        while (cursor) {
          next.add(cursor);
          cursor = parentOf(cursor);
        }
        return next;
      });
      if (!tree[dir]) fetchDir(dir);
    },
    [tree, fetchDir],
  );

  const toggle = useCallback(
    (dir: string) => {
      if (expanded.has(dir)) {
        setExpanded((prev) => {
          const next = new Set(prev);
          next.delete(dir);
          return next;
        });
      } else {
        expand(dir);
      }
    },
    [expanded, expand],
  );

  /* ----------------------------------------------------------------- rows */

  const query = searchQuery.trim().toLowerCase();

  // While searching, a folder stays visible when anything already loaded
  // beneath it matches — otherwise a match two folders down is unreachable.
  const matches = useMemo(() => {
    const memo = new Map<string, boolean>();
    const visit = (path: string, entry: DirEntry): boolean => {
      const cached = memo.get(path);
      if (cached !== undefined) return cached;
      let hit = entry.name.toLowerCase().includes(query);
      if (!hit && entry.isDir) {
        hit = (tree[path] ?? []).some((child) =>
          visit(joinPath(path, child.name), child),
        );
      }
      memo.set(path, hit);
      return hit;
    };
    return visit;
  }, [tree, query]);

  const rows = useMemo(() => {
    const out: Row[] = [];
    const creatingIn =
      editing && editing.mode !== "rename" ? editing.dir : null;

    const walk = (dir: string, depth: number) => {
      const entries = tree[dir];
      if (!entries) return;

      if (creatingIn === dir) {
        out.push({
          kind: "draft",
          dir,
          isDir: editing!.mode === "create-folder",
          depth,
        });
      }

      // Folders first, then files, each alphabetical — the order every file
      // manager uses. The runner returns directory order, which is arbitrary.
      const sorted = [...entries].sort((a, b) =>
        a.isDir === b.isDir
          ? a.name.localeCompare(b.name, undefined, { numeric: true })
          : a.isDir
            ? -1
            : 1,
      );

      let shown = 0;
      for (const entry of sorted) {
        const path = joinPath(dir, entry.name);
        if (query && !matches(path, entry)) continue;
        shown++;
        out.push({ kind: "entry", path, name: entry.name, isDir: entry.isDir, depth });
        const open = query ? tree[path] !== undefined : expanded.has(path);
        if (entry.isDir && open) walk(path, depth + 1);
      }

      if (shown === 0 && creatingIn !== dir && dir !== "" && !query) {
        out.push({ kind: "empty", dir, depth });
      }
    };

    walk("", 0);
    return out;
  }, [tree, expanded, editing, query, matches]);

  const entryRows = useMemo(
    () => rows.filter((row): row is Extract<Row, { kind: "entry" }> => row.kind === "entry"),
    [rows],
  );

  /* -------------------------------------------------------------- editing */

  const startCreate = useCallback(
    (mode: "create-file" | "create-folder", dir: string) => {
      expand(dir);
      setShowSearch(false);
      setSearchQuery("");
      setEditing({ mode, dir });
      setDraft("");
      setDraftError(null);
    },
    [expand],
  );

  const startRename = useCallback(
    (path: string) => {
      const entry = entryAt(path);
      if (!entry) return;
      setActivePath(path);
      setEditing({ mode: "rename", path, isDir: entry.isDir });
      setDraft(entry.name);
      setDraftError(null);
    },
    [entryAt, setActivePath],
  );

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setDraft("");
    setDraftError(null);
    treeRef.current?.focus();
  }, []);

  const commitEdit = useCallback(() => {
    if (!editing) return;
    const name = draft.trim();

    if (editing.mode === "rename") {
      const dir = parentOf(editing.path);
      const current = baseName(editing.path);
      if (name === current) return cancelEdit();
      const error = validateName(name, {
        siblings: tree[dir] ?? [],
        allowNested: false,
        current,
      });
      if (error) return setDraftError(error);
      onAction?.({ type: "rename", path: editing.path, newName: name });
      setActivePath(joinPath(dir, name));
    } else {
      const error = validateName(name, {
        siblings: tree[editing.dir] ?? [],
        allowNested: true,
      });
      if (error) return setDraftError(error);
      onAction?.({ type: editing.mode, path: editing.dir, newName: name });
      setActivePath(joinPath(editing.dir, name));
      // Nested names (`src/lib/a.ts`) create folders on the way; open them.
      const created = joinPath(editing.dir, name);
      if (name.includes("/")) {
        setExpanded((prev) => {
          const next = new Set(prev);
          let cursor = parentOf(created);
          while (cursor && cursor !== editing.dir) {
            next.add(cursor);
            cursor = parentOf(cursor);
          }
          return next;
        });
      }
    }

    setEditing(null);
    setDraft("");
    setDraftError(null);
    treeRef.current?.focus();
  }, [editing, draft, tree, onAction, setActivePath, cancelEdit]);

  /* --------------------------------------------------- delete / clipboard */

  const requestDelete = useCallback(
    (path: string) => {
      const entry = entryAt(path);
      if (entry) setPendingDelete({ path, isDir: entry.isDir });
    },
    [entryAt],
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    onAction?.({ type: "delete", path: pendingDelete.path });
    if (activePath && isSameOrInside(activePath, pendingDelete.path)) {
      setActivePath(parentOf(pendingDelete.path) || null);
    }
    if (clipboard && isSameOrInside(clipboard.path, pendingDelete.path)) {
      setClipboard(null);
    }
    setPendingDelete(null);
    treeRef.current?.focus();
  }, [pendingDelete, onAction, activePath, setActivePath, clipboard]);

  const putOnClipboard = useCallback(
    (path: string, mode: "copy" | "cut") => {
      const entry = entryAt(path);
      if (entry) setClipboard({ path, isDir: entry.isDir, mode });
    },
    [entryAt],
  );

  const paste = useCallback(
    (intoPath: string | null) => {
      if (!clipboard) return;
      const dir = dirFor(intoPath);
      const source = clipboard.path;
      const name = baseName(source);
      const taken = new Set((tree[dir] ?? []).map((entry) => entry.name));

      if (clipboard.isDir && isSameOrInside(dir, source)) {
        toast.error(
          `Can't ${clipboard.mode === "cut" ? "move" : "copy"} "${name}" into itself.`,
        );
        return;
      }

      if (clipboard.mode === "cut") {
        if (parentOf(source) === dir) {
          setClipboard(null);
          return;
        }
        if (taken.has(name)) {
          toast.error(`"${name}" already exists in ${dir || "the workspace root"}.`);
          return;
        }
        const targetPath = joinPath(dir, name);
        onAction?.({ type: "move", path: source, targetPath });
        setClipboard(null);
        setActivePath(targetPath);
      } else {
        const targetPath = joinPath(dir, copyName(name, clipboard.isDir, taken));
        onAction?.({ type: "copy", path: source, targetPath });
        setActivePath(targetPath);
      }
      expand(dir);
    },
    [clipboard, dirFor, tree, onAction, setActivePath, expand],
  );

  const copyPathToClipboard = useCallback((path: string) => {
    navigator.clipboard
      ?.writeText(path)
      .then(() => toast.success("Path copied"))
      .catch(() => toast.error("Couldn't copy the path"));
  }, []);

  /* ---------------------------------------------------------------- header */

  const refresh = useCallback(() => {
    fetchDir("");
    // Refresh what's on screen, not only the root: a file added from the
    // terminal inside an open folder never appeared before.
    for (const dir of expanded) {
      if (entryAt(dir)?.isDir) fetchDir(dir);
    }
  }, [fetchDir, expanded, entryAt]);

  const menuActions = useCallback(
    (path: string): EntryMenuActions => ({
      onNewFile: () => startCreate("create-file", dirFor(path)),
      onNewFolder: () => startCreate("create-folder", dirFor(path)),
      onRename: () => startRename(path),
      onDelete: () => requestDelete(path),
      onCopy: () => putOnClipboard(path, "copy"),
      onCut: () => putOnClipboard(path, "cut"),
      onPaste: () => paste(path),
      onCopyPath: () => copyPathToClipboard(path),
    }),
    [startCreate, dirFor, startRename, requestDelete, putOnClipboard, paste, copyPathToClipboard],
  );

  /* ------------------------------------------------------------- keyboard */

  const select = useCallback(
    (path: string) => {
      setActivePath(path);
      treeRef.current
        ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`)
        ?.scrollIntoView({ block: "nearest" });
    },
    [setActivePath],
  );

  const openRow = useCallback(
    (path: string, isDir: boolean) => {
      setActivePath(path);
      if (isDir) toggle(path);
      else fetchContent(path);
    },
    [setActivePath, toggle, fetchContent],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // The name field handles its own keys.
    if (event.target !== treeRef.current) return;

    const mod = event.metaKey || event.ctrlKey;
    const index = selected
      ? entryRows.findIndex((row) => row.path === selected)
      : -1;
    const row = index >= 0 ? entryRows[index] : null;

    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    switch (event.key) {
      case "ArrowDown": {
        const next = entryRows[Math.min(index + 1, entryRows.length - 1)];
        if (next) select(next.path);
        return handled();
      }
      case "ArrowUp": {
        const prev = entryRows[Math.max(index - 1, 0)];
        if (prev) select(prev.path);
        return handled();
      }
      case "Home":
        if (entryRows[0]) select(entryRows[0].path);
        return handled();
      case "End":
        if (entryRows.length) select(entryRows[entryRows.length - 1].path);
        return handled();
      case "ArrowRight":
        if (row?.isDir) {
          if (!expanded.has(row.path)) expand(row.path);
          else if (entryRows[index + 1]?.depth > row.depth) {
            select(entryRows[index + 1].path);
          }
        }
        return handled();
      case "ArrowLeft":
        if (row?.isDir && expanded.has(row.path)) toggle(row.path);
        else if (row && parentOf(row.path)) select(parentOf(row.path));
        return handled();
      case "Enter":
        if (row) openRow(row.path, row.isDir);
        return handled();
      case "F2":
        if (row) startRename(row.path);
        return handled();
      case "Delete":
        if (row) requestDelete(row.path);
        return handled();
      case "Backspace":
        // ⌘⌫ is Delete on a Mac keyboard, which has no Delete key.
        if (mod && row) {
          requestDelete(row.path);
          return handled();
        }
        return;
    }

    if (!mod || event.shiftKey || event.altKey) return;
    switch (event.key.toLowerCase()) {
      case "c":
        if (row) putOnClipboard(row.path, "copy");
        return handled();
      case "x":
        if (row) putOnClipboard(row.path, "cut");
        return handled();
      case "v":
        paste(selected);
        return handled();
    }
  };

  /* ---------------------------------------------------------------- render */

  const draftInput = (
    <NameField
      value={draft}
      error={draftError}
      onChange={(value) => {
        setDraft(value);
        setDraftError(null);
      }}
      onCommit={commitEdit}
      onCancel={cancelEdit}
      selectStem={editing?.mode === "rename" && !editing.isDir}
    />
  );

  const targetLabel = targetDir ? `${targetDir}/` : "the workspace root";

  return (
    <div className="flex h-full w-full flex-col border-r border-edge bg-surface text-ink">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-edge pl-3 pr-1.5">
        <h2 className="label min-w-0 truncate text-ink-muted" title={projectName}>
          {projectName}
        </h2>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            label={`New file in ${targetLabel}`}
            onClick={() => startCreate("create-file", targetDir)}
          >
            <FilePlus className="size-3.5" />
          </IconButton>
          <IconButton
            label={`New folder in ${targetLabel}`}
            onClick={() => startCreate("create-folder", targetDir)}
          >
            <FolderPlus className="size-3.5" />
          </IconButton>
          <IconButton label="Refresh the explorer" onClick={refresh}>
            <RefreshCw className="size-3.5" />
          </IconButton>
          <IconButton
            label="Collapse all folders"
            onClick={() => setExpanded(new Set())}
            disabled={expanded.size === 0}
          >
            <ChevronsDownUp className="size-3.5" />
          </IconButton>
          <IconButton
            label={showSearch ? "Close the filter" : "Filter files"}
            active={showSearch}
            onClick={() => {
              setShowSearch((open) => !open);
              setSearchQuery("");
            }}
          >
            <Search className="size-3.5" />
          </IconButton>
        </div>
      </div>

      {/* Filter */}
      {showSearch && (
        <div className="shrink-0 border-b border-edge px-2 py-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-ink-subtle" />
            <input
              autoFocus
              aria-label="Filter files by name"
              placeholder="Filter loaded files"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  setShowSearch(false);
                  setSearchQuery("");
                  treeRef.current?.focus();
                }
              }}
              className="h-6 w-full rounded-xs border border-edge bg-canvas pl-7 pr-7 font-mono text-xs text-ink outline-none placeholder:text-ink-subtle focus:border-brand"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear the filter"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 inline-flex size-4 -translate-y-1/2 items-center justify-center rounded-xs text-ink-subtle hover:bg-raised hover:text-ink"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tree */}
      <div
        ref={treeRef}
        role="tree"
        aria-label={`Files in ${projectName}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        // The selected row already carries the amber bar; an amber ring around
        // the whole panel would spend the accent twice.
        className="flex-1 overflow-auto py-1 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-edge-strong"
      >
        {tree[""]?.length === 0 && !editing ? (
          <div className="flex flex-col items-start gap-2 px-3 py-4">
            <p className="text-xs text-ink-muted">This workspace is empty.</p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startCreate("create-file", "")}
                className="h-7 border-edge bg-transparent px-2 text-xs text-ink-muted hover:bg-raised hover:text-ink"
              >
                <FilePlus className="size-3.5" />
                New file
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startCreate("create-folder", "")}
                className="h-7 border-edge bg-transparent px-2 text-xs text-ink-muted hover:bg-raised hover:text-ink"
              >
                <FolderPlus className="size-3.5" />
                New folder
              </Button>
            </div>
          </div>
        ) : query && entryRows.length === 0 ? (
          <p className="px-3 py-3 text-xs text-ink-subtle">
            Nothing loaded matches “{searchQuery.trim()}”. Open a folder to
            include its files.
          </p>
        ) : null}

        {rows.map((row) => {
          if (row.kind === "empty") {
            return (
              <div
                key={`empty:${row.dir}`}
                style={{ paddingLeft: row.depth * INDENT + 28 }}
                className="py-[3px] font-mono text-xs italic text-ink-subtle"
              >
                empty
              </div>
            );
          }

          if (row.kind === "draft") {
            return (
              <div
                key={`draft:${row.dir}`}
                role="treeitem"
                aria-selected={false}
                style={{ paddingLeft: row.depth * INDENT + (row.isDir ? 8 : 20) }}
                className="flex items-start gap-1 py-[2px] pr-2"
              >
                {row.isDir && <ChevronRight className="mt-1 size-3 shrink-0 text-ink-subtle" />}
                <span className="mt-[3px]">
                  {row.isDir ? getFolderIcon("", false) : getFileIcon(draft)}
                </span>
                {draftInput}
              </div>
            );
          }

          const isSelected = selected === row.path;
          const isOpen = row.isDir && (query ? tree[row.path] !== undefined : expanded.has(row.path));
          const isCut = clipboard?.mode === "cut" && isSameOrInside(row.path, clipboard.path);
          const isRenaming = editing?.mode === "rename" && editing.path === row.path;
          const actions = menuActions(row.path);

          return (
            <FileContextMenu
              key={row.path}
              clipboardName={clipboard ? baseName(clipboard.path) : null}
              actions={actions}
            >
              <div
                role="treeitem"
                aria-selected={isSelected}
                aria-expanded={row.isDir ? isOpen : undefined}
                aria-level={row.depth + 1}
                data-path={row.path}
                data-selected={isSelected || undefined}
                title={row.path}
                onClick={() => {
                  if (isRenaming) return;
                  openRow(row.path, row.isDir);
                  treeRef.current?.focus({ preventScroll: true });
                }}
                onContextMenu={() => setActivePath(row.path)}
                style={{ paddingLeft: row.depth * INDENT + (row.isDir ? 8 : 20) }}
                className={cn(
                  "group relative flex h-[22px] cursor-pointer select-none items-center gap-1 pr-1 font-mono text-xs",
                  "transition-colors duration-[--duration-fast]",
                  "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-transparent",
                  "hover:bg-raised/60",
                  isSelected ? "bg-raised text-ink before:bg-brand" : "text-ink-muted",
                  isCut && "opacity-45",
                  isRenaming && "h-auto items-start py-[2px]",
                )}
              >
                {row.isDir &&
                  (isOpen ? (
                    <ChevronDown className="size-3 shrink-0 text-ink-subtle" />
                  ) : (
                    <ChevronRight className="size-3 shrink-0 text-ink-subtle" />
                  ))}
                <span className={cn("shrink-0", !row.isDir && "mr-1", isRenaming && "mt-[3px]")}>
                  {row.isDir ? getFolderIcon(row.name, isOpen) : getFileIcon(row.name)}
                </span>

                {isRenaming ? (
                  draftInput
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate">{row.name}</span>

                    {/* Row actions: on hover, and always on the selected row —
                        which is how a touch screen, with no hover, reaches
                        them: tap a row, its actions appear. While hidden they
                        take no clicks, or a tap near the end of a long name
                        would land on an invisible Delete. */}
                    <span
                      className={cn(
                        "pointer-events-none flex shrink-0 items-center gap-px opacity-0 transition-opacity duration-[--duration-fast]",
                        "group-data-[selected]:pointer-events-auto group-data-[selected]:opacity-100",
                        "[@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100",
                      )}
                    >
                      {row.isDir && (
                        <>
                          <RowAction label={`New file in ${row.path}/`} onClick={actions.onNewFile}>
                            <FilePlus className="size-3" />
                          </RowAction>
                          <RowAction label={`New folder in ${row.path}/`} onClick={actions.onNewFolder}>
                            <FolderPlus className="size-3" />
                          </RowAction>
                        </>
                      )}
                      <RowAction label={`Rename ${row.name} (F2)`} onClick={actions.onRename}>
                        <Pencil className="size-3" />
                      </RowAction>
                      <RowAction label={`Delete ${row.name}`} onClick={actions.onDelete} danger>
                        <Trash2 className="size-3" />
                      </RowAction>
                    </span>
                  </>
                )}
              </div>
            </FileContextMenu>
          );
        })}
      </div>

      {/* Status */}
      <div className="flex h-6 shrink-0 items-center gap-2 border-t border-edge px-2">
        {clipboard ? (
          <>
            <span className="label shrink-0 text-brand">
              {clipboard.mode === "copy" ? "Copied" : "Cut"}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-muted" title={clipboard.path}>
              {baseName(clipboard.path)}
              <span className="text-ink-subtle"> · paste into a folder</span>
            </span>
            <button
              type="button"
              aria-label="Clear the clipboard"
              title="Clear the clipboard"
              onClick={() => setClipboard(null)}
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-xs text-ink-subtle hover:bg-raised hover:text-ink"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <span className="min-w-0 truncate font-mono text-[11px] text-ink-subtle" title={selected ?? undefined}>
            {selected ?? "No selection"}
          </span>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="border-edge bg-overlay text-ink sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="break-all">
              Delete “{pendingDelete ? baseName(pendingDelete.path) : ""}”?
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              {pendingDelete?.isDir
                ? "The folder and everything inside it will be removed from the workspace. This can't be undone."
                : "The file will be removed from the workspace. This can't be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              autoFocus
              variant="outline"
              onClick={() => setPendingDelete(null)}
              className="border-edge bg-transparent text-ink-muted hover:bg-raised hover:text-ink"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-danger text-white hover:bg-danger/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      tabIndex={-1}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-xs text-ink-subtle",
        "hover:bg-overlay hover:text-ink",
        danger && "hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The inline name field for New file, New folder and Rename.
 *
 * Replaces a modal dialog that covered the tree you were naming something in.
 * Enter commits, Escape cancels, and clicking away commits a valid name (as
 * VS Code does) or drops an empty or invalid one. For a file rename the name
 * is selected without its extension, so typing replaces `index` and keeps
 * `.ts`.
 */
function NameField({
  value,
  error,
  onChange,
  onCommit,
  onCancel,
  selectStem,
}: {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  selectStem: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const settled = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const dot = input.value.lastIndexOf(".");
    if (selectStem && dot > 0) input.setSelectionRange(0, dot);
    else input.select();
    // Only on mount: re-selecting on every keystroke would eat the input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-w-0 flex-1">
      <input
        ref={inputRef}
        value={value}
        aria-label="Name"
        aria-invalid={error ? true : undefined}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => {
          settled.current = false;
          onChange(event.target.value);
        }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            settled.current = true;
            onCommit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            settled.current = true;
            onCancel();
          }
        }}
        onBlur={() => {
          if (settled.current) return;
          if (!value.trim() || error) onCancel();
          else onCommit();
        }}
        className={cn(
          "h-[18px] w-full rounded-xs border bg-canvas px-1 font-mono text-xs text-ink outline-none",
          error ? "border-danger" : "border-brand",
        )}
      />
      {error && (
        <p
          role="alert"
          className="mt-0.5 rounded-xs border border-danger/40 bg-overlay px-1.5 py-1 font-sans text-[11px] leading-snug text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Memoised because the sandbox shell above it owns eleven pieces of chrome
 * state — sidebar open, active panel, settings dialog, terminal maximised and
 * so on. Without this, toggling any one of them re-rendered this subtree too.
 */
export default memo(FileTree);
