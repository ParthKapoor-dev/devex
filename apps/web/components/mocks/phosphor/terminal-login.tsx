"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import s from "./phosphor.module.css";

// MOCK — direction C login: a CLI session. Two real buttons in a roving
// tabindex group (arrows / 1 / 2 / Enter / click), then a real form for the
// magic link. Unlike the real page it never redirects signed-in users.

const ERROR_MESSAGES: Record<string, string> = {
  session_error: "Your session expired. Try signing in again.",
  invalid_state: "That sign-in link did not match this browser session. Start again from this page.",
  exchange_failed: "GitHub did not complete the handshake. Try again.",
  user_fetch_failed: "Signed in, but your GitHub profile could not be read.",
  session_save_failed: "Signed in, but the session could not be saved.",
};

const OPTIONS = [
  { key: "github", n: 1, name: "GitHub", note: "recommended · repo access, push, CI" },
  { key: "magic", n: 2, name: "Magic link", note: "email only · no GitHub access" },
] as const;

type Choice = (typeof OPTIONS)[number]["key"];

export function TerminalLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const error = useSearchParams().get("error");

  const [cursor, setCursor] = useState(0);
  const [chosen, setChosen] = useState<Choice | null>(null);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "github" | "sending">("idle");
  const [failure, setFailure] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const questionId = useId();
  const panelId = useId();
  const emailId = useId();
  const consentId = useId();
  const warnId = useId();

  // Land focus on the menu, the way a CLI prompt owns the keyboard.
  useEffect(() => {
    optionRefs.current[0]?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (chosen === "magic") emailRef.current?.focus();
  }, [chosen]);

  const choose = (key: Choice) => {
    setFailure(null);
    if (key === "github") {
      setChosen("github");
      setStatus("github");
      login(
        "github",
        (err) => {
          setStatus("idle");
          setFailure(err);
          toast.error(err);
        },
        () => {},
      );
    } else {
      setChosen((c) => (c === "magic" ? null : "magic"));
    }
  };

  const back = () => {
    setChosen(null);
    setStatus("idle");
    setFailure(null);
    requestAnimationFrame(() => optionRefs.current[1]?.focus());
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const move = (i: number) => {
      const next = (i + OPTIONS.length) % OPTIONS.length;
      setCursor(next);
      optionRefs.current[next]?.focus();
    };
    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      move(cursor + 1);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      move(cursor - 1);
    } else if (e.key === "1" || e.key === "2") {
      e.preventDefault();
      const i = Number(e.key) - 1;
      move(i);
      choose(OPTIONS[i].key);
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSend = emailValid && consent && status === "idle";

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) return emailRef.current?.focus();
    if (!consent) return consentRef.current?.focus();
    if (status !== "idle") return;
    setFailure(null);
    setStatus("sending");
    await login(
      "magiclink",
      (err) => {
        setFailure(err);
        toast.error(err);
      },
      () => {
        toast.success(`Magic link sent to ${email}`);
        router.push("/login/success");
      },
      email,
    );
    setStatus("idle");
  };

  return (
    <div className={cn(s.boot, s.window, "w-full max-w-[44rem] overflow-hidden rounded-lg bg-term-bg/88 backdrop-blur-md")}>
      {/* Title bar — no traffic lights, just the tty. */}
      <div className="relative flex h-9 items-center justify-center border-b border-brand/15 bg-term-chrome/90 px-4">
        <span className="absolute left-4 hidden font-mono text-[10px] text-ink-subtle sm:block" aria-hidden="true">
          ⌘1
        </span>
        <h1 className="truncate font-mono text-xs text-ink-muted">
          devex — login — <span aria-hidden="true">80×24</span>
          <span className="sr-only">Sign in to DevEx</span>
        </h1>
        <span className="absolute right-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-subtle" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-term-accent shadow-[0_0_6px_var(--color-term-accent)]" />
          <span className="hidden sm:inline">tty</span>
        </span>
      </div>

      <div className="relative px-4 py-5 font-mono text-[13px] leading-[1.75] text-term-ink sm:px-7 sm:py-7 sm:text-sm">
        <div aria-hidden="true" className={cn(s.scanlines, "pointer-events-none absolute inset-0 opacity-30")} />

        <div className="relative">
          <p className="text-term-muted" aria-hidden="true">
            devex · a real machine, one tab away
          </p>
          <p className="mb-4 text-term-muted" aria-hidden="true">
            Last login: never on this browser
          </p>

          {error && (
            <p role="alert" className="mb-3 text-danger">
              <span aria-hidden="true">✗ </span>
              {error}: {ERROR_MESSAGES[error] ?? "Something went wrong signing in. Try again."}
            </p>
          )}

          <p>
            <span className="text-term-accent" aria-hidden="true">guest@devex</span>
            <span className="text-term-muted" aria-hidden="true"> ~ </span>
            <span className={cn(s.glowSoft, "text-brand")} aria-hidden="true">$ </span>
            devex login
          </p>
          <p id={questionId} className="mt-1">
            <span className="text-brand" aria-hidden="true">? </span>
            <span className="font-medium">How do you want to sign in?</span>
            <span className="ml-2 hidden text-term-muted sm:inline" aria-hidden="true">
              (↑↓, 1 2, ↵)
            </span>
          </p>

          <div role="group" aria-labelledby={questionId} className="mt-1.5 flex flex-col" onKeyDown={onMenuKey}>
            {OPTIONS.map((o, i) => {
              const active = cursor === i;
              const picked = chosen === o.key;
              return (
                <button
                  key={o.key}
                  ref={(el) => {
                    optionRefs.current[i] = el;
                  }}
                  type="button"
                  tabIndex={active ? 0 : -1}
                  disabled={status === "github" || status === "sending"}
                  aria-expanded={o.key === "magic" ? chosen === "magic" : undefined}
                  aria-controls={o.key === "magic" ? panelId : undefined}
                  onFocus={() => setCursor(i)}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => {
                    setCursor(i);
                    choose(o.key);
                  }}
                  className={cn(
                    "group -mx-2 grid grid-cols-[1.25rem_auto_1fr] items-baseline gap-x-2 rounded-xs px-2 py-1.5 text-left sm:grid-cols-[1.25rem_2rem_7.5rem_1fr] sm:py-1",
                    "transition-colors duration-[--duration-fast] disabled:cursor-wait",
                    // The row highlight + ❯ is the focus indicator; an outline on top was noise.
                    "focus-visible:outline-none focus-visible:shadow-[inset_2px_0_0_var(--color-brand)]",
                    active ? "bg-brand/10" : "hover:bg-white/[0.03]",
                  )}
                >
                  <span aria-hidden="true" className={cn("text-brand", s.glowSoft, active ? "opacity-100" : "opacity-0")}>
                    ❯
                  </span>
                  <span aria-hidden="true" className={cn(active ? "text-brand" : "text-term-muted")}>
                    [{o.n}]
                  </span>
                  <span className={cn("font-medium", active ? cn(s.glowSoft, "text-brand-100") : "text-term-ink", picked && "underline decoration-brand/50 underline-offset-4")}>
                    {o.name}
                  </span>
                  <span
                    className={cn(
                      "col-start-3 text-xs text-term-muted sm:col-start-auto sm:text-[13px]",
                      o.key === "github" && active && "text-brand-300/80",
                    )}
                  >
                    <span className="sr-only"> — </span>
                    {o.note}
                  </span>
                </button>
              );
            })}
          </div>

          {/* GitHub: what happens next. */}
          {status === "github" && (
            <p role="status" className="mt-4 text-term-muted">
              <span className="text-brand">→</span> opening github.com to authorize devex
              <span aria-hidden="true" className="terminal-caret">…</span>
            </p>
          )}

          {/* Magic link: rendered only when chosen, so it is never in the tab order unseen. */}
          {chosen === "magic" && (
            <form
              id={panelId}
              onSubmit={send}
              noValidate
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  back();
                }
              }}
              className="mt-4 animate-fade-in border-l border-brand/25 pl-3 sm:pl-4"
            >
              <p id={warnId} className="text-warning">
                <span aria-hidden="true">! </span>
                <span className="font-medium">Fewer features.</span>{" "}
                <span className="text-term-ink/80">
                  A magic-link account cannot reach your GitHub repositories, so cloning, pushing and CI are unavailable.
                </span>
              </p>

              <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <label htmlFor={emailId} className="shrink-0 text-brand">
                  email <span aria-hidden="true">›</span>
                </label>
                <input
                  ref={emailRef}
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter on a valid address walks to the next prompt.
                    if (e.key === "Enter" && emailValid && !consent) {
                      e.preventDefault();
                      consentRef.current?.focus();
                    }
                  }}
                  aria-invalid={touched && !emailValid}
                  aria-describedby={warnId}
                  className={cn(
                    s.shellInput,
                    "min-w-0 flex-1 border-b border-dashed border-term-muted/40 bg-transparent py-0.5 text-term-ink outline-none placeholder:text-term-muted/60",
                    "focus-visible:border-solid focus-visible:border-brand focus-visible:outline-none",
                  )}
                />
              </div>
              {touched && !emailValid && (
                <p className="text-danger" role="alert">
                  <span aria-hidden="true">✗ </span>that doesn&apos;t look like an email address
                </p>
              )}

              <div className="mt-2.5">
                <input
                  ref={consentRef}
                  id={consentId}
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  onKeyDown={(e) => {
                    const k = e.key.toLowerCase();
                    if (k === "y" || k === "n") {
                      e.preventDefault();
                      setConsent(k === "y");
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      if (!consent) setConsent(true);
                      else e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  className="peer sr-only"
                />
                <label
                  htmlFor={consentId}
                  className="flex cursor-pointer flex-wrap items-baseline gap-x-2 rounded-xs peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
                >
                  <span>
                    <span className="text-brand" aria-hidden="true">? </span>
                    I understand this account will not have GitHub access
                  </span>
                  <span aria-hidden="true" className="text-term-muted">
                    [
                    <span className={cn(consent ? cn(s.glowSoft, "font-semibold text-brand") : "text-term-muted")}>y</span>
                    /
                    <span className={cn(!consent ? "font-semibold text-term-ink" : "text-term-muted")}>N</span>]
                  </span>
                  <span aria-hidden="true" className={consent ? "text-term-accent" : "text-term-muted"}>
                    {consent ? "yes" : "no"}
                  </span>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="submit"
                  aria-disabled={!canSend}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-xs px-3 transition-colors duration-[--duration-fast] focus-visible:outline-offset-2",
                    canSend
                      ? "bg-brand font-medium text-brand-fg hover:bg-brand-400"
                      : "border border-dashed border-term-muted/40 text-term-muted",
                    status === "sending" && "cursor-wait",
                  )}
                >
                  <span aria-hidden="true">↵</span>
                  {status === "sending" ? "sending link…" : "send link"}
                </button>
                <button
                  type="button"
                  onClick={back}
                  className="rounded-xs px-1 text-xs text-term-muted transition-colors hover:text-term-ink"
                >
                  <kbd className="mr-1 rounded-xs border border-term-muted/40 px-1 text-[10px]">esc</kbd>
                  back
                </button>
              </div>

              {status === "sending" && (
                <p role="status" className="mt-3 text-term-muted">
                  <span className="text-brand">→</span> sending a sign-in link to {email}
                  <span aria-hidden="true" className="terminal-caret">…</span>
                </p>
              )}
            </form>
          )}

          {failure && (
            <p role="alert" className="mt-3 break-words text-danger">
              <span aria-hidden="true">✗ </span>error: {failure}
            </p>
          )}

          {chosen !== "magic" && status === "idle" && (
            <p className="mt-4" aria-hidden="true">
              <span className="text-brand">$ </span>
              <span className="terminal-caret inline-block h-[1.1em] w-[0.6em] translate-y-[0.2em] bg-brand/90" />
            </p>
          )}
        </div>
      </div>

      {/* tmux-ish status line */}
      <div className="flex items-center justify-between gap-3 border-t border-brand/15 bg-term-chrome/90 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-term-muted sm:text-[11px]">
        <span className="flex items-center gap-2">
          <span className="bg-brand px-1.5 text-brand-fg">0:login*</span>
          <span className="hidden sm:inline" aria-hidden="true">
            ↑↓ select · 1 2 jump · ↵ confirm{chosen === "magic" ? " · esc back" : ""}
          </span>
          <span className="sm:hidden" aria-hidden="true">tap to choose</span>
        </span>
        <span className="truncate normal-case tracking-normal">
          <Link href="/privacy" className="underline decoration-term-muted/40 underline-offset-2 hover:text-term-ink">
            privacy policy
          </Link>
        </span>
      </div>
    </div>
  );
}
