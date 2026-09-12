"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the IDE.
 *
 * The sandbox is held to a different standard from the marketing site: it is
 * a tool someone keeps open all day, so it is dense, flat and quiet. Concretely
 * that means no gradients, no blur, no shadows and no rounded cards — surfaces
 * separate by a 1px edge and a step in lightness, the way an editor does.
 *
 * The accent is rationed harder here than anywhere else on the site. Amber
 * means exactly one thing in this view: *this is the thing you are currently
 * on*. The open file, the active panel, the focused tab. Everything else is
 * greyscale, so the eye lands on the accent without being asked to.
 */

/** Heights are fixed and shared so the panels line up on a common grid. */
export const CHROME = {
  topBar: "h-9",
  statusBar: "h-6",
  panelTab: "h-8",
} as const;

/* -------------------------------------------------------------------------- */

interface IconButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  /** Required. These are icon-only controls, so the name is the only label. */
  label: string;
  active?: boolean;
}

/**
 * An icon-only control in the chrome.
 *
 * `title` alone is not an accessible name — it is a tooltip. Screen readers
 * announced most of these as just "button", so `aria-label` is required by
 * the type and `title` rides along for sighted users.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, active, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        aria-pressed={active}
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-xs",
          "text-ink-subtle transition-colors duration-[--duration-fast]",
          "hover:bg-raised hover:text-ink",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
          "disabled:pointer-events-none disabled:opacity-40",
          active && "bg-raised text-ink",
          className,
        )}
        {...props}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */

interface PanelTabProps extends React.ComponentPropsWithoutRef<"button"> {
  active?: boolean;
  /** Renders a small amber dot — for an error or unread output. */
  attention?: boolean;
}

/**
 * A tab on the bottom panel.
 *
 * The active tab is marked by a 1px amber rule along its top edge rather than
 * by a filled background. A fill would put a large block of accent on screen
 * permanently, which is exactly the budget this palette does not have.
 */
export function PanelTab({
  active,
  attention,
  className,
  children,
  ...props
}: PanelTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        "label relative inline-flex h-full items-center gap-1.5 px-3",
        "border-t border-transparent",
        "transition-colors duration-[--duration-fast]",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
        active
          ? "border-t-brand bg-surface text-ink"
          : "text-ink-subtle hover:bg-raised/60 hover:text-ink-muted",
        className,
      )}
      {...props}
    >
      {children}
      {attention && (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-brand"
        />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */

type StatusTone = "ok" | "busy" | "off";

const TONE_DOT: Record<StatusTone, string> = {
  // Green is the shell's own convention for "up" and is not ours to rebrand.
  ok: "bg-term-accent",
  busy: "bg-warning",
  off: "bg-ink-subtle",
};

/**
 * One reading in the status bar: a state dot and its label.
 *
 * A dead connection is deliberately *grey*, not red. Red is for something
 * that went wrong; a terminal you have not opened yet is simply not running,
 * and painting that as an error trains people to ignore red.
 */
export function StatusItem({
  tone,
  label,
  value,
  title,
}: {
  tone?: StatusTone;
  label?: string;
  value: string;
  title?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      title={title}
    >
      {tone && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
        />
      )}
      {label && <span className="text-ink-subtle">{label}</span>}
      <span className="text-ink-muted">{value}</span>
    </span>
  );
}

/**
 * The bar along the bottom of the IDE.
 *
 * Cheap to render and the single strongest "this is a developer tool" signal
 * in the whole view — an editor without one reads as a demo.
 */
export function StatusBar({ children }: { children: React.ReactNode }) {
  return (
    <footer
      className={cn(
        CHROME.statusBar,
        "flex shrink-0 items-center gap-4 border-t border-edge bg-surface px-3",
        "font-mono text-[11px] leading-none select-none",
      )}
    >
      {children}
    </footer>
  );
}

/* -------------------------------------------------------------------------- */

/** A hairline divider between groups of controls in a bar. */
export function ChromeDivider() {
  return <span aria-hidden="true" className="h-4 w-px shrink-0 bg-edge" />;
}

/**
 * Shown in the editor pane when no file is open.
 *
 * Monochrome on purpose. This is the first thing a new user sees, and it is
 * an empty state, not an event — spending the accent here would leave nothing
 * to mark the file they actually open.
 */
export function EmptyEditorState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-term-bg">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-ink-subtle" aria-hidden="true">
          {icon}
        </div>
        <p className="font-mono text-sm text-ink-muted">{title}</p>
        <p className="max-w-xs text-xs text-ink-subtle">{hint}</p>
      </div>
    </div>
  );
}
