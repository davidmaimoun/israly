"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/config";
import { parseItinerary, serializeItinerary, formatDuration, legacyDetailsToStops, type ItineraryStop } from "@/lib/pricing";
import { Plus, Trash2, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const DURATIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 480];

export function ItineraryEditor({ value, details, onChange }: { value: string | null; details?: string | null; onChange: (json: string) => void }) {
  const t = useTranslations("admin.pricing");
  const tl = useTranslations("langs");
  const uiLocale = useLocale() as Locale;
  const [stops, setStops] = useState<ItineraryStop[]>(() => {
    const parsed = parseItinerary(value);
    return parsed.length ? parsed : legacyDetailsToStops(details ?? "", uiLocale);
  });
  const [lang, setLang] = useState<Locale>(uiLocale);

  const commit = (next: ItineraryStop[]) => { setStops(next); onChange(serializeItinerary(next)); };
  const patch = (i: number, p: Partial<ItineraryStop>) => commit(stops.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  const setLabel = (i: number, text: string) => patch(i, { label: { ...stops[i].label, [lang]: text } });
  const add = () => commit([...stops, { mode: "time", time: "09:00", durationMin: 60, label: {} }]);
  const remove = (i: number) => commit(stops.filter((_, idx) => idx !== i));

  return (
    <div className="mt-2 rounded-xl border border-stone bg-cream/40 p-3">
      {/* Onglets de langue */}
      <div className="mb-1 flex flex-wrap gap-1.5">
        {locales.map((l) => {
          const filled = stops.some((s) => s.label[l]?.trim());
          return (
            <button key={l} type="button" onClick={() => setLang(l)}
              className={cn("rounded-full px-2.5 py-1 text-xs", lang === l ? "bg-primary text-cream" : "bg-surface text-ink-soft ring-1 ring-stone", filled && lang !== l && "ring-success/50")}>
              {tl(l)}{filled ? " ✓" : ""}
            </button>
          );
        })}
      </div>
      <p className="mb-2 text-xs text-ink-soft">{t("translateHint")}</p>

      <div className="grid gap-2">
        {stops.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-stone bg-surface p-2">
            {/* Heure / Durée */}
            <div className="flex overflow-hidden rounded-lg ring-1 ring-stone">
              <button type="button" onClick={() => patch(i, { mode: "time" })} className={cn("inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium", s.mode === "time" ? "bg-primary text-cream" : "bg-cream/60 text-ink-soft")}>
                <Clock size={13} /> {t("modeTime")}
              </button>
              <button type="button" onClick={() => patch(i, { mode: "duration" })} className={cn("inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium", s.mode === "duration" ? "bg-primary text-cream" : "bg-cream/60 text-ink-soft")}>
                <Timer size={13} /> {t("modeDuration")}
              </button>
            </div>

            {s.mode === "time" ? (
              <input type="time" value={s.time} onChange={(e) => patch(i, { time: e.target.value })} className="h-9 w-36 rounded-lg border border-stone bg-cream/50 px-2 text-sm tabular-nums" />
            ) : (
              <select value={s.durationMin} onChange={(e) => patch(i, { durationMin: Number(e.target.value) })} className="h-9 w-32 rounded-lg border border-stone bg-cream/50 px-2 text-sm">
                {DURATIONS.map((d) => <option key={d} value={d}>{formatDuration(d)}</option>)}
              </select>
            )}

            <input value={s.label[lang] ?? ""} onChange={(e) => setLabel(i, e.target.value)} placeholder={t("stopLabel")} className="h-9 min-w-40 flex-1 rounded-lg border border-stone bg-cream/50 px-2 text-sm" />

            <button type="button" onClick={() => remove(i)} className="grid h-9 w-9 place-items-center rounded-lg text-danger hover:bg-sand" aria-label={t("remove")}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-white">
        <Plus size={14} /> {t("addStop")}
      </button>
    </div>
  );
}
