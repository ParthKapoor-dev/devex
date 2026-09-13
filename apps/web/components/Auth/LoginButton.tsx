"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Github, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LoginButton() {
  const { login } = useAuth();
  // Its own flag, not the context's `isLoading`: that one means "the session
  // check is still in flight", and tying the button to it made "Continue with
  // GitHub" read "Connecting…" before anyone had clicked anything.
  const [githubLoading, setGithubLoading] = useState(false);

  // Coming back from GitHub restores this page from the bfcache with the
  // spinner still showing; clear it.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && setGithubLoading(false);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  const inputRef: Ref<HTMLInputElement> | undefined = useRef(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkConsent, setMagicLinkConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const router = useRouter();

  const panelId = useId();
  const consentId = useId();

  function handleLoginError(err: string) {
    toast.error(err);
  }

  function handleLoginSuccess(email: string) {
    toast.success(`Magic link sent to ${email}`);
    router.push("/login/success");
  }

  const handleMagicLinkLogin = async () => {
    if (email && magicLinkConsent) {
      setMagicLoading(true);
      await login(
        "magiclink",
        handleLoginError,
        () => handleLoginSuccess(email),
        email,
      );
      setMagicLoading(false);
    }
  };

  const magicLinkDisabled =
    !email || !magicLinkConsent || magicLoading;

  return (
    <div className="flex w-full flex-col gap-5">
      {/* GitHub — the primary path, and the only place the accent appears. */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setGithubLoading(true);
            // On success the browser navigates away, so only an error resets it.
            login(
              "github",
              (err) => {
                setGithubLoading(false);
                handleLoginError(err);
              },
              () => {},
            );
          }}
          disabled={githubLoading}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2.5 rounded-md px-4 py-2.5",
            "bg-brand text-sm font-medium text-brand-fg",
            "transition-colors duration-[--duration-fast] hover:bg-brand-400",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          {githubLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Github className="size-4" aria-hidden="true" />
          )}
          {githubLoading ? "Connecting…" : "Continue with GitHub"}
        </button>
        <p className="text-center text-xs text-ink-subtle">
          Required for repository access and CI features.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-edge" />
        <span className="label text-ink-subtle">or</span>
        <span className="h-px flex-1 bg-edge" />
      </div>

      {/* Magic link — secondary, and folded away until asked for. */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowMagicLink((open) => !open)}
          aria-expanded={showMagicLink}
          aria-controls={panelId}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5",
            "border border-edge bg-surface text-sm text-ink-muted",
            "transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          )}
        >
          <Mail className="size-4" aria-hidden="true" />
          Email me a magic link
        </button>

        {/*
          Conditionally rendered rather than collapsed with `max-h-0`.
          A zero-height overflow-hidden panel keeps its inputs in the
          accessibility tree and in the tab order, so keyboard users used to
          land inside a form they could not see.
        */}
        {showMagicLink && (
          <div
            id={panelId}
            className="flex animate-fade-in flex-col gap-4 rounded-md border border-edge bg-surface p-4"
          >
            <div className="flex items-start gap-2.5 rounded-sm border border-warning/25 bg-warning/8 p-3">
              <AlertTriangle
                className="mt-px size-4 shrink-0 text-warning"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-ink-muted">
                <span className="font-medium text-ink">Fewer features.</span>{" "}
                A magic-link account cannot reach your GitHub repositories, so
                cloning, pushing and CI are unavailable.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="magic-link-email"
                className="label text-ink-subtle"
              >
                Email address
              </label>
              <Input
                id="magic-link-email"
                ref={inputRef}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-edge bg-canvas font-mono text-sm text-ink placeholder:text-ink-subtle focus-visible:border-brand"
              />
            </div>

            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id={consentId}
                checked={magicLinkConsent}
                onChange={(e) => setMagicLinkConsent(e.target.checked)}
                className="mt-0.5 size-3.5 shrink-0 accent-[var(--color-brand)]"
              />
              <label
                htmlFor={consentId}
                className="cursor-pointer text-xs leading-relaxed text-ink-muted"
              >
                I understand this account will not have GitHub access.
              </label>
            </div>

            <button
              type="button"
              onClick={handleMagicLinkLogin}
              disabled={magicLinkDisabled}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5",
                "border border-edge text-sm font-medium",
                "transition-colors duration-[--duration-fast]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                magicLinkDisabled
                  ? "cursor-not-allowed bg-raised text-ink-subtle"
                  : "bg-raised text-ink hover:border-edge-strong",
              )}
            >
              {magicLoading && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {magicLoading ? "Sending…" : "Send magic link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
