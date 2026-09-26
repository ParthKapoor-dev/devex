"use client";

/**
 * The fire itself: one fragment shader, no render targets.
 *
 * Written against the structure of the original
 * (canvasui.dev/docs/components/blaze), because the first attempt here missed
 * what the effect actually is. Blaze is **not** a wall of flame — there is no
 * flame field in it at all. It is three things stacked:
 *
 * 1. **Embers.** Four sheets of them, one per cell of a lattice that rises
 *    through the element. Each ember orbits slowly inside its own cell, is
 *    drawn as a hard core plus a cubed bloom, is squashed and rotated into a
 *    short diagonal streak, and lights and goes out at its own height — which
 *    is what stops the field reading as a rising grid.
 * 2. **Smoke.** Three octaves of gradient noise, domain-warped by itself and
 *    drifting up, thresholded hard so it arrives in clumps rather than as a
 *    haze. It also thins the rear ember sheets, so the depth is real.
 * 3. **Glow.** A quadratic falloff from the bottom edge. Almost nothing on its
 *    own; it is what makes the other two feel like they are coming from
 *    somewhere.
 *
 * The original renders the page's own DOM into a texture and refracts it
 * through the heat, which needs Chrome's html-in-canvas origin trial; every
 * other browser gets the content with no effect at all. So the content is lit
 * rather than refracted here — the canvas sits above the text under
 * `mix-blend-screen`, where black is a no-op and only light lands, so the fire
 * can wash the text warm but can never cover it. The heat distortion is done
 * where it can be done honestly, on the footer's own decorative wordmark; see
 * `Footer.tsx`.
 *
 * Our own code throughout, on the `ogl` already in the tree: the original is
 * MIT **plus Commons Clause**, which a public MIT repo cannot take.
 */

import { Renderer, Program, Mesh, Triangle } from "ogl";
import { useEffect, useRef } from "react";

export interface BlazeShaderProps {
  /** Height of the blaze zone as a fraction of the element. */
  height?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Brightness of the rising embers. 0 turns them off. */
  sparks?: number;
  /** How tightly packed the embers are. Higher also makes them smaller. */
  sparkDensity?: number;
  /** Size of an individual ember. */
  sparkSize?: number;
  /** Intensity of the smoke. 0 turns it off. */
  smoke?: number;
  /** Warm ambient glow near the bottom edge. */
  glow?: number;
  /** Ember colour and smoke/glow colour, as `#rrggbb`. */
  colours?: [string, string];
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
precision highp float;

varying vec2 vUv;

uniform vec2  iResolution;
uniform float iTime;
uniform float uHeight;
uniform float uSparks;
uniform float uSparkDensity;
uniform float uSparkSize;
uniform float uSmoke;
uniform float uGlow;
uniform vec3  uSparkColor;
uniform vec3  uSmokeColor;

const int LAYERS = 4;

float hash12(vec2 p) {
  vec3 a = fract(vec3(p.xyx) * 0.1031);
  a += dot(a, a.yzx + 33.33);
  return fract((a.x + a.y) * a.z);
}

vec2 hash22(vec2 p) {
  vec3 a = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  a += dot(a, a.yzx + 33.33);
  return fract((a.xx + a.yz) * a.zy);
}

/* Smooth vec2 noise, used only to wobble a whole sheet off the lattice. */
vec2 vnoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = smoothstep(0.0, 1.0, fract(p));
  return mix(
    mix(hash22(i), hash22(i + vec2(0.0, 1.0)), f.y),
    mix(hash22(i + vec2(1.0, 0.0)), hash22(i + 1.0), f.y),
    f.x);
}

/* Gradient noise. Value noise is too blocky to carry smoke at three octaves. */
float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = dot(hash22(i) * 2.0 - 1.0, f);
  float b = dot(hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.4;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * gnoise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p + 11.7;
    a *= 0.5;
  }
  return v * 0.5 + 0.5;
}

/* Smoke: fbm warped by a vector built out of itself, the whole thing rising. */
float smokeField(vec2 p, float t) {
  vec2 rise = vec2(-t * 0.03, -t * 0.22);
  vec2 q = vec2(fbm(p + rise), fbm(p + rise * 0.85 + vec2(5.2, 1.3)));
  return fbm(p + 0.55 * q + rise);
}

vec2 rot(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(s, c, -c, s) * v;
}

/* Where this cell's ember is, orbiting its centre. */
vec2 cellPoint(vec2 cell, float spin) {
  return rot(hash22(cell) - 0.5, spin) * 0.66 + cell + 0.5;
}

/*
 * One ember. The second argument is the un-scaled coordinate, and is what decides where
 * this one lights and where it goes out — so the same sheet, sampled at four
 * scales, does not light all four of its copies at the same height.
 */
