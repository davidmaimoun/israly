"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search, Check, User } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { CITIES } from "@/lib/cities";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const REGION_OPTIONS = CITIES.filter((c) => c !== "all" && c !== "other");

export function GuideFilters({
  initialLangs,
  initialCities,
  initialName,
  initialMatch,
}: {
  initialLangs: string[];
  initialCities: string[];
  initialName: string;
  initialMatch: "all" | "any";
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
    <div className="rounded-[var(--radius-card)] border border-stone/70 bg-surface p-4 md:p-5">
      <label className="eyebrow mb-2 block">{t("nameLabel")}</label>
      <div className="relative mb-4">
        <User size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder={t("namePlaceholder")}
          className="h-12 w-full rounded-full border border-stone bg-surface ps-10 pe-4 text-sm"
        />
      </div>

      <ChipGroup label={t("languagesLabel")} items={LANGUAGES.map((l) => ({ value: l.code, label: tl(l.code), flag: l.flag }))} selected={langs} onToggle={(v) => toggle(langs, setLangs, v)} />
      <ChipGroup className="mt-4" label={t("regionsLabel")} items={REGION_OPTIONS.map((c) => ({ value: c, label: tc(c) }))} selected={cities} onToggle={(v) => toggle(cities, setCities, v)} />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {langs.length > 1 ? (
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input type="checkbox" checked={!matchAll} onChange={(e) => setMatchAll(!e.target.checked)} className="accent-[var(--color-primary)]" />
            {t("matchAny")}
          </label>
        ) : <span />}
        <Button onClick={apply} size="lg" className="h-12 w-full px-8 sm:w-auto">
          <Search size={16} /> {t("submit")}
        </Button>
      </div>
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
