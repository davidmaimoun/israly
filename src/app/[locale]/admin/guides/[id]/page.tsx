export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { GuideProfileForm } from "@/components/admin/GuideProfileForm";
import type { Locale } from "@/i18n/config";

export default async function AdminGuideEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations("admin.adminGuides");

  const guide = await prisma.guide.findUnique({ where: { id } });
  if (!guide) notFound();
  const user = await prisma.user.findFirst({ where: { guideId: id }, select: { email: true } });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-primary">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {t("back")}
      </Link>
      <h1 className="display mb-6 text-2xl">{guide.firstName} {guide.lastName}</h1>
      <GuideProfileForm
        isAdmin
        email={user?.email}
        guide={{
          id: guide.id,
          firstName: guide.firstName,
          lastName: guide.lastName,
          photo: guide.photo ?? "",
          cities: guide.cities,
          languages: guide.languages,
          specialties: guide.specialties,
          yearsExperience: guide.yearsExperience,
          phone: guide.phone ?? "",
          notes: guide.notes,
          bio: (guide.bio ?? {}) as Partial<Record<Locale, string>>,
          gallery: guide.gallery.map((m) => ({
            type: m.type as "photo" | "video",
            url: m.url,
            poster: m.poster ?? "",
            caption: m.caption ?? "",
          })),
          currency: guide.currency,
          pricePerPersonHour: guide.pricePerPersonHour,
          pricePerGroup: guide.pricePerGroup,
          trips: guide.trips.map((tr) => ({
            label: tr.label,
            price: tr.price,
            unit: tr.unit as "perPerson" | "perGroup" | "perHour" | "perPersonHour",
            duration: tr.duration ?? null,
            details: tr.details ?? null,
            itinerary: tr.itinerary ?? null,
          })),
        }}
      />
    </main>
  );
}
