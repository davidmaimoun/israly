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
};
