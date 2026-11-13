import type { MigrationRegistry } from "@yext/visual-editor";
import { photoGalleryColumns } from "./0001_photo_gallery_columns.ts";
import { renameHoursStatus } from "./0002_rename_hours_status.ts";
import { gridColumnAlignment } from "./0003_grid_column_alignment.ts";
import { headerMenuIds } from "./0004_header_menu_ids.ts";

import { semanticThemeRoles } from "./0005_semantic_theme_roles.ts";

import { typographyRoles } from "./0006_typography_roles.ts";

import { unifiedBackgrounds } from "./0007_unified_backgrounds.ts";

export const migrationRegistry: MigrationRegistry = [
  photoGalleryColumns,
  renameHoursStatus,
  gridColumnAlignment,
  headerMenuIds,
  semanticThemeRoles,
  typographyRoles,
  unifiedBackgrounds,
];
