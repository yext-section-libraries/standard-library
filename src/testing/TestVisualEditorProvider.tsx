import * as React from "react";
import { SectionLibraryVisualEditorProvider } from "@yext/visual-editor/section-library-support";
import type { TranslationDictionary } from "@yext/visual-editor";
import { translationLoaders } from "virtual:section-library-i18n";

type TemplateProps = {
  document?: Record<string, any>;
  [key: string]: any;
};

type VisualEditorProviderProps = {
  templateProps: TemplateProps;
  children: React.ReactNode;
};

const pageTranslations = new Map<string, TranslationDictionary>();
const preservedRegionalLocales = new Set(["en-GB", "zh-TW"]);

await Promise.all(
  Object.entries(translationLoaders.page).map(async ([locale, loader]) => {
    if (loader) {
      pageTranslations.set(locale, await loader());
    }
  })
);

const normalizeLocale = (locale: unknown): string => {
  if (typeof locale !== "string") {
    return "en";
  }

  try {
    const canonicalLocale = Intl.getCanonicalLocales(
      locale.replaceAll("_", "-")
    )[0];
    if (!canonicalLocale) {
      return "en";
    }
    if (canonicalLocale.includes("zh-Hant")) {
      return "zh-TW";
    }
    return preservedRegionalLocales.has(canonicalLocale)
      ? canonicalLocale
      : canonicalLocale.split("-")[0];
  } catch {
    return "en";
  }
};

/**
 * Mirrors the generated section-library runtime used by production builds.
 * Generated dictionaries already contain the built-in translations merged
 * with this repository's translations, with repository values taking priority.
 */
export const VisualEditorProvider = ({
  templateProps,
  children,
}: VisualEditorProviderProps) => {
  const document = {
    locale: "en",
    ...templateProps.document,
  };
  const locale = normalizeLocale(document.locale);
  const translations =
    pageTranslations.get(locale) ?? pageTranslations.get("en") ?? {};

  return (
    <SectionLibraryVisualEditorProvider
      templateProps={{
        ...templateProps,
        document,
        translations,
      }}
      translationLoaders={translationLoaders}
    >
      {children}
    </SectionLibraryVisualEditorProvider>
  );
};
