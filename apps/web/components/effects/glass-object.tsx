"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";
import { useActiveInView } from "@/hooks/use-active-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * A slab of glass over the site's own backdrop.
 *
 * canvasui.dev's Glass Object is the reference and is deliberately not used:
 * it is three.js plus five addons — 190–210 kB gzip against the 34 kB of `ogl`
 * already here — for one object, and it runs `transmission: 1`, which renders
 * the scene twice per frame. It also cannot refract the thing behind it, since
 * it owns a separate context and lights itself from a synthetic studio room.
 * Paying that to get "a grey blob with an amber rim" after tuning its rainbow
 * dispersion out is the wrong trade.
 *
 * The cheap insight: the backdrop here is *procedural*, so there is nothing to
 * capture. The shader evaluates it twice — once straight for the background,
 * and once at a refracted coordinate for whatever is seen through the slab —
 * and real refraction falls out with no render target, no second pass and no
 * new dependency. One program, one fullscreen triangle, `ogl`.
 *
 * Dispersion is a hair's width rather than a rainbow: the design language
 * rations chroma, and an iridescent object would be the loudest thing on a
 * zero-chroma page. The accent is spent on the rim, where it reads as an edge
 * catching light instead of as colour for its own sake.
 */

const VERT = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec3 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uInk;
uniform vec3 uBrand;
uniform float uRound;

varying vec2 vUv;

/* The world behind the glass: the terminal grid the rest of the site is made
   of, with a soft pool of light so the refraction has something to bend. */
vec3 backdrop(vec2 p) {
  vec2 g = fract(p * 26.0) - 0.5;
  float dot_ = smoothstep(0.34, 0.12, length(g));

  float glow = exp(-2.3 * length(p - vec2(0.22, -0.16)));
  float sheet = exp(-1.4 * length(p * vec2(0.7, 1.5) + vec2(0.4, 0.35)));

  vec3 col = vec3(0.028);
  col += uInk * dot_ * (0.05 + 0.30 * glow);
  col += uBrand * glow * 0.20;
  col += uInk * sheet * 0.035;
  return col;
}

/* Rounded slab. Negative inside. */
float sdBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

float shape(vec2 p) {
  float a = 0.22 * sin(uTime * 0.00021);
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  return sdBox(rot * p, vec2(0.46, 0.30), uRound);
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uResolution.z, 1.0);

  /* A slow drift, plus a gentle lean towards the pointer. */
  vec2 centre = vec2(sin(uTime * 0.00017) * 0.02, cos(uTime * 0.00023) * 0.015);
  centre += uMouse * 0.05;

  float d = shape(p - centre);
  vec3 col = backdrop(p);

  if (d < 0.0) {
    /* Thickness from the distance field: thickest in the middle, thin at the
       edge, which is what makes a slab look solid rather than painted on. */
    float thick = sqrt(max(0.0, -d));

    /* The surface normal is the gradient of the field, tilted by thickness. */
    vec2 e = vec2(0.0018, 0.0);
    vec2 grad = vec2(
      shape(p - centre + e.xy) - shape(p - centre - e.xy),
      shape(p - centre + e.yx) - shape(p - centre - e.yx)
    );
    vec2 n = normalize(grad + 1e-6);

    /* Refraction: look up the backdrop somewhere else. Per-channel offsets of
       well under a pixel give the edge a faint warm/cool split — a hint of
       dispersion, not a prism. */
    vec2 bend = n * thick * 0.30;
    float r = backdrop(p - bend * 1.035).r;
    float g = backdrop(p - bend).g;
    float b = backdrop(p - bend * 0.965).b;
    col = vec3(r, g, b);

    /* Glass is not neutral density — it lifts the blacks slightly. */
    col += vec3(0.012) * thick;

    /* Fresnel: the rim brightens where the surface turns away. */
    float rim = smoothstep(0.045, 0.0, -d);
    col += uBrand * pow(rim, 1.6) * 0.5;
    col += uInk * pow(rim, 3.0) * 0.16;

    /* One specular streak, so it reads as a surface with a light on it. */
    float spec = pow(max(0.0, dot(n, normalize(vec2(-0.6, 0.8)))), 22.0);
    col += uInk * spec * smoothstep(0.12, 0.0, -d) * 0.5;
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

const hex = (value: string) =>
  new Color(
    parseInt(value.slice(1, 3), 16) / 255,
    parseInt(value.slice(3, 5), 16) / 255,
    parseInt(value.slice(5, 7), 16) / 255,
  );

export function GlassObject({
  className,
  round = 0.14,
}: {
  className?: string;
  /** Corner radius of the slab, in shader units. 0.3 is a capsule. */
  round?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new Float32Array([0, 0]));
  const active = useActiveInView(hostRef);
  const reducedMotion = useReducedMotion();

  // The loop reads these without restarting, so the context is created once.
  const running = useRef(active && !reducedMotion);
  running.current = active && !reducedMotion;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // DPR 1, like the CRT. This is a full-screen fragment shader evaluating
    // the backdrop up to four times per pixel; every step up squares the cost.
    const renderer = new Renderer({ dpr: 1, alpha: false });
    const gl = renderer.gl;
    gl.clearColor(0.03, 0.03, 0.03, 1);

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uResolution: { value: new Color(1, 1, 1) },
        uTime: { value: 0 },
        uMouse: { value: mouse.current },
        uInk: { value: hex(token.ink) },
        uBrand: { value: hex(token.brand500) },
        uRound: { value: round },
      },
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      renderer.setSize(host.offsetWidth, host.offsetHeight);
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    host.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    let frame = 0;
    let started = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!running.current) return;
      if (!started) started = now;
      program.uniforms.uTime.value = now - started;
      renderer.render({ scene: mesh });
    };

    // Reduced motion still gets the object — it just never moves.
    if (reducedMotion) renderer.render({ scene: mesh });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      if (gl.canvas.parentElement === host) host.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [round, reducedMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn("relative overflow-hidden", className)}
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        mouse.current[0] = ((e.clientX - box.left) / box.width - 0.5) * 2;
        mouse.current[1] = -((e.clientY - box.top) / box.height - 0.5) * 2;
      }}
      onPointerLeave={() => {
        mouse.current[0] = 0;
        mouse.current[1] = 0;
      }}
    />
  );
}
