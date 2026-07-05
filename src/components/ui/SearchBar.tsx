"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search, Check, User, SlidersHorizontal } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { CITIES } from "@/lib/cities";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const REGION_OPTIONS = CITIES.filter((c) => c !== "all" && c !== "other");

// Recherche compacte : nom + bouton toujours visibles, filtres dépliables.
export function SearchBar() {
  const t = useTranslations("search");
  const tl = useTranslations("langs");
  const tc = useTranslations("cities");
  const router = useRouter();

  const [name, setName] = useState("");
  const [langs, setLangs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [matchAll, setMatchAll] = useState(true);
  const [openFilters, setOpenFilters] = useState(false);

  const activeCount = langs.length + cities.length;
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = () => {
    const params = new URLSearchParams();
    if (name.trim()) params.set("q", name.trim());
    if (langs.length) params.set("lang", langs.join(","));
    if (cities.length) params.set("cities", cities.join(","));
    params.set("match", matchAll ? "all" : "any");
    router.push(`/guides?${params.toString()}`);
  };

  return (
    <div className="w-full rounded-[var(--radius-card)] border border-stone/60 bg-surface/95 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <User size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("namePlaceholder")}
            className="h-12 w-full rounded-full border border-stone bg-surface ps-10 pe-4 text-sm text-ink"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpenFilters((v) => !v)}
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
            openFilters || activeCount ? "border-primary bg-primary/10 text-primary" : "border-stone text-ink-soft hover:bg-sand",
          )}
        >
          <SlidersHorizontal size={16} /> {t("submit")}
          {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-cream">{activeCount}</span>}
        </button>
        <Button size="lg" onClick={submit} className="h-12 px-7">
          <Search size={18} /> {t("submit")}
        </Button>
      </div>

      {openFilters && (
        <div className="mt-3 border-t border-stone/70 pt-3">
          <ChipGroup label={t("languagesLabel")} items={LANGUAGES.map((l) => ({ value: l.code, label: tl(l.code), flag: l.flag }))} selected={langs} onToggle={(v) => toggle(langs, setLangs, v)} />
          <ChipGroup className="mt-3" label={t("regionsLabel")} items={REGION_OPTIONS.map((c) => ({ value: c, label: tc(c) }))} selected={cities} onToggle={(v) => toggle(cities, setCities, v)} />
          {langs.length > 1 && (
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
              <input type="checkbox" checked={!matchAll} onChange={(e) => setMatchAll(!e.target.checked)} className="accent-[var(--color-primary)]" />
              {t("matchAny")}
            </label>
          )}
        </div>
      )}
    </div>
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
