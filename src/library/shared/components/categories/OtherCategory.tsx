import { CustomCodeSectionProps, CustomCodeSection } from "@yext/visual-editor";
import {
  ExpandedFooterProps,
  ExpandedFooter,
} from "../../../sections/ExpandedFooter.tsx";
import {
  ExpandedHeaderProps,
  ExpandedHeader,
} from "../../../sections/ExpandedHeader.tsx";

export interface OtherCategoryProps {
  ExpandedHeader: ExpandedHeaderProps;
  ExpandedFooter: ExpandedFooterProps;
  CustomCodeSection: CustomCodeSectionProps;
}

export const OtherCategoryComponents = {
  ExpandedHeader,
  ExpandedFooter,
  CustomCodeSection,
};

export const OtherCategory = Object.keys(
  OtherCategoryComponents,
) as (keyof OtherCategoryProps)[];
