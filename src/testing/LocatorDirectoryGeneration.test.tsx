import { describe, expect, it } from "vitest";
import { resolveAllData, type Config } from "@puckeditor/core";
import { toPuckFields, type YextComponentConfig } from "@yext/visual-editor";
import { Directory } from "../library/sections/Directory.tsx";
import { Locator } from "../library/sections/Locator.tsx";
import { DirectoryGrid } from "../library/shared/sectionSupport/directory/DirectoryWrapper.tsx";
import { DirectoryCard } from "../library/shared/sectionSupport/directory/DirectoryCard.tsx";
import { DEFAULT_LOCATOR_RESULT_CARD_PROPS } from "../library/shared/sectionSupport/locator/LocatorResultCard.tsx";
import { locatorSchema } from "../library/shared/sectionSupport/locator/locatorSchemas.ts";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";

const copy = <T,>(value: T): T => structuredClone(value);
const components = { ...sharedComponentConfigs, Directory, Locator };
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
} as Config;
async function resolve(type: string, props: any, streamDocument: any = {}) {
  const result = await resolveAllData(
    {
      root: { props: {} },
      content: [{ type, props: { id: "test", ...copy(props) } }],
    },
    config,
    { streamDocument }
  );
  return result.content[0].props as any;
}
const locatorDocument = (entityTypes: string[]) => ({
  locale: "en",
  __: {
    locatorSourcePageSets: JSON.stringify(
      Object.fromEntries(
        entityTypes.map((entityType, index) => [
          `source-${index}`,
          { entityType },
        ])
      )
    ),
  },
});
const child = (id: string, name: string) => ({
  id,
  name,
  address: { line1: "1 Main St", city: "Boston", countryCode: "US" },
});

