import type { Migration } from "@yext/visual-editor";

export const photoGalleryColumns: Migration = {
  PhotoGalleryWrapper: {
    action: "updated",
    propTransformation: (props) => ({
      ...props,
      styles: {
        ...props.styles,
        columns: props.styles?.columns ?? 3,
      },
    }),
  },
};
