import { styleSchema } from "./styleSchema.ts";
import { cardGridDefaults, cardListDefaults } from "./cardLayout.tsx";
import type { Slot } from "@puckeditor/core";
import {
  boxConfig,
  stackConfig,
  flexConfig,
  columnsConfig,
  cardConfig,
  listConfig,
  listItemConfig,
} from "./containers.tsx";
import {
  dividerConfig,
  spacerConfig,
  iconConfig,
  disclosureConfig,
} from "./otherAtoms.tsx";
import { collectionConfig } from "./collection.tsx";
import {
  buttonConfig,
  headingConfig,
  imageConfig,
  paragraphConfig,
  richTextConfig,
} from "./content.tsx";

type Node = Slot[number];
type Props = Record<string, any>;
const defaults: Record<string, Props> = {
  Box: boxConfig.defaultProps!,
  Stack: stackConfig.defaultProps!,
  Flex: flexConfig.defaultProps!,
  Columns: columnsConfig.defaultProps!,
  Card: cardConfig.defaultProps!,
  Heading: headingConfig.defaultProps!,
  Paragraph: paragraphConfig.defaultProps!,
  RichText: richTextConfig.defaultProps!,
  Button: buttonConfig.defaultProps!,
  Image: imageConfig.defaultProps!,
  List: listConfig.defaultProps!,
  ListItem: listItemConfig.defaultProps!,
  Divider: dividerConfig.defaultProps!,
  Spacer: spacerConfig.defaultProps!,
  Icon: iconConfig.defaultProps!,
  Disclosure: disclosureConfig.defaultProps!,
  Collection: collectionConfig.defaultProps!,
};

export function recipeNode(
  type: string,
  props: Props = {},
  content?: Slot
): Node {
  const initial = structuredClone(defaults[type] ?? {});
  const merged = { ...initial, ...props };
  for (const group of Object.keys(styleSchema)) {
    if (initial[group] || props[group])
      merged[group] = { ...initial[group], ...props[group] };
  }
  if (initial.responsive || props.responsive) {
    merged.responsive = { ...initial.responsive, ...props.responsive };
    for (const screen of ["tablet", "mobile"]) {
      if (initial.responsive?.[screen] || props.responsive?.[screen]) {
        merged.responsive[screen] = {
          ...initial.responsive?.[screen],
          ...props.responsive?.[screen],
        };
        for (const group of Object.keys(styleSchema))
          if (
            initial.responsive?.[screen]?.[group] ||
            props.responsive?.[screen]?.[group]
          )
            merged.responsive[screen][group] = {
              ...initial.responsive?.[screen]?.[group],
              ...props.responsive?.[screen]?.[group],
            };
      }
    }
  }
  return { type, props: { ...merged, ...(content ? { content } : {}) } };
}

