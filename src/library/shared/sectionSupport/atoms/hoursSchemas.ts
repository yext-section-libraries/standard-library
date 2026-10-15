import { z } from "zod";

const hoursDaySchema = z.object({
  isClosed: z.boolean().optional(),
  openIntervals: z
    .array(z.object({ start: z.string(), end: z.string() }))
    .optional(),
});

export const hoursValueSchema = z.object({
  monday: hoursDaySchema.optional(),
  tuesday: hoursDaySchema.optional(),
  wednesday: hoursDaySchema.optional(),
  thursday: hoursDaySchema.optional(),
  friday: hoursDaySchema.optional(),
  saturday: hoursDaySchema.optional(),
  sunday: hoursDaySchema.optional(),
  holidayHours: z
    .array(
      hoursDaySchema.extend({
        date: z.string(),
        isRegularHours: z.boolean().optional(),
      })
    )
    .optional(),
  reopenDate: z.string().optional(),
});
