"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { HScroll } from "@/components/ui/HScroll";
import { LanguageFlags } from "@/components/ui/LanguageFlags";

export type RailGuide = {
  slug: string;
  name: string;
  photo: string | null;
  cities: string[];
  languages: string[];
  bio: string;
};

export function GuidesRail({ guides }: { guides: RailGuide[] }) {
  const t = useTranslations("featured");
  const tg = useTranslations("guides");
  if (!guides.length) return null;

  return (
    <section id="guides" className="scroll-mt-20 overflow-hidden py-14 md:py-20">
      <div className="mx-auto mb-7 flex max-w-7xl items-end justify-between gap-4 px-4 md:px-6">
        <div>
          <h2 className="display text-3xl md:text-4xl">{t("title")}</h2>
          <p className="mt-1 text-ink-soft">{t("subtitle")}</p>
        </div>
        <Link href="/guides" className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary sm:inline-flex">
          {t("cta")} <ArrowRight size={16} className="rtl:rotate-180" />
        </Link>
      </div>

      <HScroll pad>
        {guides.map((g) => (
          <article
            key={g.slug}
            className="group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--radius-card)] border border-stone/60 bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] sm:w-[280px]"
          >
            <Link href={`/guides/${g.slug}`} className="relative block aspect-[5/4] overflow-hidden">
              <Image
                src={g.photo || "/img/guide-placeholder.jpg"}
                alt={g.name}
                fill
                sizes="280px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h3 className="display text-lg text-ink">{g.name}</h3>
              <p className="line-clamp-2 text-sm text-ink-soft">{g.bio}</p>
              <LanguageFlags codes={g.languages} />
              <Link
                href={`/guides/${g.slug}`}
                className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent/20 text-sm font-semibold text-secondary transition-colors hover:bg-accent/35"
              >
                {tg("viewProfile")} <ArrowRight size={15} className="rtl:rotate-180" />
              </Link>
            </div>
          </article>
        ))}
      </HScroll>
    </section>
  );
}