/** Convert fixed section slots into the same public atoms offered in the drawer. */
export function editableNodes(nodes: Slot = []): Slot {
  return nodes.map((node) => {
    const props = structuredClone(node.props);
    // Authored IDs are assigned by Puck when the preset is inserted.
    delete props.id;
    delete props.parentStyles;
    const parentData = props.parentData;
    delete props.parentData;
    switch (node.type) {
      case "HeadingTextSlot": {
        const level =
          props.styles?.semanticLevelOverride ?? props.styles?.level ?? 2;
        const tag = typeof level === "number" ? `h${level}` : "p";
        const isHeading = /^h[1-6]$/.test(tag);
        return recipeNode(isHeading ? "Heading" : "Paragraph", {
          data: props.data,
          as: tag,
          typography: {
            ...headingConfig.defaultProps?.typography,
            fontFamily: `var(--fontFamily-h${level}-fontFamily, sans-serif)`,
            fontWeight: `var(--fontWeight-h${level}-fontWeight, 600)`,
            fontSize: `var(--fontSize-h${level}-fontSize, ${level === 1 ? "clamp(2.5rem, 5vw, 4.5rem)" : level === 2 ? "2rem" : "1.375rem"})`,
            textAlign:
              props.styles?.align === "right"
                ? "end"
                : props.styles?.align === "left"
                  ? "start"
                  : props.styles?.align,
          },
        });
      }
      case "TextSlot":
        return recipeNode("Paragraph", {
          data: props.data,
          typography: {
            ...paragraphConfig.defaultProps?.typography,
            ...(props.styles?.fontStyle === "bold"
              ? { fontWeight: "700" }
              : {}),
            ...(props.styles?.fontStyle === "italic"
              ? { fontStyle: "italic" }
              : {}),
          },
        });
      case "BodyTextSlot":
        return recipeNode("RichText", { data: props.data });
      case "ImageSlot":
      case "HeroImageSlot":
        return recipeNode("Image", {
          data: props.data,
          loading: node.type === "HeroImageSlot" ? "eager" : "lazy",
          layout: {
            ...imageConfig.defaultProps?.layout,
            ...(props.styles?.aspectRatio
              ? { aspectRatio: `${props.styles.aspectRatio}` }
              : {}),
          },
        });
      case "CTASlot":
        return recipeNode("Button", {
          eventName: props.eventName ?? "cta",
          presetImage: props.styles?.presetImage ?? "app-store",
          ...(props.data.actionType === "button"
            ? { action: "button", attributes: { htmlId: props.data.customId } }
            : {}),
          cta: {
            ...props.data.entityField,
            constantValueEnabled:
              props.data.entityField.constantValueEnabled ??
              !props.data.entityField.field,
            ...(props.data.actionType === "button"
              ? {
                  constantValueEnabled: true,
                  constantValue: {
                    label: props.data.buttonText ?? { defaultValue: "Button" },
                    link: "#",
                    linkType: "URL",
                  },
                }
              : {}),
          },
          ...(props.styles?.variant !== "primary"
            ? {
                typography: {
                  ...buttonConfig.defaultProps?.typography,
                  color: "var(--colors-palette-primary, #1d4ed8)",
                },
                surface: {
                  backgroundColor: "transparent",
                  borderStyle: "solid",
                  borderWidth: "1px",
                  borderColor: "currentColor",
                  borderRadius: "var(--radius-button, 0.5rem)",
                },
              }
            : {}),
        });
      case "AddressSlot":
        return recipeNode("Address", props);
      case "HoursStatusSlot":
        return recipeNode("HoursStatus", props);
      case "HoursTableSlot":
        return recipeNode("HoursTable", props);
      case "PhoneSlot":
        return recipeNode("Phone", props);
      case "PhoneNumbersSlot":
        return recipeNode("PhoneList", props);
      case "EmailsSlot":
        return recipeNode("Emails", props);
      case "TextListSlot":
        return recipeNode("TextList", props);
      case "VideoSlot":
        return recipeNode("Video", props);
      default:
        return {
          ...node,
          props: {
            ...([
              "ProductCardsWrapper",
              "TeamCardsWrapper",
              "TestimonialCardsWrapper",
              "InsightCardsWrapper",
              "EventCardsWrapper",
            ].includes(node.type)
              ? structuredClone(
                  node.type === "EventCardsWrapper"
                    ? cardListDefaults
                    : cardGridDefaults
                )
              : {}),
            ...props,
            ...(parentData ? { parentData } : {}),
          },
        };
    }
  });
}

const slot = (props: Props, ...keys: string[]): Slot =>
  keys.flatMap((key) => editableNodes(props.slots?.[key] ?? []));
const stack = (content: Slot, props: Props = {}) =>
  recipeNode("Stack", props, content);
