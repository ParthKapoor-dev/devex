"use client";

/**
 * The fire itself: one fragment shader, no render targets.
 *
 * Kept in its own module so `blaze.tsx` can `dynamic()`-import it. The GL
 * context is created when this mounts, which is deliberately late — see the
 * note in `blaze.tsx` about the page's WebGL budget.
 *
 * The reference implementation (canvasui.dev/docs/components/blaze) renders
 * the page's own DOM into a texture and refracts it through the heat, which
 * needs Chrome's html-in-canvas origin trial; every other browser gets the
 * content with no effect at all. So the heat here bends the *flame field*
 * rather than the content, and the content is lit instead of refracted — the
 * canvas sits above the text under `mix-blend-mode: screen`, where black is a
 * no-op and only the light lands. That works everywhere and never touches
 * legibility, because screen can lighten the text but cannot obscure it.
 */

import { Renderer, Program, Mesh, Triangle } from "ogl";
import { useEffect, useRef } from "react";

export interface BlazeShaderProps {
  /** Height of the flame zone as a fraction of the element. */
  height?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Brightness of the rising sparks. 0 turns them off. */
  sparks?: number;
  /** How tightly packed the sparks are. */
  sparkDensity?: number;
  /** Size of an individual spark. */
  sparkSize?: number;
  /** Warm haze above the flame front. 0 turns it off. */
  smoke?: number;
  /** Ambient glow along the bottom edge. */
  glow?: number;
  /** Strength of the heat shimmer warping the flame field. */
  shimmer?: number;
  /** Deep, mid and core flame colours, as `#rrggbb`. */
  colours?: [string, string, string];
  /** Stop the rAF loop (off-screen, tab hidden, reduced motion). */
  pause?: boolean;
  dpr?: number;
}

const VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec2  iResolution;
uniform float uHeight;
uniform float uSparks;
uniform float uSparkDensity;
uniform float uSparkSize;
uniform float uSmoke;
uniform float uGlow;
uniform float uShimmer;
uniform vec3  uEmber;
uniform vec3  uFlame;
uniform vec3  uCore;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(3.1, 7.7);
    a *= 0.5;
  }
  return v;
}

/* One sheet of sparks on a jittered lattice, rising at its own rate. */
float sparkLayer(vec2 uv, float aspect, float t, float fi, float density, float size) {
  float rate = 0.26 + fi * 0.16;
  vec2 g = vec2(uv.x * aspect, uv.y) * density * (1.0 + fi * 0.4);
  g.y -= t * rate * density;
  vec2 id = floor(g);
  vec2 f = fract(g);
  float h = hash21(id + fi * 31.7);
  vec2 c = vec2(hash21(id + 3.7), hash21(id + 11.3));
  // Sideways drift, so they do not rise on rails.
  c.x += sin(t * 1.6 + h * 40.0) * 0.26;
  float d = length((f - c) * vec2(1.0, 0.45));
  float r = size * (0.5 + h * 0.8);
  // Hard core, short falloff: a soft blob reads as bokeh, not as an ember.
  return smoothstep(r, r * 0.25, d) * step(0.88, h);
}

