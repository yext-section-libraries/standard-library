import { z } from "zod";
import { mapStyleSchema } from "../../../sections/MapboxStaticMap.tsx";
import { hoursTableSchema } from "../../../sections/HoursTable.tsx";
import {
  backgroundColorSchema,
  siteColorSchema,
} from "../../generation/colors.ts";
import {
  imageSchema,
  translatableStringSchema,
} from "../../generation/data.ts";
import { ctaVariantSchema } from "../atoms/ctaSchemas.ts";
import { MAX_PIN_ICON_WIDTH, makiIconOptions } from "./Map.tsx";
import { getFacetFieldOptions } from "./Filters.tsx";

const entityTypeSchema = z.enum([
  "location",
  "healthcareProfessional",
  "healthcareFacility",
  "event",
  "atm",
  "restaurant",
  "hotel",
  "providerFacility",
  "financialProfessional",
]);
const headingBinding = {
  field: z.string().optional(),
  constantValue: translatableStringSchema.optional(),
  constantValueEnabled: z.boolean().optional(),
  trueDisplayText: translatableStringSchema.optional(),
  falseDisplayText: translatableStringSchema.optional(),
};
const supportingHeading = z.object({
  ...headingBinding,
  variant: z.enum(["xs", "sm", "base", "lg"]).nullable(),
  liveVisibility: z.boolean(),
});
const visibleField = z.object({
  field: z.string().optional(),
  liveVisibility: z.boolean(),
});
const cta = z.object({
  label: translatableStringSchema,
  normalizeLink: z.boolean(),
  variant: ctaVariantSchema,
  textColor: siteColorSchema.optional(),
  liveVisibility: z.boolean(),
  link: translatableStringSchema,
});

export const locatorResultCardSchema = z.object({
  entityType: entityTypeSchema,
  primaryHeading: z.object({
    ...headingBinding,
    headingLevel: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
    color: siteColorSchema.optional(),
  }),
  secondaryHeading: supportingHeading,
  tertiaryHeading: supportingHeading,
  icons: z.boolean(),
  accentColor: siteColorSchema.optional(),
  textColor: siteColorSchema.optional(),
  hours: visibleField.extend({
    table: hoursTableSchema.shape.styles.omit({ alignment: true }),
  }),
  address: z.object({
    showRegion: z.boolean().optional(),
    showCountry: z.boolean().optional(),
    showGetDirectionsLink: z.boolean(),
    liveVisibility: z.boolean(),
  }),
  phone: visibleField.extend({
    phoneFormat: z.enum(["domestic", "international"]),
    includePhoneHyperlink: z.boolean(),
  }),
  email: visibleField,
  services: visibleField,
  primaryCTA: cta.extend({ link: translatableStringSchema.optional() }),
  secondaryCTA: cta,
  image: visibleField.extend({
    constantValue: imageSchema.optional(),
    constantValueEnabled: z.boolean().optional(),
  }),
});

export const locatorSchema = z.object({
  mapStyle: z
    .enum(
      mapStyleSchema.options.map((style) => `mapbox://styles/mapbox/${style}`)
    )
    .optional(),
  locationStyles: z
    .array(
      z.object({
        entityType: entityTypeSchema,
        pinIcon: z
          .object({
            type: z.enum(["none", "icon", "customImage"]),
            iconName: z
              .enum(makiIconOptions.map(({ value }) => value))
              .optional(),
            image: imageSchema.optional(),
            width: z.number().min(1).max(MAX_PIN_ICON_WIDTH).optional(),
            aspectRatio: z.number().positive().optional(),
          })
          .optional(),
        pinColor: backgroundColorSchema.optional(),
      })
    )
    .describe(
      "One pin style per active locator entity type; membership is managed by the page set."
    ),
  filters: z.object({
    openNowButton: z.boolean(),
    showDistanceOptions: z.boolean(),
    accentColor: siteColorSchema.optional(),
    facetFields: z
      .object({
        selections: z.array(
          z.object({
            value: z
              .enum(
                getFacetFieldOptions(entityTypeSchema.options)
                  .map(({ value }) => value)
                  .filter((value): value is string => typeof value === "string")
              )
              .optional(),
          })
        ),
      })
      .optional(),
    keywordsDisplayName: translatableStringSchema.optional(),
  }),
  mapStartingLocation: z
    .object({ latitude: z.string(), longitude: z.string() })
    .optional(),
  pageHeading: z
    .object({
      title: translatableStringSchema,
      color: siteColorSchema.optional(),
    })
    .optional(),
  resultCard: z
    .array(z.object({ props: locatorResultCardSchema }))
    .describe(
      "One result-card configuration per active locator entity type, matching locationStyles."
    ),
  distanceDisplay: z
    .enum(["distanceFromUser", "distanceFromSearch", "bothDistances", "hidden"])
    .optional(),
});
