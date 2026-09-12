"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  DollarSign,
  FileText,
  Github,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Plus,
  Search,
  Terminal,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import {
  CommandMenu,
  CommandMenuTrigger,
  CommandMenuContent,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuEmpty,
  useCommandMenuShortcut,
  useDocsShortcut,
} from "@/components/ui/command-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useModifierKey } from "@/hooks/use-modifier-key";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The global command palette.
 *
 * ## What was wrong with it
 *
 * - **Three of its seven commands were the same command.** "Create New Repl",
 *   "Activate a Repl" and "Get Repls" all ran `router.push("/dashboard")`.
 *   A palette that lists actions it cannot perform is worse than a short one.
 * - **Docs search never returned anything.** It fetched `/api/docs/search?q=`,
 *   a route declared `force-static` — which strips the search params, so the
 *   handler scored the empty string and answered `[]` every time. See the
 *   route for the fix; the index is fetched once now and scored here.
 * - It offered "Dashboard" and "Logout" to signed-out visitors, and "Login" to
 *   signed-in ones was the only thing auth actually changed.
 * - "Docs" was drawn with a cog icon.
 * - Two `console.log`s shipped to production.
 * - Nothing on screen said the thing was keyboard-driven.
 *
 * ## How it works now
 *
 * One list. Typing filters commands *and* documentation together, because
 * needing to know in advance which of two modes holds your answer defeats the
 * point of a palette. The docs index is fetched lazily on first open — the
 * palette is mounted on every route, so the corpus must not be in the root
 * layout's bundle.
 */

interface DocEntry {
  title: string;
  description: string;
  url: string;
  section: string;
  excerpt: string;
}

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: "Go to" | "Actions";
  keywords?: string;
  shortcut?: string;
  run: () => void;
}

/** Scores a document against the query. Title hits beat body hits, heavily. */
function scoreDoc(doc: DocEntry, terms: string[]): number {
  const title = doc.title.toLowerCase();
  const description = doc.description.toLowerCase();
  const excerpt = doc.excerpt.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (title === term) score += 100;
    else if (title.startsWith(term)) score += 50;
    else if (title.includes(term)) score += 30;
    else if (description.includes(term)) score += 10;
    else if (excerpt.includes(term)) score += 3;
    else return 0;
  }
  return score;
}

/**
 * @param compact Render as a key-cap sized trigger rather than a labelled
 *   button. The navbar centres this next to "Docs" and "Pricing", where a
 *   full-width outline button reading "Command Palette" was both the widest
 *   thing in the row and the least likely to be clicked — the point of a
 *   palette is the shortcut.
 */
