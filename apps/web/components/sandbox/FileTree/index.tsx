"use client";
import { memo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderIcon,
  FolderOpen,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Scissors,
  FileIcon,
  FolderPlus,
  FilePlus,
  MoreHorizontal,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import FileContextMenu from "./ContextMenu";
import { getFileIcon, getFolderIcon } from "./utils";

export type DirEntry = {
  name: string;
  isDir: boolean;
};

export type Tree = {
  [path: string]: DirEntry[];
};

export type FileTreeAction = {
  type:
    | "create-file"
    | "create-folder"
    | "delete"
    | "rename"
    | "copy"
    | "cut"
    | "paste";
  path: string;
  newName?: string;
  targetPath?: string;
};

type Props = {
  tree: Tree;
  fetchDir: (path: string) => Promise<void>;
  fetchContent: (filePath: string) => Promise<void>;
  onAction?: (action: FileTreeAction) => void;
  projectName?: string;
  activePath: string | null;
  setActivePath: React.Dispatch<React.SetStateAction<string | null>>;
};

function VSCodeFileTree({
  tree,
  fetchDir,
  fetchContent,
  onAction,
  projectName = "Project",
  activePath,
  setActivePath,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]));
  const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{
    type: "create-file" | "create-folder" | "rename" | null;
    path: string;
    currentName?: string;
  }>({ type: null, path: "" });
  const [inputValue, setInputValue] = useState("");
  const [clipboard, setClipboard] = useState<{
    path: string;
    type: "copy" | "cut";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleFolder = async (path: string) => {
    if (expanded.has(path)) {
      const updated = new Set(expanded);
      updated.delete(path);
      setExpanded(updated);
    } else {
      if (!tree[path]) {
        await fetchDir(path);
      }
      const updated = new Set(expanded);
      updated.add(path);
      setExpanded(updated);
    }
  };

  const handleCreateFile = (path: string) => {
    setDialogState({ type: "create-file", path });
    setInputValue("");
  };

  const handleCreateFolder = (path: string) => {
    setDialogState({ type: "create-folder", path });
    setInputValue("");
  };

  const handleRename = (path: string, currentName: string) => {
    setDialogState({ type: "rename", path, currentName });
    setInputValue(currentName);
  };

  const handleDelete = (path: string) => {
    const itemName = path.split("/").pop() || path;
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      onAction?.({ type: "delete", path });
    }
  };

  const handleCopy = (path: string) => {
    setClipboard({ path, type: "copy" });
  };

  const handleCut = (path: string) => {
    setClipboard({ path, type: "cut" });
  };

  const handlePaste = (targetPath: string) => {
    if (clipboard) {
      onAction?.({
        type: "paste",
        path: clipboard.path,
        targetPath,
      });
      if (clipboard.type === "cut") {
        setClipboard(null);
      }
    }
  };

  const handleDialogSubmit = () => {
    if (!dialogState.type || !inputValue.trim()) return;

    switch (dialogState.type) {
      case "create-file":
        onAction?.({
          type: "create-file",
          path: dialogState.path,
          newName: inputValue,
        });
        break;
      case "create-folder":
        onAction?.({
          type: "create-folder",
          path: dialogState.path,
          newName: inputValue,
        });
        break;
      case "rename":
        onAction?.({
          type: "rename",
          path: dialogState.path,
          newName: inputValue,
        });
        break;
    }

    setDialogState({ type: null, path: "" });
    setInputValue("");
  };

  const filterEntries = (entries: DirEntry[], query: string) => {
    if (!query) return entries;
    return entries.filter((entry) =>
      entry.name.toLowerCase().includes(query.toLowerCase()),
    );
  };

  const renderTree = (entries: DirEntry[], currentPath = "", depth = 0) => {
    const filteredEntries = filterEntries(entries, searchQuery);

    return filteredEntries.map((entry) => {
      const entryPath = currentPath
        ? `${currentPath}/${entry.name}`
        : entry.name;
      const isActive = activePath === entryPath;
      const isExpanded = expanded.has(entryPath);
      const isCut = clipboard?.type === "cut" && clipboard.path === entryPath;

      if (entry.isDir) {
        return (
          <div key={entryPath} className="select-none">
            <FileContextMenu
              path={entryPath}
              isDir={true}
              handleCreateFile={handleCreateFile}
              handleCreateFolder={handleCreateFolder}
              handleRename={handleRename}
              handleCopy={handleCopy}
              handleDelete={handleDelete}
              handleCut={handleCut}
              handlePaste={handlePaste}
              clipboard={clipboard}
            >
              <div
                className={cn(
                  "group relative flex cursor-pointer items-center gap-1 py-[3px] pr-2 font-mono text-xs",
                  "transition-colors duration-[--duration-fast]",
                  "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-transparent",
                  "hover:bg-raised/60",
                  isActive && "bg-raised text-ink before:bg-brand",
                  !isActive && "text-ink-muted",
                  isCut && "opacity-40",
                )}
                onClick={() => {
                  setActivePath(entryPath);
                  handleToggleFolder(entryPath);
                }}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="size-3 shrink-0 text-ink-subtle" />
                  ) : (
                    <ChevronRight className="size-3 shrink-0 text-ink-subtle" />
                  )}
                  {getFolderIcon(entry.name, isExpanded)}
                  <span className="truncate">
                    {entry.name}
                  </span>
                </div>
              </div>
            </FileContextMenu>
            {isExpanded && tree[entryPath] ? (
              tree[entryPath].length > 0 ? (
                <div>{renderTree(tree[entryPath], entryPath, depth + 1)}</div>
              ) : (
                // An expanded folder that renders nothing is indistinguishable
                // from one that failed to load.
                <div
                  style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
                  className="py-[3px] font-mono text-xs italic text-ink-subtle"
                >
                  empty
                </div>
              )
            ) : null}
          </div>
        );
      } else {
        return (
          <div key={entryPath} className="select-none">
            <FileContextMenu
              path={entryPath}
              isDir={false}
              handleCreateFile={handleCreateFile}
              handleCreateFolder={handleCreateFolder}
              handleRename={handleRename}
              handleCopy={handleCopy}
              handleDelete={handleDelete}
              handleCut={handleCut}
              handlePaste={handlePaste}
              clipboard={clipboard}
            >
              <div
                className={cn(
                  "group relative flex cursor-pointer items-center gap-2 py-[3px] pr-2 font-mono text-xs",
                  "transition-colors duration-[--duration-fast]",
                  "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-transparent",
                  "hover:bg-raised/60",
                  isActive && "bg-raised text-ink before:bg-brand",
                  !isActive && "text-ink-muted",
                  isCut && "opacity-40",
                )}
                onClick={async () => {
                  setActivePath(entryPath);
                  await fetchContent(entryPath);
                }}
                style={{ paddingLeft: `${depth * 12 + 20}px` }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(entry.name)}
                  <span className="truncate">
                    {entry.name}
                  </span>
                </div>
              </div>
            </FileContextMenu>
          </div>
        );
      }
    });
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-edge bg-surface text-ink">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-edge px-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="label truncate text-ink-muted">
            {projectName}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateFile("")}
            className="size-6 p-0 text-ink-subtle hover:bg-raised hover:text-ink"
            title="New File"
          >
            <FilePlus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateFolder("")}
            className="size-6 p-0 text-ink-subtle hover:bg-raised hover:text-ink"
            title="New Folder"
          >
            <FolderPlus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="size-6 p-0 text-ink-subtle hover:bg-raised hover:text-ink"
            title="Search"
          >
            <Search className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchDir("")}
            className="size-6 p-0 text-ink-subtle hover:bg-raised hover:text-ink"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="border-b border-edge px-2 py-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-ink-subtle" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-6 border-edge bg-canvas pl-7 pr-7 font-mono text-xs text-ink placeholder:text-ink-subtle focus-visible:border-brand"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 size-4 -translate-y-1/2 p-0 text-ink-subtle hover:bg-raised hover:text-ink"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-auto">
        <div className="py-1">{tree[""] && renderTree(tree[""], "")}</div>
      </div>

      {/* Status Bar */}
      <div className="shrink-0 border-t border-edge px-2 py-1">
        <div className="flex items-center justify-between">
          <span className="label text-ink-subtle">
            {Object.keys(tree).length} folders
          </span>
          {clipboard && (
            <span className="label text-brand">
              {clipboard.type === "copy" ? "Copied" : "Cut"}:{" "}
              {clipboard.path.split("/").pop()}
            </span>
          )}
        </div>
      </div>

      {/* Dialog for creating/renaming */}
      <Dialog
        open={!!dialogState.type}
        onOpenChange={() => setDialogState({ type: null, path: "" })}
      >
        <DialogContent className="border-edge bg-overlay text-ink sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogState.type === "create-file" && "Create New File"}
              {dialogState.type === "create-folder" && "Create New Folder"}
              {dialogState.type === "rename" && "Rename"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-ink-muted">
                {dialogState.type === "rename" ? "New name" : "Name"}
              </Label>
              <Input
                id="name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleDialogSubmit();
                  }
                }}
                placeholder={
                  dialogState.type === "create-file"
                    ? "filename.ext"
                    : dialogState.type === "create-folder"
                      ? "folder-name"
                      : "new-name"
                }
                className="border-edge bg-canvas font-mono text-ink placeholder:text-ink-subtle focus-visible:border-brand"
                autoFocus
              />
            </div>
            {dialogState.path && (
              <div className="text-xs text-ink-subtle">
                Location: {dialogState.path || "Root"}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogState({ type: null, path: "" })}
              className="border-edge text-ink-muted hover:bg-raised hover:text-ink"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={!inputValue.trim()}
              className="bg-brand hover:bg-brand-600 text-ink"
            >
              {dialogState.type === "rename" ? "Rename" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Memoised because the sandbox shell above it owns eleven pieces of chrome
 * state — sidebar open, active panel, settings dialog, terminal maximised and
 * so on. Without this, toggling any one of them re-rendered this subtree too.
 */
export default memo(VSCodeFileTree);