void main() {
  float aspect = iResolution.x / iResolution.y;
  vec2 uv = vUv;
  float t = iTime;

  /* 0 at the base of the flame zone, 1 at its top. */
  float n = clamp(uv.y / max(uHeight, 0.001), 0.0, 1.0);

  /* y compressed, so the noise features are tall and narrow and the flames
     read as tongues rather than as a churning wall. */
  vec2 q = vec2(uv.x * aspect, uv.y * 0.5) * 2.7;

  /* Heat shimmer: displace the sample point, strongest low down. */
  vec2 warp = vec2(
    vnoise(q * 3.1 + vec2(0.0, -t * 1.4)) - 0.5,
    vnoise(q * 3.1 + vec2(5.2, -t * 1.7)) - 0.5
  );
  q += warp * uShimmer * 0.3 * (1.0 - n);

  /* Domain-warped turbulence, rising. The warp is what makes the tongues
     curl instead of flickering in place. */
  float w = fbm(q * 0.7 + vec2(0.0, -t * 0.35));
  float turb = fbm(q * 1.35 + vec2(w * 1.5, -t * 1.25));

  /* A slow horizontal term so the flame front is not an even wall. */
  float front = fbm(vec2(uv.x * aspect * 1.5, -t * 0.2)) * 0.5 + 0.55;

  float lift = pow(1.0 - n, 1.45);
  float fire = clamp(turb * lift * front * 3.0 - n * 0.5 - 0.42, 0.0, 1.0);
  fire = pow(fire, 1.35);

  vec3 col = mix(uEmber * 0.3, uEmber, smoothstep(0.0, 0.26, fire));
  col = mix(col, uFlame, smoothstep(0.22, 0.6, fire));
  col = mix(col, uCore, smoothstep(0.58, 0.95, fire));
  vec3 acc = col * fire;

  /* Ambient glow hugging the bottom edge: what the fire throws on the room. */
  acc += uFlame * exp(-n * 3.0) * uGlow * 0.13 * (0.6 + 0.4 * front);

  /* Haze riding just above the flame front. Screen blending cannot darken, so
     this is smoke lit by the fire below it, not smoke blocking the view. */
  float haze = fbm(q * 0.5 + vec2(w * 0.6, -t * 0.45));
  acc += uEmber * uSmoke * 0.1
       * smoothstep(0.3, 0.95, haze)
       * smoothstep(0.05, 0.5, n)
       * (1.0 - smoothstep(0.5, 1.2, n));

  /* Sparks carry further than the flames, so they fade over their own scale. */
  float sp = 0.0;
  for (int i = 0; i < 4; i++) {
    sp += sparkLayer(uv, aspect, t, float(i), uSparkDensity * 13.0, uSparkSize * 0.06);
  }
  float reach = clamp(uv.y / min(1.0, uHeight * 1.5), 0.0, 1.0);
  acc += mix(uFlame, uCore, 0.45) * sp * uSparks * pow(1.0 - reach, 2.2);

  gl_FragColor = vec4(clamp(acc, 0.0, 1.0), 1.0);
}
`;

function rgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace("#", ""), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

export default function BlazeShader({
  height = 0.62,
  speed = 1,
  sparks = 1.0,
  sparkDensity = 0.55,
  sparkSize = 1,
  smoke = 0.6,
  glow = 1.4,
  shimmer = 0.7,
  colours = ["#e17100", "#fe9a00", "#ffd230"],
  pause = false,
  dpr,
}: BlazeShaderProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Read in the loop rather than listed as a dependency: a `pause` in the
  // dependency array tears the GL context down and rebuilds it on every
  // scroll past the footer.
  const pauseRef = useRef(pause);
  const kickRef = useRef<() => void>(() => {});
  const rafRef = useRef(0);
  const clockRef = useRef(0);

  useEffect(() => {
    pauseRef.current = pause;
    if (!pause) kickRef.current();
  }, [pause]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new Renderer({
      dpr: dpr ?? Math.min(window.devicePixelRatio || 1, 1.5),
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const [ember, flame, core] = colours.map(rgb);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uHeight: { value: height },
        uSparks: { value: sparks },
        uSparkDensity: { value: sparkDensity },
        uSparkSize: { value: sparkSize },
        uSmoke: { value: smoke },
        uGlow: { value: glow },
        uShimmer: { value: shimmer },
        uEmber: { value: new Float32Array(ember) },
        uFlame: { value: new Float32Array(flame) },
        uCore: { value: new Float32Array(core) },
      },
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      renderer.setSize(host.offsetWidth, host.offsetHeight);
      const res = program.uniforms.iResolution.value as Float32Array;
      res[0] = gl.canvas.width;
      res[1] = gl.canvas.height;
      kickRef.current();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let last = 0;
    const update = (now: number) => {
      rafRef.current = 0;
      if (!pauseRef.current) {
        // Advance our own clock, so a pause leaves the fire where it was
        // rather than jumping forward by however long the footer was hidden.
        if (last) clockRef.current += Math.min(now - last, 64) * 0.001 * speed;
        last = now;
      } else {
        last = 0;
      }
      program.uniforms.iTime.value = clockRef.current;
      renderer.render({ scene: mesh });
      if (!pauseRef.current) rafRef.current = requestAnimationFrame(update);
    };

    kickRef.current = () => {
      if (rafRef.current === 0) rafRef.current = requestAnimationFrame(update);
    };
    kickRef.current();

    gl.canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(gl.canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      kickRef.current = () => {};
      observer.disconnect();
      if (gl.canvas.parentElement === host) host.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // `colours` is a hoisted literal at every call site; see `blaze.tsx`.
  }, [dpr, height, speed, sparks, sparkDensity, sparkSize, smoke, glow, shimmer, colours]);

  return <div ref={hostRef} className="size-full" />;
}
