import { z } from "zod";
import type {
  AssetImageType,
  TranslatableRichText,
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

export const assetImageSchema = z.object({
  url: z.string().describe("The url of the image"),
  width: z.number().min(0).describe("The width of the image"),
  height: z.number().min(0).describe("The height of the image"),
  alternateText: translatableStringSchema
    .optional()
    .describe("The alt text to use for this image"),
}) satisfies z.ZodType<AssetImageType>;

export const imageSchema = z
  .union([
    assetImageSchema,
    z.object({ image: assetImageSchema }),
    // The strict compiler supports the canonical image fallback as an ordinary
    // object. Locale-specific assets remain unexposed serializable configuration
    // and are preserved by materialization rather than replaced or flattened.
    z.object({
      hasLocalizedValue: z.literal("true").optional(),
      defaultValue: assetImageSchema.optional(),
    }),
  ])
  .describe(
    "An image with url, width and height, a nested image object, or a localized image fallback in defaultValue. Alternate text can be localized. Existing locale-specific asset overrides are preserved."
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

const richTextSchema = z.strictObject({
  // The runtime recognizes rich text by its HTML property; JSON alone cannot render.
  html: z.string().describe("HTML markup used to render the rich text."),
  json: z
    .string()
    .optional()
    .describe(
      "Optional serialized Lexical editor state. Never put plain text here."
    ),
});
export const translatableRichTextSchema = z
  .union([
    z.string(),
    z
      .object({
        hasLocalizedValue: z.literal("true").optional(),
        defaultValue: z.union([z.string(), richTextSchema]).optional(),
      })
      .catchall(z.union([z.string(), richTextSchema]).optional()),
    richTextSchema,
  ])
  .describe(
    "Rich text as a plain string, an object with required html and optional Lexical json, or localized values keyed by locale. Use a plain string for unformatted text. JSON-only objects are not renderable."
  ) satisfies z.ZodType<TranslatableRichText>;
