import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { spacerConfig } from "../shared/design/otherAtoms.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";

export const Spacer: YextComponentConfig<DesignProps> = spacerConfig;

export const config: SectionConfig = {
  id: "Spacer",
  displayName: "Spacer",
  description:
    "Configurable spacer with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Layout",
};
