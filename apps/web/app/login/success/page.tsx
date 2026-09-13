"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginShell } from "@/components/Auth/LoginShell";

export default function LoginSuccessPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  return (
    <LoginShell
      eyebrow={
        <>
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          Link sent
        </>
      }
      title="Check your email"
      subtitle="We sent you a sign-in link. Open it on this device and you will land straight in your dashboard."
      footer={
        <>
          Nothing arrived? Check spam, or{" "}
          <Link
            href="/login"
            className="underline decoration-edge-strong underline-offset-2 transition-colors duration-[--duration-fast] hover:text-ink"
          >
            send another
          </Link>
          .
        </>
      }
    >
      <div className="flex items-start gap-4 rounded-md border border-edge bg-surface p-5">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-ink-muted">
          The link works once and expires after 15 minutes. You can close this
          tab.
        </p>
      </div>
    </LoginShell>
  );
}
