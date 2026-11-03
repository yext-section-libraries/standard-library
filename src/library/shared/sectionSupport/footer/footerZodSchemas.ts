import { z } from "zod";

export const alignmentSchema = z.enum(["left", "center", "right"]);

export const imageStylesSchema = z.object({
  width: z.number().min(0).optional(),
  aspectRatio: z.number().positive().optional(),
  imageFillType: z.enum(["fill", "fit"]).optional(),
});
