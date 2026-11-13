import { type SurfaceValue } from "@yext/visual-editor/section-library-support";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  TranslatableRichText,
  YextEntityField,
  ProductStruct,
  deepMerge,
  themeManagerCn,
  getDefaultRTF,
  resolveYextEntityField,
  i18nPageInstance,
  bindSlots,
  msg,
  YextComponentConfig,
  YextFields,
  formatCurrency,
  resolveComponentData,
  useDocument,
  toPuckFields,
} from "@yext/visual-editor";
import { Background } from "../../atoms/background.tsx";
import { CTAWrapperProps } from "../../../../sections/CTAWrapper.tsx";
import { BodyTextProps } from "../../../../sections/BodyText.tsx";
import { HeadingTextProps } from "../../../../sections/HeadingText.tsx";
import {
  getImageUrl,
  ImageWrapperProps,
} from "../../../../sections/ImageWrapper.tsx";
import { ImgSizesByBreakpoint } from "../../atoms/image.tsx";
import { PuckComponent, setDeep, Slot, WithId } from "@puckeditor/core";
import {
  getCTAType,
  useCardContext,
  useParentCardStyles,
  useGetCardSlots,
  syncParentStyles,
  getRandomPlaceholderImageObject,
} from "@yext/visual-editor/section-library-support";
import { isCompleteProductPrice, isInvalidProductPrice } from "./utils.ts";
import { TextProps } from "../../../../sections/Text.tsx";
import { ProductSectionVariant } from "../../../../sections/ProductSection.tsx";

/**
 * Default product-shaped data used to keep placeholder content aligned with
 * the ProductStruct type.
 */
const defaultProductData = {
  image: {
    url: "https://placehold.co/640x360",
    height: 360,
    width: 640,
  },
  category: { defaultValue: "Category" },
  name: { defaultValue: "Product Name" },
  price: {
    value: 123,
    currencyCode: "USD",
  },
  description: {
    defaultValue: getDefaultRTF(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    ),
  },
  cta: {
    label: { defaultValue: "Learn More" },
    link: "#",
    linkType: "URL" as const,
    ctaType: "textAndLink" as const,
  },
} satisfies ProductStruct;

const slotDefaultData = {
  priceText: { defaultValue: "$123.00" },
};

export const defaultProductCardSlotData = (
  id?: string,
  index?: number,
  backgroundColor?: SurfaceValue,
  sharedSlotStyles?: Record<string, any>
) => {
  const cardData = {
    type: "ProductCard",
    props: {
      ...(id && { id }),
      ...(index !== undefined && { index }),
      styles: {
        backgroundColor: "page",
        ...(backgroundColor && { backgroundColor }),
      } satisfies ProductCardProps["styles"],
      slots: {
        ImageSlot: [
          {
            type: "ImageSlot",
            props: {
              ...(id && { id: `${id}-image` }),
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
                imageConstrain: "fill",
              },
            } satisfies ImageWrapperProps,
          },
        ],
        BrowSlot: [
          {
            type: "TextSlot",
            props: {
              ...(id && { id: `${id}-brow` }),
              data: {
                text: {
                  field: "",
                  constantValue: defaultProductData.category,
                  constantValueEnabled: true,
                },
              },
              parentStyles: { className: "", typographyRole: "body-small" },
              styles: {},
            } satisfies TextProps,
          },
        ],
        TitleSlot: [
          {
            type: "HeadingTextSlot",
            props: {
              ...(id && { id: `${id}-title` }),
              data: {
                text: {
                  field: "",
                  constantValue: defaultProductData.name,
                  constantValueEnabled: true,
                },
              },
              parentStyles: { typographyRole: "card-title" },
              styles: {
                level: 3,
                align: "left",
              },
            } satisfies HeadingTextProps,
          },
        ],
        PriceSlot: [
          {
            type: "TextSlot",
            props: {
              ...(id && { id: `${id}-price` }),
              data: {
                text: {
                  field: "",
                  constantValue: slotDefaultData.priceText,
                  constantValueEnabled: true,
                },
              },
              styles: {},
            } satisfies TextProps,
          },
        ],
        DescriptionSlot: [
          {
            type: "BodyTextSlot",
            props: {
              ...(id && { id: `${id}-description` }),
              data: {
                text: {
                  field: "",
                  constantValue: defaultProductData.description,
                  constantValueEnabled: true,
                },
              },
              styles: {},
            } satisfies BodyTextProps,
          },
        ],
        CTASlot: [
          {
            type: "CTASlot",
            props: {
              ...(id && { id: `${id}-cta` }),
              data: {
                actionType: "link",
                normalizeLink: true,
                buttonText: { defaultValue: "Button" },
                entityField: {
                  field: "",
                  constantValue: defaultProductData.cta,
                  constantValueEnabled: true,
                },
              },
              styles: {
                variant: "secondary-button",
                presetImage: "app-store",
              },
            } satisfies CTAWrapperProps,
          },
        ],
      },
    } satisfies ProductCardProps,
  };

  Object.entries(cardData.props.slots).forEach(([slotKey, slotArray]) => {
    if (sharedSlotStyles?.[slotKey]) {
      slotArray[0].props.styles = sharedSlotStyles[slotKey];
    }
  });

  return cardData;
};

