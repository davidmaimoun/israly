import type { Locale } from "@/i18n/config";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Texte localisé stocké en base : champs optionnels par langue, avec repli.
export type LocalizedText = Partial<Record<Locale, string | null>>;

export function localized(
  obj: LocalizedText | null | undefined,
  locale: Locale,
): string {
  if (!obj) return "";
  // Ordre de repli : langue demandée -> en -> fr -> he -> 1re dispo.
  return (
    obj[locale] ||
    obj.en ||
    obj.fr ||
    obj.he ||
    Object.values(obj).find((v) => !!v) ||
    ""
  );
}

// Nom d'affichage d'un guide.
export function fullName(g: { firstName: string; lastName: string }): string {
  return `${g.firstName} ${g.lastName}`.trim();
}

export function toDateKey(d: Date): string {
  // YYYY-MM-DD en UTC, indépendant du fuseau.
  return d.toISOString().slice(0, 10);
}

export function fromDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function formatDate(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(d);
}
