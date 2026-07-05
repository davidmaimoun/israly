import Image from "next/image";
import { useTranslations } from "next-intl";
import { ButtonLink } from "./Button";
import { LanguageFlags } from "./LanguageFlags";

export type GuideCardData = {
  slug: string;
  name: string;
  photo: string | null;
  city: string;
  languages: string[];
  specialties: string[];
  yearsExperience: number;
  toursCompleted: number;
  rating?: number | null;
  ratingCount?: number;
};

export function GuideCard({ guide }: { guide: GuideCardData }) {
  const t = useTranslations("guides");
  const ts = useTranslations("specialties");

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-stone/70 bg-surface shadow-[var(--shadow-soft)] transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={guide.photo || "/img/guide-placeholder.jpg"}
          alt={guide.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="display text-xl text-ink">{guide.name}</h3>
          <p className="text-sm text-ink-soft">
            {t("experience", { years: guide.yearsExperience })} ·{" "}
            {t("tours", { count: guide.toursCompleted })}
          </p>

        </div>
        <LanguageFlags codes={guide.languages} />
        <div className="flex flex-wrap gap-1.5">
          {guide.specialties.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-accent/20 px-2.5 py-1 text-xs text-secondary">
              {ts(s)}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-2">
          <ButtonLink href={`/guides/${guide.slug}`} variant="outline" size="sm" className="w-full">
            {t("viewProfile")}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
