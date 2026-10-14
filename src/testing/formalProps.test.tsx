import { heroSectionSchema } from "../library/shared/formalProps/hero.ts";
import { resolveAllData } from "@puckeditor/core";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  HeroSection,
  config as heroConfig,
} from "../library/sections/HeroSection.tsx";
import {
  config as bannerConfig,
  defaultBannerProps,
} from "../library/sections/BannerSection.tsx";
import { backgroundColorSchema } from "../library/shared/formalProps/colors.ts";
import { imageSchema } from "../library/shared/formalProps/data.ts";
import {
  heroVariantSchema,
  headingTextSchema,
  phoneListSchema,
  hoursStatusSchema,
  heroImageSchema,
  ctaWrapperSchema,
} from "../library/shared/formalProps/slots.ts";

const heroProps = () => {
  const props = structuredClone({ ...HeroSection.defaultProps });
  props.slots!.HoursStatusSlot[0].props.data.hours.constantValueEnabled = false;
  for (const phone of props.slots!.PhoneSlot[0].props.data.phoneNumbers) {
    phone.number.constantValueEnabled = false;
  }
  return props;
};

describe("formal props", () => {
  it.each(heroVariantSchema.options)(
    "accepts entity-bound props for the %s hero",
    (variant) => {
      const props = heroProps();
      props.styles!.variant = variant;
      expect(heroSectionSchema.safeParse(props).success).toBe(true);
    }
  );

  it("exposes the hero schema and preserves banner static text support", () => {
    expect(heroConfig.formalProps).toBe(heroSectionSchema);
    expect(
      bannerConfig.formalProps!.safeParse({
        ...defaultBannerProps,
        data: {
          text: {
            ...defaultBannerProps.data.text,
            constantValue: { defaultValue: "Banner Text" },
          },
        },
      }).success
    ).toBe(true);
  });

  it("validates all entity-bound slot components independently", () => {
    const slots = heroProps().slots!;
    const cases = [
      [headingTextSchema, slots.BusinessNameSlot],
      [headingTextSchema, slots.GeomodifierSlot],
      [phoneListSchema, slots.PhoneSlot],
      [hoursStatusSchema, slots.HoursStatusSlot],
      [heroImageSchema, slots.ImageSlot],
      [ctaWrapperSchema, slots.PrimaryCTASlot],
      [ctaWrapperSchema, slots.SecondaryCTASlot],
    ] as const;
    for (const [schema, slot] of cases) {
      expect(schema.safeParse(slot[0].props).success).toBe(true);
    }
  });

  it("accepts populated hidden slots and omitted optional props", () => {
    const props = heroSectionSchema.parse(heroProps());
    props.styles = {
      variant: "classic",
      desktopImagePosition: "right",
      mobileImagePosition: "top",
      showBusinessName: true,
      showGeomodifier: true,
      showPhone: true,
      showHoursStatus: true,
      showAverageReview: true,
      showPrimaryCTA: true,
      showSecondaryCTA: true,
      showImage: true,
    };
    props.liveVisibility = false;
    props.styles.showPhone = false;
    props.conditionalRender = { hours: false, phone: false };
    props.slots.PhoneSlot[0].props.data.phoneNumbers = [];
    expect(heroSectionSchema.safeParse(props).success).toBe(true);
  });

  it("requires every hero slot to be present and populated", () => {
    const props = heroSectionSchema.parse(heroProps());
    for (const slotName of Object.keys(props.slots)) {
      const slots: Record<string, unknown> = { ...props.slots };
      slots[slotName] = [];
      expect(heroSectionSchema.safeParse({ ...props, slots }).success).toBe(
        false
      );
      delete slots[slotName];
      expect(heroSectionSchema.safeParse({ ...props, slots }).success).toBe(
        false
      );
    }
    const jsonSchema = z.toJSONSchema(heroSectionSchema.shape.slots);
    expect(jsonSchema.required).toEqual(Object.keys(props.slots));
    for (const slot of Object.values(jsonSchema.properties!)) {
      expect(slot).toMatchObject({ minItems: 1 });
    }
  });

  it("keeps empty hero slots empty during parent data resolution", async () => {
    const props = heroSectionSchema.parse(heroProps());
    for (const slotName of Object.keys(props.slots) as Array<
      keyof typeof props.slots
    >) {
      props.slots[slotName] = [];
    }
    const resolved = await resolveAllData(
      {
        root: { props: {} },
        content: [{ type: "HeroSection", props: { ...props, id: "hero" } }],
      },
      { components: { HeroSection, ...sharedComponentConfigs } },
      {
        streamDocument: { locale: "en" },
      }
    );
    expect(resolved.content[0].props.slots).toEqual(props.slots);
  });

  it("rejects incorrect slot types and malformed nested props", () => {
    const wrongType = heroProps();
    wrongType.slots!.ImageSlot[0].type = "CTASlot";
    expect(heroSectionSchema.safeParse(wrongType).success).toBe(false);
    const wrongProps = heroProps();
    wrongProps.slots!.PhoneSlot[0].props.styles.phoneFormat = "invalid";
    expect(heroSectionSchema.safeParse(wrongProps).success).toBe(false);
  });

  it("preserves flat image properties and localized alternate text", () => {
    const image = {
      url: "/image.png",
      width: 640,
      height: 360,
      alternateText: {
        defaultValue: "Image",
        fr: "Illustration",
        hasLocalizedValue: "true",
      },
    };
    expect(imageSchema.parse(image)).toEqual(image);
  });

  it("uses the banner's bracketed hex and contrast rules", () => {
    expect(
      backgroundColorSchema.safeParse({
        selectedColor: "[#FFBBC7]",
        contrastingColor: "black",
        isDarkColor: false,
      }).success
    ).toBe(true);
    expect(
      backgroundColorSchema.safeParse({
        selectedColor: "#FFBBC7",
        contrastingColor: "black",
        isDarkColor: false,
      }).success
    ).toBe(false);
    expect(
      backgroundColorSchema.safeParse({
        selectedColor: "[#FFBBC7]",
        contrastingColor: "black",
        isDarkColor: true,
      }).success
    ).toBe(false);
  });

  it("exports JSON schemas without runtime callbacks", () => {
    for (const schema of [
      headingTextSchema,
      phoneListSchema,
      hoursStatusSchema,
      heroImageSchema,
      ctaWrapperSchema,
    ]) {
      const jsonSchema = z.toJSONSchema(schema);
      expect(jsonSchema.properties).not.toHaveProperty("puck");
      expect(jsonSchema.properties).not.toHaveProperty("id");
    }
  });
});
