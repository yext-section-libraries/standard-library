import { z } from "zod";
import type { HeroSectionProps } from "../../sections/HeroSection.tsx";
import { backgroundColorSchema } from "./colors.ts";
import { entityFieldSchema, imageSchema } from "./data.ts";
import {
  ctaWrapperSchema,
  headingTextSchema,
  heroVariantSchema,
  phoneListSchema,
  hoursStatusSchema,
  heroImageSchema,
  slotSchema,
} from "./slots.ts";

const optionalSiteColorSchema = ctaWrapperSchema.shape.styles.shape.color;

export const heroSectionSchema = z.object({
  data: z
    .object({ backgroundImage: entityFieldSchema(imageSchema) })
    .describe("The background image for immersive/spotlight"),
  styles: z.object({
    variant: heroVariantSchema.describe("The visual variant of the hero"),
    backgroundColor: backgroundColorSchema.optional(),
    imageHeight: z.number().optional(),
    desktopContainerPosition: z.enum(["left", "center"]).optional(),
    mobileContentAlignment: z.enum(["left", "center"]).optional(),
    desktopImagePosition: z.enum(["left", "right"]),
    mobileImagePosition: z.enum(["bottom", "top"]),
    showBusinessName: z.boolean(),
    showGeomodifier: z.boolean(),
    showPhone: z.boolean(),
    showHoursStatus: z.boolean(),
    showAverageReview: z.boolean(),
    reviewStarsColor: optionalSiteColorSchema,
    showPrimaryCTA: z.boolean(),
    showSecondaryCTA: z.boolean(),
    showImage: z.boolean(),
  }),
  slots: z.object({
    BusinessNameSlot: slotSchema(
      "HeadingTextSlot",
      headingTextSchema,
      "Use the 'name' field unless otherwise specified."
    ),
    GeomodifierSlot: slotSchema(
      "HeadingTextSlot",
      headingTextSchema,
      "Use the 'geomodifier' field unless otherwise specified."
    ),
    PhoneSlot: slotSchema(
      "PhoneNumbersSlot",
      phoneListSchema,
      "Use the 'mainPhone' field unless otherwise specified."
    ),
    HoursStatusSlot: slotSchema(
      "HoursStatusSlot",
      hoursStatusSchema,
      "Use the 'hours' field unless otherwise specified."
    ),
    ImageSlot: slotSchema(
      "HeroImageSlot",
      heroImageSchema,
      "The image displayed in the classic/compact hero."
    ),
    PrimaryCTASlot: slotSchema(
      "CTASlot",
      ctaWrapperSchema,
      "If not specified, come up with content for this CTA."
    ),
    SecondaryCTASlot: slotSchema(
      "CTASlot",
      ctaWrapperSchema,
      "If not specified, come up with content for this CTA."
    ),
  }),
  conditionalRender: z
    .object({
      hours: z.boolean(),
      phone: z.boolean(),
    })
    .optional(),
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean().optional(),
}) satisfies z.ZodType<HeroSectionProps>;
