import type { Migration } from "@yext/visual-editor";

export const gridColumnAlignment: Migration = {
  Grid: {
    action: "updated",
    propTransformation: ({ align, ...props }) => ({
      ...props,
      alignColumn1: props.alignColumn1 ?? align ?? "left",
      alignColumn2: props.alignColumn2 ?? align ?? "left",
      alignColumn3: props.alignColumn3 ?? align ?? "left",
      alignColumn4: props.alignColumn4 ?? align ?? "left",
      alignColumn5: props.alignColumn5 ?? align ?? "left",
      alignColumn6: props.alignColumn6 ?? align ?? "left",
    }),
  },
};
