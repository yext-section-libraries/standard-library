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
  mappings: Record<string, z.ZodObject>,
  styles: z.ZodRawShape
) {
  return z.object({
    // The editor requires an object with string/boolean binding fields here.
    // Narrow individual mappings so generated static content must use CardSlot.
    data: z
      .object({
        field: z.string(),
        constantValueEnabled: z.boolean(),
        mappings: z
          .object(
            Object.fromEntries(
              Object.entries(mappings).map(([name, mapping]) => [
                name,
                z.strictObject({
                  field: mapping.shape.field,
                  constantValueEnabled: z.literal(false),
                }),
              ])
            )
          )
          .optional()
          .describe(
            "Entity field bindings for linked cards only. Static card content belongs in slots.CardSlot child components."
          ),
      })
      .describe(
        "For manual cards, use field: empty string and constantValueEnabled: true, omit mappings, and author content in slots.CardSlot. For entity-linked cards, use a nonempty source field and constantValueEnabled: false."
      ),
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
