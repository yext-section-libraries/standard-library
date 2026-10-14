import { z } from "zod";
import type { ExpandedHeaderProps } from "../../sections/ExpandedHeader.tsx";
import type { PrimaryHeaderSlotProps } from "../sectionSupport/header/PrimaryHeaderSlot.tsx";
import type { SecondaryHeaderSlotProps } from "../sectionSupport/header/SecondaryHeaderSlot.tsx";
import { backgroundColorSchema } from "./colors.ts";
import {
  headerLinksSchema,
  ctaWrapperSchema,
  imageWrapperSchema,
  slotSchema,
} from "./slots.ts";

const maxWidthSchema = z
  .enum(["theme", "768px", "960px", "1024px", "1280px", "1440px", "fullWidth"])
  .nullable()
  .optional();
export const secondaryHeaderSchema = z.object({
  data: z.object({
    show: z.boolean().describe("Whether to display the secondary top bar."),
    showLanguageDropdown: z.boolean(),
  }),
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({ LinksSlot: slotSchema("HeaderLinks", headerLinksSchema) }),
  parentStyles: z.object({ maxWidth: maxWidthSchema }).optional(),
}) satisfies z.ZodType<SecondaryHeaderSlotProps>;

export const primaryHeaderSchema = z.object({
  styles: z.object({ backgroundColor: backgroundColorSchema.optional() }),
  slots: z.object({
    LogoSlot: slotSchema(
      "ImageSlot",
      imageWrapperSchema,
      "The header logo image and optional link."
    ),
    LinksSlot: slotSchema("HeaderLinks", headerLinksSchema),
    PrimaryCTASlot: slotSchema("CTASlot", ctaWrapperSchema),
    SecondaryCTASlot: slotSchema("CTASlot", ctaWrapperSchema),
  }),
  parentValues: z
    .object({
      maxWidth: maxWidthSchema,
      SecondaryHeaderSlot: slotSchema(
        "SecondaryHeaderSlot",
        secondaryHeaderSchema
      ),
    })
    .optional()
    .describe(
      "Values supplied by ExpandedHeader at runtime; author the top-level styles and secondary header slot instead."
    ),
  conditionalRender: z
    .object({
      navContent: z.boolean(),
      CTAs: z.boolean(),
      hasLogoImage: z.boolean().optional(),
    })
    .optional(),
}) satisfies z.ZodType<PrimaryHeaderSlotProps>;

export const expandedHeaderSchema = z.object({
  styles: z.object({
    maxWidth: maxWidthSchema
      .unwrap()
      .describe("Maximum width shared by both header tiers."),
    headerPosition: z.enum(["fixed", "scrollsWithPage"]),
  }),
  slots: z.object({
    PrimaryHeaderSlot: slotSchema("PrimaryHeaderSlot", primaryHeaderSchema),
    SecondaryHeaderSlot: slotSchema(
      "SecondaryHeaderSlot",
      secondaryHeaderSchema
    ),
  }),
  analytics: z.object({ scope: z.string().optional() }),
  ignoreLocaleWarning: z.array(z.string()).optional(),
}) satisfies z.ZodType<ExpandedHeaderProps>;
