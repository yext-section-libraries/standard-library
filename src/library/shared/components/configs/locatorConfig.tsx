import { Config, DropZone } from "@puckeditor/core";
import {
  LocatorCategory,
  LocatorCategoryComponents,
  type LocatorCategoryProps,
} from "../categories/LocatorCategory.tsx";
import {
  OtherCategory,
  OtherCategoryComponents,
  type OtherCategoryProps,
} from "../categories/OtherCategory.tsx";
import { BannerSection, BannerSectionProps } from "../pageSections/Banner.tsx";
import {
  SlotsCategory,
  SlotsCategoryComponents,
  SlotsCategoryProps,
} from "../categories/SlotsCategory.tsx";
import { pt } from "@yext/visual-editor/section-library-support";
import { MainContent, MainContentProps } from "../structure/MainContent.tsx";
import { rootAllowedComponents } from "./rootAllowedComponents.ts";

export interface LocatorConfigProps
  extends LocatorCategoryProps, SlotsCategoryProps, OtherCategoryProps {
  BannerSection: BannerSectionProps;
  MainContent: MainContentProps;
}

const components: Config<LocatorConfigProps>["components"] = {
  ...LocatorCategoryComponents,
  ...SlotsCategoryComponents,
  ...OtherCategoryComponents,
  BannerSection,
  MainContent,
};

// The config used for the locator
export const locatorConfig: Config<LocatorConfigProps> = {
  components,
  categories: {
    pageSections: {
      title: pt("categories.standardSections", "Standard Sections"),
      components: [...LocatorCategory, "BannerSection"],
    },
    slots: {
      components: SlotsCategory,
      visible: false,
    },
    structure: {
      components: ["MainContent"],
      visible: false,
    },
    other: {
      components: OtherCategory,
    },
  },
  root: {
    render: () => {
      return (
        <DropZone
          zone="default-zone"
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
          disallow={Object.keys(components).filter(
            (componentName) => !rootAllowedComponents.includes(componentName),
          )}
        />
      );
    },
  },
};
