"use client";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";

export function PrintButton() {
  const t = useTranslations("admin.invoices");
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-cream print:hidden"
    >
      <Printer size={18} /> {t("print")}
    </button>
  );
}
