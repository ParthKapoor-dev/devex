"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Editor settings.
 *
 * This was one of the panels that never made it onto the design system in the
 * first pass, and it showed: a `border-dashed border-2 border-zinc-400` frame
 * — a *light* grey dashed box inside a dark IDE — `focus:ring-emerald-500` on
 * both selects, `bg-zinc-700` / `border-zinc-600` / `hover:bg-zinc-600` on the
 * controls, and a range slider whose thumb was `#10b981` with a green glow,
 * all from the brand before last.
 *
 * Three things were wrong beyond the colours:
 *
 * - **The footer had two buttons that did the same thing.** `$ apply --changes`
 *   and a red `destructive` "Close" both called `handleClose`. Every setting
 *   here applies the moment it changes, so "apply" was describing work that
 *   had already happened, and dismissing a settings sheet is not destructive.
 * - **The Escape handler re-subscribed on every render.** `handleKeyDown` was
 *   redeclared in the component body and listed as the effect's dependency.
 * - `languages` was passed in, destructured, and never used.
 *
 * The shape is flatter now, to match the rest of the IDE: rows of label and
 * control separated by hairlines, no cards inside cards.
 */

interface Theme {
  value: string;
  label: string;
}

interface SettingsPopupProps {
  isFullScreen: boolean;
  language: string;
  theme: string;
  fontSize: number;
  wordWrap: "off" | "on" | "wordWrapColumn";
  minimap: boolean;

  themes: Theme[];

