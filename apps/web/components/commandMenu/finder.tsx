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
import { Folder, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { Tree, DirEntry } from "../sandbox/FileTree";

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
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const modifier = useModifierKey();

  useFinderMenuShortcut(() => setOpen(true));

  // Convert tree structure to flat array of items
  const allItems = React.useMemo(() => {
    const items: FileItem[] = [];

    Object.entries(tree).forEach(([path, entries]) => {
      // Belt and braces. The listing is normalised where it enters the app,
      // but a palette should never be the thing that crashes the page over an
      // unexpected shape on the wire.
      if (!Array.isArray(entries)) return;

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
        <button
          type="button"
          aria-label="Find a file"
          title="Find a file"
          className={cn(
            "inline-flex h-6 select-none items-center gap-1 rounded-sm border border-edge px-1.5",
            "font-mono text-[10px] text-ink-subtle",
            "transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
          )}
        >
          {modifier}P
        </button>
      </CommandMenuTrigger>
      <CommandMenuContent className="rounded-lg border-edge bg-overlay">
        <CommandMenuInput
          placeholder="Type to search files and directories..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <CommandMenuList maxHeight="min(60vh, 400px)">
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
                        <div className="flex min-w-0 flex-col items-start">
                          <span className="truncate font-mono text-ink">
                            {item.name}
                          </span>
                          <span className="truncate font-mono text-xs text-ink-subtle">
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
