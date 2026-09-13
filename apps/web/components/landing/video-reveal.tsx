"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring } from "motion/react";
import { Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Skiper UI "Video player 001" (skiper67).
 * Free with attribution: https://skiper-ui.com
 *
 * Changes from the original: `motion/react` instead of framer-motion, a
 * YouTube embed instead of media-chrome + an mp4 (the demo only exists on
 * YouTube), Esc to close, body scroll lock, and the iris starts from the
 * thumbnail's measured position instead of hard-coded percentages.
 */

const VIDEO_ID = "Tlck20bJeFE";

export function VideoReveal({
  className,
  label = "Play the demo",
  children,
}: {
  className?: string;
  label?: string;
  /** Rendered as the thumbnail face. Defaults to the YouTube poster frame. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("inset(40% 40% 40% 40%)");
  const boxRef = useRef<HTMLButtonElement>(null);

  const x = useSpring(0, { mass: 0.1 });
  const y = useSpring(0, { mass: 0.1 });
  const opacity = useSpring(0, { mass: 0.1 });

  const openFromThumb = () => {
    const r = boxRef.current?.getBoundingClientRect();
    if (r) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pct = (n: number, d: number) =>
        `${Math.max(0, Math.min(49, (n / d) * 100)).toFixed(2)}%`;
      setOrigin(
        `inset(${pct(r.top, vh)} ${pct(vw - r.right, vw)} ${pct(vh - r.bottom, vh)} ${pct(r.left, vw)} round 16px)`,
      );
    }
    setOpen(true);
  };

  return (
    <>
      <button
        ref={boxRef}
        type="button"
        aria-label={label}
        onClick={openFromThumb}
        onPointerMove={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          opacity.set(1);
          x.set(e.clientX - b.left);
          y.set(e.clientY - b.top);
        }}
        onPointerLeave={() => opacity.set(0)}
        className={cn(
          "group relative block cursor-none overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
          className,
        )}
      >
        {children ?? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
            alt=""
            className="size-full object-cover transition-transform duration-700 ease-[--ease-out-expo] group-hover:scale-[1.03]"
          />
        )}
        <motion.span
          aria-hidden="true"
          style={{ x, y, opacity }}
          className="pointer-events-none absolute left-0 top-0 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap px-2 py-1 font-mono text-sm uppercase tracking-wider text-white mix-blend-exclusion"
        >
          <Play className="size-4 fill-white" /> Play
        </motion.span>
      </button>

      <AnimatePresence>
        {open && <Popover origin={origin} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function Popover({
  origin,
  onClose,
}: {
  origin: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product demo"
      className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-10"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.5 } }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-canvas/90 backdrop-blur-lg"
        onClick={onClose}
      />
      <motion.div
        initial={{ clipPath: origin, opacity: 0 }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 16px)", opacity: 1 }}
        exit={{
          clipPath: origin,
          opacity: 0,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            opacity: { duration: 0.2, delay: 0.6 },
          },
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed inset-4 overflow-hidden bg-black sm:inset-10"
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
          title="DevEx demo"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close demo"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black"
        >
          <Plus className="size-5 rotate-45" />
        </button>
      </motion.div>
    </div>
  );
}
