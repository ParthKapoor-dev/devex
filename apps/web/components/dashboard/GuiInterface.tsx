"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Play,
  Plus,
  Search,
  StopCircle,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isTypingTarget } from "@/lib/keyboard";
import templates, { resolveTemplate } from "@/lib/templates";
import type { StoredRepl } from "@/types/dashboard";

/**
 * The workspace list.
 *
 * ## What changed and why
 *
 * - **It invented the template for every row.** `getTemplateFromRepl` looked at
 *   the *name*: "python" or "py" anywhere in it meant Python, everything else
 *   meant Node. A workspace created from the Python template and called "api"
 *   was labelled Node.js. The API has returned the real value all along; the
 *   frontend type called it `templateKey`, a field the server never sends, and
 *   this file shadowed that type with a local one that dropped it entirely.
 * - **Primary actions were `bg-ink text-canvas`** — the text colour used as a
 *   fill, so every confirm button was a white pill rather than the brand,
 *   while the "New" button two rows up was correctly amber.
 * - **The modal was not a dialog.** No Escape, no backdrop dismiss, no focus
 *   move, no `role`, no scroll lock, and a `<Plus>` rotated 45° for a close
 *   button. Its two variants also duplicated every piece of chrome.
 * - `text-md` is not a Tailwind class. The empty-state heading had been
 *   rendering at the base size since it was written.
 * - Raw `gray-500`, `gray-600`, `gray-800`, `border-black` and
 *   `focus:ring-white` throughout.
 */

interface ReplDashboardProps {
  userName: string;
  getRepls: () => Promise<StoredRepl[]>;
  createRepl: (templateKey: string, replName: string) => Promise<void>;
  startRepl: (replId: string) => Promise<void>;
  deleteReplSession: (replId: string) => Promise<void>;
  deleteRepl: (replId: string) => Promise<void>;
}

/** The free tier's ceiling. It was written as a bare `2` in two places. */
const FREE_WORKSPACE_LIMIT = 2;

type RowAction = "starting" | "deleting" | null;

