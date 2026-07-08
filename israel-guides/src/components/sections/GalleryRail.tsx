"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { HScroll } from "@/components/ui/HScroll";

export type GalleryPhoto = { url: string; guideName: string; guideSlug: string; caption?: string };

export function GalleryRail({ photos }: { photos: GalleryPhoto[] }) {
  const t = useTranslations("gallery");
  if (!photos.length) return null;

  return (
    <section id="gallery" className="scroll-mt-20 overflow-hidden bg-cream py-14 md:py-20">
      <div className="mx-auto mb-6 flex max-w-7xl items-end justify-between gap-4 px-4 md:px-6">
        <div>
          <h2 className="display text-3xl md:text-4xl">{t("title")}</h2>
          <p className="mt-1 text-ink-soft">{t("subtitle")}</p>
        </div>
        <Link href="/gallery" className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary sm:inline-flex">
          {t("openFull")} <ArrowRight size={16} className="rtl:rotate-180" />
        </Link>
      </div>

      {/* Pleine largeur, bords alignés via pad */}
      <HScroll pad gapClass="gap-2">
        {photos.map((p, i) => (
          <Link
            key={p.url + i}
            href={`/guides/${p.guideSlug}`}
            className="group relative aspect-square w-[250px] shrink-0 snap-start overflow-hidden rounded-2xl bg-stone sm:w-[300px]"
          >
            <Image src={p.url} alt={p.caption || p.guideName} fill sizes="300px" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-3 pt-10">
              <span className="rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-ink">
                {t("byGuide", { name: p.guideName })}
              </span>
            </span>
          </Link>
        ))}
      </HScroll>

      <div className="mt-6 px-5 sm:hidden">
        <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
          {t("openFull")} <ArrowRight size={16} className="rtl:rotate-180" />
        </Link>
      </div>
    </section>
  );
}
