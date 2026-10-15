import { z } from "zod";
import {
  backgroundColorSchema,
  optionalTextColorSchema,
  siteColorSchema,
} from "./colors.ts";
import {
  entityFieldSchema,
  translatableStringSchema,
  translatableRichTextSchema,
} from "./data.ts";

export const formSectionSchema = z.object({
  data: z.object({
    heading: entityFieldSchema(translatableStringSchema),
    description: entityFieldSchema(translatableRichTextSchema),
    phoneOptInText: entityFieldSchema(translatableRichTextSchema),
    submitLabel: entityFieldSchema(translatableStringSchema),
    formType: z.enum(["HS_CONTACT", "HS_EVENT"]),
    showPreferredContactMethod: z.boolean(),
    defaultContactMethod: z.enum(["PHONE", "EMAIL"]),
    fields: z
      .array(
        z.object({
          type: z.enum([
            "preferredContactMethod",
            "firstName",
            "lastName",
            "phone",
            "email",
            "message",
            "phoneOptIn",
            "text",
            "dropdown",
            "checkboxGroup",
          ]),
          label: translatableStringSchema,
          key: z.string().optional(),
          required: z.boolean().optional(),
          options: z
            .array(
              z.object({ label: translatableStringSchema, value: z.string() })
            )
            .optional(),
        })
      )
      .describe(
        "Keep firstName, lastName and the selected contact fields. Dropdown and checkbox groups need nonempty options; custom fields need unique keys."
      ),
  }),
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    textColor: optionalTextColorSchema,
    preferredContactMethodTextColor: optionalTextColorSchema,
  }),
  ctaStyles: z.object({
    buttonVariant: z.enum(["primary", "secondary", "link"]),
    color: siteColorSchema.optional(),
    labelColor: siteColorSchema.optional(),
  }),
  liveVisibility: z.boolean(),
});
