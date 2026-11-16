import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { imageConfig } from "../shared/design/content.tsx";
import type { PictureProps } from "../shared/design/content.tsx";

export const Image: YextComponentConfig<PictureProps> = imageConfig;

export const config: SectionConfig = {
  id: "Image",
  displayName: "Image",
  description:
    "Configurable image with responsive styling and theme variable support.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Content",
};
