import { migrationRegistry } from "../library/migrations/registry.ts";
import defaultLayout from "../library/layouts/standard-library/defaultLayout.json";
import directoryLayout from "../library/layouts/standard-library-directory/defaultLayout.json";
import locatorLayout from "../library/layouts/standard-library-locator/defaultLayout.json";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { resolveAllData, type Config, type Data } from "@puckeditor/core";
import type { YextComponentConfig } from "@yext/visual-editor";
import { ExpandedHeader } from "../library/sections/ExpandedHeader.tsx";
import { HeroSection } from "../library/sections/HeroSection.tsx";
import { PromoSection } from "../library/sections/PromoSection.tsx";
import { CoreInfoSection } from "../library/sections/CoreInfoSection.tsx";
import { BannerSection } from "../library/sections/BannerSection.tsx";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import { backgroundColorSchema } from "../library/shared/generation/colors.ts";
import {
  translatableRichTextSchema,
  imageSchema,
} from "../library/shared/generation/data.ts";

const components = {
  ...sharedComponentConfigs,
  ExpandedHeader,
  HeroSection,
  PromoSection,
  CoreInfoSection,
  BannerSection,
} as Record<string, YextComponentConfig<any>>;
const config = { components } as Config;
const sectionNames = [
  "ExpandedHeader",
  "HeroSection",
  "PromoSection",
  "CoreInfoSection",
  "BannerSection",
];

// Build serialized native instances, including identities for every authored child.
const makeLayout = (type: string): Data => {
  let nextId = 0;
  const instance = (type: string, props: any): any => {
    props.id = `${type}-${nextId++}`;
    for (const items of Object.values(props.slots ?? {}) as any[][]) {
      for (const child of items) instance(child.type, child.props);
    }
    return { type, props };
  };
  return {
    root: { props: {} },
    content: [
      instance(type, JSON.parse(JSON.stringify(components[type].defaultProps))),
    ],
  };
};
const authored = (layout: Data) => {
  const project = (item: any): any => {
    const schema = components[item.type].generation!.props;
    const props = schema.parse(item.props) as Record<string, any>;
    for (const [slotName, items] of Object.entries(props.slots ?? {})) {
      props.slots[slotName] = (items as any[]).map(project);
    }
    return { type: item.type, props };
  };
  return layout.content.map(project);
};
const resolve = (layout: Data, streamDocument: Record<string, any> = {}) =>
  resolveAllData(layout, config, { streamDocument });

// Audit actual native defaults and registered hidden children, not duplicated schemas.
const audit = (item: any) => {
  const component = components[item.type];
  expect(component.generation, item.type).toBeDefined();
  const schema = component.generation!.props;
  expect(schema.safeParse(item.props).success, item.type).toBe(true);
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
    expect(schema.shape, item.type).not.toHaveProperty(key);
  }
  expect(() => z.toJSONSchema(schema), item.type).not.toThrow();
  for (const [name, items] of Object.entries(item.props.slots ?? {})) {
    const field = (component.fields!.slots as any).objectFields[name];
    const slotSchema = (schema.shape.slots as z.ZodObject).shape[
      name
    ] as z.ZodArray;
    expect(slotSchema.element).toBeInstanceOf(z.ZodUnknown);
    expect(slotSchema.safeParse([]).success).toBe(false);
    expect(slotSchema.safeParse([{}, {}]).success).toBe(false);
    for (const child of items as any[]) {
      expect(field.allow).toEqual([child.type]);
      audit(child);
    }
  }
};

