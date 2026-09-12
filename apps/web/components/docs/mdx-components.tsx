import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Database,
  Info,
  Lightbulb,
  Server,
  Terminal,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/docs/code-block";

/* -------------------------------------------------------------------------- */
/* Callout                                                                    */
/* -------------------------------------------------------------------------- */

const CALLOUT_VARIANTS = {
  info: {
    icon: Info,
    ring: "border-info/30",
    tint: "bg-info/[0.07]",
    accent: "text-info",
  },
  tip: {
    icon: Lightbulb,
    ring: "border-brand/30",
    tint: "bg-brand/[0.07]",
    accent: "text-brand",
  },
  warning: {
    icon: TriangleAlert,
    ring: "border-warning/30",
    tint: "bg-warning/[0.07]",
    accent: "text-warning",
  },
  danger: {
    icon: AlertTriangle,
    ring: "border-danger/30",
    tint: "bg-danger/[0.07]",
    accent: "text-danger",
  },
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof CALLOUT_VARIANTS;
  title?: string;
  children: React.ReactNode;
}) {
  const variant = CALLOUT_VARIANTS[type] ?? CALLOUT_VARIANTS.info;
  const Icon = variant.icon;

  return (
    <div
      className={cn(
        "my-6 flex gap-3 rounded-lg border p-4",
        variant.ring,
        variant.tint,
      )}
    >
      <Icon
        className={cn("mt-0.5 size-5 shrink-0", variant.accent)}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {title ? (
          <p className={cn("mb-1 font-semibold", variant.accent)}>{title}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */

const CARD_ICONS = {
  zap: Zap,
  terminal: Terminal,
  database: Database,
  server: Server,
  check: Check,
  info: Info,
} as const;

export function Cards({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 grid gap-3 sm:grid-cols-2">{children}</div>
  );
}

export function Card({
  title,
  icon,
  href,
  children,
}: {
  title: string;
  icon?: keyof typeof CARD_ICONS;
  href?: string;
  children?: React.ReactNode;
}) {
  const Icon = icon ? CARD_ICONS[icon] : undefined;

  const body = (
    <>
      <div className="mb-2 flex items-center gap-2">
        {Icon ? (
          <Icon className="size-4 text-ink-subtle" aria-hidden="true" />
        ) : null}
        <span className="font-medium text-ink">{title}</span>
        {href ? (
          <ArrowUpRight className="ml-auto size-4 text-ink-subtle transition-transform duration-[--duration-fast] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
        ) : null}
      </div>
      {children ? (
        <div className="text-sm leading-relaxed text-ink-muted [&>p]:m-0">
          {children}
        </div>
      ) : null}
    </>
  );

  const className =
    "group block rounded-lg border border-edge bg-surface p-4 transition-colors duration-[--duration-fast] hover:border-brand/40 hover:bg-raised";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Numbered walkthrough. Each `###`/`h3` inside becomes a step; the counter and
 * the connecting rail are drawn with CSS counters so authors just write
 * headings.
 */
export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "my-6 ml-1 [counter-reset:step] [&>h3]:mb-2 [&>h3]:mt-0 [&>h3]:text-base [&>h3]:font-medium",
        // The rail.
        "border-l border-edge pl-8",
        // Each heading gets a numbered badge sitting on the rail.
        "[&>h3]:relative [&>h3]:[counter-increment:step]",
        "[&>h3]:before:absolute [&>h3]:before:-left-[2.6rem] [&>h3]:before:flex",
        "[&>h3]:before:size-7 [&>h3]:before:items-center [&>h3]:before:justify-center",
        "[&>h3]:before:rounded-full [&>h3]:before:border [&>h3]:before:border-edge",
        "[&>h3]:before:bg-surface [&>h3]:before:text-xs [&>h3]:before:font-semibold",
        "[&>h3]:before:text-ink-muted [&>h3]:before:content-[counter(step)]",
        "[&>h3:not(:first-child)]:mt-8",
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Base elements                                                              */
/* -------------------------------------------------------------------------- */

function heading(level: 1 | 2 | 3 | 4) {
  const Tag = `h${level}` as const;
  // Space Grotesk is a display face: AGENTS.md caps it at weight 500, and
  // above that it reads as dated rather than emphatic. These were bold and
  // semibold, which made every docs heading heavier than the h1 on the page
  // above it.
  const sizes = {
    1: "mt-0 mb-4 text-3xl font-medium tracking-[-0.03em] sm:text-4xl",
    2: "mt-14 mb-4 scroll-mt-24 border-b border-edge pb-2.5 text-2xl font-medium tracking-[-0.025em]",
    3: "mt-10 mb-3 scroll-mt-24 text-lg font-medium tracking-[-0.02em]",
    4: "mt-8 mb-2 scroll-mt-24 text-base font-medium",
  } as const;

  return function Heading({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof Tag>) {
    return (
      <Tag
        className={cn(sizes[level], "font-display text-ink", className)}
        {...props}
      />
    );
  };
}

function Anchor({
  href = "",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");

  if (isInternal) {
    return (
      <Link
        href={href}
        className={cn(
          "font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors duration-[--duration-fast] hover:decoration-brand",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors duration-[--duration-fast] hover:decoration-brand",
        className,
      )}
      {...props}
    />
  );
}

export const mdxComponents = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),

  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="my-4 leading-7 text-ink-muted" {...props} />
  ),

  a: Anchor,

  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul
      className="my-4 ml-6 list-disc space-y-2 text-ink-muted marker:text-ink-subtle"
      {...props}
    />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol
      className="my-4 ml-6 list-decimal space-y-2 text-ink-muted marker:text-ink-subtle"
      {...props}
    />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => (
    <li className="leading-7 [&>ul]:my-2 [&>ol]:my-2" {...props} />
  ),

  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-6 border-l-2 border-edge-strong pl-5 text-ink-muted italic"
      {...props}
    />
  ),

  hr: () => <hr className="my-10 border-edge" />,

  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-ink" {...props} />
  ),

  // Inline code. Fenced blocks arrive as `pre` and are handled by CodeBlock.
  //
  // This was `text-brand-300`, which put the accent on every identifier,
  // filename and flag in the corpus — on a page like self-hosting that is
  // dozens of amber fragments per screen, and it left links (the one thing a
  // reader can act on) indistinguishable from them. In the docs amber means a
  // link and nothing else; code is marked by the mono face and the fill.
  code: ({ className, ...props }: React.ComponentPropsWithoutRef<"code">) => (
    <code
      className={cn(
        "rounded-[0.3rem] border border-edge bg-raised px-[0.35em] py-[0.15em] font-mono text-[0.875em] text-ink",
        className,
      )}
      {...props}
    />
  ),

  pre: CodeBlock,

  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-edge">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: React.ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-raised" {...props} />
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th
      className="border-b border-edge px-4 py-2.5 text-left font-semibold text-ink"
      {...props}
    />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td
      className="border-b border-edge px-4 py-2.5 align-top text-ink-muted last:border-0"
      {...props}
    />
  ),

  img: ({ alt = "", ...props }: React.ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      loading="lazy"
      decoding="async"
      className="my-6 rounded-lg border border-edge"
      {...props}
    />
  ),

  Callout,
  Cards,
  Card,
  Steps,
};

export type MDXComponents = typeof mdxComponents;
