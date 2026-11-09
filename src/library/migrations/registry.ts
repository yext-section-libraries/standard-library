import type { MigrationRegistry } from "@yext/visual-editor";
import { photoGalleryColumns } from "./0001_photo_gallery_columns.ts";
import { renameHoursStatus } from "./0002_rename_hours_status.ts";
import { gridColumnAlignment } from "./0003_grid_column_alignment.ts";
import { headerMenuIds } from "./0004_header_menu_ids.ts";
import { locatorDistanceUnit } from "./0005_locator_distance_unit.ts";

export const migrationRegistry: MigrationRegistry = [
  photoGalleryColumns,
  renameHoursStatus,
  gridColumnAlignment,
  headerMenuIds,
  locatorDistanceUnit,
];
