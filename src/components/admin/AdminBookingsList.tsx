"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateBookingStatus, adminUpdateBooking } from "@/features/bookings/actions";
import { StatusBadge } from "./StatusBadge";
import { Check, X, Clock, Pencil, Loader2, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminBookingRow = {
  id: string;
  guideName: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  startDate: string;
  startTime: string | null;
  numPeople: number;
  cities: string[];
  langs: string[];
  message: string | null;
  amount: number | null;
  status: string;
};

export function AdminBookingsList({ bookings }: { bookings: AdminBookingRow[] }) {
  if (!bookings.length) return null;
  return (
    <div className="grid gap-3">
      {bookings.map((b) => <Row key={b.id} b={b} />)}
    </div>
  );
}

function Row({ b }: { b: AdminBookingRow }) {
  const locale = useLocale();
  const t = useTranslations("admin.bookings");
  const tb = useTranslations("booking");
  const tc = useTranslations("cities");
  const tl = useTranslations("langs");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(b.startDate);
  const [time, setTime] = useState(b.startTime ?? "");
  const [people, setPeople] = useState(String(b.numPeople));
  const [amount, setAmount] = useState(b.amount != null ? String(b.amount) : "");

  const setStatus = (status: string) =>
    start(async () => {
      await updateBookingStatus(locale, { bookingId: b.id, status });
      router.refresh();
    });

  const saveSlot = () =>
    start(async () => {
      const res = await adminUpdateBooking(locale, { bookingId: b.id, startDate: date, startTime: time, numPeople: Number(people || 1), amount });
      if (res.ok) { setEditing(false); router.refresh(); }
    });

  return (
    <div className="rounded-[var(--radius-card)] border border-stone/70 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-ink">
          {b.guideName ?? <span className="text-secondary">★ Demande générale</span>}
        </p>
        <StatusBadge status={b.status} />
      </div>

      {/* Client */}
      <p className="mt-1 font-semibold text-ink">{b.clientName}</p>
      <p className="text-sm text-ink-soft">
        {b.startDate}{b.startTime ? ` · ${b.startTime}` : ""} · {t("people", { count: b.numPeople })}
      </p>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <a href={`mailto:${b.clientEmail}`} className="inline-flex items-center gap-1 text-secondary hover:underline"><Mail size={14} /> {b.clientEmail}</a>
        {b.clientPhone && <a href={`tel:${b.clientPhone}`} className="inline-flex items-center gap-1 text-secondary hover:underline"><Phone size={14} /> {b.clientPhone}</a>}
      </div>
      {(b.cities.length > 0 || b.langs.length > 0) && (
        <p className="mt-1 text-xs text-ink-soft">
          {b.cities.length > 0 && <>📍 {b.cities.map((c) => tc(c)).join(", ")} </>}
          {b.langs.length > 0 && <>· 🗣 {b.langs.map((l) => tl(l)).join(", ")}</>}
        </p>
      )}
      {b.message && <p className="mt-1 text-sm text-ink-soft">“{b.message}”</p>}

      {/* Édition du créneau */}
      {editing && (
        <div className="mt-3 grid gap-2 rounded-xl border border-stone bg-cream/40 p-3 sm:grid-cols-3">
          <label className="text-xs text-ink-soft">{tb("startDate")}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-stone bg-surface px-2 text-sm" />
          </label>
          <label className="text-xs text-ink-soft">{tb("time")}
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-stone bg-surface px-2 text-sm" />
          </label>
          <label className="text-xs text-ink-soft">{tb("people")}
            <input type="number" min={1} value={people} onChange={(e) => setPeople(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-stone bg-surface px-2 text-sm" />
          </label>
          <label className="text-xs text-ink-soft sm:col-span-3">{t("amount")}
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₪" className="mt-1 h-10 w-full rounded-lg border border-stone bg-surface px-2 text-sm" />
          </label>
          <div className="flex gap-2 sm:col-span-3">
            <button onClick={saveSlot} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-cream">
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t("save")}
            </button>
            <button onClick={() => setEditing(false)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone px-4 text-sm">{t("close")}</button>
          </div>
        </div>
      )}

      {/* Actions statut */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn active={b.status === "CONFIRMED"} onClick={() => setStatus("CONFIRMED")} disabled={pending} icon={Check} color="success">{t("confirm")}</Btn>
        <Btn active={b.status === "CANCELLED"} onClick={() => setStatus("CANCELLED")} disabled={pending} icon={X} color="danger">{t("cancel")}</Btn>
        <Btn active={b.status === "PENDING"} onClick={() => setStatus("PENDING")} disabled={pending} icon={Clock} color="secondary">{t("pending")}</Btn>
        {!editing && (
          <button onClick={() => setEditing(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone px-4 text-sm text-ink-soft hover:bg-sand">
            <Pencil size={14} /> {t("editSlot")}
          </button>
        )}
      </div>
    </div>
  );
}

function Btn({ children, onClick, active, disabled, icon: Icon, color }: { children: React.ReactNode; onClick: () => void; active: boolean; disabled: boolean; icon: typeof Check; color: "success" | "danger" | "secondary" }) {
  const tone = {
    success: active ? "bg-success text-cream" : "border border-success/40 text-success hover:bg-success/10",
    danger: active ? "bg-danger text-cream" : "border border-danger/40 text-danger hover:bg-danger/10",
    secondary: active ? "bg-secondary text-cream" : "border border-stone text-ink-soft hover:bg-sand",
  }[color];
  return (
    <button onClick={onClick} disabled={disabled} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium disabled:opacity-50", tone)}>
      <Icon size={14} /> {children}
    </button>
  );
}
