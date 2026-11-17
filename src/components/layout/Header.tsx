"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home", isHash: false },
  { href: "#about", label: "About us", isHash: true },
  { href: "#services", label: "Services", isHash: true },
  { href: "#contact", label: "Contact us", isHash: true },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Add a subtle shadow + backdrop on scroll
  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const linkBase =
    "inline-flex items-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-md px-1.5 py-1";
  const linkMuted = "text-gray-700/90 hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-300";
  const linkActive =
    "text-teal-700 dark:text-teal-300";

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b",
        // Glass background with graceful fallback if no backdrop-filter support
        "bg-white/60 dark:bg-neutral-950/40 supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-xl",
        "border-teal-900/5 dark:border-white/10",
        hasScrolled ? "shadow-sm" : "shadow-none",
      ].join(" ")}
    >
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-teal-700 px-3 py-2 rounded-md shadow-sm"
      >
        Skip to content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white grid place-items-center mr-2 shadow-md">
                <span className="font-extrabold text-lg">N</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                IsanoMed
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Primary"
            role="navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = !item.isHash && pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    linkBase,
                    isActive ? linkActive : linkMuted,
                  ].join(" ")}
                >
                  {item.label}
                  {/* active underline pill */}
                  <span
                    aria-hidden="true"
                    className={[
                      "block h-[2px] w-0 rounded-full bg-current mt-1 transition-all duration-200",
                      isActive ? "w-full" : "group-hover:w-full",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow focus-visible:ring-teal-500"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm hover:shadow focus-visible:ring-teal-500"
              >
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen((v) => !v)}
              className="rounded-lg"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className={[
            "md:hidden overflow-hidden transition-[grid-template-rows] duration-300",
            isMenuOpen ? "grid grid-rows-[1fr]" : "grid grid-rows-[0fr]",
          ].join(" ")}
        >
          <div
            className="min-h-0"
            role="menu"
            aria-label="Mobile"
          >
            <div className="border-t border-teal-900/5 dark:border-white/10 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = !item.isHash && pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={[
                      "block rounded-lg px-3 py-2",
                      "transition-colors",
                      isActive
                        ? "text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-white/5"
                        : "text-gray-800 dark:text-gray-200 hover:bg-teal-50/60 dark:hover:bg-white/5 hover:text-teal-700 dark:hover:text-teal-300",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="pt-3 grid grid-cols-2 gap-2">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full backdrop-blur bg-white/60 dark:bg-white/5 border-teal-300/60 dark:border-teal-800/50"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
