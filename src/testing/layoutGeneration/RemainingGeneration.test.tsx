import { describe, expect, it } from "vitest";
import { z } from "zod";
import { resolveAllData } from "@puckeditor/core";
import { sharedComponentConfigs } from "../../library/shared/componentRegistry.ts";
import { toPuckFields } from "@yext/visual-editor";
import {
  EventCardsWrapper,
  eventCardsSource,
} from "../../library/shared/sectionSupport/pageSections/EventSection/EventCardsWrapper.tsx";
import {
  InsightCardsWrapper,
  insightCardsSource,
} from "../../library/shared/sectionSupport/pageSections/InsightSection/InsightCardsWrapper.tsx";
import {
  TeamCardsWrapper,
  teamCardsSource,
} from "../../library/shared/sectionSupport/pageSections/TeamSection/TeamCardsWrapper.tsx";
import {
  TestimonialCardsWrapper,
  testimonialCardsSource,
} from "../../library/shared/sectionSupport/pageSections/TestimonialSection/TestimonialCardsWrapper.tsx";
import {
  ProductCardsWrapper,
  productCardsSource,
} from "../../library/shared/sectionSupport/pageSections/ProductSection/ProductCardsWrapper.tsx";

// Use the real registry so hidden child contracts are checked as well as sections.
const modules = import.meta.glob("../../library/sections/*.tsx", {
  eager: true,
}) as Record<string, Record<string, any>>;
const sections: Record<string, any> = Object.fromEntries(
  Object.values(modules)
    .filter((m) => m.config)
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
const generationDefaults = (component: any) => {
  const props = copy(component.defaultProps);
  if (
    component.layoutGenerationMetadata.slottedItemSource &&
    props.data.mappings
  ) {
    // Native mapping defaults include constants; generation exposes only bindings.
    props.data.mappings = Object.fromEntries(
      Object.entries(props.data.mappings).map(([name, mapping]) => {
        const { field, constantValueEnabled } = mapping as {
          field: string;
          constantValueEnabled: boolean;
        };
        return [name, { field, constantValueEnabled }];
      })
    );
  }
  return props;
};
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
  it("discovers section configs", () => {
    expect(Object.keys(sections).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(sections))(
    "%s declares expected generation support",
    (name, component) => {
      // FormSection is not supported by layout generation.
      expect(Boolean(component.layoutGenerationMetadata?.props)).toBe(
        name !== "FormSection"
      );
    }
  );

  it.each(
    Object.entries(components).filter(([, c]) => c.layoutGenerationMetadata)
  )(
    "%s satisfies the generation schema and native slot contracts",
    (_name, component) => {
      expect(
        component.layoutGenerationMetadata.props.safeParse(
          generationDefaults(component)
        )
      ).toMatchObject({ success: true });
      const schema = component.layoutGenerationMetadata.props;
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
        expect(schema.shape).not.toHaveProperty(key);
      }
      const slots = schema.shape.slots;
      if (slots instanceof z.ZodObject) {
        const fields = component.fields.slots.objectFields;
        const defaults = component.defaultProps.slots;
        expect(Object.keys(slots.shape).sort()).toEqual(
          Object.keys(fields).sort()
        );
        expect(Object.keys(defaults).sort()).toEqual(
          Object.keys(fields).sort()
        );
        for (const [name, slotSchema] of Object.entries(slots.shape)) {
          const children = defaults[name] as { type: string }[];
          const field = fields[name];
          expect(field.type, name).toBe("slot");
          // Slotted sources supply collection restrictions to the compiler.
          const source = component.layoutGenerationMetadata.slottedItemSource;
          const allowedTypes =
            name === "CardSlot" && source ? [source.cardType] : field.allow;
          expect(allowedTypes?.length, name).toBeGreaterThan(0);
          for (const child of children) {
            expect(allowedTypes, name).toContain(child.type);
            expect(
              components[child.type]?.layoutGenerationMetadata,
              child.type
            ).toBeDefined();
          }
          // CardSlot is a collection; all other object slots are fixed children.
          // Determine cardinality independently of the schema under test.
          if (name === "CardSlot") continue;
          expect(children, name).toHaveLength(1);
          expect(field.allow, name).toEqual([children[0].type]);
          for (const replacement of [[], [...children, ...children]]) {
            expect(
              (slotSchema as z.ZodType).safeParse(replacement).success,
              name
            ).toBe(false);
          }
        }
      }
      expect(() =>
        z.toJSONSchema(component.layoutGenerationMetadata.props)
      ).not.toThrow();
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
        generationDefaults(wrapper)
      ) as any;
      expect(authored.data).not.toHaveProperty("constantValue");
      for (const mapping of Object.values(authored.data.mappings ?? {})) {
        expect(mapping).not.toHaveProperty("constantValue");
      }
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
