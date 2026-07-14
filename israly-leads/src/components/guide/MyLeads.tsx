"use client";

// components/guide/MyLeads.tsx
import { cn } from "@/lib/utils";

const digits = (p?: string | null) => (p || "").replace(/[^\d]/g, "");
const shortId = (id: string) => id.slice(-5).toUpperCase();

type Pending = {
  offerId: string;
  leadId: string;
  cities: string[];
  langs: string[];
  numPeople: number;
  startDate?: string | null;
  startTime?: string | null;
  message?: string | null;
  expiresAt?: string | Date | null;
};

type Won = Pending & {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  wonAt?: string | Date | null;
};

export function MyLeads({
  pending,
  won,
  ownerWhatsapp,
  cityLabel = (c) => c,
  langLabel = (l) => l,
}: {
  pending: Pending[];
  won: Won[];
  ownerWhatsapp?: string; // NEXT_PUBLIC_WHATSAPP côté page
  cityLabel?: (c: string) => string;
  langLabel?: (l: string) => string;
}) {
  const meta = (l: Pending) =>
    [
      l.cities.map(cityLabel).join(", ") || "Toutes régions",
      l.startDate ? `${l.startDate}${l.startTime ? " · " + l.startTime : ""}` : "dates flexibles",
      `${l.numPeople} pers.`,
      l.langs.map(langLabel).join(", "),
    ].filter(Boolean);

  const takeHref = (l: Pending) => {
    const n = digits(ownerWhatsapp);
    const txt = `Je prends le lead #${shortId(l.leadId)} — ${l.cities.map(cityLabel).join(", ")} ${l.startDate ?? ""}`.trim();
    return n ? `https://wa.me/${n}?text=${encodeURIComponent(txt)}` : undefined;
  };

  return (
    <div className="grid gap-8">
      {/* ---- Offres en attente : APERÇU sans contact ---- */}
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-ink">Offres à saisir</h2>
        {pending.length === 0 && (
          <p className="rounded-card border border-stone/70 bg-surface p-5 text-sm text-ink-soft">
            Aucune offre en attente pour le moment.
          </p>
        )}
        {pending.map((l) => (
          <div key={l.offerId} className="rounded-card border border-[#EAC4A4] bg-[#FBEADD]/40 p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">Nouvelle demande #{shortId(l.leadId)}</span>
              <span className="rounded-full bg-[#FBEADD] px-2.5 py-1 text-xs font-semibold text-[#B65F30]">
                à saisir
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
              {meta(l).map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
            {l.message && <p className="mt-2 rounded-xl bg-white/70 p-3 text-sm text-ink">{l.message}</p>}
            <p className="mt-2 text-xs text-ink-soft">
              Le contact du client est débloqué une fois le lead confirmé.
            </p>
            <div className="mt-3">
              <a
                href={takeHref(l)}
                target="_blank"
                rel="noopener"
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white",
                  !takeHref(l) && "pointer-events-none opacity-40",
                )}
              >
                Je prends ce lead
              </a>
            </div>
          </div>
        ))}
      </section>

      {/* ---- Leads gagnés : contact complet ---- */}
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-ink">Mes leads</h2>
        {won.length === 0 && (
          <p className="rounded-card border border-stone/70 bg-surface p-5 text-sm text-ink-soft">
            Pas encore de lead confirmé.
          </p>
        )}
        {won.map((l) => (
          <div key={l.leadId} className="rounded-card border border-success/40 bg-success/5 p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="font-semibold text-ink">{l.clientName}</span>
              <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">confirmé</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
              {meta(l).map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
            {l.message && <p className="mt-2 rounded-xl bg-white/70 p-3 text-sm text-ink">{l.message}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/${digits(l.clientPhone)}`}
                target="_blank"
                rel="noopener"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white"
              >
                WhatsApp
              </a>
              <a
                href={`tel:${l.clientPhone}`}
                className="inline-flex h-9 items-center rounded-full border border-stone px-4 text-sm text-ink"
              >
                {l.clientPhone}
              </a>
              <a
                href={`mailto:${l.clientEmail}`}
                className="inline-flex h-9 items-center rounded-full border border-stone px-4 text-sm text-ink"
              >
                {l.clientEmail}
              </a>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
