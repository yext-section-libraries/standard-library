import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import {
  Video as Base,
  type VideoProps,
} from "../shared/sectionSupport/contentBlocks/Video.tsx";
import { withDesign } from "../shared/design/withDesign.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";
export const Video: YextComponentConfig<VideoProps & DesignProps> =
  withDesign(Base);
export const config: SectionConfig = {
  id: "Video",
  displayName: "Video",
  description: "Configurable video with data mapping and responsive design.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Yext data",
};
