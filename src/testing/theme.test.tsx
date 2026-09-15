import * as React from "react";
import { describe, it, expect } from "vitest";
import { page } from "@vitest/browser/context";
import { render as reactRender, waitFor } from "@testing-library/react";
import {
  Render,
  Config,
  DefaultComponentProps,
  Data,
  DefaultRootProps,
} from "@puckeditor/core";
import {
  migrationRegistry,
  migrate,
  MainContent,
  VisualEditorProvider,
} from "@yext/visual-editor";
import { testHours, testSetup, viewports } from "./componentTests.setup.ts";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import { AboutSection } from "../library/sections/AboutSection.tsx";
import { BannerSection } from "../library/sections/BannerSection.tsx";
import { BreadcrumbsSection } from "../library/sections/BreadcrumbsSection.tsx";
import { CoreInfoSection } from "../library/sections/CoreInfoSection.tsx";
import { EventSection } from "../library/sections/EventSection.tsx";
import { FAQSection } from "../library/sections/FAQSection.tsx";
import { HeroSection } from "../library/sections/HeroSection.tsx";
import { InsightSection } from "../library/sections/InsightSection.tsx";
import { NearbyLocationsSection } from "../library/sections/NearbyLocationsSection.tsx";
import { PhotoGallerySection } from "../library/sections/PhotoGallerySection.tsx";
import { ProductSection } from "../library/sections/ProductSection.tsx";
import { ProfessionalHeroSection } from "../library/sections/ProfessionalHeroSection.tsx";
import { PromoSection } from "../library/sections/PromoSection.tsx";
import { ReviewsSection } from "../library/sections/ReviewsSection.tsx";
import { StaticMapSection } from "../library/sections/StaticMapSection.tsx";
import { TeamSection } from "../library/sections/TeamSection.tsx";
import { TestimonialSection } from "../library/sections/TestimonialSection.tsx";
import { VideoSection } from "../library/sections/VideoSection.tsx";
import { ExpandedHeader } from "../library/sections/ExpandedHeader.tsx";
import { ExpandedFooter } from "../library/sections/ExpandedFooter.tsx";

const testDocument = {
  locale: "en",
  name: "name",
  hours: testHours,
  ref_reviewsAgg: [
    {
      averageRating: 4.1,
      publisher: "FIRSTPARTY",
      reviewCount: 26,
    },
  ],
};

interface RootProps extends DefaultRootProps {
  version: number;
}

type ThemeTest = {
  name: string;
  document: Record<string, any>;
  theme: Record<string, any>;
  data: Data<DefaultComponentProps, RootProps>;
};

