import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import {
  BreadcrumbsSectionBody,
  type BreadcrumbsSectionProps,
} from "./BreadcrumbsSection.tsx";
import { withDesign } from "../shared/design/withDesign.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";

export const Breadcrumbs: YextComponentConfig<
  BreadcrumbsSectionProps & DesignProps
> = withDesign(BreadcrumbsSectionBody);

export const config: SectionConfig = {
  id: "Breadcrumbs",
  displayName: "Breadcrumbs",
  description:
    "Reusable breadcrumbs block with Yext data and responsive styling.",
  pageSetTypes: ["ENTITY"],
  category: "Yext data",
};
