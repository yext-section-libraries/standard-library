import { getPreferredDistanceUnit } from "@yext/visual-editor/section-library-support";

export type DistanceUnit = "mile" | "kilometer";
export type DistanceUnitOption = "auto" | "locale" | DistanceUnit;

export const getDistanceUnit = (
  option: DistanceUnitOption | undefined,
  visitorCountryCode: string | undefined,
  browserLanguage: string | undefined,
  pageLanguage: string
): DistanceUnit => {
  if (option === "mile" || option === "kilometer") {
    return option;
  }
  if (option === "locale" || option === undefined) {
    return getPreferredDistanceUnit(pageLanguage);
  }

  const browserCountryCode = browserLanguage
    ? new Intl.Locale(browserLanguage).region
    : undefined;
  const countryCode = visitorCountryCode ?? browserCountryCode;
  if (countryCode?.toUpperCase() === "US") {
    return "mile";
  }
  if (countryCode) {
    return getPreferredDistanceUnit(`en-${countryCode.toUpperCase()}`);
  }

  return getPreferredDistanceUnit(pageLanguage);
};

export const getMapboxCountryCode = (data: {
  features?: Array<{ properties?: { short_code?: string } }>;
}): string | undefined => data.features?.[0]?.properties?.short_code;
