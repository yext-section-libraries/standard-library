import { describe, expect, it } from "vitest";
import { z } from "zod";
import { resolveAllData } from "@puckeditor/core";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import { toPuckFields } from "@yext/visual-editor";
import {
  EventCardsWrapper,
  eventCardsSource,
} from "../library/shared/sectionSupport/pageSections/EventSection/EventCardsWrapper.tsx";
import {
  InsightCardsWrapper,
  insightCardsSource,
} from "../library/shared/sectionSupport/pageSections/InsightSection/InsightCardsWrapper.tsx";
import {
  TeamCardsWrapper,
  teamCardsSource,
} from "../library/shared/sectionSupport/pageSections/TeamSection/TeamCardsWrapper.tsx";
import {
  TestimonialCardsWrapper,
  testimonialCardsSource,
} from "../library/shared/sectionSupport/pageSections/TestimonialSection/TestimonialCardsWrapper.tsx";
import {
  ProductCardsWrapper,
  productCardsSource,
} from "../library/shared/sectionSupport/pageSections/ProductSection/ProductCardsWrapper.tsx";

// Use the real registry so hidden child contracts are checked as well as sections.
const modules = import.meta.glob("../library/sections/*.tsx", {
  eager: true,
}) as Record<string, Record<string, any>>;
const sections: Record<string, any> = Object.fromEntries(
  Object.values(modules)
    .filter((m) => m.config && !["Directory", "Locator"].includes(m.config.id))
    .map((m) => [
      m.config.id,
      m[Object.keys(m).find((key) => key !== "config" && m[key]?.fields)!],
    ])
);
const components: Record<string, any> = {
  ...sections,
  ...sharedComponentConfigs,
};
const config = {
  components: Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      {
        ...component,
        fields: component.fields ? toPuckFields(component.fields) : undefined,
      },
    ])
  ),
};
const copy = <T,>(value: T): T => structuredClone(value);
const sources = [
  {
    name: "Event",
    wrapper: EventCardsWrapper,
    source: eventCardsSource,
    titleSlot: "TitleSlot",
  },
  {
    name: "Insight",
    wrapper: InsightCardsWrapper,
    source: insightCardsSource,
    titleSlot: "TitleSlot",
  },
  {
    name: "Team",
    wrapper: TeamCardsWrapper,
    source: teamCardsSource,
    titleSlot: "NameSlot",
  },
  {
    name: "Testimonial",
    wrapper: TestimonialCardsWrapper,
    source: testimonialCardsSource,
    titleSlot: "ContributorNameSlot",
  },
  {
    name: "Product",
    wrapper: ProductCardsWrapper,
    source: productCardsSource,
    titleSlot: "TitleSlot",
  },
];
const document = { locale: "en" };
const withIds = (node: any, prefix: string): any => ({
  ...copy(node),
  props: {
    ...copy(node.props),
    id: prefix,
    ...(node.props.slots
      ? {
          slots: Object.fromEntries(
            Object.entries(node.props.slots).map(([slot, children]) => [
              slot,
              (children as any[]).map((child, index) =>
                withIds(child, `${prefix}-${slot}-${index}`)
              ),
            ])
          ),
        }
      : {}),
  },
});
async function resolve(
  name: string,
  props: any,
  streamDocument: any = document
) {
  const result = await resolveAllData(
    { root: { props: {} }, content: [{ type: name, props }] } as any,
    config as any,
    { streamDocument }
  );
  return result.content[0].props as any;
}

