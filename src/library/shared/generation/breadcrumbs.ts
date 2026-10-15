import { z } from "zod";
import { backgroundColorSchema, siteColorSchema } from "./colors.ts";
import { entityFieldSchema, translatableStringSchema } from "./data.ts";

export const breadcrumbsSectionSchema = z.object({
  data: z.object({
    directoryRoot: translatableStringSchema,
    currentPage: entityFieldSchema(translatableStringSchema),
  }),
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    linkColor: siteColorSchema
      .optional()
      .describe(
        "Omit to use the default theme color. Set only when the user explicitly requests a link color override."
      ),
    showCurrentPage: z.boolean(),
  }),
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean(),
});
