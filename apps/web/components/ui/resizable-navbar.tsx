"use client";

import React, { RefObject, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  IconMenu2,
  IconX,
  IconChevronDown,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Cmd } from "../commandMenu";
import { DevExLogoDark } from "../icons/logo";

/**
 * The site header.
 *
 * Originally vendored from Aceternity and never finished migrating onto the
 * tokens, which had left it in a state where several of its own effects did
 * not work:
 *
 * - `bg-ink` was used as a *background* in five places. `ink` is the text
 *   colour — on the dark theme that is a near-white pill, which is why the
 *   primary call to action on every page was white and not the brand colour.
 * - The shrink-on-scroll animated `width` to 40% under a `minWidth: 800px`,
 *   so on any viewport below 2000px the clamp won and the pill barely moved.
 * - The nav row carried `hover:text-zinc-800`: dark grey text, on hover, on a
 *   near-black background.
 * - Nav items were bare `<a href>`, so every click on "Docs" threw away the
 *   client and did a full document load. On a site whose pitch is that things
 *   are fast, the navigation was the slowest thing on it.
 * - The six-part box shadow is Aceternity's, tuned for a white page: every
 *   layer is a blue-grey at 4–8% over black, i.e. invisible.
 *
 * The behaviour is kept — a full-width bar that contracts into a floating pill
 * once you scroll — because it is a nice piece of the product's character. It
 * just works now, and it is spring-timed off the motion tokens rather than
 * hardcoded milliseconds.
 */

/**
 * `max-w-5xl` (1024px) plus this bar's own 24px of side padding, so the logo
 * sits exactly on the left edge of the hairline rule at the top of every
 * section below it. The old bar had `px-32` and lined up with nothing.
 */
const REST_WIDTH = 1072;
/** The contracted pill. Wide enough for the logo, two links and two buttons. */
const PILL_WIDTH = 820;

/** Black, because the page is black. The vendored shadow was blue-grey. */
const FLOAT_SHADOW =
  "0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 12px 32px -12px rgb(0 0 0 / 0.8)";

const SPRING = { type: "spring", stiffness: 220, damping: 32 } as const;

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
  visible: boolean;
  ref: RefObject<HTMLDivElement | null>;
}

