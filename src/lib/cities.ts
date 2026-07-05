// Liste FIXE des régions touristiques. La clé est stockée en base (Guide.city),
// le libellé est traduit via i18n: messages -> cities.<key>.
export const CITIES = [
  "all",
  "jerusalem",
  "tel_aviv",
  "haifa",
  "dead_sea",
  "galilee",
  "eilat",
  "nazareth",
  "masada",
  "negev",
  "golan",
  "tiberias",
  "caesarea",
  "akko",
  "jaffa",
  "other",
] as const;

export type City = (typeof CITIES)[number];

export function isCity(value: string): value is City {
  return (CITIES as readonly string[]).includes(value);
}
