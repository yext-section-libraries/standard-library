import { z } from "zod";
import { backgroundColorSchema } from "./colors.ts";
import {
  assetVideoSchema,
  enhancedCtaSchema,
  entityFieldSchema,
  imageSchema,
  translatableStringSchema,
  translatableRichTextSchema,
} from "./data.ts";
import { slotSchema } from "./slots.ts";

export const promoSectionSchema = z.object({
  data: z.object({
    promo: entityFieldSchema(
      z.object({
        title: translatableStringSchema.optional(),
        description: translatableRichTextSchema.optional(),
        image: z.union([imageSchema, assetVideoSchema]).optional(),
        cta: enhancedCtaSchema.optional(),
      })
    ).describe(
      "Bind a promotional entity field, or enable constant values and author the content in the slots. An empty constantValue object is supported."
    ),
    media: z.enum(["image", "video"]),
    backgroundImage: entityFieldSchema(imageSchema).describe(
      "Background image for immersive and spotlight variants."
    ),
  }),
  styles: z.object({
    variant: z.enum(["classic", "immersive", "spotlight", "compact"]),
    backgroundColor: backgroundColorSchema.optional(),
    desktopImagePosition: z.enum(["left", "right"]),
    mobileImagePosition: z.enum(["top", "bottom"]),
    containerAlignment: z.enum(["left", "center", "right"]),
    imageHeight: z.number().min(0),
    showMedia: z.boolean(),
    showHeading: z.boolean(),
    showDescription: z.boolean(),
    showCTA: z.boolean(),
  }),
  slots: z.object({
    HeadingSlot: slotSchema(),
    DescriptionSlot: slotSchema(),
    VideoSlot: slotSchema(),
    ImageSlot: slotSchema(),
    CTASlot: slotSchema(),
  }),
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean().optional(),
});