describe("locator and directory generation", () => {
  it.each([Directory, DirectoryCard])(
    "requires one child in every fixed slot",
    (component) => {
      const schema = component.layoutGenerationMetadata!.props;
      const props = copy(component.defaultProps) as any;
      expect(schema.safeParse(props).success).toBe(true);
      for (const [name, items] of Object.entries(props.slots) as [
        string,
        any[],
      ][]) {
        for (const replacement of [[], [...items, ...items]]) {
          expect(
            schema.safeParse({
              ...props,
              slots: { ...props.slots, [name]: replacement },
            }).success
          ).toBe(false);
        }
      }
    }
  );

  it("declares exact child types and excludes derived card state", () => {
    const expected = [
      [
        Directory,
        {
          TitleSlot: "HeadingTextSlot",
          SiteNameSlot: "HeadingTextSlot",
          BreadcrumbsSlot: "BreadcrumbsSlot",
          DirectoryGrid: "DirectoryGrid",
        },
      ],
      [DirectoryGrid, { CardSlot: "DirectoryCard" }],
      [
        DirectoryCard,
        {
          HeadingSlot: "HeadingTextSlot",
          AddressSlot: "AddressSlot",
          PhoneSlot: "PhoneSlot",
          HoursSlot: "HoursStatusSlot",
        },
      ],
    ] as [YextComponentConfig<any>, Record<string, string>][];
    for (const [component, slots] of expected) {
      for (const [name, type] of Object.entries(slots)) {
        expect(
          (component.fields!.slots as any).objectFields[name].allow
        ).toEqual([type]);
      }
    }
    expect(
      DirectoryGrid.layoutGenerationMetadata!.slottedItemSource
    ).toBeUndefined();
    expect(
      Object.keys(DirectoryCard.layoutGenerationMetadata!.props.shape)
    ).toEqual(["styles", "slots"]);
  });

  it("rejects unsupported locator options and pin dimensions", () => {
    const defaults = copy(Locator.defaultProps!);
    for (const props of [
      { ...defaults, mapStyle: "unsupported" },
      { ...defaults, distanceDisplay: "unsupported" },
      { ...defaults, locationStyles: [{ entityType: "unsupported" }] },
      {
        ...defaults,
        locationStyles: [
          {
            entityType: "location",
            pinIcon: { type: "icon", iconName: "unsupported" },
          },
        ],
      },
      {
        ...defaults,
        filters: {
          ...defaults.filters,
          facetFields: { selections: [{ value: "unsupported" }] },
        },
      },
      ...[0, 28].map((width) => ({
        ...defaults,
        locationStyles: [
          { entityType: "location", pinIcon: { type: "customImage", width } },
        ],
      })),
      {
        ...defaults,
        resultCard: [
          {
            props: {
              ...DEFAULT_LOCATOR_RESULT_CARD_PROPS,
              phone: { phoneFormat: "unsupported" },
            },
          },
        ],
      },
    ])
      expect(locatorSchema.safeParse(props).success).toBe(false);
    expect(
      locatorSchema.safeParse({
        ...defaults,
        resultCard: [{ props: DEFAULT_LOCATOR_RESULT_CARD_PROPS }],
      }).success
    ).toBe(true);
  });

  it.each([{}, locatorDocument(["location", "restaurant", "location"])])(
    "reconciles duplicate, stale, missing and reordered locator configurations",
    async (document) => {
      const props = copy(Locator.defaultProps!) as any;
      const customCard = {
        ...copy(DEFAULT_LOCATOR_RESULT_CARD_PROPS),
        icons: false,
      };
      props.locationStyles = [
        { entityType: "restaurant" },
        { entityType: "hotel" },
        { entityType: "location" },
        { entityType: "location", pinIcon: { type: "none" } },
      ];
      props.resultCard = [
        { props: { ...customCard, entityType: "hotel" } },
        { props: customCard },
      ];
      const first = await resolve("Locator", props, document);
      const expected =
        "__" in document ? ["location", "restaurant"] : ["location"];
      expect(
        first.locationStyles.map((style: any) => style.entityType)
      ).toEqual(expected);
      expect(
        first.resultCard.map((card: any) => card.props.entityType)
      ).toEqual(expected);
      expect(first.resultCard[0].props.icons).toBe(false);
      expect(await resolve("Locator", first, document)).toEqual(first);
      const empty = await resolve("Locator", Locator.defaultProps, document);
      expect(
        empty.resultCard.map((card: any) => card.props.entityType)
      ).toEqual(expected);
    }
  );

  it("normalizes directory bindings even for list pages and missing metadata", async () => {
    const schema = DirectoryGrid.layoutGenerationMetadata!.props;
    const props = copy(DirectoryGrid.defaultProps!) as any;
    for (const data of [
      { ...props.data, field: "c_other" },
      { ...props.data, constantValueEnabled: true },
    ]) {
      expect(schema.safeParse({ ...props, data }).success).toBe(false);
      for (const document of [
        {},
        { dm_directoryChildren: [{ name: "Region", slug: "region" }] },
      ]) {
        const result = await resolve(
          "DirectoryGrid",
          { ...props, data },
          document
        );
        expect(result.data).toMatchObject({
          field: "dm_directoryChildren",
          constantValueEnabled: false,
          constantValue: [],
        });
        expect(schema.safeParse(result).success).toBe(true);
      }
    }
  });

  it("preserves existing empty directory slots while schemas reject them for generation", async () => {
    const props = copy(Directory.defaultProps!) as any;
    props.slots.TitleSlot = [];
    props.slots.SiteNameSlot = [];
    const result = await resolve("Directory", props);
    expect(result.slots.TitleSlot).toEqual([]);
    expect(result.slots.SiteNameSlot).toEqual([]);
    expect(
      Directory.layoutGenerationMetadata!.props.safeParse(result).success
    ).toBe(false);
  });

  it("preserves valid locator configuration ordering", async () => {
    const props = copy(Locator.defaultProps!) as any;
    props.locationStyles = [
      { entityType: "restaurant" },
      { entityType: "location" },
    ];
    props.resultCard = ["location", "restaurant"].map((entityType) => ({
      props: { ...copy(DEFAULT_LOCATOR_RESULT_CARD_PROPS), entityType },
    }));
    const result = await resolve(
      "Locator",
      props,
      locatorDocument(["location", "restaurant"])
    );
    expect(result.locationStyles).toEqual(props.locationStyles);
    expect(result.resultCard).toEqual(props.resultCard);
  });

  it("derives cards from children and preserves customization by child identity", async () => {
    const document = {
      locale: "en",
      dm_directoryChildren: [child("b", "Beta"), child("a", "Alpha")],
    };
    const props = copy(DirectoryGrid.defaultProps!) as any;
    props.data.mappings.showPhoneNumber = false;
    const first = await resolve("DirectoryGrid", props, document);
    const cards = first.slots.CardSlot;
    expect(cards.map((card: any) => card.props.data.cardTitle)).toEqual([
      "Alpha",
      "Beta",
    ]);
    cards[1].props.slots.HeadingSlot[0].props.styles.align = "right";
    const betaId = cards[1].props.id;
    const changedDocument = {
      ...document,
      dm_directoryChildren: [child("b", "Aardvark"), child("c", "Gamma")],
    };
    const second = await resolve("DirectoryGrid", first, changedDocument);
    expect(second.slots.CardSlot).toHaveLength(2);
    expect(second.slots.CardSlot[0].props.id).toBe(betaId);
    expect(
      second.slots.CardSlot[0].props.slots.HeadingSlot[0].props.styles.align
    ).toBe("right");
    expect(
      second.slots.CardSlot.map((card: any) => card.props.parentData.childRef)
    ).toEqual([
      { childId: "b", childIndex: 0 },
      { childId: "c", childIndex: 1 },
    ]);
    expect(
      second.slots.CardSlot[0].props.slots.HeadingSlot[0].props.parentData.text
    ).toBe("Aardvark");
    expect(second.slots.CardSlot[0].props.data.showPhoneNumber).toBe(false);
    expect(await resolve("DirectoryGrid", second, changedDocument)).toEqual(
      second
    );
    const empty = await resolve("DirectoryGrid", second, {
      ...document,
      dm_directoryChildren: [],
    });
    expect(empty.slots.CardSlot).toEqual([]);
  });

  it("preserves existing empty card slots during document synchronization", async () => {
    const props = copy(DirectoryGrid.defaultProps!) as any;
    const slots = {
      HeadingSlot: [],
      AddressSlot: [],
      PhoneSlot: [],
      HoursSlot: [],
    };
    props.slots.CardSlot = [
      {
        type: "DirectoryCard",
        props: { ...copy(DirectoryCard.defaultProps!), id: "existing", slots },
      },
    ];
    const result = await resolve("DirectoryGrid", props, {
      dm_directoryChildren: [child("a", "Alpha")],
    });
    expect(result.slots.CardSlot[0].props.slots).toEqual(slots);
    expect(
      DirectoryCard.layoutGenerationMetadata!.props.safeParse(
        result.slots.CardSlot[0].props
      ).success
    ).toBe(false);
  });
});
