import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import {
  PhoneList as Base,
  type PhoneListProps,
} from "../shared/sectionSupport/contentBlocks/PhoneList.tsx";
import { withDesign } from "../shared/design/withDesign.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";
export const PhoneList: YextComponentConfig<PhoneListProps & DesignProps> =
  withDesign(Base);
export const config: SectionConfig = {
  id: "PhoneList",
  displayName: "PhoneList",
  description:
    "Configurable phonelist with data mapping and responsive design.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Yext data",
};
