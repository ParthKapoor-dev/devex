"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Play,
  Trash2,
  Folder,
  Clock,
  ArrowRight,
  StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import templates from "@/lib/templates";
import { toast } from "sonner";
// Types definition
interface StoredRepl {
  id: string;
  name: string;
  user: string;
  isActive?: boolean;
}
interface ReplDashboardProps {
  userName: string;
  getRepls: () => Promise<StoredRepl[]>;
  createRepl: (templateKey: string, replName: string) => Promise<void>;
  startRepl: (replId: string) => Promise<void>;
  deleteReplSession: (replId: string) => Promise<void>;
  deleteRepl: (replId: string) => Promise<void>;
}

const GuiInterface: React.FC<ReplDashboardProps> = ({
  userName,
  getRepls,
  createRepl,
  startRepl,
  deleteReplSession,
  deleteRepl,
}) => {
  const [repls, setRepls] = useState<StoredRepl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [newReplName, setNewReplName] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: "starting" | "deleting" | null;
  }>({});

  useEffect(() => {
    loadRepls();
  }, []);

  const loadRepls = async () => {
    try {
      setLoading(true);
      const replList = await getRepls();
      setRepls(
        replList.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0)),
      );
    } catch (error) {
      console.error("Error loading repls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepl = async () => {
    if (!newReplName.trim() || !selectedTemplate) return;

    if (repls.length >= 2) {
      toast.error("Free Account Limit Expired", {
        description: "Go to pricing page to know more",
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
    } finally {
      setCreating(false);
    }
  };

  const handleStartRepl = async (replId: string) => {
    try {
      setActionLoading({ ...actionLoading, [replId]: "starting" });
      await startRepl(replId);
      await loadRepls();
    } catch (error) {
      console.error("Error starting repl:", error);
    } finally {
      setActionLoading({ ...actionLoading, [replId]: null });
    }
  };

  const handleDeleteReplSession = async (replId: string) => {
    try {
      setActionLoading({ ...actionLoading, [replId]: "deleting" });
      await deleteReplSession(replId);
      await loadRepls();
    } catch (error) {
      console.error("Error deleting repl:", error);
    } finally {
      setActionLoading({ ...actionLoading, [replId]: null });
    }
  };

  const handleDeleteRepl = async (replId: string) => {
    try {
      setActionLoading({ ...actionLoading, [replId]: "deleting" });
      await deleteRepl(replId);
      await loadRepls();
    } catch (error) {
      console.error("Error deleting repl:", error);
    } finally {
      setActionLoading({ ...actionLoading, [replId]: null });
    }
  };

  const filteredRepls = repls.filter((repl) =>
    repl.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTemplateFromRepl = (repl: StoredRepl) => {
    const replName = repl.name.toLowerCase();
    if (replName.includes("node") || replName.includes("js")) {
      return templates["node"];
    }
    if (replName.includes("python") || replName.includes("py")) {
      return templates.python;
    }
    return templates["node"]; // default
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-ink-muted">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-edge px-3 py-2 sm:px-4">
        <h2 className="label text-ink-muted">Workspaces</h2>
        <span className="font-mono text-xs text-ink-subtle">
          {filteredRepls.length}
        </span>

        <div className="relative ml-auto">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle"
          />
          <input
            type="search"
            aria-label="Search workspaces"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 w-36 rounded-sm border border-edge bg-canvas pl-7 pr-2 font-mono text-xs text-ink transition-colors duration-[--duration-fast] placeholder:text-ink-subtle focus:border-brand focus:outline-none sm:w-56"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-brand px-2.5 text-xs font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        >
          <Plus className="size-3.5" />
          New
        </button>
      </div>

      {/* Main Content */}
      <section className="min-h-0 flex-1 overflow-y-auto">
        <div>
          {/* Table Header for Desktop */}
          <div className="label sticky top-0 z-10 hidden grid-cols-12 gap-4 border-b border-edge bg-surface px-4 py-2 text-ink-subtle md:grid">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">User</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {loading ? (
            <div className="p-4 flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 md:h-16 bg-surface/50 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          ) : filteredRepls.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-7 h-7 text-ink-subtle" />
              </div>
              <h3 className="text-md font-medium text-ink mb-2">
                {searchQuery ? "No repls found" : "No repls yet"}
              </h3>
              <p className="text-ink-subtle text-sm mb-6 max-w-xs mx-auto">
                {searchQuery
                  ? `No repls match your search for "${searchQuery}". Try a different query.`
                  : "Get started by creating your first repl. It's quick and easy!"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-ink text-canvas hover:bg-raised rounded-lg transition-colors duration-200 font-semibold text-sm mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Repl
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredRepls.map((repl) => {
                const template = getTemplateFromRepl(repl);
                const isActive = repl.isActive;

                return (
                  <div
                    key={repl.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-surface/70 p-4 transition-colors duration-200"
                  >
                    {/* Name and Details */}
                    <div className="md:col-span-5 flex items-center gap-3">
                      <div />
                      {template.icon}
                      <div>
                        <h3 className="font-semibold text-ink truncate text-sm">
                          {repl.name}
                        </h3>
                        <p className="text-xs text-ink-subtle">{template.name}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-ink-subtle md:hidden text-xs uppercase font-medium">
                          Status
                        </span>
                        <div
                          className={cn(
                            "flex items-center gap-2 w-fit px-2 py-1 rounded-full text-xs font-medium",
                            isActive
                              ? "bg-term-accent/10 text-success"
                              : "bg-raised/50 text-ink-subtle",
                          )}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              isActive ? "bg-term-accent" : "bg-gray-500",
                            )}
                          ></span>
                          {isActive ? "Running" : "Stopped"}
                        </div>
                      </div>
                    </div>

                    {/* User */}
                    <div className="md:col-span-2 text-sm text-ink-subtle">
                      <span className="text-ink-subtle md:hidden text-xs uppercase font-medium mr-4">
                        User
                      </span>
                      {repl.user}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-3 flex justify-start md:justify-end items-center gap-2 pt-2 md:pt-0 border-t border-edge/50 md:border-none">
                      {isActive ? (
                        <>
                          <Link
                            href={`/repl/${repl.id}`}
                            passHref
                            className="flex items-center gap-2 px-3 py-1.5 bg-ink/10 hover:bg-ink/20 rounded-md transition-colors duration-200 font-medium text-xs text-ink"
                          >
                            Open <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleDeleteReplSession(repl.id)}
                            disabled={actionLoading[repl.id] === "deleting"}
                            className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 text-danger hover:bg-danger/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200 font-medium text-xs"
                          >
                            {actionLoading[repl.id] === "deleting" ? (
                              <div className="w-3 h-3 border-2 border-edge-strong border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <StopCircle className="w-3 h-3" />
                            )}
                            Deactivate
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartRepl(repl.id)}
                            disabled={actionLoading[repl.id] === "starting"}
                            className="flex items-center gap-2 px-3 py-1.5 bg-ink/10 hover:bg-ink/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200 font-medium text-xs text-ink"
                          >
                            {actionLoading[repl.id] === "starting" ? (
                              <>
                                <div className="w-3 h-3 border-2 border-edge-strong border-t-transparent rounded-full animate-spin" />
                                Activating...
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteRepl(repl.id)}
                            disabled={actionLoading[repl.id] === "deleting"}
                            className="p-1.5 text-ink-subtle hover:text-danger hover:bg-danger/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
                            title="Delete Repl"
                          >
                            {actionLoading[repl.id] === "deleting" ? (
                              <div className="w-4 h-4 border-2 border-edge-strong border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Create Repl Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-canvas/60 backdrop-blur-sm flex items-center justify-center  p-4">
          {repls.length >= 2 ? (
            <div className="bg-canvas border border-edge rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-danger">
                  Cannot Create More Repls
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-ink-subtle hover:text-ink transition-colors duration-200"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <p className="block text-sm font-medium text-ink-subtle mb-2">
                Your Free Limit is Expired. Get Pro to get more Repls and
                features
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-raised/50 hover:bg-raised text-ink rounded-lg transition-colors duration-200 font-semibold text-sm"
                >
                  Cancel
                </button>
                <Link href={"/#pricing"} className="">
                  <button className="flex-1 px-4 py-2 bg-ink hover:bg-raised disabled:opacity-50 disabled:cursor-not-allowed text-canvas rounded-lg transition-colors duration-200 font-semibold flex items-center justify-center gap-2 text-sm">
                    Pricing Page
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-canvas border border-edge rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-ink">
                  Create New Repl
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-ink-subtle hover:text-ink transition-colors duration-200"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-subtle mb-2">
                    Repl Name
                  </label>
                  <input
                    type="text"
                    value={newReplName}
                    onChange={(e) => setNewReplName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-sm text-ink placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-subtle mb-2">
                    Choose Template
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(templates).map(([key, template]) => (
                      <div
                        key={key}
                        onClick={() => setSelectedTemplate(key)}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-3",
                          selectedTemplate === key
                            ? "border-edge-strong bg-ink/5"
                            : "border-edge hover:border-edge",
                        )}
                      >
                        <div />
                        {template.icon}
                        <div>
                          <h3 className="font-medium text-ink text-sm">
                            {template.name}
                          </h3>
                          <p className="text-xs text-ink-subtle">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-raised/50 hover:bg-raised text-ink rounded-lg transition-colors duration-200 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRepl}
                  disabled={
                    !newReplName.trim() || !selectedTemplate || creating
                  }
                  className="flex-1 px-4 py-2 bg-ink hover:bg-raised disabled:opacity-50 disabled:cursor-not-allowed text-canvas rounded-lg transition-colors duration-200 font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Repl
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuiInterface;
