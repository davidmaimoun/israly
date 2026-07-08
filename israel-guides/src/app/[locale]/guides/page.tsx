export const dynamic = "force-dynamic";
import { Info } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GuideFilters } from "@/components/ui/GuideFilters";
import { GuideCard, type GuideCardData } from "@/components/ui/GuideCard";
import { guideSearchSchema } from "@/features/guides/schema";
import { LANGUAGE_CODES } from "@/lib/languages";
import { CITIES } from "@/lib/cities";
import { fullName } from "@/lib/utils";

export default async function GuidesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("guides");

  const parsed = guideSearchSchema.safeParse({
    lang: typeof sp.lang === "string" ? sp.lang : undefined,
    cities: typeof sp.cities === "string" ? sp.cities : (typeof sp.city === "string" ? sp.city : undefined),
    q: typeof sp.q === "string" ? sp.q : undefined,
    match: typeof sp.match === "string" ? sp.match : "all",
  });

  const filters = parsed.success ? parsed.data : { match: "all" as const };
  const langs = (filters.lang ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => LANGUAGE_CODES.includes(s as (typeof LANGUAGE_CODES)[number]));
  const cities = (filters.cities ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => (CITIES as readonly string[]).includes(s) && s !== "all" && s !== "other");
  const q = (filters.q ?? "").trim();

  // Query Prisma : langues (toutes/au moins une), villes (in, + guides "all"), nom.
  const where: Prisma.GuideWhereInput = { published: true };
  if (langs.length) {
    where.languages = filters.match === "any" ? { hasSome: langs } : { hasEvery: langs };
  }
  if (cities.length) {
    where.cities = { hasSome: [...cities, "all"] }; // un guide "toutes régions" matche toujours
  }
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
    ];
  }

  const guides = await prisma.guide.findMany({
    where,
    orderBy: { toursCompleted: "desc" },
  });

  const cards: GuideCardData[] = guides.map((g) => ({
    slug: g.slug,
    name: fullName(g),
    rating: g.rating ?? null,
    ratingCount: g.ratingCount,
    photo: g.photo,
    cities: g.cities,
    languages: g.languages,
    specialties: g.specialties,
    yearsExperience: g.yearsExperience,
    toursCompleted: g.toursCompleted,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <h1 className="display mb-2 text-3xl md:text-4xl">{t("title")}</h1>
        <p className="mb-4 text-ink-soft">{t("resultsCount", { count: cards.length })}</p>

        <div className="mb-6 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm text-ink-soft">
          <Info size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>{t("demoNotice")}</span>
        </div>

        <div className="mb-8">
          <GuideFilters
            initialLangs={langs}
            initialCities={cities}
            initialName={q}
            initialMatch={filters.match}
          />
        </div>

        {cards.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-stone bg-surface p-12 text-center text-ink-soft">
            {t("empty")}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
