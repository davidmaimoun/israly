// app/[locale]/admin/leads/[id]/page.tsx
// ADAPT: protège cette route (admin only) selon ton auth (Auth.js).
import { getRankedGuidesForLead } from "@/features/leads/actions";
import { LeadDispatch } from "@/components/admin/LeadDispatch";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function LeadDispatchPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const { lead, guides } = await getRankedGuidesForLead(id);
  const tc = await getTranslations("cities");
  const tl = await getTranslations("langs");

  if (!lead) return <div className="mx-auto max-w-3xl p-6 text-ink-soft">Lead introuvable.</div>;

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Link href={`/${locale}/admin/leads`} className="mb-4 inline-block text-sm text-ink-soft hover:text-primary">
        ← Tous les leads
      </Link>
      <LeadDispatch lead={lead as any} guides={guides} cityLabel={(c) => tc(c)} langLabel={(l) => tl(l)} />
    </div>
  );
}
