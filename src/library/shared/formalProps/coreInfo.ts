import { z } from "zod";
import type { CoreInfoSectionProps } from "../../sections/CoreInfoSection.tsx";
import { backgroundColorSchema } from "./colors.ts";
import {
  addressSchema,
  emailsSchema,
  hoursTableSchema,
  textListSchema,
  headingTextSchema,
  phoneListSchema,
  slotSchema,
} from "./slots.ts";

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
