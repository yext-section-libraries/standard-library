import { z } from "zod";
import {
  backgroundColorSchema,
  siteColorSchema,
} from "../../generation/colors.ts";
import {
  entityFieldSchema,
  translatableStringSchema,
} from "../../generation/data.ts";
import { slotSchema } from "../../generation/slots.ts";

const linkOverrideSchema = entityFieldSchema(translatableStringSchema).extend({
  enabled: z.boolean(),
  normalizeLink: z.boolean(),
});

export const directorySchema = z.object({
  styles: z.object({
    backgroundColor: backgroundColorSchema,
    listBackgroundColor: backgroundColorSchema,
    linkColor: siteColorSchema.optional(),
  }),
  slots: z.object({
    TitleSlot: slotSchema(),
    SiteNameSlot: slotSchema(),
    BreadcrumbsSlot: slotSchema(),
    DirectoryGrid: slotSchema(),
  }),
  analytics: z.object({ scope: z.string().optional() }),
});

export const directoryGridSchema = z.object({
  data: z
    .object({
      field: z.literal("dm_directoryChildren"),
      constantValueEnabled: z.literal(false),
      mappings: z
        .object({
          cardTitle: entityFieldSchema(translatableStringSchema.optional()),
          linkOverride: linkOverrideSchema.optional(),
          showAddress: z.boolean().optional(),
          showHoursStatus: z.boolean().optional(),
          showPhoneNumber: z.boolean().optional(),
        })
        .optional(),
    })
    .optional()
    .describe(
      "Directory children only; omitted bindings use dm_directoryChildren. Manual cards are unsupported."
    ),
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({
    CardSlot: z
      .array(z.unknown())
      .describe(
        "DirectoryCard children; membership and order follow sorted directory children."
      ),
  }),
});

export const directoryCardSchema = z.object({
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({
    HeadingSlot: slotSchema(),
    AddressSlot: slotSchema(),
    PhoneSlot: slotSchema(),
    HoursSlot: slotSchema(),
  }),
});
