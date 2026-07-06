"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  updateBookingStatus, adminUpdateBooking, sendClientEmail, deleteBooking,
} from "@/features/bookings/actions";
import { confirmEmail, proposeEmail, confirmText, proposeText } from "@/lib/email-templates";
import { StatusBadge } from "./StatusBadge";
import { Mail, CalendarClock, Eye, Send, Check, Copy, Trash2, Pencil, Loader2, Phone, MessageCircle } from "lucide-react";
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
  amount: number | null;
  currency: string;
  cities: string[];
  langs: string[];
  message: string | null;
  status: string;
  locale: string;
  createdAt: string;
};

const ALL_STATUS = ["PENDING", "AWAITING", "CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED"];

const STATUS_ORDER: Record<string, number> = { PENDING: 0, AWAITING: 1, CONFIRMED: 2, COMPLETED: 3, DECLINED: 4, CANCELLED: 5 };
type SortKey = "date" | "name" | "guide" | "status";

export function AdminBookingsList({ bookings }: { bookings: AdminBookingRow[] }) {
  const t = useTranslations("admin.bookings");
  const [sort, setSort] = useState<SortKey>("date");
  if (!bookings.length) return null;

  const pending = bookings
    .filter((b) => b.status === "PENDING")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const awaiting = bookings
    .filter((b) => b.status === "AWAITING")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const rest = bookings
    .filter((b) => b.status !== "PENDING" && b.status !== "AWAITING")
    .sort((a, b) => {
      if (sort === "name") return a.clientName.localeCompare(b.clientName);
      if (sort === "guide") return (a.guideName ?? "\uffff").localeCompare(b.guideName ?? "\uffff");
      if (sort === "status") return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      return a.createdAt < b.createdAt ? 1 : -1; // date desc
    });

  const sorts: SortKey[] = ["date", "name", "guide", "status"];
  const sortLabel: Record<SortKey, string> = { date: t("sortDate"), name: t("sortName"), guide: t("sortGuide"), status: t("sortStatus") };

  return (
    <div className="grid gap-6">
      {/* Section EN ATTENTE (à traiter), bien visible */}
      {pending.length > 0 && (
        <div className="rounded-[var(--radius-card)] border-2 border-danger/30 bg-danger/[0.04] p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-danger px-1.5 text-sm font-bold text-cream">{pending.length}</span>
            {t("pendingTitle")}
          </p>
          <div className="grid gap-4">
            {pending.map((b) => <Card key={b.id} b={b} />)}
          </div>
        </div>
      )}

      {/* Section ATTENTE CLIENT (mail envoyé, en attente de réponse) */}
      {awaiting.length > 0 && (
        <div className="rounded-[var(--radius-card)] border-2 border-primary/25 bg-primary/[0.04] p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-sm font-bold text-cream">{awaiting.length}</span>
            {t("awaitingTitle")}
          </p>
          <div className="grid gap-4">
            {awaiting.map((b) => <Card key={b.id} b={b} />)}
          </div>
        </div>
      )}

      {/* Le reste, trié */}
      {rest.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-soft">{t("others")} · {t("sort")}:</span>
            {sorts.map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium", sort === k ? "bg-primary text-cream" : "bg-surface text-ink-soft ring-1 ring-stone hover:bg-sand")}
              >
                {sortLabel[k]}
              </button>
            ))}
          </div>
          <div className="grid gap-4">
            {rest.map((b) => <Card key={b.id} b={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ b }: { b: AdminBookingRow }) {
  const locale = useLocale();
  const t = useTranslations("admin.bookings");
  const te = useTranslations("admin.email");
  const tb = useTranslations("booking");
  const tc = useTranslations("cities");
  const tl = useTranslations("langs");
  const ts = useTranslations("admin.status");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [composer, setComposer] = useState<null | "confirm" | "propose">(null);
  const [date, setDate] = useState(b.startDate);
  const [time, setTime] = useState(b.startTime ?? "");
  const [people, setPeople] = useState(String(b.numPeople));
  const [amount, setAmount] = useState(b.amount != null ? String(b.amount) : "");

  const setStatus = (status: string) => start(async () => { await updateBookingStatus(locale, { bookingId: b.id, status }); router.refresh(); });
  const saveSlot = () => start(async () => {
    const res = await adminUpdateBooking(locale, { bookingId: b.id, startDate: date, startTime: time, numPeople: Number(people || 1), amount });
    if (res.ok) { setEditing(false); router.refresh(); }
  });
  const remove = () => {
    if (!window.confirm(te("deleteConfirm"))) return;
    start(async () => { await deleteBooking(locale, b.id); router.refresh(); });
  };

  const received = useMemo(() => new Date(b.createdAt).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), [b.createdAt, locale]);

  return (
    <div className="rounded-[var(--radius-card)] border border-stone/70 bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{b.clientName}</p>
          <p className="text-sm text-ink-soft">
            <a href={`mailto:${b.clientEmail}`} className="hover:underline">{b.clientEmail}</a>
            {b.clientPhone ? <> · <a href={`tel:${b.clientPhone}`} className="hover:underline"><Phone size={12} className="inline" /> {b.clientPhone}</a></> : ""}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft/60">
            {b.guideName ?? <span className="text-secondary">★ {t("general")}</span>} · {received}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={b.status} />
          <button onClick={remove} title={te("delete")} className="rounded-md p-1.5 text-ink-soft/50 hover:bg-danger/10 hover:text-danger"><Trash2 size={16} /></button>
        </div>
      </div>

      <p className="mt-2 text-sm text-ink-soft">
        {b.startDate}{b.startTime ? ` · ${b.startTime}` : ""} · {t("people", { count: b.numPeople })}
        {b.amount != null ? ` · ${b.currency === "USD" ? "$" : b.currency === "EUR" ? "€" : "₪"}${b.amount}` : ""}
      </p>
      {(b.cities.length > 0 || b.langs.length > 0) && (
        <p className="mt-1 text-xs text-ink-soft">
          {b.cities.length > 0 && <>📍 {b.cities.map((c) => tc(c)).join(", ")} </>}
          {b.langs.length > 0 && <>· 🗣 {b.langs.map((l) => tl(l)).join(", ")}</>}
        </p>
      )}
      {b.message && <p className="mt-1 rounded-lg bg-cream/60 px-3 py-2 text-sm text-ink-soft">“{b.message}”</p>}

      {/* Statut + éditer */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone/60 pt-3">
        <select value={b.status} disabled={pending} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-xl border border-stone bg-cream px-3 text-sm font-medium">
          {ALL_STATUS.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
        </select>
        <button onClick={() => setEditing((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone px-4 text-sm text-ink-soft hover:bg-sand">
          <Pencil size={14} /> {t("editSlot")}
        </button>
      </div>

      {editing && (
        <div className="mt-3 grid gap-2 rounded-xl border border-stone bg-cream/40 p-3 sm:grid-cols-4">
          <label className="text-xs text-ink-soft">{tb("startDate")}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-stone bg-surface px-2 text-sm" /></label>
          <label className="text-xs text-ink-soft">{tb("time")}<input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-stone bg-surface px-2 text-sm" /></label>
          <label className="text-xs text-ink-soft">{tb("people")}<input type="number" min={1} value={people} onChange={(e) => setPeople(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-stone bg-surface px-2 text-sm" /></label>
          <label className="text-xs text-ink-soft">{t("amount")}<input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₪" className="mt-1 h-10 w-full rounded-lg border border-stone bg-surface px-2 text-sm" /></label>
          <div className="flex gap-2 sm:col-span-4">
            <button onClick={saveSlot} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-cream">{pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t("save")}</button>
            <button onClick={() => setEditing(false)} className="inline-flex h-9 items-center rounded-full border border-stone px-4 text-sm">{t("close")}</button>
          </div>
        </div>
      )}

      {/* Composer e-mail */}
      <div className="mt-3 border-t border-stone/60 pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft/60">{te("title")}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setComposer(composer === "confirm" ? null : "confirm")} className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold", composer === "confirm" ? "bg-secondary text-cream" : "bg-secondary/12 text-secondary hover:bg-secondary/20")}>
            <Mail size={15} /> {te("confirmBtn")}
          </button>
          <button onClick={() => setComposer(composer === "propose" ? null : "propose")} className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold", composer === "propose" ? "bg-ink text-cream" : "bg-accent/20 text-ink hover:bg-accent/30")}>
            <CalendarClock size={15} /> {te("proposeBtn")}
          </button>
        </div>
        {composer && <Composer kind={composer} b={b} onSent={() => setComposer(null)} />}
      </div>
    </div>
  );
}

function Composer({ kind, b, onSent }: { kind: "confirm" | "propose"; b: AdminBookingRow; onSent: () => void }) {
  const locale = useLocale();
  const router = useRouter();
  const te = useTranslations("admin.email");
  const [pending, start] = useTransition();
  const [paymentLink, setPaymentLink] = useState("");
  const [altDates, setAltDates] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const base = { clientName: b.clientName, guideName: b.guideName, dateISO: b.startDate, locale: b.locale };
  const html = useMemo(() =>
    kind === "confirm"
      ? confirmEmail({ ...base, time: b.startTime, numPeople: b.numPeople, amount: b.amount, currency: b.currency, paymentLink: paymentLink || undefined }).html
      : proposeEmail({ ...base, altDates, note: note || undefined }).html,
  [kind, b, paymentLink, altDates, note]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = useMemo(() =>
    kind === "confirm"
      ? confirmText({ ...base, numPeople: b.numPeople, amount: b.amount, currency: b.currency, paymentLink: paymentLink || undefined })
      : proposeText({ ...base, altDates, note: note || undefined }),
  [kind, b, paymentLink, altDates, note]); // eslint-disable-line react-hooks/exhaustive-deps

  const digits = (b.clientPhone || "").replace(/\D/g, "");
  const send = () => start(async () => {
    setErr(null);
    const res = await sendClientEmail(locale, { bookingId: b.id, kind, paymentLink, altDates, note });
    if (res.ok) { setSent(true); setTimeout(() => { onSent(); router.refresh(); }, 1200); }
    else setErr(res.error ?? "Error");
  });
  const whatsapp = () => window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };

  const disabled = kind === "propose" && !altDates.trim();

  return (
    <div className="mt-3 rounded-2xl bg-cream/60 p-4 ring-1 ring-stone/60">
      {kind === "confirm" ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-soft">{te("paymentLink")}</span>
          <input value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)} placeholder="https://grow.link/…" className="h-11 rounded-xl border border-stone bg-surface px-3" />
        </label>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-soft">{te("altDates")}</span>
            <input value={altDates} onChange={(e) => setAltDates(e.target.value)} placeholder="12–25 Oct…" className="h-11 rounded-xl border border-stone bg-surface px-3" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-soft">{te("note")}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="rounded-xl border border-stone bg-surface px-3 py-2" />
          </label>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-ink/15">
          <Eye size={15} /> {preview ? te("hidePreview") : te("preview")}
        </button>
        <button onClick={send} disabled={pending || sent || disabled} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-cream hover:brightness-110 disabled:opacity-50">
          {sent ? <><Check size={15} /> {te("sent")}</> : <><Send size={15} /> {pending ? te("sending") : te("send")}</>}
        </button>
        <button onClick={whatsapp} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-cream disabled:opacity-50">
          <MessageCircle size={15} /> {te("whatsapp")}
        </button>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-ink/15">
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? te("copied") : te("copy")}
        </button>
      </div>
      {err && <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{err}</p>}
      {!digits && <p className="mt-1.5 text-xs text-ink-soft/60">{te("noPhone")}</p>}

      {preview && <iframe title="email-preview" srcDoc={html} className="mt-3 h-[26rem] w-full rounded-lg border border-stone bg-white" />}
    </div>
  );
}