// Langues parlées par les guides (≠ langues de l'UI, mais ici le set est le même).
// Le libellé passe par i18n: langs.<code>. Le drapeau est ici.
export const LANGUAGES = [
  { code: "he", flag: "🇮🇱" },
  { code: "en", flag: "🇬🇧" },
  { code: "fr", flag: "🇫🇷" },
  { code: "es", flag: "🇪🇸" },
  { code: "ru", flag: "🇷🇺" },
  { code: "am", flag: "🇪🇹" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function flagOf(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.flag ?? "🏳️";
}
