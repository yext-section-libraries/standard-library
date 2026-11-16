import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { stackConfig } from "../shared/design/containers.tsx";
import type { ContainerProps } from "../shared/design/containers.tsx";

export const Stack: YextComponentConfig<ContainerProps> = stackConfig;

export const config: SectionConfig = {
  id: "Stack",
  displayName: "Stack",
  description:
    "Configurable stack with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Layout",
};