const columns = (content: Slot, count = 2) =>
  recipeNode(
    "Columns",
    {
      layout: { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` },
      responsive: {
        mobile: { layout: { gridTemplateColumns: "minmax(0, 1fr)" } },
      },
    },
    content
  );

/** Presets contain ordinary Puck data. There is no separate section layout renderer. */
export function sectionRecipe(name: string, props: Props): Slot {
  switch (name) {
    case "HeroSection":
      return [
        columns([
          stack(
            [
              ...slot(props, "GeomodifierSlot"),
              ...slot(props, "BusinessNameSlot").map((node) =>
                recipeNode("Paragraph", {
                  ...node.props,
                  as: "p",
                  typography: {
                    ...paragraphConfig.defaultProps?.typography,
                    fontSize: "1.25rem",
                  },
                })
              ),
              ...slot(props, "HoursStatusSlot", "PhoneSlot"),
              recipeNode(
                "Flex",
                {},
                slot(props, "PrimaryCTASlot", "SecondaryCTASlot")
              ),
            ],
            {
              layout: {
                ...stackConfig.defaultProps?.layout,
                justifyContent: "center",
              },
            }
          ),
          ...(props.styles?.variant === "immersive" ||
          props.styles?.variant === "spotlight"
            ? [
                recipeNode("Image", {
                  data: { image: props.data.backgroundImage },
                  loading: "eager",
                }),
              ]
            : slot(props, "ImageSlot")),
        ]),
      ];
    case "ProfessionalHeroSection":
      return [
        columns([
          ...slot(props, "ImageSlot"),
          stack([
            ...slot(
              props,
              "ProfessionalNameSlot",
              "CredentialsSlot",
              "ProfessionalTitleSlot",
              "BusinessNameSlot",
              "SubtitleSlot",
              "AddressSlot",
              "PhoneSlot",
              "EmailSlot"
            ),
            recipeNode(
              "Flex",
              {},
              slot(props, "PrimaryCTASlot", "SecondaryCTASlot")
            ),
          ]),
        ]),
      ];
    case "PromoSection": {
      const mappedPromo =
        props.data?.promo?.field && !props.data.promo.constantValueEnabled;
      const bindings: Record<string, string> = {
        HeadingSlot: "title",
        DescriptionSlot: "description",
        CTASlot: "cta",
        ImageSlot: "image",
      };
      const authored = structuredClone(props);
      if (mappedPromo) {
        for (const [key, field] of Object.entries(bindings)) {
          const child = authored.slots?.[key]?.[0]?.props;
          if (!child?.data) continue;
          const dataKey =
            key === "CTASlot"
              ? "entityField"
              : key === "ImageSlot"
                ? "image"
                : "text";
          child.data[dataKey] = {
            ...child.data[dataKey],
            field: `${props.data.promo.field}.${field}`,
            constantValueEnabled: false,
          };
        }
      }
      const useBackground =
        props.styles?.variant === "immersive" ||
        props.styles?.variant === "spotlight";
      const image =
        useBackground && !mappedPromo
          ? [
              recipeNode("Image", {
                data: { image: props.data.backgroundImage },
                loading: "eager",
              }),
            ]
          : slot(
              authored,
              props.data?.media === "video" && !mappedPromo
                ? "VideoSlot"
                : "ImageSlot"
            );
      return [
        columns([
          ...image,
          stack(slot(authored, "HeadingSlot", "DescriptionSlot", "CTASlot")),
        ]),
      ];
    }
    case "AboutSection":
      return [
        ...slot(props, "SectionHeadingSlot"),
        columns([
          stack(slot(props, "DescriptionSlot")),
          stack(slot(props, "SidebarSlot")),
        ]),
      ];
    case "CoreInfoSection":
      return [
        columns(
          [
            stack(
              slot(
                props,
                "CoreInfoHeadingSlot",
                "CoreInfoAddressSlot",
                "CoreInfoPhoneNumbersSlot",
                "CoreInfoEmailsSlot"
              )
            ),
            stack(slot(props, "HoursHeadingSlot", "HoursTableSlot")),
            stack(slot(props, "ServicesHeadingSlot", "TextListSlot")),
          ],
          3
        ),
      ];
    case "ProductSection":
    case "TeamSection":
    case "TestimonialSection":
    case "EventSection":
    case "InsightSection":
    case "NearbyLocationsSection":
      return slot(props, "SectionHeadingSlot", "CardsWrapperSlot");
    case "PhotoGallerySection":
      return [
        ...slot(props, "HeadingSlot"),
        ...slot(props, "PhotoGalleryWrapper").map((node) => ({
          ...node,
          type: "Gallery",
          props: { ...node.props, variant: props.styles?.variant ?? "gallery" },
        })),
      ];
    case "FAQSection":
      return [
        ...slot(props, "HeadingSlot"),
        recipeNode("FAQCollection", {
          ...props,
          styles: { ...props.styles, showSectionHeading: false },
          slots: { ...props.slots, HeadingSlot: [] },
        }),
      ];
    case "VideoSection":
      return slot(props, "SectionHeadingSlot", "VideoSlot");
    case "StaticMapSection":
      return [
        recipeNode("MapboxStaticMap", {
          coordinate: {
            field: "yextDisplayCoordinate",
            constantValue: { latitude: 0, longitude: 0 },
          },
          mapStyle: props.styles?.mapStyle ?? "streets-v12",
        }),
      ];
    case "BannerSection":
      return [
        recipeNode("RichText", {
          data: props.data,
          typography: { textAlign: "center", lineHeight: "1.5" },
        }),
      ];
    case "FormSection":
      return [recipeNode("ContactForm", props)];
    case "ReviewsSection":
      return [recipeNode("Reviews", props)];
    case "BreadcrumbsSection":
      return [recipeNode("Breadcrumbs", props)];
    default:
      throw new Error(`Missing editable section recipe for ${name}`);
  }
}

export function sectionContent(name: string, props: Props): Slot {
  return [
    recipeNode(
      "Stack",
      {
        layout: {
          ...stackConfig.defaultProps?.layout,
          maxWidth: "var(--maxWidth-pageSection-contentWidth, 80rem)",
          width: "100%",
          gap: "var(--space-8, 2rem)",
        },
        spacing: { marginInlineStart: "auto", marginInlineEnd: "auto" },
      },
      sectionRecipe(name, props)
    ),
  ];
}
