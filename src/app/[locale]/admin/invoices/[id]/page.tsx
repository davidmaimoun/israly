export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { Link } from "@/i18n/navigation";
import { PrintButton } from "@/components/admin/PrintButton";
import { InvoiceStatusBadge } from "@/components/admin/InvoiceStatusBadge";
import { fullName, toDateKey } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations("admin.invoices");
  const tMeta = await getTranslations("meta");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { guide: true },
  });
  if (!invoice) notFound();
  // Un guide ne voit que SES factures ; l'admin voit tout.
  if (user.role !== "admin" && user.guideId !== invoice.guideId) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-primary">
          <ArrowLeft size={16} /> {t("title")}
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-[var(--radius-card)] border border-stone/70 bg-surface p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="display text-2xl text-primary">{tMeta("siteName")}</h1>
            <p className="text-sm text-ink-soft">{t("issuedBy")}: {fullName(invoice.guide)}</p>
          </div>
          <div className="text-end">
            <p className="font-mono text-lg font-bold">{invoice.number}</p>
            <p className="text-sm text-ink-soft">{toDateKey(invoice.issuedAt)}</p>
            <div className="mt-1 flex justify-end"><InvoiceStatusBadge status={invoice.status} /></div>
          </div>
        </div>

        <div className="my-6 h-px bg-stone" />

        <div className="grid gap-1 text-sm">
          <p className="eyebrow">{t("billedTo")}</p>
          <p className="font-medium text-ink">{invoice.clientName}</p>
          {invoice.clientEmail && <p className="text-ink-soft">{invoice.clientEmail}</p>}
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-stone text-start text-ink-soft">
              <th className="py-2 text-start font-medium">{t("tour")}</th>
              <th className="py-2 text-end font-medium">{t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone/50">
              <td className="py-3">
                {t("tour")}{invoice.tourDate ? ` — ${toDateKey(invoice.tourDate)}` : ""}
                {invoice.notes ? <span className="block text-ink-soft">{invoice.notes}</span> : null}
              </td>
              <td className="py-3 text-end font-semibold">
                {invoice.amount.toLocaleString()} {invoice.currency}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-end font-semibold">Total</td>
              <td className="py-3 text-end text-lg font-bold text-primary">
                {invoice.amount.toLocaleString()} {invoice.currency}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
