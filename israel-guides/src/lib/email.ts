import { Resend } from "resend";
import { adminNotifyEmail } from "./email-templates";

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "Israly <onboarding@resend.dev>";
const ADMIN = process.env.ADMIN_EMAIL || "sudosudev@outlook.com";

const resend = KEY ? new Resend(KEY) : null;

// Envoi bas niveau — ne casse jamais le flux si la clé manque ou si l'API échoue.
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY absent — non envoyé:", opts.subject);
    return { ok: false, error: "RESEND_API_KEY manquante (aucun envoi en local)." };
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html });
    if (error) {
      console.error("[email] Resend a refusé:", error);
      return { ok: false, error: error.message || String(error) };
    }
    console.log("[email] envoyé:", data?.id, "->", opts.to);
    return { ok: true };
  } catch (e) {
    console.error("[email] échec envoi:", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Notif admin à chaque nouvelle demande.
export async function notifyAdminNewRequest(d: Parameters<typeof adminNotifyEmail>[0]): Promise<void> {
  const { subject, html } = adminNotifyEmail(d);
  await sendEmail({ to: ADMIN, subject, html });
}
