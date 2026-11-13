import { sections } from "./layoutGeneration/generationTestUtils.ts";
import { describe, expect, it } from "vitest";
import { consolidateBackgroundProps } from "../library/migrations/0007_unified_backgrounds.ts";

describe("unified background migration", () => {
  it("preserves explicit colors, metadata, and content ahead of the old surface", () => {
    const color = {
      selectedColor: "[#112233]",
      contrastingColor: "white",
      isDarkColor: true,
    };
    const before = {
      id: "hero",
      data: { surface: "untouched" },
      styles: { surface: "primary", backgroundColor: color, align: "center" },
    };
    const result = consolidateBackgroundProps("HeroSection", before);
    expect(result).toEqual({
      id: "hero",
      data: { surface: "untouched" },
      styles: { backgroundColor: color, align: "center" },
    });
    expect(before.styles.surface).toBe("primary");
    expect(consolidateBackgroundProps("HeroSection", result)).toEqual(result);
  });
  it("uses the selected variant when the old color is Default", () => {
    expect(
      consolidateBackgroundProps("HeroSection", {
        styles: {
          surface: "accent",
          backgroundColor: {
            selectedColor: "default",
            contrastingColor: "default",
          },
        },
      })
    ).toEqual({ styles: { backgroundColor: "accent" } });
  });
  it("removes section inheritance while keeping it available for nested content", () => {
    expect(
      consolidateBackgroundProps("TeamSection", {
        styles: { surface: "inherit" },
      })
    ).toEqual({ styles: { backgroundColor: "muted" } });
    expect(
      consolidateBackgroundProps("DirectoryCard", {
        styles: { surface: "inherit" },
      })
    ).toEqual({ styles: { backgroundColor: "inherit" } });
  });
  it("retains old phone icon colors while keeping the link color separate", () => {
    const color = { selectedColor: "black", contrastingColor: "white" };
    expect(
      consolidateBackgroundProps("PhoneSlot", {
        styles: { surface: "accent", color },
      })
    ).toEqual({ styles: { backgroundColor: color, color } });
    expect(
      consolidateBackgroundProps("Phone", {
        styles: { backgroundColor: "accent", color },
      })
    ).toEqual({ styles: { backgroundColor: "accent", color } });
  });
  it("handles independent directory and footer backgrounds and Grid's top-level props", () => {
    expect(
      consolidateBackgroundProps("Directory", {
        styles: { surface: "primary", listSurface: "muted" },
      })
    ).toEqual({
      styles: { backgroundColor: "primary", listBackgroundColor: "muted" },
    });
    expect(
      consolidateBackgroundProps("ExpandedFooter", {
        styles: { primaryFooter: { surface: "inherit" } },
      })
    ).toEqual({ styles: { primaryFooter: { backgroundColor: "primary" } } });
    expect(
      consolidateBackgroundProps("Grid", { surface: "accent", columns: 2 })
    ).toEqual({ backgroundColor: "accent", columns: 2 });
  });
});

it("exposes one background field without inheritance on page sections", () => {
  let backgrounds = 0;
  for (const [name, component] of Object.entries(sections)) {
    if (name === "Phone") continue; // Its surface styles a nested icon, not a page section.
    const visit = (fields: Record<string, any>) => {
      for (const [key, field] of Object.entries(fields)) {
        if (field.type === "surface") {
          expect(["backgroundColor", "listBackgroundColor"], name).toContain(
            key
          );
          expect(field.allowInherit, name).toBe(false);
          backgrounds++;
        }
        if (field.objectFields) visit(field.objectFields);
        if (field.arrayFields) visit(field.arrayFields);
      }
    };
    visit(component.fields ?? {});
  }
  expect(backgrounds).toBeGreaterThan(15);
});
