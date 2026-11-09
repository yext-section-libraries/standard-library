import type { Migration } from "@yext/visual-editor";

export const locatorDistanceUnit: Migration = {
  Locator: {
    action: "updated",
    propTransformation: (props) => ({
      ...props,
      distanceUnit: props.distanceUnit ?? "locale",
    }),
  },
};
