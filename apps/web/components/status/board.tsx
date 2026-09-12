"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RefreshCw } from "lucide-react";
import { CoreService } from "@/lib/core";
import { cn } from "@/lib/utils";

/**
 * The live half of the status page.
 *
 * Four rows, one per dependency, sharing a column grid so the states line up
 * vertically and a glance down the right edge answers the question. That is
 * the whole reason this is a table and not a grid of cards: three cards side
 * by side make you read three separate things to learn one fact.
 *
 * Colour carries meaning here rather than decoration — green for reachable,
 * amber for degraded, red for an error — which is the one place on the site
 * where amber is not reserved for "the thing you are on", because a degraded
 * dependency genuinely is what you came to look at.
 *
 * The backend answers `ok` or an error *string* per dependency, and `api` is
 * `ok` or `degraded`. Anything that is not `ok` is displayed verbatim: an
 * error message from the cluster is more useful than the word "Error".
 */

type Health = "ok" | "degraded" | "down" | "checking";

interface PingResponse {
  api: string;
  k8s: string;
  s3: string;
  redis: string;
}

const DEPENDENCIES = [
  {
    key: "k8s",
    name: "Kubernetes",
    detail: "Schedules the pod behind every workspace.",
  },
  {
    key: "s3",
    name: "Object storage",
    detail: "Holds workspace filesystems between runs.",
  },
  {
    key: "redis",
    name: "Redis",
    detail: "Workspace records and sign-in sessions.",
  },
] as const;

const REFRESH_MS = 30_000;

function classify(value: string | undefined): Health {
  if (value === undefined) return "checking";
  if (value === "ok") return "ok";
  if (value === "degraded") return "degraded";
  return "down";
}

const TONE: Record<Health, { dot: string; text: string; label: string }> = {
  ok: { dot: "bg-success", text: "text-success", label: "Operational" },
  degraded: { dot: "bg-warning", text: "text-warning", label: "Degraded" },
  down: { dot: "bg-danger", text: "text-danger", label: "Unreachable" },
  checking: { dot: "bg-ink-subtle", text: "text-ink-subtle", label: "Checking" },
};

export function StatusBoard() {
  const [status, setStatus] = useState<PingResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [live, setLive] = useState(true);

  // The client is stateless but constructing one per render would rebuild the
  // axios instance on every tick.
  const core = useRef(new CoreService());

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const response = await core.current.ping();
      setStatus(response);
      setFailed(false);
    } catch {
      // A failed request is itself the answer: the control plane is the thing
      // that answers /ping, so not answering means it is down, not that the
      // page is broken.
      setStatus(null);
      setFailed(true);
    } finally {
      setChecking(false);
      setCheckedAt(new Date());
    }
  }, []);

  useEffect(() => {
    void check();
    if (!live) return;
    const timer = setInterval(() => void check(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [check, live]);

  const overall: Health = failed
    ? "down"
    : status
      ? classify(status.api)
      : "checking";

  return (
    <div className="mt-12 pb-16">
      {/* Headline state */}
      <div className="flex flex-col gap-5 rounded-t-lg border border-edge bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <StatusDot health={overall} />
          <div>
            <p className="font-display text-xl font-medium tracking-[-0.02em] text-ink">
              {overall === "ok"
                ? "Everything is running"
                : overall === "degraded"
                  ? "Running, with a degraded dependency"
                  : overall === "down"
                    ? "The control plane is not answering"
                    : "Checking"}
            </p>
            <p className="mt-0.5 font-mono text-xs text-ink-subtle">
              {checkedAt
                ? `Checked ${checkedAt.toLocaleTimeString()}${live ? ` · again in ${REFRESH_MS / 1000}s` : ""}`
                : "Checking…"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setLive((value) => !value)}
            aria-pressed={live}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-edge px-3 font-mono text-xs text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {live ? (
              <Pause className="size-3.5" aria-hidden="true" />
            ) : (
              <Play className="size-3.5" aria-hidden="true" />
            )}
            {live ? "Auto" : "Paused"}
          </button>
          <button
            type="button"
            onClick={() => void check()}
            disabled={checking}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-edge-strong px-3 font-mono text-xs text-ink transition-colors duration-[--duration-fast] hover:bg-raised disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <RefreshCw
              className={cn("size-3.5", checking && "animate-spin")}
              aria-hidden="true"
            />
            Check now
          </button>
        </div>
      </div>

      {/* Dependencies. One row each, so the states line up down one edge. */}
      <ul className="divide-y divide-edge rounded-b-lg border border-t-0 border-edge">
        {DEPENDENCIES.map((dependency) => {
          const raw = failed ? "unreachable" : status?.[dependency.key];
          const health = failed ? "down" : classify(raw);

          return (
            <li
              key={dependency.key}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {dependency.name}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {dependency.detail}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2.5 sm:justify-end">
                <StatusDot health={health} small />
                <span
                  className={cn("font-mono text-xs", TONE[health].text)}
                  // The raw value when it is an error, so a reader gets the
                  // cluster's own words rather than a category.
                  title={health === "down" && raw ? raw : undefined}
                >
                  {TONE[health].label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* The error strings in full. Truncating a Kubernetes error into a
          tooltip is exactly the wrong call on a page someone opened because
          something is broken. */}
      {status
        ? DEPENDENCIES.filter(
            (dependency) => classify(status[dependency.key]) === "down",
          ).map((dependency) => (
            <pre
              key={dependency.key}
              className="mt-4 overflow-x-auto rounded-md border border-danger/40 bg-canvas p-4 font-mono text-xs leading-relaxed text-danger"
            >
              {dependency.name}: {status[dependency.key]}
            </pre>
          ))
        : null}

      {failed ? (
        <p className="mt-4 rounded-md border border-danger/40 bg-canvas p-4 text-sm leading-relaxed text-ink-muted">
          The request to the control plane did not complete. That is usually the
          API being down rather than a problem with this page — a browser
          extension blocking the request, or no network, would look the same.
        </p>
      ) : null}
    </div>
  );
}

function StatusDot({ health, small }: { health: Health; small?: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0",
        small ? "size-2" : "size-2.5",
      )}
    >
      {/* The pulse is only for the good state. A ring expanding out of a red
          dot reads as an alarm animation and makes an outage feel louder than
          it needs to be on a page people refresh while waiting. */}
      {health === "ok" ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden"
        />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-full rounded-full",
          TONE[health].dot,
          health === "checking" && "animate-pulse",
        )}
      />
      <span className="sr-only">{TONE[health].label}</span>
    </span>
  );
}
