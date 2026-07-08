// Constructeurs d'e-mails PURS (aucun import serveur) — utilisables côté client
// (preview) comme côté serveur (envoi via Resend).

const C = { deep: "#214f80", blue: "#2f6db0", ink: "#1b2c3d", soft: "#586b7d", paper: "#fbfaf6", line: "#e6e1d6", sky: "#8bb8dd" };
type Loc = "he" | "en" | "fr" | "ru" | "es" | "am";
const LOCS: Loc[] = ["he", "en", "fr", "ru", "es", "am"];
const pick = <T,>(d: Record<Loc, T>, l: string): T => d[(LOCS.includes(l as Loc) ? l : "en") as Loc];
const sym = (c: string) => (c === "USD" ? "$" : c === "EUR" ? "€" : "₪");

function fmtDate(iso: string, l: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(l === "he" ? "he-IL" : l, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function shell(inner: string, dir: "rtl" | "ltr"): string {
  const align = dir === "rtl" ? "right" : "left";
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:${C.paper};font-family:Arial,Helvetica,sans-serif;color:${C.ink}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};padding:24px 0"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid ${C.line};border-radius:16px;overflow:hidden">
      <tr><td style="background:${C.deep};padding:22px 28px" align="${align}"><span style="font-size:26px;font-weight:800;color:#fff">isra<span style="color:${C.sky}">ly</span></span></td></tr>
      <tr><td style="padding:28px">${inner}</td></tr>
      <tr><td style="padding:18px 28px;background:${C.paper};border-top:1px solid ${C.line};color:${C.soft};font-size:12px" align="center">Israly — tours &amp; local guides in Israel</td></tr>
    </table></td></tr></table></body></html>`;
}
const rowHtml = (label: string, value: string) =>
  `<tr><td style="padding:6px 0;color:${C.soft};font-size:14px">${label}</td><td style="padding:6px 0;color:${C.ink};font-size:14px;font-weight:bold" align="right">${value}</td></tr>`;

const T = {
  hi: { he: "שלום", en: "Hi", fr: "Bonjour", ru: "Здравствуйте", es: "Hola", am: "ሰላም" },
  general: { he: "סיור בישראל", en: "Israel tour", fr: "Circuit en Israël", ru: "Тур по Израилю", es: "Tour por Israel", am: "የእስራኤል ጉብኝት" },
  guide: { he: "מדריך", en: "Guide", fr: "Guide", ru: "Гид", es: "Guía", am: "መሪ" },
  date: { he: "תאריך", en: "Date", fr: "Date", ru: "Дата", es: "Fecha", am: "ቀን" },
  people: { he: "משתתפים", en: "Travellers", fr: "Voyageurs", ru: "Человек", es: "Viajeros", am: "ተጓዦች" },
  total: { he: "סה\u201dכ", en: "Total", fr: "Total", ru: "Итого", es: "Total", am: "ጠቅላላ" },
  bye: { he: "נתראה בישראל! — צוות Israly", en: "See you in Israel! — The Israly team", fr: "À bientôt en Israël ! — L'équipe Israly", ru: "Увидимся в Израиле! — Команда Israly", es: "¡Nos vemos en Israel! — El equipo de Israly", am: "በእስራኤል እንገናኝ! — የ Israly ቡድን" },
  // confirm
  cSubject: { he: "המדריך פנוי — Israly", en: "Your guide is available — Israly", fr: "Votre guide est disponible — Israly", ru: "Ваш гид доступен — Israly", es: "Tu guía está disponible — Israly", am: "መሪዎ ዝግጁ ነው — Israly" },
  cIntro: { he: "בשורה טובה! המדריך פנוי לתאריך שביקשת.", en: "Good news! Your guide is available for your requested date.", fr: "Bonne nouvelle ! Votre guide est disponible pour la date demandée.", ru: "Хорошая новость! Ваш гид доступен на выбранную дату.", es: "¡Buenas noticias! Tu guía está disponible para la fecha solicitada.", am: "ጥሩ ዜና! መሪዎ በጠየቁት ቀን ዝግጁ ነው።" },
  cPay: { he: "לתשלום ולאישור", en: "Pay & confirm", fr: "Payer & confirmer", ru: "Оплатить и подтвердить", es: "Pagar y confirmar", am: "ይክፈሉ እና ያረጋግጡ" },
  cPayNote: { he: "להשלמת ההזמנה, יש להשלים את התשלום דרך הקישור.", en: "To secure your booking, please complete the payment via the link below.", fr: "Pour garantir votre réservation, finalisez le paiement via le lien ci-dessous.", ru: "Чтобы забронировать, завершите оплату по ссылке ниже.", es: "Para asegurar tu reserva, completa el pago con el enlace de abajo.", am: "ማስያዣዎን ለማረጋገጥ በታች ባለው አገናኝ ክፍያዎን ያጠናቅቁ።" },
  // propose
  pSubject: { he: "תאריכים חלופיים — Israly", en: "Alternative dates — Israly", fr: "Dates alternatives — Israly", ru: "Другие даты — Israly", es: "Fechas alternativas — Israly", am: "አማራጭ ቀኖች — Israly" },
  pIntro: { he: "לצערנו המדריך אינו פנוי בתאריך שביקשת. הנה כמה חלופות:", en: "Unfortunately your guide isn't available on your requested date. Here are some alternatives:", fr: "Malheureusement, votre guide n'est pas disponible à la date demandée. Voici quelques alternatives :", ru: "К сожалению, гид недоступен на выбранную дату. Вот варианты:", es: "Lamentablemente tu guía no está disponible en esa fecha. Aquí hay alternativas:", am: "በሚያሳዝን ሁኔታ መሪዎ በጠየቁት ቀን ዝግጁ አይደለም። አማራጮች እነሆ:" },
  pAlt: { he: "תאריכים אפשריים", en: "Possible dates", fr: "Dates possibles", ru: "Возможные даты", es: "Fechas posibles", am: "ሊሆኑ የሚችሉ ቀኖች" },
  pReply: { he: "השיבו לאימייל זה עם התאריך המועדף עליכם.", en: "Just reply to this email with the date that suits you best.", fr: "Répondez simplement à cet e-mail avec la date qui vous convient le mieux.", ru: "Просто ответьте на это письмо с удобной датой.", es: "Responde a este correo con la fecha que prefieras.", am: "የሚመችዎትን ቀን በዚህ ኢሜይል ይመልሱ።" },
};

type Base = { clientName: string; guideName: string | null; dateISO: string; locale: string };

export function confirmEmail(d: Base & { time: string | null; numPeople: number; amount: number | null; currency: string; paymentLink?: string }) {
  const l = d.locale, dir = l === "he" ? "rtl" : "ltr";
  const guide = d.guideName ?? pick(T.general, l);
  const has = d.amount != null && d.amount > 0;
  const pay = d.paymentLink
    ? `<p style="margin:20px 0 8px;color:${C.soft};font-size:14px">${pick(T.cPayNote, l)}</p><a href="${d.paymentLink}" style="display:inline-block;background:${C.blue};color:#fff;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:999px;font-size:15px">${pick(T.cPay, l)}${has ? ` · ${sym(d.currency)}${d.amount}` : ""}</a>`
    : "";
  const inner = `<p style="margin:0 0 6px;font-size:16px">${pick(T.hi, l)} ${d.clientName},</p>
    <p style="margin:0 0 18px;font-size:15px;color:${C.soft}">${pick(T.cIntro, l)}</p>
    <div style="border:1px solid ${C.line};border-radius:12px;padding:14px 16px;background:${C.paper}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rowHtml(pick(T.guide, l), guide)}${rowHtml(pick(T.date, l), fmtDate(d.dateISO, l) + (d.time ? ` · ${d.time}` : ""))}${rowHtml(pick(T.people, l), String(d.numPeople))}${has ? rowHtml(pick(T.total, l), `${sym(d.currency)}${d.amount}`) : ""}
    </table></div>${pay}
    <p style="margin:22px 0 0;color:${C.ink};font-size:14px">${pick(T.bye, l)}</p>`;
  return { subject: pick(T.cSubject, l), html: shell(inner, dir) };
}

export function proposeEmail(d: Base & { altDates: string; note?: string }) {
  const l = d.locale, dir = l === "he" ? "rtl" : "ltr";
  const inner = `<p style="margin:0 0 6px;font-size:16px">${pick(T.hi, l)} ${d.clientName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.soft}">${pick(T.pIntro, l)}</p>
    <div style="border:1px solid ${C.line};border-radius:12px;padding:14px 16px;background:${C.paper}">
      <p style="margin:0 0 4px;font-weight:bold;color:${C.deep};font-size:14px">${pick(T.pAlt, l)}</p>
      <p style="margin:0;color:${C.ink};font-size:15px">${d.altDates}</p>
    </div>
    ${d.note ? `<p style="margin:16px 0 0;color:${C.soft};font-size:14px">${d.note}</p>` : ""}
    <p style="margin:18px 0 0;color:${C.ink};font-size:14px">${pick(T.pReply, l)}</p>
    <p style="margin:16px 0 0;color:${C.ink};font-size:14px">${pick(T.bye, l)}</p>`;
  return { subject: pick(T.pSubject, l), html: shell(inner, dir) };
}

export function confirmText(d: Base & { numPeople: number; amount: number | null; currency: string; paymentLink?: string }) {
  const l = d.locale;
  const has = d.amount != null && d.amount > 0;
  return [`${pick(T.hi, l)} ${d.clientName},`, pick(T.cIntro, l), "",
    `${pick(T.date, l)}: ${fmtDate(d.dateISO, l)}`, `${pick(T.people, l)}: ${d.numPeople}`,
    has ? `${pick(T.total, l)}: ${sym(d.currency)}${d.amount}` : "",
    d.paymentLink ? `${pick(T.cPay, l)}: ${d.paymentLink}` : "", "", pick(T.bye, l)].filter(Boolean).join("\n");
}

export function proposeText(d: Base & { altDates: string; note?: string }) {
  const l = d.locale;
  return [`${pick(T.hi, l)} ${d.clientName},`, pick(T.pIntro, l), "",
    `${pick(T.pAlt, l)}: ${d.altDates}`, d.note || "", "", pick(T.pReply, l), pick(T.bye, l)].filter(Boolean).join("\n");
}

// Notif admin (FR)
export function adminNotifyEmail(d: { kind: "guide" | "general"; clientName: string; clientEmail: string; clientPhone: string | null; numPeople: number; dateISO: string | null; cities: string[]; message: string | null }) {
  const inner = `<p style="margin:0 0 12px;font-size:16px;font-weight:bold">Nouvelle demande (${d.kind === "general" ? "générale" : "guide"})</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rowHtml("Client", d.clientName)}${rowHtml("Email", d.clientEmail)}${rowHtml("Téléphone", d.clientPhone ?? "—")}${rowHtml("Voyageurs", String(d.numPeople))}${rowHtml("Date", d.dateISO ? fmtDate(d.dateISO, "fr") : "—")}${d.cities.length ? rowHtml("Régions", d.cities.join(", ")) : ""}
    </table>${d.message ? `<p style="margin:14px 0 0;color:${C.soft};font-size:14px">“${d.message}”</p>` : ""}`;
  return { subject: "Israly — nouvelle demande", html: shell(inner, "ltr") };
}

// ---- Recrutement des guides (FR / EN / HE) ----
export type RecruitInput = { firstName: string; lang: "fr" | "en" | "he" };

const RE: Record<"fr" | "en" | "he", {
  subject: string; hi: (n: string) => string; intro: string; handles: string;
  founding: string; bullets: string[]; split: string; terms: string; cta: string; bye: string;
}> = {
  fr: {
    subject: "Israly — devenez guide fondateur",
    hi: (n) => `Bonjour ${n},`,
    intro: "Je lance Israly, une nouvelle plateforme qui met en relation des guides locaux licenciés en Israël avec des voyageurs du monde entier (français, anglais, hébreu, russe, espagnol…).",
    handles: "L'idée est simple : vous vous concentrez sur ce que vous faites de mieux — guider — et Israly s'occupe du reste : une page de profil soignée, la mise en avant, les réservations, le paiement sécurisé et le support client.",
    founding: "La plateforme ouvre dans environ un mois, et je cherche quelques guides fondateurs pour démarrer. Être parmi les premiers, c'est :",
    bullets: ["une mise en avant privilégiée sur le site", "un accompagnement pour créer votre profil (je m'occupe même de la présentation et des photos)", "aucun frais d'inscription"],
    split: "Le principe est transparent : vous recevez 90 % du montant de chaque réservation, et Israly prend 10 % pour la plateforme, la promotion et le paiement.",
    terms: "Les conditions — dont une protection en cas d'annulation de dernière minute — sont détaillées dans le document joint.",
    cta: "Si l'idée vous intéresse, répondez-moi avec vos langues, vos régions et vos types de circuits, et je vous prépare votre profil.",
    bye: "Au plaisir d'échanger,",
  },
  en: {
    subject: "Israly — become a founding guide",
    hi: (n) => `Hi ${n},`,
    intro: "I'm launching Israly, a new platform that connects licensed local guides in Israel with travelers from around the world (English, French, Hebrew, Russian, Spanish…).",
    handles: "The idea is simple: you focus on what you do best — guiding — and Israly handles the rest: a polished profile page, promotion, bookings, secure payment, and customer support.",
    founding: "The platform opens in about a month, and I'm looking for a few founding guides to start with. Being among the first means:",
    bullets: ["priority visibility on the site", "help setting up your profile (I even take care of the layout and photos)", "no sign-up fees"],
    split: "The terms are transparent: you receive 90% of every booking, and Israly keeps 10% for the platform, promotion, and payment handling.",
    terms: "The full terms — including protection against last-minute cancellations — are in the attached document.",
    cta: "If this sounds interesting, reply with your languages, regions, and the kinds of tours you offer, and I'll set up your profile.",
    bye: "Looking forward to it,",
  },
  he: {
    subject: "Israly — הצטרפו כמדריכים מייסדים",
    hi: (n) => `שלום ${n},`,
    intro: "אני משיק את Israly, פלטפורמה חדשה שמחברת בין מדריכי טיולים מורשים בישראל לבין מטיילים מכל העולם (אנגלית, צרפתית, עברית, רוסית, ספרדית…).",
    handles: "הרעיון פשוט: אתם מתמקדים במה שאתם עושים הכי טוב — להדריך — ו-Israly דואגת לכל השאר: עמוד פרופיל מוקפד, קידום, הזמנות, תשלום מאובטח ותמיכה בלקוחות.",
    founding: "הפלטפורמה נפתחת בעוד כחודש, ואני מחפש כמה מדריכים מייסדים להתחלה. להיות בין הראשונים זה אומר:",
    bullets: ["חשיפה מועדפת באתר", "ליווי בהקמת הפרופיל (אני דואג גם לעיצוב ולתמונות)", "ללא דמי הצטרפות"],
    split: "התנאים שקופים: אתם מקבלים 90% מכל הזמנה, ו-Israly גובה 10% עבור הפלטפורמה, הקידום והתשלום.",
    terms: "התנאים המלאים — כולל הגנה מפני ביטולים ברגע האחרון — מפורטים במסמך המצורף.",
    cta: "אם זה מעניין אתכם, השיבו עם השפות, האזורים וסוגי הסיורים שלכם, ואקים לכם פרופיל.",
    bye: "בשמחה,",
  },
};

export function recruitmentEmail(d: RecruitInput): { subject: string; html: string } {
  const t = RE[d.lang] ?? RE.en;
  const dir = d.lang === "he" ? "rtl" : "ltr";
  const bullets = t.bullets.map((b) => `<li style="margin:2px 0;color:${C.ink};font-size:14px">${b}</li>`).join("");
  const inner = `
    <p style="margin:0 0 6px;font-size:16px">${t.hi(d.firstName || "")}</p>
    <p style="margin:0 0 14px;font-size:15px;color:${C.soft}">${t.intro}</p>
    <p style="margin:0 0 14px;font-size:14px;color:${C.ink}">${t.handles}</p>
    <p style="margin:0 0 6px;font-size:14px;color:${C.ink}">${t.founding}</p>
    <ul style="margin:0 0 14px;padding-${dir === "rtl" ? "right" : "left"}:18px">${bullets}</ul>
    <div style="border:1px solid ${C.line};border-radius:12px;padding:12px 16px;background:${C.paper};margin-bottom:14px">
      <p style="margin:0;font-weight:bold;color:${C.deep};font-size:14px">${t.split}</p>
    </div>
    <p style="margin:0 0 14px;font-size:14px;color:${C.soft}">${t.terms}</p>
    <p style="margin:0 0 18px;font-size:14px;color:${C.ink}">${t.cta}</p>
    <p style="margin:0;color:${C.ink};font-size:14px">${t.bye}<br>David — Israly</p>`;
  return { subject: t.subject, html: shell(inner, dir) };
}

export function recruitmentText(d: RecruitInput): string {
  const t = RE[d.lang] ?? RE.en;
  return [t.hi(d.firstName || ""), "", t.intro, "", t.handles, "", t.founding, ...t.bullets.map((b) => `• ${b}`), "", t.split, "", t.terms, "", t.cta, "", t.bye, "David — Israly"].join("\n");
}
