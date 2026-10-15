import { z } from "zod";
import { backgroundColorSchema } from "./colors.ts";
import {
  enhancedCtaSchema,
  entityFieldSchema,
  imageSchema,
  translatableRichTextSchema,
  translatableStringSchema,
} from "./data.ts";
import { slotSchema } from "./slots.ts";

const sectionStyles = z.object({
  backgroundColor: backgroundColorSchema.optional(),
  showSectionHeading: z.boolean(),
});
const sectionSlots = z.object({
  SectionHeadingSlot: slotSchema(),
  CardsWrapperSlot: slotSchema(),
});
export const mappedCardsSectionSchema = z.object({
  styles: sectionStyles,
  slots: sectionSlots,
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean(),
});
const productVariantSchema = z.enum(["immersive", "classic", "minimal"]);
export const productSectionSchema = mappedCardsSectionSchema.extend({
  styles: sectionStyles.extend({
    cardVariant: productVariantSchema.optional(),
  }),
});

// Slotted sources own card references and the manual mirror. Only bindings and
// mappings are authored here; native CardSlot children supply manual content.
function cardsWrapperSchema(mappings: z.ZodRawShape, styles: z.ZodRawShape) {
  return z.object({
    data: z.object({
      field: z.string(),
      constantValueEnabled: z.boolean().optional(),
      mappings: z.object(mappings).optional(),
    }),
    styles: z.object(styles),
    slots: z.object({
      CardSlot: z
        .array(z.unknown())
        .describe(
          "Ordered manual card children. An explicit [] means zero cards; $default selects library defaults. In linked mode, author the source binding and mappings and leave CardSlot empty or select $default."
        ),
    }),
  });
}
const imageMapping = entityFieldSchema(imageSchema.optional());
const textMapping = entityFieldSchema(translatableStringSchema.optional());
const richTextMapping = entityFieldSchema(
  translatableRichTextSchema.optional()
);
const dateMapping = entityFieldSchema(z.string().optional());
const ctaMapping = entityFieldSchema(enhancedCtaSchema.optional());

export const eventCardsWrapperSchema = cardsWrapperSchema(
  {
    image: imageMapping,
    title: textMapping,
    dateTime: dateMapping,
    description: richTextMapping,
    cta: ctaMapping,
  },
  {
    showImage: z.boolean(),
    showDateTime: z.boolean(),
    showDescription: z.boolean(),
    showCTA: z.boolean(),
  }
);
export const insightCardsWrapperSchema = cardsWrapperSchema(
  {
    image: imageMapping,
    name: textMapping,
    category: richTextMapping,
    publishTime: dateMapping,
    description: richTextMapping,
    cta: ctaMapping,
  },
  {
    showImage: z.boolean(),
    showCategory: z.boolean(),
    showPublishTime: z.boolean(),
    showDescription: z.boolean(),
    showCTA: z.boolean(),
  }
);
export const teamCardsWrapperSchema = cardsWrapperSchema(
  {
    headshot: imageMapping,
    name: textMapping,
    title: richTextMapping,
    phoneNumber: dateMapping,
    email: dateMapping,
    cta: ctaMapping,
  },
  {
    showImage: z.boolean(),
    showTitle: z.boolean(),
    showPhone: z.boolean(),
    showEmail: z.boolean(),
    showCTA: z.boolean(),
  }
);
export const testimonialCardsWrapperSchema = cardsWrapperSchema(
  {
    description: richTextMapping,
    contributorName: textMapping,
    contributionDate: dateMapping,
  },
  { showName: z.boolean(), showDate: z.boolean() }
);
export const productCardsWrapperSchema = cardsWrapperSchema(
  {
    image: imageMapping,
    category: richTextMapping,
    name: textMapping,
    price: entityFieldSchema(
      z
        .object({
          value: z.number().optional(),
          currencyCode: z.string().optional(),
        })
        .optional()
    ),
    description: richTextMapping,
    cta: ctaMapping,
  },
  {
    showImage: z.boolean(),
    showBrow: z.boolean(),
    showTitle: z.boolean(),
    showPrice: z.boolean(),
    showDescription: z.boolean(),
    showCTA: z.boolean(),
    variant: productVariantSchema.optional(),
  }
);

// Fixed card slots keep one child even when their display controls are disabled.
const cardStyles = z.object({
  backgroundColor: backgroundColorSchema.optional(),
});
export const eventCardSchema = z.object({
  styles: cardStyles.extend({ truncateDescription: z.boolean() }),
  slots: z.object({
    ImageSlot: slotSchema(),
    TitleSlot: slotSchema(),
    DateTimeSlot: slotSchema(),
    DescriptionSlot: slotSchema(),
    CTASlot: slotSchema(),
  }),
});
export const insightCardSchema = z.object({
  styles: cardStyles,
  slots: z.object({
    ImageSlot: slotSchema(),
    TitleSlot: slotSchema(),
    CategorySlot: slotSchema(),
    DescriptionSlot: slotSchema(),
    PublishTimeSlot: slotSchema(),
    CTASlot: slotSchema(),
  }),
});
export const teamCardSchema = z.object({
  styles: cardStyles,
  slots: z.object({
    ImageSlot: slotSchema(),
    NameSlot: slotSchema(),
    TitleSlot: slotSchema(),
    PhoneSlot: slotSchema(),
    EmailSlot: slotSchema(),
    CTASlot: slotSchema(),
  }),
});
export const testimonialCardSchema = z.object({
  styles: cardStyles,
  slots: z.object({
    DescriptionSlot: slotSchema(),
    ContributorNameSlot: slotSchema(),
    ContributionDateSlot: slotSchema(),
  }),
});
export const productCardSchema = z.object({
  styles: cardStyles,
  slots: z.object({
    ImageSlot: slotSchema(),
    BrowSlot: slotSchema(),
    TitleSlot: slotSchema(),
    PriceSlot: slotSchema(),
    DescriptionSlot: slotSchema(),
    CTASlot: slotSchema(),
  }),
});
