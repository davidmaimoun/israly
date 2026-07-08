"use client";

import { useLocale, useTranslations } from "next-intl";
import { logoutAction } from "@/features/auth/actions";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const locale = useLocale();
  const t = useTranslations("admin.nav");
  return (
    <button
      onClick={() => logoutAction(locale)}
      className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-danger"
    >
      <LogOut size={16} /> {t("logout")}
    </button>
  );
}
