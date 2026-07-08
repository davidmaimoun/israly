"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createBooking } from "@/features/bookings/actions";
import { LANGUAGES } from "@/lib/languages";
import { formatPrice, parseItinerary, formatDuration, type Trip } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
import { CalendarCheck, Loader2, X, Ticket, ChevronDown, MessageCircle, Coins, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

const OWNER_WA = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/[^\d]/g, "");

type Props = {
  guideId: string;
  firstName: string;
  languages: string[];
  currency: string;
  pricePerPersonHour: number | null;
  pricePerGroup: number | null;
  trips: Trip[];
};

export function GuideBooking(props: Props) {
  const { currency, pricePerPersonHour, pricePerGroup, trips } = props;
  const t = useTranslations("guide");
  const tpu = useTranslations("admin.pricing");

  const [open, setOpen] = useState(false);
  const [tour, setTour] = useState("");
  const [details, setDetails] = useState<number | null>(null);

  const hasPricing = pricePerPersonHour != null || pricePerGroup != null || trips.length > 0;
  const startBooking = (tourLabel?: string) => {
    setTour(tourLabel ?? "");
    setOpen(true);
  };

  return (
    <section id="book" className="mt-10 scroll-mt-24">
      {hasPricing && (
        <>
          <h2 className="display mb-4 text-2xl">{t("tours")}</h2>

          {(pricePerPersonHour != null || pricePerGroup != null) && (
            <div className="mb-4 flex flex-wrap gap-3">
              {pricePerPersonHour != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-4 py-2 text-sm font-medium text-ink">
                  <Coins size={15} className="text-primary" /> {formatPrice(pricePerPersonHour, currency)} · {tpu("unit.perPersonHour")}
                </span>
              )}
              {pricePerGroup != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-4 py-2 text-sm font-medium text-ink">
                  <Coins size={15} className="text-primary" /> {formatPrice(pricePerGroup, currency)} · {tpu("unit.perGroup")}
                </span>
              )}
            </div>
          )}

          {trips.length > 0 && (
            <div className="grid gap-3">
              {trips.map((tr, i) => (
                <div
                  key={i}
                  onClick={() => (tr.itinerary || tr.details) && setDetails(details === i ? null : i)}
                  className={cn(
                    "rounded-[var(--radius-card)] border border-stone/70 bg-surface p-4 transition-colors",
                    (tr.itinerary || tr.details) && "cursor-pointer hover:border-primary/40",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{tr.label}</p>
                      <p className="text-sm text-ink-soft">
                        {formatPrice(tr.price, currency)}
                        <span className="ms-1 text-xs">{tpu(`unit.${tr.unit}`)}</span>
                        {tr.duration ? <span className="ms-1 text-xs">· {tr.duration} h</span> : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startBooking(tr.label); }}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-cream hover:brightness-110"
                    >
                      <Ticket size={15} /> {t("bookThisTour")}
                    </button>
                  </div>
                  {(tr.itinerary || tr.details) && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-secondary">
                        {details === i ? t("hideDetails") : t("seeDetails")}
                        <ChevronDown size={14} className={cn("transition-transform", details === i && "rotate-180")} />
                      </span>
                      {details === i && <Itinerary itinerary={tr.itinerary} details={tr.details} />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Bouton réserver bien visible */}
      <div className="mt-6 rounded-[var(--radius-card)] border border-primary/30 bg-primary/5 p-5 text-center">
        <Button size="lg" onClick={() => startBooking()} className="w-full sm:w-auto">
          <CalendarCheck size={18} /> {t("book")}
        </Button>
      </div>

      <BookingDrawer
        {...props}
        open={open}
        tour={tour}
        setTour={setTour}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}

function BookingDrawer({
  guideId,
  firstName,
  languages,
  trips,
  open,
  tour,
  setTour,
  onClose,
}: Props & { open: boolean; tour: string; setTour: (v: string) => void; onClose: () => void }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("guide");
  const tb = useTranslations("booking");
  const tl = useTranslations("langs");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneErr, setPhoneErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [lang, setLang] = useState("");
  const [message, setMessage] = useState("");

  // Seules les langues du guide sont proposées.
  const guideLangs = LANGUAGES.filter((l) => languages.includes(l.code));

  const composedMessage = () =>
    [tour ? `[${tb("tour")}: ${tour}]` : null, message].filter(Boolean).join(" ");

  function submit() {
    setError(null); setPhoneErr(null);
    if (!name || !email || !date) { setError(tb("error")); return; }
    if (!phone) { setPhoneErr(tb("phoneRequired")); return; }
    start(async () => {
      const res = await createBooking({
        guideId,
        startDate: date,
        endDate: "",
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        numPeople: Number(people || 1),
        startTime: time,
        preferredLang: lang,
        message: composedMessage(),
        locale,
      });
      if (res.ok) setDone(true);
      else setError(res.error ?? tb("error"));
    });
  }

  function whatsapp() {
    if (!OWNER_WA) return;
    if (!name || !email || !date) { setError(tb("error")); return; }
    if (!phone) { setPhoneErr(tb("phoneRequired")); return; }
    const body = [
      t("bookWith", { name: firstName }),
      "",
      `${tb("name")}: ${name}`,
      `${tb("email")}: ${email}`,
      phone ? `${tb("phone")}: ${phone}` : null,
      `${tb("people")}: ${people}`,
      `${tb("startDate")}: ${date}${time ? ` ${time}` : ""}`,
      lang ? `${tb("preferredLang")}: ${tl(lang)}` : null,
      tour ? `${tb("tour")}: ${tour}` : null,
      message ? `${tb("message")}: ${message}` : null,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${OWNER_WA}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
  }

  return (
    <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      {/* Fond */}
      <div
        onClick={onClose}
        className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
      />
      {/* Panneau */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-stone px-5 py-4">
          <h3 className="display text-lg">{t("bookWith", { name: firstName })}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink-soft hover:bg-sand">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {done ? (
            <div className="rounded-[var(--radius-card)] border border-success/30 bg-success/10 p-6 text-center">
              <CalendarCheck className="mx-auto mb-2 text-success" />
              <p className="font-medium text-ink">{tb("success")}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <Field label={tb("name")} value={name} onChange={setName} required />
              <Field label={tb("email")} value={email} onChange={setEmail} type="email" required />
              <Field label={tb("phone")} value={phone} onChange={(v) => { setPhone(v); setPhoneErr(null); }} required error={phoneErr} />
              <div className="grid grid-cols-2 gap-3">
                <Field label={tb("startDate")} value={date} onChange={setDate} type="date" required />
                <Field label={tb("time")} value={time} onChange={setTime} type="time" />
              </div>
              <Field label={tb("people")} value={people} onChange={setPeople} type="number" />

              {guideLangs.length > 0 && (
                <div>
                  <label className="eyebrow mb-1 block">{tb("preferredLang")}</label>
                  <select value={lang} onChange={(e) => setLang(e.target.value)} className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3 text-sm">
                    <option value="">{tb("anyLang")}</option>
                    {guideLangs.map((l) => <option key={l.code} value={l.code}>{l.flag} {tl(l.code)}</option>)}
                  </select>
                </div>
              )}

              {trips.length > 0 && (
                <div>
                  <label className="eyebrow mb-1 block">{tb("tour")}</label>
                  <select value={tour} onChange={(e) => setTour(e.target.value)} className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3 text-sm">
                    <option value="">{tb("tourAny")}</option>
                    {trips.map((tr, i) => <option key={i} value={tr.label}>{tr.label}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="eyebrow mb-1 block">{tb("message")}</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full rounded-xl border border-stone bg-cream/50 px-3 py-2 text-sm" />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}
              <p className="text-xs text-ink-soft">{tb("note")}</p>
            </div>
          )}
        </div>

        {!done && (
          <div className="grid gap-2 border-t border-stone px-5 py-4">
            <Button onClick={submit} size="lg" disabled={pending} className="w-full">
              {pending ? <Loader2 className="animate-spin" size={18} /> : <CalendarCheck size={18} />}
              {tb("submit")}
            </Button>
            {OWNER_WA && (
              <button
                type="button"
                onClick={whatsapp}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-base font-semibold text-white"
              >
                <MessageCircle size={18} /> {tb("whatsapp")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, error }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; error?: string | null }) {
  return (
    <div>
      <label className="eyebrow mb-1 block">{label}{required && <span className="text-danger"> *</span>}</label>
      {error && <p className="mb-1 text-xs font-medium text-danger">{error}</p>}
      <input type={type} value={value} required={required} min={type === "number" ? 1 : undefined} onChange={(e) => onChange(e.target.value)} className={cn("h-11 w-full rounded-xl border bg-cream/50 px-3 text-sm", error ? "border-danger" : "border-stone")} />
    </div>
  );
}


// Programme d'un circuit : itinéraire structuré (heure/durée + label localisé),
// avec repli sur l'ancien texte libre.
function Itinerary({ itinerary, details }: { itinerary: string | null; details: string | null }) {
  const locale = useLocale();
  const stops = parseItinerary(itinerary);

  if (stops.length > 0) {
    return (
      <ul className="mt-2 space-y-1.5 border-s-2 border-accent/40 ps-3">
        {stops.map((s, idx) => {
          const label = s.label[locale] || Object.values(s.label).find(Boolean) || "";
          const key = s.mode === "time" ? s.time : formatDuration(s.durationMin);
          return (
            <li key={idx} className="flex gap-3 text-sm">
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums text-primary">
                {s.mode === "time" ? <Clock size={13} /> : <Timer size={13} />} {key}
              </span>
              <span className="text-ink-soft">{label}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (!details) return null;
  const matches = [...details.matchAll(/(\d{1,2}[:hH.]\d{2})\s*([^]*?)(?=\s*\d{1,2}[:hH.]\d{2}|$)/g)]
    .map((m) => ({ time: m[1].replace(/[hH.]/, ":"), label: m[2].trim() }))
    .filter((x) => x.label);
  if (matches.length === 0) {
    return <p className="mt-2 whitespace-pre-line border-s-2 border-stone ps-3 text-sm text-ink-soft">{details}</p>;
  }
  return (
    <ul className="mt-2 space-y-1.5 border-s-2 border-accent/40 ps-3">
      {matches.map((it, idx) => (
        <li key={idx} className="flex gap-3 text-sm">
          <span className="shrink-0 font-semibold tabular-nums text-primary">{it.time}</span>
          <span className="text-ink-soft">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
