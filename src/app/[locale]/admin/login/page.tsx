import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Compass } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.login");

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-stone/70 bg-surface p-7 shadow-[var(--shadow-soft)]">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-ink">
          <Compass className="text-primary" />
          <span className="display text-xl">{t("title")}</span>
        </Link>
        <LoginForm />
      </div>
    </main>
  );
}
