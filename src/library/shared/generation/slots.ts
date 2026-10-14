import { z } from "zod";
import { siteColorSchema } from "./colors.ts";
import {
  assetVideoSchema,
  translatableRichTextSchema,
  enhancedCtaSchema,
  entityFieldSchema,
  addressValueSchema,
  hoursValueSchema,
  imageSchema,
  translatableStringSchema,
} from "./data.ts";

const optionalSiteColorSchema = siteColorSchema
  .optional()
  .describe(
    "Omit this property to use the default theme color. Set it only when the user explicitly requests a color override."
  );
const headingLevelSchema = z
  .union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ])
  .describe("The h tag level");
export const heroVariantSchema = z
  .enum(["classic", "immersive", "spotlight", "compact"])
  .describe("The different options for hero rendering");

export const headingTextSchema = z.object({
  data: z
    .object({
      text: entityFieldSchema(translatableStringSchema),
    })
    .describe("The heading text or entity field."),
  styles: z.object({
    level: headingLevelSchema,
    align: z.enum(["left", "center", "right"]),
    color: optionalSiteColorSchema,
  }),
});

export const phoneListSchema = z.object({
  data: z.object({
    phoneNumbers: z
      .array(
        z.object({
          number: entityFieldSchema(z.string()).describe(
            "The entity phone field; never generate a phone number."
          ),
          label: translatableStringSchema,
        })
      )
      .describe(
        "Phone fields and their labels. Preserve existing constants; never invent a number."
      ),
  }),
  styles: z.object({
    phoneFormat: z
      .enum(["domestic", "international"])
      .describe("how to format the phone numbers"),
    includePhoneHyperlink: z
      .boolean()
      .describe("whether the phone numbers are hyperlinked"),
    includeIcon: z
      .boolean()
      .optional()
      .describe("whether to display a phone icon"),
    color: optionalSiteColorSchema.describe("Phone link and icon background color. Omit to use default theme colors; set only when the user explicitly requests a phone color override."),
    labelColor: siteColorSchema
      .optional()
      .describe("Omit to use the default theme text color. Set only when the user explicitly requests a phone label color override, and use a valid theme color."),
    iconColor: siteColorSchema
      .optional()
      .describe("Omit to use the default icon color. Set only when the user explicitly requests a phone icon color override, and use a valid theme color."),
  }),
});

export const hoursStatusSchema = z.object({
  data: z.object({
    hours: entityFieldSchema(hoursValueSchema),
  }),
  styles: z
    .object({
      showCurrentStatus: z.boolean().optional(),
      timeFormat: z.enum(["12h", "24h"]).optional(),
      dayOfWeekFormat: z.enum(["short", "long"]).optional(),
      showDayNames: z.boolean().optional(),
      className: z.string().optional(),
      bodyVariant: z.enum(["lg", "base", "sm"]).optional(),
      textColor: optionalSiteColorSchema,
    })
    .describe("The formatting for the hours status line"),
});

export const imageWrapperSchema = z.object({
  data: z.object({
    image: entityFieldSchema(imageSchema).describe(
      "The image content or entity field."
    ),
    link: translatableStringSchema.optional(),
  }),
  styles: z
    .object({
      aspectRatio: z.number().positive(),
      width: z.number().min(0).optional(),
      imageConstrain: z.enum(["fill", "fixed"]).optional(),
      imageFillType: z.enum(["fill", "fit"]).optional(),
    })
    .describe("Image size and aspect ratio."),
});
// Variant and layout classes are inherited from HeroSection.
export const heroImageSchema = imageWrapperSchema;

// Child contracts and allowed types come from the registered Puck components.
// These components render only the first child, so fixed slots contain exactly one.
export const slotSchema = (description?: string) =>
  z
    .array(z.unknown())
    .length(1)
    .describe(
      description ??
        "Exactly one child, including when its display control is disabled."
    );

export const addressSchema = z.object({
  data: z.object({
    address: entityFieldSchema(addressValueSchema),
  }),
  styles: z.object({
    showRegion: z.boolean().optional(),
    showCountry: z.boolean().optional(),
    showGetDirectionsLink: z.boolean(),
    ctaVariant: z.enum(["primary", "secondary", "link"]),
    color: optionalSiteColorSchema.describe("Get Directions link color or button background color. Omit to use the default theme color; set only when the user explicitly requests an override."),
    textColor: siteColorSchema.optional().describe("Omit to use the default text color. Set only when the user explicitly requests a Get Directions text color override, and use a valid theme color."),
    ctaTextColor: siteColorSchema.optional().describe(
      "Omit to use the default button text and icon colors. Set only when the user explicitly requests a Get Directions button text or icon color override, and use a valid theme color."
    ),
  }),
});

export const hoursTableSchema = z.object({
  data: z.object({
    hours: entityFieldSchema(hoursValueSchema),
  }),
  styles: z.object({
    startOfWeek: z
      .enum([
        "today",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
      .describe("First day displayed; today follows the current day."),
    collapseDays: z
      .boolean()
      .describe("Combine consecutive days with matching hours."),
    showAdditionalHoursText: z
      .boolean()
      .describe("Show the entity's additionalHoursText below the table."),
    alignment: z
      .enum(["items-start", "items-center"])
      .describe("Left or center alignment of the hours table."),
    textColor: optionalSiteColorSchema,
  }),
});

export const emailsSchema = z.object({
  data: z.object({
    list: entityFieldSchema(z.array(z.string())).describe(
      "Email addresses to display."
    ),
  }),
  styles: z
    .object({
      listLength: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe(
          "Maximum emails displayed from an entity field; defaults to 1."
        ),
      showIcon: z.boolean().optional(),
      color: optionalSiteColorSchema.describe(
        "Email link and icon background color. Omit to use the default theme colors; set only when the user explicitly requests an email color override."
      ),
      iconColor: optionalSiteColorSchema.describe(
        "Email icon glyph color. Omit to use the default icon color; set only when the user explicitly requests an icon color override."
      ),
    })
    .optional(),
});

export const textListSchema = z.object({
  list: entityFieldSchema(z.array(translatableStringSchema)).describe(
    "Text items, such as the entity's services."
  ),
  commaSeparated: z
    .boolean()
    .describe("Display items inline with commas instead of bullets."),
  styles: z.object({ textColor: optionalSiteColorSchema }).optional(),
});

export const bodyTextSchema = z.object({
  data: z.object({ text: entityFieldSchema(translatableRichTextSchema) }),
  styles: z.object({
    variant: z.enum(["xs", "sm", "base", "lg"]).nullable(),
    color: siteColorSchema
      .optional()
      .describe("Only use when specifically requested by the user"),
  }),
});

// An unset video is omitted when props are serialized as JSON.
export const videoSchema = z.object({
  data: z.object({ assetVideo: assetVideoSchema.optional() }),
});

export const headerLinksSchema = z.object({
  data: z.object({
    links: z
      .array(enhancedCtaSchema)
      .describe("Navigation links displayed inline while space permits."),
    collapsedLinks: z
      .array(enhancedCtaSchema)
      .describe("Navigation links displayed in the menu."),
  }),
  styles: z.object({
    align: z.enum(["left", "center", "right"]).optional(),
    variant: z.enum(["xs", "sm", "base", "lg"]).nullable().optional(),
    color: siteColorSchema
      .optional()
      .describe("Only use when specifically requested by the user"),
    weight: z.enum(["normal", "bold"]).optional(),
  }),
});
