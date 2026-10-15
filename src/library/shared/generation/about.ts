import { z } from "zod";
import { backgroundColorSchema, siteColorSchema } from "./colors.ts";
import { entityFieldSchema, translatableStringSchema } from "./data.ts";
import { footerSocialLinksSchema } from "./footer.ts";
import {
  addressSchema,
  emailsSchema,
  hoursStatusSchema,
  hoursTableSchema,
  phoneListSchema,
  slotSchema,
  textListSchema,
} from "./slots.ts";

const phoneSchema = z.object({
  data: phoneListSchema.shape.data.shape.phoneNumbers.element,
  styles: phoneListSchema.shape.styles,
});

export const aboutSectionDetailsColumnSchema = z.object({
  sections: z.array(
    z.object({
      header: entityFieldSchema(translatableStringSchema),
      content: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("hoursStatus"),
          hoursStatus: hoursStatusSchema,
        }),
        z.object({
          type: z.literal("hoursTable"),
          hoursTable: hoursTableSchema,
        }),
        z.object({ type: z.literal("address"), address: addressSchema }),
        z.object({ type: z.literal("phone"), phone: phoneSchema }),
        z.object({ type: z.literal("emails"), emails: emailsSchema }),
        z.object({ type: z.literal("textList"), textList: textListSchema }),
        z.object({
          type: z.literal("socialMedia"),
          socialMedia: footerSocialLinksSchema,
        }),
      ]),
    })
  ),
});

export const aboutSectionSchema = z.object({
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    readMoreButtonColor: siteColorSchema
      .optional()
      .describe(
        "Omit to use the default theme color. Set only when the user explicitly requests a read more button color override."
      ),
    showDetailsColumn: z.boolean(),
  }),
  slots: z.object({
    SectionHeadingSlot: slotSchema(),
    DescriptionSlot: slotSchema(),
    SidebarSlot: slotSchema(),
  }),
  liveVisibility: z.boolean(),
});
