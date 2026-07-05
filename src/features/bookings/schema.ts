import { z } from "zod";
import { locales } from "@/i18n/config";

export const bookingStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
  "COMPLETED",
]);

// Demande publique (flux MANUEL → crée une Booking PENDING).
export const createBookingSchema = z.object({
  guideId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  clientName: z.string().min(2).max(80),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(6, "Téléphone requis").max(30),
  numPeople: z.coerce.number().int().min(1).max(60),
  startTime: z.string().max(10).optional().or(z.literal("")),
  preferredLang: z.string().max(5).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
  locale: z.enum(locales),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Demande GÉNÉRALE (section "Planifier une visite", sans guide précis).
// Date facultative, régions et langues multiples facultatives.
export const createTourRequestSchema = z.object({
  clientName: z.string().min(2).max(80),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(6, "Téléphone requis").max(30),
  numPeople: z.coerce.number().int().min(1).max(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  startTime: z.string().max(10).optional().or(z.literal("")),
  cities: z.array(z.string()).max(14).default([]),
  langs: z.array(z.string()).max(7).default([]),
  message: z.string().max(1000).optional().or(z.literal("")),
  locale: z.enum(locales),
});

export type CreateTourRequestInput = z.infer<typeof createTourRequestSchema>;

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: bookingStatusEnum,
});

// ADMIN — édition d'un créneau (date/heure/nb) pour reproposer si guide indispo.
export const adminUpdateBookingSchema = z.object({
  bookingId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().max(10).optional().or(z.literal("")),
  numPeople: z.coerce.number().int().min(1).max(60),
  amount: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).max(1000000).optional()),
});
