import {
  Boxes,
  GitBranch,
  Globe,
  Shield,
  TerminalSquare,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Section, HairlineGrid } from "./section";

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
    <Section
      id="features"
      eyebrow="What you get"
      title="Everything a dev box does, without the dev box."
    >
      <HairlineGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
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
          </div>
        ))}
      </HairlineGrid>
    </Section>
  );
}
