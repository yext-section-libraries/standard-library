import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { iconConfig } from "../shared/design/otherAtoms.tsx";
import type { IconProps } from "../shared/design/otherAtoms.tsx";

export const Icon: YextComponentConfig<IconProps> = iconConfig;

export const config: SectionConfig = {
  id: "Icon",
  displayName: "Icon",
  description:
    "Configurable icon with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Content",
};
