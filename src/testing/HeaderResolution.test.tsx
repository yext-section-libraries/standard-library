import { describe, expect, it } from "vitest";
import { makeLayout, authored, resolve } from "./generationTestUtils.ts";

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
