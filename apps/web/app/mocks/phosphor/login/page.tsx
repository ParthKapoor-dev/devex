import { Suspense } from "react";
import { CrtBackdrop } from "@/components/mocks/phosphor/crt-backdrop";
import { TerminalLogin } from "@/components/mocks/phosphor/terminal-login";

/** MOCK — direction C · Phosphor login: a terminal session on an amber CRT. */
export default function PhosphorLogin() {
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center px-4 pb-24 pt-24 sm:px-6">
      <CrtBackdrop className="fixed inset-0 -z-10" brightness={0.42}>
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_50%,color-mix(in_oklab,var(--color-canvas)_85%,transparent)_0%,transparent_100%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-canvas/90 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(140%_100%_at_50%_50%,transparent_50%,var(--color-canvas)_100%)]" />
      </CrtBackdrop>
      <Suspense fallback={null}>
        <TerminalLogin />
      </Suspense>
    </div>
  );
}
