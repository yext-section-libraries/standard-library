import { bodyTextDefaults } from "./textInheritance.ts";
import { getThemeColorCssValue } from "@yext/visual-editor";
import { sectionContent } from "./recipes.ts";

export const composableSectionNames = [
  "AboutSection",
  "BannerSection",
  "BreadcrumbsSection",
  "CoreInfoSection",
  "EventSection",
  "FAQSection",
  "FormSection",
  "HeroSection",
  "InsightSection",
  "NearbyLocationsSection",
  "PhotoGallerySection",
  "ProductSection",
  "ProfessionalHeroSection",
  "PromoSection",
  "ReviewsSection",
  "StaticMapSection",
  "TeamSection",
  "TestimonialSection",
  "VideoSection",
] as const;

/** Assign missing IDs without changing IDs referenced by mapped card sources. */
export function assignCompositionIds(value: unknown, prefix: string): unknown {
  if (Array.isArray(value))
    return value.map((child, index) =>
      assignCompositionIds(child, `${prefix}-${index}`)
    );
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, any>;
  const result: Record<string, any> = Object.fromEntries(
    Object.entries(record).map(([key, child]) => [
      key,
      assignCompositionIds(child, `${prefix}-${key}`),
    ])
  );
  if (typeof record.type === "string" && record.props)
    result.props.id ??= prefix;
  return result;
}

export function compositionData(
  name: string,
  props: Record<string, any>,
  assignIds = false
) {
  const compact = name === "BannerSection" || name === "BreadcrumbsSection";
  const content = sectionContent(name, props);
  return {
    content: assignIds
      ? assignCompositionIds(content, `${props.id ?? name}-composition`)
      : content,
    as: "section",
    liveVisibility: props.liveVisibility ?? true,
    hideWhenMappedContentEmpty: true,
    analytics: props.analytics,
    typography: {
      ...bodyTextDefaults,
      color:
        getThemeColorCssValue(props.styles?.textColor?.selectedColor) ??
        (props.styles?.backgroundColor?.contrastingColor === "white"
          ? "var(--color-on-dark, white)"
          : "var(--color-text, #172033)"),
    },
    spacing: {
      paddingBlockStart: compact
        ? "1rem"
        : "var(--padding-pageSection-verticalPadding, 4rem)",
      paddingBlockEnd: compact
        ? "1rem"
        : "var(--padding-pageSection-verticalPadding, 4rem)",
      paddingInlineStart: "var(--space-6, 1.5rem)",
      paddingInlineEnd: "var(--space-6, 1.5rem)",
    },
    surface: {
      backgroundColor:
        getThemeColorCssValue(props.styles?.backgroundColor?.selectedColor) ??
        "var(--color-surface, #fff)",
    },
  };
}
