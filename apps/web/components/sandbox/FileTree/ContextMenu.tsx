import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useModifierKey } from "@/hooks/use-modifier-key";

import {
  ClipboardPaste,
  Copy,
  FilePlus,
  FolderPlus,
  Link2,
  Pencil,
  Scissors,
  Trash2,
} from "lucide-react";

export type EntryMenuActions = {
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onCopyPath: () => void;
};

/**
 * Right-click menu for an explorer row.
 *
 * What changed from the first version:
 *
 * - **Files get New file / New folder too**, creating next to the file. They
 *   used to appear on folders only, so right-clicking the file you were
 *   looking at offered no way to add a sibling.
 * - **Paste is always listed** and disabled when there is nothing to paste,
 *   rather than appearing and disappearing — a menu whose items move is a
 *   menu you have to read every time. It names what it will paste.
 * - **Shortcut hints** match the handlers in the tree.
 * - The icons were tinted `text-orange-400`, `text-success`, `text-info` and
 *   `text-warning` — four colours for six ordinary commands, one of them a raw
 *   palette shade. Only Delete keeps a colour, because it is the one that
 *   destroys something.
 */
export default function FileContextMenu({
  children,
  clipboardName,
  actions,
}: {
  children: React.ReactNode;
  clipboardName: string | null;
  actions: EntryMenuActions;
}) {
  const mod = useModifierKey();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        className="w-56 border-edge bg-overlay text-ink"
        // Radix hands focus back to the row when the menu closes. For New file
        // and Rename that stole focus from the name field the tree had just
        // opened, and its blur handler cancelled the edit immediately.
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <ContextMenuItem onSelect={actions.onNewFile}>
          <FilePlus />
          New file
        </ContextMenuItem>
        <ContextMenuItem onSelect={actions.onNewFolder}>
          <FolderPlus />
          New folder
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-edge" />

        <ContextMenuItem onSelect={actions.onCut}>
          <Scissors />
          Cut
          <ContextMenuShortcut>{mod}+X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={actions.onCopy}>
          <Copy />
          Copy
          <ContextMenuShortcut>{mod}+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={actions.onPaste}
          disabled={!clipboardName}
        >
          <ClipboardPaste />
          <span className="min-w-0 truncate">
            {clipboardName ? `Paste "${clipboardName}"` : "Paste"}
          </span>
          <ContextMenuShortcut>{mod}+V</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-edge" />

        <ContextMenuItem onSelect={actions.onCopyPath}>
          <Link2 />
          Copy path
        </ContextMenuItem>
        <ContextMenuItem onSelect={actions.onRename}>
          <Pencil />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onSelect={actions.onDelete}>
          <Trash2 />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