export type ProductCardProps = {
  /** @internal */
  field?: string;
  image?: ProductStruct["image"];
  category?: ProductStruct["category"];
  name?: ProductStruct["name"];
  price?: ProductStruct["price"];
  description?: ProductStruct["description"];
  cta?: ProductStruct["cta"];
  styles: {
    /** The background color of each individual card
     * @defaultValue Background Color 1
     */
    backgroundColor?: SurfaceValue;
  };

  /** @internal */
  slots: {
    ImageSlot: Slot;
    BrowSlot: Slot;
    TitleSlot: Slot;
    PriceSlot: Slot;
    DescriptionSlot: Slot;
    CTASlot: Slot;
  };

  /** @internal */
  parentStyles?: {
    variant: ProductSectionVariant;
    showImage: boolean;
    showBrow: boolean;
    showTitle: boolean;
    showPrice: boolean;
    showDescription: boolean;
    showCTA: boolean;
  };

  /** @internal */
  conditionalRender?: {
    image?: boolean;
    title?: boolean;
    price?: boolean;
    brow?: boolean;
    description?: boolean;
    cta?: boolean;
  };

  /** @internal */
  imageStyles?: {
    aspectRatio?: number;
    width?: number;
  };

  /** @internal */
  index?: number;
};

const ProductCardFields: YextFields<ProductCardProps> = {
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      backgroundColor: {
        generation: { required: false },
        type: "surface",
        label: msg("fields.backgroundColor", "Background Color"),
      },
    },
  },
  slots: {
    type: "object",
    objectFields: {
      ImageSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["ImageSlot"],
      },
      BrowSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["TextSlot"],
      },
      TitleSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["HeadingTextSlot"],
      },
      PriceSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["TextSlot"],
      },
      DescriptionSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["BodyTextSlot"],
      },
      CTASlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["CTASlot"],
      },
    },
    visible: false,
  },
};

