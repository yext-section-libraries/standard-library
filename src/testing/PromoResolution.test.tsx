import { describe, expect, it } from "vitest";
import { makeLayout, authored, resolve } from "./generationTestUtils.ts";

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
