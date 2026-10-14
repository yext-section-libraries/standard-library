import type { MigrationRegistry } from "@yext/visual-editor";

// Version 1: fixed-slot fields now restrict children to their native component types.
// Existing saved children and authored values are preserved; resolvers recompute
// inherited values. No persisted prop rename or destructive normalization is needed.
export const migrationRegistry: MigrationRegistry = [
  {
    "*": {
      action: "updated",
      propTransformation: (props) => props,
    },
  },
  {
    // Version 2: recover legacy Promo background assets only when their URL
    // contains explicit dimensions. Never infer dimensions or change asset URLs.
    PromoSection: {
      action: "updated",
      propTransformation: (props) => {
        const backgroundImage = props.data?.backgroundImage;
        const value = backgroundImage?.constantValue;
        const assetUrl = value?.defaultValue;
        if (typeof assetUrl !== "string") return props;
        let url: URL;
        try {
          url = new URL(assetUrl);
        } catch {
          return props;
        }
        const width = Number(url.searchParams.get("width"));
        const height = Number(url.searchParams.get("height"));
        if (
          !Number.isFinite(width) ||
          !Number.isFinite(height) ||
          width <= 0 ||
          height <= 0
        ) {
          return props;
        }
        return {
          ...props,
          data: {
            ...props.data,
            backgroundImage: {
              ...backgroundImage,
              constantValue: {
                ...value,
                defaultValue: { url: assetUrl, width, height },
              },
            },
          },
        };
      },
    },
  },
];
