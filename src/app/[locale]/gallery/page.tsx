export const dynamic = "force-dynamic";

import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "@/i18n/navigation";
import { fullName } from "@/lib/utils";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

  const guides = await prisma.guide.findMany({
    where: { published: true },
    select: { slug: true, firstName: true, lastName: true, gallery: true },
  });

  const photos = guides.flatMap((g) =>
    g.gallery
      .filter((m) => m.type === "photo")
      .map((m) => ({ url: m.url, caption: m.caption ?? "", guideName: fullName(g), guideSlug: g.slug })),
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-3 py-14 md:px-5 md:py-20">
        <div className="mb-8 px-2 text-center">
          <h1 className="display text-3xl md:text-4xl">{t("title")}</h1>
          <p className="mt-1 text-ink-soft">{t("subtitle")}</p>
        </div>

        {photos.length === 0 ? (
          <p className="mt-10 rounded-[var(--radius-card)] border border-dashed border-stone bg-surface p-10 text-center text-ink-soft">
            {t("empty")}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4">
            {photos.map((p, i) => (
              <Link
                key={p.url + i}
                href={`/guides/${p.guideSlug}`}
                className="group relative aspect-square overflow-hidden rounded-lg bg-stone"
              >
                <Image
                  src={p.url}
                  alt={p.caption || p.guideName}
                  fill
                  sizes="(max-width: 640px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-ink">
                    {t("byGuide", { name: p.guideName })}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