// Resolves slot content to determine whether to hide individual slots or the entire card
const resolveProductCardContent = (
  props: ProductCardProps,
  locale: string,
  streamDocument?: Record<string, any>
) => {
  const field = props.field ?? "";
  const isLinkedMode = Boolean(field);
  const imageSlotProps = props.slots.ImageSlot?.[0]?.props as
    | (WithId<ImageWrapperProps> & {
        styles?: { aspectRatio?: number; width?: number };
      })
    | undefined;
  const priceSlotProps = props.slots.PriceSlot?.[0]?.props as
    WithId<TextProps> | undefined;
  const priceEntityField = priceSlotProps?.data.text as
    YextEntityField<ProductStruct["price"]> | undefined;
  const entityPrice = isLinkedMode
    ? props.price
    : priceEntityField
      ? resolveYextEntityField<ProductStruct["price"]>(
          streamDocument,
          priceEntityField,
          locale
        )
      : undefined;

  const resolvedPriceFromEntity = formatCurrency(
    entityPrice?.value,
    entityPrice?.currencyCode,
    locale
  );
  const fallbackPriceCandidate =
    !isLinkedMode && priceSlotProps
      ? resolveYextEntityField(
          streamDocument,
          priceSlotProps?.data?.text,
          locale
        )
      : undefined;
  const resolvedFallbackPrice = !fallbackPriceCandidate
    ? fallbackPriceCandidate
    : isCompleteProductPrice(fallbackPriceCandidate, locale)
      ? formatCurrency(
          fallbackPriceCandidate.value,
          fallbackPriceCandidate.currencyCode,
          locale
        )
      : isInvalidProductPrice(fallbackPriceCandidate, locale)
        ? undefined
        : resolveComponentData(fallbackPriceCandidate, locale, streamDocument, {
            output: "plainText",
          });
  const resolvedPrice = resolvedPriceFromEntity
    ? resolvedPriceFromEntity
    : resolvedFallbackPrice;
  const hasText = (
    value:
      TranslatableRichText | YextEntityField<TranslatableRichText> | undefined
  ) => {
    const text = resolveComponentData(value, locale, streamDocument, {
      output: "plainText",
    });
    return typeof text === "string" && text.trim().length > 0;
  };
  const showPrice = hasText(resolvedPrice);
  const resolvedImage = isLinkedMode
    ? props.image
    : imageSlotProps
      ? resolveComponentData(imageSlotProps.data.image, locale, streamDocument)
      : undefined;
  const showImage = Boolean(getImageUrl(resolvedImage, locale)?.trim());
  const titleSlotProps = props.slots.TitleSlot?.[0]?.props as
    WithId<HeadingTextProps> | undefined;
  const showTitle = hasText(
    isLinkedMode ? props.name : titleSlotProps?.data.text
  );

  const browSlotProps = props.slots.BrowSlot?.[0]?.props as
    WithId<TextProps> | undefined;
  const resolvedBrow = isLinkedMode
    ? props.category
    : browSlotProps
      ? resolveYextEntityField(streamDocument, browSlotProps.data.text, locale)
      : undefined;
  const showBrow = hasText(resolvedBrow);

  const descriptionSlotProps = props.slots.DescriptionSlot?.[0]?.props as
    WithId<BodyTextProps> | undefined;

  const resolvedDescription = isLinkedMode
    ? props.description
    : descriptionSlotProps
      ? resolveYextEntityField(
          streamDocument,
          descriptionSlotProps.data.text,
          locale
        )
      : undefined;
  const showDescription = hasText(resolvedDescription);

  const ctaSlotProps = props.slots.CTASlot?.[0]?.props as
    WithId<CTAWrapperProps> | undefined;
  const resolvedCTA = isLinkedMode
    ? props.cta
    : ctaSlotProps
      ? resolveYextEntityField(
          streamDocument,
          ctaSlotProps.data.entityField,
          locale
        )
      : undefined;
  const ctaType = ctaSlotProps
    ? getCTAType(ctaSlotProps.data.entityField).ctaType
    : undefined;
  const showCTA =
    (ctaSlotProps?.data.show ?? true) &&
    (ctaSlotProps?.data.actionType === "button"
      ? hasText(ctaSlotProps.data.buttonText)
      : Boolean(
          resolvedCTA &&
          (ctaType === "presetImage" ||
            ctaType === "getDirections" ||
            hasText(resolvedCTA.label))
        ));

  return {
    imageSlotProps,
    resolvedPriceFromEntity,
    conditionalRender: {
      image: showImage,
      title: showTitle,
      price: showPrice,
      brow: showBrow,
      description: showDescription,
      cta: showCTA,
    },
  };
};

