import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { dividerConfig } from "../shared/design/otherAtoms.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";

export const Divider: YextComponentConfig<DesignProps> = dividerConfig;

export const config: SectionConfig = {
  id: "Divider",
  displayName: "Divider",
  description:
    "Configurable divider with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Content",
};
