declare let YEXT_PUBLIC_UNIVERSE: string;
declare let YEXT_PUBLIC_EXTERNAL_IMAGE_API_BASE_URL: string;
declare let YEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
declare const __VISUAL_EDITOR_TEST__: boolean | undefined;

declare module "virtual:section-library-i18n" {
  import type { SectionLibraryTranslationLoaders } from "@yext/visual-editor";

  export const translationLoaders: SectionLibraryTranslationLoaders;
}
