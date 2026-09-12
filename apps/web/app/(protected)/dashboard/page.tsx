"use client";

import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import GuiInterface from "@/components/dashboard/GuiInterface";
import TerminalInterface from "@/components/dashboard/TerminalInterface";
import { Button } from "@/components/ui/button";
import LetterGlitch from "@/components/ui/letter-glitch";
import StartReplCard from "@/components/ui/start-repl-card";
import { useAuth } from "@/contexts/AuthContext";
import { CoreService } from "@/lib/core";
import { cn } from "@/lib/utils";
import { Activity, Clock, Terminal, Zap } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function DashboardComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("view") === "terminal" ? "terminal" : "ui";

  const [popup, setPopup] = useState<{ replName: string; link: string } | null>(
    null,
  );

  const { user } = useAuth();
  const userName = user?.login || "";

  const core = CoreService.getInstance();

  const getRepls = async () => await core.getRepls();
  const createRepl = async (template: string, replName: string) =>
    await core.newRepl({ template, replName, userName });
  const startRepl = async (name: string) => {
    try {
      const response = await core.startRepl(name);
      setPopup({
        replName: response.replName,
        link: `repl/${response.replId}`,
      });
      return response;
    } catch (err) {
      throw err;
    }
  };
  const deleteReplSession = async (name: string) =>
    await core.deleteReplSession(name);
  const deleteRepl = async (replId: string) =>
    await core.deleteReplById(replId);

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (!searchParams.has("view") && isMobile) {
      router.replace(`${pathname}?view=gui`);
    }
  }, [pathname, router, searchParams]);

  const handleTabChange = (tab: "terminal" | "ui") => {
    const view = tab === "ui" ? "gui" : "terminal";
    router.push(`${pathname}?view=${view}`);
  };

  return (
    <ProtectedRoute>
      {popup && (
        <StartReplCard
          replName={popup?.replName}
          link={popup.link}
          onClose={() => setPopup(null)}
        />
      )}
      <div className="min-h-screen pt-16 text-gray-200">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="w-full">
              <div className="h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] lg:h-[650px] flex flex-col">
                <div className="flex-1 flex flex-col bg-black border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                  <DashboardHeader
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                  />

                  {activeTab === "terminal" && (
                    <TerminalInterface
                      userName={user?.login.toLowerCase() || "developer"}
                      getRepls={getRepls}
                      createRepl={createRepl}
                      startRepl={startRepl}
                      deleteReplSession={deleteReplSession}
                    />
                  )}
                  {activeTab === "ui" && (
                    <GuiInterface
                      userName={user?.name || "developer"}
                      getRepls={getRepls}
                      createRepl={createRepl}
                      startRepl={startRepl}
                      deleteReplSession={deleteReplSession}
                      deleteRepl={deleteRepl}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardComponent />
    </Suspense>
  );
}

const NavigationTabs = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: "terminal" | "ui";
  setActiveTab: (tab: "terminal" | "ui") => void;
}) => {
  return (
    <div className="flex w-full gap-2 rounded-lg border border-edge bg-surface p-2 max-md:justify-around lg:gap-5">
      <Button
        variant="ghost"
        onClick={() => setActiveTab("ui")}
        aria-pressed={activeTab === "ui"}
        className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-[--duration-normal] sm:px-4 sm:text-sm ${
          activeTab === "ui"
            ? "bg-brand text-brand-fg hover:bg-brand/90"
            : "bg-transparent text-ink-muted hover:bg-raised hover:text-ink"
        }`}
      >
        <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">GUI Mode</span>
        <span className="sm:hidden">GUI</span>
        <Activity className="w-3 h-3" />
        <span>Live</span>
      </Button>
      <Button
        variant="ghost"
        aria-pressed={activeTab === "terminal"}
        className={`flex w-full items-center justify-center gap-2 px-3 py-2 text-xs transition-colors duration-[--duration-normal] sm:gap-3 sm:px-4 sm:text-sm ${
          activeTab === "terminal"
            ? "bg-brand text-brand-fg hover:bg-brand/90"
            : "bg-transparent text-ink-muted hover:bg-raised hover:text-ink"
        }`}
        onClick={() => setActiveTab("terminal")}
      >
        <Terminal
          className={cn(
            "h-4 w-4 sm:h-5 sm:w-5",
            activeTab === "terminal" ? "text-brand-fg" : "text-brand",
          )}
        />
        <span className="hidden font-semibold sm:inline">devX Terminal</span>
        <span className="font-semibold sm:hidden">Terminal</span>
        <span
          className={cn(
            "hidden rounded-full px-1.5 py-0.5 text-xs sm:inline sm:px-2",
            activeTab === "terminal"
              ? "bg-brand-fg/15 text-brand-fg"
              : "bg-warning/15 text-warning",
          )}
        >
          Beta
        </span>
      </Button>
    </div>
  );
};

function DashboardHeader({
  activeTab,
  setActiveTab,
}: {
  activeTab: "terminal" | "ui";
  setActiveTab: (tab: "terminal" | "ui") => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-3 sm:px-4 py-3 bg-gray-900 border-b border-gray-700">
      <div className="w-full md:w-auto">
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span className="hidden sm:inline">
            {new Date().toLocaleTimeString()}
          </span>
          <span className="sm:hidden">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
    </div>
  );
}
