"use server";

// features/leads/actions.ts
import { prisma } from "@/lib/prisma"; // ADAPT: chemin de ton client Prisma
import { revalidatePath } from "next/cache";
import { rankEligible, type GuideForRanking, type LeadCriteria } from "@/lib/leads/eligibility";

const WINDOW_DAYS = 30;
const OFFER_TTL_HOURS = 3;

// ============================================================
// ADAPT #1 — Guide Prisma -> forme de ranking.
// Ajuste les noms de champs (languages/langs, cities/regions, published…).
// ============================================================
function toRankingBase(
  g: any,
): Omit<GuideForRanking, "wonLast30d" | "lastTwoExpired" | "availableOnDate"> {
  return {
    id: g.id,
    name: [g.firstName, g.lastName].filter(Boolean).join(" ") || g.name || "—",
    photo: g.photo ?? null,
    phone: g.phone ?? null,
    langs: g.languages ?? g.langs ?? [],
    cities: g.cities ?? g.regions ?? [],
    published: g.published ?? g.isPublished ?? false,
    certified: g.certified ?? false,
    rating: g.rating ?? null,
  };
}

// ============================================================
// ADAPT #2 — dispo calendrier (WIRÉE sur le modèle Availability du .prisma).
// Si ton modèle diffère, change (prisma as any).availability + les champs date/status.
// Sémantique : date non marquée = DISPO par défaut (mets `return false` pour un opt-in strict).
// ============================================================
async function availabilityMap(
  guideIds: string[],
  date: Date | null,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!date || guideIds.length === 0) return map;
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  try {
    const slots = await (prisma as any).availability.findMany({
      where: { guideId: { in: guideIds }, date: { gte: start, lte: end } },
    });
    for (const s of slots) map.set(s.guideId, s.status);
  } catch {
    // pas de modèle Availability -> on n'applique pas le filtre dispo
  }
  return map;
}

export async function getRankedGuidesForLead(leadId: string) {
  const lead = await prisma.tourRequest.findUnique({ where: { id: leadId } }); // ADAPT: modèle
  if (!lead) return { lead: null, guides: [] as GuideForRanking[] };

  const criteria: LeadCriteria = {
    langs: lead.langs ?? [],
    cities: lead.cities ?? [],
    hasDate: !!lead.startDate,
  };
  const leadDate = lead.startDate ? new Date(lead.startDate) : null;

  const rawGuides = await prisma.guide.findMany({ where: { published: true } }); // ADAPT
  const ids = rawGuides.map((g: any) => g.id);

  const avail = await availabilityMap(ids, leadDate);
  const availFor = (guideId: string): boolean | undefined => {
    if (!leadDate) return undefined;
    const st = avail.get(guideId);
    if (st === undefined) return true; // non marqué = dispo (ADAPT)
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

  const guides: GuideForRanking[] = rawGuides.map((g: any) => {
    const os = byGuide.get(g.id) ?? [];
    const wonLast30d = os.filter((o) => o.status === "ACCEPTED" && o.offeredAt >= since).length;
    const lastTwo = os.slice(0, 2);
    const lastTwoExpired = lastTwo.length === 2 && lastTwo.every((o) => o.status === "EXPIRED");
    return { ...toRankingBase(g), availableOnDate: availFor(g.id), wonLast30d, lastTwoExpired };
  });

  return { lead, guides: rankEligible(guides, criteria) };
}

// Liste des leads récents pour l'admin (pour cliquer vers le dispatch).
export async function getRecentLeads(limit = 40) {
  const leads = await prisma.tourRequest.findMany({
    orderBy: { createdAt: "desc" }, // ADAPT si pas de createdAt
    take: limit,
  });
  return leads.map((l: any) => ({
    id: l.id,
    clientName: l.clientName,
    cities: l.cities ?? [],
    langs: l.langs ?? [],
    numPeople: l.numPeople,
    startDate: l.startDate ?? null,
    leadStatus: l.leadStatus ?? "NEW",
    guideId: l.guideId ?? null,
    createdAt: l.createdAt ?? null,
  }));
}

// ---- Dashboard guide : ses offres (SANS contact) + ses leads gagnés (AVEC contact) ----
export async function getGuideLeads(guideId: string) {
  const now = new Date();
  const offers = await prisma.leadOffer.findMany({
    where: { guideId },
    orderBy: { offeredAt: "desc" },
    include: { tourRequest: true },
  });

  const pending = offers
    .filter((o) => o.status === "OFFERED" && (!o.expiresAt || o.expiresAt > now))
    .map((o) => {
      const r: any = o.tourRequest;
      return {
        offerId: o.id,
        leadId: o.tourRequestId,
        cities: r.cities ?? [],
        langs: r.langs ?? [],
        numPeople: r.numPeople,
        startDate: r.startDate ?? null,
        startTime: r.startTime ?? null,
        message: r.message ?? null,
        expiresAt: o.expiresAt ?? null,
        // ⚠️ AUCUN contact client ici (lead non payé)
      };
    });

  const won = offers
    .filter((o) => o.status === "ACCEPTED")
    .map((o) => {
      const r: any = o.tourRequest;
      return {
        leadId: o.tourRequestId,
        clientName: r.clientName,
        clientPhone: r.clientPhone,
        clientEmail: r.clientEmail,
        cities: r.cities ?? [],
        langs: r.langs ?? [],
        numPeople: r.numPeople,
        startDate: r.startDate ?? null,
        startTime: r.startTime ?? null,
        message: r.message ?? null,
        wonAt: o.respondedAt ?? o.offeredAt,
      };
    });

  return { pending, won };
}

// Propose le lead à un guide (log l'offre + fenêtre d'expiration).
export async function offerLead(leadId: string, guideId: string) {
  const expiresAt = new Date(Date.now() + OFFER_TTL_HOURS * 3600e3);
  await prisma.leadOffer.create({
    data: { tourRequestId: leadId, guideId, status: "OFFERED", expiresAt },
  });
  await prisma.tourRequest.update({ where: { id: leadId }, data: { leadStatus: "OFFERING" } });
  revalidatePath(`/admin/leads/${leadId}`); // ADAPT: ton chemin de route
}

// Le guide prend + paie -> il devient LE seul (exclusif). Révèle le contact.
export async function sellLead(leadId: string, guideId: string) {
  const open = await prisma.leadOffer.findFirst({
    where: { tourRequestId: leadId, guideId, status: "OFFERED" },
    orderBy: { offeredAt: "desc" },
  });
  if (open) {
    await prisma.leadOffer.update({
      where: { id: open.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
  } else {
    await prisma.leadOffer.create({
      data: { tourRequestId: leadId, guideId, status: "ACCEPTED", respondedAt: new Date() },
    });
  }
  await prisma.tourRequest.update({
    where: { id: leadId },
    data: { leadStatus: "SOLD", soldToGuideId: guideId, soldAt: new Date() },
  });
  revalidatePath(`/admin/leads/${leadId}`);
}

// "Sans réponse / passe" -> expire l'offre ouverte, on descend au suivant.
export async function passLead(leadId: string, guideId: string) {
  const open = await prisma.leadOffer.findFirst({
    where: { tourRequestId: leadId, guideId, status: "OFFERED" },
    orderBy: { offeredAt: "desc" },
  });
  if (open) {
    await prisma.leadOffer.update({
      where: { id: open.id },
      data: { status: "EXPIRED", respondedAt: new Date() },
    });
  }
  revalidatePath(`/admin/leads/${leadId}`);
}
