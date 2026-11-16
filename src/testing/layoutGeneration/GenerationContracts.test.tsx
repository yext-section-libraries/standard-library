import { describe, expect, it } from "vitest";
import { createPuckGenerationCatalog } from "@yext/visual-editor/section-library-support";
import { PromoSectionBody } from "../../library/sections/PromoSection.tsx";
const legacyPromoSchema = createPuckGenerationCatalog({
  Promo: {
    ...PromoSectionBody,
    defaultProps: { ...PromoSectionBody.defaultProps! },
  },
}).data.components.Promo.generation!.props;
const findNode = (value: any, type: string): any => {
  if (Array.isArray(value))
    return value.map((child) => findNode(child, type)).find(Boolean);
  if (!value || typeof value !== "object") return undefined;
  if (value.type === type && value.props) return value;
  return Object.values(value)
    .map((child) => findNode(child, type))
    .find(Boolean);
};
import directoryLayout from "../../library/layouts/standard-library-directory/defaultLayout.json";
import locatorLayout from "../../library/layouts/standard-library-locator/defaultLayout.json";
import defaultLayout from "../../library/layouts/standard-library/defaultLayout.json";
import {
  authored,
  catalog,
  generationSchema,
  makeLayout,
  resolve,
  sectionNames,
} from "./generationTestUtils.ts";

describe("component-owned generation contracts", () => {
  it.each([defaultLayout, directoryLayout, locatorLayout])(
    "accepts migrated components in saved default layout %#",
    (layout) => {
      const visit = (value: any) => {
        if (!value || typeof value !== "object") return;
        if (
          value.type &&
          value.props &&
          catalog.data.components[value.type]?.generation
        ) {
          expect(
            generationSchema(value.type).safeParse(value.props).success,
            value.type
          ).toBe(true);
        }
        for (const child of Object.values(value)) visit(child);
      };
      visit(layout);
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
      expect(JSON.parse(JSON.stringify(second))).toEqual(
        JSON.parse(JSON.stringify(first))
      );
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
    findNode(props.content, "RichText").props.data.text.constantValue =
      richText;
    findNode(props.content, "Heading").props.data.text = {
      field: "name",
      constantValue: { defaultValue: "Name", fr: "Nom" },
      constantValueEnabled: false,
    };
    findNode(
      props.content,
      "Image"
    ).props.data.image.constantValue.alternateText = {
      defaultValue: "Image",
      fr: "Illustration",
    };
    const description = findNode(props.content, "RichText");
    expect(
      generationSchema(description.type).parse(description.props)
    ).toMatchObject({
      data: { text: { constantValue: richText } },
    });
    const image = findNode(props.content, "Image");
    expect(generationSchema(image.type).safeParse(image.props).success).toBe(
      true
    );
    for (const locale of ["en", "fr"]) {
      const resolved = await resolve(layout, { locale, name: "Entity name" });
      expect(authored(resolved)).toEqual(authored(layout));
    }
  });

  it("keeps bracketed custom color and scalar constraints", () => {
    const props = structuredClone(PromoSectionBody.defaultProps!);
    props.styles.backgroundColor = {
      selectedColor: "[#FFBBC7]",
      contrastingColor: "black",
      isDarkColor: false,
    };
    expect(legacyPromoSchema.safeParse(props).success).toBe(true);
    props.styles.backgroundColor.selectedColor = "#FFBBC7";
    expect(legacyPromoSchema.safeParse(props).success).toBe(false);
    props.styles.backgroundColor.selectedColor = "[#FFBBC7]";
    props.styles.imageHeight = -1;
    expect(legacyPromoSchema.safeParse(props).success).toBe(false);
  });
});