describe("ThemeTest", async () => {
  const puckConfig: Config = {
    components: {
      AboutSection,
      BannerSection,
      BreadcrumbsSection,
      CoreInfoSection,
      EventSection,
      FAQSection,
      HeroSection,
      InsightSection,
      NearbyLocationsSection,
      PhotoGallerySection,
      ProductSection,
      ProfessionalHeroSection,
      PromoSection,
      ReviewsSection,
      StaticMapSection,
      TeamSection,
      TestimonialSection,
      VideoSection,
      ExpandedHeader,
      ExpandedFooter,
      ...sharedComponentConfigs,
      MainContent,
    },
    root: {
      render: ({ children }: { children: React.ReactNode }) => {
        return <>{children}</>;
      },
    },
  };

  const test: ThemeTest = {
    name: "hero section theme test",
    document: testDocument,
    data: {
      root: {
        props: { version: 53 },
      },
      zones: {},
      content: [
        {
          type: "HeroSection",
          props: {
            data: {
              backgroundImage: {
                field: "",
                constantValue: {
                  url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=360&width=640&fit=max",
                  width: 640,
                  height: 360,
                },
                constantValueEnabled: true,
              },
            },
            styles: {
              variant: "classic",
              backgroundColor: {
                bgColor: "bg-palette-secondary-light",
                textColor: "text-black",
              },
              showAverageReview: true,
              showImage: true,
              imageHeight: 500,
              desktopImagePosition: "right",
              desktopContainerPosition: "left",
              mobileContentAlignment: "left",
              mobileImagePosition: "bottom",
            },
            slots: {
              BusinessNameSlot: [
                {
                  type: "HeadingTextSlot",
                  props: {
                    id: "HeadingTextSlot-dc7db034-a46e-42b6-a23d-b6ce2a6bc598",
                    data: {
                      text: {
                        constantValue: {
                          en: "Business Name",
                          hasLocalizedValue: "true",
                        },
                        constantValueEnabled: true,
                        field: "",
                      },
                    },
                    styles: {
                      level: 3,
                      align: "left",
                      semanticLevelOverride: 2,
                    },
                  },
                },
              ],
              GeomodifierSlot: [
                {
                  type: "HeadingTextSlot",
                  props: {
                    id: "HeadingTextSlot-6670f87c-0617-46bc-b22a-45ba5d0580fc",
                    data: {
                      text: {
                        constantValue: {
                          en: "Geomodifier",
                          hasLocalizedValue: "true",
                        },
                        constantValueEnabled: true,
                        field: "",
                      },
                    },
                    styles: {
                      level: 1,
                      align: "left",
                    },
                  },
                },
              ],
              HoursStatusSlot: [
                {
                  type: "HoursStatusSlot",
                  props: {
                    id: "HoursStatusSlot-8771605f-5fda-489f-b66a-fe2dd3a1d8f6",
                    data: {
                      hours: {
                        field: "hours",
                        constantValue: {},
                      },
                    },
                    styles: {
                      dayOfWeekFormat: "long",
                      showDayNames: true,
                      showCurrentStatus: true,
                    },
                  },
                },
              ],
              ImageSlot: [
                {
                  type: "HeroImageSlot",
                  props: {
                    id: "HeroImageSlot-48daf6e6-0497-43c5-b76f-5fe28cce2485",
                    data: {
                      image: {
                        field: "",
                        constantValue: {
                          url: "https://images.unsplash.com/photo-1504548840739-580b10ae7715?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=360&width=640&fit=max",
                          width: 640,
                          height: 360,
                        },
                        constantValueEnabled: true,
                      },
                    },
                    styles: {
                      aspectRatio: 1.78,
                      width: 490,
                    },
                    variant: "classic",
                    className:
                      "mx-auto max-w-full md:max-w-[350px] lg:max-w-[calc(min(calc(100vw-1.5rem),var(--maxWidth-pageSection-contentWidth))-350px)] rounded-image-borderRadius",
                  },
                },
              ],
              PrimaryCTASlot: [
                {
                  type: "CTASlot",
                  props: {
                    id: "CTASlot-6d84e36d-832d-4215-ad21-b9f4b7b17535",
                    data: {
                      entityField: {
                        field: "",
                        constantValue: {
                          label: {
                            en: "Call To Action",
                            hasLocalizedValue: "true",
                          },
                          link: {
                            en: "#",
                            hasLocalizedValue: "true",
                          },
                          linkType: "URL",
                          ctaType: "textAndLink",
                        },
                      },
                    },
                    eventName: "primaryCta",
                    styles: {
                      variant: "primary",
                      presetImage: "app-store",
                    },
                    parentStyles: {},
                  },
                },
              ],
              SecondaryCTASlot: [
                {
                  type: "CTASlot",
                  props: {
                    id: "CTASlot-38ccac87-b5c1-44a5-aee9-d81adc14eb95",
                    data: {
                      entityField: {
                        field: "",
                        constantValue: {
                          label: {
                            en: "Learn More",
                            hasLocalizedValue: "true",
                          },
                          link: {
                            en: "#",
                            hasLocalizedValue: "true",
                          },
                          linkType: "URL",
                          ctaType: "textAndLink",
                        },
                        selectedType: "textAndLink",
                      },
                    },
                    styles: {
                      variant: "link",
                      presetImage: "app-store",
                    },
                    eventName: "secondaryCta",
                    parentStyles: {},
                  },
                },
              ],
            },
            analytics: {
              scope: "heroSection",
            },
            liveVisibility: true,
            id: "HeroSection-3231b368-0ecb-43eb-9f49-e1483545ef78",
            conditionalRender: {
              hours: true,
            },
          },
        },
      ],
    },
    theme: {
      "--fontFamily-link-fontFamily":
        "'Courier Prime', 'Courier Prime Fallback', monospace",
      "--fontSize-link-fontSize": "20px",
      "--fontWeight-link-fontWeight": "400",
      "--textTransform-link-textTransform": "none",
      "--letterSpacing-link-letterSpacing": "0em",
      "--display-link-caret": "none",
      "--fontFamily-body-fontFamily":
        "'Are You Serious', 'Are You Serious Fallback', cursive",
      "--fontSize-body-fontSize": "14px",
      "--fontWeight-body-fontWeight": "400",
      "--textTransform-body-textTransform": "uppercase",
      "--maxWidth-pageSection-contentWidth": "1024px",
      "--padding-pageSection-verticalPadding": "48px",
      "--fontFamily-button-fontFamily":
        "'Are You Serious', 'Are You Serious Fallback', cursive",
      "--fontSize-button-fontSize": "16px",
      "--fontWeight-button-fontWeight": "700",
      "--borderRadius-button-borderRadius": "9999px",
      "--textTransform-button-textTransform": "lowercase",
      "--letterSpacing-button-letterSpacing": "0.1em",
      "--borderRadius-image-borderRadius": "24px",
      "--colors-palette-primary": "#417505",
      "--colors-palette-primary-contrast": "#FFFFFF",
      "--colors-palette-secondary": "#dd86e9",
      "--colors-palette-secondary-contrast": "#000000",
      "--colors-palette-tertiary": "#000000",
      "--colors-palette-tertiary-contrast": "#FFFFFF",
      "--colors-palette-quaternary": "#ffffff",
      "--colors-palette-quaternary-contrast": "#000000",
      "--fontFamily-h1-fontFamily":
        "'Roboto Serif', 'Roboto Serif Fallback', serif",
      "--fontSize-h1-fontSize": "48px",
      "--fontWeight-h1-fontWeight": "700",
      "--textTransform-h1-textTransform": "none",
    },
  };

  beforeEach(() => {
    testSetup(test.theme);
  });

  it.each([
    { ...test, viewport: viewports.desktop },
    { ...test, viewport: viewports.tablet },
    { ...test, viewport: viewports.mobile },
  ])(
    "$viewport.name $name",
    async ({
      name,
      document,
      data,
      viewport: { width, height, name: viewportName },
    }) => {
      const migratedData = migrate(
        puckConfig,
        data,
        document,
        migrationRegistry
      );

      const { container } = reactRender(
        <VisualEditorProvider templateProps={{ document }}>
          <Render config={puckConfig} data={migratedData} />
        </VisualEditorProvider>
      );

      await page.viewport(width, height);

      const images = Array.from(container.querySelectorAll("img"));
      await waitFor(() => {
        expect(images.every((i) => i.complete)).toBe(true);
      });

      await expect(`ThemeTest/[${viewportName}] ${name}`).toMatchScreenshot();
    }
  );
});
