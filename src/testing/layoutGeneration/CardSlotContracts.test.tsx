import { describe, expect, it } from "vitest";
import { resolveAllData } from "@puckeditor/core";
import { sharedComponentConfigs } from "../../library/shared/componentRegistry.ts";
import { ImageWrapper } from "../../library/sections/ImageWrapper.tsx";
import { Text } from "../../library/sections/Text.tsx";
import { HeadingText } from "../../library/sections/HeadingText.tsx";
import { BodyText } from "../../library/sections/BodyText.tsx";
import { CTAWrapper } from "../../library/sections/CTAWrapper.tsx";

const productAliases: Record<string, string> = {
  ImageSlot: "ImageWrapper",
  BrowSlot: "Text",
  TitleSlot: "HeadingText",
  PriceSlot: "Text",
  DescriptionSlot: "BodyText",
  CTASlot: "CTAWrapper",
};
const components: Record<string, unknown> = {
  ...sharedComponentConfigs,
  ImageWrapper,
  Text,
  HeadingText,
  BodyText,
  CTAWrapper,
};

describe("fixed card slot contracts", () => {
  it("resolves a saved product card using section aliases without changing child types or authored data", async () => {
    const card = structuredClone(
      sharedComponentConfigs.ProductCard.defaultProps!
    ) as any;
    card.id = "product-card";
    for (const [slot, type] of Object.entries(productAliases)) {
      card.slots[slot][0].type = type;
      card.slots[slot][0].props.id = `product-card-${slot}`;
    }
    const before = structuredClone(card);
    const data = {
      root: { props: {} },
      content: [{ type: "ProductCard", props: card }],
    };
    const resolved = await resolveAllData(
      structuredClone(data) as any,
      { components } as any,
      { streamDocument: { locale: "en" } }
    );
    for (const slot of Object.keys(productAliases)) {
      const actual = (resolved.content[0].props as any).slots[slot][0];
      expect(actual.type).toBe(before.slots[slot][0].type);
      expect(actual.props.id).toBe(before.slots[slot][0].props.id);
      expect(actual.props.data).toEqual(before.slots[slot][0].props.data);
    }
    expect(data.content[0].props).toEqual(before);
  });
});
