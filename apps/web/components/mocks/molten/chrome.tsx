"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

/**
 * MOCK — Molten's copy of `components/mocks/liquid-chrome.tsx` (React Bits,
 * MIT + Commons Clause). Same shader; the loop around it is different:
 *
 * - pauses when offscreen or the tab is hidden (the shader is 9 iterations
 *   per pixel — two of these on one page must not both run all the time)
 * - `prefers-reduced-motion` paints one still frame and stops
 * - the pointer is eased toward its target instead of jumping, and only
 *   read relative to the element (window listener: overlays sit on top)
 * - ResizeObserver instead of window resize (the hero is sized in dvh)
 * - canvas fades in on its first frame, so there is no white flash
 */

const VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec3 uBaseColor;
uniform float uAmplitude;
uniform float uFrequencyX;
uniform float uFrequencyY;
uniform vec2 uMouse;
varying vec2 vUv;

void main() {
  vec2 fragCoord = vUv * uResolution.xy;
  vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);
  for (float i = 1.0; i < 10.0; i++) {
    uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
    uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
  }
  vec2 diff = vUv - uMouse;
  float dist = length(diff);
  float falloff = exp(-dist * 20.0);
  float ripple = sin(10.0 * dist - uTime * 2.0) * 0.03;
  uv += (diff / (dist + 0.0001)) * ripple * falloff;
  vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
  gl_FragColor = vec4(min(color, vec3(1.0)), 1.0);
}`;

export default function MoltenChrome({
  baseColor = [0.1, 0.05, 0.008],
  speed = 0.22,
  amplitude = 0.36,
  frequencyX = 2.6,
  frequencyY = 3,
  renderScale = 0.5,
  interactive = true,
  className = "",
}: {
  baseColor?: [number, number, number];
  speed?: number;
  amplitude?: number;
  frequencyX?: number;
  frequencyY?: number;
  renderScale?: number;
  interactive?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [r, g, b] = baseColor;

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ antialias: false, dpr: renderScale, alpha: false });
    } catch {
      return; // no WebGL: the CSS fallback behind the canvas stays visible
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 900ms cubic-bezier(0.16,1,0.3,1)";

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 7.3 },
        uResolution: { value: new Float32Array([1, 1, 1]) },
        uBaseColor: { value: new Float32Array([r, g, b]) },
        uAmplitude: { value: amplitude },
        uFrequencyX: { value: frequencyX },
        uFrequencyY: { value: frequencyY },
        uMouse: { value: new Float32Array([0.62, 0.42]) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    host.appendChild(canvas);

    const render = () => renderer.render({ scene: mesh });

    const resize = () => {
      renderer.setSize(host.offsetWidth, host.offsetHeight);
      const res = program.uniforms.uResolution.value as Float32Array;
      res[0] = gl.canvas.width;
      res[1] = gl.canvas.height;
      res[2] = gl.canvas.width / Math.max(gl.canvas.height, 1);
      if (reduced) render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // Eased pointer: target set by events, value chased in the loop.
    const target = { x: 0.62, y: 0.42 };
    const mouse = program.uniforms.uMouse.value as Float32Array;
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height;
    };
    if (interactive && !reduced) window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(host);

    let raf = 0;
    let t = 7.3; // start mid-flow so the first frame already has streaks
    let last = performance.now();
    let shown = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      if (!visible || document.hidden) return;
      t += dt * speed;
      mouse[0] += (target.x - mouse[0]) * Math.min(dt * 3, 1);
      mouse[1] += (target.y - mouse[1]) * Math.min(dt * 3, 1);
      program.uniforms.uTime.value = t;
      render();
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
    };

    if (reduced) {
      render();
      canvas.style.opacity = "1";
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [r, g, b, speed, amplitude, frequencyX, frequencyY, renderScale, interactive]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden bg-[radial-gradient(120%_90%_at_70%_30%,var(--color-brand-950),var(--color-canvas)_70%)] ${className}`}
    />
  );
}
