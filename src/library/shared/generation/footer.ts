import { z } from "zod";
import {
  backgroundColorSchema,
  optionalTextColorSchema,
  siteColorSchema,
} from "./colors.ts";
import {
  assetImageSchema,
  enhancedCtaSchema,
  entityFieldSchema,
  imageSchema,
  translatableStringSchema,
} from "./data.ts";
import { slotSchema } from "./slots.ts";

const alignmentSchema = z.enum(["left", "center", "right"]);
const maxWidthSchema = z
  .enum(["theme", "768px", "960px", "1024px", "1280px", "1440px", "fullWidth"])
  .nullable();
const optionalSiteColorSchema = siteColorSchema
  .optional()
  .describe(
    "Omit to use the default theme color. Set only when the user explicitly requests a color override."
  );
const imageStylesSchema = z.object({
  width: z.number().min(0).optional(),
  aspectRatio: z.number().positive().optional(),
  imageFillType: z.enum(["fill", "fit"]).optional(),
});

export const expandedFooterSchema = z.object({
  data: z.object({
    primaryFooter: z.object({
      expandedFooter: z
        .boolean()
        .describe(
          "Use columns of categorized links instead of a single row of links."
        ),
      showLogo: z.boolean(),
      showSocialLinks: z.boolean(),
      showUtilityImages: z.boolean(),
    }),
    secondaryFooter: z.object({ show: z.boolean() }),
  }),
  styles: z.object({
    primaryFooter: z.object({
      backgroundColor: backgroundColorSchema.optional(),
      linksPosition: z.enum(["left", "right"]),
      desktopContentAlignment: alignmentSchema,
      mobileContentAlignment: alignmentSchema,
    }),
    maxWidth: maxWidthSchema.optional(),
  }),
  slots: z.object({
    LogoSlot: slotSchema(),
    SocialLinksSlot: slotSchema(),
    UtilityImagesSlot: slotSchema(),
    PrimaryLinksWrapperSlot: slotSchema(),
    ExpandedLinksWrapperSlot: slotSchema(),
    SecondaryFooterSlot: slotSchema(),
  }),
  analytics: z.object({ scope: z.string().optional() }),
});

export const secondaryFooterSchema = z.object({
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    desktopContentAlignment: alignmentSchema,
    mobileContentAlignment: alignmentSchema,
    showLinks: z.boolean(),
  }),
  slots: z.object({
    SecondaryLinksWrapperSlot: slotSchema(),
    CopyrightSlot: slotSchema(),
  }),
});

export const footerLogoSchema = z.object({
  data: z.object({
    image: entityFieldSchema(imageSchema),
    linkTarget: z.string().optional(),
  }),
  styles: imageStylesSchema,
});

export const footerSocialLinksSchema = z.object({
  data: z
    .object({
      xLink: z.string(),
      facebookLink: z.string(),
      instagramLink: z.string(),
      linkedInLink: z.string(),
      pinterestLink: z.string(),
      tiktokLink: z.string(),
      youtubeLink: z.string(),
    })
    .describe(
      "Social profile URLs. Leave unavailable profiles empty; never invent URLs."
    ),
  styles: z
    .object({
      filledBackground: z.boolean().optional(),
      mobileAlignment: z.enum(["left", "center"]).optional(),
      iconColor: optionalSiteColorSchema,
    })
    .optional(),
});

export const footerUtilityImagesSchema = z.object({
  data: z.object({
    utilityImages: z.array(
      z.object({
        image: assetImageSchema,
        linkTarget: z.string().optional(),
      })
    ),
  }),
  styles: imageStylesSchema,
});

export const footerLinksSchema = z.object({
  data: z.object({ links: z.array(enhancedCtaSchema) }),
  color: optionalSiteColorSchema,
});

export const footerExpandedLinksSchema = z.object({
  data: z.object({
    sections: z.array(
      z.object({
        label: translatableStringSchema,
        links: z.array(enhancedCtaSchema),
      })
    ),
  }),
  styles: z.object({ color: optionalSiteColorSchema }).optional(),
});

export const footerExpandedLinkSectionSchema = z.object({
  data: z.object({
    label: entityFieldSchema(translatableStringSchema),
    links: z.array(enhancedCtaSchema),
  }),
  styles: z.object({ color: optionalSiteColorSchema }).optional(),
});

export const copyrightMessageSchema = z.object({
  data: z.object({ text: translatableStringSchema }),
  styles: z.object({ textColor: optionalTextColorSchema }).optional(),
});
