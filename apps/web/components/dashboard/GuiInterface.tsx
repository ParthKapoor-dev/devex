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
  Code,
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
    <div className="min-h-screen bg-black text-gray-300">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <Code className="w-4 h-4 text-black" />
            </div>
            <h1 className="text-lg font-bold text-white">devX</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white w-36 sm:w-64"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors duration-200 font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-white">Your Repls</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Folder className="w-4 h-4" />
            <span>{filteredRepls.length} repls</span>
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-lg">
          {/* Table Header for Desktop */}
          <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 px-4 py-3 border-b border-gray-800 uppercase">
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
                  className="h-20 md:h-16 bg-gray-900/50 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          ) : filteredRepls.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-7 h-7 text-gray-600" />
              </div>
              <h3 className="text-md font-medium text-white mb-2">
                {searchQuery ? "No repls found" : "No repls yet"}
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                {searchQuery
                  ? `No repls match your search for "${searchQuery}". Try a different query.`
                  : "Get started by creating your first repl. It's quick and easy!"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-colors duration-200 font-semibold text-sm mx-auto"
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
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-900/70 p-4 transition-colors duration-200"
                  >
                    {/* Name and Details */}
                    <div className="md:col-span-5 flex items-center gap-3">
                      <div />
                      {template.icon}
                      <div>
                        <h3 className="font-semibold text-white truncate text-sm">
                          {repl.name}
                        </h3>
                        <p className="text-xs text-gray-400">{template.name}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500 md:hidden text-xs uppercase font-medium">
                          Status
                        </span>
                        <div
                          className={cn(
                            "flex items-center gap-2 w-fit px-2 py-1 rounded-full text-xs font-medium",
                            isActive
                              ? "bg-green-500/10 text-green-400"
                              : "bg-gray-700/50 text-gray-400",
                          )}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              isActive ? "bg-green-500" : "bg-gray-500",
                            )}
                          ></span>
                          {isActive ? "Running" : "Stopped"}
                        </div>
                      </div>
                    </div>

                    {/* User */}
                    <div className="md:col-span-2 text-sm text-gray-400">
                      <span className="text-gray-500 md:hidden text-xs uppercase font-medium mr-4">
                        User
                      </span>
                      {repl.user}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-3 flex justify-start md:justify-end items-center gap-2 pt-2 md:pt-0 border-t border-gray-800/50 md:border-none">
                      {isActive ? (
                        <>
                          <Link
                            href={`/repl/${repl.id}`}
                            passHref
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors duration-200 font-medium text-xs text-white"
                          >
                            Open <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleDeleteReplSession(repl.id)}
                            disabled={actionLoading[repl.id] === "deleting"}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200 font-medium text-xs"
                          >
                            {actionLoading[repl.id] === "deleting" ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200 font-medium text-xs text-white"
                          >
                            {actionLoading[repl.id] === "starting" ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
                            title="Delete Repl"
                          >
                            {actionLoading[repl.id] === "deleting" ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center  p-4">
          {repls.length >= 2 ? (
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-red-500">
                  Cannot Create More Repls
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-white transition-colors duration-200"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <p className="block text-sm font-medium text-gray-400 mb-2">
                Your Free Limit is Expired. Get Pro to get more Repls and
                features
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 font-semibold text-sm"
                >
                  Cancel
                </button>
                <Link href={"/#pricing"} className="">
                  <button className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg transition-colors duration-200 font-semibold flex items-center justify-center gap-2 text-sm">
                    Pricing Page
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  Create New Repl
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-white transition-colors duration-200"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Repl Name
                  </label>
                  <input
                    type="text"
                    value={newReplName}
                    onChange={(e) => setNewReplName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
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
                            ? "border-white bg-white/5"
                            : "border-gray-800 hover:border-gray-700",
                        )}
                      >
                        <div />
                        {template.icon}
                        <div>
                          <h3 className="font-medium text-white text-sm">
                            {template.name}
                          </h3>
                          <p className="text-xs text-gray-400">
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
                  className="flex-1 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRepl}
                  disabled={
                    !newReplName.trim() || !selectedTemplate || creating
                  }
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg transition-colors duration-200 font-semibold flex items-center justify-center gap-2 text-sm"
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
