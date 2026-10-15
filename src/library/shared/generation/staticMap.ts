import { z } from "zod";
import { backgroundColorSchema } from "./colors.ts";

export const staticMapSectionSchema = z.object({
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    mapStyle: z.enum([
      "streets-v12",
      "satellite-streets-v12",
      "light-v11",
      "dark-v11",
      "navigation-day-v1",
      "navigation-night-v1",
    ]),
  }),
  liveVisibility: z.boolean(),
});
