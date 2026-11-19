import * as React from "react";
import {
  getThemeColorHexValue,
  useDocument,
  useThemeValue,
  type SurfaceRole,
} from "@yext/visual-editor";
import { pageBackgroundSolidVariable } from "./theme.ts";

export const ThemeSurfaceColors = React.createContext<
  Partial<Record<SurfaceRole, string>>
>({});

export function pageGradientSample(value?: string) {
  return value?.toLowerCase().includes("gradient(")
    ? getThemeColorHexValue(`[${value}]`)
    : undefined;
}

export function ThemeSurfaceProvider({ children }: React.PropsWithChildren) {
  const document = useDocument();
  const page = useThemeValue("--ve-color-background", document);
  const primary = useThemeValue("--ve-color-primary-solid", document);
  const secondary = useThemeValue("--ve-color-secondary-solid", document);
  const accent = useThemeValue("--ve-color-accent-solid", document);
  const muted = useThemeValue("--ve-color-muted-solid", document);
  const pageSample = pageGradientSample(page);
  const colors = React.useMemo(
    () => ({ page, primary, secondary, accent, muted }),
    [page, primary, secondary, accent, muted]
  );
  return (
    <ThemeSurfaceColors.Provider value={colors}>
      {pageSample && (
        <style>{`:root { ${pageBackgroundSolidVariable}: ${pageSample}; }`}</style>
      )}
      {children}
    </ThemeSurfaceColors.Provider>
  );
}
