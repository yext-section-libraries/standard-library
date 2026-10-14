import { z } from "zod";
import { backgroundColorSchema, siteColorSchema } from "./colors.ts";
import { entityFieldSchema, translatableRichTextSchema } from "./data.ts";

export const bannerSectionSchema = z.object({
  data: z.object({ text: entityFieldSchema(translatableRichTextSchema) }),
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    textColor: siteColorSchema
      .optional()
      .describe("Omit to use the default theme text color. Set only when the user explicitly requests a text color override."),
    textAlignment: z.enum(["left", "right", "center"]),
  }),
  liveVisibility: z.boolean(),
});
