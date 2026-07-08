"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, assertOwnsGuide } from "@/lib/auth-guard";
import { setAvailabilitySchema } from "./schema";
import { fromDateKey } from "@/lib/utils";

type ActionState = { ok: boolean; error?: string };

// Le guide fixe le statut d'une date (upsert). Tap pour cycler côté UI.
export async function setAvailability(
  locale: string,
  raw: unknown,
): Promise<ActionState> {
  const user = await requireUser(locale);
  const parsed = setAvailabilitySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide" };
  }
  const { guideId, date, status, note } = parsed.data;
  assertOwnsGuide(user, guideId);

  const dateValue = fromDateKey(date);

  await prisma.availability.upsert({
    where: { guideId_date: { guideId, date: dateValue } },
    create: { guideId, date: dateValue, status, note: note || null },
    update: { status, note: note || null },
  });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/guides`);
  return { ok: true };
}
