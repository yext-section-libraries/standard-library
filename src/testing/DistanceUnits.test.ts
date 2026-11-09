import { describe, expect, it, vi } from "vitest";
import {
  getDistanceUnit,
  getMapboxCountryCode,
  type DistanceUnit,
  type DistanceUnitOption,
} from "../library/shared/sectionSupport/locator/DistanceUnits.ts";

vi.mock("@yext/visual-editor/section-library-support", () => ({
  getPreferredDistanceUnit: (language: string) =>
    language === "en-GB" ? "mile" : "kilometer",
}));

describe("locator distance units", () => {
  const cases: Array<{
    name: string;
    option?: DistanceUnitOption;
    visitorCountryCode?: string;
    browserLanguage?: string;
    pageLanguage: string;
    expected: DistanceUnit;
  }> = [
    {
      name: "uses an explicit miles setting",
      option: "mile",
      visitorCountryCode: "CA",
      browserLanguage: "en-CA",
      pageLanguage: "fr-CA",
      expected: "mile",
    },
    {
      name: "uses an explicit kilometers setting",
      option: "kilometer",
      visitorCountryCode: "US",
      browserLanguage: "en-US",
      pageLanguage: "en-US",
      expected: "kilometer",
    },
    {
      name: "uses miles for a US visitor",
      option: "auto",
      visitorCountryCode: "us",
      browserLanguage: "en-CA",
      pageLanguage: "fr-CA",
      expected: "mile",
    },
    {
      name: "uses kilometers for a Canadian visitor",
      option: "auto",
      visitorCountryCode: "ca",
      browserLanguage: "en-US",
      pageLanguage: "en-US",
      expected: "kilometer",
    },
    {
      name: "uses kilometers for a French visitor on a British English page",
      option: "auto",
      visitorCountryCode: "FR",
      pageLanguage: "en-GB",
      expected: "kilometer",
    },
    {
      name: "uses miles for a British visitor on a French page",
      option: "auto",
      visitorCountryCode: "GB",
      pageLanguage: "fr-CA",
      expected: "mile",
    },
    {
      name: "falls back to the browser region when location is unavailable",
      option: "auto",
      browserLanguage: "en-CA",
      pageLanguage: "en-US",
      expected: "kilometer",
    },
    {
      name: "falls back to the page language when the region is unknown",
      option: "auto",
      browserLanguage: "en",
      pageLanguage: "fr-CA",
      expected: "kilometer",
    },
    {
      name: "preserves page-language behavior when the setting is absent",
      visitorCountryCode: "US",
      browserLanguage: "en-US",
      pageLanguage: "fr-CA",
      expected: "kilometer",
    },
    {
      name: "uses page language when explicitly selected",
      option: "locale",
      visitorCountryCode: "CA",
      browserLanguage: "en-CA",
      pageLanguage: "en-GB",
      expected: "mile",
    },
  ];

  it.each(cases)("$name", (testCase) => {
    expect(
      getDistanceUnit(
        testCase.option,
        testCase.visitorCountryCode,
        testCase.browserLanguage,
        testCase.pageLanguage
      )
    ).toBe(testCase.expected);
  });

  it("reads the country code from a Mapbox country result", () => {
    expect(
      getMapboxCountryCode({
        features: [{ properties: { short_code: "ca" } }],
      })
    ).toBe("ca");
  });
});
