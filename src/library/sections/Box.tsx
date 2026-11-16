import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { boxConfig } from "../shared/design/containers.tsx";
import type { ContainerProps } from "../shared/design/containers.tsx";

export const Box: YextComponentConfig<ContainerProps> = boxConfig;

export const config: SectionConfig = {
  id: "Box",
  displayName: "Box",
  description:
    "Configurable box with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Layout",
};
