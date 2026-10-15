import {
  aboutSectionDetailsColumnSchema,
  defaultAboutSectionProps,
} from "../library/shared/sectionSupport/pageSections/AboutSection/AboutSectionDetailsColumn.tsx";
import {
  staticMapSectionSchema,
  StaticMapSection,
} from "../library/sections/StaticMapSection.tsx";
import { describe, expect, it } from "vitest";

describe("generation schema constraints", () => {
  it("accepts every supported About sidebar content type and rejects mismatched content", () => {
    for (const [type, content] of Object.entries(defaultAboutSectionProps)) {
      const section = {
        header: { field: "", constantValue: { defaultValue: "Details" } },
        content: { type, [type]: content },
      };
      expect(() =>
        aboutSectionDetailsColumnSchema.parse({ sections: [section] })
      ).not.toThrow();
      expect(
        aboutSectionDetailsColumnSchema.safeParse({
          sections: [{ ...section, content: { type } }],
        }).success
      ).toBe(false);
    }
  });

  it("rejects unsupported map styles", () => {
    expect(
      staticMapSectionSchema.safeParse({
        ...StaticMapSection.defaultProps,
        styles: { mapStyle: "unsupported" },
      }).success
    ).toBe(false);
  });
});
