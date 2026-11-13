import type { Migration } from "@yext/visual-editor";

export const addLocatorAutoSearch = {
  Locator: {
    action: "updated",
    propTransformation: (props) => ({
      ...props,
      autoSearchOnMapMove: props.autoSearchOnMapMove ?? false,
    }),
  },
} satisfies Migration;
