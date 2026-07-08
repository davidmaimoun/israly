"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, assertOwnsGuide } from "@/lib/auth-guard";
import { fromDateKey } from "@/lib/utils";
import { createInvoiceSchema, invoiceStatusSchema } from "./schema";

type ActionState = { ok: boolean; error?: string; id?: string };

// Numéro séquentiel : INV-<année>-<NNNN> basé sur le compte annuel.
async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const count = await prisma.invoice.count({ where: { issuedAt: { gte: start } } });
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

// Un guide (ou admin) crée une facture, optionnellement liée à une réservation.
export async function createInvoice(locale: string, raw: unknown): Promise<ActionState> {
  const user = await requireUser(locale);
  const parsed = createInvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const d = parsed.data;
  assertOwnsGuide(user, d.guideId);

  // Si liée à une réservation, vérifier qu'elle appartient bien au guide.
  if (d.bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: d.bookingId } });
    if (!booking || booking.guideId !== d.guideId) {
      return { ok: false, error: "Réservation invalide" };
    }
  }

  const number = await nextInvoiceNumber();
  const created = await prisma.invoice.create({
    data: {
      number,
      guideId: d.guideId,
      bookingId: d.bookingId || null,
      clientName: d.clientName,
      clientEmail: d.clientEmail || null,
      tourDate: d.tourDate ? fromDateKey(d.tourDate) : null,
      amount: d.amount,
      currency: d.currency,
      notes: d.notes || null,
      status: "DRAFT",
    },
  });

  revalidatePath(`/${locale}/admin`);
  return { ok: true, id: created.id };
}

// Changer le statut (DRAFT -> SENT -> PAID).
export async function setInvoiceStatus(locale: string, raw: unknown): Promise<ActionState> {
  const user = await requireUser(locale);
  const parsed = invoiceStatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Données invalides" };

  const invoice = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId } });
  if (!invoice) return { ok: false, error: "Introuvable" };
  assertOwnsGuide(user, invoice.guideId);

  await prisma.invoice.update({
    where: { id: parsed.data.invoiceId },
    data: { status: parsed.data.status },
  });
  revalidatePath(`/${locale}/admin`);
  return { ok: true };
}
