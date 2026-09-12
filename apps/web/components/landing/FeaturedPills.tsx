import { Code, Globe, Shield, type LucideIcon } from "lucide-react";

const PILLS: { icon: LucideIcon; label: string }[] = [
  { icon: Code, label: "Kubernetes powered" },
  { icon: Shield, label: "Isolated containers" },
  { icon: Globe, label: "Custom subdomains" },
];

export default function FeaturedPills() {
  return (
    <ul className="mb-12 flex flex-wrap justify-center gap-3">
      {PILLS.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="group flex items-center gap-2 rounded-full border border-edge bg-surface/60 px-4 py-2 transition-colors duration-[--duration-normal] hover:border-brand/40"
        >
          <Icon
            className="size-4 text-brand transition-transform duration-[--duration-normal] group-hover:scale-110"
            aria-hidden="true"
          />
          <span className="text-sm text-ink-muted">{label}</span>
        </li>
      ))}
    </ul>
  );
}
