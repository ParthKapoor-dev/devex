"use client";

import dynamic from "next/dynamic";
import type { WavesProps } from "@/components/mocks/waves";
import { cn } from "@/lib/utils";

// MOCK — the canvas only exists on the client; no SSR pass for it.
const Waves = dynamic(() => import("@/components/mocks/waves"), { ssr: false });

/** Amber wave field, masked so it dissolves into the canvas at the edges. */
export function WaveField({
  className,
  mask = "linear-gradient(to bottom, transparent 0%, black 22%, black 70%, transparent 100%)",
  ...props
}: WavesProps & { mask?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <Waves
        lineColor="rgba(254, 154, 0, 0.34)"
        waveSpeedX={0.0105}
        waveSpeedY={0.004}
        waveAmpX={38}
        waveAmpY={18}
        xGap={12}
        yGap={36}
        {...props}
      />
    </div>
  );
}
