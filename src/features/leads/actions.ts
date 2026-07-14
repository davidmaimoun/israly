"use server";

// features/leads/actions.ts
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { rankEligible, type GuideForRanking, type LeadCriteria } from "@/lib/leads/eligibility";

const WINDOW_DAYS = 30;
const OFFER_TTL_HOURS = 3;

const isoDate = (dt: Date | null | undefined) => (dt ? new Date(dt).toISOString().slice(0, 10) : null);

// Guide Prisma -> forme de ranking (mappé sur ton modèle Guide réel).
function toRankingBase(
  g: any,
): Omit<GuideForRanking, "wonLast30d" | "lastTwoExpired" | "availableOnDate"> {
  return {
    id: g.id,
    name: `${g.firstName} ${g.lastName}`.trim(),
    photo: g.photo ?? null,
    phone: g.phone ?? null,
    langs: g.languages ?? [],
    cities: g.cities ?? [],
    published: g.published ?? false,
    certified: false, // pas de champ certified dans ton schéma (badge masqué)
    rating: g.rating ?? null,
  };
}

// Dispo calendrier (modèle Availability : { guideId, date, status }).
// date non marquée = DISPO par défaut. Se remplit quand ton calendrier écrit dans Availability.
async function availabilityMap(guideIds: string[], date: Date | null): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!date || guideIds.length === 0) return map;
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  try {
    const slots = await prisma.availability.findMany({
      where: { guideId: { in: guideIds }, date: { gte: start, lte: end } },
    });
    for (const s of slots) map.set(s.guideId, s.status);
  } catch {
    /* si vide/indispo -> pas de filtre */
  }
  return map;
}

export async function getRankedGuidesForLead(leadId: string) {
  const lead = await prisma.booking.findUnique({ where: { id: leadId } });
  if (!lead) return { lead: null, guides: [] as GuideForRanking[] };

  const criteria: LeadCriteria = {
    langs: lead.langs ?? [],
    cities: lead.cities ?? [],
    hasDate: !!lead.startDate,
  };
  const leadDate = lead.startDate ? new Date(lead.startDate) : null;

  const rawGuides = await prisma.guide.findMany({ where: { published: true } });
  const ids = rawGuides.map((g) => g.id);

  const avail = await availabilityMap(ids, leadDate);
  const availFor = (guideId: string): boolean | undefined => {
    if (!leadDate) return undefined;
    const st = avail.get(guideId);
    if (st === undefined) return true; // non marqué = dispo
    return st === "available";
  };

  const since = new Date(Date.now() - WINDOW_DAYS * 864e5);
  const offers = await prisma.leadOffer.findMany({
    where: { guideId: { in: ids } },
    orderBy: { offeredAt: "desc" },
  });
  const byGuide = new Map<string, typeof offers>();
  for (const o of offers) {
    const arr = byGuide.get(o.guideId) ?? [];
    arr.push(o);
    byGuide.set(o.guideId, arr);
  }

  const guides: GuideForRanking[] = rawGuides.map((g) => {
    const os = byGuide.get(g.id) ?? [];
    const wonLast30d = os.filter((o) => o.status === "ACCEPTED" && o.offeredAt >= since).length;
    const lastTwo = os.slice(0, 2);
    const lastTwoExpired = lastTwo.length === 2 && lastTwo.every((o) => o.status === "EXPIRED");
    return { ...toRankingBase(g), availableOnDate: availFor(g.id), wonLast30d, lastTwoExpired };
  });

  const leadOut = {
    id: lead.id,
    clientName: lead.clientName,
    clientEmail: lead.clientEmail,
    clientPhone: lead.clientPhone ?? "",
    numPeople: lead.numPeople,
    startDate: isoDate(lead.startDate),
    startTime: lead.startTime ?? null,
    cities: lead.cities ?? [],
    langs: lead.langs ?? [],
    message: lead.message ?? null,
    leadStatus: lead.leadStatus ?? "NEW",
    soldToGuideId: lead.soldToGuideId ?? null,
  };

  return { lead: leadOut, guides: rankEligible(guides, criteria) };
}

// Liste des leads récents pour l'admin.
export async function getRecentLeads(limit = 40) {
  const leads = await prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  return leads.map((l) => ({
    id: l.id,
    clientName: l.clientName,
    cities: l.cities ?? [],
    langs: l.langs ?? [],
    numPeople: l.numPeople,
    startDate: isoDate(l.startDate),
    leadStatus: (l.leadStatus ?? "NEW") as string,
    guideId: l.guideId ?? null,
  }));
}

// Dashboard guide : offres (SANS contact) + leads gagnés (AVEC contact).
export async function getGuideLeads(guideId: string) {
  const now = new Date();
  const offers = await prisma.leadOffer.findMany({
    where: { guideId },
    orderBy: { offeredAt: "desc" },
    include: { booking: true },
  });

  const pending = offers
    .filter((o) => o.status === "OFFERED" && (!o.expiresAt || o.expiresAt > now))
    .map((o) => {
      const r = o.booking;
      return {
        offerId: o.id,
        leadId: o.bookingId,
        cities: r.cities ?? [],
        langs: r.langs ?? [],
        numPeople: r.numPeople,
        startDate: isoDate(r.startDate),
        startTime: r.startTime ?? null,
        message: r.message ?? null,
        expiresAt: o.expiresAt ?? null,
        // ⚠️ aucun contact client (lead non payé)
      };
    });

  const won = offers
    .filter((o) => o.status === "ACCEPTED")
    .map((o) => {
      const r = o.booking;
      return {
        leadId: o.bookingId,
        clientName: r.clientName,
        clientPhone: r.clientPhone ?? "",
        clientEmail: r.clientEmail,
        cities: r.cities ?? [],
        langs: r.langs ?? [],
        numPeople: r.numPeople,
        startDate: isoDate(r.startDate),
        startTime: r.startTime ?? null,
        message: r.message ?? null,
        wonAt: o.respondedAt ?? o.offeredAt,
      };
    });

  return { pending, won };
}

export async function offerLead(leadId: string, guideId: string) {
  const expiresAt = new Date(Date.now() + OFFER_TTL_HOURS * 3600e3);
  await prisma.leadOffer.create({ data: { bookingId: leadId, guideId, status: "OFFERED", expiresAt } });
  await prisma.booking.update({ where: { id: leadId }, data: { leadStatus: "OFFERING" } });
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function sellLead(leadId: string, guideId: string) {
  const open = await prisma.leadOffer.findFirst({
    where: { bookingId: leadId, guideId, status: "OFFERED" },
    orderBy: { offeredAt: "desc" },
  });
  if (open) {
    await prisma.leadOffer.update({ where: { id: open.id }, data: { status: "ACCEPTED", respondedAt: new Date() } });
  } else {
    await prisma.leadOffer.create({ data: { bookingId: leadId, guideId, status: "ACCEPTED", respondedAt: new Date() } });
  }
  await prisma.booking.update({
    where: { id: leadId },
    data: { leadStatus: "SOLD", soldToGuideId: guideId, soldAt: new Date() },
  });
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function passLead(leadId: string, guideId: string) {
  const open = await prisma.leadOffer.findFirst({
    where: { bookingId: leadId, guideId, status: "OFFERED" },
    orderBy: { offeredAt: "desc" },
  });
  if (open) {
    await prisma.leadOffer.update({ where: { id: open.id }, data: { status: "EXPIRED", respondedAt: new Date() } });
  }
  revalidatePath(`/admin/leads/${leadId}`);
}
