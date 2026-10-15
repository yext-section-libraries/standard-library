import { siteColorSchema } from "../../generation/colors.ts";

export const optionalSiteColorSchema = siteColorSchema
  .optional()
  .describe(
    "Omit this property to use the default theme color. Set it only when the user explicitly requests a color override."
  );
