import { describe, expect, it } from "vitest";
import { adoptSemanticThemeProps } from "../library/migrations/0005_semantic_theme_roles.ts";

const explicitStyles = {
  backgroundColor: { selectedColor: "white", contrastingColor: "black" },
  color: { selectedColor: "palette-primary-light", contrastingColor: "black" },
  textColor: { selectedColor: "[#123456]", contrastingColor: "white" },
  labelColor: { selectedColor: "black", contrastingColor: "white" },
  iconColor: { selectedColor: "palette-tertiary", contrastingColor: "black" },
  fontSize: "lg",
  weight: "700",
  fontStyle: "italic",
  variant: "sm",
  maxWidth: "1280px",
  align: "right",
  spacing: 12,
};

describe("non-destructive semantic theme adoption", () => {
  it.each([
    "ExpandedHeader",
    "PrimaryHeaderSlot",
    "SecondaryHeaderSlot",
    "HeaderLinks",
    "BannerSection",
    "HeroSection",
    "ProductSection",
    "ProductCard",
    "BodyTextSlot",
    "TextSlot",
    "PhoneSlot",
    "HoursStatusSlot",
    "Directory",
    "DirectoryCard",
    "Locator",
    "AboutSection",
    "CoreInfoSection",
    "PromoSection",
    "ProfessionalHeroSection",
    "EventSection",
    "InsightSection",
    "TeamSection",
    "TestimonialSection",
    "FAQSection",
    "ReviewsSection",
    "FormSection",
    "Grid",
    "ExpandedFooter",
  ])("preserves every saved explicit override on %s", (type) => {
    const props = {
      id: "stable-component",
      styles: structuredClone(explicitStyles),
      data: {
        title: { field: "name", constantValue: "Example" },
        link: "/custom-url",
      },
      slots: { EmptySlot: [] },
      liveVisibility: false,
    };
    const before = structuredClone(props);
    const migrated = adoptSemanticThemeProps(type, props);
    expect(migrated.styles).toMatchObject(explicitStyles);
    expect(migrated.data).toEqual(before.data);
    expect(migrated.slots).toEqual(before.slots);
    expect(migrated.id).toBe(before.id);
    expect(migrated.liveVisibility).toBe(false);
    expect(adoptSemanticThemeProps(type, migrated)).toEqual(migrated);
    expect(props).toEqual(before);
  });

  it.each([
    [1, "headline"],
    [2, "section-title"],
    [3, "card-title"],
    [4, "card-title"],
    [5, "card-title"],
    [6, "card-title"],
  ])(
    "converts H%s appearance without keeping generated tags",
    (level, role) => {
      const result = adoptSemanticThemeProps("HeadingTextSlot", {
        id: "title",
        styles: {
          level,
          semanticLevelOverride: 6,
          color: explicitStyles.color,
        },
      });
      expect(result.styles).toEqual({
        level: 2,
        semanticLevelOverride: 2,
        typographyRole: role,
        color: explicitStyles.color,
      });
    }
  );

  it("keeps explicit typography roles and placement-owned Directory semantics", () => {
    const heading = (id: string) => ({
      type: "HeadingTextSlot",
      props: {
        id,
        styles: {
          level: 1,
          typographyRole: "body-small",
          semanticLevelOverride: 6,
        },
        data: { text: { field: "name" } },
      },
    });
    const result = adoptSemanticThemeProps("Directory", {
      id: "directory",
      styles: { surface: "accent" },
      slots: { TitleSlot: [heading("title")], SiteNameSlot: [heading("site")] },
    });
    expect(result.styles.surface).toBe("accent");
    expect(result.slots.TitleSlot[0].props.styles).toMatchObject({
      semanticLevelOverride: 1,
      typographyRole: "body-small",
    });
    expect(result.slots.SiteNameSlot[0].props.styles).toMatchObject({
      semanticLevelOverride: "p",
      typographyRole: "body-small",
    });
    expect(result.slots.SiteNameSlot[0].props.id).toBe("site");
    expect(adoptSemanticThemeProps("Directory", result)).toEqual(result);
  });

  it.each([
    "primary",
    "secondary",
    "directoryLink",
    "headerFooterMainLink",
    "headerFooterSecondaryLink",
    "navigation-link",
  ])("retains the supported CTA alias %s and its colors", (variant) => {
    const props = {
      id: "cta",
      styles: {
        variant,
        color: explicitStyles.color,
        textColor: explicitStyles.textColor,
      },
    };
    expect(adoptSemanticThemeProps("CTASlot", props)).toEqual(props);
  });

  it("converts per-entity locator typography while retaining custom values and settings", () => {
    const settings = {
      entityType: "location",
      primaryHeading: {
        headingLevel: 1,
        field: "name",
        color: explicitStyles.color,
      },
      pinColor: explicitStyles.textColor,
      primaryCTA: { link: "/book", color: explicitStyles.color },
      showHours: false,
    };
    const result = adoptSemanticThemeProps("Locator", {
      id: "locator",
      resultCards: { location: settings },
    });
    expect(result.resultCards.location).toEqual({
      ...settings,
      primaryHeading: {
        field: "name",
        color: explicitStyles.color,
        typographyRole: "headline",
      },
    });
    expect(adoptSemanticThemeProps("Locator", result)).toEqual(result);
  });
});
