import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Quelques dates futures AVAILABLE pour la démo.
function futureDates(count: number, startOffset = 2): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + startOffset + i * 2);
    out.push(d);
  }
  return out;
}

// Images placeholder FIABLES (Picsum) — à remplacer par de vraies photos.
// La "seed" garantit une image stable et différente par guide/élément.
const PIC = (seed: string) => `https://picsum.photos/seed/ig-${seed}/900/1100`;
// Portraits de démo (illustratifs) — visages humains, remplaçables par l'admin.
const PORTRAIT: Record<string, string> = {
  "yossi-cohen": "https://i.pravatar.cc/512?img=12",
  "marie-dubois": "https://i.pravatar.cc/512?img=45",
  "david-levi": "https://i.pravatar.cc/512?img=51",
  "leila-haddad": "https://i.pravatar.cc/512?img=47",
};

async function main() {
  console.log("→ Nettoyage…");
  await prisma.invoice.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.user.deleteMany();
  await prisma.guide.deleteMany();

  // --- Admin (un seul : en MongoDB, deux users sans guideId violent l'index unique guideId) ---
  const sudoHash = await bcrypt.hash("123123", 10);
  await prisma.user.create({
    data: { email: "sudosudev@outlook.com", passwordHash: sudoHash, role: "admin" },
  });
  console.log("✓ Admin : sudosudev@outlook.com / 123123");

  // --- Guides de démo ---
  const guides = [
    {
      slug: "yossi-cohen",
      firstName: "Yossi",
      lastName: "Cohen",
      cities: ["jerusalem", "dead_sea"],
      languages: ["he", "en", "fr"],
      specialties: ["history", "religion", "archaeology"],
      notes: ["Not on Shabbat", "Available 24/7", "Family friendly"],
      yearsExperience: 12,
      toursCompleted: 540,
      bio: {
        he: "מדריך ירושלמי ותיק, מתמחה בהיסטוריה ובארכיאולוגיה של העיר העתיקה.",
        en: "Veteran Jerusalem guide specializing in the history and archaeology of the Old City.",
        fr: "Guide chevronné de Jérusalem, spécialiste de l'histoire et de l'archéologie de la vieille ville.",
      },
      gallery: [
        { type: "photo", url: PIC("1544207763-0c5b9c1b6f5c"), caption: "Vieille ville" },
        { type: "photo", url: PIC("1552423314-cf29ab68ad73"), caption: "Mont des Oliviers" },
        { type: "photo", url: PIC("jeru-3"), caption: "Quartier juif" },
        { type: "photo", url: PIC("jeru-4"), caption: "Souk" },
        { type: "photo", url: PIC("jeru-5"), caption: "Saint-Sépulcre" },
      ],
      currency: "ILS",
      pricePerPersonHour: 120,
      pricePerGroup: 900,
      trips: [
        { label: "Vieille ville — journée complète", price: 1200, unit: "perGroup", duration: 6, details: "09:00 Porte de Jaffa et la Tour de David\n10:30 Quartier juif et le Cardo\n12:00 Mur des Lamentations\n13:00 Déjeuner dans le souk\n14:30 Saint-Sépulcre et Via Dolorosa\n16:00 Mont des Oliviers, vue panoramique" },
        { label: "Mont des Oliviers au lever du soleil", price: 80, unit: "perPerson", duration: 2 },
      ],
      rating: 4.9,
      ratingCount: 128,
      email: "yossi@example.com",
    },
    {
      slug: "marie-dubois",
      firstName: "Marie",
      lastName: "Dubois",
      cities: ["tel_aviv", "jaffa"],
      languages: ["fr", "en"],
      specialties: ["food", "photography"],
      yearsExperience: 7,
      toursCompleted: 220,
      bio: {
        he: "מדריכה דוברת צרפתית בתל אביב, חווית אוכל וצילום.",
        en: "French-speaking Tel Aviv guide for food and photography experiences.",
        fr: "Guide francophone à Tel-Aviv, expériences culinaires et photographiques.",
      },
      gallery: [
        { type: "photo", url: PIC("1521295121783-8a321d551ad2"), caption: "Marché Carmel" },
        { type: "photo", url: PIC("tlv-2"), caption: "Bord de mer" },
        { type: "photo", url: PIC("tlv-3"), caption: "Bauhaus" },
        { type: "photo", url: PIC("tlv-4"), caption: "Street food" },
      ],
      currency: "EUR",
      pricePerPersonHour: 45,
      pricePerGroup: null,
      trips: [
        { label: "Street food à Tel-Aviv", price: 65, unit: "perPerson", duration: 3 },
      ],
      rating: 4.7,
      ratingCount: 86,
      email: "marie@example.com",
    },
    {
      slug: "david-levi",
      firstName: "David",
      lastName: "Levi",
      cities: ["dead_sea", "masada", "negev"],
      languages: ["he", "en", "ru"],
      specialties: ["desert", "hiking"],
      yearsExperience: 15,
      toursCompleted: 610,
      bio: {
        he: "מומחה למדבר יהודה ולים המלח, טיולים ומסעות.",
        en: "Expert of the Judean desert and the Dead Sea, treks and expeditions.",
        fr: "Expert du désert de Judée et de la Mer Morte, randonnées et expéditions.",
      },
      gallery: [
        { type: "photo", url: PIC("1509023464722-18d996393ca8"), caption: "Massada au lever du soleil" },
        { type: "photo", url: PIC("ds-2"), caption: "Mer Morte" },
        { type: "photo", url: PIC("ds-3"), caption: "Désert de Judée" },
        { type: "photo", url: PIC("ds-4"), caption: "Ein Gedi" },
      ],
      currency: "ILS",
      pricePerPersonHour: null,
      pricePerGroup: 1500,
      trips: [
        { label: "Massada + Mer Morte", price: 1500, unit: "perGroup", duration: 8 },
        { label: "Randonnée désert de Judée", price: 200, unit: "perPersonHour" },
      ],
      rating: 4.8,
      ratingCount: 54,
      email: "david@example.com",
    },
    {
      slug: "leila-haddad",
      firstName: "Leila",
      lastName: "Haddad",
      cities: ["akko", "haifa"],
      languages: ["he", "en", "am"],
      specialties: ["religion", "food", "history"],
      yearsExperience: 9,
      toursCompleted: 300,
      bio: {
        he: "מדריכה מהגליל, מורשת רב-תרבותית ואירוח מקומי.",
        en: "Galilee guide focused on multicultural heritage and local hospitality.",
        fr: "Guide de Galilée, patrimoine multiculturel et hospitalité locale.",
      },
      gallery: [
        { type: "photo", url: PIC("akko-port"), caption: "Port d'Acre" },
        { type: "photo", url: PIC("galilee-hills"), caption: "Collines de Galilée" },
        { type: "photo", url: PIC("gal-3"), caption: "Lac de Tibériade" },
        { type: "photo", url: PIC("gal-4"), caption: "Nazareth" },
      ],
      currency: "ILS",
      pricePerPersonHour: 90,
      pricePerGroup: 700,
      trips: [],
      rating: 5.0,
      ratingCount: 12,
      email: "leila@example.com",
    },
  ];

  const guideHash = await bcrypt.hash("guide1234", 10);

  for (const g of guides) {
    const { email, ...data } = g;
    const created = await prisma.guide.create({
      data: { ...data, published: true, photo: PORTRAIT[g.slug] ?? PIC(g.slug) },
    });
    await prisma.user.create({
      data: { email, passwordHash: guideHash, role: "guide", guideId: created.id },
    });
    await prisma.availability.createMany({
      data: futureDates(6).map((date) => ({
        guideId: created.id,
        date,
        status: "AVAILABLE" as const,
      })),
    });

    // Démo : une réservation confirmée + une facture pour le premier guide.
    if (g.slug === "yossi-cohen") {
      const tourDate = futureDates(1, 5)[0];
      const booking = await prisma.booking.create({
        data: {
          guideId: created.id,
          startDate: tourDate,
          clientName: "Famille Martin",
          clientEmail: "martin@example.com",
          numPeople: 4,
          startTime: "09:00",
          message: "Visite privée de la vieille ville.",
          locale: "fr",
          status: "CONFIRMED",
        },
      });
      await prisma.invoice.create({
        data: {
          number: `INV-${new Date().getFullYear()}-0001`,
          guideId: created.id,
          bookingId: booking.id,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          tourDate,
          amount: 1200,
          currency: "ILS",
          notes: "Visite guidée privée — journée complète.",
          status: "SENT",
        },
      });
    }

    console.log(`✓ Guide : ${email} / guide1234  (${g.slug})`);
  }

  // Demande GÉNÉRALE de démo (sans guide) — visible côté admin.
  await prisma.booking.create({
    data: {
      guideId: null,
      startDate: futureDates(1, 10)[0],
      startTime: "10:00",
      clientName: "Groupe Bernard",
      clientEmail: "bernard@example.com",
      clientPhone: "+33 6 12 34 56 78",
      numPeople: 6,
      cities: ["jerusalem", "dead_sea", "masada"],
      langs: ["fr", "en"],
      message: "On aimerait 3 jours autour de Jérusalem et la Mer Morte, en français.",
      locale: "fr",
      status: "PENDING",
    },
  });

  console.log("\nSeed terminé. Pense à changer les mots de passe par défaut.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
