"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, assertOwnsGuide, requireAdmin } from "@/lib/auth-guard";
import { createBookingSchema, createTourRequestSchema, updateBookingStatusSchema, adminUpdateBookingSchema } from "./schema";
import { fromDateKey, toDateKey } from "@/lib/utils";
import { notifyAdminNewRequest, bookingConfirmationEmail, sendEmail } from "@/lib/email";

type ActionState = { ok: boolean; error?: string };

// PUBLIC — crée une demande PENDING (pas d'auth).
export async function createBooking(raw: unknown): Promise<ActionState> {
  const parsed = createBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide" };
  }
  const d = parsed.data;

  await prisma.booking.create({
    data: {
      guideId: d.guideId,
      startDate: fromDateKey(d.startDate),
      endDate: d.endDate ? fromDateKey(d.endDate) : null,
      clientName: d.clientName,
      clientEmail: d.clientEmail,
      clientPhone: d.clientPhone || null,
      numPeople: d.numPeople,
      startTime: d.startTime || null,
      preferredLang: d.preferredLang || null,
      message: d.message || null,
      locale: d.locale,
      status: "PENDING",
    },
  });

  await notifyAdminNewRequest({
    kind: "guide",
    clientName: d.clientName, clientEmail: d.clientEmail, clientPhone: d.clientPhone,
    numPeople: d.numPeople, date: d.startDate, cities: [], message: d.message || null,
  });
  revalidatePath(`/${d.locale}/admin`);
  return { ok: true };
}

// PUBLIC — demande générale sans guide (guideId = null). L'admin la traite.
export async function createTourRequest(raw: unknown): Promise<ActionState> {
  const parsed = createTourRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide" };
  }
  const d = parsed.data;
  await prisma.booking.create({
    data: {
      guideId: null,
      startDate: d.startDate ? fromDateKey(d.startDate) : new Date(),
      clientName: d.clientName,
      clientEmail: d.clientEmail,
      clientPhone: d.clientPhone || null,
      numPeople: d.numPeople,
      startTime: d.startTime || null,
      cities: d.cities,
      langs: d.langs,
      message: d.message || null,
      locale: d.locale,
      status: "PENDING",
    },
  });
  await notifyAdminNewRequest({
    kind: "general",
    clientName: d.clientName, clientEmail: d.clientEmail, clientPhone: d.clientPhone,
    numPeople: d.numPeople, date: d.startDate || null, cities: d.cities, message: d.message || null,
  });
  revalidatePath(`/${d.locale}/admin`);
  return { ok: true };
}

// GUIDE/ADMIN — change le statut + synchronise le calendrier.
export async function updateBookingStatus(
  locale: string,
  raw: unknown,
): Promise<ActionState> {
  const user = await requireUser(locale);
  const parsed = updateBookingStatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalide" };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
  });
  if (!booking) return { ok: false, error: "Réservation introuvable" };
  if (booking.guideId) {
    assertOwnsGuide(user, booking.guideId);
  } else if (user.role !== "admin") {
    return { ok: false, error: "Réservé à l'administrateur" };
  }

  const status = parsed.data.status;
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status },
  });

  // Sync calendrier : CONFIRMED -> date BOOKED ; DECLINED/CANCELLED -> libère.
  // (uniquement pour une réservation liée à un guide)
  if (status === "CONFIRMED" && booking.guideId) {
    await prisma.availability.upsert({
      where: { guideId_date: { guideId: booking.guideId, date: booking.startDate } },
      create: { guideId: booking.guideId, date: booking.startDate, status: "BOOKED" },
      update: { status: "BOOKED" },
    });
  } else if ((status === "DECLINED" || status === "CANCELLED") && booking.guideId) {
    await prisma.availability.updateMany({
      where: { guideId: booking.guideId, date: booking.startDate, status: "BOOKED" },
      data: { status: "AVAILABLE" },
    });
  }

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/guides`);
  return { ok: true };
}

// ADMIN — modifie date/heure/nb d'une réservation (proposer un autre créneau).
export async function adminUpdateBooking(locale: string, raw: unknown): Promise<ActionState> {
  await requireAdmin(locale);
  const parsed = adminUpdateBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide" };
  }
  const d = parsed.data;
  const data: { startDate: Date; startTime: string | null; numPeople: number; amount?: number } = {
    startDate: fromDateKey(d.startDate), startTime: d.startTime || null, numPeople: d.numPeople,
  };
  if (d.amount !== undefined) data.amount = d.amount;
  await prisma.booking.update({ where: { id: d.bookingId }, data });
  revalidatePath(`/${locale}/admin`);
  return { ok: true };
}