describe("component-owned generation contracts", () => {
  it.each([defaultLayout, directoryLayout, locatorLayout])(
    "accepts migrated components in saved default layout %#",
    (layout) => {
      const visit = (value: any) => {
        if (!value || typeof value !== "object") return;
        if (value.type && value.props && components[value.type]?.generation)
          audit(value);
        for (const child of Object.values(value)) visit(child);
      };
      visit(layout);
    }
  );

  it.each(sectionNames)(
    "audits authored defaults and reachable contracts for %s",
    (name) => {
      audit(makeLayout(name).content[0]);
    }
  );

  it.each(sectionNames)(
    "preserves authored extraction through repeated resolution for %s",
    async (name) => {
      const layout = makeLayout(name);
      const baseline = authored(layout);
      const first = await resolve(layout, { locale: "en" });
      const second = await resolve(first, { locale: "en" });
      expect(authored(first)).toEqual(baseline);
      expect(authored(second)).toEqual(baseline);
      expect(second).toEqual(first);
    }
  );

  it("preserves localized text, rich text, image alt text, and entity bindings", async () => {
    const layout = makeLayout("PromoSection");
    const props = layout.content[0].props;
    const richText = {
      defaultValue: { html: "<p>Offer</p>", json: "{}" },
      fr: { html: "<p>Offre</p>" },
      hasLocalizedValue: "true",
    };
    props.slots.DescriptionSlot[0].props.data.text.constantValue = richText;
    props.slots.HeadingSlot[0].props.data.text = {
      field: "name",
      constantValue: { defaultValue: "Name", fr: "Nom" },
      constantValueEnabled: false,
    };
    props.slots.ImageSlot[0].props.data.image.constantValue.alternateText = {
      defaultValue: "Image",
      fr: "Illustration",
    };
    expect(translatableRichTextSchema.parse(richText)).toEqual(richText);
    expect(
      imageSchema.safeParse(
        props.slots.ImageSlot[0].props.data.image.constantValue
      ).success
    ).toBe(true);
    for (const locale of ["en", "fr"]) {
      const resolved = await resolve(layout, { locale, name: "Entity name" });
      expect(authored(resolved)).toEqual(authored(layout));
    }
  });

  it("keeps bracketed custom color and scalar constraints", () => {
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
    const props = makeLayout("PromoSection").content[0].props;
    props.styles.imageHeight = -1;
    expect(PromoSection.generation!.props.safeParse(props).success).toBe(false);
  });
});

describe("header ownership and active context", () => {
  it("inherits width and menu copy and retains primary/secondary contextual defaults", async () => {
    const layout = makeLayout("ExpandedHeader");
    layout.content[0].props.styles.maxWidth = "1280px";
    const resolved = await resolve(layout, { locale: "en" });
    const props = resolved.content[0].props;
    const primary = props.slots.PrimaryHeaderSlot[0].props;
    const secondary = props.slots.SecondaryHeaderSlot[0].props;
    expect(primary.parentValues.maxWidth).toBe("1280px");
    expect(secondary.parentStyles.maxWidth).toBe("1280px");
    expect(primary.parentValues.SecondaryHeaderSlot).toEqual(
      props.slots.SecondaryHeaderSlot
    );
    expect(primary.slots.LinksSlot[0].props.parentData.type).toBe("Primary");
    expect(secondary.slots.LinksSlot[0].props.parentData.type).toBe(
      "Secondary"
    );
    expect(primary.slots.LinksSlot[0].props.styles.variant).toBe("sm");
    expect(secondary.slots.LinksSlot[0].props.styles.variant).toBe("xs");
    expect(authored(resolved)).toEqual(authored(layout));
  });

  it("recomputes visibility with disabled CTAs, secondary menu links, and missing entity data", async () => {
    const layout = makeLayout("ExpandedHeader");
    const props = layout.content[0].props;
    const primary = props.slots.PrimaryHeaderSlot[0].props;
    const secondary = props.slots.SecondaryHeaderSlot[0].props;
    primary.slots.LogoSlot[0].props.data.image = {
      field: "logo",
      constantValue: primary.slots.LogoSlot[0].props.data.image.constantValue,
      constantValueEnabled: false,
    };
    primary.slots.PrimaryCTASlot[0].props.data.show = false;
    primary.slots.SecondaryCTASlot[0].props.data.show = false;
    primary.slots.LinksSlot[0].props.data = { links: [], collapsedLinks: [] };
    secondary.slots.LinksSlot[0].props.data = {
      links: [{ label: "Menu", link: "/menu" }],
      collapsedLinks: [],
    };
    let resolved = await resolve(layout, {
      locale: "en",
      logo: { url: "/logo.png", width: 100, height: 100 },
    });
    expect(
      resolved.content[0].props.slots.PrimaryHeaderSlot[0].props
        .conditionalRender
    ).toEqual({ navContent: true, CTAs: false, hasLogoImage: true });
    resolved.content[0].props.slots.SecondaryHeaderSlot[0].props.data.show = false;
    resolved = await resolve(resolved);
    expect(
      resolved.content[0].props.slots.PrimaryHeaderSlot[0].props
        .conditionalRender
    ).toEqual({ navContent: false, CTAs: false, hasLogoImage: false });
    expect(resolved.content[0].props.ignoreLocaleWarning).toContain(
      "slots.SecondaryHeaderSlot"
    );
  });
  it("matches optional CTA visibility, button controls, and localized empty labels", async () => {
    const layout = makeLayout("ExpandedHeader");
    const primary = layout.content[0].props.slots.PrimaryHeaderSlot[0].props;
    const cta = primary.slots.PrimaryCTASlot[0].props;
    delete cta.data.show;
    cta.data.actionType = "button";
    cta.data.buttonText = { defaultValue: "Go", fr: "" };
    primary.slots.SecondaryCTASlot[0].props.data.show = false;
    const visible = await resolve(layout, { locale: "en" });
    expect(
      visible.content[0].props.slots.PrimaryHeaderSlot[0].props
        .conditionalRender.CTAs
    ).toBe(true);
    const hidden = await resolve(visible, { locale: "fr" });
    expect(
      hidden.content[0].props.slots.PrimaryHeaderSlot[0].props.conditionalRender
        .CTAs
    ).toBe(false);
    cta.data.actionType = "link";
    cta.data.entityField.constantValue.label = { defaultValue: "Go", fr: "" };
    const linkHidden = await resolve(layout, { locale: "fr" });
    expect(
      linkHidden.content[0].props.slots.PrimaryHeaderSlot[0].props
        .conditionalRender.CTAs
    ).toBe(false);
  });
});

