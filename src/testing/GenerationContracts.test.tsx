import defaultLayout from "../library/layouts/standard-library/defaultLayout.json";
import directoryLayout from "../library/layouts/standard-library-directory/defaultLayout.json";
import locatorLayout from "../library/layouts/standard-library-locator/defaultLayout.json";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { PromoSection } from "../library/sections/PromoSection.tsx";
import {
  components,
  sectionNames,
  makeLayout,
  authored,
  resolve,
} from "./generationTestUtils.ts";
import { backgroundColorSchema } from "../library/shared/generation/colors.ts";
import {
  translatableRichTextSchema,
  imageSchema,
} from "../library/shared/generation/data.ts";

// Audit actual native defaults and registered hidden children, not duplicated schemas.
const audit = (item: any, checkFixedSlots = false) => {
  const component = components[item.type];
  expect(component.layoutGenerationMetadata, item.type).toBeDefined();
  const schema = component.layoutGenerationMetadata!.props;
  expect(schema.safeParse(item.props).success, item.type).toBe(true);
  for (const key of [
    "id",
    "puck",
    "readOnly",
    "parentData",
    "parentStyles",
    "parentValues",
    "conditionalRender",
    "ignoreLocaleWarning",
    "eventName",
  ]) {
    expect(schema.shape, item.type).not.toHaveProperty(key);
  }
  for (const [name, items] of Object.entries(item.props.slots ?? {})) {
    const field = (component.fields!.slots as any).objectFields[name];
    const slotSchema = (schema.shape.slots as z.ZodObject).shape[
      name
    ] as z.ZodArray;
    // The saved layouts also contain variable-length card and grid slots.
    // Only the section fixtures below have exclusively fixed child slots.
    if (checkFixedSlots) {
      expect(slotSchema.safeParse([{}]).success).toBe(true);
      expect(slotSchema.safeParse([]).success).toBe(false);
      expect(slotSchema.safeParse([{}, {}]).success).toBe(false);
    }
    for (const child of items as any[]) {
      if (field.allow) expect(field.allow).toContain(child.type);
      audit(child, checkFixedSlots);
    }
  }
};

describe("component-owned generation contracts", () => {
  it.each([defaultLayout, directoryLayout, locatorLayout])(
    "accepts migrated components in saved default layout %#",
    (layout) => {
      const visit = (value: any) => {
        if (!value || typeof value !== "object") return;
        if (
          value.type &&
          value.props &&
          components[value.type]?.layoutGenerationMetadata
        )
          audit(value);
        for (const child of Object.values(value)) visit(child);
      };
      visit(layout);
    }
  );

  it.each(sectionNames)(
    "audits authored defaults and reachable contracts for %s",
    (name) => {
      audit(makeLayout(name).content[0], true);
    }
  );

  it.each(sectionNames)(
    "preserves authored extraction through repeated resolution for %s",
    async (name) => {
      const layout = makeLayout(name);
      const baseline = authored(layout);
      const first = await resolve(layout, { locale: "en" });
      const second = await resolve(first, { locale: "en" });
      expect(authored(first)).toEqual(baseline);
      expect(authored(second)).toEqual(baseline);
      expect(second).toEqual(first);
    }
  );

  it("preserves localized text, rich text, image alt text, and entity bindings", async () => {
    const layout = makeLayout("PromoSection");
    const props = layout.content[0].props;
    const richText = {
      defaultValue: { html: "<p>Offer</p>", json: "{}" },
      fr: { html: "<p>Offre</p>" },
      hasLocalizedValue: "true",
    };
    props.slots.DescriptionSlot[0].props.data.text.constantValue = richText;
    props.slots.HeadingSlot[0].props.data.text = {
      field: "name",
      constantValue: { defaultValue: "Name", fr: "Nom" },
      constantValueEnabled: false,
    };
    props.slots.ImageSlot[0].props.data.image.constantValue.alternateText = {
      defaultValue: "Image",
      fr: "Illustration",
    };
    expect(translatableRichTextSchema.parse(richText)).toEqual(richText);
    expect(
      imageSchema.safeParse(
        props.slots.ImageSlot[0].props.data.image.constantValue
      ).success
    ).toBe(true);
    for (const locale of ["en", "fr"]) {
      const resolved = await resolve(layout, { locale, name: "Entity name" });
      expect(authored(resolved)).toEqual(authored(layout));
    }
  });

  it("keeps bracketed custom color and scalar constraints", () => {
    expect(
      backgroundColorSchema.safeParse({
        selectedColor: "[#FFBBC7]",
        contrastingColor: "black",
        isDarkColor: false,
      }).success
    ).toBe(true);
    expect(
      backgroundColorSchema.safeParse({
        selectedColor: "#FFBBC7",
        contrastingColor: "black",
        isDarkColor: false,
      }).success
    ).toBe(false);
    const props = makeLayout("PromoSection").content[0].props;
    props.styles.imageHeight = -1;
    expect(
      PromoSection.layoutGenerationMetadata!.props.safeParse(props).success
    ).toBe(false);
  });
});
