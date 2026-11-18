import { z } from "zod";
import {
  inferFieldZodSchema,
  LOCATOR_ENTITY_TYPES,
} from "@yext/visual-editor/section-library-support";
import {
  DEFAULT_LOCATOR_RESULT_CARD_PROPS,
  LocatorResultCardFields,
} from "./LocatorResultCard.tsx";
import { getFacetFieldOptions } from "./Filters.tsx";

export const locatorResultCardSchema = inferFieldZodSchema(
  LocatorResultCardFields,
  { defaultValue: DEFAULT_LOCATOR_RESULT_CARD_PROPS }
);

export const locatorFacetFieldsSchema = z
  .object({
    selections: z.array(
      z.object({
        value: z
          .enum(
            getFacetFieldOptions([...LOCATOR_ENTITY_TYPES])
              .map(({ value }) => value)
              .filter((value): value is string => typeof value === "string")
          )
          .optional(),
      })
    ),
  })
  .optional();
