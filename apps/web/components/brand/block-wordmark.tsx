"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { cn } from "@/lib/utils";

/**
 * The DevEx wordmark, built from tilting 3D blocks.
 *
 * Not used on any page yet — kept deliberately, at the maintainer's request,
 * from the landing-page design review (direction "Blocks"). It started as a
 * port of React Bits "Cubes" (https://reactbits.dev, MIT + Commons Clause),
 * rewritten without gsap:
 *
 * - the word is a 5×7 bitmap font and only lit cells get a block;
 * - faces are shaded (top lighter, sides darker) so a tilted block reads solid;
 * - each block's tilt drives a CSS var that warms it toward amber, so the
 *   cursor leaves a trail through the word;
 * - one spring-driven rAF loop for every block, paused off-screen;
 * - blocks drop in column by column on mount; click sends a ripple.
 *
 * It is ~80 blocks × 6 faces of DOM. Fine for one hero, not for a list.
 */

const GLYPHS: Record<string, string[]> = {
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  " ": ["0", "0", "0", "0", "0", "0", "0"],
};

export function bitmap(word: string) {
  const rows = Array.from({ length: 7 }, () => "");
  [...word.toUpperCase()].forEach((ch, i) => {
    const g = GLYPHS[ch] ?? GLYPHS[" "];
    for (let r = 0; r < 7; r++) rows[r] += (i ? "0" : "") + g[r];
  });
  return rows;
}

/** Top, bottom, left, right, front. The back face is never visible. */
const FACES = [
  { t: "translateY(-50%) rotateX(90deg)", k: "top" },
  { t: "translateY(50%) rotateX(-90deg)", k: "bottom" },
  { t: "translateX(-50%) rotateY(-90deg)", k: "side" },
  { t: "translateX(50%) rotateY(90deg)", k: "side" },
  { t: "rotateY(-90deg) translateX(50%) rotateY(90deg)", k: "front" },
] as const;

const CSS = `
.bw-cell{animation:bw-drop 700ms var(--ease-out-expo) both;animation-delay:var(--d)}
@keyframes bw-drop{from{opacity:0;transform:translateY(-45%) scale(.7)}to{opacity:1;transform:none}}
.bw-face{position:absolute;inset:0;
  border:1px solid color-mix(in oklab,var(--color-brand-400) calc(38% + var(--h,0)*55%),transparent);
  transition:background-color 350ms var(--ease-out-quad)}
.bw-front{
  box-shadow:inset 0 1px 0 rgb(255 255 255/.12),inset 0 -6px 14px -6px rgb(0 0 0/.55);
  background:
  linear-gradient(150deg,rgb(255 255 255/.14),transparent 60%),
  color-mix(in oklab,var(--color-brand) calc(var(--h,0)*92%),color-mix(in oklab,var(--color-brand-800) 38%,oklch(0.3 0 0)))}
.bw-top{background:color-mix(in oklab,var(--color-brand-300) calc(30% + var(--h,0)*65%),oklch(0.42 0 0))}
.bw-side{background:color-mix(in oklab,var(--color-brand-700) calc(12% + var(--h,0)*55%),var(--color-canvas))}
.bw-bottom{background:color-mix(in oklab,var(--color-brand-900) calc(var(--h,0)*50%),var(--color-canvas))}
[data-lit] .bw-face{background:var(--color-brand-400);transition-duration:60ms}
[data-lit] .bw-front{background:var(--color-brand)}
@media (prefers-reduced-motion: reduce){.bw-cell{animation:none}}
`;

