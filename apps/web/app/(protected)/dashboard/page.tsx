"use client";

import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import AppBackdrop from "@/components/backgrounds/app-backdrop";
import GuiInterface from "@/components/dashboard/GuiInterface";
import TerminalInterface from "@/components/dashboard/TerminalInterface";
import StartReplCard from "@/components/ui/start-repl-card";
import { useAuth } from "@/contexts/AuthContext";
import { CoreService } from "@/lib/core";
import { cn } from "@/lib/utils";
import { LayoutGrid, TerminalIcon } from "lucide-react";
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
      <AppBackdrop />

      {popup && (
        <StartReplCard
          replName={popup?.replName}
          link={popup.link}
          onClose={() => setPopup(null)}
        />
      )}

      <div className="min-h-dvh pt-16 text-ink">
        <div className="mx-auto w-full max-w-7xl px-3 pb-8 sm:px-4 lg:px-6">
          <div className="flex h-[calc(100dvh-6rem)] flex-col sm:h-[calc(100dvh-8rem)] lg:h-[680px]">
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-edge bg-surface">
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
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="label text-ink-subtle">Loading</p>
        </div>
      }
    >
      <DashboardComponent />
    </Suspense>
  );
}

/* -------------------------------------------------------------------------- */

const TABS = [
  { id: "ui", label: "Workspaces", icon: LayoutGrid },
  { id: "terminal", label: "Terminal", icon: TerminalIcon, beta: true },
] as const;

/**
 * A segmented control, not two buttons.
 *
 * The previous version gave the *inactive* tab no background at all, which
 * meant it inherited whatever the default Button variant resolved to — for a
 * while that was the same fill as the active tab, and the two were
 * indistinguishable. Being explicit about both states is what stops that class
 * of bug recurring.
 */
function NavigationTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: "terminal" | "ui";
  setActiveTab: (tab: "terminal" | "ui") => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard view"
      className="inline-flex items-center gap-0.5 rounded-md border border-edge bg-canvas p-0.5"
    >
      {TABS.map(({ id, label, icon: Icon, ...rest }) => {
        const active = activeTab === id;
        const beta = "beta" in rest && rest.beta;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setActiveTab(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm px-3 py-1.5",
              "font-mono text-xs transition-colors duration-[--duration-fast]",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
              active
                ? "bg-raised text-ink"
                : "bg-transparent text-ink-subtle hover:text-ink-muted",
            )}
          >
            <Icon
              className={cn("size-3.5", active ? "text-brand" : "text-current")}
            />
            {label}
            {beta && (
              <span className="label rounded-xs bg-raised px-1 py-px text-[9px] text-ink-subtle">
                Beta
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A clock that actually ticks.
 *
 * The previous header called `new Date().toLocaleTimeString()` straight in
 * render: it rendered once and then froze, and because the server and the
 * client called it at different instants it was also a guaranteed hydration
 * mismatch. Starting at null and filling in from an effect renders nothing on
 * the server, so there is nothing to mismatch.
 */
function Clock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // `tabular-nums` stops the row jittering as the digits change width.
  return (
    <span className="font-mono text-xs tabular-nums text-ink-subtle">
      {now ?? "--:--:--"}
    </span>
  );
}

function DashboardHeader({
  activeTab,
  setActiveTab,
}: {
  activeTab: "terminal" | "ui";
  setActiveTab: (tab: "terminal" | "ui") => void;
}) {
  return (
    <header className="flex shrink-0 flex-col items-start justify-between gap-3 border-b border-edge px-3 py-2.5 sm:flex-row sm:items-center sm:gap-0 sm:px-4">
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <Clock />
    </header>
  );
}
