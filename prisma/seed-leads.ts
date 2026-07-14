// prisma/seed-leads.ts
// Seed de démonstration : plusieurs CAS de leads + un historique d'offres
// pour voir les signaux de classement (peu servi / lent / N leads).
//
// Lancer :  npx tsx prisma/seed-leads.ts    (ou ts-node)
//
// Idempotent : supprime d'abord les leads de seed (clientEmail @seed.local),
// leurs LeadOffer sont supprimées en cascade.
//
// ADAPT : si ton modèle TourRequest stocke startDate en DateTime (et non String),
// remplace les `d(...)` par `new Date(d(...))`. Idem si des champs sont requis.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const d = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
const ago = (days: number) => new Date(Date.now() - days * 864e5);

async function main() {
  // 1) Nettoyage des leads de seed précédents
  const old = await prisma.booking.findMany({ where: { clientEmail: { contains: "@seed.local" } } });
  if (old.length) {
    const ids = old.map((l: any) => l.id);
    await prisma.leadOffer.deleteMany({ where: { tourRequestId: { in: ids } } });
    await prisma.booking.deleteMany({ where: { id: { in: ids } } });
    console.log(`🧹 supprimé ${old.length} lead(s) de seed précédents`);
  }

  // 2) Guides existants (pour l'historique d'offres). On n'en crée pas : on
  //    utilise les tiens. S'il n'y en a pas, les offres sont simplement sautées.
  const guides = await prisma.guide.findMany({ where: { published: true }, take: 3 });
  const [g0, g1, g2] = guides;
  console.log(`👤 ${guides.length} guide(s) publié(s) trouvé(s) pour l'historique`);

  // 3) Les cas de leads
  const base = { startTime: "", message: "", locale: "fr" as const, numPeople: 2 };

  const mk = async (data: any, label: string) => {
    try {
      const l = await prisma.booking.create({ data: { ...base, ...data } });
      console.log(`✅ ${label} -> ${l.id}`);
      return l;
    } catch (e: any) {
      console.error(`❌ ${label} : ${e.message}\n   (ADAPT les champs de TourRequest dans le seed)`);
      return null;
    }
  };

  // CAS 1 — général, FR, Jérusalem, avec date (le lead "vitrine" à dispatcher)
  const l1 = await mk(
    {
      clientName: "Alice Martin",
      clientEmail: "alice@seed.local",
      clientPhone: "+33 6 12 34 56 78",
      numPeople: 4,
      startDate: d(14),
      cities: ["jerusalem"],
      langs: ["fr"],
      message: "Première visite en famille, on aimerait la vieille ville et le Kotel.",
      leadStatus: "NEW",
    },
    "CAS 1 · général FR Jérusalem +date",
  );

  // CAS 2 — général, EN + HE, multi-régions, sans date
  await mk(
    {
      clientName: "John & Rachel",
      clientEmail: "john@seed.local",
      clientPhone: "+1 917 555 0199",
      numPeople: 2,
      startDate: "",
      cities: ["tel_aviv", "galilee", "dead_sea"],
      langs: ["en", "he"],
      message: "Flexible on dates, love hiking and food.",
      leadStatus: "NEW",
    },
    "CAS 2 · général EN/HE multi-régions sans date",
  );

  // CAS 3 — général, ES, groupe nombreux, avec date (souvent peu/pas de guide éligible)
  await mk(
    {
      clientName: "Grupo Rodríguez",
      clientEmail: "grupo@seed.local",
      clientPhone: "+34 611 22 33 44",
      numPeople: 9,
      startDate: d(40),
      cities: ["eilat", "negev"],
      langs: ["es"],
      message: "Grupo de 9, preferimos guía en español.",
      leadStatus: "NEW",
    },
    "CAS 3 · général ES groupe (edge: peu d'éligibles)",
  );

  // CAS 4 — demande CIBLÉE sur un guide précis (via le picker du form)
  await mk(
    {
      clientName: "Claire Dubois",
      clientEmail: "claire@seed.local",
      clientPhone: "+33 6 98 76 54 32",
      numPeople: 3,
      startDate: d(21),
      cities: ["jerusalem"],
      langs: ["fr"],
      message: "On m'a recommandé ce guide en particulier.",
      guideId: g0?.id ?? undefined, // ciblé si un guide existe
      leadStatus: "NEW",
    },
    "CAS 4 · demande ciblée (guideId)",
  );

  // CAS 5 & 6 — historique VENDU à g0 (=> g0 aura "2 leads / 30j")
  const l5 = await mk(
    {
      clientName: "Historique A",
      clientEmail: "histA@seed.local",
      clientPhone: "+33 6 00 00 00 01",
      startDate: d(7),
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
      startDate: d(9),
      cities: ["tel_aviv"],
      langs: ["fr", "en"],
      leadStatus: g0 ? "SOLD" : "NEW",
      soldToGuideId: g0?.id ?? undefined,
      soldAt: g0 ? new Date() : undefined,
    },
    "CAS 6 · historique vendu à g0",
  );

  // 4) Offres d'historique pour créer les signaux de classement
  const offer = (tourRequestId: string, guideId: string, status: string, extra: any = {}) =>
    prisma.leadOffer
      .create({ data: { tourRequestId, guideId, status, ...extra } })
      .catch((e: any) => console.error(`⚠️ offre (${status}) : ${e.message}`));

  // g0 : 2 offres ACCEPTED (leads remportés) -> "2 leads / 30j"
  if (g0 && l5) await offer(l5.id, g0.id, "ACCEPTED", { respondedAt: new Date(), offeredAt: ago(6) });
  if (g0 && l6) await offer(l6.id, g0.id, "ACCEPTED", { respondedAt: new Date(), offeredAt: ago(3) });

  // g2 : 2 dernières offres EXPIRED -> badge "lent" (relégué en fin de cascade)
  if (g2 && l1) await offer(l1.id, g2.id, "EXPIRED", { offeredAt: ago(2), expiresAt: ago(2), respondedAt: ago(2) });
  if (g2 && l5) await offer(l5.id, g2.id, "EXPIRED", { offeredAt: ago(1), expiresAt: ago(1), respondedAt: ago(1) });

  // g1 : rien -> "peu servi", il remontera en tête de la cascade.

  console.log("\n✨ Seed terminé.");
  if (l1) console.log(`➡️  Teste le dispatch : /fr/admin/leads/${l1.id}`);
  if (guides.length < 3)
    console.log("ℹ️  Moins de 3 guides publiés : certains signaux (lent / N leads) ne s'afficheront qu'avec plus de guides.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