const ProductCardComponent: PuckComponent<ProductCardProps> = (props) => {
  const { styles, puck, slots } = props;
  const streamDocument = useDocument();
  const { i18n } = useTranslation();
  const { sharedCardProps, setSharedCardProps } = useCardContext<{
    cardStyles: ProductCardProps["styles"];
    slotStyles: Record<string, ProductCardProps["styles"]>;
  }>();
  const inheritedParentStyles =
    useParentCardStyles<ProductCardProps["parentStyles"]>();

  const parentStyles = inheritedParentStyles ?? props.parentStyles;
  const variant = parentStyles?.variant ?? "immersive";

  const { slotStyles, getPuck, slotProps } = useGetCardSlots<ProductCardProps>(
    props.id
  );
  const conditionalRender = slotProps
    ? resolveProductCardContent(
        { ...props, slots: slotProps },
        i18n.language || "en",
        streamDocument
      ).conditionalRender
    : props.conditionalRender;

  // sharedCardProps useEffect
  // When the context changes, dispatch an update to sync the changes to puck
  React.useEffect(() => {
    if (!puck.isEditing || !sharedCardProps || !getPuck) {
      return;
    }

    if (
      JSON.stringify(sharedCardProps?.cardStyles) === JSON.stringify(styles) &&
      JSON.stringify(slotStyles) === JSON.stringify(sharedCardProps?.slotStyles)
    ) {
      return;
    }

    const { dispatch, getSelectorForId } = getPuck();
    const selector = getSelectorForId(props.id);
    if (!selector || !slotProps) {
      return;
    }

    const newSlotData: ProductCardProps["slots"] = {
      ImageSlot: [],
      BrowSlot: [],
      TitleSlot: [],
      PriceSlot: [],
      DescriptionSlot: [],
      CTASlot: [],
    };
    Object.entries(slotProps).forEach(([key, value]) => {
      newSlotData[key as keyof ProductCardProps["slots"]] = [
        {
          ...deepMerge(
            { props: { styles: { ...sharedCardProps?.slotStyles?.[key] } } },
            value[0]
          ),
        },
      ];
    });

    // oxlint-disable-next-line no-unused-vars: remove props.puck before dispatching to avoid writing it to the saved data
    const { puck: _, editMode: __, ...otherProps } = props;
    dispatch({
      type: "replace" as const,
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: {
        type: "ProductCard",
        props: {
          ...otherProps,
          styles: {
            ...otherProps.styles,
            ...sharedCardProps?.cardStyles,
          },
          slots: newSlotData,
        } satisfies ProductCardProps,
      },
    });
  }, [sharedCardProps]);

  // styles and slotStyles useEffect
  // When the card's shared props or the card's slots' shared props change, update the context
  React.useEffect(() => {
    if (!puck.isEditing || !slotProps) {
      return;
    }

    if (
      JSON.stringify(sharedCardProps?.cardStyles) === JSON.stringify(styles) &&
      JSON.stringify(sharedCardProps?.slotStyles) === JSON.stringify(slotStyles)
    ) {
      return;
    }

    setSharedCardProps({
      cardStyles: styles,
      slotStyles: slotStyles,
    });
  }, [styles, slotStyles]);

  const hasPrice =
    parentStyles?.showPrice && (conditionalRender?.price || puck.isEditing);
  const hasDescription =
    parentStyles?.showDescription &&
    (conditionalRender?.description || puck.isEditing);
  const hasCTA =
    parentStyles?.showCTA && (conditionalRender?.cta || puck.isEditing);
  const hasBrow =
    parentStyles?.showBrow && (conditionalRender?.brow || puck.isEditing);
  const bottomPadding = hasCTA ? "pb-8" : "pb-4";

  const hasVisibleContent =
    (parentStyles?.showImage && conditionalRender?.image) ||
    (parentStyles?.showTitle && conditionalRender?.title) ||
    (parentStyles?.showBrow && conditionalRender?.brow) ||
    (parentStyles?.showPrice && conditionalRender?.price) ||
    (parentStyles?.showDescription && conditionalRender?.description) ||
    (parentStyles?.showCTA && conditionalRender?.cta);

  if (conditionalRender && !hasVisibleContent && !puck.isEditing) {
    return <></>;
  }

  return (
    <Background
      className={themeManagerCn(
        "flex flex-col h-full",
        variant !== "minimal" && "ve-theme-card overflow-hidden"
      )}
      background={variant === "minimal" ? "inherit" : styles.backgroundColor}
      ref={puck.dragRef}
    >
      {parentStyles?.showImage && (
        <div className={variant === "classic" ? "px-8 pt-8" : ""}>
          <div className={"w-full"}>
            <slots.ImageSlot style={{ height: "fit-content" }} allow={[]} />
          </div>
        </div>
      )}
      <div
        className={themeManagerCn(
          "flex flex-col flex-grow gap-4 pt-4",
          variant !== "minimal" && bottomPadding,
          variant !== "minimal" && "px-8"
        )}
      >
        <div className="gap-4 flex flex-col flex-grow">
          {(hasBrow || parentStyles?.showTitle) && (
            <div className="flex flex-col">
              {hasBrow && (
                <slots.BrowSlot style={{ height: "auto" }} allow={[]} />
              )}

              {parentStyles?.showTitle && (
                <slots.TitleSlot style={{ height: "auto" }} allow={[]} />
              )}
            </div>
          )}
          {hasPrice && (
            <div className="flex gap-4 ve-theme-border border-l-2 pl-4 items-center">
              <slots.PriceSlot style={{ height: "auto" }} allow={[]} />
            </div>
          )}

          {hasDescription && (
            <slots.DescriptionSlot style={{ height: "auto" }} allow={[]} />
          )}
        </div>
        {hasCTA && <slots.CTASlot style={{ height: "auto" }} allow={[]} />}
      </div>
    </Background>
  );
};

