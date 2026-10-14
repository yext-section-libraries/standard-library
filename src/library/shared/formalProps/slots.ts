import { z } from "zod";
import type { HeadingTextProps } from "../../sections/HeadingText.tsx";
import type { HoursStatusProps } from "../../sections/HoursStatus.tsx";
import type { ImageWrapperProps } from "../../sections/ImageWrapper.tsx";
import type { CTAWrapperProps } from "../../sections/CTAWrapper.tsx";
import type { PhoneListProps } from "../sectionSupport/contentBlocks/PhoneList.tsx";
import type { HeroImageProps } from "../sectionSupport/contentBlocks/image/HeroImage.tsx";
import type { AddressProps } from "../../sections/Address.tsx";
import type { HoursTableProps } from "../../sections/HoursTable.tsx";
import type { EmailsProps } from "../../sections/Emails.tsx";
import type { TextListProps } from "../../sections/TextList.tsx";
import type { BodyTextProps } from "../../sections/BodyText.tsx";
import type { HeaderLinksProps } from "../sectionSupport/header/HeaderLinks.tsx";
import { siteColorSchema } from "./colors.ts";
import {
  assetVideoSchema,
  translatableRichTextSchema,
  ctaTypeSchema,
  enhancedCtaSchema,
  entityFieldSchema,
  entityReferenceSchema,
  imageSchema,
  translatableStringSchema,
} from "./data.ts";

const optionalSiteColorSchema = siteColorSchema
  .optional()
  .describe("Only use when specifically requested by the user");
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
    .describe("The heading text of the hero"),
  styles: z.object({
    level: headingLevelSchema,
    align: z.enum(["left", "center", "right"]),
    semanticLevelOverride: z
      .union([headingLevelSchema, z.literal("span")])
      .optional(),
    color: optionalSiteColorSchema,
  }),
  parentData: z
    .object({
      field: z.string(),
      text: z.string().optional(),
    })
    .optional()
    .describe(
      "Parent-supplied resolved heading content. Do not generate parentData; use data.text for entity bindings or authored constants. Parent sections supply inherited content."
    ),
}) satisfies z.ZodType<HeadingTextProps>;

export const phoneListSchema = z.object({
  data: z.object({
    phoneNumbers: z
      .array(
        z.object({
          number: entityReferenceSchema
            .extend({
              constantValue: z.literal("").describe("Must be an empty string."),
            })
            .describe("The entity phone field; never generate a phone number."),
          label: translatableStringSchema,
        })
      )
      .describe("A list of phone numbers to display in the hero"),
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
    color: optionalSiteColorSchema,
    labelColor: optionalSiteColorSchema,
    iconColor: optionalSiteColorSchema,
  }),
  parentData: z
    .object({
      field: z.string(),
      phoneNumbers: z.array(
        z.object({
          label: z.string(),
          number: z.string(),
        })
      ),
    })
    .optional(),
}) satisfies z.ZodType<PhoneListProps>;

