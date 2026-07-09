"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search, Check, X, SlidersHorizontal } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { CITIES } from "@/lib/cities";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const REGION_OPTIONS = CITIES.filter((c) => c !== "all" && c !== "other");

// Barre de recherche unifiée (nom + filtres + rechercher) avec panneau qui glisse.
export function SearchBar({
  initialName = "",
  initialLangs = [],
  initialCities = [],
  initialMatch = "all",
}: {
  initialName?: string;
  initialLangs?: string[];
  initialCities?: string[];
  initialMatch?: "all" | "any";
}) {
  const t = useTranslations("search");
  const tl = useTranslations("langs");
  const tc = useTranslations("cities");
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [langs, setLangs] = useState<string[]>(initialLangs);
  const [cities, setCities] = useState<string[]>(initialCities);
  const [matchAll, setMatchAll] = useState(initialMatch !== "any");
  const [open, setOpen] = useState(false);

  const activeCount = langs.length + cities.length;
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clearAll = () => { setLangs([]); setCities([]); setMatchAll(true); };

  const submit = () => {
    const params = new URLSearchParams();
    if (name.trim()) params.set("q", name.trim());
    if (langs.length) params.set("lang", langs.join(","));
    if (cities.length) params.set("cities", cities.join(","));
    params.set("match", matchAll ? "all" : "any");
    setOpen(false);
    router.push(`/guides?${params.toString()}`);
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Barre unifiée : nom · filtres · rechercher, tout dans une seule pilule */}
      <div className="flex items-center gap-1 rounded-full border border-stone/60 bg-surface/95 p-1.5 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("namePlaceholder")}
            className="h-11 w-full rounded-full bg-transparent ps-10 pe-2 text-sm text-ink outline-none placeholder:text-ink-soft/70"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors sm:px-4",
            activeCount ? "bg-primary/10 text-primary" : "text-ink-soft hover:bg-sand",
          )}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">{t("filtersLabel")}</span>
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-cream">{activeCount}</span>
          )}
        </button>
        <Button size="lg" onClick={submit} className="h-11 shrink-0 rounded-full px-4 sm:px-6">
          <Search size={18} /> <span className="hidden sm:inline">{t("submit")}</span>
        </Button>
      </div>

      {/* Panneau de filtres qui glisse depuis le bord */}
      <div className={cn("fixed inset-0 z-[60]", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div
          className={cn("absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 end-0 flex w-full max-w-sm flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-stone/60 px-5 py-4">
            <p className="text-lg font-semibold text-ink">{t("title")}</p>
            <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-sand" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <ChipGroup label={t("languagesLabel")} items={LANGUAGES.map((l) => ({ value: l.code, label: tl(l.code), flag: l.flag }))} selected={langs} onToggle={(v) => toggle(langs, setLangs, v)} />
            <ChipGroup className="mt-6" label={t("regionsLabel")} items={REGION_OPTIONS.map((c) => ({ value: c, label: tc(c) }))} selected={cities} onToggle={(v) => toggle(cities, setCities, v)} />
            {langs.length > 1 && (
              <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={!matchAll} onChange={(e) => setMatchAll(!e.target.checked)} className="accent-[var(--color-primary)]" />
                {t("matchAny")}
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-stone/60 px-5 py-4">
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-sm font-medium text-ink-soft hover:text-primary">{t("clear")}</button>
            )}
            <Button size="lg" onClick={submit} className="ms-auto h-12 px-6"><Search size={16} /> {t("apply")}</Button>
          </div>
        </aside>
      </div>
    </>
  );
}

function ChipGroup({
  label, items, selected, onToggle, className,
}: { label: string; items: { value: string; label: string; flag?: string }[]; selected: string[]; onToggle: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="eyebrow mb-2 block">{label}</label>
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
    </div>
  );
}