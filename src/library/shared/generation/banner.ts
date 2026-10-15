import { z } from "zod";
import { backgroundColorSchema, optionalTextColorSchema } from "./colors.ts";
import { entityFieldSchema, translatableRichTextSchema } from "./data.ts";

export const bannerSectionSchema = z.object({
  data: z.object({ text: entityFieldSchema(translatableRichTextSchema) }),
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    textColor: optionalTextColorSchema,
    textAlignment: z.enum(["left", "right", "center"]),
  }),
  liveVisibility: z.boolean(),
});
