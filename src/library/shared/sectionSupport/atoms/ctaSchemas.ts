import { z } from "zod";
import {
  entityFieldSchema,
  enhancedCtaSchema,
  ctaTypeSchema,
} from "../../generation/data.ts";

export const ctaVariantSchema = z.enum(["primary", "secondary", "link"]);

export const presetImageSchema = z.enum([
  "app-store",
  "google-play",
  "galaxy-store",
  "app-gallery",
  "deliveroo",
  "doordash",
  "grubhub",
  "skip-the-dishes",
  "postmates",
  "uber-eats",
  "ezcater",
]);

export const ctaEntityFieldSchema = entityFieldSchema(enhancedCtaSchema).extend(
  {
    selectedType: ctaTypeSchema.optional(),
  }
);
