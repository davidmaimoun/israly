"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createTourRequest } from "@/features/bookings/actions";
import { CITIES } from "@/lib/cities";
import { LANGUAGES } from "@/lib/languages";
import { Button } from "@/components/ui/Button";
import { Send, Loader2, CalendarCheck, ChevronDown, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { GuidePickerModal, type GuidePickerItem } from "./GuidePickerModal";

const PLAN_IMAGE = process.env.NEXT_PUBLIC_PLAN_IMAGE || "/img/plan.webp";
const OWNER_WA = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/[^\d]/g, "");
const REGIONS = CITIES.filter((c) => c !== "all" && c !== "other");

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Label de champ : capitale simple (pas d'uppercase), plus doux que .eyebrow
const LBL = "mb-1 block text-sm font-medium text-ink-soft";

function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [bp]);
  return m;
}

// `guides` alimente le picker (optionnel). Passe-le depuis la page serveur.
export function PlanVisit({ guides = [] }: { guides?: GuidePickerItem[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("plan");
  const tb = useTranslations("booking");
  const tc = useTranslations("cities");
  const tl = useTranslations("langs");
  const isMobile = useIsMobile();

  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0..2 (mobile only)

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState("1");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [guideId, setGuideId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedGuide = guides.find((g) => g.id === guideId) || null;

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const peopleN = Math.max(1, Number(people || 1) || 1);

  // ---- Required fields = step 1 ----
  const step1Valid = name.trim() !== "" && emailOk(email) && phone.trim() !== "";
  const canSubmit = step1Valid;

  const payload = () => ({
    clientName: name.trim(),
    clientEmail: email.trim(),
    clientPhone: phone.trim(),
    numPeople: peopleN,
    startDate: date,
    startTime: time,
    cities,
    langs,
    message,
    guideId, // ADAPT: ajoute `guideId` à ton action createTourRequest pour le persister
    locale,
  });

  function submit() {
    setError(null);
    if (!canSubmit) return;
    start(async () => {
      const res = await createTourRequest(payload());
      if (res.ok) setDone(true);
      else setError(res.error ?? tb("error"));
    });
  }

  function sendByWhatsapp() {
    if (!OWNER_WA || !canSubmit) return;
    const body = [
      t("title"),
      "",
      `${tb("name")}: ${name}`,
      `${tb("email")}: ${email}`,
      `${tb("phone")}: ${phone}`,
      `${tb("people")}: ${peopleN}`,
      selectedGuide ? `${t("guidePref")}: ${selectedGuide.name}` : null,
      date ? `${tb("startDate")}: ${date}${time ? ` ${time}` : ""}` : null,
      cities.length ? `${t("regions")}: ${cities.map((c) => tc(c)).join(", ")}` : null,
      langs.length ? `${t("langs")}: ${langs.map((l) => tl(l)).join(", ")}` : null,
      message ? `${tb("message")}: ${message}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    window.open(`https://wa.me/${OWNER_WA}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
  }

  // ---------- Field groups (shared mobile wizard <-> desktop) ----------
  const stepCoord = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <F label={tb("name")} value={name} onChange={setName} required />
      </div>
      <F
        label={tb("email")}
        value={email}
        onChange={setEmail}
        type="email"
        required
        error={email && !emailOk(email) ? tb("emailInvalid") : null}
      />
      <F label={tb("phone")} value={phone} onChange={setPhone} required />
      <F label={tb("people")} value={people} onChange={setPeople} type="number" min={1} />
    </div>
  );

  const stepSejour = (
    <div className="grid gap-4">
      {/* Picker guide (optionnel) — n'apparaît que si des guides sont fournis */}
      {guides.length > 0 && (
        <div>
          <label className={LBL}>{t("guidePref")}</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={cn(
              "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-cream/50 px-3 text-sm",
              selectedGuide ? "border-primary text-ink" : "border-stone text-ink-soft",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              {selectedGuide?.photo && (
                <img src={selectedGuide.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              <span className="truncate">{selectedGuide ? selectedGuide.name : t("guideAny")}</span>
            </span>
            {selectedGuide ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setGuideId(null);
                }}
                className="shrink-0 text-xs text-ink-soft underline"
              >
                {t("remove")}
              </span>
            ) : (
              <ChevronDown size={16} className="shrink-0" />
            )}
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <F label={t("dateOptional")} value={date} onChange={setDate} type="date" />
        <F label={tb("time")} value={time} onChange={setTime} type="time" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PlanDropdown label={t("regions")} placeholder={t("choose")} count={cities.length}>
          <Chips
            items={REGIONS.map((c) => ({ value: c, label: tc(c) }))}
            selected={cities}
            onToggle={(v) => toggle(cities, setCities, v)}
          />
        </PlanDropdown>
        <PlanDropdown label={t("langs")} placeholder={t("choose")} count={langs.length}>
          <Chips
            items={LANGUAGES.map((l) => ({ value: l.code, label: `${l.flag} ${tl(l.code)}` }))}
            selected={langs}
            onToggle={(v) => toggle(langs, setLangs, v)}
          />
        </PlanDropdown>
      </div>
    </div>
  );

  const stepMessage = (
    <div>
      <label className={LBL}>{t("proposal")}</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-stone bg-cream/50 px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );

  const submitRow = (
    <div className="grid gap-2">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={submit} size="lg" disabled={pending || !canSubmit} className="w-full sm:flex-1">
          {pending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          {t("submit")}
        </Button>
        {OWNER_WA && (
          <button
            type="button"
            onClick={sendByWhatsapp}
            disabled={!canSubmit}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 sm:flex-1"
          >
            <WhatsAppIcon size={20} /> {tb("whatsapp")}
          </button>
        )}
      </div>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );

  const labels = [t("step1"), t("step2"), t("step3")];

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
          <div className="rounded-card border border-success/30 bg-success/10 p-8 text-center">
            <CalendarCheck className="mx-auto mb-2 text-success" />
            <p className="font-medium text-ink">{tb("success")}</p>
          </div>
        ) : (
          <div className="grid gap-5 rounded-card border border-stone/70 bg-surface p-5 md:p-7">
            {isMobile ? (
              /* ---------------- MOBILE : wizard 3 steps ---------------- */
              <>
                <Steps step={step} labels={labels} onJump={(i) => i < step && setStep(i)} />
                {(step === 1 || step === 2) && <OptTag label={t("optional")} />}
                <div>
                  {step === 0 && stepCoord}
                  {step === 1 && stepSejour}
                  {step === 2 && stepMessage}
                </div>

                {step < 2 ? (
                  <>
                    <div className="flex items-center gap-3">
                      {step > 0 && <BackBtn onClick={() => setStep((s) => s - 1)} label={t("back")} />}
                      <Button
                        onClick={() => setStep((s) => s + 1)}
                        size="lg"
                        disabled={step === 0 && !step1Valid}
                        className="flex-1"
                      >
                        {t("next")} <ArrowRight size={18} />
                      </Button>
                    </div>
                    {step === 0 && !step1Valid && (
                      <p className="text-center text-xs text-ink-soft">{t("requiredHint")}</p>
                    )}
                  </>
                ) : (
                  <div className="grid gap-3">
                    {submitRow}
                    <BackBtn onClick={() => setStep((s) => s - 1)} label={t("back")} full />
                  </div>
                )}
              </>
            ) : (
              /* ---------------- DESKTOP : tout sur une page ---------------- */
              <>
                {stepCoord}
                <OptSep label={t("optional")} />
                {stepSejour}
                {stepMessage}
                {submitRow}
                {!canSubmit && <p className="-mt-1 text-center text-xs text-ink-soft">{t("requiredHint")}</p>}
              </>
            )}
          </div>
        )}
      </div>

      <GuidePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        guides={guides}
        value={guideId}
        onSelect={(id) => {
          setGuideId(id);
          setPickerOpen(false);
        }}
        searchPlaceholder={t("guideSearch")}
        noneLabel={t("guideAny")}
        langLabel={(l) => tl(l)}
      />
    </section>
  );
}

/* -------------------- Sous-composants -------------------- */

// Séparateur desktop : —— Optionnel ——
function OptSep({ label }: { label: string }) {
  return (
    <div className="my-1 flex items-center gap-3">
      <span className="h-px flex-1 bg-[#EAC4A4]/70" />
      <span className="text-sm font-medium tracking-wide text-[#C4703D]">{label}</span>
      <span className="h-px flex-1 bg-[#EAC4A4]/70" />
    </div>
  );
}

// Badge mobile en tête d'une step optionnelle
function OptTag({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-[#EAC4A4] bg-[#FBEADD] px-3 py-1 text-xs font-semibold tracking-wide text-[#B65F30]">
      {label}
    </span>
  );
}

function Steps({ step, labels, onJump }: { step: number; labels: string[]; onJump: (i: number) => void }) {
  return (
    <div>
      <div className="flex gap-2">
        {labels.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={labels[i]}
            onClick={() => onJump(i)}
            className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-stone/40")}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">{labels[step]}</span>
        <span className="text-ink-soft">
          {step + 1}/{labels.length}
        </span>
      </div>
    </div>
  );
}

function BackBtn({ onClick, label, full }: { onClick: () => void; label: string; full?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-1 rounded-full border border-stone px-5 text-sm font-medium text-ink-soft transition hover:bg-sand",
        full && "w-full",
      )}
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}

function F({
  label,
  value,
  onChange,
  type = "text",
  required,
  error,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string | null;
  min?: number;
}) {
  return (
    <div>
      <label className={LBL}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {error && <p className="mb-1 text-xs font-medium text-danger">{error}</p>}
      <input
        type={type}
        value={value}
        required={required}
        min={type === "number" ? min ?? 1 : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full rounded-xl border bg-cream/50 px-3 text-sm outline-none focus:border-primary",
          error ? "border-danger" : "border-stone",
        )}
      />
    </div>
  );
}

function Chips({
  items,
  selected,
  onToggle,
}: {
  items: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const on = selected.includes(it.value);
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onToggle(it.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              on ? "border-primary bg-primary text-white" : "border-stone hover:bg-sand",
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function PlanDropdown({
  label,
  placeholder,
  count,
  children,
}: {
  label: string;
  placeholder: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <label className={LBL}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-cream/50 px-3 text-sm",
          count ? "border-primary text-primary" : "border-stone text-ink-soft",
        )}
      >
        <span>{count > 0 ? `${count}` : placeholder}</span>
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-stone bg-surface p-3 shadow-[var(--shadow-soft)]">
          {children}
        </div>
      )}
    </div>
  );
}
