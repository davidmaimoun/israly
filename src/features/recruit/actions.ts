"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { recruitmentEmail } from "@/lib/email-templates";

const schema = z.object({
  to: z.string().email(),
  firstName: z.string().max(60).optional().or(z.literal("")),
  lang: z.enum(["fr", "en", "he"]),
});

export async function sendRecruitmentEmail(
  locale: string,
  raw: unknown,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin(locale);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalide" };
  const d = parsed.data;
  const mail = recruitmentEmail({ firstName: d.firstName || "", lang: d.lang });
  const res = await sendEmail({ to: d.to, ...mail });
  if (!res.ok) return { ok: false, error: res.error ?? "Échec de l'envoi" };
  return { ok: true };
}
