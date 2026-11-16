import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { headingConfig } from "../shared/design/content.tsx";
import type { TextContentProps } from "../shared/design/content.tsx";

export const Heading: YextComponentConfig<TextContentProps> = headingConfig;

export const config: SectionConfig = {
  id: "Heading",
  displayName: "Heading",
  description:
    "Configurable heading with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Content",
};
