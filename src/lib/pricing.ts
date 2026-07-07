// Helpers tarifs : symboles de devise + formatage + unités.
export const CURRENCIES = ["ILS", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const TRIP_UNITS = ["perPerson", "perGroup", "perHour", "perPersonHour"] as const;
export type TripUnit = (typeof TRIP_UNITS)[number];

const SYMBOL: Record<string, string> = { ILS: "₪", USD: "$", EUR: "€" };

export function currencySymbol(c: string): string {
  return SYMBOL[c] ?? c;
}

// Montant formaté avec symbole (ex: 1 200 ₪).
export function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currencySymbol(currency)}`;
}

export type Trip = {
  label: string;
  price: number;
  unit: TripUnit;
  duration: number | null;
  details: string | null;
  itinerary: string | null; // JSON: ItineraryStop[]
};

// Étape d'itinéraire : soit une heure précise, soit une durée, + label multilingue.
export type ItineraryStop = {
  mode: "time" | "duration";
  time: string;        // "09:00"
  durationMin: number; // minutes
  label: Record<string, string>; // locale -> texte
};

export function parseItinerary(raw?: string | null): ItineraryStop[] {
  if (!raw) return [];
  try {
    const a = JSON.parse(raw);
    if (!Array.isArray(a)) return [];
    return a.map((s) => ({
      mode: s.mode === "duration" ? "duration" : "time",
      time: typeof s.time === "string" ? s.time : "09:00",
      durationMin: Number.isFinite(s.durationMin) ? s.durationMin : 60,
      label: s.label && typeof s.label === "object" ? s.label : {},
    }));
  } catch {
    return [];
  }
}

export function serializeItinerary(stops: ItineraryStop[]): string {
  return JSON.stringify(stops);
}

// 90 -> "1h30", 60 -> "1h", 45 -> "45 min"
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h${String(m).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m} min`;
}

// Migration : convertit un ancien programme texte libre ("09:00 ... 10:30 ...") en étapes.
export function legacyDetailsToStops(text: string, locale: string): ItineraryStop[] {
  if (!text) return [];
  const re = /(\d{1,2})[:hH.](\d{2})\s*([^]*?)(?=\s*\d{1,2}[:hH.]\d{2}|$)/g;
  return [...text.matchAll(re)]
    .map((m) => ({
      mode: "time" as const,
      time: `${m[1].padStart(2, "0")}:${m[2]}`,
      durationMin: 60,
      label: { [locale]: (m[3] || "").trim() } as Record<string, string>,
    }))
    .filter((x) => x.label[locale]);
}
