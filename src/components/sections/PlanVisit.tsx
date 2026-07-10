"use client";


import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createTourRequest } from "@/features/bookings/actions";
import { CITIES } from "@/lib/cities";
import { LANGUAGES } from "@/lib/languages";
import { Button } from "@/components/ui/Button";
import { Send, Loader2, CalendarCheck, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

const PLAN_IMAGE = process.env.NEXT_PUBLIC_PLAN_IMAGE || "/img/plan.webp";
const OWNER_WA = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/[^\d]/g, "");
const REGIONS = CITIES.filter((c) => c !== "all" && c !== "other");

export function PlanVisit() {
  const locale = useLocale() as Locale;
  const t = useTranslations("plan");
  const tb = useTranslations("booking");
  const tc = useTranslations("cities");
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
  const [cities, setCities] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const payload = () => ({
    clientName: name,
    clientEmail: email,
    clientPhone: phone,
    numPeople: Number(people || 1),
    startDate: date,
    startTime: time,
    cities,
    langs,
    message,
    locale,
  });

  function submit() {
    setError(null); setPhoneErr(null);
    if (!name || !email) { setError(tb("error")); return; }
    if (!phone) { setPhoneErr(tb("phoneRequired")); return; }
    start(async () => {
      const res = await createTourRequest(payload());
      if (res.ok) setDone(true);
      else setError(res.error ?? tb("error"));
    });
  }

  function sendByWhatsapp() {
    if (!OWNER_WA) return;
    if (!name || !email) { setError(tb("error")); return; }
    if (!phone) { setPhoneErr(tb("phoneRequired")); return; }
    const body = [
      t("title"),
      "",
      `${tb("name")}: ${name}`,
      `${tb("email")}: ${email}`,
      phone ? `${tb("phone")}: ${phone}` : null,
      `${tb("people")}: ${people}`,
      date ? `${tb("startDate")}: ${date}${time ? ` ${time}` : ""}` : null,
      cities.length ? `${t("regions")}: ${cities.map((c) => tc(c)).join(", ")}` : null,
      langs.length ? `${t("langs")}: ${langs.map((l) => tl(l)).join(", ")}` : null,
      message ? `${tb("message")}: ${message}` : null,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${OWNER_WA}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
  }

  return (
    <section id="plan" className="relative scroll-mt-20 overflow-hidden py-16 md:py-24">
      {/* Fond parallax : la photo du hero, fixe au scroll, en fondu */}
      <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${PLAN_IMAGE})` }} />
      <div className="absolute inset-0 bg-bg/92" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 md:px-6">
        <div className="mb-8 text-center">
          <p className="eyebrow text-secondary">{t("eyebrow")}</p>
          <h2 className="display text-3xl md:text-4xl">{t("title")}</h2>
          <p className="mt-2 text-ink-soft">{t("subtitle")}</p>
        </div>

        {done ? (
          <div className="rounded-[var(--radius-card)] border border-success/30 bg-success/10 p-8 text-center">
            <CalendarCheck className="mx-auto mb-2 text-success" />
            <p className="font-medium text-ink">{tb("success")}</p>
          </div>
        ) : (
          <div className="grid gap-4 rounded-[var(--radius-card)] border border-stone/70 bg-surface p-5 md:p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <F label={tb("name")} value={name} onChange={setName} required />
              <F label={tb("email")} value={email} onChange={setEmail} type="email" required />
              <F label={tb("phone")} value={phone} onChange={(v) => { setPhone(v); setPhoneErr(null); }} required error={phoneErr} />
              <F label={tb("people")} value={people} onChange={setPeople} type="number" />
              <F label={t("dateOptional")} value={date} onChange={setDate} type="date" />
              <F label={tb("time")} value={time} onChange={setTime} type="time" />
            </div>

            <Chips label={t("regions")} items={REGIONS.map((c) => ({ value: c, label: tc(c) }))} selected={cities} onToggle={(v) => toggle(cities, setCities, v)} />
            <Chips label={t("langs")} items={LANGUAGES.map((l) => ({ value: l.code, label: `${l.flag} ${tl(l.code)}` }))} selected={langs} onToggle={(v) => toggle(langs, setLangs, v)} />

            <div>
              <label className="eyebrow mb-1 block">{t("proposal")}</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full rounded-xl border border-stone bg-cream/50 px-3 py-2 text-sm" />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={submit} size="lg" disabled={pending} className="flex-1">
                {pending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {t("submit")}
              </Button>
              {OWNER_WA && (
                <button
                  type="button"
                  onClick={sendByWhatsapp}
                  className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 text-base font-semibold text-white"
                >
                  <MessageCircle size={18} /> {tb("whatsapp")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function F({ label, value, onChange, type = "text", required, error }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; error?: string | null }) {
  return (
    <div>
      <label className="eyebrow mb-1 block">{label}{required && <span className="text-danger"> *</span>}</label>
      {error && <p className="mb-1 text-xs font-medium text-danger">{error}</p>}
      <input type={type} value={value} required={required} min={type === "number" ? 1 : undefined} onChange={(e) => onChange(e.target.value)} className={cn("h-11 w-full rounded-xl border bg-cream/50 px-3 text-sm", error ? "border-danger" : "border-stone")} />
    </div>
  );
}
function Chips({ label, items, selected, onToggle }: { label: string; items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <label className="eyebrow mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const on = selected.includes(it.value);
          return (
            <button key={it.value} type="button" onClick={() => onToggle(it.value)} className={cn("rounded-full border px-3 py-1.5 text-sm", on ? "border-primary bg-primary text-white" : "border-stone hover:bg-sand")}>
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
