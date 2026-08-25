import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalGroupSizeSchema = z.number().int().min(1).max(99).nullable();
const requiredTextSchema = z.string().trim().min(1);
const bookingUrlSchema = z
  .string()
  .url()
  .refine((url) => new URL(url).protocol === "https:", {
    message: "Adres rezerwacji musi używać HTTPS.",
  });

export const offerContentSchema = z.object({
  paragraphs: z.array(requiredTextSchema),
  highlights: z.array(requiredTextSchema),
  included: z.array(requiredTextSchema),
  excluded: z.array(requiredTextSchema),
  schedule: z.array(
    z.object({
      day: requiredTextSchema,
      text: requiredTextSchema,
    }),
  ),
});

const offerBaseRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  activity: z.enum(["surf", "snow", "combo"]),
  title: requiredTextSchema.max(120),
  subtitle: requiredTextSchema.max(280),
  short_description: requiredTextSchema.max(500),
  location: requiredTextSchema.max(120),
  start_date: dateSchema.nullable(),
  end_date: dateSchema.nullable(),
  duration_days: z.number().int().min(1).max(60),
  group_size_min: optionalGroupSizeSchema,
  group_size_max: optionalGroupSizeSchema,
  price_from: z.number().int().nonnegative(),
  currency: z.literal("PLN"),
  booking_url: bookingUrlSchema,
  hero_image: z.string().trim().min(1).nullable(),
  status: z.literal("published"),
});

export const offerListRowSchema = offerBaseRowSchema;
export const offerDetailRowSchema = offerBaseRowSchema.extend({
  description: offerContentSchema,
});

export const offerImageRowSchema = z.object({
  id: z.string().uuid(),
  offer_id: z.string().uuid(),
  storage_path: z.string().trim().min(1),
  alt_text: z.string().trim().min(5).max(180),
  position: z.number().int().nonnegative(),
});

export const publishedOfferSeoRowSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  updated_at: z.string().datetime({ offset: true }),
});

export type OfferListRow = z.infer<typeof offerListRowSchema>;
export type OfferDetailRow = z.infer<typeof offerDetailRowSchema>;
export type OfferImageRow = z.infer<typeof offerImageRowSchema>;
