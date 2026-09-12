"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/components/Auth/AuthShell";
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
    if (error) {
      toast.error(getErrorMessage(error));
    }
  }, [error]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="label text-ink-subtle">Checking session</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Spin up a containerised dev environment in your browser."
      footer="By continuing you agree to the Terms of Service and Privacy Policy."
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/8 p-3"
        >
          <AlertCircle
            className="mt-px size-4 shrink-0 text-danger"
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed text-ink-muted">
            {getErrorMessage(error)}
          </p>
        </div>
      )}

      <LoginButton />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginPageContent />
    </Suspense>
  );
}
