"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useActiveInView } from "@/hooks/use-active-in-view";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import s from "./phosphor.module.css";

// MOCK — the amber CRT behind the Phosphor hero and login.

const CrtShader = dynamic(() => import("./crt-shader"), { ssr: false });

/** Hoisted: an array literal would rebuild the GL context every render. */
const GRID: [number, number] = [2, 1];

export function CrtBackdrop({
  className,
  brightness = 0.45,
  /** Extra masking layers (gradients) laid over the shader. */
  children,
}: {
  className?: string;
  brightness?: number;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const active = useActiveInView(ref);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none overflow-hidden bg-canvas", className)}
    >
      <div className="absolute inset-0 animate-fade-in [animation-duration:1.2s]">
        <CrtShader
          scale={1.5}
          gridMul={GRID}
          digitSize={1.25}
          timeScale={0.45}
          pause={reduced || !active}
          scanlineIntensity={0.6}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.12}
          tint={token.brand500}
          mouseReact={!reduced}
          mouseStrength={0.35}
          pageLoadAnimation={!reduced}
          brightness={brightness}
        />
      </div>
      <div className={cn("absolute inset-0 opacity-60", s.scanlines)} />
      <div className={s.rollbar} />
      {children}
    </div>
  );
}
