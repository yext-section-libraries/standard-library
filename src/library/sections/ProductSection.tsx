import { type SurfaceValue } from "@yext/visual-editor/section-library-support";
import {
  ThemeOptions,
  msg,
  getAnalyticsScopeHash,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import { VisibilityWrapper } from "../shared/sectionSupport/atoms/visibilityWrapper.tsx";
import { HeadingTextProps } from "./HeadingText.tsx";
import { Slot, setDeep } from "@puckeditor/core";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import { defaultProductCardSlotData } from "../shared/sectionSupport/pageSections/ProductSection/ProductCard.tsx";
import {
  ProductCardsWrapperProps,
  productCardsSource,
} from "../shared/sectionSupport/pageSections/ProductSection/ProductCardsWrapper.tsx";
import { ComponentErrorBoundary } from "@yext/visual-editor/section-library-support";
import {
  getMappedCardsSectionConditionalRender,
  MappedCardsSectionConditionalRender,
  MappedCardsSectionContent,
  MappedCardsSectionShell,
} from "../shared/sectionSupport/pageSections/mappedCardsSectionUtils.tsx";

export type ProductSectionVariant = "immersive" | "classic" | "minimal";
export type ProductSectionImageConstrain = "fill" | "fixed";

export interface ProductSectionProps {
  /**
   * This object contains properties for customizing the component's appearance.
   * @propCategory Style Props
   */
  styles: {
    /**
     * The background color for the entire section.
     * @defaultValue Background Color 2
     */
    /** Theme variant or custom background color. */
    backgroundColor?: SurfaceValue;
    /**
     * The variant of the product cards.
     * @defaultValue Immersive
     */
    cardVariant?: ProductSectionVariant;

    /**
     * Whether to show the section heading.
     * @defaultValue true
     */
    showSectionHeading: boolean;
  };

  slots: {
    SectionHeadingSlot: Slot;
    CardsWrapperSlot: Slot;
  };

  /** @internal  */
  analytics: {
    scope?: string;
  };

  /** @internal */
  conditionalRender?: MappedCardsSectionConditionalRender;

  /**
   * If 'true', the component is visible on the live page; if 'false', it's hidden.
   * @defaultValue true
   */
  liveVisibility: boolean;
}

const productSectionFields: YextFields<ProductSectionProps> = {
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      backgroundColor: {
        generation: { required: false },
        type: "surface",
        label: msg("fields.backgroundColor", "Background Color"),
        allowInherit: false,
      },
      cardVariant: {
        generation: { required: false },
        type: "basicSelector",
        label: msg("fields.cardVariant", "Card Variant"),
        options: [
          {
            label: msg("fields.options.immersive", "Immersive"),
            value: "immersive",
          },
          { label: msg("fields.options.classic", "Classic"), value: "classic" },
          { label: msg("fields.options.minimal", "Minimal"), value: "minimal" },
        ],
      },
      showSectionHeading: {
        label: msg("fields.showSectionHeading", "Show Section Heading"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
    },
  },
  slots: {
    type: "object",
    objectFields: {
      SectionHeadingSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["HeadingTextSlot"],
      },
      CardsWrapperSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["ProductCardsWrapper"],
      },
    },
    visible: false,
  },
  analytics: {
    type: "object",
    label: msg("fields.analytics", "Analytics"),
    visible: false,
    objectFields: {
      scope: {
        generation: { required: false },
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

export const ProductSection: YextComponentConfig<ProductSectionProps> = {
  label: msg("components.products", "Products"),
  fields: productSectionFields,
  defaultProps: {
    styles: {
      backgroundColor: "muted",
      cardVariant: "immersive",
      showSectionHeading: true,
    },
    slots: {
      SectionHeadingSlot: [
        {
          type: "HeadingTextSlot",
          props: {
            data: {
              text: {
                field: "",
                constantValue: { defaultValue: "Featured Products" },
                constantValueEnabled: true,
              },
            },
            styles: {
              level: 2,
              align: "left",
            },
          } satisfies HeadingTextProps,
        },
      ],
      CardsWrapperSlot: [
        {
          type: "ProductCardsWrapper",
          props: {
            data: {
              field: "",
              constantValueEnabled: true,
              constantValue: [{}, {}, {}],
            },
            styles: {
              showImage: true,
              showBrow: true,
              showTitle: true,
              showPrice: true,
              showDescription: true,
              showCTA: true,
            },
            slots: {
              CardSlot: [
                defaultProductCardSlotData(),
                defaultProductCardSlotData(),
                defaultProductCardSlotData(),
              ],
            },
          } satisfies ProductCardsWrapperProps,
        },
      ],
    },
    analytics: {
      scope: "productsSection",
    },
    liveVisibility: true,
  },
  resolveData: (data, params) => {
    let updatedData = data;
    if (updatedData.props.slots.SectionHeadingSlot?.[0]) {
      updatedData = setDeep(
        updatedData,
        "props.slots.SectionHeadingSlot[0].props.styles.level",
        2
      );
      updatedData = setDeep(
        updatedData,
        "props.slots.SectionHeadingSlot[0].props.styles.semanticLevelOverride",
        2
      );
      updatedData = setDeep(
        updatedData,
        "props.slots.SectionHeadingSlot[0].props.parentStyles.typographyRole",
        "section-title"
      );
    }
    updatedData = setDeep(
      updatedData,
      "props.slots.CardsWrapperSlot[0].props.cardHeadingLevel",
      data.props.styles.showSectionHeading ? 3 : 2
    );

    if (
      data.props.slots.CardsWrapperSlot?.[0]?.props.styles?.variant !==
      data.props.styles.cardVariant
    ) {
      updatedData = setDeep(
        updatedData,
        "props.slots.CardsWrapperSlot[0].props.styles.variant",
        updatedData.props.styles.cardVariant
      );
    }

    return {
      ...updatedData,
      props: {
        ...updatedData.props,
        conditionalRender: getMappedCardsSectionConditionalRender(
          updatedData.props.slots.CardsWrapperSlot?.[0],
          productCardsSource.resolveItems(
            updatedData.props.slots.CardsWrapperSlot?.[0]?.props.data,
            params.metadata.streamDocument ?? {}
          )
        ),
      },
    };
  },
  render: (props) => (
    <ComponentErrorBoundary
      isEditing={props.puck.isEditing}
      resetKeys={[props]}
    >
      <AnalyticsScopeProvider
        name={`${props.analytics?.scope ?? "productsSection"}${getAnalyticsScopeHash(props.id)}`}
      >
        <VisibilityWrapper
          liveVisibility={props.liveVisibility}
          isEditing={props.puck.isEditing}
        >
          <MappedCardsSectionShell
            conditionalRender={props.conditionalRender}
            isEditing={props.puck.isEditing}
            CardsWrapperSlot={props.slots.CardsWrapperSlot}
          >
            {(setCardsWrapperRef) => (
              <MappedCardsSectionContent
                backgroundColor={props.styles.backgroundColor}
                showSectionHeading={props.styles.showSectionHeading}
                SectionHeadingSlot={props.slots.SectionHeadingSlot}
                CardsWrapperSlot={props.slots.CardsWrapperSlot}
                setCardsWrapperRef={setCardsWrapperRef}
              />
            )}
          </MappedCardsSectionShell>
        </VisibilityWrapper>
      </AnalyticsScopeProvider>
    </ComponentErrorBoundary>
  ),
};

export const config: SectionConfig = {
  id: "ProductSection",
  displayName: "Products",
  description:
    "Displays a curated list of products in a dedicated section. It features a main heading and renders each product as an individual card, making it ideal for showcasing featured items, new arrivals, or bestsellers.",
  pageSetTypes: ["ENTITY"],
  category: "Page Sections",
};
