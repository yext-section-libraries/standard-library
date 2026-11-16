import { designVariable } from "../library/shared/design/styleVariables.ts";
import { describe, expect, it } from "vitest";
import { designStyle, safeCssValue } from "../library/shared/design/styles.ts";
import { safeLink } from "../library/shared/design/content.tsx";

describe("authored style values", () => {
  it("keeps token fallbacks and CSS expressions", () => {
    for (const value of [
      "var(--brand, #2563eb)",
      "clamp(1rem, 5vw, 4rem)",
      "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
      "linear-gradient(90deg, #fff, #000)",
    ]) {
      expect(safeCssValue(value)).toBe(value);
    }
  });

  it("rejects declaration and markup injection", () => {
    for (const value of [
      "red;display:none",
      "red}body{display:none",
      "</style><script>alert(1)</script>",
      "expression(alert(1))",
      "url(javascript:alert(1))",
      "red!important",
      "red/*comment*/",
    ]) {
      expect(safeCssValue(value)).toBeUndefined();
    }
  });

  it("ignores unknown properties and leaves cleared overrides to the CSS cascade", () => {
    const style = designStyle({
      layout: { width: "80%", minWidth: "10rem" },
      responsive: {
        tablet: { layout: { width: "60%" } },
        mobile: { layout: { width: "" } },
      },
      surface: { backgroundColor: "red;display:none" },
    });
    expect(style).toMatchObject({
      [designVariable("base", "width")]: "80%",
      [designVariable("base", "min-width")]: "10rem",
      [designVariable("tablet", "width")]: "60%",
    });
    expect(style).not.toHaveProperty(designVariable("mobile", "width"));
    expect(style).not.toHaveProperty(
      designVariable("base", "background-color")
    );
    expect(style).not.toHaveProperty("minWidth");
  });

  it("keeps hidden blocks selectable only in the editor", () => {
    expect(designStyle({ layout: { display: "none" } })).toHaveProperty(
      designVariable("base", "display"),
      "none"
    );
    expect(designStyle({ layout: { display: "none" } }, true)).toHaveProperty(
      designVariable("base", "display"),
      "revert"
    );
  });
});

describe("links", () => {
  it("allows page anchors, relative URLs, email, phone and web URLs", () => {
    for (const value of [
      "#contact",
      "/locations",
      "../about",
      "https://example.com/a",
      "mailto:hello@example.com",
      "tel:+12125550123",
    ])
      expect(safeLink(value)).toBe(value);
  });
  it("rejects executable protocols and control characters", () => {
    for (const value of [
      "javascript:alert(1)",
      "java\nscript:alert(1)",
      "data:text/html,test",
      "file:///etc/passwd",
      "",
    ])
      expect(safeLink(value)).toBeUndefined();
  });
});
