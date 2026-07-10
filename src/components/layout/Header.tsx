"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Menu, X, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = ["how", "guides", "cities", "gallery", "plan", "contact"] as const;

export function Header() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const onDark = isHome && !scrolled; // survol du hero foncé : liens clairs

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-40 border-b transition-all duration-300",
        isHome ? "fixed" : "sticky",
        onDark
          ? "border-transparent bg-transparent"
          : "border-stone/40 bg-white/85 shadow-sm backdrop-blur-md",
      )}
    >
      {/* Barre fine décorative en haut */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-secondary" />
      <div className="flex w-full items-center justify-between px-6 py-3 md:px-12 lg:px-16">
        <Link href="/" className="flex items-center" aria-label="Israly">
          <img src="/img/israly-logo.svg" alt="Israly" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {SECTIONS.map((id) =>
            id === "plan" ? (
              <Link
                key={id}
                href={`/#${id}`}
                className="pulse-cta inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
              >
                <CalendarDays size={15} /> {t(id)}
              </Link>
            ) : (
              <Link
                key={id}
                href={`/#${id}`}
                className={cn(
                  "text-sm font-medium transition-colors",
                  onDark
                    ? "text-white hover:text-white/80"
                    : (active === id ? "text-primary" : "text-ink-soft hover:text-primary"),
                )}
              >
                {t(id)}
              </Link>
            ),
          )}
          <LanguageSwitcher onDark={onDark} />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher onDark={onDark} />
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className={cn("p-1", onDark && "text-cream")}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-stone bg-cream px-6 py-3 md:hidden">
          {SECTIONS.map((id) =>
            id === "plan" ? (
              <Link
                key={id}
                href={`/#${id}`}
                onClick={() => setOpen(false)}
                className="pulse-cta my-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream"
              >
                <CalendarDays size={15} /> {t(id)}
              </Link>
            ) : (
              <Link key={id} href={`/#${id}`} onClick={() => setOpen(false)} className="py-2 text-ink-soft">
                {t(id)}
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}