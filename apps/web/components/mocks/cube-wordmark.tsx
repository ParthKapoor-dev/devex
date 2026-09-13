"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * MOCK — the DevEx wordmark built out of React Bits "Cubes"
 * (https://reactbits.dev/animations/cubes, MIT + Commons Clause).
 *
 * The original is a square grid driven by one gsap tween per cube per frame.
 * Here the grid is a 5×7 bitmap font spelling the word, only the lit cells get
 * a cube, and every cube eases toward its target tilt inside one rAF loop that
 * stops when the wordmark is off-screen. Click sends an amber ripple outward
 * from the cell you hit.
 */

const GLYPHS: Record<string, string[]> = {
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  " ": ["0", "0", "0", "0", "0", "0", "0"],
};

function bitmap(word: string) {
  const rows = Array.from({ length: 7 }, () => "");
  [...word.toUpperCase()].forEach((ch, i) => {
    const g = GLYPHS[ch] ?? GLYPHS[" "];
    for (let r = 0; r < 7; r++) rows[r] += (i ? "0" : "") + g[r];
  });
  return rows;
}

const FACES = [
  "translateY(-50%) rotateX(90deg)",
  "translateY(50%) rotateX(-90deg)",
  "translateX(-50%) rotateY(-90deg)",
  "translateX(50%) rotateY(90deg)",
  "rotateY(-90deg) translateX(50%) rotateY(90deg)",
  "rotateY(90deg) translateX(-50%) rotateY(-90deg)",
];

export function CubeWordmark({
  word = "DEVEX",
  maxAngle = 55,
  radius = 3.2,
  className,
  showGrid = true,
}: {
  word?: string;
  maxAngle?: number;
  radius?: number;
  className?: string;
  showGrid?: boolean;
}) {
  const rows = useMemo(() => bitmap(word), [word]);
  const cols = rows[0].length;
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cubes = Array.from(scene.querySelectorAll<HTMLElement>("[data-cube]")).map((el) => ({
      el,
      r: +el.dataset.row!,
      c: +el.dataset.col!,
      rx: 0,
      ry: 0,
      tx: 0,
      ty: 0,
    }));

    const pointer = { r: -99, c: -99, active: false, idleAt: 0 };
    const sim = { r: 3, c: 0, tr: 3, tc: cols };

    const onMove = (e: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      pointer.c = ((e.clientX - rect.left) / rect.width) * cols;
      pointer.r = ((e.clientY - rect.top) / rect.height) * 7;
      pointer.active = true;
      pointer.idleAt = performance.now() + 2500;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.r = pointer.c = -99;
    };
    const onClick = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const hc = Math.floor(((e.clientX - rect.left) / rect.width) * cols);
      const hr = Math.floor(((e.clientY - rect.top) / rect.height) * 7);
      for (const cube of cubes) {
        const ring = Math.round(Math.hypot(cube.r - hr, cube.c - hc));
        const delay = ring * 45;
        window.setTimeout(() => cube.el.setAttribute("data-lit", ""), delay);
        window.setTimeout(() => cube.el.removeAttribute("data-lit"), delay + 420);
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
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      let fr = pointer.r;
      let fc = pointer.c;
      if (!pointer.active || now > pointer.idleAt) {
        if (reduced) return;
        // Idle: a slow scan across the word, like a read head.
        sim.r += (sim.tr - sim.r) * 0.02;
        sim.c += (sim.tc - sim.c) * 0.012;
        if (Math.abs(sim.c - sim.tc) < 0.3) {
          sim.tc = sim.tc > cols / 2 ? -1 : cols + 1;
          sim.tr = 1 + Math.random() * 5;
        }
        fr = sim.r;
        fc = sim.c;
      }

      for (const cube of cubes) {
        const dist = Math.hypot(cube.r - fr, cube.c - fc);
        const pct = dist <= radius ? 1 - dist / radius : 0;
        cube.tx = -pct * maxAngle;
        cube.ty = pct * maxAngle;
        // Rise fast, settle slow — the enter 0.3s / leave 0.6s of the original.
        const k = 1 - Math.exp(-dt * (pct > 0 ? 12 : 5));
        const nx = cube.rx + (cube.tx - cube.rx) * k;
        const ny = cube.ry + (cube.ty - cube.ry) * k;
        if (Math.abs(nx - cube.rx) + Math.abs(ny - cube.ry) > 0.01) {
          cube.rx = nx;
          cube.ry = ny;
          cube.el.style.transform = `rotateX(${nx.toFixed(2)}deg) rotateY(${ny.toFixed(2)}deg)`;
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
  }, [cols, maxAngle, radius]);

  return (
    <div
      ref={sceneRef}
      role="img"
      aria-label={word}
      className={cn("grid cursor-crosshair select-none", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: "repeat(7, 1fr)",
        aspectRatio: `${cols} / 7`,
        gap: "6%",
        perspective: "99999px",
      }}
    >
      {rows.flatMap((row, r) =>
        [...row].map((bit, c) =>
          bit === "1" ? (
            <div
              key={`${r}-${c}`}
              data-cube=""
              data-row={r}
              data-col={c}
              className="cube-cell group relative aspect-square [transform-style:preserve-3d]"
            >
              {FACES.map((t) => (
                <span
                  key={t}
                  className="absolute inset-0 border border-[color-mix(in_oklab,var(--color-brand)_45%,transparent)] bg-[#0d0b09] transition-colors duration-300 group-data-[lit]:bg-brand group-data-[lit]:duration-100"
                  style={{ transform: t }}
                />
              ))}
            </div>
          ) : (
            <div key={`${r}-${c}`} className="grid place-items-center">
              {showGrid && <span className="size-[3px] rounded-full bg-edge" />}
            </div>
          ),
        ),
      )}
    </div>
  );
}
