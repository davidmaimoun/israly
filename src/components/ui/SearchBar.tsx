"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { Button } from "./Button";

// Barre de recherche du hero : épurée (nom + rechercher). Les filtres se font sur /guides.
export function SearchBar() {
  const t = useTranslations("search");
  const router = useRouter();
  const [name, setName] = useState("");

  const submit = () => {
    const params = new URLSearchParams();
    if (name.trim()) params.set("q", name.trim());
    router.push(`/guides?${params.toString()}`);
  };

  return (
    <div className="flex select-none items-center gap-1.5 rounded-full border border-stone/60 bg-surface/95 p-1.5 shadow-[var(--shadow-soft)] backdrop-blur">
      <div className="relative flex-1">
        <Search size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("namePlaceholder")}
          className="h-12 w-full rounded-full bg-transparent ps-11 pe-3 text-sm text-ink outline-none placeholder:text-ink-soft/70"
        />
      </div>
      <Button size="lg" onClick={submit} className="h-12 shrink-0 rounded-full px-6">
        <Search size={18} /> <span className="hidden sm:inline">{t("submit")}</span>
      </Button>
    </div>
  );
}