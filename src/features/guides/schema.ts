import { z } from "zod";
import { CITIES } from "@/lib/cities";
import { LANGUAGE_CODES } from "@/lib/languages";
import { SPECIALTIES } from "@/lib/specialties";
import { locales } from "@/i18n/config";

// L'URL peut être absolue (http) OU un chemin interne (/uploads/...).
const mediaUrl = z.string().refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), {
  message: "URL invalide",
});

const mediaItem = z.object({
  type: z.enum(["photo", "video"]),
  url: mediaUrl,
  poster: mediaUrl.optional().or(z.literal("")),
  caption: z.string().max(140).optional().or(z.literal("")),
});

// Bio multilingue : tous les champs optionnels (repli à l'affichage), au moins un rempli.
const localeKeys = locales as readonly string[];
export const localizedText = z
  .object(Object.fromEntries(localeKeys.map((l) => [l, z.string().max(2000).optional()])))
  .refine((o) => Object.values(o).some((v) => v && v.trim().length > 0), {
    message: "Au moins une description requise",
  });

// Prix optionnel : "" -> undefined, sinon nombre >= 0.
const optionalPrice = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.number().min(0).optional(),
);

export const tripPriceSchema = z.object({
  label: z.string().min(1).max(80),
  price: z.coerce.number().min(0),
  unit: z.enum(["perPerson", "perGroup", "perHour", "perPersonHour"]),
  duration: optionalPrice,
  details: z.string().max(1500).optional().or(z.literal("")),
});

export const guideProfileSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  photo: mediaUrl.optional().or(z.literal("")),
  city: z.enum(CITIES),
  languages: z.array(z.enum(LANGUAGE_CODES as [string, ...string[]])).min(1),
  specialties: z.array(z.enum(SPECIALTIES)).min(1),
  yearsExperience: z.coerce.number().int().min(0).max(70),
  bio: localizedText,
  gallery: z.array(mediaItem).max(20).default([]),
  phone: z.string().max(30).optional().or(z.literal("")),
  notes: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  currency: z.enum(["ILS", "USD", "EUR"]).default("ILS"),
  pricePerPersonHour: optionalPrice,
  pricePerGroup: optionalPrice,
  trips: z.array(tripPriceSchema).max(20).default([]),
});

export type GuideProfileInput = z.infer<typeof guideProfileSchema>;

export const guideSearchSchema = z.object({
  lang: z.string().optional(),   // codes séparés par des virgules
  cities: z.string().optional(), // régions séparées par des virgules
  q: z.string().optional(),      // recherche par nom de guide
  match: z.enum(["all", "any"]).default("all"),
});

export const adminPublishSchema = z.object({
  guideId: z.string().min(1),
  published: z.coerce.boolean(),
});

// Admin : création d'un compte guide (le register n'est PAS public).
export const createGuideSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  city: z.enum(CITIES),
});
