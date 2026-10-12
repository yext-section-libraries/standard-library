import { z } from "zod";
import type {
  AssetImageType,
  EnhancedTranslatableCTA,
  TranslatableString,
} from "@yext/visual-editor";

export const translatableStringSchema = z
  .union([
    z.string(),
    z
      .object({
        hasLocalizedValue: z.literal("true").optional().describe("Always true"),
        defaultValue: z
          .string()
          .optional()
          .describe("Put the text content here"),
      })
      .catchall(z.string().optional()),
  ])
  .describe(
    "Static text or localized text with defaultValue and locale keys. Embedded fields supported via [[]] syntax."
  ) satisfies z.ZodType<TranslatableString>;

export function entityFieldSchema<T extends z.ZodType>(constantValue: T) {
  return z.object({
    field: z
      .string()
      .describe("Use this to render entity knowledge graph data"),
    constantValue: constantValue.describe(
      "Static value used when constantValueEnabled is true."
    ),
    constantValueEnabled: z
      .boolean()
      .optional()
      .describe(
        "When true constantValue is rendered, when false field is rendered."
      ),
  });
}

// Entity data stays authoritative; generated constants are empty placeholders.
export const entityReferenceSchema = z.strictObject({
  field: z.string().min(1).describe("The entity field to read."),
  constantValue: z.strictObject({}).describe("Must be an empty object."),
  constantValueEnabled: z
    .literal(false)
    .describe("Always false; use entity data."),
});

export const assetImageSchema = z.object({
  url: z.string().describe("The url of the image"),
  width: z.number().describe("The width of the image"),
  height: z.number().describe("The height of the image"),
  alternateText: translatableStringSchema
    .optional()
    .describe("The alt text to use for this image"),
}) satisfies z.ZodType<AssetImageType>;

export const imageSchema = z
  .union([assetImageSchema])
  .describe(
    "An image with url, width and height, a nested image object, or localized asset images keyed by locale."
  );

export const ctaTypeSchema = z
  .enum(["textAndLink", "getDirections", "presetImage"])
  .describe(
    "The type of the CTA. Generally use textAndLink. Use presetImage for app icons."
  );
export const enhancedCtaSchema = z.object({
  label: translatableStringSchema,
  link: translatableStringSchema,
  linkType: z
    .enum([
      "URL",
      "Email",
      "EMAIL",
      "Phone",
      "PHONE",
      "DRIVING_DIRECTIONS",
      "CLICK_TO_WEBSITE",
      "OTHER",
    ])
    .optional()
    .describe("The type of the link for analytics"),
  normalizeLink: z
    .boolean()
    .optional()
    .describe("Whether to standardize characters and casing"),
  openInNewTab: z.boolean().optional().describe("Whether to open in a new tab"),
  ctaType: ctaTypeSchema.optional(),
}) satisfies z.ZodType<EnhancedTranslatableCTA>;
