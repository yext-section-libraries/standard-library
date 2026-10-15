import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AboutSection } from "../library/sections/AboutSection.tsx";
import { BreadcrumbsSection } from "../library/sections/BreadcrumbsSection.tsx";
import { ExpandedFooter } from "../library/sections/ExpandedFooter.tsx";
import { StaticMapSection } from "../library/sections/StaticMapSection.tsx";
import {
  AboutSectionDetailsColumn,
  defaultAboutSectionProps,
} from "../library/shared/sectionSupport/pageSections/AboutSection/AboutSectionDetailsColumn.tsx";
import { CopyrightMessageSlot } from "../library/shared/sectionSupport/footer/CopyrightMessageSlot.tsx";
import { FooterExpandedLinkSectionSlot } from "../library/shared/sectionSupport/footer/FooterExpandedLinkSectionSlot.tsx";
import { FooterExpandedLinksWrapper } from "../library/shared/sectionSupport/footer/FooterExpandedLinksWrapper.tsx";
import { FooterLinksSlot } from "../library/shared/sectionSupport/footer/FooterLinksSlot.tsx";
import { FooterLogoSlot } from "../library/shared/sectionSupport/footer/FooterLogoSlot.tsx";
import { FooterSocialLinksSlot } from "../library/shared/sectionSupport/footer/FooterSocialLinksSlot.tsx";
import { FooterUtilityImagesSlot } from "../library/shared/sectionSupport/footer/FooterUtilityImagesSlot.tsx";
import { SecondaryFooterSlot } from "../library/shared/sectionSupport/footer/SecondaryFooterSlot.tsx";
import { aboutSectionDetailsColumnSchema } from "../library/shared/generation/about.ts";
import { staticMapSectionSchema } from "../library/shared/generation/staticMap.ts";

const components = {
  AboutSection,
  BreadcrumbsSection,
  ExpandedFooter,
  StaticMapSection,
  AboutSectionDetailsColumn,
  CopyrightMessageSlot,
  FooterExpandedLinkSectionSlot,
  FooterExpandedLinksWrapper,
  FooterLinksSlot,
  FooterLogoSlot,
  FooterSocialLinksSlot,
  FooterUtilityImagesSlot,
  SecondaryFooterSlot,
};

describe("generation schemas", () => {
  it.each(Object.entries(components))(
    "%s registers a serializable schema accepting its authored defaults",
    (_name, component) => {
      const schema = component.generation?.props;
      expect(schema).toBeDefined();
      expect(() => schema!.parse(component.defaultProps)).not.toThrow();
      expect(() => z.toJSONSchema(schema!)).not.toThrow();
    }
  );

  it("accepts every supported About sidebar content type and rejects mismatched content", () => {
    for (const [type, content] of Object.entries(defaultAboutSectionProps)) {
      const section = {
        header: { field: "", constantValue: { defaultValue: "Details" } },
        content: { type, [type]: content },
      };
      expect(() =>
        aboutSectionDetailsColumnSchema.parse({ sections: [section] })
      ).not.toThrow();
      expect(
        aboutSectionDetailsColumnSchema.safeParse({
          sections: [{ ...section, content: { type } }],
        }).success
      ).toBe(false);
    }
  });

  it("rejects unsupported map styles", () => {
    expect(
      staticMapSectionSchema.safeParse({
        ...StaticMapSection.defaultProps,
        styles: { mapStyle: "unsupported" },
      }).success
    ).toBe(false);
  });
});
