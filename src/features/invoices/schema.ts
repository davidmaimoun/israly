import { z } from "zod";

export const createInvoiceSchema = z.object({
  guideId: z.string().min(1),
  bookingId: z.string().optional().or(z.literal("")),
  clientName: z.string().min(1).max(120),
  clientEmail: z.string().email().optional().or(z.literal("")),
  tourDate: z.string().optional().or(z.literal("")), // YYYY-MM-DD
  amount: z.coerce.number().min(0),
  currency: z.enum(["ILS", "USD", "EUR"]).default("ILS"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const invoiceStatusSchema = z.object({
  invoiceId: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "PAID"]),
});
