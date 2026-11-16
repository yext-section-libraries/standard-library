import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { buttonConfig } from "../shared/design/content.tsx";
import type { ButtonProps } from "../shared/design/content.tsx";

export const Button: YextComponentConfig<ButtonProps> = buttonConfig;

export const config: SectionConfig = {
  id: "Button",
  displayName: "Button / link",
  description:
    "Configurable button / link with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Content",
};