export const Cmd = ({ compact = false }: { compact?: boolean } = {}) => {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const modifier = useModifierKey();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [docs, setDocs] = React.useState<DocEntry[] | null>(null);

  useCommandMenuShortcut(() => setOpen((value) => !value));
  useDocsShortcut(() => {
    setOpen(true);
    setQuery("docs ");
  });

  // Fetch the docs index once, on first open. `force-static` on the route
  // means this is a cached file, not a computation, so the cost is one request
  // for the life of the tab.
  React.useEffect(() => {
    if (!open || docs !== null) return;

    let ignore = false;
    (async () => {
      try {
        const response = await fetch("/api/docs/search");
        if (!response.ok) throw new Error(String(response.status));
        const payload = await response.json();
        if (!ignore) setDocs(payload.docs ?? []);
      } catch {
        // An empty index degrades to a commands-only palette, which is still
        // useful. Nothing here is worth an error state.
        if (!ignore) setDocs([]);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [open, docs]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const close = React.useCallback(() => setOpen(false), []);

  const go = React.useCallback(
    (path: string) => {
      close();
      router.push(path);
    },
    [close, router],
  );

  const openExternal = React.useCallback(
    (url: string) => {
      close();
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [close],
  );

  /**
   * Only commands that do something distinct, and only the ones that apply to
   * whoever is looking.
   */
  const commands = React.useMemo<Command[]>(() => {
    const list: Command[] = [
      {
        id: "home",
        label: "Home",
        icon: Home,
        group: "Go to",
        keywords: "landing start",
        run: () => go("/"),
      },
      {
        id: "docs",
        label: "Documentation",
        icon: BookOpen,
        group: "Go to",
        keywords: "guides reference manual",
        run: () => go("/docs"),
      },
      {
        id: "quickstart",
        label: "Quickstart",
        hint: "Create and open your first workspace",
        icon: Waypoints,
        group: "Go to",
        keywords: "getting started tutorial",
        run: () => go("/docs/quickstart"),
      },
      {
        id: "pricing",
        label: "Pricing",
        icon: DollarSign,
        group: "Go to",
        keywords: "plans cost free tier billing",
        run: () => go("/#pricing"),
      },
    ];

    if (isAuthenticated) {
      list.unshift(
        {
          id: "dashboard",
          label: "Dashboard",
          hint: "All your workspaces",
          icon: LayoutGrid,
          group: "Go to",
          keywords: "repls workspaces list",
          run: () => go("/dashboard"),
        },
        {
          id: "new-workspace",
          label: "New workspace",
          hint: "Pick a template and start a container",
          icon: Plus,
          group: "Actions",
          keywords: "create repl container start",
          run: () => go("/dashboard"),
        },
        {
          id: "terminal",
          label: "Terminal view",
          hint: "Drive the dashboard from a shell",
          icon: Terminal,
          group: "Actions",
          keywords: "cli shell console",
          run: () => go("/dashboard?view=terminal"),
        },
      );
    }

    list.push(
      {
        id: "github",
        label: "Source on GitHub",
        icon: Github,
        group: "Actions",
        keywords: "repo repository code contribute issues",
        run: () => openExternal(siteConfig.repo),
      },
      isAuthenticated
        ? {
            id: "logout",
            label: "Log out",
            icon: LogOut,
            group: "Actions",
            keywords: "sign out exit",
            run: () => {
              close();
              void logout();
            },
          }
        : {
            id: "login",
            label: "Log in",
            hint: "Continue with GitHub",
            icon: LogIn,
            group: "Actions",
            keywords: "sign in auth account",
            run: () => go("/login"),
          },
    );

    return list;
  }, [isAuthenticated, go, openExternal, close, logout]);

  const needle = query.trim().toLowerCase();
  const terms = needle.length > 0 ? needle.split(/\s+/) : [];

  const matchedCommands = React.useMemo(() => {
    if (terms.length === 0) return commands;
    return commands.filter((command) => {
      const haystack =
        `${command.label} ${command.hint ?? ""} ${command.keywords ?? ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [commands, terms]);

  const matchedDocs = React.useMemo(() => {
    if (!docs || terms.length < 1 || needle.length < 2) return [];
    return docs
      .map((doc) => ({ doc, score: scoreDoc(doc, terms) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((hit) => hit.doc);
  }, [docs, terms, needle]);

  const groups = React.useMemo(() => {
    const byGroup = new Map<string, Command[]>();
    for (const command of matchedCommands) {
      const existing = byGroup.get(command.group);
      if (existing) existing.push(command);
      else byGroup.set(command.group, [command]);
    }
    return [...byGroup.entries()];
  }, [matchedCommands]);

  const empty = matchedCommands.length === 0 && matchedDocs.length === 0;

  // Rows are numbered across every group, because the arrow keys move through
  // the whole list rather than group by group.
  let row = 0;

  return (
    <CommandMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
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

      <CommandMenuContent className="rounded-lg border-edge bg-overlay">
        <CommandMenuInput
          placeholder="Search commands and documentation…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <CommandMenuList maxHeight="min(60vh, 420px)">
          {empty ? (
            <CommandMenuEmpty>
              Nothing matches &ldquo;{query}&rdquo;
            </CommandMenuEmpty>
          ) : (
            <>
              {groups.map(([group, items]) => (
                <CommandMenuGroup key={group} heading={group}>
                  {items.map((command) => {
                    const Icon = command.icon;
                    return (
                      <CommandMenuItem
                        key={command.id}
                        index={row++}
                        icon={<Icon size={16} />}
                        shortcut={command.shortcut}
                        onSelect={command.run}
                      >
                        <span className="flex items-baseline gap-2">
                          <span className="truncate">{command.label}</span>
                          {command.hint ? (
                            <span className="truncate text-xs text-ink-subtle">
                              {command.hint}
                            </span>
                          ) : null}
                        </span>
                      </CommandMenuItem>
                    );
                  })}
                </CommandMenuGroup>
              ))}

              {matchedDocs.length > 0 ? (
                <CommandMenuGroup heading="Documentation">
                  {matchedDocs.map((doc) => (
                    <CommandMenuItem
                      key={doc.url}
                      index={row++}
                      icon={<FileText size={16} />}
                      onSelect={() => go(doc.url)}
                      className="items-start"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="truncate">{doc.title}</span>
                        <span className="shrink-0 font-mono text-[10px] text-ink-subtle">
                          {doc.section}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-xs text-ink-subtle">
                        {doc.description}
                      </span>
                    </CommandMenuItem>
                  ))}
                </CommandMenuGroup>
              ) : null}
            </>
          )}
        </CommandMenuList>

        {/* The palette is entirely keyboard-driven and nothing said so, which
            meant only people who guessed found out. */}
        <div className="flex items-center gap-4 border-t border-edge px-3 py-2 font-mono text-[10px] text-ink-subtle">
          <Legend keys={["↑", "↓"]}>navigate</Legend>
          <Legend keys={["↵"]}>select</Legend>
          <Legend keys={["esc"]}>close</Legend>
          <span className="ml-auto hidden sm:inline">
            Type to search the docs
          </span>
        </div>
      </CommandMenuContent>
    </CommandMenu>
  );
};

function Legend({
  keys,
  children,
}: {
  keys: string[];
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-edge bg-raised px-1 leading-none"
        >
          {key}
        </kbd>
      ))}
      {children}
    </span>
  );
}