  onThemeChange: (theme: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onWordWrapChange: (wordWrap: "off" | "on" | "wordWrapColumn") => void;
  onMinimapChange: (minimap: boolean) => void;
  onClose: () => void;
  onFileDownload: () => void;
  onFullScreenMode: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const EXIT_MS = 150;

const SELECT_CLASS = cn(
  // `w-36`, not `min-w-36`. A minimum is a floor the flex row cannot get under,
  // so on a narrow viewport the select pushed the dialog wider than itself.
  "h-7 w-36 min-w-0 rounded-sm border border-edge bg-canvas px-2",
  "font-mono text-xs text-ink",
  "transition-colors duration-[--duration-fast]",
  "focus:border-brand focus:outline-none",
);

export default function EditorSettingsPopup({
  language,
  isFullScreen,
  theme,
  fontSize,
  wordWrap,
  minimap,
  themes,
  onThemeChange,
  onFontSizeChange,
  onWordWrapChange,
  onMinimapChange,
  onClose,
  onUpload,
  onFileDownload,
  onFullScreenMode,
}: SettingsPopupProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [busy, setBusy] = useState<"download" | "upload" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setIsMounted(true), []);

  const handleClose = useCallback(() => {
    setIsMounted(false);
    window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  // One subscription for the life of the panel. The previous version listed a
  // handler that was recreated on every render as its dependency, so this
  // listener was torn down and re-added on every keystroke of the font slider.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const handleFontSizeChange = (value: number) => {
    setLocalFontSize(value);
    onFontSizeChange(value);
  };

  const handleDownload = async () => {
    try {
      setBusy("download");
      await onFileDownload();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setBusy(null);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      setBusy("upload");
      await onUpload(event);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setBusy(null);
      // Reset so the same file can be picked again.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close settings"
        onClick={handleClose}
        className={cn(
          "absolute inset-0 cursor-default transition-colors duration-[--duration-normal]",
          isMounted ? "bg-canvas/70 backdrop-blur-sm" : "bg-transparent",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Editor settings"
        className={cn(
          "relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden",
          "rounded-lg border border-edge bg-surface",
          "shadow-[0_24px_64px_-24px_rgb(0_0_0/0.9)]",
          "transition-[opacity,transform] duration-[--duration-normal] ease-[--ease-out-circ]",
          isMounted ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-edge px-3 py-2">
          <span className="label text-ink">Editor</span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close settings"
            className="ml-auto rounded-sm p-1 text-ink-subtle transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Row label="Theme">
            <select
              aria-label="Editor theme"
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              className={SELECT_CLASS}
            >
              {themes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Word wrap">
            <select
              aria-label="Word wrap"
              value={wordWrap}
              onChange={(e) =>
                onWordWrapChange(
                  e.target.value as "off" | "on" | "wordWrapColumn",
                )
              }
              className={SELECT_CLASS}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
              <option value="wordWrapColumn">At column</option>
            </select>
          </Row>

          <Row label="Font size" value={`${localFontSize}px`}>
            {/* `min-w-0` on both the track and the range itself. A flex item's
                automatic minimum size is its *intrinsic* width, and for a
                replaced control like `input[type=range]` that is ~130px in
                Chrome — so `flex-1` could not shrink it, the row overflowed
                its `w-36`, and the panel grew a horizontal scrollbar. */}
            <div className="flex w-36 min-w-0 items-center gap-2">
              <span className="font-mono text-[10px] text-ink-subtle">10</span>
              <input
                type="range"
                aria-label="Font size"
                min={10}
                max={24}
                value={localFontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                // `accent-color` gets the native thumb and fill in one
                // property, which replaces the styled-jsx block that was
                // painting the thumb `#10b981` with a green glow.
                className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-edge-strong accent-[var(--color-brand)]"
              />
              <span className="font-mono text-[10px] text-ink-subtle">24</span>
            </div>
          </Row>

          <Row label="Minimap">
            <Toggle
              checked={minimap}
              onChange={onMinimapChange}
              label="Minimap"
            />
          </Row>

          <Row label="Full screen">
            <Toggle
              checked={isFullScreen}
              onChange={() => onFullScreenMode()}
              label="Full screen"
            />
          </Row>

          <Row label="File">
            <div className="flex gap-2">
              <SmallButton
                onClick={handleDownload}
                disabled={busy !== null}
                icon={Download}
              >
                {busy === "download" ? "Saving" : "Download"}
              </SmallButton>
              <SmallButton
                onClick={() => fileInputRef.current?.click()}
                disabled={busy !== null}
                icon={Upload}
              >
                {busy === "upload" ? "Sending" : "Upload"}
              </SmallButton>
            </div>
          </Row>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload file"
          />

          {/* What the editor is currently configured to do, in the voice the
              rest of the IDE uses. */}
          <dl className="space-y-1.5 border-t border-edge px-4 py-4 font-mono text-xs">
            {[
              ["language", language],
              ["theme", themes.find((t) => t.value === theme)?.label ?? theme],
              ["fontSize", `${localFontSize}px`],
              ["wordWrap", wordWrap],
              ["minimap", minimap ? "on" : "off"],
              ["fullscreen", isFullScreen ? "on" : "off"],
            ].map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <dt className="shrink-0 text-ink-subtle">{key}</dt>
                <dd className="min-w-0 truncate text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* One button. Everything here applies the moment it changes, so the
            footer's "$ apply --changes" was describing work already done, and
            its red sibling made dismissing look destructive. */}
        <footer className="shrink-0 border-t border-edge p-3">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-8 w-full items-center justify-center rounded-md border border-edge text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-edge px-4 py-3">
      <span className="min-w-0 text-sm text-ink">
        {label}
        {value ? (
          <span className="ml-2 font-mono text-xs text-ink-subtle">
            {value}
          </span>
        ) : null}
      </span>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-[--duration-fast]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        checked ? "border-brand bg-brand" : "border-edge bg-canvas",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full",
          "transition-[left,background-color] duration-[--duration-fast] ease-[--ease-out-circ]",
          checked ? "left-[18px] bg-brand-fg" : "left-0.5 bg-ink-subtle",
        )}
      />
    </button>
  );
}

function SmallButton({
  onClick,
  disabled,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-sm border border-edge px-2.5",
        "text-xs text-ink-muted transition-colors duration-[--duration-fast]",
        "hover:border-edge-strong hover:bg-raised hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      <Icon className="size-3" />
      {children}
    </button>
  );
}
