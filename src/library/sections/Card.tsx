import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { cardConfig } from "../shared/design/containers.tsx";
import type { ContainerProps } from "../shared/design/containers.tsx";

export const Card: YextComponentConfig<ContainerProps> = cardConfig;

export const config: SectionConfig = {
  id: "Card",
  displayName: "Card",
  description:
    "Configurable card with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Patterns",
};
