import { siteConfig } from "@/lib/site";

/**
 * The plans, in one place.
 *
 * Four surfaces quote these numbers now — the landing section, the `/pricing`
 * route, `/pricing.md`, and the `Offer` nodes in the JSON-LD — and three of
 * them are read by machines that will happily repeat a stale figure forever.
 * So the table lives here and nobody retypes it.
 *
 * The spec rows are deliberately the Kubernetes units, because that is what
 * the limits genuinely are: `125m` is a CPU millicore request, `256Mi` is the
 * memory limit on the pod.
 */

export const SPEC_ROWS = [
  "Workspaces",
  "CPU each",
  "Memory each",
  "Persisted",
] as const;

export interface Plan {
  name: string;
  /** USD per month, billed monthly. */
  price: number;
  /** USD per month, when billed annually. */
  yearlyPrice: number;
  summary: string;
  /** Indexed against SPEC_ROWS. Same length, same order, in every plan. */
  specs: readonly string[];
  extras: readonly string[];
  cta: string;
  href: string;
  external?: boolean;
  popular?: boolean;
}

export const PLANS: readonly Plan[] = [
  {
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    summary: "Enough to keep a side project alive.",
    specs: ["2", "125m", "256Mi", "200MB"],
    extras: [
      "Every base template",
      "Public port forwarding",
      "Community support",
    ],
    cta: "Start coding",
    href: "/dashboard",
  },
  {
    name: "Professional",
    price: 15,
    yearlyPrice: 12,
    summary: "A workspace per branch, warm and waiting.",
    specs: ["25", "1250m", "2.5Gi", "15GB"],
    extras: [
      "Premium template library",
      "GitHub Actions integration",
      "Usage analytics",
      "Priority support",
    ],
    cta: "Go professional",
    href: "/dashboard",
    popular: true,
  },
  {
    name: "Enterprise",
    price: 99,
    yearlyPrice: 79,
    summary: "Our sandboxes, running inside your product.",
    specs: ["Unlimited", "Custom", "Custom", "Unlimited"],
    extras: [
      "Sandbox SDK access",
      "10k API requests/hour",
      "Custom integrations",
      "SLA and a named contact",
    ],
    cta: "Talk to us",
    href: siteConfig.links.call,
    external: true,
  },
];

/** The one sentence that has to appear anywhere the plans do. */
export const SELF_HOST_NOTE =
  "Self-hosting is free and unlimited. DevEx is MIT-licensed; bring your own Kubernetes cluster and none of the above applies.";

/** `/pricing.md` — the plans as markdown, for agents comparing products. */
export function pricingMarkdown(): string {
  const header = `| Plan | ${SPEC_ROWS.join(" | ")} | Monthly | Annual (per month) |`;
  const divider = `| --- | ${SPEC_ROWS.map(() => "---").join(" | ")} | --- | --- |`;
  const rows = PLANS.map(
    (plan) =>
      `| ${plan.name} | ${plan.specs.join(" | ")} | ${plan.price === 0 ? "Free" : `$${plan.price}`} | ${plan.yearlyPrice === 0 ? "Free" : `$${plan.yearlyPrice}`} |`,
  );

  const detail = PLANS.map((plan) =>
    [
      `## ${plan.name}`,
      "",
      plan.summary,
      "",
      plan.price === 0
        ? "**Free.** No card required."
        : `**$${plan.price}/month**, or $${plan.yearlyPrice}/month billed annually (a 20% saving).`,
      "",
      ...SPEC_ROWS.map((row, index) => `- ${row}: ${plan.specs[index]}`),
      ...plan.extras.map((extra) => `- ${extra}`),
      "",
    ].join("\n"),
  );

  return [
    "# DevEx pricing",
    "",
    "Every plan runs the same containers on the same Kubernetes cluster. What changes is how many you get at once, and how much you can ask of each.",
    "",
    "Currency: USD. Billing period: monthly or annual.",
    "",
    header,
    divider,
    ...rows,
    "",
    ...detail,
    "## Self-hosting",
    "",
    SELF_HOST_NOTE,
    "",
    `See ${siteConfig.url}/docs/self-hosting for the deployment guide.`,
    "",
  ].join("\n");
}
