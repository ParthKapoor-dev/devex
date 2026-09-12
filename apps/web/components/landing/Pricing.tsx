"use client";

import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
// `framer-motion` is not a dependency — it only resolved because `motion`
// happens to depend on it. Import from `motion/react`, as everywhere else.
import { motion } from "motion/react";
import {
  Star,
  Zap,
  Code,
  Database,
  Cpu,
  HardDrive,
  GitBranch,
  Box,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { siteConfig } from "@/lib/site";

// Define your plans with DevX-specific features
const plans = [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    period: "forever",
    badge: "Perfect for Learning",
    features: [
      { icon: Code, text: "Up to 2 REPLs" },
      { icon: Cpu, text: "125m CPU per REPL" },
      { icon: HardDrive, text: "256Mi RAM per REPL" },
      { icon: Database, text: "200MB backup storage" },
      { icon: Box, text: "Basic container templates" },
      { icon: Shield, text: "Community support" },
    ],
    description: "Get started with cloud development for free",
    buttonText: "Start Coding",
    href: "/dashboard",
    isPopular: false,
    tint: "from-ink-subtle/10 to-transparent",
  },
  {
    name: "PROFESSIONAL",
    price: "15",
    yearlyPrice: "12",
    period: "per month",
    badge: "Most Popular",
    features: [
      { icon: Code, text: "Up to 25 REPLs" },
      { icon: Cpu, text: "1.25 CPU cores per REPL" },
      { icon: HardDrive, text: "2.5GB RAM per REPL" },
      { icon: Database, text: "15GB backup storage" },
      { icon: Sparkles, text: "Premium templates library" },
      { icon: GitBranch, text: "GitHub Actions integration" },
      { icon: Shield, text: "Priority support" },
      { icon: Zap, text: "Advanced analytics" },
    ],
    description: "Perfect for professional developers and teams",
    buttonText: "Go Professional",
    href: "/dashboard",
    isPopular: true,
    tint: "from-brand/20 to-transparent",
  },
  {
    name: "ENTERPRISE SDK",
    price: "99",
    yearlyPrice: "79",
    period: "per month",
    badge: "For Businesses",
    features: [
      { icon: Code, text: "Unlimited REPLs" },
      { icon: Cpu, text: "Custom resource allocation" },
      { icon: Database, text: "Unlimited backup storage" },
      { icon: Box, text: "DevX Sandbox SDK access" },
      { icon: Zap, text: "API rate limiting: 10k/hour" },
      { icon: GitBranch, text: "Custom integrations" },
      { icon: Shield, text: "SLA & dedicated support" },
      { icon: Sparkles, text: "White-label options" },
    ],
    description: "Integrate DevX sandboxes into your applications",
    buttonText: "Contact Sales",
    href: "https://parthkapoor.me",
    isPopular: false,
    tint: "from-info/15 to-transparent",
  },
];

interface PricingFeature {
  icon: any;
  text: string;
}

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  badge: string;
  features: PricingFeature[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  tint: string;
}

export default function DevXPricing() {
  const [isMonthly, setIsMonthly] = useState(true);
  const switchRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 60,
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        // Brand ramp only — the old mix pulled in purple and amber, which
        // appear nowhere else in the product.
        colors: ["#6ee7b7", "#34d399", "#10b981", "#059669"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle", "square"],
      });
    }
  };

  return (
    <div className="container py-20 max-md:px-8">
      {/* Header */}
      <div className="mb-16 flex flex-col gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-gradient-brand text-4xl font-bold tracking-tight sm:text-5xl">
            Power Up Your Development
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted">
            From learning to enterprise-scale applications, DevX scales with
            your needs. Choose the perfect plan for your cloud development
            journey.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center items-center gap-4"
        >
          <span
            className={cn(
              "font-semibold transition-colors",
              isMonthly ? "text-ink" : "text-ink-subtle",
            )}
          >
            Monthly
          </span>
          <label className="relative inline-flex cursor-pointer items-center">
            <Switch
              ref={switchRef as any}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </label>
          <span
            className={cn(
              "font-semibold transition-colors",
              !isMonthly ? "text-ink" : "text-ink-subtle",
            )}
          >
            Annual
          </span>
          <span className="ml-2 rounded-full bg-brand px-2.5 py-1 text-sm font-semibold text-brand-fg">
            Save 20%
          </span>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-0 max-md:gap-4 md:grid-cols-3 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={
              !isMobile
                ? {
                    opacity: 1,
                    y: plan.isPopular ? -10 : 0,
                    x: index === 2 ? -20 : index === 0 ? 20 : 0,
                    scale: index === 0 || index === 2 ? 0.95 : 1.0,
                  }
                : { opacity: 1, y: 0 }
            }
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: index * 0.1,
            }}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-surface/70 p-8 text-center",
              plan.isPopular
                ? "border-brand/50 glow-brand"
                : "border-edge",
              "transform-gpu transition-colors duration-[--duration-normal] hover:border-brand/40",
              index === 0 || index === 2 ? "z-0" : "z-10",
            )}
          >
            {/* Background Gradient */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br",
                plan.tint,
              )}
            />

            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full bg-brand px-4 py-1.5">
                  <Star className="size-3.5 fill-current text-brand-fg" />
                  <span className="text-sm font-semibold text-brand-fg">
                    Most Popular
                  </span>
                </div>
              </div>
            )}

            <div className="relative z-10 flex flex-1 flex-col">
              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="mb-2 text-xl font-bold tracking-tight text-ink">
                  {plan.name}
                </h3>
                <p className="text-sm font-medium text-ink-subtle">
                  {plan.badge}
                </p>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-5xl font-bold text-ink">
                    <NumberFlow
                      value={
                        isMonthly
                          ? Number(plan.price)
                          : Number(plan.yearlyPrice)
                      }
                      format={{
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }}
                      transformTiming={{
                        duration: 500,
                        easing: "ease-out",
                      }}
                      willChange
                      className="font-variant-numeric: tabular-nums"
                    />
                  </span>
                  {plan.period !== "forever" && (
                    <span className="text-sm text-ink-muted">
                      / {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-subtle">
                  {plan.period === "forever"
                    ? "No credit card required"
                    : isMonthly
                      ? "billed monthly"
                      : "billed annually"}
                </p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15">
                      <feature.icon className="size-3 text-brand" />
                    </div>
                    <span className="text-left text-sm text-ink-muted">
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "group relative w-full gap-2 overflow-hidden rounded-lg py-6 text-base font-semibold tracking-tight transition-colors duration-[--duration-normal]",
                  plan.isPopular
                    ? "border-0 bg-brand text-brand-fg hover:bg-brand-400"
                    : "border-edge-strong bg-transparent text-ink hover:border-brand/50 hover:bg-raised",
                )}
              >
                {plan.buttonText}
              </Link>

              {/* Description */}
              <p className="mt-4 text-xs leading-relaxed text-ink-subtle">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-16 text-center"
      >
        <p className="mb-4 text-ink-muted">
          Need something custom? We&apos;re here to help.
        </p>
        <Link
          /* There is no /contact route — this was a 404. Book a call instead. */
          href={siteConfig.links.call}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-brand transition-colors duration-[--duration-fast] hover:text-brand-300"
        >
          Contact our team <Zap className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
