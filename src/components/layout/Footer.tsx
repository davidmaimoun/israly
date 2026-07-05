import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-stone bg-sand/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-10 text-center md:px-8">
        <img src="/img/israly-logo.svg" alt="Israly" className="h-8 w-auto" />
        <p className="text-sm text-ink-soft">{t("footer.madeWith")}</p>
        <p className="text-xs text-ink-soft">
          © {year} {t("meta.siteName")}. {t("footer.rights")}
        </p>
        <Link href="/admin" className="text-xs text-ink-soft underline-offset-2 hover:text-primary hover:underline">
          {t("nav.admin")}
        </Link>
      </div>
    </footer>
  );
}
