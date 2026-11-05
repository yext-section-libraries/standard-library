import { resolveAllData } from "@puckeditor/core";
import { describe, expect, it } from "vitest";
import { Directory } from "../../library/sections/Directory.tsx";
import { Locator } from "../../library/sections/Locator.tsx";
import { DirectoryCard } from "../../library/shared/sectionSupport/directory/DirectoryCard.tsx";
import { DirectoryGrid } from "../../library/shared/sectionSupport/directory/DirectoryWrapper.tsx";
import { DEFAULT_LOCATOR_RESULT_CARD_PROPS } from "../../library/shared/sectionSupport/locator/LocatorResultCard.tsx";
import { config, generationSchema } from "./generationTestUtils.ts";
const locatorSchema = generationSchema("Locator");

const copy = <T,>(value: T): T => structuredClone(value);
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
  it("excludes derived directory card state", () => {
    expect(
      DirectoryGrid.layoutGenerationMetadata?.slottedItemSource
    ).toBeUndefined();
    expect(Object.keys(generationSchema("DirectoryCard").shape)).toEqual([
      "styles",
      "slots",
    ]);
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

  it("infers fixed directory sources with boolean and opaque mappings", () => {
    const schema = generationSchema("DirectoryGrid");
    const props = copy(DirectoryGrid.defaultProps!) as any;
    props.data = {
      field: "dm_directoryChildren",
      constantValueEnabled: false,
      mappings: {
        cardTitle: { field: "name", constantValueEnabled: false },
        linkOverride: {
          enabled: true,
          normalizeLink: false,
          field: "",
          constantValueEnabled: true,
          constantValue: { defaultValue: "/custom", fr: "/personnalise" },
        },
        showAddress: false,
        showHoursStatus: true,
        showPhoneNumber: false,
      },
    };
    expect(schema.parse(props).data).toEqual(props.data);
    expect(
      schema.safeParse({
        ...props,
        data: {
          ...props.data,
          mappings: { ...props.data.mappings, showAddress: "false" },
        },
      }).success
    ).toBe(false);
    delete props.data;
    expect(schema.safeParse(props).success).toBe(true);
  });

  it("normalizes directory bindings even for list pages and missing metadata", async () => {
    const schema = generationSchema("DirectoryGrid");
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
    expect(generationSchema("Directory").safeParse(result).success).toBe(false);
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

  it("declares every changed derived card value when directory mappings change", async () => {
    const document = {
      locale: "en",
      dm_directoryChildren: [
        { ...child("a", "Alpha"), c_cardTitle: "Custom title" },
      ],
    };
    const props = await resolve(
      "DirectoryGrid",
      DirectoryGrid.defaultProps,
      document
    );
    props.data.mappings = {
      ...props.data.mappings,
      cardTitle: {
        ...props.data.mappings.cardTitle,
        field: "c_cardTitle",
        constantValueEnabled: false,
      },
      linkOverride: {
        ...props.data.mappings.linkOverride,
        enabled: true,
        constantValueEnabled: true,
        constantValue: { defaultValue: "/custom" },
      },
      showAddress: false,
      showHoursStatus: false,
      showPhoneNumber: false,
    };
    const before = props.slots.CardSlot[0].props;
    before.index = 99;
    before.parentData.childRef.childIndex = 99;
    const result = await resolve("DirectoryGrid", props, document);
    const after = result.slots.CardSlot[0].props;
    expect(after.id).toBe(before.id);
    expect(after.data.cardTitle).toBe("Custom title");
    expect(after.slots.HeadingSlot[0].props.parentData).toEqual({
      field: "c_cardTitle",
      text: "Custom title",
    });

    // Check actual resolver output, so new derived fields cannot silently bypass preservation.
    const declared = DirectoryCard.layoutGenerationMetadata!.resolvedProps!;
    const checkChanges = (before: any, after: any, path = "") => {
      if (JSON.stringify(before) === JSON.stringify(after)) return;
      if (
        declared.some((owned) => path === owned || path.startsWith(owned + "/"))
      ) {
        return;
      }
      expect(
        before &&
          after &&
          typeof before === "object" &&
          typeof after === "object",
        path
      ).toBeTruthy();
      for (const key of new Set([
        ...Object.keys(before),
        ...Object.keys(after),
      ])) {
        checkChanges(before[key], after[key], `${path}/${key}`);
      }
    };
    checkChanges(before, after);
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
      generationSchema("DirectoryCard").safeParse(
        result.slots.CardSlot[0].props
      ).success
    ).toBe(false);
  });
});
