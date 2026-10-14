import { z } from "zod";
import { backgroundColorSchema } from "./colors.ts";
import { slotSchema } from "./slots.ts";

const maxWidthSchema = z
  .enum(["theme", "768px", "960px", "1024px", "1280px", "1440px", "fullWidth"])
  .nullable();
export const secondaryHeaderSchema = z.object({
  data: z.object({
    show: z.boolean().describe("Whether to display the secondary top bar."),
    showLanguageDropdown: z.boolean(),
  }),
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({ LinksSlot: slotSchema() }),
});

export const primaryHeaderSchema = z.object({
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({
    LogoSlot: slotSchema(),
    LinksSlot: slotSchema(),
    PrimaryCTASlot: slotSchema(),
    SecondaryCTASlot: slotSchema(),
  }),
});

export const expandedHeaderSchema = z.object({
  styles: z.object({
    maxWidth: maxWidthSchema.describe(
      "Maximum width shared by both header tiers."
    ),
    headerPosition: z.enum(["fixed", "scrollsWithPage"]),
  }),
  slots: z.object({
    PrimaryHeaderSlot: slotSchema(),
    SecondaryHeaderSlot: slotSchema(),
  }),
  analytics: z.object({ scope: z.string().optional() }),
});
