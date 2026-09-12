"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/components/Auth/AuthShell";

export default function LoginSuccessPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
      title="Check your email"
      subtitle="We sent you a sign-in link. Open it on this device and you will land straight in your dashboard."
      footer={
        <>
          Nothing arrived?{" "}
          <Link
            href="/login"
            className="text-ink-muted underline underline-offset-4 transition-colors duration-[--duration-fast] hover:text-ink"
          >
            Send another
          </Link>
          .
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 rounded-md border border-edge bg-surface p-6 text-center">
        <MailCheck className="size-6 text-brand" aria-hidden="true" />
        <p className="text-sm text-ink-muted">
          The link is good for one use and expires shortly. You can close this
          tab.
        </p>
      </div>
    </AuthShell>
  );
}
