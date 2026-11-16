import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { listItemConfig } from "../shared/design/containers.tsx";
import type { ContainerProps } from "../shared/design/containers.tsx";

export const ListItem: YextComponentConfig<ContainerProps> = listItemConfig;

export const config: SectionConfig = {
  id: "ListItem",
  displayName: "List item",
  description:
    "Configurable list item with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Layout",
};
