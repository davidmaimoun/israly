"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Menu, X, CalendarDays, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = ["how", "guides", "cities", "gallery", "plan", "contact"] as const;

export function Header() {
  const t = useTranslations("nav");
  const ts = useTranslations("search");
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const isHome = pathname === "/";
  const onDark = isHome && !scrolled; // survol du hero foncé : liens clairs
  const showSearch = !isHome || pastHero; // search visible dès que le hero n'est plus visible

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setPastHero(window.scrollY > window.innerHeight * 0.75);
    };
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

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/guides?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  };

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-40 border-b transition-all duration-300",
        isHome ? "fixed" : "sticky",
        // Mobile : toujours blanc (évite le clignotement dû à la barre d'adresse).
        "border-stone/40 bg-white shadow-sm",
        // Desktop : transparent en haut du hero -> verre dépoli au scroll.
        onDark
          ? "md:border-transparent md:bg-transparent md:shadow-none"
          : "md:border-stone/40 md:bg-white/85 md:shadow-sm md:backdrop-blur-md",
      )}
    >
      {/* Barre fine décorative en haut */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-secondary" />

      <div className="flex w-full items-center justify-between gap-3 px-4 py-2 md:px-6 md:py-2.5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Israly">
          <img src="/img/israly-logo.svg" alt="Israly" className="h-8 w-auto md:h-9" />
        </Link>

        {/* Search desktop : entre logo et liens, apparaît quand le hero n'est plus visible */}
        <form
          onSubmit={submitSearch}
          className={cn(
            "hidden min-w-0 max-w-sm flex-1 items-center gap-2 rounded-full border border-stone bg-white px-3.5 py-1.5 shadow-sm transition-all duration-300 md:flex",
            showSearch ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Search size={16} className="shrink-0 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ts("shortPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
          />
        </form>

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
                    : active === id
                      ? "text-primary"
                      : "text-ink-soft hover:text-primary",
                )}
              >
                {t(id)}
              </Link>
            ),
          )}
          <LanguageSwitcher onDark={onDark} />
        </nav>

        {/* Mobile : bouton Plan TOUJOURS visible + langue + menu */}
        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <Link
            href="/#plan"
            className="pulse-cta inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-xs font-semibold text-cream"
          >
            <CalendarDays size={14} /> {t("plan")}
          </Link>
          <LanguageSwitcher onDark={false} />
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className="p-1 text-ink">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile : 2e ligne = search, dès que le hero n'est plus visible */}
      {showSearch && (
        <div className="border-t border-stone/40 bg-white px-4 pb-3 pt-2 md:hidden">
          <form
            onSubmit={submitSearch}
            className="flex items-center gap-2.5 rounded-full border border-stone bg-cream/40 px-5 py-3.5 shadow-sm"
          >
            <Search size={20} className="shrink-0 text-ink-soft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={ts("shortPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/70"
            />
          </form>
        </div>
      )}

      {open && (
        <nav className="flex flex-col gap-1 border-t border-stone bg-cream px-6 py-3 md:hidden">
          {SECTIONS.filter((id) => id !== "plan").map((id) => (
            <Link key={id} href={`/#${id}`} onClick={() => setOpen(false)} className="py-2 text-ink-soft">
              {t(id)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}