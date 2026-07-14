"use client";

// components/admin/LeadDispatch.tsx
import { useTransition } from "react";
import { offerLead, sellLead, passLead } from "@/features/leads/actions";
import type { GuideForRanking } from "@/lib/leads/eligibility";
import { cn } from "@/lib/utils";

const digits = (p?: string | null) => (p || "").replace(/[^\d]/g, "");

type Lead = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  numPeople: number;
  startDate?: string | null;
  startTime?: string | null;
  cities: string[];
  langs: string[];
  message?: string | null;
  leadStatus?: string | null;
  soldToGuideId?: string | null;
};

export function LeadDispatch({
  lead,
  guides,
  cityLabel = (c) => c,
  langLabel = (l) => l,
}: {
  lead: Lead;
  guides: GuideForRanking[];
  cityLabel?: (c: string) => string;
  langLabel?: (l: string) => string;
}) {
  const [pending, start] = useTransition();
  const sold = lead.leadStatus === "SOLD";

  // Aperçu envoyé au guide — SANS le contact client (révélé après paiement).
  const offerText = (g: GuideForRanking) =>
    [
      "Nouvelle demande Israly 👋",
      [
        lead.cities.map(cityLabel).join(", ") || "Toutes régions",
        lead.startDate ? `📅 ${lead.startDate}${lead.startTime ? " " + lead.startTime : ""}` : "dates flexibles",
      ].join(" · "),
      `${lead.numPeople} pers · ${lead.langs.map(langLabel).join(", ")}`,
      "Tu la prends ?",
    ].join("\n");

  const openWA = (g: GuideForRanking) => {
    const n = digits(g.phone);
    if (n) window.open(`https://wa.me/${n}?text=${encodeURIComponent(offerText(g))}`, "_blank", "noopener");
  };

  return (
    <div className="grid gap-5">
      {/* En-tête lead — côté admin, contact visible */}
      <div className="rounded-card border border-stone/70 bg-surface p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Demande de {lead.clientName}</h2>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
              sold ? "bg-success/15 text-success" : "bg-[#FBEADD] text-[#B65F30]",
            )}
          >
            {sold ? "Vendu" : "À dispatcher"}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
          <span>{lead.cities.map(cityLabel).join(", ") || "Toutes régions"}</span>
          <span>
            {lead.startDate ? `${lead.startDate}${lead.startTime ? " · " + lead.startTime : ""}` : "Dates flexibles"}
          </span>
          <span>{lead.numPeople} pers.</span>
          <span>{lead.langs.map(langLabel).join(", ")}</span>
        </div>
        {lead.message && <p className="mt-2 rounded-xl bg-cream/50 p-3 text-sm text-ink">{lead.message}</p>}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
          <span>📞 {lead.clientPhone}</span>
          <span>✉️ {lead.clientEmail}</span>
        </div>
      </div>

      {/* Cascade : guides éligibles classés (index 0 = premier à proposer) */}
      <div className="grid gap-3">
        <p className="text-sm font-medium text-ink-soft">
          {guides.length} guide{guides.length > 1 ? "s" : ""} éligible{guides.length > 1 ? "s" : ""} — classés par priorité
        </p>

        {guides.map((g, i) => {
          const isWinner = sold && lead.soldToGuideId === g.id;
          return (
            <div
              key={g.id}
              className={cn(
                "flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-center",
                isWinner ? "border-success/50 bg-success/5" : "border-stone/70 bg-surface",
                sold && !isWinner && "opacity-50",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                {g.photo ? (
                  <img src={g.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone/40 text-ink-soft">
                    {g.name[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{g.name}</span>
                    {g.certified && <span className="text-xs text-primary">✓ certifié</span>}
                  </div>
                  <div className="truncate text-xs text-ink-soft">{g.langs.map(langLabel).join(" · ")}</div>
                </div>
              </div>

              {/* signaux de classement */}
              <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                <Chip>
                  {g.wonLast30d} lead{g.wonLast30d > 1 ? "s" : ""}/30j
                </Chip>
                {g.wonLast30d === 0 && <Chip tone="peach">peu servi</Chip>}
                {g.lastTwoExpired && <Chip tone="warn">lent</Chip>}
                {typeof g.rating === "number" && <Chip>★ {g.rating.toFixed(1)}</Chip>}
              </div>

              {!sold ? (
                <div className="flex flex-wrap gap-2 sm:ml-2">
                  <button
                    onClick={() => {
                      start(() => offerLead(lead.id, g.id));
                      openWA(g);
                    }}
                    disabled={pending || !g.phone}
                    title={g.phone ? "" : "Pas de téléphone"}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition disabled:opacity-40"
                  >
                    Proposer (WA)
                  </button>
                  <button
                    onClick={() => start(() => sellLead(lead.id, g.id))}
                    disabled={pending}
                    className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-cream transition disabled:opacity-40"
                  >
                    Vendu
                  </button>
                  <button
                    onClick={() => start(() => passLead(lead.id, g.id))}
                    disabled={pending}
                    className="inline-flex h-9 items-center rounded-full border border-stone px-4 text-sm text-ink-soft transition disabled:opacity-40"
                  >
                    Sans réponse
                  </button>
                </div>
              ) : (
                isWinner && <span className="text-sm font-semibold text-success sm:ml-2">Attribué ✓</span>
              )}
            </div>
          );
        })}

        {guides.length === 0 && (
          <div className="rounded-card border border-stone/70 bg-surface p-6 text-center text-sm text-ink-soft">
            Aucun guide éligible (langue / région / dispo). Élargis les critères, ou contacte un guide hors cascade.
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "peach" | "warn" }) {
  const c =
    tone === "peach"
      ? "border-[#EAC4A4] bg-[#FBEADD] text-[#B65F30]"
      : tone === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : "border-stone bg-cream/50 text-ink-soft";
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", c)}>{children}</span>;
}
