"use client";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Cmd } from "./commandMenu";
import { useMotionValueEvent, useScroll } from "motion/react";

export default function Header() {
  const router = useRouter();

  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });
  const { user, isAuthenticated, logout } = useAuth();

  // Navigation items for unauthenticated users
  const publicNavItems = [
    {
      name: "Docs",
      link: "/docs",
    },
    {
      name: "Pricing",
      link: "#pricing",
    },
  ];

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    {
      name: "Dashboard",
      link: "/dashboard",
    },
    {
      name: "Docs",
      link: "/docs",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  function handleCall() {
    router.push("https://cal.com/parthkapoor");
  }

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <Navbar visible={visible} ref={ref}>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <UserProfileDropdown
                visible={visible}
                user={user}
                onLogout={handleLogout}
              />
              <NavbarButton variant="primary" onClick={handleCall}>
                Book a call
              </NavbarButton>
            </>
          ) : (
            <>
              <NavbarButton
                variant="secondary"
                onClick={() => router.push("/login")}
              >
                Login
              </NavbarButton>
              <NavbarButton variant="primary" onClick={handleCall}>
                Book a call
              </NavbarButton>
            </>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <div className="flex items-center gap-3">
            {isAuthenticated && user && (
              <img
                src={user.avatar_url}
                alt={user.name || user.login}
                className="h-8 w-8 rounded-full object-cover"
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
            <>
              {/* User Profile Section */}
              <MobileUserProfile
                user={user}
                onLogout={handleLogout}
                onClose={() => setIsMobileMenuOpen(false)}
              />

              {/* Navigation Items */}
              <div className="w-full border-t border-edge dark:border-neutral-700 pt-4">
                {navItems.map((item, idx) => (
                  <Link
                    key={`mobile-link-${idx}`}
                    href={item.link}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-raised dark:hover:bg-raised transition-colors duration-200 rounded-md"
                  >
                    <span className="block">{item.name}</span>
                  </Link>
                ))}
              </div>

              {/* Action Button */}
              <div className="w-full border-t border-edge dark:border-neutral-700 pt-4 flex flex-col gap-4">
                <Cmd />
                <NavbarButton
                  onClick={() => {
                    handleCall();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="primary"
                  className="w-full"
                >
                  Book a call
                </NavbarButton>
              </div>
            </>
          ) : (
            <>
              {/* Navigation Items for Unauthenticated Users */}
              {navItems.map((item, idx) => (
                <Link
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative text-neutral-600 dark:text-neutral-300"
                >
                  <span className="block">{item.name}</span>
                </Link>
              ))}

              {/* Action Buttons for Unauthenticated Users */}
              <div className="flex w-full flex-col gap-4">
                <Cmd />
                <NavbarButton
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/login");
                  }}
                  variant="primary"
                  className="w-full"
                >
                  Login
                </NavbarButton>
                <NavbarButton
                  onClick={() => {
                    handleCall();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="primary"
                  className="w-full"
                >
                  Book a call
                </NavbarButton>
              </div>
            </>
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
