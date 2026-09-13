import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import {
  Copy,
  Edit3,
  FilePlus,
  FolderPlus,
  Plus,
  Scissors,
  Trash,
} from "lucide-react";

const FileContextMenu = ({
  path,
  isDir,
  children,
  handleCreateFile,
  handleCreateFolder,
  handleCut,
  handleCopy,
  handleRename,
  handleDelete,
  handlePaste,
  clipboard,
}: {
  path: string;
  isDir: boolean;
  children: React.ReactNode;
  handleCreateFile: (path: string) => void;
  handleCreateFolder: (path: string) => void;
  handleRename: (path: string, currentName: string) => void;
  handleCopy: (path: string) => void;
  handleCut: (path: string) => void;
  handleDelete: (path: string) => void;
  handlePaste: (targetPath: string) => void;
  clipboard: {
    path: string;
    type: "copy" | "cut";
  } | null;
}) => (
  <ContextMenu>
    <ContextMenuTrigger>{children}</ContextMenuTrigger>
    <ContextMenuContent className="w-52 bg-raised border-edge text-ink">
      {isDir && (
        <>
          <ContextMenuItem
            onClick={() => handleCreateFile(path)}
            className="hover:bg-raised focus:bg-raised"
          >
            <FilePlus className="w-4 h-4 mr-2 text-success" />
            New File
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleCreateFolder(path)}
            className="hover:bg-raised focus:bg-raised"
          >
            <FolderPlus className="w-4 h-4 mr-2 text-info" />
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-raised" />
        </>
      )}
      <ContextMenuItem
        onClick={() => handleRename(path, path.split("/").pop() || "")}
        className="hover:bg-raised focus:bg-raised"
      >
        <Edit3 className="w-4 h-4 mr-2 text-orange-400" />
        Rename
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => handleDelete(path)}
        className="hover:bg-raised focus:bg-raised text-danger"
      >
        <Trash className="w-4 h-4 mr-2" />
        Delete
      </ContextMenuItem>
      <ContextMenuSeparator className="bg-raised" />
      <ContextMenuItem
        onClick={() => handleCopy(path)}
        className="hover:bg-raised focus:bg-raised"
      >
        <Copy className="w-4 h-4 mr-2 text-info" />
        Copy
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => handleCut(path)}
        className="hover:bg-raised focus:bg-raised"
      >
        <Scissors className="w-4 h-4 mr-2 text-warning" />
        Cut
      </ContextMenuItem>
      {clipboard && isDir && (
        <ContextMenuItem
          onClick={() => handlePaste(path)}
          className="hover:bg-raised focus:bg-raised"
        >
          <Plus className="w-4 h-4 mr-2 text-success" />
          Paste
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  </ContextMenu>
);

export default FileContextMenu;
