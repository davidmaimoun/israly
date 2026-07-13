// ============================================================
// CONFIG i18n CENTRALE — ajouter une langue = 1 ligne ici + 1 JSON dans /messages
// ============================================================
export const locales = ["he", "en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";

// Langues affichées en RTL (hébreu + arabe).
export const rtlLocales: Locale[] = ["he"];

// Métadonnées d'affichage (drapeau emoji + nom natif) pour le LanguageSwitcher.
export const localeMeta: Record<Locale, { label: string; flag: string }> = {
  he: { label: "עברית", flag: "🇮🇱" },
  en: { label: "English", flag: "🇬🇧" },
  fr: { label: "Français", flag: "🇫🇷" },
  // ru: { label: "Русский", flag: "🇷🇺" },
  // es: { label: "Español", flag: "🇪🇸" },
  // am: { label: "አማርኛ", flag: "🇪🇹" },
};

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

export function dir(locale: string): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}
