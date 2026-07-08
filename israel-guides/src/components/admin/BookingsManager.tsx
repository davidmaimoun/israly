"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { updateBookingStatus } from "@/features/bookings/actions";
import { StatusBadge } from "./StatusBadge";
import { Check, X, Flag } from "lucide-react";

export type BookingRow = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  numPeople: number;
  startDate: string;
  startTime: string | null;
  message: string | null;
  status: string;
};

export function BookingsManager({ bookings }: { bookings: BookingRow[] }) {
  const locale = useLocale();
  const t = useTranslations("admin.bookings");
  const [pending, start] = useTransition();

  const act = (bookingId: string, status: string) =>
    start(async () => {
      await updateBookingStatus(locale, { bookingId, status });
    });

  if (!bookings.length) {
    return <p className="rounded-xl border border-dashed border-stone bg-surface p-8 text-center text-ink-soft">{t("empty")}</p>;
  }

  return (
    <div className="grid gap-3">
      {bookings.map((b) => (
        <div key={b.id} className="rounded-[var(--radius-card)] border border-stone/70 bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{b.clientName} · {t("people")}: {b.numPeople}</p>
              <p className="text-sm text-ink-soft">{b.startDate}{b.startTime ? ` · ${b.startTime}` : ""}</p>
              <p className="text-sm text-ink-soft">{b.clientEmail}{b.clientPhone ? ` · ${b.clientPhone}` : ""}</p>
              {b.message && <p className="mt-1 text-sm text-ink-soft">{t("noteMessage")}: {b.message}</p>}
            </div>
            <StatusBadge status={b.status} />
          </div>
          {(b.status === "PENDING" || b.status === "CONFIRMED") && (
            <div className="mt-3 flex flex-wrap gap-2">
              {b.status === "PENDING" && (
                <>
                  <button disabled={pending} onClick={() => act(b.id, "CONFIRMED")} className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-sm text-white disabled:opacity-50">
                    <Check size={14} /> {t("confirm")}
                  </button>
                  <button disabled={pending} onClick={() => act(b.id, "DECLINED")} className="inline-flex items-center gap-1 rounded-full bg-danger px-3 py-1.5 text-sm text-white disabled:opacity-50">
                    <X size={14} /> {t("decline")}
                  </button>
                </>
              )}
              {b.status === "CONFIRMED" && (
                <button disabled={pending} onClick={() => act(b.id, "COMPLETED")} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm text-white disabled:opacity-50">
                  <Flag size={14} /> {t("complete")}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
