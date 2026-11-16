import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { richTextConfig } from "../shared/design/content.tsx";
import type { TextContentProps } from "../shared/design/content.tsx";

export const RichText: YextComponentConfig<Omit<TextContentProps, "as">> =
  richTextConfig;

export const config: SectionConfig = {
  id: "RichText",
  displayName: "Rich text",
  description:
    "Configurable rich text with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Content",
};
