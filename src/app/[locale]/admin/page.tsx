export const dynamic = "force-dynamic";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { Dashboard } from "@/components/admin/Dashboard";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { toDateKey, fullName } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);

  // ----- ADMIN : tout voir -----
  if (user.role === "admin") {
    const [guides, bookings, invoices] = await Promise.all([
      prisma.guide.findMany({ orderBy: { lastName: "asc" } }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        include: { guide: { select: { firstName: true, lastName: true, currency: true } } },
        take: 100,
      }),
      prisma.invoice.findMany({
        orderBy: { issuedAt: "desc" },
        include: { guide: { select: { firstName: true, lastName: true, currency: true } } },
        take: 100,
      }),
    ]);

    return (
      <Dashboard
        role="admin"
        guideData={null}
        adminData={{
          guides: guides.map((g) => ({ id: g.id, name: fullName(g), cities: g.cities, published: g.published })),
          bookings: bookings.map((b) => ({
            id: b.id,
            guideName: b.guide ? fullName(b.guide) : null,
            clientName: b.clientName,
            clientEmail: b.clientEmail,
            clientPhone: b.clientPhone,
            startDate: toDateKey(b.startDate),
            startTime: b.startTime,
            numPeople: b.numPeople,
            amount: b.amount,
            currency: b.guide?.currency ?? "ILS",
            cities: b.cities,
            langs: b.langs,
            message: b.message,
            status: b.status,
            locale: b.locale,
            createdAt: b.createdAt.toISOString(),
          })),
          invoices: invoices.map((inv) => ({
            id: inv.id,
            number: inv.number,
            guideName: inv.guide ? fullName(inv.guide) : "—",
            clientName: inv.clientName,
            amount: inv.amount,
            currency: inv.currency,
            status: inv.status,
          })),
        }}
      />
    );
  }

  // ----- GUIDE : ses données uniquement -----
  if (!user.guideId) {
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center text-ink-soft">
        Aucun profil guide associé à ce compte.
      </div>
    );
  }

  const guide = await prisma.guide.findUnique({
    where: { id: user.guideId },
    include: {
      availability: true,
      bookings: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  });
  if (!guide) {
    // Session obsolète (ex. après un re-seed : l'ID du guide a changé). On invite à se reconnecter.
    return (
      <div className="grid min-h-screen place-items-center px-5">
        <div className="max-w-sm rounded-[var(--radius-card)] border border-stone/70 bg-surface p-6 text-center">
          <p className="mb-1 font-semibold text-ink">Session expirée</p>
          <p className="mb-4 text-sm text-ink-soft">Ton profil n'a pas été trouvé (la base a peut-être été rechargée). Reconnecte-toi pour continuer.</p>
          <LogoutButton />
        </div>
      </div>
    );
  }

  const availability: Record<string, "AVAILABLE" | "BOOKED" | "UNAVAILABLE"> = {};
  for (const a of guide.availability) availability[toDateKey(a.date)] = a.status;

  return (
    <Dashboard
      role="guide"
      adminData={null}
      guideData={{
        guide: {
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
        },
        availability,
        bookings: guide.bookings.map((b) => ({
          id: b.id,
          clientName: b.clientName,
          clientEmail: b.clientEmail,
          clientPhone: b.clientPhone,
          numPeople: b.numPeople,
          startDate: toDateKey(b.startDate),
          startTime: b.startTime,
          message: b.message,
          status: b.status,
        })),
        invoices: guide.invoices.map((inv) => ({
          id: inv.id,
          number: inv.number,
          clientName: inv.clientName,
          amount: inv.amount,
          currency: inv.currency,
          tourDate: inv.tourDate ? toDateKey(inv.tourDate) : null,
          status: inv.status,
        })),
        // Réservations confirmées/terminées -> base pour créer une facture.
        invoiceBookings: guide.bookings
          .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
          .map((b) => ({
            id: b.id,
            clientName: b.clientName,
            clientEmail: b.clientEmail,
            startDate: toDateKey(b.startDate),
            numPeople: b.numPeople,
          })),
      }}
    />
  );
}