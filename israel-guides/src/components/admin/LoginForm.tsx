"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { loginAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/Button";
import { Loader2, LogIn } from "lucide-react";

export function LoginForm() {
  const locale = useLocale();
  const t = useTranslations("admin.login");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await loginAction(locale, {
        email: fd.get("email"),
        password: fd.get("password"),
      });
      if (res.ok) router.push("/admin");
      else setError(res.error ?? t("error"));
    });
  }

  return (
    <form action={submit} className="grid gap-4">
      <div>
        <label className="eyebrow mb-1 block">{t("email")}</label>
        <input name="email" type="email" required className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3" />
      </div>
      <div>
        <label className="eyebrow mb-1 block">{t("password")}</label>
        <input name="password" type="password" required className="h-11 w-full rounded-xl border border-stone bg-cream/50 px-3" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
        {t("submit")}
      </Button>
    </form>
  );
}
