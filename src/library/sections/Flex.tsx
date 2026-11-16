import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { flexConfig } from "../shared/design/containers.tsx";
import type { ContainerProps } from "../shared/design/containers.tsx";

export const Flex: YextComponentConfig<ContainerProps> = flexConfig;

export const config: SectionConfig = {
  id: "Flex",
  displayName: "Flex",
  description:
    "Configurable flex with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Layout",
};
