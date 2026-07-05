import { Resend } from "resend";

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "Israly <onboarding@resend.dev>";
const ADMIN = process.env.ADMIN_EMAIL || "sudosudev@outlook.com";
const PAY_URL = process.env.PAYMENT_URL || "";

const resend = KEY ? new Resend(KEY) : null;

type Loc = "he" | "en" | "fr" | "ru" | "es" | "am";
const pick = <T,>(d: Record<Loc, T>, l: string): T => d[(["he","en","fr","ru","es","am"].includes(l) ? l : "en") as Loc];

// Envoi bas niveau — ne casse jamais le flux si la clé manque ou si l'API échoue.
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (!resend) { console.warn("[email] RESEND_API_KEY absent — email non envoyé:", opts.subject); return; }
  try {
    await resend.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html });
  } catch (e) {
    console.error("[email] échec envoi:", e);
  }
}

const C = { blue: "#2f6db0", deep: "#214f80", ink: "#1b2c3d", soft: "#586b7d", paper: "#fbfaf6", line: "#e6e1d6", sky: "#8bb8dd" };

function shell(inner: string, dir: "rtl" | "ltr" = "ltr"): string {
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:${C.paper};font-family:Arial,Helvetica,sans-serif;color:${C.ink}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid ${C.line};border-radius:16px;overflow:hidden">
        <tr><td style="background:${C.deep};padding:22px 28px" align="${dir === "rtl" ? "right" : "left"}">
          <span style="font-size:26px;font-weight:800;color:#fff;letter-spacing:.5px">isra<span style="color:${C.sky}">ly</span></span>
        </td></tr>
        <tr><td style="padding:28px">${inner}</td></tr>
        <tr><td style="padding:18px 28px;background:${C.paper};border-top:1px solid ${C.line};color:${C.soft};font-size:12px" align="center">
          Israly — tours &amp; local guides in Israel
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:${C.soft};font-size:14px">${label}</td>
  <td style="padding:6px 0;color:${C.ink};font-size:14px;font-weight:bold" align="right">${value}</td></tr>`;
}

export type ConfirmData = {
  clientName: string;
  clientEmail: string;
  guideName: string | null;
  date: string;
  time: string | null;
  numPeople: number;
  amount: number | null;
  currency: string;
  locale: string;
};

const T = {
  subject: { he: "ההזמנה שלך ב-Israly אושרה 🎉", en: "Your Israly booking is confirmed 🎉", fr: "Votre réservation Israly est confirmée 🎉", ru: "Ваше бронирование Israly подтверждено 🎉", es: "Tu reserva de Israly está confirmada 🎉", am: "የ Israly ማስያዣዎ ተረጋግጧል 🎉" },
  hi: { he: "שלום", en: "Hi", fr: "Bonjour", ru: "Здравствуйте", es: "Hola", am: "ሰላም" },
  intro: { he: "בשורה טובה — הבקשה שלך אושרה.", en: "Great news — your request has been confirmed.", fr: "Bonne nouvelle — votre demande a été confirmée.", ru: "Хорошая новость — ваш запрос подтверждён.", es: "Buenas noticias: tu solicitud ha sido confirmada.", am: "ጥሩ ዜና — ጥያቄዎ ተረጋግጧል።" },
  recap: { he: "סיכום ההזמנה", en: "Booking summary", fr: "Récapitulatif", ru: "Сводка бронирования", es: "Resumen de la reserva", am: "የማስያዣ ማጠቃለያ" },
  guide: { he: "מדריך", en: "Guide", fr: "Guide", ru: "Гид", es: "Guía", am: "መሪ" },
  date: { he: "תאריך", en: "Date", fr: "Date", ru: "Дата", es: "Fecha", am: "ቀን" },
  time: { he: "שעה", en: "Time", fr: "Heure", ru: "Время", es: "Hora", am: "ሰዓት" },
  people: { he: "משתתפים", en: "People", fr: "Personnes", ru: "Человек", es: "Personas", am: "ሰዎች" },
  total: { he: "סה\u201dכ", en: "Total", fr: "Total", ru: "Итого", es: "Total", am: "ጠቅላላ" },
  general: { he: "סיור בישראל", en: "Israel tour", fr: "Circuit en Israël", ru: "Тур по Израилю", es: "Tour por Israel", am: "የእስራኤል ጉብኝት" },
  pay: { he: "לתשלום", en: "Pay now", fr: "Payer maintenant", ru: "Оплатить", es: "Pagar ahora", am: "አሁን ይክፈሉ" },
  payNote: { he: "להשלמת ההזמנה, יש להשלים את התשלום.", en: "Complete your payment to secure your spot.", fr: "Finalisez le paiement pour garantir votre place.", ru: "Завершите оплату, чтобы забронировать место.", es: "Completa el pago para asegurar tu lugar.", am: "ቦታዎን ለማረጋገጥ ክፍያዎን ያጠናቅቁ።" },
  soon: { he: "ניצור איתך קשר בקרוב עם השלבים הבאים.", en: "We'll be in touch shortly with the next steps.", fr: "Nous revenons vers vous très vite pour la suite.", ru: "Мы свяжемся с вами в ближайшее время.", es: "Te contactaremos pronto con los próximos pasos.", am: "በቅርቡ ስለሚቀጥሉት ደረጃዎች እናገኝዎታለን።" },
  bye: { he: "נתראה בישראל! — צוות Israly", en: "See you in Israel! — The Israly team", fr: "À bientôt en Israël ! — L'équipe Israly", ru: "Увидимся в Израиле! — Команда Israly", es: "¡Nos vemos en Israel! — El equipo de Israly", am: "በእስራኤል እንገናኝ! — የ Israly ቡድን" },
};

export function bookingConfirmationEmail(d: ConfirmData): { subject: string; html: string } {
  const l = d.locale;
  const dir = l === "he" ? "rtl" : "ltr";
  const guide = d.guideName ?? pick(T.general, l);
  const hasAmount = d.amount != null && d.amount > 0;
  const sym = d.currency === "USD" ? "$" : d.currency === "EUR" ? "€" : "₪";
  const payBlock = hasAmount && PAY_URL
    ? `<p style="margin:20px 0 8px;color:${C.soft};font-size:14px">${pick(T.payNote, l)}</p>
       <a href="${PAY_URL}" style="display:inline-block;background:${C.blue};color:#fff;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:999px;font-size:15px">${pick(T.pay, l)} ${sym}${d.amount}</a>`
    : `<p style="margin:20px 0 0;color:${C.soft};font-size:14px">${pick(T.soon, l)}</p>`;

  const inner = `
    <p style="margin:0 0 6px;font-size:16px">${pick(T.hi, l)} ${d.clientName},</p>
    <p style="margin:0 0 18px;font-size:15px;color:${C.soft}">${pick(T.intro, l)}</p>
    <div style="border:1px solid ${C.line};border-radius:12px;padding:14px 16px;background:${C.paper}">
      <p style="margin:0 0 8px;font-weight:bold;color:${C.deep};font-size:14px">${pick(T.recap, l)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row(pick(T.guide, l), guide)}
        ${row(pick(T.date, l), d.date + (d.time ? ` · ${d.time}` : ""))}
        ${row(pick(T.people, l), String(d.numPeople))}
        ${hasAmount ? row(pick(T.total, l), `${sym}${d.amount}`) : ""}
      </table>
    </div>
    ${payBlock}
    <p style="margin:22px 0 0;color:${C.ink};font-size:14px">${pick(T.bye, l)}</p>`;

  return { subject: pick(T.subject, l), html: shell(inner, dir) };
}

// Notif admin (nouvelle demande) — en français, pour David.
export async function notifyAdminNewRequest(d: {
  kind: "guide" | "general";
  clientName: string; clientEmail: string; clientPhone: string | null;
  numPeople: number; date: string | null; cities: string[]; message: string | null;
}): Promise<void> {
  const inner = `
    <p style="margin:0 0 12px;font-size:16px;font-weight:bold">Nouvelle demande (${d.kind === "general" ? "générale" : "guide"})</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Client", d.clientName)}
      ${row("Email", d.clientEmail)}
      ${row("Téléphone", d.clientPhone ?? "—")}
      ${row("Personnes", String(d.numPeople))}
      ${row("Date", d.date ?? "—")}
      ${d.cities.length ? row("Régions", d.cities.join(", ")) : ""}
    </table>
    ${d.message ? `<p style="margin:14px 0 0;color:${C.soft};font-size:14px">“${d.message}”</p>` : ""}`;
  await sendEmail({ to: ADMIN, subject: "Israly — nouvelle demande", html: shell(inner) });
}
