import { z } from "zod";
import {
  backgroundColorSchema,
  optionalTextColorSchema,
  siteColorSchema,
} from "./colors.ts";
import { entityFieldSchema, translatableStringSchema } from "./data.ts";
import { slotSchema, hoursStatusSchema, phoneListSchema } from "./slots.ts";
import { mappedCardsSectionSchema } from "./mappedCards.ts";

export const reviewsSectionSchema = mappedCardsSectionSchema.extend({
  styles: mappedCardsSectionSchema.shape.styles.extend({
    accentColor: siteColorSchema.optional(),
    textColor: optionalTextColorSchema,
  }),
  slots: z.object({ SectionHeadingSlot: slotSchema() }),
});
export const videoSectionSchema = z.object({
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({
    SectionHeadingSlot: slotSchema(),
    VideoSlot: slotSchema(),
  }),
  liveVisibility: z.boolean(),
});
const alignmentSchema = z.enum(["left", "center", "right"]);
export const professionalHeroSectionSchema = z.object({
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    showAverageReview: z.boolean(),
    reviewStarsColor: siteColorSchema.optional(),
    showImage: z.boolean(),
    desktopImagePosition: z.enum(["left", "right"]),
    mobileImagePosition: z.enum(["bottom", "top"]),
    showCredentials: z.boolean().optional(),
    showSubtitle: z.boolean().optional(),
    subtitleMobileAlignment: alignmentSchema,
    subtitleDesktopAlignment: alignmentSchema,
    showBusinessName: z.boolean().optional(),
    showProfessionalTitle: z.boolean().optional(),
    showAddress: z.boolean().optional(),
    showPrimaryCTA: z.boolean().optional(),
    showSecondaryCTA: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    showEmail: z.boolean().optional(),
  }),
  slots: z.object({
    ImageSlot: slotSchema(),
    BusinessNameSlot: slotSchema(),
    CredentialsSlot: slotSchema(),
    ProfessionalNameSlot: slotSchema(),
    ProfessionalTitleSlot: slotSchema(),
    SubtitleSlot: slotSchema(),
    AddressSlot: slotSchema(),
    PrimaryCTASlot: slotSchema(),
    SecondaryCTASlot: slotSchema(),
    PhoneSlot: slotSchema(),
    EmailSlot: slotSchema(),
  }),
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean().optional(),
});
export const nearbyLocationsSectionSchema = mappedCardsSectionSchema;
export const nearbyLocationCardsWrapperSchema = z.object({
  data: z.object({
    title: entityFieldSchema(translatableStringSchema).optional(),
    radius: z.number().min(0),
    limit: z.number().int().min(1).max(50),
  }),
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    headingLevel: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
      ])
      .optional(),
    color: siteColorSchema.optional(),
    textColor: optionalTextColorSchema,
    hours: hoursStatusSchema.shape.styles.pick({
      showCurrentStatus: true,
      timeFormat: true,
      dayOfWeekFormat: true,
      showDayNames: true,
    }),
    phone: z.object({
      phoneNumberFormat: phoneListSchema.shape.styles.shape.phoneFormat,
      phoneNumberLink: z.boolean(),
      color: siteColorSchema.optional(),
    }),
    address: z
      .object({ showRegion: z.boolean(), showCountry: z.boolean() })
      .optional(),
    showHours: z.boolean(),
    showPhone: z.boolean(),
    showAddress: z.boolean(),
  }),
});
