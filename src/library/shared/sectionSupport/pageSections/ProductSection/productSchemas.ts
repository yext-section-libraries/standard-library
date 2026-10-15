import { z } from "zod";

export const productVariantSchema = z.enum(["immersive", "classic", "minimal"]);
