import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import {
  PhotoGalleryWrapper,
  type PhotoGalleryWrapperProps,
} from "../shared/sectionSupport/pageSections/PhotoGallerySection/PhotoGalleryWrapper.tsx";
import { withDesign } from "../shared/design/withDesign.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";

type GalleryProps = PhotoGalleryWrapperProps & {
  variant: "gallery" | "carousel";
};
const base: YextComponentConfig<GalleryProps> = {
  ...PhotoGalleryWrapper,
  label: "Gallery",
  fields: {
    ...PhotoGalleryWrapper.fields!,
    variant: {
      type: "radio",
      label: "Layout",
      options: [
        { label: "Gallery", value: "gallery" },
        { label: "Carousel", value: "carousel" },
      ],
    },
  },
  defaultProps: { ...PhotoGalleryWrapper.defaultProps!, variant: "gallery" },
  resolveFields: undefined,
  resolveData: (data, params) => {
    const updated = {
      ...data,
      props: {
        ...data.props,
        parentData: { variant: data.props.variant ?? "gallery" },
      },
    };
    return PhotoGalleryWrapper.resolveData
      ? PhotoGalleryWrapper.resolveData(updated, params)
      : updated;
  },
};

export const Gallery: YextComponentConfig<GalleryProps & DesignProps> =
  withDesign(base);
export const config: SectionConfig = {
  id: "Gallery",
  displayName: "Gallery",
  description:
    "Editable gallery or carousel backed by manual images or a Yext image list.",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  category: "Patterns",
};
