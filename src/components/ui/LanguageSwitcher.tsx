"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Préserve le chemin courant en changeant uniquement la locale.
export function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
          onDark ? "border-white/50 text-white hover:bg-white/15" : "border-stone text-ink hover:bg-sand",
        )}
        aria-label="Change language"
      >
        <Globe size={16} />
        <span>{localeMeta[locale].flag}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul className="absolute inset-e-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-stone bg-surface shadow-(--shadow-soft)">
            {locales.map((l) => (
              <li key={l}>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.replace(pathname, { locale: l });
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-sand",
                    l === locale && "font-semibold text-primary",
                  )}
                >
                  <span>{localeMeta[l].flag}</span>
                  <span>{localeMeta[l].label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}