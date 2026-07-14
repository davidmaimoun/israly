// app/[locale]/admin/leads/page.tsx
// ADAPT: protège cette route (admin only) selon ton auth (Auth.js).
import { getRecentLeads } from "@/features/leads/actions";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-[#FBEADD] text-[#B65F30]",
  OFFERING: "bg-amber-50 text-amber-700",
  SOLD: "bg-success/15 text-success",
  CANCELLED: "bg-stone/30 text-ink-soft",
};

export default async function LeadsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const leads = await getRecentLeads();
  const tc = await getTranslations("cities");
  const tl = await getTranslations("langs");

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold text-ink">Leads</h1>
      <div className="grid gap-2">
        {leads.length === 0 && (
          <p className="rounded-card border border-stone/70 bg-surface p-5 text-sm text-ink-soft">
            Aucun lead pour l'instant.
          </p>
        )}
        {leads.map((l) => (
          <Link
            key={l.id}
            href={`/${locale}/admin/leads/${l.id}`}
            className="flex items-center justify-between gap-3 rounded-card border border-stone/70 bg-surface p-4 transition hover:border-primary/50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{l.clientName}</span>
                {l.guideId && <span className="text-xs text-primary">demande ciblée</span>}
              </div>
              <div className="truncate text-xs text-ink-soft">
                {(l.cities.map((c) => tc(c)).join(", ") || "Toutes régions") +
                  " · " +
                  (l.startDate || "dates flexibles") +
                  " · " +
                  l.numPeople +
                  " pers · " +
                  l.langs.map((x) => tl(x)).join(", ")}
              </div>
            </div>
            <span
              className={
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                (STATUS_STYLE[l.leadStatus] ?? "bg-stone/30 text-ink-soft")
              }
            >
              {l.leadStatus}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
