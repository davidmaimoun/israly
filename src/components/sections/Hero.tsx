import { useTranslations } from "next-intl";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Reveal } from "@/components/ui/Reveal";

const HERO_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO || "";
const HERO_IMAGE = process.env.NEXT_PUBLIC_HERO_IMAGE || "/img/hero.webp";

export function Hero() {
  const t = useTranslations("hero");
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Média plein cadre : voilé et lisible à gauche, net à droite */}
      <div className="absolute inset-0">
        {HERO_VIDEO ? (
          <video className="h-full w-full object-cover" autoPlay muted loop playsInline poster={HERO_IMAGE}>
            <source src={HERO_VIDEO} />
          </video>
        ) : (
          <Image src={HERO_IMAGE} alt="Israël" fill priority sizes="100vw" className="object-cover" />
        )}
        {/* Desktop : voile bien opaque sous le texte -> transparent à droite */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-bg from-38% via-bg/85 via-60% to-transparent md:block rtl:bg-gradient-to-l" />
        {/* Mobile : voile homogène */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/90 via-bg/80 to-bg/90 md:hidden" />
      </div>

      {/* Contenu pleine largeur avec padding */}
      <div className="relative z-10 w-full px-6 py-20 md:px-12 lg:px-16">
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
        className="absolute bottom-6 left-1/2 z-10 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-surface/80 text-primary shadow-[var(--shadow-soft)] ring-1 ring-stone backdrop-blur"
        style={{ animation: "bounceDown 1.8s ease-in-out infinite" }}
      >
        <ChevronDown size={22} />
      </a>
    </section>
  );
}
