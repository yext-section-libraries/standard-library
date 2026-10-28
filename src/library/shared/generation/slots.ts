import { z } from "zod";

// Child prop contracts come from the registered Puck components.
// These components render only the first child, so fixed slots contain exactly one.
export const slotSchema = (description?: string, componentType?: string) =>
  z
    .array(
      componentType
        ? z.looseObject({
            type: z.literal(componentType),
            props: z.record(z.string(), z.unknown()),
          })
        : z.unknown()
    )
    .length(1)
    .describe(
      description ??
        "Exactly one child, including when its display control is disabled."
    );
