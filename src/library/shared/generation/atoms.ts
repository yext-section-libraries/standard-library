import { z } from "zod";
import {
  backgroundColorSchema,
  optionalTextColorSchema,
  siteColorSchema,
} from "./colors.ts";
import {
  ctaTypeSchema,
  enhancedCtaSchema,
  entityFieldSchema,
  translatableStringSchema,
} from "./data.ts";
import { bodyTextSchema, phoneListSchema } from "./slots.ts";
import { staticMapSectionSchema } from "./staticMap.ts";

export const phoneSchema = z.object({
  data: z.object({
    number: entityFieldSchema(z.string()),
    label: translatableStringSchema,
  }),
  styles: phoneListSchema.shape.styles,
});
export const textSchema = bodyTextSchema.extend({
  styles: bodyTextSchema.shape.styles.extend({
    fontStyle: z.enum(["regular", "bold", "italic"]),
  }),
});
export const getDirectionsSchema = z.object({
  variant: z.enum(["primary", "secondary", "link"]),
  color: siteColorSchema.optional(),
  textColor: optionalTextColorSchema,
});
export const ctaGroupSchema = z.object({
  buttons: z
    .array(
      getDirectionsSchema.extend({
        entityField: entityFieldSchema(enhancedCtaSchema).extend({
          selectedType: ctaTypeSchema.optional(),
        }),
        normalizeLink: z.boolean(),
        presetImage: z
          .enum([
            "app-store",
            "google-play",
            "galaxy-store",
            "app-gallery",
            "deliveroo",
            "doordash",
            "grubhub",
            "skip-the-dishes",
            "postmates",
            "uber-eats",
            "ezcater",
          ])
          .optional(),
      })
    )
    .max(9),
});
export const mapboxStaticMapSchema = z.object({
  coordinate: entityFieldSchema(
    z.object({ latitude: z.number(), longitude: z.number() })
  ),
  mapStyle: staticMapSectionSchema.shape.styles.shape.mapStyle,
  height: z.string().optional(),
  zoom: z.number().optional(),
});
export const gridSchema = z.object({
  columns: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  slots: z
    .array(z.object({ Column: z.array(z.unknown()) }))
    .min(1)
    .max(6),
  backgroundColor: backgroundColorSchema.optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  className: z.string().optional(),
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean(),
});
export const timestampSchema = z.object({
  data: z.object({
    date: entityFieldSchema(z.string()),
    endDate: entityFieldSchema(z.string()),
  }),
  styles: z.object({
    includeTime: z.boolean(),
    includeRange: z.boolean(),
    textColor: optionalTextColorSchema,
  }),
});
