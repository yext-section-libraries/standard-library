import { z } from "zod";
import { backgroundColorSchema } from "../../generation/colors.ts";
import { slotSchema } from "../../generation/slots.ts";
import {
  entityFieldSchema,
  imageSchema,
  translatableStringSchema,
  translatableRichTextSchema,
  enhancedCtaSchema,
} from "../../generation/data.ts";

export const sectionStyles = z.object({
  backgroundColor: backgroundColorSchema.optional(),
  showSectionHeading: z.boolean(),
});

const sectionSlots = z.object({
  SectionHeadingSlot: slotSchema(),
  CardsWrapperSlot: slotSchema(),
});

export const mappedCardsSectionSchema = z.object({
  styles: sectionStyles,
  slots: sectionSlots,
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean(),
});

// Slotted sources own card references and the manual mirror. Only bindings and
// mappings are authored here; native CardSlot children supply manual content.
export function cardsWrapperSchema(
  mappings: z.ZodRawShape,
  styles: z.ZodRawShape
) {
  return z.object({
    data: z.object({
      field: z.string(),
      constantValueEnabled: z.boolean().optional(),
      mappings: z.object(mappings).optional(),
    }),
    styles: z.object(styles),
    slots: z.object({
      CardSlot: z
        .array(z.unknown())
        .describe(
          "Ordered manual card children. An explicit [] means zero cards; $default selects library defaults. In linked mode, author the source binding and mappings and leave CardSlot empty or select $default."
        ),
    }),
  });
}

export const imageMapping = entityFieldSchema(imageSchema.optional());

export const textMapping = entityFieldSchema(
  translatableStringSchema.optional()
);

export const richTextMapping = entityFieldSchema(
  translatableRichTextSchema.optional()
);

export const dateMapping = entityFieldSchema(z.string().optional());

export const ctaMapping = entityFieldSchema(enhancedCtaSchema.optional());

// Fixed card slots keep one child even when their display controls are disabled.
export const cardStyles = z.object({
  backgroundColor: backgroundColorSchema.optional(),
});
