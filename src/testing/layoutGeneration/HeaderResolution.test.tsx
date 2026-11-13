import { describe, expect, it } from "vitest";
import { makeLayout, authored, resolve } from "./generationTestUtils.ts";

describe("header ownership and active context", () => {
  it("preserves width overrides and inherits menu copy and retains primary/secondary contextual defaults", async () => {
    const layout = makeLayout("ExpandedHeader");
    layout.content[0].props.styles.maxWidth = "1280px";
    const resolved = await resolve(layout, { locale: "en" });
    const props = resolved.content[0].props;
    const primary = props.slots.PrimaryHeaderSlot[0].props;
    const secondary = props.slots.SecondaryHeaderSlot[0].props;
    expect(primary.parentValues.maxWidth).toBe("1280px");
    expect(secondary.parentStyles.maxWidth).toBe("1280px");
    const menuHeaders = primary.parentValues.SecondaryHeaderSlot;
    expect(menuHeaders).toHaveLength(props.slots.SecondaryHeaderSlot.length);
    for (const [index, menuHeader] of menuHeaders.entries()) {
      const inlineHeader = props.slots.SecondaryHeaderSlot[index];
      expect(menuHeader).toEqual({
        ...inlineHeader,
        props: {
          ...inlineHeader.props,
          id: expect.any(String),
          slots: {
            ...inlineHeader.props.slots,
            LinksSlot: inlineHeader.props.slots.LinksSlot.map((links: any) => ({
              ...links,
              props: { ...links.props, id: expect.any(String) },
            })),
          },
        },
      });
      expect(menuHeader.props.id).not.toBe(inlineHeader.props.id);
      for (const [
        linksIndex,
        menuLinks,
      ] of menuHeader.props.slots.LinksSlot.entries()) {
        expect(menuLinks.props.id).not.toBe(
          inlineHeader.props.slots.LinksSlot[linksIndex].props.id
        );
      }
    }
    expect(primary.slots.LinksSlot[0].props.parentData.type).toBe("Primary");
    expect(secondary.slots.LinksSlot[0].props.parentData.type).toBe(
      "Secondary"
    );
    expect(primary.styles.surface).toBe("page");
    expect(secondary.styles.surface).toBe("muted");
    expect(authored(resolved)).toEqual(authored(layout));
  });
});
