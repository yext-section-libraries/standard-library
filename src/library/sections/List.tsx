import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { listConfig } from "../shared/design/containers.tsx";
import type { ContainerProps } from "../shared/design/containers.tsx";

export const List: YextComponentConfig<ContainerProps> = listConfig;

export const config: SectionConfig = {
  id: "List",
  displayName: "List",
  description:
    "Configurable list with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Layout",
};