describe("remaining generation contracts", () => {
  it.each(Object.entries(sections))(
    "%s exposes an authored schema",
    (_name, component) => {
      expect(component.layoutGenerationMetadata?.props).toBeDefined();
    }
  );

  it.each(
    Object.entries(components).filter(([, c]) => c.layoutGenerationMetadata)
  )("%s accepts defaults and serializes to JSON Schema", (_name, component) => {
    expect(
      component.layoutGenerationMetadata.props.safeParse(component.defaultProps)
    ).toMatchObject({ success: true });
    expect(() =>
      z.toJSONSchema(component.layoutGenerationMetadata.props)
    ).not.toThrow();
  });

  it.each(sources)(
    "$name requires exactly one child in every fixed card slot, including hidden content",
    ({ source }) => {
      const card = components[source.generationMetadata.cardType];
      const schema = card.layoutGenerationMetadata.props;
      const defaults = copy(card.defaultProps);
      expect(schema.safeParse(defaults).success).toBe(true);
      for (const [slot, children] of Object.entries(defaults.slots)) {
        expect(children).toHaveLength(1);
        for (const replacement of [
          [],
          [...(children as any[]), ...(children as any[])],
        ]) {
          expect(
            schema.safeParse({
              ...defaults,
              slots: { ...defaults.slots, [slot]: replacement },
            }).success
          ).toBe(false);
        }
      }
    }
  );

  it.each(sources)(
    "$name declares the helper metadata and omits managed state",
    ({ name, wrapper, source }) => {
      expect(wrapper.layoutGenerationMetadata?.slottedItemSource).toBe(
        source.generationMetadata
      );
      expect(source.generationMetadata.cardType).toBe(`${name}Card`);
      const authored = wrapper.layoutGenerationMetadata!.props.parse(
        wrapper.defaultProps
      ) as any;
      expect(authored.data).not.toHaveProperty("constantValue");
      expect(authored).not.toHaveProperty("manualSlots");
      expect(authored).not.toHaveProperty("conditionalRender");
      const card = components[source.generationMetadata.cardType];
      expect(card.layoutGenerationMetadata.props.shape).not.toHaveProperty(
        "index"
      );
      expect(card.layoutGenerationMetadata.props.shape).not.toHaveProperty(
        "id"
      );
    }
  );

  it.each(sources)(
    "$name preserves ordered manual cards, localized content, and styles",
    async ({ name, wrapper, source, titleSlot }) => {
      const defaultProps = source.generationMetadata.defaultItemProps;
      const makeCard = (id: string) =>
        withIds(
          {
            type: source.generationMetadata.cardType,
            props:
              typeof defaultProps === "function"
                ? defaultProps()
                : defaultProps,
          },
          id
        );
      const first = makeCard("first");
      first.props.slots[titleSlot][0].props.data.text.constantValue = {
        defaultValue: "Generated title",
        es: "Título generado",
      };
      first.props.slots[titleSlot][0].props.styles.align = "right";
      const cards = [makeCard("second"), first];
      const props = await resolve(`${name}CardsWrapper`, {
        ...copy(wrapper.defaultProps),
        id: "wrapper",
        data: {
          ...copy(source.defaultValue),
          constantValueEnabled: true,
          constantValue: cards.map((c) => ({ id: c.props.id })),
        },
        slots: { CardSlot: cards },
        manualSlots: { CardSlot: copy(cards) },
      });
      expect(props.slots.CardSlot.map((c: any) => c.props.id)).toEqual([
        "second",
        "first",
      ]);
      const title = props.slots.CardSlot[1].props.slots[titleSlot][0].props;
      expect(title.data.text.constantValue).toEqual({
        defaultValue: "Generated title",
        es: "Título generado",
      });
      expect(title.styles.align).toBe("right");
      expect(props.manualSlots.CardSlot).toHaveLength(2);
    }
  );

  it.each(sources)(
    "$name resolves the library default card selection",
    async ({ name, wrapper, source }) => {
      const props = await resolve(`${name}CardsWrapper`, {
        ...copy(wrapper.defaultProps),
        id: "default-wrapper",
      });
      expect(props.slots.CardSlot).toHaveLength(3);
      expect(
        props.slots.CardSlot.every(
          (card: any) => card.type === source.generationMetadata.cardType
        )
      ).toBe(true);
      expect(props.data.constantValue).toEqual(
        props.slots.CardSlot.map((card: any) => ({ id: card.props.id }))
      );
    }
  );

  it.each(sources)(
    "$name respects an explicit empty manual list",
    async ({ name, wrapper, source }) => {
      const props = await resolve(`${name}CardsWrapper`, {
        ...copy(wrapper.defaultProps),
        id: "empty-wrapper",
        data: {
          ...copy(source.defaultValue),
          constantValueEnabled: true,
          constantValue: [],
        },
        slots: { CardSlot: [] },
        manualSlots: { CardSlot: [] },
      });
      expect(props.slots.CardSlot).toEqual([]);
      expect(props.data.constantValue).toEqual([]);
    }
  );

  it.each(sources)(
    "$name resolves linked mappings into library cards",
    async ({ name, wrapper, source, titleSlot }) => {
      const mappingKey =
        name === "Event"
          ? "title"
          : name === "Testimonial"
            ? "contributorName"
            : "name";
      const props = await resolve(
        `${name}CardsWrapper`,
        {
          ...copy(wrapper.defaultProps),
          id: "linked-wrapper",
          data: {
            ...copy(source.defaultValue),
            field: "c_items",
            constantValueEnabled: false,
            mappings: {
              ...copy(source.defaultValue.mappings),
              [mappingKey]: {
                field: "c_title",
                constantValue: "",
                constantValueEnabled: false,
              },
            },
          },
          slots: { CardSlot: [] },
        },
        { ...document, c_items: [{ c_title: "Linked title" }] }
      );
      expect(props.slots.CardSlot).toHaveLength(1);
      const card = props.slots.CardSlot[0];
      expect(card.type).toBe(source.generationMetadata.cardType);
      expect(card.props.slots[titleSlot][0].props.parentData.text).toBe(
        "Linked title"
      );
    }
  );
});
