import type { Migration } from "@yext/visual-editor";
import { compositionData } from "../shared/design/compositionData.ts";

const updateSection = (name: string) => ({
  action: "updated" as const,
  propTransformation: (props: { id: string } & Record<string, any>) =>
    props.content !== undefined
      ? props
      : {
          id: props.id,
          ...compositionData(name, props, true),
        },
});

/** Keep authored content and mappings while replacing fixed layout slots with editable atoms. */
export const composableSections = {
  AboutSection: updateSection("AboutSection"),
  BannerSection: updateSection("BannerSection"),
  BreadcrumbsSection: updateSection("BreadcrumbsSection"),
  CoreInfoSection: updateSection("CoreInfoSection"),
  EventSection: updateSection("EventSection"),
  FAQSection: updateSection("FAQSection"),
  FormSection: updateSection("FormSection"),
  HeroSection: updateSection("HeroSection"),
  InsightSection: updateSection("InsightSection"),
  NearbyLocationsSection: updateSection("NearbyLocationsSection"),
  PhotoGallerySection: updateSection("PhotoGallerySection"),
  ProductSection: updateSection("ProductSection"),
  ProfessionalHeroSection: updateSection("ProfessionalHeroSection"),
  PromoSection: updateSection("PromoSection"),
  ReviewsSection: updateSection("ReviewsSection"),
  StaticMapSection: updateSection("StaticMapSection"),
  TeamSection: updateSection("TeamSection"),
  TestimonialSection: updateSection("TestimonialSection"),
  VideoSection: updateSection("VideoSection"),
} satisfies Migration;
