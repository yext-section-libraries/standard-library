import { z } from "zod";
import { backgroundColorSchema, siteColorSchema } from "./colors.ts";
import {
  enhancedCtaSchema,
  entityFieldSchema,
  imageSchema,
  translatableStringSchema,
} from "./data.ts";
import { slotSchema, imageWrapperSchema } from "./slots.ts";

const galleryItemSchema = z.object({
  image: entityFieldSchema(imageSchema.optional()),
  link: entityFieldSchema(
    z.union([translatableStringSchema, enhancedCtaSchema]).optional()
  ),
});
// createItemSource stores authored items directly, unlike a slotted card source's
// managed references. Retain the authored items and mappings.
export const photoGalleryWrapperSchema = z.object({
  data: z.object({
    images: entityFieldSchema(z.array(galleryItemSchema)).extend({
      mappings: galleryItemSchema.optional(),
    }),
  }),
  styles: z.object({
    image: imageWrapperSchema.shape.styles.omit({ imageFillType: true }),
    imageFillType: z.enum(["fill", "fit"]).optional(),
    accentColor: siteColorSchema.optional(),
    carouselImageCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  }),
});
export const photoGallerySectionSchema = z.object({
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    variant: z.enum(["gallery", "carousel"]),
    showSectionHeading: z.boolean(),
  }),
  slots: z.object({
    HeadingSlot: slotSchema(),
    PhotoGalleryWrapper: slotSchema(),
  }),
  liveVisibility: z.boolean(),
});
