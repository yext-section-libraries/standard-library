import type { MigrationRegistry } from "@yext/visual-editor";
import { photoGalleryColumns } from "./0001_photo_gallery_columns.ts";

export const migrationRegistry: MigrationRegistry = [photoGalleryColumns];
