import {
  Boxes,
  GitBranch,
  Globe,
  Shield,
  TerminalSquare,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * What the product actually does.
 *
 * This was three decorative pills reading "Kubernetes powered", "Isolated
 * containers", "Custom subdomains" — three labels with no claim attached, so
 * a reader learned nothing they had not already guessed from the headline.
 * Each item now states the mechanism, because for a developer audience the
 * mechanism *is* the pitch.
 *
 * A server component: no state, no effects, no client bundle.
 */

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Zap,
    title: "Seconds to a shell",
    body: "Pick a template and a pod is scheduled, the image pulled and a PTY attached before you have finished reading this.",
  },
  {
    icon: TerminalSquare,
    title: "A real terminal",
    body: "A genuine PTY over a WebSocket — job control, signals, curses apps and your own dotfiles. Not a command runner pretending.",
  },
  {
    icon: Shield,
    title: "One container each",
    body: "Every session is its own container with its own filesystem, torn down when you are done. Nothing leaks between workspaces.",
  },
  {
    icon: Globe,
    title: "Ports you can share",
    body: "Anything bound inside the container gets a public URL. Hand it to a colleague, point a webhook at it, open it on your phone.",
  },
  {
    icon: Boxes,
    title: "Kubernetes underneath",
    body: "Scheduling, limits and lifecycle are the cluster's job, which is why this scales past a laptop and why you can self-host it.",
  },
  {
    icon: GitBranch,
    title: "Yours to run",
    body: "Open source, self-hostable and documented. Bring your own cluster and bucket, or read the code before you trust it.",
  },
];

export default function Features() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <p className="label mb-3 text-ink-subtle">What you get</p>
        <h2 className="max-w-2xl text-balance text-left font-display text-3xl font-medium tracking-[-0.025em] text-ink sm:text-4xl">
          Everything a dev box does, without the dev box.
        </h2>

        {/* A hairline grid: the dividers are the layout, so there are no cards
            to draw and no borders doubling up between cells. */}
        <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="group bg-canvas p-6 transition-colors duration-[--duration-fast] hover:bg-surface"
            >
              <Icon
                className="size-5 text-ink-subtle transition-colors duration-[--duration-fast] group-hover:text-brand"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-medium text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
