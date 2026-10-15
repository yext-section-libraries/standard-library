import type { MigrationRegistry } from "@yext/visual-editor";
import { photoGalleryColumns } from "./0001_photo_gallery_columns.ts";
import { renameHoursStatus } from "./0002_rename_hours_status.ts";

export const migrationRegistry: MigrationRegistry = [
  photoGalleryColumns,
  renameHoursStatus,
];
