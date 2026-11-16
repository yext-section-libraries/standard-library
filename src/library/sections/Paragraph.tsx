import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { paragraphConfig } from "../shared/design/content.tsx";
import type { TextContentProps } from "../shared/design/content.tsx";

export const Paragraph: YextComponentConfig<TextContentProps> = paragraphConfig;

export const config: SectionConfig = {
  id: "Paragraph",
  displayName: "Paragraph",
  description:
    "Configurable paragraph with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Content",
};
