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
});