vec3 ember(vec2 uv, vec2 field) {
  vec2 cell = floor(uv);
  float spin = iTime * 0.6 * (hash12(cell) - 0.5) * 2.0;
  vec2 point = cellPoint(cell, spin);
  float size = 0.002 * uSparkSize;

  /* Turbulence on the whole sheet, so embers do not rise on rails. */
  vec2 t = uv + vec2(
    gnoise(uv * 1.8 + iTime * 0.55),
    gnoise(uv * 1.8 - iTime * 0.4 + 7.3)) * 0.06;

  vec2 to = rot(t - point, 0.7);
  vec2 jitter = hash22(cell + 0.37) - 0.5;
  /* Squashed along one axis and rotated: an ember is a streak, not a disc. */
  float core = length(to * (vec2(0.5, 1.6) + jitter * vec2(0.25, 0.2)));
  float halo = length(to * (vec2(0.5, 0.8) + jitter * vec2(0.3, 0.1)));

  vec3 c = (1.0 - smoothstep(size * 0.6, size * 3.0, core)) * uSparkColor * 1.5;
  c += pow(1.0 - smoothstep(0.0, size * 6.0, halo), 3.0) * uSparkColor * 0.8;

  float dies = (hash12(cell) - 0.5) * 2.0;
  float lights = (hash12(cell + 0.214) - 1.8) * 0.7;
  return c
    * (1.0 - smoothstep(dies, dies + 0.5, field.y))
    * smoothstep(lights, lights + 0.4, field.y);
}

vec3 sheets(vec2 field, float smoke) {
  vec3 acc = vec3(0.0);
  float size = 1.0;
  float alpha = 1.0;
  vec2 offset = vec2(0.0);
  for (int i = 0; i < LAYERS; i++) {
    vec2 drift = (vnoise2(field * size * 2.0 + 0.5) - 0.5) * 0.15;
    vec2 uv = field * size * uSparkDensity - vec2(0.0, iTime * 0.5) + offset + drift;
    /* Smoke eats the sheets behind it. That is where the depth comes from. */
    acc += ember(uv, field) * alpha
      * (1.0 - smoothstep(0.0, 1.0, smoke) * (float(i) / float(LAYERS)));
    offset += hash22(vec2(alpha, alpha)) * 10.0;
    alpha *= 0.9;
    size *= 1.01;
  }
  return acc;
}

void main() {
  float zone = clamp(uHeight, 0.02, 1.0);
  float fy = vUv.y / zone;
  if (fy > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float aspect = iResolution.x / iResolution.y;
  vec2 field = vec2((vUv.x - 0.5) * aspect * 3.2, mix(-0.7, 1.6, fy));

  float smoke = 0.0;
  if (uSmoke > 0.001) {
    smoke = smokeField(field * vec2(0.4, 0.55), iTime);
    smoke = smoothstep(0.42, 1.15, smoke);
    smoke *= pow(1.0 - smoothstep(-1.0, 1.6, field.y), 1.5);
  }

  vec3 acc = vec3(0.0);
  if (uSparks > 0.001) acc = sheets(field, smoke) * uSparks;
  acc += smoke * uSmokeColor * 0.8 * uSmoke;
  acc *= 1.0 - smoothstep(0.55, 1.0, fy);
  /* The bed: a tight, hot band on the edge the fire is rising off, then a
     wide, very faint one for the light it throws further up. Without the
     first, the embers look like they are falling from nowhere. */
  float along = 0.62 + 0.38 * fbm(vec2(field.x * 0.4, -iTime * 0.14));
  acc += mix(uSmokeColor, uSparkColor, 0.45) * uGlow * 0.55 * along * pow(1.0 - fy, 16.0);
  acc += uSmokeColor * 0.05 * uGlow * pow(1.0 - fy, 2.0);

  gl_FragColor = vec4(clamp(acc, 0.0, 1.0), 1.0);
}
`;

function rgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace("#", ""), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

export default function BlazeShader({
  height = 0.97,
  speed = 1,
  sparks = 0.85,
  sparkDensity = 1.5,
  sparkSize = 1,
  smoke = 0.5,
  glow = 1.5,
  colours = ["#ffd230", "#e17100"],
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

    const [spark, smokeCol] = colours.map(rgb);
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
        uSparkColor: { value: new Float32Array(spark) },
        uSmokeColor: { value: new Float32Array(smokeCol) },
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
        // Our own clock, so a pause leaves the fire where it was rather than
        // jumping forward by however long the footer was hidden.
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
  }, [dpr, height, speed, sparks, sparkDensity, sparkSize, smoke, glow, colours]);

  return <div ref={hostRef} className="size-full" />;
}
