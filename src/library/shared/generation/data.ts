import { z } from "zod";
import type {
  AssetImageType,
  AssetVideo,
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

// Match native authored values, including the empty configuration used by defaults.
// Entity fields remain the source of business facts unless the user supplies constants.
export const addressValueSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  line3: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().optional(),
  extraDescription: z.string().optional(),
  sublocality: z.string().optional(),
  localizedRegionName: z.string().optional(),
  localizedCountryName: z.string().optional(),
});
const hoursDaySchema = z.object({
  isClosed: z.boolean().optional(),
  openIntervals: z
    .array(z.object({ start: z.string(), end: z.string() }))
    .optional(),
});
export const hoursValueSchema = z.object({
  monday: hoursDaySchema.optional(),
  tuesday: hoursDaySchema.optional(),
  wednesday: hoursDaySchema.optional(),
  thursday: hoursDaySchema.optional(),
  friday: hoursDaySchema.optional(),
  saturday: hoursDaySchema.optional(),
  sunday: hoursDaySchema.optional(),
  holidayHours: z
    .array(
      hoursDaySchema.extend({
        date: z.string(),
        isRegularHours: z.boolean().optional(),
      })
    )
    .optional(),
  reopenDate: z.string().optional(),
});

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
  html: z.string().optional(),
  json: z.string().optional(),
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
    "Rich text as a string, an HTML/JSON object, or localized values keyed by locale."
  ) satisfies z.ZodType<TranslatableRichText>;

export const assetVideoSchema = z.object({
  video: z.object({
    url: z.string(),
    id: z.string(),
    title: z.string(),
    thumbnail: z.string(),
    duration: z.string(),
    embeddedUrl: z.string().describe("The YouTube embed URL."),
  }),
  videoDescription: z.string().optional(),
  name: z.string(),
  id: z.string(),
}) satisfies z.ZodType<AssetVideo>;
