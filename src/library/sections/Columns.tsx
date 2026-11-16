import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { columnsConfig } from "../shared/design/containers.tsx";
import type { ContainerProps } from "../shared/design/containers.tsx";

export const Columns: YextComponentConfig<ContainerProps> = columnsConfig;

export const config: SectionConfig = {
  id: "Columns",
  displayName: "Columns",
  description:
    "Configurable columns with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Layout",
};
