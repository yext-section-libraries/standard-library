import { z } from "zod";
import { backgroundColorSchema, siteColorSchema } from "./colors.ts";
import { entityFieldSchema, imageSchema } from "./data.ts";
import { heroVariantSchema, slotSchema } from "./slots.ts";

const optionalSiteColorSchema = siteColorSchema.optional();

export const heroSectionSchema = z.object({
  data: z
    .object({ backgroundImage: entityFieldSchema(imageSchema) })
    .describe("The background image for immersive/spotlight"),
  styles: z.object({
    variant: heroVariantSchema.describe("The visual variant of the hero"),
    backgroundColor: backgroundColorSchema.optional(),
    imageHeight: z.number().min(0).optional(),
    desktopContainerPosition: z.enum(["left", "center"]).optional(),
    mobileContentAlignment: z.enum(["left", "center"]).optional(),
    desktopImagePosition: z.enum(["left", "right"]),
    mobileImagePosition: z.enum(["bottom", "top"]),
    showBusinessName: z.boolean(),
    showGeomodifier: z.boolean(),
    showPhone: z.boolean(),
    showHoursStatus: z.boolean(),
    showAverageReview: z.boolean(),
    reviewStarsColor: optionalSiteColorSchema.describe(
      "Omit to use the default review star color. Set only when the user explicitly requests a star color override."
    ),
    showPrimaryCTA: z.boolean(),
    showSecondaryCTA: z.boolean(),
    showImage: z.boolean(),
  }),
  slots: z.object({
    BusinessNameSlot: slotSchema(),
    GeomodifierSlot: slotSchema(),
    PhoneSlot: slotSchema(),
    HoursStatusSlot: slotSchema(),
    ImageSlot: slotSchema(),
    PrimaryCTASlot: slotSchema(),
    SecondaryCTASlot: slotSchema(),
  }),
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean().optional(),
});
