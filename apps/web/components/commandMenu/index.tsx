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
  useDocsShortcut,
} from "@/components/ui/command-menu";
import { Button } from "@/components/ui/button";
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
  BookOpen,
  ArrowLeft,
  File,
  LogOut,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { cn } from "@/lib/utils";

// Types
interface DocResult {
  name: string;
  path: string;
  type?: "file" | "folder";
}

interface ApiResponse {
  content?: string;
  warning?: string;
}

/**
 * @param compact Render as a key-cap sized trigger rather than a labelled
 *   button. The navbar centres this next to "Docs" and "Pricing", where a
 *   full-width outline button reading "Command Palette" was both the widest
 *   thing in the row and the least likely to be clicked — the point of a
 *   command palette is the shortcut.
 */
export const Cmd = ({ compact = false }: { compact?: boolean } = {}) => {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const modifier = useModifierKey();

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [searchMode, setSearchMode] = React.useState<"default" | "docs">(
    "default",
  );
  const [docsSearchQuery, setDocsSearchQuery] = React.useState("");
  const [docsSearchResults, setDocsSearchResults] = React.useState<DocResult[]>(
    [],
  );
  const [docsLoading, setDocsLoading] = React.useState(false);

  useCommandMenuShortcut(() => setOpen(true));
  useDocsShortcut(() => {
    setOpen(true);
    setSearchMode("docs");
  });

  // Debounced docs search
  React.useEffect(() => {
    if (searchMode === "docs" && docsSearchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        console.log("Called");
        searchDocs(docsSearchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (searchMode === "docs" && !docsSearchQuery.trim()) {
      setDocsSearchResults([]);
    }
  }, [docsSearchQuery, searchMode]);

  const searchDocs = async (query: string) => {
    setDocsLoading(true);
    try {
      const response = await fetch(
        `/api/docs/search?q=${encodeURIComponent(query)}`,
      );
      if (response.ok) {
        const results = await response.json();
        setDocsSearchResults(results.results);
        console.log("results", results);
      }
    } catch (error) {
      console.error("Failed to search docs:", error);
      setDocsSearchResults([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setDocsSearchQuery(query);
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    setValue("");
    setSearchMode("default");
    setDocsSearchQuery("");
    setDocsSearchResults([]);

    // The search API returns a ready site-relative URL.
    router.push(path);
  };

  const allItems = [
    // Pages
    {
      type: "page",
      name: "Dashboard",
      icon: <Home />,
      // shortcut: "g+d",
      link: "/dashboard",
    },
    {
      type: "page",
      name: "Docs",
      icon: <Settings />,
      // shortcut: "g+a",
      link: "/docs",
    },

    // Actions
    {
      type: "action",
      name: isAuthenticated ? "Logout" : "Login",
      icon: isAuthenticated ? <LogOut /> : <User />,
      action: () => (isAuthenticated ? logout() : router.push("/login")),
      // shortcut: "cmd+n",
    },
    {
      type: "action",
      name: "Create New Repl",
      icon: <Plus />,
      action: () => router.push("/dashboard"),
      // shortcut: "cmd+n",
    },
    {
      type: "action",
      name: "Activate a Repl",
      icon: <Play className="size-4" />,
      action: () => router.push("/dashboard"),
      // shortcut: "cmd+u",
    },
    {
      type: "action",
      name: "Get Repls",
      icon: <List />,
      action: () => router.push("/dashboard"),
      // shortcut: "cmd+e",
    },
    {
      type: "action",
      name: "Search Docs",
      icon: <BookOpen />,
      shortcut: "cmd+shift+f",
      action: () => {
        setSearchMode("docs");
        setDocsSearchQuery("");
        setValue("");
      },
    },
  ];

  const filteredItems = React.useMemo(() => {
    if (!value) return allItems;
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.type.toLowerCase().includes(value.toLowerCase()),
    );
  }, [value]);

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, typeof allItems> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return groups;
  }, [filteredItems]);

  const getGroupTitle = (type: string) => {
    switch (type) {
      case "page":
        return "Pages";
      case "action":
        return "Actions";
      case "user":
        return "Users";
      case "document":
        return "Documents";
      default:
        return type;
    }
  };

  const resetToDefault = () => {
    setSearchMode("default");
    setDocsSearchQuery("");
    setDocsSearchResults([]);
    setValue("");
  };

  let globalIndex = 0;

  return (
    <CommandMenu
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          resetToDefault();
        }
      }}
    >
      <CommandMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            aria-label="Open command palette"
            title="Command palette"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-edge px-2.5 py-1",
              "font-mono text-[11px] text-ink-subtle",
              "transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink-muted",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            )}
          >
            <Search size={12} aria-hidden="true" />
            {modifier}K
          </button>
        ) : (
          <Button className="w-full gap-2" variant={"outline"}>
            <Search size={16} />
            Command palette
            <kbd className="pointer-events-none ml-auto flex h-5 select-none items-center rounded border border-edge bg-raised px-1.5 font-mono text-[10px] text-ink-subtle">
              {modifier}K
            </kbd>
          </Button>
        )}
      </CommandMenuTrigger>
      <CommandMenuContent className="rounded-xl outline-2 outline-brand outline-offset-2">
        {searchMode === "default" ? (
          <>
            <CommandMenuInput
              placeholder="Type to search pages, actions, users, documents..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <CommandMenuList maxHeight="400px">
              {Object.keys(groupedItems).length === 0 ? (
                <CommandMenuEmpty>
                  No results found for &quot;{value}&quot;
                </CommandMenuEmpty>
              ) : (
                Object.entries(groupedItems).map(
                  ([type, items], groupIndex) => (
                    <React.Fragment key={type}>
                      {groupIndex > 0 && <CommandMenuSeparator />}
                      <CommandMenuGroup heading={getGroupTitle(type)}>
                        {items.map((item, index) => {
                          const currentIndex = globalIndex++;
                          return (
                            <CommandMenuItem
                              key={`${type}-${index}`}
                              icon={item.icon}
                              index={currentIndex}
                              shortcut={item.shortcut}
                              onSelect={() => {
                                if (item.type === "page" && item.link) {
                                  router.push(item.link);
                                } else if (
                                  item.type === "action" &&
                                  item.action
                                ) {
                                  item.action();
                                }
                                setOpen(false);
                                setValue("");
                              }}
                            >
                              {item.name}
                            </CommandMenuItem>
                          );
                        })}
                      </CommandMenuGroup>
                    </React.Fragment>
                  ),
                )
              )}
            </CommandMenuList>
          </>
        ) : (
          <>
            <CommandMenuInput
              placeholder="Search documentation files..."
              value={docsSearchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
            {/* <div className="flex items-center gap-2 px-3 py-2 border-b border-border ">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefault}
                className="p-1 h-6 w-6"
              >
                <ArrowLeft size={14} />
              </Button>
              <BookOpen size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Search Documentation</span>
            </div> */}
            <CommandMenuList maxHeight="400px">
              {docsLoading ? (
                <div className="px-6 py-4 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : docsSearchResults.length === 0 && docsSearchQuery.trim() ? (
                <CommandMenuEmpty>
                  No documentation found for &quot;{docsSearchQuery}&quot;
                </CommandMenuEmpty>
              ) : docsSearchResults.length > 0 ? (
                <CommandMenuGroup
                  heading={`Documentation (${docsSearchResults.length})`}
                >
                  {docsSearchResults.map((result, index) => (
                    <CommandMenuItem
                      key={index}
                      icon={
                        result.type === "folder" ? (
                          <Settings size={16} />
                        ) : (
                          <File size={16} />
                        )
                      }
                      index={index}
                      onSelect={() => handleNavigate(result.path)}
                      className="flex-col items-start"
                    >
                      <p className="font-medium text-foreground">
                        {result.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {result.path}
                      </p>
                    </CommandMenuItem>
                  ))}
                </CommandMenuGroup>
              ) : (
                <div className="px-6 py-4 text-center text-sm text-muted-foreground">
                  Start typing to search documentation...
                </div>
              )}
            </CommandMenuList>
          </>
        )}
      </CommandMenuContent>
    </CommandMenu>
  );
};
