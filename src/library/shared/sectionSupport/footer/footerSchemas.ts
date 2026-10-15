import { z } from "zod";
import { siteColorSchema } from "../../generation/colors.ts";

export const alignmentSchema = z.enum(["left", "center", "right"]);

export const optionalSiteColorSchema = siteColorSchema
  .optional()
  .describe(
    "Omit to use the default theme color. Set only when the user explicitly requests a color override."
  );

export const imageStylesSchema = z.object({
  width: z.number().min(0).optional(),
  aspectRatio: z.number().positive().optional(),
  imageFillType: z.enum(["fill", "fit"]).optional(),
});
