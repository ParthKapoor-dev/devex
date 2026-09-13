import Link from "next/link";
import { DIRECTIONS } from "@/components/mocks/directions";

export default function MocksIndex() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-32">
      <p className="label text-ink-subtle">Design review · landing + login</p>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
        Four directions
      </h1>
      <p className="mt-4 max-w-xl text-ink-muted">
        Each one is a full landing page and a matching login page. Use the pill
        at the bottom to switch between them. Pick one, or mix parts from
        several.
      </p>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {DIRECTIONS.map((d) => (
          <li key={d.slug} className="surface-card flex flex-col gap-4 p-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-brand">{d.letter}</span>
              <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                {d.name}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">{d.pitch}</p>
            <ul className="flex flex-wrap gap-1.5">
              {d.uses.map((u) => (
                <li
                  key={u}
                  className="rounded-sm border border-edge px-2 py-0.5 font-mono text-[11px] text-ink-subtle"
                >
                  {u}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex gap-2 pt-2">
              <Link
                href={`/mocks/${d.slug}`}
                className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-fg hover:bg-brand-400"
              >
                Landing
              </Link>
              <Link
                href={`/mocks/${d.slug}/login`}
                className="rounded-md border border-edge px-3 py-2 text-sm text-ink-muted hover:border-edge-strong hover:text-ink"
              >
                Login
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
