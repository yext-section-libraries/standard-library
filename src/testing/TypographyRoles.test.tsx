import { describe, expect, it } from "vitest";
import { typographyRoleOptions } from "@yext/visual-editor/section-library-support";
import { generationSchema } from "./layoutGeneration/generationTestUtils.ts";
import { LocatorResultCardFields } from "../library/shared/sectionSupport/locator/LocatorResultCard.tsx";

const roles = [
  "headline",
  "section-title",
  "card-title",
  "eyebrow",
  "body-small",
  "body",
  "body-large",
];

describe("unified typography roles", () => {
  it.each(["BodyTextSlot", "TextSlot", "HoursStatusSlot", "HeaderLinks"])(
    "offers one role selector on %s",
    (name) => {
      const schema = generationSchema(name).shape.styles.shape;
      expect(schema).toHaveProperty("typographyRole");
      expect(schema).not.toHaveProperty("variant");
      expect(schema).not.toHaveProperty("bodyVariant");
    }
  );

  it("offers independent FAQ roles and locator supporting-heading roles", () => {
    const faq = generationSchema("FAQCard").shape.styles.shape;
    expect(faq).toHaveProperty("questionTypographyRole");
    expect(faq).toHaveProperty("answerTypographyRole");
    expect(faq).not.toHaveProperty("questionVariant");
    expect(faq).not.toHaveProperty("answerVariant");
    for (const heading of ["secondaryHeading", "tertiaryHeading"] as const) {
      const fields = LocatorResultCardFields.objectFields[heading];
      expect(fields).toHaveProperty("objectFields.typographyRole");
      expect(fields).not.toHaveProperty("objectFields.variant");
    }
    expect(typographyRoleOptions.map((option) => option.value)).toEqual(roles);
  });
});
