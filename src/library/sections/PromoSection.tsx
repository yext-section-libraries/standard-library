import { promoSectionSchema } from "../shared/generation/promo.ts";
import { setDeep, Slot } from "@puckeditor/core";
import {
  PromoSectionType,
  backgroundColors,
  ThemeColor,
  ThemeOptions,
  msg,
  getAnalyticsScopeHash,
  ComponentFields,
  YextEntityField,
  resolveYextEntityField,
  getDefaultRTF,
  themeManagerCn,
  useDocument,
  TranslatableAssetImage,
  AssetImageType,
  toPuckFields,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import { VisibilityWrapper } from "../shared/sectionSupport/atoms/visibilityWrapper.tsx";
import { BodyTextProps } from "./BodyText.tsx";
import { CTAWrapperProps } from "./CTAWrapper.tsx";
import { HeadingTextProps } from "./HeadingText.tsx";
import { ImageWrapperProps } from "./ImageWrapper.tsx";
import { VideoProps } from "../shared/sectionSupport/contentBlocks/Video.tsx";
import {
  AnalyticsScopeProvider,
  ComplexImageType,
  ImageType,
} from "@yext/pages-components";
import { updateFields } from "../shared/utils/updateFields.ts";
import { ClassicPromo } from "../shared/sectionSupport/pageSections/PromoSection/ClassicPromo.tsx";
import { SpotlightPromo } from "../shared/sectionSupport/pageSections/PromoSection/SpotlightPromo.tsx";
import { ImmersivePromo } from "../shared/sectionSupport/pageSections/PromoSection/ImmersivePromo.tsx";
import { CompactPromo } from "../shared/sectionSupport/pageSections/PromoSection/CompactPromo.tsx";
import { useTranslation } from "react-i18next";
import { PromoEmptyState } from "../shared/sectionSupport/pageSections/PromoSection/PromoEmptyState.tsx";
import {
  ComponentErrorBoundary,
  getRandomPlaceholderImageObject,
} from "@yext/visual-editor/section-library-support";

export interface PromoData {
  /**
   * The source for the promotional content, including an image, title, description, and a call-to-action.
   * @defaultValue Placeholder content for a featured promotion.
   */
  promo: YextEntityField<PromoSectionType | {}>;

  /**
   * Determines whether to display an image or video in the media section.
   * @defaultValue 'image'
   */
  media: "image" | "video";

  /**
   * The background image used by the immersive and spotlight variants.
   * @defaultValue Placeholder image.
   */
  backgroundImage: YextEntityField<
    ImageType | ComplexImageType | AssetImageType | TranslatableAssetImage
  >;
}

export interface PromoStyles {
  /**
   * The visual variant for the promo section.
   * @defaultValue classic
   */
  variant: "classic" | "immersive" | "spotlight" | "compact";

  /**
   * The background color for the entire section.
   * @defaultValue Background Color 1
   */
  backgroundColor?: ThemeColor;

  /**
   * Positions the media to the left or right of the promo content on desktop (classic and compact variants).
   * @defaultValue right
   */
  desktopImagePosition: "left" | "right";

  /**
   * Positions the media to the top or bottom of the promo content on mobile (classic and compact variants).
   * @defaultValue top
   */
  mobileImagePosition: "top" | "bottom";

  /**
   * Text content position and alignment.
   * @defaultValue left
   */
  containerAlignment: "left" | "center" | "right";

  /**
   * Image Height for the promo image with Immersive or Spotlight variant
   * Minimum height: content height + Page Section Top/Bottom Padding
   * @defaultValue 500px
   */
  imageHeight: number;

  /**
   * Whether to show the media content, either image or video.
   * @defaultValue true
   */
  showMedia: boolean;

  /**
   * Whether to show the heading text.
   * @defaultValue true
   */
  showHeading: boolean;

  /**
   * Whether to show the description text.
   * @defaultValue true
   */
  showDescription: boolean;

  /**
   * Whether to show the CTA.
   * @defaultValue true
   */
  showCTA: boolean;
}

export interface PromoSectionProps {
  /**
   * This object contains the content to be displayed by the component.
   * @propCategory Data Props
   */
  data: PromoData;

  /** @internal Resolved entity media; authored data remains the canonical baseline. */
  parentData?: Pick<PromoData, "media" | "backgroundImage">;

  /**
   * This object contains properties for customizing the component's appearance.
   * @propCategory Style Props
   */
  styles: PromoStyles;

  /** @internal */
  slots: {
    HeadingSlot: Slot;
    DescriptionSlot: Slot;
    VideoSlot: Slot;
    ImageSlot: Slot;
    CTASlot: Slot;
  };

  /** @internal */
  analytics: {
    scope?: string;
  };

  /**
   * If 'true', the component is visible on the live page; if 'false', it's hidden.
   * @defaultValue true
   */
  liveVisibility?: boolean;
}

export type PromoVariantProps = Pick<
  PromoSectionProps,
  "data" | "styles" | "slots"
>;

const promoSectionFields: YextFields<PromoSectionProps> = {
  data: {
    type: "object",
    label: msg("fields.data", "Data"),
    objectFields: {
      promo: {
        type: "entityField",
        label: msg("fields.promo", "Promo"),
        filter: {
          types: [ComponentFields.PromoSection.type],
        },
      },
      media: {
        label: msg("fields.media", "Media"),
        type: "radio",
        options: [
          { label: msg("fields.options.image", "Image"), value: "image" },
          { label: msg("fields.options.video", "Video"), value: "video" },
        ],
      },
      backgroundImage: {
        type: "entityField",
        label: msg("fields.image", "Image"),
        filter: {
          types: ["type.image"],
        },
      },
    },
  },
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      variant: {
        type: "basicSelector",
        label: msg("fields.variant", "Variant"),
        options: [
          { label: msg("fields.options.classic", "Classic"), value: "classic" },
          {
            label: msg("fields.options.immersive", "Immersive"),
            value: "immersive",
          },
          {
            label: msg("fields.options.spotlight", "Spotlight"),
            value: "spotlight",
          },
          {
            label: msg("fields.options.compact", "Compact"),
            value: "compact",
          },
        ],
      },
      backgroundColor: {
        type: "basicSelector",
        label: msg("fields.backgroundColor", "Background Color"),
        options: "BACKGROUND_COLOR",
      },
      desktopImagePosition: {
        label: msg("fields.desktopMediaPosition", "Desktop Media Position"),
        type: "radio",
        options: [
          {
            label: msg("fields.options.left", "Left", {
              context: "direction",
            }),
            value: "left",
          },
          {
            label: msg("fields.options.right", "Right", {
              context: "direction",
            }),
            value: "right",
          },
        ],
      },
      mobileImagePosition: {
        label: msg("fields.mobileMediaPosition", "Mobile Media Position"),
        type: "radio",
        options: ThemeOptions.VERTICAL_POSITION,
      },
      containerAlignment: {
        label: msg("fields.containerAlignment", "Container Alignment"),
        type: "radio",
        options: ThemeOptions.ALIGNMENT,
      },
      imageHeight: {
        type: "number",
        label: msg("fields.imageHeight", "Image Height"),
        min: 0,
      },
      showMedia: {
        label: msg("fields.showMedia", "Show Media"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
      showHeading: {
        label: msg("fields.showHeading", "Show Heading"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
      showDescription: {
        label: msg("fields.showDescription", "Show Description"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
      showCTA: {
        label: msg("fields.showCTA", "Show CTA"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
    },
  },
  slots: {
    type: "object",
    visible: false,
    objectFields: {
      HeadingSlot: { type: "slot", allow: ["HeadingTextSlot"] },
      DescriptionSlot: { type: "slot", allow: ["BodyTextSlot"] },
      ImageSlot: { type: "slot", allow: ["ImageSlot"] },
      VideoSlot: { type: "slot", allow: ["VideoSlot"] },
      CTASlot: { type: "slot", allow: ["CTASlot"] },
    },
  },
  analytics: {
    type: "object",
    label: msg("fields.analytics", "Analytics"),
    visible: false,
    objectFields: {
      scope: {
        label: msg("fields.scope", "Scope"),
        type: "text",
      },
    },
  },
  liveVisibility: {
    label: msg("fields.visibleOnLivePage", "Visible on Live Page"),
    type: "radio",
    options: [
      { label: msg("fields.options.show", "Show"), value: true },
      { label: msg("fields.options.hide", "Hide"), value: false },
    ],
  },
};

export const PromoSection: YextComponentConfig<PromoSectionProps> = {
  generation: { props: promoSectionSchema },
  label: msg("components.promo", "Promo"),
  fields: promoSectionFields,
  defaultProps: {
    data: {
      promo: {
        field: "",
        constantValue: {},
        constantValueEnabled: true,
      },
      media: "image",
      backgroundImage: {
        field: "",
        constantValue: {
          ...getRandomPlaceholderImageObject({ width: 550, height: 310 }),
          width: 550,
          height: 310,
        },
        constantValueEnabled: true,
      },
    },
    styles: {
      variant: "classic",
      backgroundColor: backgroundColors.background1.value,
      desktopImagePosition: "left",
      mobileImagePosition: "top",
      containerAlignment: "left",
      imageHeight: 500,
      showMedia: true,
      showHeading: true,
      showDescription: true,
      showCTA: true,
    },
    slots: {
      HeadingSlot: [
        {
          type: "HeadingTextSlot",
          props: {
            data: {
              text: {
                field: "",
                constantValue: { defaultValue: "Featured Promotion" },
                constantValueEnabled: true,
              },
            },
            styles: { level: 2, align: "left" },
          } satisfies HeadingTextProps,
        },
      ],
      DescriptionSlot: [
        {
          type: "BodyTextSlot",
          props: {
            data: {
              text: {
                field: "",
                constantValue: {
                  defaultValue: getDefaultRTF(
                    "Lorem ipsum dolor sit amet, consectetur adipiscing. Maecenas finibus placerat justo. 100 characters"
                  ),
                },
                constantValueEnabled: true,
              },
            },
            styles: { variant: "base" },
          } satisfies BodyTextProps,
        },
      ],
      VideoSlot: [
        {
          type: "VideoSlot",
          props: {
            data: {
              assetVideo: undefined,
            },
          } satisfies VideoProps,
        },
      ],
      ImageSlot: [
        {
          type: "ImageSlot",
          props: {
            data: {
              image: {
                field: "",
                constantValue: {
                  ...getRandomPlaceholderImageObject({
                    width: 640,
                    height: 360,
                  }),
                  width: 640,
                  height: 360,
                },
                constantValueEnabled: true,
              },
            },
            styles: {
              aspectRatio: 1.78,
              width: 640,
            },
            sizes: {
              base: "calc(100vw - 32px)",
              md: "min(width, 450px)",
              lg: "width",
            },
          } satisfies ImageWrapperProps,
        },
      ],
      CTASlot: [
        {
          type: "CTASlot",
          props: {
            data: {
              actionType: "link",
              normalizeLink: true,
              buttonText: { defaultValue: "Button" },
              entityField: {
                field: "",
                constantValue: {
                  label: "Learn More",
                  link: "#",
                  linkType: "URL",
                  ctaType: "textAndLink",
                },
                selectedType: "textAndLink",
              },
            },
            styles: { variant: "primary", presetImage: "app-store" },
            eventName: "cta",
          } satisfies CTAWrapperProps,
        },
      ],
    },
    analytics: {
      scope: "promoSection",
    },
    liveVisibility: true,
  },
  resolveFields: (data) => {
    let fields = promoSectionFields;

    switch (data.props.styles.variant) {
      case "compact": {
        // compact should remove the same fields removed by classic
      }
      case "classic": {
        fields = updateFields(
          fields,
          [
            "data.objectFields.backgroundImage",
            "styles.objectFields.imageHeight",
          ],
          undefined
        );

        break;
      }
      case "immersive": {
        fields = updateFields(
          fields,
          ["slots.ImageSlot", "styles.objectFields.backgroundColor"],
          undefined
        );
        // immersive should also remove the fields removed by spotlight
      }
      case "spotlight": {
        fields = updateFields(
          fields,
          [
            "styles.objectFields.mobileImagePosition",
            "styles.objectFields.desktopImagePosition",
            "data.objectFields.media",
            "styles.objectFields.showMedia",
            data.props.data.promo.constantValueEnabled
              ? undefined
              : "data.objectFields.backgroundImage",
          ],
          undefined
        );
        break;
      }
    }

    // If showMedia is false, remove media-related fields
    if (!data.props.styles.showMedia) {
      fields = updateFields(fields, ["data.objectFields.media"], undefined);
    }

    return toPuckFields(fields);
  },
  resolveData: (data, params) => {
    let updatedData = {
      ...data,
      props: { ...data.props, parentData: undefined },
    };
    const updateSlot = (
      slotName: keyof PromoSectionProps["slots"],
      key: string,
      value: unknown
    ) => {
      if (updatedData.props.slots[slotName]?.[0]) {
        updatedData = setDeep(
          updatedData,
          `props.slots.${slotName}[0].props.${key}`,
          value
        );
      }
    };
    // Clear previously resolved content before applying the active entity and locale.
    for (const slotName of [
      "HeadingSlot",
      "DescriptionSlot",
      "CTASlot",
      "ImageSlot",
    ] as const) {
      updateSlot(slotName, "parentData", undefined);
    }
    updateSlot(
      "DescriptionSlot",
      "parentStyles.className",
      `text-${data.props.styles.containerAlignment}`
    );
    updateSlot("ImageSlot", "className", undefined);
    updateSlot("VideoSlot", "className", undefined);
    if (data.props.styles.variant === "compact") {
      updateSlot(
        "ImageSlot",
        "className",
        themeManagerCn(
          "!w-full lg:!w-auto h-full",
          data.props.styles.desktopImagePosition === "left"
            ? "mr-auto"
            : "ml-auto"
        )
      );
      updateSlot("VideoSlot", "className", "h-full");
    } else if (data.props.styles.variant === "classic") {
      updateSlot(
        "ImageSlot",
        "className",
        "min-w-full lg:min-w-none max-w-full lg:max-w-none rounded-image-borderRadius"
      );
    }

    const streamDocument = params.metadata?.streamDocument ?? {};
    const resolvedPromo = data.props.data.promo.constantValueEnabled
      ? undefined
      : (resolveYextEntityField(
          streamDocument,
          data.props.data.promo,
          streamDocument.locale ?? "en"
        ) as PromoSectionType | undefined);
    if (!resolvedPromo || !("title" in resolvedPromo)) {
      return {
        ...updatedData,
        readOnly: { ...data.readOnly, "data.media": false },
      };
    }
    const field = data.props.data.promo.field;
    updateSlot("HeadingSlot", "parentData", {
      text: resolvedPromo.title || "",
      field,
    });
    updateSlot("DescriptionSlot", "parentData", {
      richText: resolvedPromo.description || {},
      field,
    });
    updateSlot("CTASlot", "parentData", {
      cta: resolvedPromo.cta || {},
      field,
    });
    updateSlot("ImageSlot", "parentData", {
      image: resolvedPromo.image || {},
      field,
    });
    return {
      ...updatedData,
      props: {
        ...updatedData.props,
        parentData: {
          media: "image",
          backgroundImage: {
            field: field ? `${field}.image` : "",
            constantValue: data.props.data.backgroundImage.constantValue,
            constantValueEnabled: false,
          },
        },
      },
      readOnly: { ...data.readOnly, "data.media": true },
    };
  },
  render: (props) => {
    const { data, styles, puck } = props;
    const { i18n } = useTranslation();
    const locale = i18n.language;
    const streamDocument = useDocument();

    const resolvedProps = {
      ...props,
      data: { ...props.data, ...props.parentData },
    };
    let PromoVariant = <ClassicPromo {...resolvedProps} />;
    switch (props.styles.variant) {
      case "immersive":
        PromoVariant = <ImmersivePromo {...resolvedProps} />;
        break;
      case "spotlight":
        PromoVariant = <SpotlightPromo {...resolvedProps} />;
        break;
      case "compact":
        PromoVariant = <CompactPromo {...resolvedProps} />;
        break;
    }

    // Check if using mapped entity field (not constant value) and if it's empty
    const isMappedField =
      !data.promo.constantValueEnabled && !!data.promo.field;
    const resolvedPromo = isMappedField
      ? resolveYextEntityField(streamDocument, data.promo, locale)
      : undefined;
    const isEmpty =
      isMappedField &&
      (!resolvedPromo || Object.keys(resolvedPromo || {}).length === 0);

    // Show empty state in editor mode when mapped field is empty
    if (isMappedField && isEmpty) {
      PromoVariant = (
        <PromoEmptyState
          isEditing={puck.isEditing}
          backgroundStyle={styles.backgroundColor}
        />
      );
    }

    return (
      <ComponentErrorBoundary
        isEditing={props.puck.isEditing}
        resetKeys={[props]}
      >
        <AnalyticsScopeProvider
          name={`${props.analytics?.scope ?? "promoSection"}${getAnalyticsScopeHash(props.id)}`}
        >
          <VisibilityWrapper
            liveVisibility={!!props.liveVisibility}
            isEditing={props.puck.isEditing}
          >
            {PromoVariant}
          </VisibilityWrapper>
        </AnalyticsScopeProvider>
      </ComponentErrorBoundary>
    );
  },
};

export const config: SectionConfig = {
  id: "PromoSection",
  displayName: "Promo",
  description:
    "A flexible content component designed to highlight a single, specific promotion. It combines an image with a title, description, and a call-to-action button in a customizable, split-column layout, making it perfect for drawing attention to special offers or announcements.",
  pageSetTypes: ["ENTITY"],
  category: "Page Sections",
};
