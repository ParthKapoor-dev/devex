"use client";

import { useEffect, useRef } from "react";

/**
 * MOCK — React Bits "Dot Grid", https://reactbits.dev (MIT + Commons Clause).
 *
 * Rewritten without gsap. The original throws each dot with InertiaPlugin and
 * springs it home with `elastic.out`; here both phases run inside the single
 * draw loop — a decaying velocity, then an underdamped spring — which is one
 * rAF for the whole grid instead of one tween per dot.
 */

interface Dot {
  cx: number;
  cy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 idle · 1 coasting after a hit · 2 springing home */
  phase: 0 | 1 | 2;
}

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : [0, 0, 0];
}

export default function DotGrid({
  dotSize = 5,
  gap = 15,
  baseColor = "#262626",
  activeColor = "#fe9a00",
  proximity = 120,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  className = "",
}: {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = hexToRgb(baseColor);
    const active = hexToRgb(activeColor);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots: Dot[] = [];
    let w = 0;
    let h = 0;

    const build = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cell = dotSize + gap;
      const cols = Math.floor((w + gap) / cell);
      const rows = Math.floor((h + gap) / cell);
      const sx = (w - (cell * cols - gap)) / 2 + dotSize / 2;
      const sy = (h - (cell * rows - gap)) / 2 + dotSize / 2;
      dots = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          dots.push({ cx: sx + c * cell, cy: sy + r * cell, x: 0, y: 0, vx: 0, vy: 0, phase: 0 });
    };

    const ro = new ResizeObserver(build);
    ro.observe(wrap);
    build();

    const pointer = { x: -1e4, y: -1e4, lastX: 0, lastY: 0, lastT: 0 };

    const hit = (d: Dot, px: number, py: number) => {
      d.phase = 1;
      // Initial velocity proportional to the push distance; decays over ~0.4s.
      d.vx = px * 6;
      d.vy = py * 6;
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const now = performance.now();
      const dt = pointer.lastT ? Math.max(now - pointer.lastT, 1) : 16;
      let vx = ((e.clientX - pointer.lastX) / dt) * 1000;
      let vy = ((e.clientY - pointer.lastY) / dt) * 1000;
      const speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        vx *= maxSpeed / speed;
        vy *= maxSpeed / speed;
      }
      pointer.lastT = now;
      pointer.lastX = e.clientX;
      pointer.lastY = e.clientY;
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      if (reduced || speed < speedTrigger) return;
      for (const d of dots) {
        if (d.phase) continue;
        const dx = d.cx - pointer.x;
        const dy = d.cy - pointer.y;
        if (dx * dx + dy * dy < proximity * proximity)
          hit(d, dx + vx * 0.005, dy + vy * 0.005);
      }
    };

    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (const d of dots) {
        const dx = d.cx - x;
        const dy = d.cy - y;
        const dist = Math.hypot(dx, dy);
        if (dist < shockRadius && d.phase !== 1) {
          const f = 1 - dist / shockRadius;
          hit(d, dx * shockStrength * f * 0.25, dy * shockStrength * f * 0.25);
        }
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      ctx.clearRect(0, 0, w, h);
      const prox2 = proximity * proximity;
      const r = dotSize / 2;
      // Two passes: every idle dot in one path in the base colour, then the
      // lit ones individually — most frames only a handful need a fillStyle.
      ctx.beginPath();
      ctx.fillStyle = baseColor;
      const lit: [number, number, number][] = [];
      for (const d of dots) {
        if (d.phase === 1) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          const decay = Math.exp(-dt * 7);
          d.vx *= decay;
          d.vy *= decay;
          if (Math.hypot(d.vx, d.vy) < 8) d.phase = 2;
        } else if (d.phase === 2) {
          // Underdamped spring home — the elastic settle.
          const k = 60;
          const c = 7;
          d.vx += (-k * d.x - c * d.vx) * dt;
          d.vy += (-k * d.y - c * d.vy) * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (Math.abs(d.x) + Math.abs(d.y) < 0.05 && Math.abs(d.vx) + Math.abs(d.vy) < 0.5) {
            d.x = d.y = d.vx = d.vy = 0;
            d.phase = 0;
          }
        }
        const ox = d.cx + d.x;
        const oy = d.cy + d.y;
        const dx = d.cx - pointer.x;
        const dy = d.cy - pointer.y;
        const dsq = dx * dx + dy * dy;
        if (dsq <= prox2) {
          lit.push([ox, oy, 1 - Math.sqrt(dsq) / proximity]);
        } else {
          ctx.moveTo(ox + r, oy);
          ctx.arc(ox, oy, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      for (const [x, y, t] of lit) {
        ctx.beginPath();
        ctx.fillStyle = `rgb(${base[0] + (active[0] - base[0]) * t},${base[1] + (active[1] - base[1]) * t},${base[2] + (active[2] - base[2]) * t})`;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [dotSize, gap, baseColor, activeColor, proximity, speedTrigger, shockRadius, shockStrength, maxSpeed]);

  return (
    <div ref={wrapRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
