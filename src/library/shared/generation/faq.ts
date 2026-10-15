import { z } from "zod";
import { backgroundColorSchema, siteColorSchema } from "./colors.ts";
import { entityFieldSchema, translatableRichTextSchema } from "./data.ts";
import { slotSchema } from "./slots.ts";

const bodyVariantSchema = z.enum(["xs", "sm", "base", "lg"]).nullable();

export const faqCardSchema = z.object({
  data: z.object({
    question: entityFieldSchema(translatableRichTextSchema),
    answer: entityFieldSchema(translatableRichTextSchema),
  }),
  styles: z.object({
    questionVariant: bodyVariantSchema,
    answerVariant: bodyVariantSchema,
    answerColor: siteColorSchema
      .optional()
      .describe(
        "Omit to use the default theme color. Set only for an explicit answer color override."
      ),
  }),
  slots: z.object({}),
});

export const faqSectionSchema = z.object({
  data: z
    .object({
      field: z.string(),
      constantValueEnabled: z.boolean().optional(),
      mappings: z
        .object({
          question: entityFieldSchema(translatableRichTextSchema.optional()),
          answer: entityFieldSchema(translatableRichTextSchema.optional()),
        })
        .optional(),
    })
    .describe(
      "Bind an entity FAQ list with question/answer mappings, or enable constants and author FAQCard children in CardSlot. Card references are assigned automatically. Linked cards use library defaults."
    ),
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    showSectionHeading: z.boolean(),
  }),
  slots: z.object({
    HeadingSlot: slotSchema(),
    CardSlot: z
      .array(z.unknown())
      .describe(
        "Ordered FAQCard children for manual FAQs, or select the default cards. Leave empty or select defaults in linked mode."
      ),
  }),
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean(),
});