const GuiInterface: React.FC<ReplDashboardProps> = ({
  getRepls,
  createRepl,
  startRepl,
  deleteReplSession,
  deleteRepl,
}) => {
  const [repls, setRepls] = useState<StoredRepl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [newReplName, setNewReplName] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, RowAction>>(
    {},
  );

  const loadRepls = useCallback(async () => {
    try {
      setLoading(true);
      const replList = await getRepls();
      setRepls(
        [...replList].sort(
          (a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0),
        ),
      );
    } catch (error) {
      console.error("Error loading repls:", error);
      toast.error("Could not load your workspaces", {
        description: "The API did not respond. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  }, [getRepls]);

  useEffect(() => {
    void loadRepls();
  }, [loadRepls]);

  // Functional updates: these run inside async handlers, where the captured
  // `actionLoading` is whatever it was when the click happened. Two overlapping
  // actions on different rows used to clobber each other's entry.
  const setRowAction = useCallback((replId: string, action: RowAction) => {
    setActionLoading((current) => ({ ...current, [replId]: action }));
  }, []);

  const runRowAction = useCallback(
    async (replId: string, action: Exclude<RowAction, null>, fn: () => Promise<void>) => {
      try {
        setRowAction(replId, action);
        await fn();
        await loadRepls();
      } catch (error) {
        console.error(`Error during ${action}:`, error);
        toast.error(
          action === "starting"
            ? "Could not start that workspace"
            : "Could not stop that workspace",
        );
      } finally {
        setRowAction(replId, null);
      }
    },
    [loadRepls, setRowAction],
  );

  const atLimit = repls.length >= FREE_WORKSPACE_LIMIT;

  const handleCreateRepl = async () => {
    if (!newReplName.trim() || !selectedTemplate) return;

    if (atLimit) {
      toast.error("You are at the free plan's limit", {
        description: `Free accounts can keep ${FREE_WORKSPACE_LIMIT} workspaces. Delete one, or see the plans.`,
      });
      return;
    }

    try {
      setCreating(true);
      const template = templates[selectedTemplate as keyof typeof templates];
      await createRepl(template.key, newReplName.trim());
      await loadRepls();
      setShowCreateModal(false);
      setNewReplName("");
      setSelectedTemplate("");
    } catch (error) {
      console.error("Error creating repl:", error);
      toast.error("Could not create that workspace");
    } finally {
      setCreating(false);
    }
  };

  const filteredRepls = repls.filter((repl) =>
    repl.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /**
   * `/` focuses the filter, the same key the docs use.
   *
   * Focus rather than a dialog: the filter here is live and inline, so a modal
   * would put a layer between you and the list it is filtering. This effect
   * lives in this component rather than on the page, which scopes it for free
   * — the terminal tab replaces this whole subtree, and `/` is a character you
   * type constantly in a shell.
   *
   * A bare key needs the typing guard or it eats the character.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-ink-muted">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-edge px-3 py-2 sm:px-4">
        <h2 className="label text-ink-muted">Workspaces</h2>
        <span className="font-mono text-xs tabular-nums text-ink-subtle">
          {filteredRepls.length}
          <span className="text-ink-subtle/60">/{FREE_WORKSPACE_LIMIT}</span>
        </span>

        <div className="relative ml-auto">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle"
          />
          <input
            ref={searchRef}
            type="search"
            aria-label="Search workspaces"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              // Escape gets you out of the filter without reaching for the
              // mouse, and clears it — a filter you have escaped from should
              // not still be hiding rows.
              if (e.key === "Escape") {
                setSearchQuery("");
                e.currentTarget.blur();
              }
            }}
            className="h-7 w-36 rounded-sm border border-edge bg-canvas pl-7 pr-7 font-mono text-xs text-ink transition-colors duration-[--duration-fast] placeholder:text-ink-subtle focus:border-brand focus:outline-none sm:w-56"
          />

          {/* Only while the field is empty: once you are typing, the hint is
              telling you about a key you have already used. */}
          {searchQuery === "" && (
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-edge px-1 font-mono text-[10px] leading-4 text-ink-subtle sm:block"
            >
              /
            </kbd>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-brand px-2.5 text-xs font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New
        </button>
      </div>

      {/* List */}
      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="label sticky top-0 z-10 hidden grid-cols-12 gap-4 border-b border-edge bg-surface px-4 py-2 text-ink-subtle md:grid">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-px bg-edge">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[68px] animate-pulse bg-canvas" />
            ))}
          </div>
        ) : filteredRepls.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            onCreate={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="flex flex-col gap-px bg-edge">
            {filteredRepls.map((repl) => (
              <ReplRow
                key={repl.id}
                repl={repl}
                busy={actionLoading[repl.id] ?? null}
                onStart={() =>
                  runRowAction(repl.id, "starting", () => startRepl(repl.id))
                }
                onStop={() =>
                  runRowAction(repl.id, "deleting", () =>
                    deleteReplSession(repl.id),
                  )
                }
                onDelete={() =>
                  runRowAction(repl.id, "deleting", () => deleteRepl(repl.id))
                }
              />
            ))}
          </div>
        )}
      </section>

      {showCreateModal ? (
        <Dialog
          title={atLimit ? "You are at the free plan's limit" : "New workspace"}
          onClose={() => setShowCreateModal(false)}
        >
          {atLimit ? (
            <>
              <p className="text-sm leading-relaxed text-ink-muted">
                Free accounts can keep {FREE_WORKSPACE_LIMIT} workspaces at a
                time. Delete one you are finished with, or move to a plan that
                keeps more of them warm.
              </p>

              <DialogActions>
                <GhostButton onClick={() => setShowCreateModal(false)}>
                  Cancel
                </GhostButton>
                <Link
                  href="/#pricing"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400"
                >
                  See the plans
                </Link>
              </DialogActions>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-5">
                <div>
                  <label
                    htmlFor="workspace-name"
                    className="label mb-2 block text-ink-subtle"
                  >
                    Name
                  </label>
                  <input
                    id="workspace-name"
                    type="text"
                    autoFocus
                    value={newReplName}
                    onChange={(e) => setNewReplName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="h-9 w-full rounded-md border border-edge bg-canvas px-3 font-mono text-sm text-ink transition-colors duration-[--duration-fast] placeholder:text-ink-subtle focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <span className="label mb-2 block text-ink-subtle">
                    Template
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Template"
                    className="grid gap-2"
                  >
                    {Object.entries(templates).map(([key, template]) => {
                      const selected = selectedTemplate === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setSelectedTemplate(key)}
                          className={cn(
                            "flex items-center gap-3 rounded-md border p-3 text-left",
                            "transition-colors duration-[--duration-fast]",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                            selected
                              ? "border-brand bg-raised"
                              : "border-edge hover:border-edge-strong hover:bg-raised/60",
                          )}
                        >
                          {template.icon}
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-ink">
                              {template.name}
                            </span>
                            <span className="block text-xs text-ink-subtle">
                              {template.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogActions>
                <GhostButton onClick={() => setShowCreateModal(false)}>
                  Cancel
                </GhostButton>
                <button
                  type="button"
                  onClick={handleCreateRepl}
                  disabled={!newReplName.trim() || !selectedTemplate || creating}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      Create
                    </>
                  )}
                </button>
              </DialogActions>
            </>
          )}
        </Dialog>
      ) : null}
    </div>
  );
};

export default GuiInterface;

/* -------------------------------------------------------------------------- */

function ReplRow({
  repl,
  busy,
  onStart,
  onStop,
  onDelete,
}: {
  repl: StoredRepl;
  busy: RowAction;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
}) {
  // The real template, off the REPL. Not a guess from its name.
  const template = resolveTemplate(repl.template);
  const isActive = repl.isActive;

  return (
    <div className="grid grid-cols-1 items-center gap-3 bg-canvas p-4 transition-colors duration-[--duration-fast] hover:bg-surface md:grid-cols-12 md:gap-4">
      {/* Name */}
      <div className="flex items-center gap-3 md:col-span-5">
        {template.icon}
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm text-ink">{repl.name}</h3>
          <p className="truncate text-xs text-ink-subtle">{template.name}</p>
        </div>
      </div>

      {/* Status */}
      <div className="md:col-span-2">
        <span className="label mr-3 text-ink-subtle md:hidden">Status</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              // Grey for "not started", not red. Red is for something that
              // went wrong, and a stopped workspace has not.
              isActive ? "bg-term-accent" : "bg-ink-subtle",
            )}
          />
          <span className={isActive ? "text-term-accent" : "text-ink-subtle"}>
            {isActive ? "running" : "stopped"}
          </span>
        </span>
      </div>

      {/* Owner */}
      <div className="font-mono text-xs text-ink-subtle md:col-span-2">
        <span className="label mr-3 text-ink-subtle md:hidden">Owner</span>
        {repl.user}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-edge pt-3 md:col-span-3 md:justify-end md:border-none md:pt-0">
        {isActive ? (
          <>
            <Link
              href={`/repl/${repl.id}`}
              className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-brand px-2.5 text-xs font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
            >
              Open
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
            <RowButton
              onClick={onStop}
              busy={busy === "deleting"}
              icon={StopCircle}
              label="Stop"
            />
          </>
        ) : (
          <>
            <RowButton
              onClick={onStart}
              busy={busy === "starting"}
              icon={Play}
              label={busy === "starting" ? "Starting" : "Start"}
            />
            <RowButton
              onClick={onDelete}
              busy={busy === "deleting"}
              icon={Trash2}
              label="Delete"
              danger
              iconOnly
            />
          </>
        )}
      </div>
    </div>
  );
}

function RowButton({
  onClick,
  busy,
  icon: Icon,
  label,
  danger,
  iconOnly,
}: {
  onClick: () => void;
  busy: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  danger?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-sm border border-edge text-xs",
        iconOnly ? "w-7 justify-center" : "px-2.5",
        "transition-colors duration-[--duration-fast]",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
        "disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "text-ink-subtle hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
          : "text-ink-muted hover:border-edge-strong hover:bg-raised hover:text-ink",
      )}
    >
      {busy ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Icon className="size-3" />
      )}
      {iconOnly ? null : label}
    </button>
  );
}

