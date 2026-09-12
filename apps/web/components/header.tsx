"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Github } from "lucide-react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  UserProfileDropdown,
  MobileUserProfile,
} from "@/components/ui/resizable-navbar";
import { useAuth } from "@/contexts/AuthContext";
import { siteConfig } from "@/lib/site";
import { Cmd } from "./commandMenu";

const PUBLIC_NAV = [
  { name: "Docs", link: "/docs" },
  { name: "Pricing", link: "/#pricing" },
];

const AUTHENTICATED_NAV = [
  { name: "Dashboard", link: "/dashboard" },
  { name: "Docs", link: "/docs" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollY, "change", (latest) => setVisible(latest > 100));

  const { user, isAuthenticated, logout } = useAuth();
  const navItems = isAuthenticated ? AUTHENTICATED_NAV : PUBLIC_NAV;

  /**
   * The sandbox is the one route that does not get this bar.
   *
   * It is a full-screen tool, and it already has a bar of its own — so the
   * marketing header sat on top of the IDE's chrome and cost 56px of vertical
   * space to say "devX" twice. The IDE folds the logo, the account menu and
   * the workspace's own controls into a single row instead; see
   * `components/sandbox/index.tsx`.
   *
   * Declared after every hook so the hook order never changes.
   */
  const isSandbox = pathname?.startsWith("/repl/") ?? false;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isSandbox) return null;

  return (
    <Navbar visible={visible} ref={ref}>
      {/* Desktop */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />

        {/* `relative z-20` so this group stays above the absolutely-positioned
            nav links, which span the full width of the bar. */}
        <div className="relative z-20 flex items-center gap-2">
          {/* An open-source project's most-clicked link, and it was not in the
              header at all. */}
          <a
            href={siteConfig.repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="DevEx on GitHub"
            title="DevEx on GitHub"
            className="rounded-md p-2 text-ink-subtle transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Github className="size-4" aria-hidden="true" />
          </a>

          {isAuthenticated && user ? (
            <UserProfileDropdown
              visible={visible}
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <>
              <NavbarButton
                as="button"
                variant="secondary"
                onClick={() => router.push("/login")}
              >
                Log in
              </NavbarButton>
              {/* This used to be "Book a call", which asked a developer
                  evaluating an open-source tool to schedule a sales meeting
                  before they had seen it run. Enterprise still has its own
                  route to a call, from the pricing table where it belongs. */}
              <NavbarButton as={Link} href="/login" variant="primary">
                Start a workspace
              </NavbarButton>
            </>
          )}
        </div>
      </NavBody>

      {/* Mobile */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <div className="flex items-center gap-2">
            {isAuthenticated && user && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt=""
                className="size-7 rounded-full object-cover"
              />
            )}
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {isAuthenticated && user ? (
            <MobileUserProfile
              user={user}
              onLogout={handleLogout}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          ) : null}

          <nav className="w-full">
            {navItems.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-ink-muted transition-colors duration-[--duration-fast] hover:bg-raised hover:text-ink"
              >
                {item.name}
              </Link>
            ))}
            <a
              href={siteConfig.repo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-ink-muted transition-colors duration-[--duration-fast] hover:bg-raised hover:text-ink"
            >
              <Github className="size-4" aria-hidden="true" />
              GitHub
            </a>
          </nav>

          <div className="flex w-full flex-col gap-3 border-t border-edge pt-4">
            <Cmd />
            {isAuthenticated ? null : (
              <NavbarButton
                as={Link}
                href="/login"
                variant="primary"
                className="w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Start a workspace
              </NavbarButton>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
