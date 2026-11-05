import { describe, expect, it } from "vitest";
import {
  catalog,
  components,
  generationSchema,
} from "./generationTestUtils.ts";

describe("field inference coverage", () => {
  it("covers every authorable field without unknown omissions", () => {
    expect(catalog.fieldOmissions).toEqual([]);
  });
  it("infers supported components and explicitly excludes forms", () => {
    expect(components.FormSection.layoutGenerationMetadata?.exclude).toBe(true);
    expect(catalog.data.components.FormSection.generation).toBeUndefined();
    for (const [name, component] of Object.entries(components)) {
      expect(component.layoutGenerationMetadata?.props, name).toBeUndefined();
      if (name !== "FormSection")
        expect(catalog.data.components[name].generation, name).toBeDefined();
    }
  });
});

describe("custom authoring constraints", () => {
  it("keeps inherited text sizes nullable", () => {
    for (const name of ["BodyText", "Text", "HeaderLinks"]) {
      const props = structuredClone(components[name].defaultProps!);
      props.styles.variant = null;
      expect(generationSchema(name).safeParse(props).success, name).toBe(true);
    }
  });
  it("covers custom CTA colors and directory link overrides", () => {
    const color = {
      selectedColor: "[#FFBBC7]",
      contrastingColor: "black",
      isDarkColor: false,
    };
    const buttons = structuredClone(components.CTAGroup.defaultProps!.buttons);
    buttons[0].textColor = color;
    expect(generationSchema("CTAGroup").safeParse({ buttons }).success).toBe(
      true
    );
    buttons[0].textColor.selectedColor = "#FFBBC7";
    expect(generationSchema("CTAGroup").safeParse({ buttons }).success).toBe(
      false
    );
    const props = structuredClone(components.DirectoryGrid.defaultProps!);
    props.data.mappings.linkOverride = {
      enabled: true,
      normalizeLink: false,
      field: "",
      constantValueEnabled: true,
      constantValue: { defaultValue: "/custom", fr: "/personnalise" },
    };
    expect(generationSchema("DirectoryGrid").safeParse(props).success).toBe(
      true
    );
  });
  it("uses classic/compact hero image ratios and populated Locator icons", () => {
    const props = structuredClone(components.HeroImageSlot.defaultProps!);
    for (const aspectRatio of [2, 3, 4, 0.56]) {
      props.styles.aspectRatio = aspectRatio;
      expect(generationSchema("HeroImageSlot").safeParse(props).success).toBe(
        false
      );
    }
    props.styles.aspectRatio = 1.78;
    expect(generationSchema("HeroImageSlot").safeParse(props).success).toBe(
      true
    );
    const locator = structuredClone(components.Locator.defaultProps!);
    locator.locationStyles = [
      {
        entityType: "location",
        pinIcon: { type: "icon", iconName: "airport" },
      },
    ];
    expect(generationSchema("Locator").safeParse(locator).success).toBe(true);
  });
  it("keeps defaultless utility image content required and managed state excluded", () => {
    const props = structuredClone(
      components.FooterUtilityImagesSlot.defaultProps!
    );
    props.data.utilityImages = [{}];
    expect(
      generationSchema("FooterUtilityImagesSlot").safeParse(props).success
    ).toBe(false);
    expect(generationSchema("ImageSlot").shape).not.toHaveProperty(
      "showImageConstrain"
    );
    expect(generationSchema("FooterLinksSlot").shape).not.toHaveProperty(
      "variant"
    );
  });
});

describe("inferred slotted sources", () => {
  const sourceNames = [
    "FAQSection",
    "EventCardsWrapper",
    "InsightCardsWrapper",
    "ProductCardsWrapper",
    "TeamCardsWrapper",
    "TestimonialCardsWrapper",
  ];

  it.each(sourceNames)(
    "%s accepts bindings and rejects static mapping payloads",
    (name) => {
      const component = components[name] as any;
      const schema = generationSchema(name);
      const props = structuredClone(component.defaultProps!);
      const mappingNames = Object.keys(props.data.mappings);
      const mappings = Object.fromEntries(
        mappingNames.map((key) => [
          key,
          {
            field: key,
            constantValueEnabled: false,
          },
        ])
      );
      props.data = { field: "c_items", constantValueEnabled: false, mappings };
      expect(schema.parse(props).data).toEqual(props.data);

      for (const key of mappingNames) {
        for (const invalid of [
          { field: "", constantValueEnabled: true },
          {
            field: key,
            constantValueEnabled: false,
            constantValue: "Static content",
          },
        ]) {
          expect(
            schema.safeParse({
              ...props,
              data: {
                ...props.data,
                mappings: { ...mappings, [key]: invalid },
              },
            }).success,
            key
          ).toBe(false);
        }
      }

      // Manual source content uses native card children and needs no mappings.
      props.data = { field: "", constantValueEnabled: true };
      const parsed = schema.parse(props) as any;
      expect(parsed.slots.CardSlot).toEqual(props.slots.CardSlot);
      expect(parsed.data).not.toHaveProperty("constantValue");
      expect(
        component.layoutGenerationMetadata?.slottedItemSource
      ).toBeDefined();
      expect(component.fields.data.generation?.schema).toBeUndefined();
      expect(
        component.fields.slots.objectFields.CardSlot.generation?.singleChild
      ).not.toBe(true);
    }
  );

  it("keeps Grid columns variable length", () => {
    const props = structuredClone(components.Grid.defaultProps!);
    const child = {
      type: "Text",
      props: structuredClone(components.Text.defaultProps!),
    };
    for (const children of [[], [child], [child, child]]) {
      props.slots = [{ Column: children }];
      expect(generationSchema("Grid").safeParse(props).success).toBe(true);
    }
  });
});
