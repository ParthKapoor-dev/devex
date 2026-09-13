"use client";

import { useEffect, useRef, type RefObject } from "react";

export interface SceneSurface {
  ctx: CanvasRenderingContext2D;
  /** Logical (CSS) pixel width. Draw in these units — the DPR transform is applied for you. */
  width: number;
  /** Logical (CSS) pixel height. */
  height: number;
  /** Device pixel ratio actually used for the backing store. */
  dpr: number;
}

export interface Scene {
  /** Called once on mount and again whenever the surface is resized. */
  resize?(surface: SceneSurface): void;
  /** Called per animation frame. `time` and `delta` are milliseconds. */
  frame(surface: SceneSurface, time: number, delta: number): void;
  /**
   * Drawn instead of `frame` when the user prefers reduced motion. Omit to
   * render a single `frame` at t=0 and then stop.
   */
  still?(surface: SceneSurface): void;
  /** Called on unmount. */
  dispose?(): void;
}

export interface CanvasSceneOptions {
  /**
   * Upper bound on frames per second. Canvas backdrops rarely need 60 — a
   * slow-moving field at 30 looks identical and halves the CPU cost.
   */
  fps?: number;
  /**
   * Upper bound on the device pixel ratio used for the backing store. Every
   * step up multiplies fill cost by its square, so 2 is the practical ceiling.
   */
  maxDpr?: number;
  /**
   * Keep animating while the canvas is scrolled out of view. Almost always
   * wrong — the default pauses the loop and gives the CPU back.
   */
  runWhenOffscreen?: boolean;
  /** Externally force the loop to stop (e.g. a paused/idle UI state). */
  paused?: boolean;
  /** When true, render `still()` once and never start the loop. */
  reducedMotion?: boolean;
}

/**
 * Drives a canvas animation that only runs when it can actually be seen.
 *
 * The loop is suspended when the canvas scrolls out of the viewport, when the
 * tab is hidden, and when the user prefers reduced motion. Sizing (including
 * device pixel ratio) is handled here so scenes can draw in plain CSS pixels.
 *
 * The scene is built by `createScene`, which is called again whenever the
 * values in `deps` change. Keep it free of render-scoped captures that aren't
 * listed there.
 */
export function useCanvasScene(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  createScene: () => Scene,
  options: CanvasSceneOptions = {},
  deps: unknown[] = [],
) {
  const {
    fps = 60,
    maxDpr = 2,
    runWhenOffscreen = false,
    paused = false,
    reducedMotion = false,
  } = options;

  // Keep the factory in a ref so callers can pass an inline closure without
  // restarting the loop on every render.
  const createSceneRef = useRef(createScene);
  createSceneRef.current = createScene;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const scene = createSceneRef.current();
    const surface: SceneSurface = { ctx, width: 0, height: 0, dpr: 1 };

    let frameId: number | null = null;
    let visible = runWhenOffscreen;
    let lastFrame = 0;
    let startedAt = 0;
    const minFrameGap = fps > 0 ? 1000 / fps : 0;

    const applySize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      if (
        surface.width === width &&
        surface.height === height &&
        surface.dpr === dpr
      ) {
        return false;
      }

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      surface.width = width;
      surface.height = height;
      surface.dpr = dpr;

      // Draw in CSS pixels; the backing store scale is applied once here.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize?.(surface);
      return true;
    };

    const renderStill = () => {
      if (surface.width === 0) return;
      if (scene.still) scene.still(surface);
      else scene.frame(surface, 0, 0);
    };

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);

      // Throttle to the requested frame rate without drifting.
      if (minFrameGap > 0 && now - lastFrame < minFrameGap - 0.5) return;
      const delta = lastFrame === 0 ? 0 : now - lastFrame;
      lastFrame = now;

      scene.frame(surface, now - startedAt, delta);
    };

    const start = () => {
      if (frameId !== null) return;
      startedAt = performance.now() - startedAt;
      lastFrame = 0;
      frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frameId === null) return;
      cancelAnimationFrame(frameId);
      frameId = null;
      startedAt = performance.now() - startedAt;
    };

    const sync = () => {
      const shouldRun =
        visible && !paused && !reducedMotion && !document.hidden;
      if (shouldRun) start();
      else stop();
    };

    applySize();

    if (reducedMotion) {
      renderStill();
    }

    const resizeObserver = new ResizeObserver(() => {
      if (applySize() && (reducedMotion || frameId === null)) renderStill();
    });
    resizeObserver.observe(canvas);

    let intersectionObserver: IntersectionObserver | null = null;
    if (!runWhenOffscreen) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          sync();
        },
        // Start a little before it scrolls in so there's no visible pop.
        { rootMargin: "128px" },
      );
      intersectionObserver.observe(canvas);
    }

    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      scene.dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, fps, maxDpr, runWhenOffscreen, paused, reducedMotion, ...deps]);
}
