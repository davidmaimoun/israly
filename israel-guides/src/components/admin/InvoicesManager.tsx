"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createInvoice, setInvoiceStatus } from "@/features/invoices/actions";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { Button } from "@/components/ui/Button";
import { Plus, Loader2, Printer, Send, BadgeCheck } from "lucide-react";
import type { Trip } from "@/lib/pricing";

export type InvoiceRow = {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  currency: string;
  tourDate: string | null;
  status: string;
};
export type BookingOption = {
  id: string;
  clientName: string;
  clientEmail: string;
  startDate: string;
  numPeople: number;
};

export function InvoicesManager({
  guideId,
  invoices,
  bookings,
  trips = [],
  defaultCurrency = "ILS",
}: {
  guideId: string;
  invoices: InvoiceRow[];
  bookings: BookingOption[];
  trips?: Trip[];
  defaultCurrency?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("admin.invoices");
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookingId, setBookingId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [notes, setNotes] = useState("");

  const pickBooking = (id: string) => {
    setBookingId(id);
    const b = bookings.find((x) => x.id === id);
    if (b) {
      setClientName(b.clientName);
      setClientEmail(b.clientEmail);
      setTourDate(b.startDate);
    }
  };

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await createInvoice(locale, {
        guideId,
        bookingId,
        clientName,
        clientEmail,
        tourDate,
        amount,
        currency,
        notes,
      });
      if (res.ok) {
        setOpen(false);
        setBookingId(""); setClientName(""); setClientEmail(""); setTourDate(""); setAmount(""); setNotes("");
      } else setError(res.error ?? "Erreur");
    });
  };

  const changeStatus = (invoiceId: string, status: string) =>
    start(async () => { await setInvoiceStatus(locale, { invoiceId, status }); });

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen((v) => !v)} size="sm">
          <Plus size={16} /> {t("create")}
        </Button>
      </div>

      {open && (
        <div className="grid gap-3 rounded-[var(--radius-card)] border border-stone/70 bg-surface p-4">
          <h3 className="display text-lg">{t("createTitle")}</h3>
          {bookings.length > 0 && (
            <div>
              <label className="eyebrow mb-1 block">{t("selectBooking")}</label>
              <select value={bookingId} onChange={(e) => pickBooking(e.target.value)} className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3 text-sm">
                <option value="">—</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>{b.clientName} · {b.startDate} ({b.numPeople})</option>
                ))}
              </select>
            </div>
          )}
          {trips.length > 0 && (
            <div>
              <label className="eyebrow mb-1 block">{t("fromTrip")}</label>
              <select
                onChange={(e) => {
                  const tr = trips[Number(e.target.value)];
                  if (tr) { setAmount(String(tr.price)); setCurrency(defaultCurrency); }
                }}
                className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3 text-sm"
                defaultValue=""
              >
                <option value="">—</option>
                {trips.map((tr, i) => (
                  <option key={i} value={i}>{tr.label} · {tr.price}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("client")} value={clientName} onChange={setClientName} />
            <Field label="Email" value={clientEmail} onChange={setClientEmail} type="email" />
            <Field label={t("date")} value={tourDate} onChange={setTourDate} type="date" />
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("amountLabel")} value={amount} onChange={setAmount} type="number" />
              <div>
                <label className="eyebrow mb-1 block">{t("currency")}</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3 text-sm">
                  <option value="ILS">₪ ILS</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="eyebrow mb-1 block">{t("notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-stone bg-cream/50 px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div>
            <Button onClick={submit} disabled={pending || !clientName || !amount}>
              {pending ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {t("save")}
            </Button>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone bg-surface p-8 text-center text-ink-soft">{t("empty")}</p>
      ) : (
        <div className="grid gap-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-stone/70 bg-surface p-4">
              <div>
                <p className="font-semibold text-ink">{inv.number}</p>
                <p className="text-sm text-ink-soft">{inv.clientName}{inv.tourDate ? ` · ${inv.tourDate}` : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-ink">{inv.amount.toLocaleString()} {inv.currency}</span>
                <InvoiceStatusBadge status={inv.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                {inv.status === "DRAFT" && (
                  <button disabled={pending} onClick={() => changeStatus(inv.id, "SENT")} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm text-white disabled:opacity-50">
                    <Send size={14} /> {t("markSent")}
                  </button>
                )}
                {inv.status !== "PAID" && (
                  <button disabled={pending} onClick={() => changeStatus(inv.id, "PAID")} className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-sm text-white disabled:opacity-50">
                    <BadgeCheck size={14} /> {t("markPaid")}
                  </button>
                )}
                <Link href={`/admin/invoices/${inv.id}`} className="inline-flex items-center gap-1 rounded-full border border-stone px-3 py-1.5 text-sm hover:bg-sand">
                  <Printer size={14} /> {t("print")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="eyebrow mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3 text-sm" />
    </div>
  );
}
