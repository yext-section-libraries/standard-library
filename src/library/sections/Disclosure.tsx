import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { disclosureConfig } from "../shared/design/otherAtoms.tsx";
import type { DisclosureProps } from "../shared/design/otherAtoms.tsx";

export const Disclosure: YextComponentConfig<DisclosureProps> =
  disclosureConfig;

export const config: SectionConfig = {
  id: "Disclosure",
  displayName: "Disclosure / accordion item",
  description:
    "Configurable disclosure / accordion item with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Patterns",
};
