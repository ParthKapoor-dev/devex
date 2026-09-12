"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fenced code block.
 *
 * The HTML arrives already highlighted — `rehype-pretty-code` runs Shiki at
 * build time, so nothing but this copy button ships to the browser. The
 * language label comes from the `data-language` attribute that plugin sets.
 */
export function CodeBlock({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"pre">) {
  const preRef = React.useRef<HTMLPreElement>(null);
  const [copied, setCopied] = React.useState(false);

  const language = (props as Record<string, unknown>)["data-language"] as
    | string
    | undefined;

  const copy = React.useCallback(async () => {
    const text = preRef.current?.textContent;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard is unavailable over plain HTTP and in some embedded views.
      // Failing silently is better than a thrown promise; the code is still
      // selectable.
    }
  }, []);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <figure className="group relative my-6">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        {language && language !== "text" ? (
          <span className="label rounded-xs border border-edge bg-canvas/80 px-1.5 py-0.5 text-[10px] text-ink-subtle opacity-0 transition-opacity duration-[--duration-fast] group-hover:opacity-100 max-lg:opacity-100">
            {language}
          </span>
        ) : null}
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="rounded-sm border border-edge bg-canvas/80 p-1.5 text-ink-subtle opacity-0 transition-all duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-100"
        >
          {copied ? (
            <Check className="size-3.5 text-term-accent" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      <pre
        ref={preRef}
        className={cn(
          "overflow-x-auto rounded-md border border-edge bg-term-bg p-4 font-mono text-[13px] leading-relaxed",
          "[&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit",
          // rehype-pretty-code emits one span per line; give them room to breathe.
          "[&_[data-line]]:px-0",
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    </figure>
  );
}
