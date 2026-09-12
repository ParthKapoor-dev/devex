"use client";

import { useEffect, useState } from "react";

/**
 * The platform's "command" modifier, as a label.
 *
 * Every shortcut hint in the app is hardcoded to `⌘K` while the handlers
 * behind them all accept `metaKey || ctrlKey` — so on Linux and Windows, which
 * is most of this audience, the UI advertises a key the keyboard does not
 * have.
 *
 * Resolved after mount rather than during render: the server cannot know the
 * platform, so putting an answer in the static HTML means either a hydration
 * mismatch or the wrong hint for whoever loses the coin toss. `Ctrl` is the
 * initial value because it is right for the majority; Apple users see it
 * settle on the first frame.
 */
export function useModifierKey(): string {
  const [modifier, setModifier] = useState("Ctrl");

  useEffect(() => {
    if (/mac|iphone|ipad|ipod/i.test(navigator.userAgent)) setModifier("⌘");
  }, []);

  return modifier;
}