export function BlockWordmark({
  word = "DEVEX",
  maxAngle = 52,
  radius = 3.4,
  className,
  showGrid = true,
  readoutRef,
  entranceDelay = 150,
}: {
  word?: string;
  maxAngle?: number;
  radius?: number;
  className?: string;
  showGrid?: boolean;
  /** Receives "c07 · r03"-style cursor coordinates. */
  readoutRef?: RefObject<HTMLElement | null>;
  entranceDelay?: number;
}) {
  const rows = useMemo(() => bitmap(word), [word]);
  const cols = rows[0].length;
  const sceneRef = useRef<HTMLDivElement>(null);
  const delayOf = (r: number, c: number) => entranceDelay + c * 32 + r * 18;

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    const cubes = Array.from(scene.querySelectorAll<HTMLElement>("[data-cube]")).map((el) => {
      const r = +el.dataset.row!;
      const c = +el.dataset.col!;
      if (reduced) el.style.transform = "none";
      return {
        el,
        r,
        c,
        // Entrance: start rolled back, released once the drop lands.
        start: reduced ? 0 : t0 + delayOf(r, c) + 220,
        rx: reduced ? 0 : -90,
        ry: 0,
        vx: 0,
        vy: 0,
        h: 0,
      };
    });

    const pointer = { r: -99, c: -99, active: false, idleAt: 0 };
    const sim = { r: 3, c: -2, tr: 3, tc: cols + 1 };

    const write = (text: string) => {
      if (readoutRef?.current) readoutRef.current.textContent = text;
    };

    const onMove = (e: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      pointer.c = ((e.clientX - rect.left) / rect.width) * cols;
      pointer.r = ((e.clientY - rect.top) / rect.height) * 7;
      pointer.active = true;
      pointer.idleAt = performance.now() + 2500;
      const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
      write(`c${pad(pointer.c)} · r${pad(pointer.r)}`);
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.r = pointer.c = -99;
      write("c-- · r--");
    };
    const onClick = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const hc = Math.floor(((e.clientX - rect.left) / rect.width) * cols);
      const hr = Math.floor(((e.clientY - rect.top) / rect.height) * 7);
      for (const cube of cubes) {
        const ring = Math.hypot(cube.r - hr, cube.c - hc);
        const delay = ring * 38;
        window.setTimeout(() => {
          cube.el.setAttribute("data-lit", "");
          // A little kick so the ripple is felt, not just seen.
          if (!reduced) cube.vx -= 260;
        }, delay);
        window.setTimeout(() => cube.el.removeAttribute("data-lit"), delay + 380);
      }
    };

    scene.addEventListener("pointermove", onMove, { passive: true });
    scene.addEventListener("pointerleave", onLeave);
    scene.addEventListener("click", onClick);

    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(scene);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!visible || document.hidden) return;

      let fr = pointer.r;
      let fc = pointer.c;
      if (!pointer.active || now > pointer.idleAt) {
        if (reduced) {
          fr = fc = -99;
        } else {
          // Idle: a slow scan across the word, like a read head.
          sim.r += (sim.tr - sim.r) * 0.02;
          sim.c += (sim.tc - sim.c) * 0.011;
          if (Math.abs(sim.c - sim.tc) < 0.4) {
            sim.tc = sim.tc > cols / 2 ? -2 : cols + 1;
            sim.tr = 1 + Math.random() * 5;
          }
          fr = sim.r;
          fc = sim.c;
        }
      }

      for (const cube of cubes) {
        let tx = 0;
        let ty = 0;
        if (now >= cube.start) {
          const dist = Math.hypot(cube.r - fr, cube.c - fc);
          const pct = dist <= radius ? 1 - dist / radius : 0;
          const eased = pct * pct * (3 - 2 * pct);
          tx = -eased * maxAngle;
          ty = eased * maxAngle;
        } else {
          tx = -90;
        }
        // Damped spring: slight overshoot, settles in ~0.6s.
        const k = 150;
        const damp = 17;
        cube.vx += ((tx - cube.rx) * k - cube.vx * damp) * dt;
        cube.vy += ((ty - cube.ry) * k - cube.vy * damp) * dt;
        const nx = cube.rx + cube.vx * dt;
        const ny = cube.ry + cube.vy * dt;
        if (Math.abs(nx - cube.rx) + Math.abs(ny - cube.ry) > 0.005) {
          cube.rx = nx;
          cube.ry = ny;
          cube.el.style.transform = `rotateX(${nx.toFixed(2)}deg) rotateY(${ny.toFixed(2)}deg)`;
        }
        const h = now >= cube.start ? Math.min(1, Math.abs(cube.ry) / maxAngle) : 0;
        if (Math.abs(h - cube.h) > 0.015 || (h === 0 && cube.h !== 0)) {
          cube.h = h;
          cube.el.style.setProperty("--h", h.toFixed(3));
        }
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
      scene.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, maxAngle, radius, entranceDelay]);

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={sceneRef}
        role="img"
        aria-label={word}
        className={cn("grid cursor-crosshair touch-manipulation select-none", className)}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: "repeat(7, 1fr)",
          aspectRatio: `${cols} / 7`,
        }}
      >
        {rows.flatMap((row, r) =>
          [...row].map((bit, c) =>
            bit === "1" ? (
              <div
                key={`${r}-${c}`}
                className="bw-cell relative"
                style={{ "--d": `${delayOf(r, c)}ms`, perspective: "520px" } as React.CSSProperties}
              >
                <div
                  data-cube=""
                  data-row={r}
                  data-col={c}
                  className="absolute inset-[7%] [transform-style:preserve-3d]"
                  style={{ transform: "rotateX(-90deg)" }}
                >
                  {FACES.map((f) => (
                    <span key={f.t} className={`bw-face bw-${f.k}`} style={{ transform: f.t }} />
                  ))}
                </div>
              </div>
            ) : (
              <div key={`${r}-${c}`} className="grid place-items-center">
                {showGrid && <span className="size-[3px] rounded-full bg-edge-strong/60" />}
              </div>
            ),
          ),
        )}
      </div>
    </>
  );
}