function EmptyState({
  searchQuery,
  onCreate,
}: {
  searchQuery: string;
  onCreate: () => void;
}) {
  // Monochrome on purpose. An empty list is a state, not an event — spending
  // the accent here leaves nothing to mark the workspace you actually open.
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="label text-ink-subtle">
        {searchQuery ? "No matches" : "Nothing here yet"}
      </p>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
        {searchQuery ? (
          <>
            Nothing matches{" "}
            <span className="font-mono text-ink">{searchQuery}</span>. Names are
            the only thing searched.
          </>
        ) : (
          "A workspace is a container with your files in it. Pick a template and one is scheduled in a few seconds."
        )}
      </p>

      {!searchQuery && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Plus className="size-4" aria-hidden="true" />
          New workspace
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * A real modal.
 *
 * What was here had no `role`, no Escape handler, no backdrop dismiss, no
 * scroll lock and no focus management — and both of its variants repeated
 * every piece of chrome, so the close button existed twice and was a `<Plus>`
 * rotated 45° in both.
 */
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-canvas/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-lg border border-edge bg-overlay p-6 shadow-[0_24px_64px_-24px_rgb(0_0_0/0.9)]"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-medium tracking-[-0.02em] text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-md p-1 text-ink-subtle transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex gap-3">{children}</div>;
}

function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-edge px-4 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </button>
  );
}
