import { z } from "zod";

// Child contracts and allowed types come from the registered Puck components.
// These components render only the first child, so fixed slots contain exactly one.
export const slotSchema = (description?: string) =>
  z
    .array(z.unknown())
    .length(1)
    .describe(
      description ??
        "Exactly one child, including when its display control is disabled."
    );
