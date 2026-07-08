import { useTranslations } from "next-intl";
import { flagOf, LANGUAGE_CODES } from "@/lib/languages";

// Affiche les langues d'un guide en drapeaux + labels. Les codes inconnus
// (ex. anciennes données "ar") sont ignorés pour ne pas casser le rendu.
export function LanguageFlags({ codes }: { codes: string[] }) {
  const t = useTranslations("langs");
  const known = codes.filter((c) => (LANGUAGE_CODES as readonly string[]).includes(c));
  if (!known.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {known.map((c) => (
        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-ink-soft">
          <span aria-hidden>{flagOf(c)}</span>
          {t(c)}
        </span>
      ))}
    </div>
  );
}
