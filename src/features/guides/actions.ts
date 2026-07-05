"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, requireAdmin, assertOwnsGuide } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";
import { guideProfileSchema, adminPublishSchema, createGuideSchema } from "./schema";

type ActionState = { ok: boolean; error?: string };

// Un guide met à jour SON profil (ou un admin).
export async function updateGuideProfile(
  locale: string,
  guideId: string,
  raw: unknown,
): Promise<ActionState> {
  const user = await requireUser(locale);
  assertOwnsGuide(user, guideId);

  const parsed = guideProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  await prisma.guide.update({
    where: { id: guideId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      photo: data.photo || null,
      city: data.city,
      languages: data.languages,
      specialties: data.specialties,
      yearsExperience: data.yearsExperience,
      phone: data.phone || null,
      bio: data.bio,
      notes: data.notes,
      gallery: data.gallery.map((m) => ({
        type: m.type,
        url: m.url,
        poster: m.poster || null,
        caption: m.caption || null,
      })),
      currency: data.currency,
      pricePerPersonHour: data.pricePerPersonHour ?? null,
      pricePerGroup: data.pricePerGroup ?? null,
      trips: data.trips.map((tr) => ({
        label: tr.label,
        price: tr.price,
        unit: tr.unit,
        duration: tr.duration ?? null,
        details: tr.details || null,
      })),
    },
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/guides`);
  return { ok: true };
}

// Admin : publie / dépublie un guide.
export async function setGuidePublished(
  locale: string,
  raw: unknown,
): Promise<ActionState> {
  await requireAdmin(locale);
  const parsed = adminPublishSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Données invalides" };

  await prisma.guide.update({
    where: { id: parsed.data.guideId },
    data: { published: parsed.data.published },
  });
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/guides`);
  return { ok: true };
}

// Admin : crée un compte guide (User + Guide) prêt à être complété.
function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function adminCreateGuide(
  locale: string,
  raw: unknown,
): Promise<ActionState & { guideId?: string }> {
  await requireAdmin(locale);
  const parsed = createGuideSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const d = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) return { ok: false, error: "Cet email existe déjà" };

  // slug unique
  let base = slugify(`${d.firstName}-${d.lastName}`) || "guide";
  let slug = base;
  let n = 1;
  while (await prisma.guide.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`;
  }

  const guide = await prisma.guide.create({
    data: {
      slug,
      firstName: d.firstName,
      lastName: d.lastName,
      city: d.city,
      languages: [],
      specialties: [],
      bio: {},
      notes: [],
      published: false,
    },
  });

  const passwordHash = await bcrypt.hash(d.password, 10);
  await prisma.user.create({
    data: { email: d.email, passwordHash, role: "guide", guideId: guide.id },
  });

  revalidatePath(`/${locale}/admin`);
  return { ok: true, guideId: guide.id };
}
