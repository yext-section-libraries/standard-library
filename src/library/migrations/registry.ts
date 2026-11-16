import { pageStructure } from "./0008_page_structure.ts";
import { textInheritance } from "./0007_text_inheritance.ts";
import { designDefaults } from "./0006_design_defaults.ts";
import type { MigrationRegistry } from "@yext/visual-editor";
import { photoGalleryColumns } from "./0001_photo_gallery_columns.ts";
import { renameHoursStatus } from "./0002_rename_hours_status.ts";
import { gridColumnAlignment } from "./0003_grid_column_alignment.ts";
import { headerMenuIds } from "./0004_header_menu_ids.ts";

import { composableSections } from "./0005_composable_sections.ts";

export const migrationRegistry: MigrationRegistry = [
  photoGalleryColumns,
  renameHoursStatus,
  gridColumnAlignment,
  headerMenuIds,
  composableSections,
  designDefaults,
  textInheritance,
  pageStructure,
];
