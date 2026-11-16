import {
  inheritParagraphDefaults,
  bodyTextDefaults,
} from "../library/shared/design/textInheritance.ts";
import { designDefaults } from "../library/migrations/0006_design_defaults.ts";
import { describe, expect, it } from "vitest";
import { upgradeResponsiveDesign } from "../library/shared/design/upgradeResponsiveDesign.ts";

describe("Design defaults migration", () => {
  it("moves the old desktop design into Design and keeps a single-column mobile exception", () => {
    const old = {
      id: "columns",
      layout: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)" },
      responsive: {
        tablet: {
          layout: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        },
        desktop: {
          layout: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
        },
      },
    };
    const result = upgradeResponsiveDesign(old);
    expect(result.layout.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))");
    expect(result.responsive).toEqual({
      mobile: { layout: { gridTemplateColumns: "minmax(0, 1fr)" } },
    });
    expect(old.layout.gridTemplateColumns).toBe("minmax(0, 1fr)");
  });
  it("preserves authored tablet exceptions without letting them affect desktop or mobile", () => {
    const result = upgradeResponsiveDesign({
      layout: { width: "100%" },
      responsive: {
        tablet: { layout: { width: "70%" } },
        desktop: { layout: { width: "50%" } },
      },
    });
    expect(result.layout.width).toBe("50%");
    expect(result.responsive).toEqual({
      tablet: { layout: { width: "70%" } },
      mobile: { layout: { width: "100%" } },
    });
  });
  it("does not change the new format or properties without responsive styles", () => {
    const value = {
      layout: { width: "100%" },
      responsive: { mobile: { layout: { width: "80%" } } },
    };
    expect(upgradeResponsiveDesign(value)).toBe(value);
    const plain = { id: "text", data: { text: "hello" } };
    expect(upgradeResponsiveDesign(plain)).toBe(plain);
  });
});

it("keeps localized static text and the Yext binding when moving headings to plain text editing", () => {
  const value = designDefaults.Heading.propTransformation({
    id: "heading",
    data: {
      text: {
        field: "c_headline",
        constantValueEnabled: true,
        constantValue: {
          defaultValue: { html: "<p>Saved <strong>heading</strong></p>" },
          fr: { html: "<p>Bonjour</p>" },
          hasLocalizedValue: "true",
        },
      },
    },
  });
  expect(value.data.text).toEqual({
    field: "c_headline",
    constantValueEnabled: true,
    constantValue: {
      defaultValue: "Saved heading",
      fr: "Bonjour",
      hasLocalizedValue: "true",
    },
  });
});

it("removes automatic paragraph font defaults while preserving authored styling", () => {
  const result = inheritParagraphDefaults({
    id: "paragraph",
    typography: { ...bodyTextDefaults, color: "red", fontWeight: "700" },
  });
  expect(result.typography).toEqual({ color: "red", fontWeight: "700" });
});
