"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    // This is the first thing anyone sees on the dashboard and the sandbox.
    // It was a 128px ring with a `border-gray-900` edge — near-black, spinning
    // on a near-black page, so on this theme it rendered as nothing at all
    // while the session was being checked.
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="label animate-pulse text-ink-subtle">
          Checking your session
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useProtectedRoute will handle redirect
  }

  return <>{children}</>;
}
