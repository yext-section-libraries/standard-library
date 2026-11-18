import { describe, expect, it } from "vitest";
import { CTAWrapper } from "../library/sections/CTAWrapper.tsx";

type ResolveFields = NonNullable<typeof CTAWrapper.resolveFields>;

const variantValues = (fields: Awaited<ReturnType<ResolveFields>>) => {
  const styles = fields.styles;
  if (styles.type !== "object") {
    throw new Error("Expected CTA style fields");
  }
  const variant = styles.objectFields.variant;
  if (variant.type !== "radio") {
    throw new Error("Expected CTA variant options");
  }
  return variant.options.map(({ value }) => value);
};

describe("CTA variants", () => {
  it.each([null, "Grid", "HeroSection", "PromoSection", "AddressSlot"])(
    "excludes navigation links in content (%s)",
    async (parentType) => {
      const fields = await CTAWrapper.resolveFields!(
        {
          type: "CTASlot",
          props: { ...CTAWrapper.defaultProps, id: "cta" },
        } as Parameters<ResolveFields>[0],
        {
          parent: parentType
            ? { type: parentType, props: { id: "parent" } }
            : null,
        } as Parameters<ResolveFields>[1]
      );
      expect(variantValues(fields)).toEqual([
        "primary-button",
        "secondary-button",
        "link",
      ]);
    }
  );

  it.each(["PrimaryHeaderSlot", "ExpandedFooter", "SecondaryFooterSlot"])(
    "retains navigation links in %s, including CTAs with parent-owned data",
    async (parentType) => {
      const fields = await CTAWrapper.resolveFields!(
        {
          type: "CTASlot",
          props: {
            ...CTAWrapper.defaultProps,
            id: "cta",
            parentData: {
              field: "c_cta",
              cta: { label: "Contact", link: "/" },
            },
          },
        } as Parameters<ResolveFields>[0],
        {
          parent: { type: parentType, props: { id: "parent" } },
        } as Parameters<ResolveFields>[1]
      );
      expect(variantValues(fields)).toContain("navigation-link");
    }
  );
});
