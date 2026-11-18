import { surfaceRoles } from "./theme.ts";
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
  const background = props.styles?.backgroundColor;
  return {
    content: assignIds
      ? assignCompositionIds(content, `${props.id ?? name}-composition`)
      : content,
    as: "section",
    liveVisibility: props.liveVisibility ?? true,
    hideWhenMappedContentEmpty: true,
    analytics: props.analytics,
    surfaceRole: surfaceRoles.includes(background) ? background : "page",
    spacing: {
      paddingBlockStart: compact
        ? "1rem"
        : "var(--ve-page-section-vertical-spacing)",
      paddingBlockEnd: compact
        ? "1rem"
        : "var(--ve-page-section-vertical-spacing)",
      paddingInlineStart: "var(--space-6, 1.5rem)",
      paddingInlineEnd: "var(--space-6, 1.5rem)",
    },
  };
}
