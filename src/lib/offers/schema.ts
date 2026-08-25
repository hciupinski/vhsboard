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

export const dayCampContentSchema = z.object({
  paragraphs: z.array(requiredTextSchema).min(1),
  highlights: z.array(requiredTextSchema).min(1),
  included: z.array(requiredTextSchema).min(1),
  excluded: z.array(requiredTextSchema).min(1),
  dayProgram: z
    .array(z.object({ time: z.string().regex(/^\d{2}:\d{2}$/), text: requiredTextSchema }))
    .min(1),
  activityPlan: z.array(z.object({ title: requiredTextSchema, text: requiredTextSchema })).min(1),
  venueDescription: requiredTextSchema,
  parentInfo: z.object({
    ageRange: requiredTextSchema,
    supervision: requiredTextSchema,
    safety: requiredTextSchema,
    transport: requiredTextSchema.optional(),
    meals: requiredTextSchema.optional(),
  }),
  terms: z
    .array(
      z
        .object({
          label: requiredTextSchema,
          startDate: dateSchema,
          endDate: dateSchema,
          priceOptions: z
            .array(
              z.object({
                label: requiredTextSchema,
                price: z.number().int().positive(),
                bookingUrl: bookingUrlSchema,
              }),
            )
            .min(1),
        })
        .superRefine((term, ctx) => {
          if (term.endDate < term.startDate)
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["endDate"],
              message: "Termin jest odwrócony.",
            });
        }),
    )
    .min(1)
    .max(2),
});

const offerBaseRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  offer_kind: z.enum(["trip", "day_camp"]).default("trip"),
  activity: z.enum(["surf", "snow", "combo", "wake"]),
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
export const offerDetailRowSchema = offerBaseRowSchema
  .extend({ description: z.union([offerContentSchema, dayCampContentSchema]) })
  .superRefine((offer, ctx) => {
    const isTrip =
      offer.offer_kind === "trip" && ["surf", "snow", "combo"].includes(offer.activity);
    const isDayCamp = offer.offer_kind === "day_camp" && ["wake", "snow"].includes(offer.activity);
    const contentMatches =
      offer.offer_kind === "trip"
        ? offerContentSchema.safeParse(offer.description).success
        : dayCampContentSchema.safeParse(offer.description).success;
    if (!isTrip && !isDayCamp)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activity"],
        message: "Aktywność nie pasuje do rodzaju oferty.",
      });
    if (!contentMatches)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "Treść nie pasuje do rodzaju oferty.",
      });
    if (
      offer.offer_kind === "day_camp" &&
      (offer.group_size_min !== null || offer.group_size_max !== null)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["group_size_max"],
        message: "Półkolonia nie może mieć limitu grupy.",
      });
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
  offer_kind: z.enum(["trip", "day_camp"]).default("trip"),
});

export type OfferListRow = z.infer<typeof offerListRowSchema>;
export type OfferDetailRow = z.infer<typeof offerDetailRowSchema>;
export type OfferImageRow = z.infer<typeof offerImageRowSchema>;
