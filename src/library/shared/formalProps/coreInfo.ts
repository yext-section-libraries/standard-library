import { z } from "zod";
import type { CoreInfoSectionProps } from "../../sections/CoreInfoSection.tsx";
import type { AddressProps } from "../../sections/Address.tsx";
import type { HoursTableProps } from "../../sections/HoursTable.tsx";
import type { EmailsProps } from "../../sections/Emails.tsx";
import type { TextListProps } from "../../sections/TextList.tsx";
import { backgroundColorSchema } from "./colors.ts";
import {
  entityFieldSchema,
  entityReferenceSchema,
  translatableStringSchema,
} from "./data.ts";
import {
  ctaWrapperSchema,
  headingTextSchema,
  phoneListSchema,
  slotSchema,
} from "./hero.ts";

const optionalSiteColorSchema = ctaWrapperSchema.shape.styles.shape.color;

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

const coreInfoHeadingPropsSchema = headingTextSchema.extend({
  data: headingTextSchema.shape.data.describe("The column heading text."),
});
const coreInfoPhonePropsSchema = phoneListSchema.extend({
  data: phoneListSchema.shape.data.extend({
    phoneNumbers: phoneListSchema.shape.data.shape.phoneNumbers.describe(
      "Phone numbers to display."
    ),
  }),
});

export const coreInfoSectionSchema = z.object({
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({
    CoreInfoHeadingSlot: slotSchema(
      "HeadingTextSlot",
      coreInfoHeadingPropsSchema
    ),
    CoreInfoAddressSlot: slotSchema(
      "AddressSlot",
      addressSchema,
      "Use the 'address' field."
    ),
    CoreInfoPhoneNumbersSlot: slotSchema(
      "PhoneNumbersSlot",
      coreInfoPhonePropsSchema,
      "Use the 'mainPhone' field unless otherwise directed."
    ),
    CoreInfoEmailsSlot: slotSchema(
      "EmailsSlot",
      emailsSchema,
      "Use the 'emails' field unless otherwise directed."
    ),
    HoursHeadingSlot: slotSchema("HeadingTextSlot", coreInfoHeadingPropsSchema),
    HoursTableSlot: slotSchema(
      "HoursTableSlot",
      hoursTableSchema,
      "Use the 'hours' field unless otherwise directed."
    ),
    ServicesHeadingSlot: slotSchema(
      "HeadingTextSlot",
      coreInfoHeadingPropsSchema
    ),
    TextListSlot: slotSchema(
      "TextListSlot",
      textListSchema,
      "Use the 'services' field unless otherwise directed."
    ),
  }),
  conditionalRender: z
    .object({
      coreInfoCol: z.boolean().optional(),
      hoursCol: z.boolean().optional(),
      servicesCol: z.boolean().optional(),
    })
    .optional()
    .describe("Column visibility resolved from entity content."),
  analytics: z.object({
    scope: z.string().optional().describe("Analytics scope for this section."),
  }),
  liveVisibility: z.boolean(),
}) satisfies z.ZodType<CoreInfoSectionProps>;
