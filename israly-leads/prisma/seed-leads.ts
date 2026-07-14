// prisma/seed-leads.ts  — mappé sur ton schéma (Booking / LeadOffer / Guide).
// Lancer :  npx tsx prisma/seed-leads.ts
// Idempotent : nettoie d'abord les leads de seed (clientEmail @seed.local).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const day = (n: number) => new Date(Date.now() + n * 864e5); // Date (startDate est DateTime requis)
const ago = (n: number) => new Date(Date.now() - n * 864e5);

async function main() {
  // 1) Nettoyage
  const old = await prisma.booking.findMany({ where: { clientEmail: { contains: "@seed.local" } } });
  if (old.length) {
    const ids = old.map((l) => l.id);
    await prisma.leadOffer.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.booking.deleteMany({ where: { id: { in: ids } } });
    console.log(`🧹 supprimé ${old.length} lead(s) de seed précédents`);
  }

  // 2) Guides existants (pour l'historique d'offres)
  const guides = await prisma.guide.findMany({ where: { published: true }, take: 3 });
  const [g0, g1, g2] = guides;
  console.log(`👤 ${guides.length} guide(s) publié(s) trouvé(s)`);

  const base = { startTime: "", message: "", locale: "fr", numPeople: 2 };
  const mk = async (data: any, label: string) => {
    try {
      const l = await prisma.booking.create({ data: { ...base, ...data } });
      console.log(`✅ ${label} -> ${l.id}`);
      return l;
    } catch (e: any) {
      console.error(`❌ ${label} : ${e.message}`);
      return null;
    }
  };

  // CAS 1 — général FR Jérusalem +date (lead vitrine)
  const l1 = await mk(
    {
      clientName: "Alice Martin",
      clientEmail: "alice@seed.local",
      clientPhone: "+33 6 12 34 56 78",
      numPeople: 4,
      startDate: day(14),
      cities: ["jerusalem"],
      langs: ["fr"],
      message: "Première visite en famille, vieille ville et Kotel.",
      leadStatus: "NEW",
    },
    "CAS 1 · général FR Jérusalem +date",
  );

  // CAS 2 — EN + HE, multi-régions
  await mk(
    {
      clientName: "John & Rachel",
      clientEmail: "john@seed.local",
      clientPhone: "+1 917 555 0199",
      startDate: day(30),
      cities: ["tel_aviv", "galilee", "dead_sea"],
      langs: ["en", "he"],
      message: "Love hiking and food.",
      leadStatus: "NEW",
    },
    "CAS 2 · général EN/HE multi-régions",
  );

  // CAS 3 — ES groupe (edge : peu/pas d'éligibles)
  await mk(
    {
      clientName: "Grupo Rodríguez",
      clientEmail: "grupo@seed.local",
      clientPhone: "+34 611 22 33 44",
      numPeople: 9,
      startDate: day(40),
      cities: ["eilat", "negev"],
      langs: ["es"],
      message: "Grupo de 9, guía en español.",
      leadStatus: "NEW",
    },
    "CAS 3 · général ES groupe",
  );

  // CAS 4 — demande ciblée (guideId)
  await mk(
    {
      clientName: "Claire Dubois",
      clientEmail: "claire@seed.local",
      clientPhone: "+33 6 98 76 54 32",
      numPeople: 3,
      startDate: day(21),
      cities: ["jerusalem"],
      langs: ["fr"],
      message: "Guide recommandé en particulier.",
      guideId: g0?.id ?? undefined,
      leadStatus: "NEW",
    },
    "CAS 4 · demande ciblée",
  );

  // CAS 5 & 6 — historique VENDU à g0 (=> "2 leads / 30j")
  const l5 = await mk(
    {
      clientName: "Historique A",
      clientEmail: "histA@seed.local",
      clientPhone: "+33 6 00 00 00 01",
      startDate: day(7),
      cities: ["jerusalem"],
      langs: ["fr"],
      leadStatus: g0 ? "SOLD" : "NEW",
      soldToGuideId: g0?.id ?? undefined,
      soldAt: g0 ? new Date() : undefined,
    },
    "CAS 5 · historique vendu à g0",
  );
  const l6 = await mk(
    {
      clientName: "Historique B",
      clientEmail: "histB@seed.local",
      clientPhone: "+33 6 00 00 00 02",
      startDate: day(9),
      cities: ["tel_aviv"],
      langs: ["fr", "en"],
      leadStatus: g0 ? "SOLD" : "NEW",
      soldToGuideId: g0?.id ?? undefined,
      soldAt: g0 ? new Date() : undefined,
    },
    "CAS 6 · historique vendu à g0",
  );

  // 3) Offres d'historique (signaux de classement)
  const offer = (bookingId: string, guideId: string, status: string, extra: any = {}) =>
    prisma.leadOffer
      .create({ data: { bookingId, guideId, status, ...extra } })
      .catch((e: any) => console.error(`⚠️ offre (${status}) : ${e.message}`));

  if (g0 && l5) await offer(l5.id, g0.id, "ACCEPTED", { respondedAt: new Date(), offeredAt: ago(6) });
  if (g0 && l6) await offer(l6.id, g0.id, "ACCEPTED", { respondedAt: new Date(), offeredAt: ago(3) });
  if (g2 && l1) await offer(l1.id, g2.id, "EXPIRED", { offeredAt: ago(2), expiresAt: ago(2), respondedAt: ago(2) });
  if (g2 && l5) await offer(l5.id, g2.id, "EXPIRED", { offeredAt: ago(1), expiresAt: ago(1), respondedAt: ago(1) });
  // g1 : rien -> "peu servi", remonte en tête.

  console.log("\n✨ Seed terminé.");
  if (l1) console.log(`➡️  Teste le dispatch : /fr/admin/leads/${l1.id}`);
  if (guides.length < 3) console.log("ℹ️  <3 guides publiés : certains signaux ne s'afficheront qu'avec plus de guides.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
