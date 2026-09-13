"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// The server can't know the user's preference. We assume motion is allowed so
// the first client paint matches the markup, then correct on the client if the
// user has asked for reduced motion.
function getServerSnapshot() {
  return false;
}

/**
 * `true` when the user has asked the OS to reduce motion.
 *
 * Every continuous animation in the app is expected to consult this and fall
 * back to a static (or near-static) presentation rather than simply running
 * slower.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