export const Navbar = ({ children, className, visible, ref }: NavbarProps) => {
  return (
    <div ref={ref} className={cn("fixed inset-x-0 top-0 z-40 w-full", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </div>
  );
};

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{
        maxWidth: visible ? PILL_WIDTH : REST_WIDTH,
        y: visible ? 12 : 0,
        borderRadius: visible ? 999 : 0,
        boxShadow: visible ? FLOAT_SHADOW : "0 0 0 0 rgb(0 0 0 / 0)",
      }}
      transition={reducedMotion ? { duration: 0 } : SPRING}
      className={cn(
        "relative z-[60] mx-auto hidden w-full flex-row items-center justify-between",
        "px-6 py-3 transition-colors duration-[--duration-normal] lg:flex",
        visible
          ? "border border-edge bg-surface/75 backdrop-blur-xl"
          : "border border-transparent bg-transparent",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

interface NavItemsProps {
  items: { name: string; link: string }[];
  className?: string;
  onItemClick?: () => void;
}

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center gap-1 text-sm lg:flex",
        className,
      )}
    >
      {items.map((item, index) => (
        <Link
          key={item.link}
          href={item.link}
          onMouseEnter={() => setHovered(index)}
          onClick={onItemClick}
          className={cn(
            "relative rounded-full px-3.5 py-1.5 text-ink-muted",
            "transition-colors duration-[--duration-fast] hover:text-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          )}
        >
          {hovered === index ? (
            <motion.span
              layoutId="nav-hover"
              className="absolute inset-0 rounded-full bg-raised"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          ) : null}
          <span className="relative z-20">{item.name}</span>
        </Link>
      ))}
      <Cmd compact />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Account                                                                    */
/* -------------------------------------------------------------------------- */

interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

const MENU_ROW =
  "flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:bg-raised hover:text-ink";

export const UserProfileDropdown = ({
  user,
  onLogout,
  className,
  visible,
}: {
  user: User;
  onLogout: () => void;
  className?: string;
  visible: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "flex items-center gap-2 rounded-full p-1 pr-2",
          "transition-colors duration-[--duration-fast] hover:bg-raised",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.avatar_url}
          alt=""
          className="size-7 rounded-full object-cover"
        />
        {!visible && (
          <span className="hidden font-mono text-xs text-ink-muted sm:block">
            {user.login}
          </span>
        )}
        <IconChevronDown
          className={cn(
            "size-4 text-ink-subtle transition-transform duration-[--duration-fast]",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <button
              type="button"
              aria-label="Close account menu"
              className="fixed inset-0 z-[70] cursor-default"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full z-[80] mt-2 w-52 overflow-hidden rounded-lg border border-edge bg-overlay shadow-[0_16px_48px_-16px_rgb(0_0_0/0.8)]"
            >
              <AccountHeader user={user} />
              <AccountActions
                onLogout={onLogout}
                onClose={() => setIsOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MobileUserProfile = ({
  user,
  onLogout,
  onClose,
  className,
}: {
  user: User;
  onLogout: () => void;
  onClose: () => void;
  className?: string;
}) => {
  return (
    <div className={cn("w-full", className)}>
      <AccountHeader user={user} />
      <AccountActions onLogout={onLogout} onClose={onClose} />
    </div>
  );
};

function AccountHeader({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-edge p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={user.avatar_url}
        alt=""
        className="size-8 rounded-full object-cover"
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-ink">
          {user.name || user.login}
        </div>
        <div className="truncate font-mono text-xs text-ink-subtle">
          @{user.login}
        </div>
      </div>
    </div>
  );
}

function AccountActions({
  onLogout,
  onClose,
}: {
  onLogout: () => void;
  onClose: () => void;
}) {
  return (
    <div className="py-1">
      <Link href="/dashboard" onClick={onClose} className={MENU_ROW}>
        <IconUser className="size-4" />
        Dashboard
      </Link>

      <button
        type="button"
        onClick={() => {
          onClose();
          onLogout();
        }}
        className={cn(MENU_ROW, "hover:bg-danger/10 hover:text-danger")}
      >
        <IconLogout className="size-4" />
        Log out
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile                                                                     */
/* -------------------------------------------------------------------------- */

export const MobileNav = ({
  children,
  className,
  visible,
}: {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{
        y: visible ? 8 : 0,
        borderRadius: visible ? 12 : 0,
        boxShadow: visible ? FLOAT_SHADOW : "0 0 0 0 rgb(0 0 0 / 0)",
      }}
      transition={reducedMotion ? { duration: 0 } : SPRING}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col",
        "items-center justify-between px-3 py-2.5",
        "transition-colors duration-[--duration-normal] lg:hidden",
        visible
          ? "border border-edge bg-surface/80 backdrop-blur-xl"
          : "border border-transparent bg-transparent",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn("flex w-full flex-row items-center justify-between", className)}
  >
    {children}
  </div>
);

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start gap-4",
          "rounded-lg border border-edge bg-overlay px-4 py-6",
          "shadow-[0_24px_64px_-24px_rgb(0_0_0/0.9)]",
          className,
        )}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  const Icon = isOpen ? IconX : IconMenu2;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className={cn(
        "rounded-md p-1 text-ink-muted transition-colors duration-[--duration-fast]",
        "hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* Bits                                                                       */
/* -------------------------------------------------------------------------- */

export const NavbarLogo = () => (
  <Link
    href="/"
    className={cn(
      "relative z-20 flex items-center gap-2 rounded-md px-1 py-1",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    )}
  >
    <DevExLogoDark />
    <span className="font-display text-lg font-medium tracking-[-0.02em] text-ink">
      devX
    </span>
  </Link>
);

const BUTTON_BASE = cn(
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4",
  "text-sm font-medium transition-colors duration-[--duration-fast]",
  "cursor-pointer whitespace-nowrap",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
);

const BUTTON_VARIANTS = {
  /** The one action we want taken. Brand fill, and only ever one on screen. */
  primary: "bg-brand text-brand-fg hover:bg-brand-400",
  /** Present but not competing. */
  secondary: "bg-transparent text-ink-muted hover:text-ink",
  outline: "border border-edge text-ink hover:border-edge-strong hover:bg-raised",
} as const;

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof BUTTON_VARIANTS;
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => (
  <Tag
    href={href || undefined}
    className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)}
    {...props}
  >
    {children}
  </Tag>
);
