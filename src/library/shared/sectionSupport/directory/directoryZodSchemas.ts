import { z } from "zod";
import {
  entityFieldZodSchema,
  translatableStringZodSchema,
} from "@yext/visual-editor/section-library-support";
export const linkOverrideSchema = entityFieldZodSchema(
  translatableStringZodSchema
).extend({
  enabled: z.boolean(),
  normalizeLink: z.boolean(),
});
