"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { adminCreateGuide } from "@/features/guides/actions";
import { CITIES } from "@/lib/cities";
import { Button } from "@/components/ui/Button";
import { UserPlus, Loader2 } from "lucide-react";

export function CreateGuideForm() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("admin.createGuide");
  const tp = useTranslations("admin.profile");
  const tc = useTranslations("cities");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState<string>(CITIES[1] ?? "jerusalem");

  function submit() {
    setError(null);
    start(async () => {
      const res = await adminCreateGuide(locale, { firstName, lastName, email, password, city });
      if (res.ok && res.guideId) router.push(`/admin/guides/${res.guideId}`);
      else setError(res.error ?? "Erreur");
    });
  }

  return (
    <div className="mb-5 rounded-[var(--radius-card)] border border-primary/30 bg-primary/5 p-4">
      <p className="mb-3 flex items-center gap-2 font-semibold text-ink"><UserPlus size={18} className="text-primary" /> {t("title")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={tp("firstName")} className="h-11 rounded-xl border border-stone bg-surface px-3 text-sm" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={tp("lastName")} className="h-11 rounded-xl border border-stone bg-surface px-3 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={tp("email")} className="h-11 rounded-xl border border-stone bg-surface px-3 text-sm" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")} className="h-11 rounded-xl border border-stone bg-surface px-3 text-sm" />
        <select value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl border border-stone bg-surface px-3 text-sm">
          {CITIES.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
        </select>
        <Button onClick={submit} disabled={pending} className="h-11">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} {t("submit")}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
