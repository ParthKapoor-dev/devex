"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Input } from "../ui/input";
import { IconButton } from "./chrome";
import { cn } from "@/lib/utils";

/**
 * Port forwarding.
 *
 * Maps a port and route inside the container to the public URL that reaches
 * it. The panel is deliberately one line of controls and one line of result —
 * this is a thing people use in passing while the terminal is the focus, so
 * it should not ask for a screenful.
 */
const URLConverter = ({
  className,
  isVisible,
  replId,
}: {
  className?: string;
  isVisible: boolean;
  replId: string;
}) => {
  const [port, setPort] = useState("5000");
  const [route, setRoute] = useState("/ping");
  const [copied, setCopied] = useState(false);

  const domainName =
    "https://" +
    (process.env.NEXT_PUBLIC_RUNNER_DOMAIN_NAME || "localhost:8081");

  const normalisedRoute = route.startsWith("/") ? route : `/${route}`;
  const convertedUrl = `${domainName}/${replId}/user-app/${port}${normalisedRoute}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(convertedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={cn(
        "h-full overflow-auto bg-term-bg",
        !isVisible && "hidden",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="label text-ink-subtle">Port</span>
            <Input
              type="text"
              inputMode="numeric"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="h-7 w-24 border-edge bg-canvas font-mono text-xs text-ink focus-visible:border-brand"
              placeholder="5000"
            />
          </label>

          <label className="flex min-w-48 flex-1 flex-col gap-1.5">
            <span className="label text-ink-subtle">Route</span>
            <Input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="h-7 border-edge bg-canvas font-mono text-xs text-ink focus-visible:border-brand"
              placeholder="/some/route"
            />
          </label>

          <span className="flex flex-col gap-1.5">
            <span className="label text-ink-subtle">In container</span>
            <code className="flex h-7 items-center rounded-xs border border-edge bg-canvas px-2 font-mono text-xs text-ink-muted">
              localhost:{port || "…"}
              {normalisedRoute}
            </code>
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="label text-ink-subtle">Public URL</span>
          <div className="flex items-center gap-1 rounded-xs border border-edge bg-canvas p-1 pl-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
              {convertedUrl}
            </code>
            <IconButton
              label={copied ? "Copied" : "Copy URL"}
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3.5 text-term-accent" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </IconButton>
            {/* An anchor, not a button inside an anchor — nesting the two is
                invalid markup and browsers recover from it inconsistently. */}
            <Link
              href={convertedUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in a new tab"
              title="Open in a new tab"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-xs text-ink-subtle transition-colors duration-[--duration-fast] hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
            >
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-xs text-ink-subtle">
          Anything listening on this port inside the container is reachable at
          the URL above. The process has to be bound to{" "}
          <code className="font-mono text-ink-muted">0.0.0.0</code>, not{" "}
          <code className="font-mono text-ink-muted">127.0.0.1</code>, or the
          request will not reach it.
        </p>
      </div>
    </div>
  );
};

export default URLConverter;
