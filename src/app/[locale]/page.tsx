export const dynamic = "force-dynamic";
import { setRequestLocale } from "next-intl/server";
import { fullName, localized } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { GuidesRail, type RailGuide } from "@/components/sections/GuidesRail";
import { GalleryRail, type GalleryPhoto } from "@/components/sections/GalleryRail";
import { PopularCities } from "@/components/sections/PopularCities";
import { Testimonials } from "@/components/sections/Testimonials";
import { PlanVisit } from "@/components/sections/PlanVisit";
import { Contact } from "@/components/sections/Contact";
import type { Locale } from "@/i18n/config";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const guides = await prisma.guide.findMany({
    where: { published: true },
    orderBy: [{ rating: "desc" }, { toursCompleted: "desc" }],
    take: 12,
  });

  const railGuides: RailGuide[] = guides.map((g) => ({
    slug: g.slug,
    name: fullName(g),
    photo: g.photo,
    city: g.city,
    languages: g.languages,
    bio: localized(g.bio, locale as Locale),
  }));

  // Galerie agrégée : photos de tous les guides, badge = nom du guide.
  const photos: GalleryPhoto[] = guides.flatMap((g) =>
    g.gallery
      .filter((m) => m.type === "photo")
      .map((m) => ({ url: m.url, caption: m.caption ?? "", guideName: fullName(g), guideSlug: g.slug })),
  );

  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <GuidesRail guides={railGuides} />
        <PopularCities />
        <GalleryRail photos={photos.slice(0, 14)} />
        <PlanVisit />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
