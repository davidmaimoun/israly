import { z } from "zod";

export const availabilityStatusEnum = z.enum([
  "AVAILABLE",
  "BOOKED",
  "UNAVAILABLE",
]);

export const setAvailabilitySchema = z.object({
  guideId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date YYYY-MM-DD attendue"),
  status: availabilityStatusEnum,
  note: z.string().max(140).optional(),
});

export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
