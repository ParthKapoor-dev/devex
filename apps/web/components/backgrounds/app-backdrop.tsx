/**
 * The backdrop for signed-in product surfaces.
 *
 * Deliberately *not* the landing backdrop. The marketing page gets a live
 * shader because it has one job and you look at it for thirty seconds; the
 * dashboard is a working surface someone leaves open, so it gets the same
 * visual language with nothing running behind it: a wash, a grid, and grain.
 *
 * Zero JavaScript — this is a server component with no `"use client"`, no
 * canvas, no rAF, no observers. It paints once and then costs nothing for the
 * rest of the session.
 */

const GRID_LINE = "color-mix(in oklab, var(--color-ink) 6%, transparent)";
const GRID_MASK =
  "radial-gradient(120% 90% at 50% 0%, black 10%, transparent 80%)";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

export default function AppBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 60% at 50% -20%, color-mix(in oklab, var(--color-brand) 9%, transparent) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
          ].join(","),
          backgroundSize: "32px 32px",
          maskImage: GRID_MASK,
          WebkitMaskImage: GRID_MASK,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }}
      />
    </div>
  );
}
