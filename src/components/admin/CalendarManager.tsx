"use client";

import { useState, useTransition } from "react";
import { DayPicker } from "react-day-picker";
import { useLocale, useTranslations } from "next-intl";
import { he, enUS, fr } from "react-day-picker/locale";
import { setAvailability } from "@/features/availability/actions";
import { toDateKey } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

const dpLocales = { he, en: enUS, fr };
const CYCLE = ["AVAILABLE", "BOOKED", "UNAVAILABLE"] as const;
type Status = (typeof CYCLE)[number];

// Tap sur une date → cycle disponible → réservé → indisponible.
export function CalendarManager({
  guideId,
  initial,
}: {
  guideId: string;
  initial: Record<string, Status>;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("admin.calendar");
  const [map, setMap] = useState<Record<string, Status>>(initial);
  const [, start] = useTransition();

  const nextStatus = (cur: Status | undefined): Status => {
    if (!cur) return "AVAILABLE";
    const i = CYCLE.indexOf(cur);
    return CYCLE[(i + 1) % CYCLE.length];
  };

  const onDayClick = (day: Date) => {
    const key = toDateKey(day);
    const status = nextStatus(map[key]);
    setMap((m) => ({ ...m, [key]: status }));
    start(async () => {
      await setAvailability(locale, { guideId, date: key, status });
    });
  };

  const byStatus = (s: Status) =>
    Object.entries(map)
      .filter(([, v]) => v === s)
      .map(([k]) => new Date(`${k}T00:00:00.000Z`));

  return (
    <div>
      <p className="mb-3 text-sm text-ink-soft">{t("hint")}</p>
      <DayPicker
        locale={dpLocales[locale as keyof typeof dpLocales] ?? dpLocales.en}
        dir={locale === "he" ? "rtl" : "ltr"}
        onDayClick={onDayClick}
        modifiers={{
          available: byStatus("AVAILABLE"),
          booked: byStatus("BOOKED"),
          unavailable: byStatus("UNAVAILABLE"),
        }}
        modifiersStyles={{
          available: { background: "var(--color-success)", color: "white", borderRadius: "9999px" },
          booked: { background: "var(--color-primary)", color: "white", borderRadius: "9999px" },
          unavailable: { background: "var(--color-stone)", color: "var(--color-ink-soft)", borderRadius: "9999px" },
        }}
      />
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-soft">
        <Legend color="var(--color-success)" label={t("available")} />
        <Legend color="var(--color-primary)" label={t("booked")} />
        <Legend color="var(--color-stone)" label={t("unavailable")} />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
