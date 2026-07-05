import { useTranslations } from "next-intl";

const colors: Record<string, string> = {
  PENDING: "bg-accent/25 text-secondary",
  CONFIRMED: "bg-success/20 text-success",
  DECLINED: "bg-danger/15 text-danger",
  CANCELLED: "bg-stone text-ink-soft",
  COMPLETED: "bg-secondary/15 text-secondary",
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("admin.status");
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status] ?? "bg-stone"}`}>
      {t(status)}
    </span>
  );
}
