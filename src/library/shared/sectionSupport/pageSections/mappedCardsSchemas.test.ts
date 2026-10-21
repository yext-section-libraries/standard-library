import { describe, expect, it } from "vitest";
import { z } from "zod";
import { cardsWrapperSchema, textMapping } from "./mappedCardsSchemas.ts";

const schema = cardsWrapperSchema({ name: textMapping }, {});
const manualCard = { type: "ProductCard", props: { slots: {} } };
const staticMapping = {
  name: {
    field: "",
    constantValue: "Manual product",
    constantValueEnabled: true,
  },
};

describe("card wrapper generation", () => {
  it("accepts manual content in CardSlot", () => {
    const props = {
      data: { field: "", constantValueEnabled: true },
      styles: {},
      slots: { CardSlot: [manualCard] },
    };

    expect(schema.parse(props)).toEqual(props);
  });

  it.each([true, false])(
    "rejects static mappings with source mode %j",
    (constantValueEnabled) => {
      expect(
        schema.safeParse({
          data: {
            field: "",
            constantValueEnabled,
            mappings: staticMapping,
          },
          styles: {},
          slots: { CardSlot: [] },
        }).success
      ).toBe(false);
    }
  );

  it("keeps the object and primitive types required by slottedItemSource", () => {
    const data = schema.shape.data;

    expect(data).toBeInstanceOf(z.ZodObject);
    expect(data.shape.field).toBeInstanceOf(z.ZodString);
    expect(data.shape.constantValueEnabled).toBeInstanceOf(z.ZodBoolean);
    expect(Object.keys(data.shape)).not.toContain("constantValue");
    expect(data.def.catchall).toBeUndefined();
  });

  it("preserves mappings for entity-linked cards", () => {
    const props = {
      data: {
        field: "c_products",
        constantValueEnabled: false,
        mappings: { name: { field: "name", constantValueEnabled: false } },
      },
      styles: {},
      slots: { CardSlot: [] },
    };

    expect(schema.parse(props)).toEqual(props);
  });
});
