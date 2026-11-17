import { z } from "zod";
import { locatorEntityTypeSchema } from "./LocatorResultCard.tsx";
import { getFacetFieldOptions } from "./Filters.tsx";

export const locatorFacetFieldsSchema = z
  .object({
    selections: z.array(
      z.object({
        value: z
          .enum(
            getFacetFieldOptions(locatorEntityTypeSchema.options)
              .map(({ value }) => value)
              .filter((value): value is string => typeof value === "string")
          )
          .optional(),
      })
    ),
  })
  .optional();
