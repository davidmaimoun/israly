"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search, Check, User, ChevronDown } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { CITIES } from "@/lib/cities";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const REGION_OPTIONS = CITIES.filter((c) => c !== "all" && c !== "other");

export function GuideFilters({
  initialLangs, initialCities, initialName, initialMatch,
}: {
  initialLangs: string[]; initialCities: string[]; initialName: string; initialMatch: "all" | "any";
}) {
  const t = useTranslations("search");
  const tl = useTranslations("langs");
  const tc = useTranslations("cities");
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [langs, setLangs] = useState<string[]>(initialLangs);
  const [cities, setCities] = useState<string[]>(initialCities);
  const [matchAll, setMatchAll] = useState(initialMatch !== "any");

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const apply = () => {
    const params = new URLSearchParams();
    if (name.trim()) params.set("q", name.trim());
    if (langs.length) params.set("lang", langs.join(","));
    if (cities.length) params.set("cities", cities.join(","));
    params.set("match", matchAll ? "all" : "any");
    router.push(`/guides?${params.toString()}`);
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-stone/70 bg-surface p-2.5 shadow-[var(--shadow-soft)]">
      {/* Tout sur une ligne en desktop, empilé en mobile */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <User size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder={t("namePlaceholder")}
            className="h-11 w-full rounded-full border border-stone bg-surface ps-10 pe-4 text-sm text-ink"
          />
        </div>

        <Dropdown label={t("languagesLabel")} count={langs.length}>
          <Chips items={LANGUAGES.map((l) => ({ value: l.code, label: tl(l.code), flag: l.flag }))} selected={langs} onToggle={(v) => toggle(langs, setLangs, v)} />
          {langs.length > 1 && (
            <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-stone/60 pt-3 text-xs text-ink-soft">
              <input type="checkbox" checked={!matchAll} onChange={(e) => setMatchAll(!e.target.checked)} className="accent-[var(--color-primary)]" />
              {t("matchAny")}
            </label>
          )}
        </Dropdown>

        <Dropdown label={t("regionsLabel")} count={cities.length}>
          <Chips items={REGION_OPTIONS.map((c) => ({ value: c, label: tc(c) }))} selected={cities} onToggle={(v) => toggle(cities, setCities, v)} />
        </Dropdown>

        <Button size="lg" onClick={apply} className="h-11 shrink-0 px-6">
          <Search size={16} /> {t("submit")}
        </Button>
      </div>
    </div>
  );
}

// Bouton + popover (se ferme au clic dehors). Compact quel que soit le nombre d'options.
function Dropdown({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative md:shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-11 w-full items-center justify-between gap-2 rounded-full border px-4 text-sm font-medium transition-colors md:w-auto",
          count ? "border-primary bg-primary/10 text-primary" : "border-stone text-ink-soft hover:bg-sand",
        )}
      >
        <span className="inline-flex items-center gap-2">
          {label}
          {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-cream">{count}</span>}
        </span>
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 max-h-72 w-[min(20rem,85vw)] overflow-y-auto rounded-2xl border border-stone bg-surface p-3 shadow-xl end-0 md:end-auto md:start-0">
          {children}
        </div>
      )}
    </div>
  );
}

function Chips({ items, selected, onToggle }: { items: { value: string; label: string; flag?: string }[]; selected: string[]; onToggle: (v: string) => void }) {
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
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              on ? "border-primary bg-primary text-cream" : "border-stone bg-surface text-ink-soft hover:border-primary/40 hover:bg-sand",
            )}
          >
            {on && <Check size={14} />}
            {it.flag && <span aria-hidden>{it.flag}</span>}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
