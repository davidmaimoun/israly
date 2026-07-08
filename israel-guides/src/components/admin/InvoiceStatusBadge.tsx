import { useTranslations } from "next-intl";

const colors: Record<string, string> = {
  DRAFT: "bg-stone text-ink-soft",
  SENT: "bg-accent/25 text-secondary",
  PAID: "bg-success/20 text-success",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const t = useTranslations("admin.invoiceStatus");
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status] ?? "bg-stone"}`}>
      {t(status)}
    </span>
  );
}
