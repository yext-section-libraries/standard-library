import { z } from "zod";
import { backgroundColorSchema } from "./colors.ts";
import { slotSchema } from "./slots.ts";

export const coreInfoSectionSchema = z.object({
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({
    CoreInfoHeadingSlot: slotSchema(),
    CoreInfoAddressSlot: slotSchema(),
    CoreInfoPhoneNumbersSlot: slotSchema(),
    CoreInfoEmailsSlot: slotSchema(),
    HoursHeadingSlot: slotSchema(),
    HoursTableSlot: slotSchema(),
    ServicesHeadingSlot: slotSchema(),
    TextListSlot: slotSchema(),
  }),
  analytics: z.object({
    scope: z.string().optional().describe("Analytics scope for this section."),
  }),
  liveVisibility: z.boolean(),
});
