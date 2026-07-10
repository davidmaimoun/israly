import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Reveal } from "@/components/ui/Reveal";

const HERO_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO || "";
const HERO_IMAGE = process.env.NEXT_PUBLIC_HERO_IMAGE || "/img/hero.webp";

export function Hero() {
  const t = useTranslations("hero");
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Média plein cadre : voilé et lisible à gauche, net à droite */}
      <div className="absolute inset-0">
        {HERO_VIDEO ? (
          <video className="h-full w-full object-cover" autoPlay muted loop playsInline poster={HERO_IMAGE}>
            <source src={HERO_VIDEO} />
          </video>
        ) : (
          // Fond fixe (parallax au scroll) sur desktop ; couverture normale sur mobile (iOS ignore bg-fixed)
          <div className="absolute inset-0 bg-cover bg-center md:bg-fixed" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        )}
        {/* Desktop : voile sous le texte -> transparent à droite (photo bien visible) */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-bg from-8% via-bg/55 via-58% to-transparent md:block rtl:bg-gradient-to-l" />
        {/* Mobile : voile plus dense pour la lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/92 via-bg/72 to-bg/88 md:hidden" />
      </div>

      {/* Contenu pleine largeur avec padding */}
      <div className="relative z-10 w-full px-6 py-14 md:px-12 md:py-16 lg:px-16">
        <div className="w-full max-w-xl">
          <Reveal>
            <p className="eyebrow mb-4">{t("eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="display text-4xl leading-[1.08] text-ink sm:text-5xl md:text-6xl">
              {t("titleBefore")} <span className="accent-word">{t("titleAccent")}</span>{" "}
              {t("titleAfter")}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">{t("subtitle")}</p>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-2 text-secondary" style={{ fontFamily: "var(--font-accent)" }}>{t("signature")}</p>
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-8">
              <SearchBar />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Invitation à scroller */}
      <a
        href="#how"
        aria-label="Scroll"
        className="absolute bottom-5 left-1/2 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-surface/45 text-ink/60 ring-1 ring-stone/40 backdrop-blur transition hover:bg-surface/70 hover:text-primary"
        style={{ animation: "bounceDown 1.8s ease-in-out infinite" }}
      >
        <ChevronDown size={18} />
      </a>
    </section>
  );
}