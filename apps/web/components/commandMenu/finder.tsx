"use client";
import * as React from "react";
import {
  CommandMenu,
  CommandMenuTrigger,
  CommandMenuContent,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuSeparator,
  useCommandMenuShortcut,
  CommandMenuEmpty,
  useFinderMenuShortcut,
} from "@/components/ui/command-menu";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Command,
  Calendar,
  User,
  Settings,
  Plus,
  Upload,
  Download,
  Search,
  FileText,
  Home,
  List,
  Folder,
  File,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { RunIcon } from "@codesandbox/sandpack-react";
import { Tree, DirEntry } from "../sandbox/FileTree";

// Utility function to detect OS and return appropriate modifier key
const getModifierKey = () => {
  return { key: "cmd", symbol: "⌘" };
};

type FileItem = {
  name: string;
  path: string;
  isDir: boolean;
  icon: React.JSX.Element;
  type: "file" | "directory";
};

export const FileFinder = ({
  tree,
  handleFile,
  handleDir,
}: {
  tree: Tree;
  handleFile: (path: string) => void;
  handleDir: (path: string) => void;
}) => {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  useFinderMenuShortcut(() => setOpen(true));

  // Convert tree structure to flat array of items
  const allItems = React.useMemo(() => {
    const items: FileItem[] = [];

    Object.entries(tree).forEach(([path, entries]) => {
      entries.forEach((entry) => {
        const fullPath =
          path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;
        items.push({
          name: entry.name,
          path: fullPath,
          isDir: entry.isDir,
          icon: entry.isDir ? <Folder size={16} /> : <File size={16} />,
          type: entry.isDir ? "directory" : "file",
        });
      });
    });

    return items;
  }, [tree]);

  const filteredItems = React.useMemo(() => {
    if (!value) return allItems;
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.path.toLowerCase().includes(value.toLowerCase()),
    );
  }, [value, allItems]);

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, FileItem[]> = {
      directory: [],
      file: [],
    };

    filteredItems.forEach((item) => {
      groups[item.type].push(item);
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredItems]);

  const getGroupTitle = (type: string) => {
    switch (type) {
      case "directory":
        return "Directories";
      case "file":
        return "Files";
      default:
        return type;
    }
  };

  const handleItemSelect = (item: FileItem) => {
    if (item.isDir) {
      // handleDir(item.path);
    } else {
      handleFile(item.path);
    }

    setOpen(false);
    setValue("");
  };

  let globalIndex = 0;

  return (
    <CommandMenu open={open} onOpenChange={setOpen}>
      <CommandMenuTrigger asChild>
        <kbd className="transition-colors duration-150 hover:bg-emerald-800 select-none items-center gap-1 rounded border border-border bg-muted px-2 text-lg font-mono font-medium opacity-100 ml-auto flex">
          ⌘ P
        </kbd>
      </CommandMenuTrigger>
      <CommandMenuContent className="rounded-xl outline-2 outline-brand outline-offset-2">
        <CommandMenuInput
          placeholder="Type to search files and directories..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <CommandMenuList maxHeight="400px">
          {Object.keys(groupedItems).length === 0 ? (
            <CommandMenuEmpty>
              No results found for &quot;{value}&quot;
            </CommandMenuEmpty>
          ) : (
            Object.entries(groupedItems).map(([type, items], groupIndex) => (
              <React.Fragment key={type}>
                {groupIndex > 0 && <CommandMenuSeparator />}
                <CommandMenuGroup heading={getGroupTitle(type)}>
                  {items.map((item, index) => {
                    const currentIndex = globalIndex++;
                    return (
                      <CommandMenuItem
                        key={`${type}-${index}-${item.path}`}
                        icon={item.icon}
                        index={currentIndex}
                        onSelect={() => handleItemSelect(item)}
                      >
                        <div className="flex flex-col items-start">
                          <span>{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.path}
                          </span>
                        </div>
                      </CommandMenuItem>
                    );
                  })}
                </CommandMenuGroup>
              </React.Fragment>
            ))
          )}
        </CommandMenuList>
      </CommandMenuContent>
    </CommandMenu>
  );
};