describe("promo canonical authored data", () => {
  it.each(["classic", "compact", "immersive", "spotlight"])(
    "preserves media and background bindings across contexts in %s",
    async (variant) => {
      const layout = makeLayout("PromoSection");
      const props = layout.content[0].props;
      props.styles.variant = variant;
      props.data.media = "video";
      props.data.promo = {
        field: "c_promo",
        constantValue: {},
        constantValueEnabled: false,
      };
      const baseline = authored(layout);
      const first = await resolve(layout, {
        locale: "fr",
        c_promo: {
          title: "Promotion",
          description: "Description",
          image: { url: "/entity.png", width: 100, height: 100 },
          cta: { label: "Go", link: "/go" },
        },
      });
      expect(first.content[0].props.parentData.media).toBe("image");
      expect(
        first.content[0].props.slots.HeadingSlot[0].props.parentData.text
      ).toBe("Promotion");
      expect(authored(first)).toEqual(baseline);
      const missing = await resolve(first, { locale: "en" });
      expect(missing.content[0].props.parentData).toBeUndefined();
      expect(
        missing.content[0].props.slots.HeadingSlot[0].props.parentData
      ).toBeUndefined();
      expect(missing.content[0].readOnly?.["data.media"]).toBe(false);
      expect(authored(missing)).toEqual(baseline);
      missing.content[0].props.data.promo.constantValueEnabled = true;
      const constant = await resolve(missing, {
        locale: "en",
        c_promo: { title: "Ignored" },
      });
      expect(constant.content[0].props.data.media).toBe("video");
      expect(
        constant.content[0].props.slots.HeadingSlot[0].props.parentData
      ).toBeUndefined();
    }
  );
});

describe("legacy promo image migration", () => {
  const migration = (migrationRegistry[1] as any).PromoSection
    .propTransformation;
  it("recovers existing dimensions and preserves unrelated authored values", () => {
    const props = makeLayout("PromoSection").content[0].props;
    const assetUrl = "https://example.com/image.png?width=1440&height=900";
    props.data.backgroundImage.constantValue = { defaultValue: assetUrl };
    const migrated = migration(props, {});
    expect(migrated.data.backgroundImage.constantValue.defaultValue).toEqual({
      url: assetUrl,
      width: 1440,
      height: 900,
    });
    expect(migrated.styles).toBe(props.styles);
    expect(migrated.slots).toBe(props.slots);
    expect(migration(migrated, {})).toBe(migrated);
  });
  it.each([
    "https://example.com/image.png",
    "https://example.com/image.png?width=-1&height=900",
    "invalid",
  ])("preserves assets without known valid dimensions: %s", (assetUrl) => {
    const props = makeLayout("PromoSection").content[0].props;
    props.data.backgroundImage.constantValue = { defaultValue: assetUrl };
    expect(migration(props, {})).toBe(props);
  });
});
