"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { LoginShell } from "@/components/Auth/LoginShell";
import { LoginButton } from "@/components/Auth/LoginButton";

const ERROR_MESSAGES: Record<string, string> = {
  session_error: "Your session expired. Try signing in again.",
  invalid_state:
    "That sign-in link did not match this browser session. Start again from this page.",
  exchange_failed: "GitHub did not complete the handshake. Try again.",
  user_fetch_failed: "Signed in, but your GitHub profile could not be read.",
  session_save_failed: "Signed in, but the session could not be saved.",
};

const getErrorMessage = (errorCode: string) =>
  ERROR_MESSAGES[errorCode] ?? "Something went wrong signing in. Try again.";

function LoginPageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) toast.error(getErrorMessage(error));
  }, [error]);

  // The form renders immediately; a signed-in visitor is moved on as soon as
  // the session check answers. Blocking the whole page on that request made
  // the login screen the slowest page on the site whenever the API was slow.
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  return (
    <LoginShell
      eyebrow={
        <>
          <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
          Free plan · no card
        </>
      }
      title="Sign in"
      subtitle="Start a containerised dev environment in your browser."
      footer={
        <>
          By continuing you agree to the Terms of Service and{" "}
          <Link
            href="/privacy"
            className="underline decoration-edge-strong underline-offset-2 transition-colors duration-[--duration-fast] hover:text-ink"
          >
            Privacy Policy
          </Link>
          .
        </>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/8 p-3"
        >
          <AlertCircle className="mt-px size-4 shrink-0 text-danger" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-ink-muted">{getErrorMessage(error)}</p>
        </div>
      )}

      <LoginButton />
    </LoginShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <LoginPageContent />
    </Suspense>
  );
}
