import { describe, expect, it } from "vitest";
import { resolveAllData } from "@puckeditor/core";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import { ImageWrapper } from "../library/sections/ImageWrapper.tsx";
import { Text } from "../library/sections/Text.tsx";
import { HeadingText } from "../library/sections/HeadingText.tsx";
import { BodyText } from "../library/sections/BodyText.tsx";
import { CTAWrapper } from "../library/sections/CTAWrapper.tsx";
import { Emails } from "../library/sections/Emails.tsx";
import { migrationRegistry } from "../library/migrations/registry.ts";

const expected: Record<string, Record<string, string[]>> = {
  ProductCard: {
    ImageSlot: ["ImageSlot", "ImageWrapper"],
    BrowSlot: ["TextSlot", "Text"],
    TitleSlot: ["HeadingTextSlot", "HeadingText"],
    PriceSlot: ["TextSlot", "Text"],
    DescriptionSlot: ["BodyTextSlot", "BodyText"],
    CTASlot: ["CTASlot", "CTAWrapper"],
  },
  EventCard: {
    ImageSlot: ["ImageSlot", "ImageWrapper"],
    TitleSlot: ["HeadingTextSlot", "HeadingText"],
    DateTimeSlot: ["Timestamp"],
    DescriptionSlot: ["BodyTextSlot", "BodyText"],
    CTASlot: ["CTASlot", "CTAWrapper"],
  },
  InsightCard: {
    ImageSlot: ["ImageSlot", "ImageWrapper"],
    TitleSlot: ["HeadingTextSlot", "HeadingText"],
    CategorySlot: ["TextSlot", "Text"],
    DescriptionSlot: ["BodyTextSlot", "BodyText"],
    PublishTimeSlot: ["Timestamp"],
    CTASlot: ["CTASlot", "CTAWrapper"],
  },
  TeamCard: {
    ImageSlot: ["ImageSlot", "ImageWrapper"],
    NameSlot: ["HeadingTextSlot", "HeadingText"],
    TitleSlot: ["TextSlot", "Text"],
    PhoneSlot: ["PhoneNumbersSlot"],
    EmailSlot: ["EmailsSlot", "Emails"],
    CTASlot: ["CTASlot", "CTAWrapper"],
  },
  TestimonialCard: {
    DescriptionSlot: ["BodyTextSlot", "BodyText"],
    ContributorNameSlot: ["HeadingTextSlot", "HeadingText"],
    ContributionDateSlot: ["Timestamp"],
  },
};
const components: Record<string, unknown> = {
  ...sharedComponentConfigs,
  ImageWrapper,
  Text,
  HeadingText,
  BodyText,
  CTAWrapper,
  Emails,
};

describe("fixed card slot contracts", () => {
  it.each(Object.entries(expected))(
    "declares native and compatible aliases for %s",
    (type, slots) => {
      const component = sharedComponentConfigs[type];
      const fields = (component.fields!.slots as any).objectFields;
      const defaults = component.defaultProps!.slots as Record<string, any[]>;
      expect(Object.keys(fields).sort()).toEqual(Object.keys(slots).sort());
      for (const [slot, types] of Object.entries(slots)) {
        expect(fields[slot].allow).toEqual(types);
        expect(defaults[slot].map((child) => child.type)).toEqual([types[0]]);
        if (types.length > 1) {
          expect(components[types[0]]).toBe(components[types[1]]);
        }
      }
    }
  );

  it("resolves a saved product card using section aliases without changing child types or authored data", async () => {
    const card = structuredClone(
      sharedComponentConfigs.ProductCard.defaultProps!
    ) as any;
    card.id = "product-card";
    for (const [slot, types] of Object.entries(expected.ProductCard)) {
      card.slots[slot][0].type = types[1];
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
    for (const slot of Object.keys(expected.ProductCard)) {
      const actual = (resolved.content[0].props as any).slots[slot][0];
      expect(actual.type).toBe(before.slots[slot][0].type);
      expect(actual.props.id).toBe(before.slots[slot][0].props.id);
      expect(actual.props.data).toEqual(before.slots[slot][0].props.data);
    }
    expect(data.content[0].props).toEqual(before);
  });

  it("preserves arbitrary saved child values in the new migration", () => {
    const props = {
      slots: {
        ImageSlot: [
          { type: "CustomLegacyImage", props: { id: "old", content: "keep" } },
        ],
      },
    };
    const migration = (migrationRegistry[2] as any)["*"];
    expect(migration.action).toBe("updated");
    expect(migration.propTransformation(props, {})).toBe(props);
  });
});
