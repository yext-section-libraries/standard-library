import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  PromoSection,
  config as promoConfig,
} from "../library/sections/PromoSection.tsx";
import {
  ExpandedHeader,
  config as headerConfig,
} from "../library/sections/ExpandedHeader.tsx";
import { config as bodyTextConfig } from "../library/sections/BodyText.tsx";
import { promoSectionSchema } from "../library/shared/formalProps/promo.ts";
import { bodyTextSchema } from "../library/shared/formalProps/slots.ts";
import { translatableRichTextSchema } from "../library/shared/formalProps/data.ts";
import { expandedHeaderSchema } from "../library/shared/formalProps/header.ts";

const promoProps = () => JSON.parse(JSON.stringify(PromoSection.defaultProps));
const headerProps = () =>
  JSON.parse(JSON.stringify(ExpandedHeader.defaultProps));

describe("Promo and Header formal props", () => {
  it("exposes schemas through the section configs", () => {
    expect(promoConfig.formalProps).toBe(promoSectionSchema);
    expect(headerConfig.formalProps).toBe(expandedHeaderSchema);
    expect(bodyTextConfig.formalProps).toBe(bodyTextSchema);
  });

  it.each(["classic", "compact", "immersive", "spotlight"])(
    "preserves serialized default props for the %s promo",
    (variant) => {
      const props = promoProps();
      props.styles.variant = variant;
      expect(promoSectionSchema.parse(props)).toEqual(props);
    }
  );

  it("preserves both tiers and nested slots in serialized header defaults", () => {
    const props = headerProps();
    expect(expandedHeaderSchema.parse(props)).toEqual(props);
  });

  it("accepts entity-bound promotions and authored video content", () => {
    const props = promoProps();
    props.data.promo = {
      field: "c_promo",
      constantValue: {},
      constantValueEnabled: false,
    };
    expect(promoSectionSchema.safeParse(props).success).toBe(true);
    props.data.promo.constantValueEnabled = true;
    props.data.media = "video";
    props.slots.VideoSlot[0].props.data.assetVideo = {
      id: "asset",
      name: "Promotion",
      videoDescription: "Product overview",
      video: {
        id: "video",
        url: "https://www.youtube.com/watch?v=video",
        title: "Promotion",
        thumbnail: "/thumbnail.jpg",
        duration: "PT30S",
        embeddedUrl: "https://www.youtube.com/embed/video",
      },
    };
    expect(promoSectionSchema.parse(props)).toEqual(props);
    props.slots.VideoSlot[0].props.data.assetVideo.video.embeddedUrl = 42;
    expect(promoSectionSchema.safeParse(props).success).toBe(false);
  });

  it("preserves localized rich text and navigation links", () => {
    const text = {
      defaultValue: { html: "<p>Offer</p>", json: "{}" },
      fr: { html: "<p>Offre</p>" },
      hasLocalizedValue: "true",
    };
    expect(translatableRichTextSchema.parse(text)).toEqual(text);
    const promo = promoProps();
    promo.slots.DescriptionSlot[0].props.data.text.constantValue = text;
    expect(promoSectionSchema.parse(promo)).toEqual(promo);
    const header = headerProps();
    const link =
      header.slots.PrimaryHeaderSlot[0].props.slots.LinksSlot[0].props.data
        .links[0];
    link.label = {
      defaultValue: "Locations",
      fr: "Adresses",
      hasLocalizedValue: "true",
    };
    link.link = { defaultValue: "/locations", fr: "/fr/adresses" };
    expect(expandedHeaderSchema.parse(header)).toEqual(header);
  });

  it.each([
    [promoSectionSchema, promoProps],
    [expandedHeaderSchema, headerProps],
  ] as const)(
    "requires populated slots and correct component types (%#)",
    (schema, makeProps) => {
      for (const slotName of Object.keys(makeProps().slots)) {
        const props = makeProps();
        props.slots[slotName] = [];
        expect(schema.safeParse(props).success).toBe(false);
        delete props.slots[slotName];
        expect(schema.safeParse(props).success).toBe(false);
        const wrongType = makeProps();
        wrongType.slots[slotName][0].type = "UnsupportedSlot";
        expect(schema.safeParse(wrongType).success).toBe(false);
      }
    }
  );

  it("keeps hidden header slots populated and rejects malformed nested props", () => {
    const props = headerProps();
    props.slots.SecondaryHeaderSlot[0].props.data.show = false;
    props.slots.PrimaryHeaderSlot[0].props.slots.PrimaryCTASlot[0].props.data.show = false;
    expect(expandedHeaderSchema.safeParse(props).success).toBe(true);
    props.slots.PrimaryHeaderSlot[0].props.slots.LogoSlot = [];
    expect(expandedHeaderSchema.safeParse(props).success).toBe(false);
    const malformed = headerProps();
    malformed.slots.SecondaryHeaderSlot[0].props.slots.LinksSlot[0].props.data.links =
      [{ label: "Missing link" }];
    expect(expandedHeaderSchema.safeParse(malformed).success).toBe(false);
  });

  it("exports JSON schemas with required populated slots", () => {
    for (const schema of [promoSectionSchema, expandedHeaderSchema]) {
      const jsonSchema = z.toJSONSchema(schema);
      expect(jsonSchema.properties).not.toHaveProperty("puck");
      const slots = z.toJSONSchema(schema.shape.slots);
      expect(slots.required).toEqual(Object.keys(schema.shape.slots.shape));
      for (const slot of Object.values(slots.properties!)) {
        expect(slot).toMatchObject({ minItems: 1 });
      }
    }
  });
});
