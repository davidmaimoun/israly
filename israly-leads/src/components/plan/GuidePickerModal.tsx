"use client";

// components/plan/GuidePickerModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuidePickerItem = {
  id: string;
  name: string;
  photo?: string | null;
  langs: string[];
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function GuidePickerModal({
  open,
  onClose,
  guides,
  value,
  onSelect,
  searchPlaceholder = "Rechercher…",
  noneLabel = "Aucun — trouvez pour moi",
  langLabel = (l) => l,
}: {
  open: boolean;
  onClose: () => void;
  guides: GuidePickerItem[];
  value: string | null;
  onSelect: (id: string | null) => void;
  searchPlaceholder?: string;
  noneLabel?: string;
  langLabel?: (l: string) => string;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return guides;
    return guides.filter(
      (g) => norm(g.name).includes(nq) || g.langs.some((l) => norm(langLabel(l)).includes(nq)),
    );
  }, [q, guides, langLabel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-stone/60 p-3">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-stone bg-cream/50 px-3 py-2">
            <Search size={18} className="shrink-0 text-ink-soft" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/70"
            />
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-2 text-ink-soft">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-1 overflow-y-auto p-2">
          {/* option "aucun" */}
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-sand",
              value === null && "bg-primary/5",
            )}
          >
            <span className="text-ink-soft">{noneLabel}</span>
            {value === null && <Check size={18} className="text-primary" />}
          </button>

          {filtered.map((g) => {
            const on = value === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelect(g.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-sand",
                  on && "bg-primary/5",
                )}
              >
                {g.photo ? (
                  <img src={g.photo} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone/40 text-ink-soft">
                    {g.name[0]}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{g.name}</span>
                  <span className="block truncate text-xs text-ink-soft">{g.langs.map(langLabel).join(" · ")}</span>
                </span>
                {on && <Check size={18} className="shrink-0 text-primary" />}
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-soft">Aucun guide trouvé.</p>
          )}
        </div>
      </div>
    </div>
  );
}
