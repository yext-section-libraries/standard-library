import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import {
  ReviewsSectionBody,
  type ReviewsSectionProps,
} from "./ReviewsSection.tsx";
import { withDesign } from "../shared/design/withDesign.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";

export const Reviews: YextComponentConfig<ReviewsSectionProps & DesignProps> =
  withDesign(ReviewsSectionBody);

export const config: SectionConfig = {
  id: "Reviews",
  displayName: "Reviews",
  description: "Reusable reviews block with Yext data and responsive styling.",
  pageSetTypes: ["ENTITY"],
  category: "Yext data",
};