export const ProductCard: YextComponentConfig<ProductCardProps> = {
  label: msg("slots.productCard", "Product Card"),
  fields: ProductCardFields,
  inline: true,
  resolveFields: (data) =>
    toPuckFields(
      setDeep(
        ProductCardFields,
        "styles.objectFields.backgroundColor.visible",
        data.props.parentStyles?.variant !== "minimal"
      )
    ),
  resolveData: (data, params) => {
    const locale = i18nPageInstance.language || "en";
    const field = data.props.field ?? "";
    const isLinkedMode = Boolean(field);
    const { imageSlotProps, resolvedPriceFromEntity, conditionalRender } =
      resolveProductCardContent(
        data.props,
        locale,
        params.metadata.streamDocument
      );

    let updatedData = {
      ...data,
      props: {
        ...data.props,
        conditionalRender,
        imageStyles: {
          aspectRatio: imageSlotProps?.styles?.aspectRatio,
          width: imageSlotProps?.styles?.width,
        },
      } satisfies ProductCardProps,
    };

    updatedData = syncParentStyles(params, updatedData, [
      "variant",
      "showImage",
      "showBrow",
      "showTitle",
      "showPrice",
      "showDescription",
      "showCTA",
    ]);

    for (const [slot, role] of [
      ["BrowSlot", "body-small"],
      ["TitleSlot", "card-title"],
      ["PriceSlot", "body"],
      ["DescriptionSlot", "body"],
    ] as const) {
      if (updatedData.props.slots[slot]?.[0]) {
        updatedData = setDeep(
          updatedData,
          `props.slots.${slot}[0].props.parentStyles.typographyRole`,
          role
        );
      }
    }

    // Apply image behavior after the wrapper has generated the final card slots.
    const isImmersive =
      (updatedData.props.parentStyles?.variant ?? "immersive") === "immersive";
    updatedData = setDeep(
      updatedData,
      "props.slots.ImageSlot[0].props.showImageConstrain",
      !isImmersive
    );
    updatedData = setDeep(
      updatedData,
      "props.slots.ImageSlot[0].props.hideWidthProp",
      isImmersive
    );

    // Set the image's sizes attribute
    updatedData = setDeep(updatedData, "props.slots.ImageSlot[0].props.sizes", {
      base: "calc(100vw - 32px)",
      md: "calc((maxWidth - 32px) / 2)",
      lg: "calc((maxWidth - 32px) / 3)",
    } satisfies ImgSizesByBreakpoint);

    // Set the CTA's event name
    updatedData = setDeep(
      updatedData,
      "props.slots.CTASlot[0].props.eventName",
      `cta${data.props.index}`
    );

    const {
      image: linkedImage,
      category: linkedCategory,
      name: linkedName,
      description: linkedDescription,
      price: linkedPrice,
      cta: linkedCTA,
    } = updatedData.props;
    const image = isLinkedMode ? linkedImage : undefined;
    const name = isLinkedMode ? linkedName : undefined;
    const resolvedName =
      name &&
      resolveComponentData(name, locale, params.metadata.streamDocument, {
        output: "plainText",
      });
    const brow = isLinkedMode ? linkedCategory : undefined;
    const description = isLinkedMode ? linkedDescription : undefined;
    const cta = isLinkedMode ? linkedCTA : undefined;

    return bindSlots(updatedData as typeof data, {
      ImageSlot: image
        ? ({ field, image } satisfies ImageWrapperProps["parentData"])
        : undefined,
      TitleSlot: resolvedName
        ? ({
            field,
            text: resolvedName,
          } satisfies HeadingTextProps["parentData"])
        : undefined,
      BrowSlot: brow
        ? ({ field, text: brow } satisfies TextProps["parentData"])
        : undefined,
      PriceSlot:
        linkedPrice && resolvedPriceFromEntity
          ? ({
              field,
              text: resolvedPriceFromEntity,
            } satisfies TextProps["parentData"])
          : undefined,
      DescriptionSlot: description
        ? ({
            field,
            richText: description,
          } satisfies BodyTextProps["parentData"])
        : undefined,
      CTASlot: cta
        ? ({ field, cta } satisfies CTAWrapperProps["parentData"])
        : undefined,
    });
  },
  defaultProps: {
    styles: {
      backgroundColor: "page",
    },
    slots: defaultProductCardSlotData().props.slots,
  },
  render: (props) => <ProductCardComponent {...props} />,
};
