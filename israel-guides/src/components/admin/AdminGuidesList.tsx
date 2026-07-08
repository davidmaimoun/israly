"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setGuidePublished } from "@/features/guides/actions";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type AdminGuideRow = { id: string; name: string; cities: string[]; published: boolean };

export function AdminGuidesList({ guides }: { guides: AdminGuideRow[] }) {
  const locale = useLocale();
  const t = useTranslations("admin.adminGuides");
  const tc = useTranslations("cities");
  const [pending, start] = useTransition();

  const toggle = (id: string, published: boolean) =>
    start(async () => {
      await setGuidePublished(locale, { guideId: id, published: !published });
    });

  return (
    <div className="grid gap-2">
      {guides.map((g) => (
        <div key={g.id} className="flex items-center justify-between rounded-xl border border-stone/70 bg-surface p-3">
          <div>
            <p className="font-medium text-ink">{g.name}</p>
            <p className="text-sm text-ink-soft">{g.cities.map((c) => tc(c)).join(" · ") || "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/admin/guides/${g.id}`} className="inline-flex items-center gap-1 rounded-full border border-stone px-3 py-1.5 text-sm hover:bg-sand">
              <Pencil size={14} /> {t("edit")}
            </Link>
            <span className={cn("text-xs", g.published ? "text-success" : "text-ink-soft")}>
              {g.published ? t("published") : t("unpublished")}
            </span>
            <button disabled={pending} onClick={() => toggle(g.id, g.published)} className="inline-flex items-center gap-1 rounded-full border border-stone px-3 py-1.5 text-sm hover:bg-sand disabled:opacity-50">
              {g.published ? <><EyeOff size={14} /> {t("unpublish")}</> : <><Eye size={14} /> {t("publish")}</>}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
