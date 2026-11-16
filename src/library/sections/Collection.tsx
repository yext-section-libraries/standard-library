import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import {
  collectionConfig,
  type CollectionProps,
} from "../shared/design/collection.tsx";

export const Collection: YextComponentConfig<CollectionProps> =
  collectionConfig;

export const config: SectionConfig = {
  id: "Collection",
  displayName: "Collection",
  description:
    "Repeat any editable card or layout using manual items or a mapped Yext list. Edit the template once to update every item.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Patterns",
};