export const hoursStatusSchema = z.object({
  data: z.object({
    hours: entityReferenceSchema.describe("Always use the 'hours' field"),
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
  parentData: z
    .object({
      field: z.string(),
      hours: z.object().optional(),
      comingSoon: z.boolean().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
}) satisfies z.ZodType<HoursStatusProps>;

// Undefined values are omitted when props are serialized as JSON.
type ImageSchemaProps = Omit<ImageWrapperProps, "parentData"> & {
  parentData?: {
    field: string;
    image?: NonNullable<ImageWrapperProps["parentData"]>["image"];
  };
};

export const imageWrapperSchema = z.object({
  data: z.object({
    image: entityFieldSchema(imageSchema).describe(
      "The image used for classic/compact variants"
    ),
    link: translatableStringSchema.optional(),
  }),
  styles: z
    .object({
      aspectRatio: z.number(),
      width: z.number().optional(),
      imageConstrain: z.enum(["fill", "fixed"]).optional(),
      imageFillType: z.enum(["fill", "fit"]).optional(),
    })
    .describe("Classic/compact image styling"),
  parentData: z
    .object({ field: z.string(), image: imageSchema.optional() })
    .optional(),
  className: z.string().optional(),
  sizes: z
    .object({
      base: z.string(),
      sm: z.string().optional(),
      md: z.string().optional(),
      lg: z.string().optional(),
      xl: z.string().optional(),
      "2xl": z.string().optional(),
    })
    .optional(),
  hideWidthProp: z.boolean().optional(),
  showImageConstrain: z.boolean().optional(),
}) satisfies z.ZodType<ImageSchemaProps>;
export const heroImageSchema = imageWrapperSchema
  .extend({
    variant: heroVariantSchema.optional(),
  })
  .describe("The immersive/spotlight image") satisfies z.ZodType<
  ImageSchemaProps & Pick<HeroImageProps, "variant">
>;

// classNameFn is supplied by the parent at runtime and cannot be represented in JSON.
type CtaSchemaProps = Omit<CTAWrapperProps, "parentStyles" | "styles"> & {
  styles: Omit<CTAWrapperProps["styles"], "variant"> & {
    variant?: CTAWrapperProps["styles"]["variant"];
  };
  parentStyles?: Omit<
    NonNullable<CTAWrapperProps["parentStyles"]>,
    "classNameFn"
  >;
};
export const ctaWrapperSchema = z.object({
  data: z.object({
    show: z.boolean().optional().describe("Whether to render this CTA"),
    actionType: z.enum(["link", "button"]).optional().describe("Use link"),
    normalizeLink: z
      .boolean()
      .describe("Whether to standardize casing and encoding"),
    entityField: entityFieldSchema(enhancedCtaSchema)
      .extend({
        selectedType: ctaTypeSchema.optional(),
      })
      .describe("A call to action to include in the hero"),
    buttonText: translatableStringSchema.optional(),
    customId: z.string().optional(),
    customClass: z.string().optional(),
    dataAttributes: z
      .array(
        z.object({
          key: z.string(),
          value: z.string(),
        })
      )
      .optional(),
    ariaLabel: translatableStringSchema.optional(),
  }),
  styles: z.object({
    variant: z
      .enum(["primary", "secondary", "link"])
      .describe("The visual style of the CTA"),
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
      .optional()
      .describe("Use with presetImage type"),
    color: optionalSiteColorSchema,
    textColor: optionalSiteColorSchema,
  }),
  className: z.string().optional(),
  parentData: z
    .object({
      field: z.string(),
      cta: enhancedCtaSchema,
    })
    .optional(),
  parentStyles: z
    .object({})
    .optional()
    .describe("Parent styling callbacks are supplied at runtime."),
  eventName: z.string().optional(),
}) satisfies z.ZodType<CtaSchemaProps>;

// Slots store component data, rather than the slot functions supplied during rendering.
export function slotSchema<TType extends string, TShape extends z.ZodRawShape>(
  type: TType,
  props: z.ZodObject<TShape>,
  description?: string
) {
  return z
    .array(
      z.object({
        type: z.literal(type),
        props: props.extend({ id: z.string().optional() }),
        readOnly: z.record(z.string(), z.boolean().optional()).optional(),
      })
    )
    .min(1)
    .describe(
      `${description ? `${description} ` : ""}Serialized ${type} components. Every slot must contain at least one component with valid props, even when hidden, not visible, or its bound entity field has no data. Keep the slot populated and use the section or component visibility settings to hide it; never omit the slot or use an empty array.`
    );
}

type AddressSchemaProps = Omit<AddressProps, "data" | "parentData"> & {
  data: {
    address: Omit<AddressProps["data"]["address"], "constantValue"> & {
      constantValue: Record<string, never>;
    };
  };
  parentData?: Pick<NonNullable<AddressProps["parentData"]>, "field">;
};

export const addressSchema = z.object({
  data: z.object({
    address: entityReferenceSchema.describe("The entity address field."),
  }),
  styles: z.object({
    showRegion: z.boolean().optional(),
    showCountry: z.boolean().optional(),
    showGetDirectionsLink: z.boolean(),
    ctaVariant: ctaWrapperSchema.shape.styles.shape.variant,
    color: optionalSiteColorSchema.describe(
      "Get Directions link or button color."
    ),
    textColor: optionalSiteColorSchema,
    ctaTextColor: optionalSiteColorSchema.describe(
      "Text and icon color for a primary Get Directions button."
    ),
  }),
  parentData: z.object({ field: z.string() }).optional(),
}) satisfies z.ZodType<AddressSchemaProps>;

type HoursTableSchemaProps = Omit<HoursTableProps, "data"> & {
  data: {
    hours: Omit<HoursTableProps["data"]["hours"], "constantValue"> & {
      constantValue: Record<string, never>;
    };
  };
};

export const hoursTableSchema = z.object({
  data: z.object({
    hours: entityReferenceSchema.describe("The entity hours field."),
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
}) satisfies z.ZodType<HoursTableSchemaProps>;

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
        .optional()
        .describe(
          "Maximum emails displayed from an entity field; defaults to 1."
        ),
      showIcon: z.boolean().optional(),
      color: optionalSiteColorSchema.describe(
        "Email link and icon background color."
      ),
      iconColor: optionalSiteColorSchema,
    })
    .optional(),
  eventName: z
    .string()
    .optional()
    .describe("Click analytics event name prefix."),
  parentData: z
    .object({
      field: z.string(),
      list: z
        .array(z.string())
        .describe("Email addresses supplied by the parent."),
    })
    .optional(),
}) satisfies z.ZodType<EmailsProps>;

export const textListSchema = z.object({
  list: entityFieldSchema(z.array(translatableStringSchema)).describe(
    "Text items, such as the entity's services."
  ),
  commaSeparated: z
    .boolean()
    .describe("Display items inline with commas instead of bullets."),
  styles: z.object({ textColor: optionalSiteColorSchema }).optional(),
}) satisfies z.ZodType<TextListProps>;

// Undefined parent content is omitted when props are serialized as JSON.
type BodyTextSchemaProps = Omit<BodyTextProps, "parentData"> & {
  parentData?: {
    field: string;
    richText?: NonNullable<BodyTextProps["parentData"]>["richText"];
  };
};

export const bodyTextSchema = z.object({
  data: z.object({ text: entityFieldSchema(translatableRichTextSchema) }),
  styles: z.object({
    variant: z.enum(["xs", "sm", "base", "lg"]).nullable(),
    color: siteColorSchema
      .optional()
      .describe("Only use when specifically requested by the user"),
  }),
  parentData: z
    .object({
      field: z.string(),
      richText: translatableRichTextSchema.optional(),
    })
    .optional()
    .describe(
      "Resolved content supplied by the parent; author data.text instead."
    ),
  parentStyles: z.object({ className: z.string() }).optional(),
}) satisfies z.ZodType<BodyTextSchemaProps>;

// An unset video is omitted when props are serialized as JSON.
export const videoSchema = z.object({
  data: z.object({ assetVideo: assetVideoSchema.optional() }),
  className: z.string().optional(),
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
  parentData: z.object({ type: z.enum(["Primary", "Secondary"]) }).optional(),
}) satisfies z.ZodType<HeaderLinksProps>;
