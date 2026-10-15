import type { Migration } from "@yext/visual-editor";

export const renameHoursStatus: Migration = {
  hoursStatus: {
    action: "renamed",
    newType: "HoursStatus",
  },
};
