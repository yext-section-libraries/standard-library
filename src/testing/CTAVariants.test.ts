import { describe, expect, it } from "vitest";
import { Button } from "../library/sections/Button.tsx";
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

describe("Button atom interaction styles", () => {
  it.each([
    { action: "link", binding: "page", image: true, visible: false },
    { action: "link", binding: "page", image: false, visible: true },
    { action: "button", binding: "page", image: true, visible: true },
    { action: "link", binding: "cta", image: true, visible: true },
  ] as const)(
    "resolves the style selector for $action / $binding / image=$image",
    async ({ action, binding, image, visible }) => {
      const defaults = Button.defaultProps!;
      const resolveFields = Button.resolveFields!;
      const fields = await resolveFields(
        {
          props: {
            ...defaults,
            id: "button",
            action,
            binding,
            cta: {
              field: "",
              constantValueEnabled: true,
              constantValue: {
                ctaType: image ? "presetImage" : "textAndLink",
                label: "Call to action",
                link: "/",
              },
            },
          },
        },
        { metadata: {} } as Parameters<typeof resolveFields>[1]
      );
      expect(fields.interactionRole?.visible).toBe(visible);
    }
  );
});

describe("CTA variants", () => {
  it.each(["presetImage", "textAndLink"] as const)(
    "shows only relevant appearance fields for %s CTAs",
    async (ctaType) => {
      const defaults = CTAWrapper.defaultProps!;
      const fields = await CTAWrapper.resolveFields!(
        {
          type: "CTASlot",
          props: {
            ...defaults,
            id: "cta",
            data: {
              ...defaults.data!,
              entityField: {
                field: "",
                constantValueEnabled: true,
                constantValue: {
                  ctaType,
                  label: "Call to action",
                  link: "/",
                  linkType: "URL",
                },
              },
            },
          },
        } as Parameters<ResolveFields>[0],
        { parent: null } as Parameters<ResolveFields>[1]
      );
      if (fields.styles.type !== "object")
        throw new Error("Expected CTA style fields");
      const { variant, color, textColor, presetImage } =
        fields.styles.objectFields;
      expect([variant.visible, color?.visible, textColor?.visible]).toEqual(
        Array(3).fill(ctaType !== "presetImage")
      );
      expect(presetImage?.visible).toBe(ctaType === "presetImage");
    }
  );

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
