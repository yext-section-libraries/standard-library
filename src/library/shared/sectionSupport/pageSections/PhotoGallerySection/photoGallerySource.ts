import {
  type AssetImageType,
  type YextEntityField,
  createItemSource,
  msg,
} from "@yext/visual-editor";

import { getRandomPlaceholderImageObject } from "@yext/visual-editor/section-library-support";

import { type PhotoGalleryItem } from "./photoGalleryUtils.ts";

const PLACEHOLDER: AssetImageType = {
  ...getRandomPlaceholderImageObject({ width: 1000, height: 570 }),
  width: 1000,
  height: 570,
  assetImage: { name: "Placeholder" },
};

export const photoGallerySource = createItemSource<{
  image: YextEntityField<PhotoGalleryItem["image"]>;
  link: YextEntityField<PhotoGalleryItem["link"]>;
}>({
  label: msg("fields.images", "Images"),
  mappingFields: {
    image: {
      type: "entityField",
      label: msg("fields.image", "Image"),
      filter: { types: ["type.image"] },
    },
    link: {
      type: "entityField",
      label: msg("fields.link", "Link"),
      filter: { types: ["type.cta"] },
      constantValueFilter: { types: ["type.string"] },
      disableConstantValueToggle: true,
    },
  },
  defaultValues: Array.from({ length: 3 }, () => ({
    image: {
      field: "",
      constantValue: PLACEHOLDER,
      constantValueEnabled: true,
    },
    link: {
      field: "",
      constantValue: { defaultValue: "" },
      constantValueEnabled: true,
    },
  })),
});
