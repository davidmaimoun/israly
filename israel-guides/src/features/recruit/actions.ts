"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { recruitmentEmail } from "@/lib/email-templates";

const schema = z.object({
  to: z.string().email(),
  firstName: z.string().max(60).optional().or(z.literal("")),
  lang: z.enum(["fr", "en", "he"]),
  customText: z.string().max(1000).optional().or(z.literal("")),
  linkedin: z.string().max(300).optional().or(z.literal("")),
  portfolio: z.string().max(300).optional().or(z.literal("")),
});

export async function sendRecruitmentEmail(
  locale: string,
  raw: unknown,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin(locale);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalide" };
  const d = parsed.data;
  const mail = recruitmentEmail({
    firstName: d.firstName || "",
    lang: d.lang,
    customText: d.customText || "",
    linkedin: d.linkedin || "",
    portfolio: d.portfolio || "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://israly.com",
  });
  const res = await sendEmail({ to: d.to, ...mail });
  if (!res.ok) return { ok: false, error: res.error ?? "Échec de l'envoi" };
  return { ok: true };
}
