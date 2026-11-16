import * as React from "react";
// Native fields opt into Puck transforms for mapping overlays. Direct Render
// callers can still supply authored values. Avoid tooltip DOM wrappers here:
// the semantic element must remain the actual grid/flex item in the editor.
import { useTranslation } from "react-i18next";
import {
  getDefaultRTF,
  resolveComponentData,
  useDocument,
  type TranslatableString,
  type TranslatableRichText,
  type YextEntityField,
  type YextComponentConfig,
  type YextCTAField,
  type PresetImageType,
  type YextFieldDefinition,
  isLocalizedAssetImage,
  resolveLocalizedAssetImage,
} from "@yext/visual-editor";
import { getDirections, Link } from "@yext/pages-components";
import {
  itemBindingField,
  useItemValue,
  type ItemBinding,
} from "./CollectionScope.tsx";
import {
  getCTAType,
  presetImageIcons,
} from "@yext/visual-editor/section-library-support";
import { CTA } from "../sectionSupport/atoms/cta.tsx";
import { designStyle } from "./styles.ts";
import { DesignElement } from "./DesignElement.tsx";
import { designFields, renderDesignFields } from "./fields.tsx";
import type { DesignProps } from "./styleSchema.ts";
import {
  getImageUrl,
  imageDefaultProps,
  type ImageWrapperProps,
} from "../../sections/ImageWrapper.tsx";
import { getImageAltText } from "../sectionSupport/atoms/image.tsx";
import { designIcons } from "./icons.ts";

export const constantText = (
  text: string
): YextEntityField<TranslatableString> => ({
  field: "",
  constantValue: { defaultValue: text },
  constantValueEnabled: true,
});

export type TextContentProps = DesignProps & {
  binding?: ItemBinding;
  data: { text: YextEntityField<TranslatableString | TranslatableRichText> };
  as: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

const textDataField = (
  rich = false
): YextFieldDefinition<TextContentProps["data"]> => ({
  type: "object" as const,
  label: "Text source",
  variant: "flush" as const,
  objectFields: {
    text: {
      type: "entityField" as const,
      transform: true,
      label: "Text",
      filter: { types: ["type.string", "type.rich_text_v2"] },
      constantValueFilter: {
        types: [rich ? "type.rich_text_v2" : "type.string"],
      },
    },
  },
});

export const headingConfig: YextComponentConfig<TextContentProps> = {
  label: "Heading",
  fields: {
    binding: itemBindingField(["title", "eyebrow", "value"]),
    data: textDataField(),
    as: {
      type: "select",
      label: "Heading level",
      options: ["h1", "h2", "h3", "h4", "h5", "h6"].map((value) => ({
        label: value,
        value,
      })),
    },
    ...designFields,
  },
  renderFields: renderDesignFields,
  inline: true,
  defaultProps: {
    data: { text: constantText("Your heading") },
    as: "h2",
    typography: {
      fontFamily: "var(--fontFamily-h2-fontFamily, sans-serif)",
      fontWeight: "var(--fontWeight-h2-fontWeight, 600)",
      fontSize: "var(--fontSize-h2-fontSize, 2rem)",
      lineHeight: "1.15",
      textWrap: "balance",
    },
    spacing: { marginBlockStart: "0", marginBlockEnd: "0" },
  },
  render: function Heading({ data, binding, as, puck, ...design }) {
    const document = useDocument();
    const { i18n } = useTranslation();
    const text = resolveComponentData(
      useItemValue(binding, data.text),
      i18n.language,
      document,
      { output: "plainText" }
    );
    if (!text && !puck.isEditing) return <></>;
    return (
      <>
        <DesignElement
          elementRef={puck.dragRef}
          as={/^h[1-6]$/.test(as) ? as : "h2"}
          design={design}
          isEditing={puck.isEditing}
        >
          {text || "Your heading"}
        </DesignElement>
      </>
    );
  },
};

export const paragraphConfig: YextComponentConfig<TextContentProps> = {
  ...headingConfig,
  label: "Paragraph",
  fields: {
    ...designFields,
    binding: itemBindingField(["title", "eyebrow", "value"]),
    data: textDataField(),
    as: {
      type: "select",
      label: "HTML element",
      options: ["p", "span", "div"].map((value) => ({ label: value, value })),
    },
  },
  defaultProps: {
    ...headingConfig.defaultProps,
    as: "p",
    data: { text: constantText("Add your text here.") },
    typography: {},
  },
  render: function Paragraph({ data, binding, as, puck, ...design }) {
    const document = useDocument();
    const { i18n } = useTranslation();
    const text = resolveComponentData(
      useItemValue(binding, data.text),
      i18n.language,
      document,
      { output: "plainText" }
    );
    if (!text && !puck.isEditing) return <></>;
    return (
      <>
        <DesignElement
          elementRef={puck.dragRef}
          as={["p", "span", "div"].includes(as) ? as : "p"}
          design={design}
          isEditing={puck.isEditing}
        >
          {text || "Add text"}
        </DesignElement>
      </>
    );
  },
};

export const richTextConfig: YextComponentConfig<Omit<TextContentProps, "as">> =
  {
    label: "Rich text",
    fields: {
      binding: itemBindingField(["body", "title"]),
      data: textDataField(true),
      ...designFields,
    },
    renderFields: renderDesignFields,
    inline: true,
    defaultProps: {
      data: {
        text: {
          field: "",
          constantValueEnabled: true,
          constantValue: {
            defaultValue: getDefaultRTF("Tell your story here."),
          },
        },
      },
      typography: { lineHeight: "1.6" },
    },
    render: function RichText({ data, binding, puck, ...design }) {
      const document = useDocument();
      const { i18n } = useTranslation();
      const content = resolveComponentData(
        useItemValue(binding, data.text),
        i18n.language,
        document
      );
      if (!content && !puck.isEditing) return <></>;
      return (
        <>
          <DesignElement
            elementRef={puck.dragRef}
            design={design}
            isEditing={puck.isEditing}
            className="sl-rich-text"
          >
            {content || "Add rich text"}
          </DesignElement>
        </>
      );
    },
  };

export type PictureProps = DesignProps &
  Pick<ImageWrapperProps, "data"> & {
    binding?: ItemBinding;
    altText?: YextEntityField<TranslatableString>;
    decorative: boolean;
    loading: "lazy" | "eager";
    sizes?: string;
  };

export const imageConfig: YextComponentConfig<PictureProps> = {
  label: "Image",
  fields: {
    binding: itemBindingField(["image"]),
    data: {
      type: "object",
      label: "Image source",
      variant: "flush",
      objectFields: {
        image: {
          type: "entityField",
          transform: true,
          label: "Image",
          filter: { types: ["type.image"] },
        },
        link: {
          type: "translatableString",
          label: "Optional image link",
          generation: { required: false },
        },
      },
    },
    altText: {
      type: "entityField",
      transform: true,
      label: "Alternative text (defaults to image description)",
      filter: { types: ["type.string"] },
    },
    decorative: {
      type: "radio",
      label: "Image purpose",
      options: [
        { label: "Informative", value: false },
        { label: "Decorative", value: true },
      ],
    },
    loading: {
      type: "select",
      label: "Loading priority",
      options: [
        { label: "Lazy (below the fold)", value: "lazy" },
        { label: "Eager (hero / above the fold)", value: "eager" },
      ],
    },
    sizes: {
      type: "text",
      label: "Responsive image sizes",
      placeholder: "(min-width: 1024px) 50vw, 100vw",
    },
    ...designFields,
  },
  renderFields: renderDesignFields,
  inline: true,
  defaultProps: {
    data: imageDefaultProps.data,
    decorative: false,
    loading: "lazy",
    layout: { width: "100%", height: "auto", display: "block" },
    surface: {
      objectFit: "cover",
      borderRadius: "var(--radius-image, 0.75rem)",
    },
  },
  render: function Picture({
    data,
    binding,
    altText,
    decorative,
    loading,
    sizes,
    puck,
    ...design
  }) {
    const document = useDocument();
    const { i18n } = useTranslation();
    const image = resolveComponentData(
      useItemValue(binding, data.image),
      i18n.language,
      document
    );
    const src = getImageUrl(image, i18n.language);
    const alt = altText
      ? resolveComponentData(altText, i18n.language, document, {
          output: "plainText",
        })
      : undefined;
    const normalizedImage =
      image && isLocalizedAssetImage(image)
        ? resolveLocalizedAssetImage(image, i18n.language)
        : image;
    const sourceImage =
      normalizedImage && "image" in normalizedImage
        ? normalizedImage.image
        : normalizedImage;
    const fallbackAlt = getImageAltText(sourceImage, i18n.language, document);
    const resolvedAlt = decorative ? "" : alt || fallbackAlt || "";
    const href = safeLink(
      resolveComponentData(data.link ?? "", i18n.language, document)
    );
    const thumbnails =
      sourceImage &&
      "thumbnails" in sourceImage &&
      Array.isArray(sourceImage.thumbnails)
        ? sourceImage.thumbnails
        : [];
    const candidates = [...thumbnails, sourceImage].filter(
      (candidate) =>
        candidate &&
        typeof candidate.url === "string" &&
        typeof candidate.width === "number" &&
        candidate.width > 0
    );
    const sources = Array.from(
      new Map<number, string>(
        candidates.map(
          (candidate) => [candidate.width, candidate.url] as [number, string]
        )
      )
    ).sort(([left], [right]) => left - right);
    const srcSet =
      sources.length > 1
        ? sources.map(([width, url]) => `${url} ${width}w`).join(", ")
        : undefined;
    if (!src)
      return puck.isEditing ? (
        <DesignElement
          elementRef={puck.dragRef}
          design={design}
          style={{ padding: 24, background: "#f1f5f9" }}
        >
          Choose an image
        </DesignElement>
      ) : (
        <></>
      );
    const linked = !!href && !decorative;
    const picture = (
      <DesignElement
        elementRef={linked ? undefined : puck.dragRef}
        as="img"
        design={linked ? { layout: { width: "100%", height: "100%" } } : design}
        style={
          linked
            ? {
                objectFit: "inherit",
                objectPosition: "inherit",
                borderRadius: "inherit",
              }
            : undefined
        }
        isEditing={puck.isEditing}
        {...{
          src,
          srcSet,
          sizes: srcSet ? sizes || "100vw" : undefined,
          alt: resolvedAlt,
          "aria-hidden": decorative && !puck.isEditing ? true : undefined,
          "aria-label":
            design.attributes?.ariaLabel ||
            (puck.isEditing && !linked ? resolvedAlt || "Image" : undefined),
          width: sourceImage?.width,
          height: sourceImage?.height,
          loading,
          decoding: "async",
          fetchpriority: loading === "eager" ? "high" : undefined,
        }}
      />
    );
    return linked ? (
      <DesignElement
        as="a"
        design={design}
        elementRef={puck.dragRef}
        isEditing={puck.isEditing}
        {...{ href }}
        onClick={puck.isEditing ? (event) => event.preventDefault() : undefined}
      >
        {picture}
      </DesignElement>
    ) : (
      picture
    );
  },
};

/** Links use browser URL parsing, rejecting executable and unknown protocols. */
export function safeLink(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    Array.from(value).some(
      (character) =>
        character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127
    )
  )
    return undefined;
  try {
    const url = new URL(value, "https://local.invalid");
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

export type ButtonProps = DesignProps & {
  binding?: ItemBinding;
  cta: YextCTAField;
  action: "link" | "button" | "submit" | "reset";
  openInNewTab: boolean | "data";
  presetImage?: PresetImageType;
  eventName?: string;
  icon?: keyof typeof designIcons | "";
  iconPosition?: "before" | "after";
};

export const buttonConfig: YextComponentConfig<ButtonProps> = {
  label: "Button / link",
  fields: {
    binding: itemBindingField(["cta"]),
    cta: { type: "ctaSelector", transform: true, label: "Link and label" },
    action: {
      type: "select",
      label: "Action",
      options: [
        { label: "Navigate to a link", value: "link" },
        { label: "Button", value: "button" },
        { label: "Submit enclosing form", value: "submit" },
        { label: "Reset enclosing form", value: "reset" },
      ],
    },
    openInNewTab: {
      type: "radio",
      label: "Open link in new tab",
      options: [
        { label: "Use link settings", value: "data" },
        { label: "Same tab", value: false },
        { label: "New tab", value: true },
      ],
    },
    presetImage: {
      type: "select",
      label: "Artwork for image links",
      generation: { required: false },
      options: Object.keys(presetImageIcons).map((value) => ({
        label: value.replace(/-/g, " "),
        value,
      })),
    },
    eventName: { type: "text", visible: false, generation: { exclude: true } },
    icon: {
      type: "select",
      label: "Optional icon",
      options: [
        { label: "None", value: "" },
        ...Object.keys(designIcons).map((value) => ({
          label: value.replace(/([a-z])([A-Z])/g, "$1 $2"),
          value,
        })),
      ],
    },
    iconPosition: {
      type: "radio",
      label: "Icon position",
      options: [
        { label: "Before label", value: "before" },
        { label: "After label", value: "after" },
      ],
    },
    ...designFields,
  },
  renderFields: renderDesignFields,
  inline: true,
  defaultProps: {
    cta: {
      field: "",
      constantValueEnabled: true,
      constantValue: {
        label: { defaultValue: "Learn more" },
        link: "#",
        linkType: "URL",
      },
    },
    action: "link",
    openInNewTab: "data",
    presetImage: "app-store",
    eventName: "cta",
    layout: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "44px",
      width: "fit-content",
      gap: "0.5rem",
    },
    spacing: {
      paddingBlockStart: "0.75rem",
      paddingBlockEnd: "0.75rem",
      paddingInlineStart: "1.5rem",
      paddingInlineEnd: "1.5rem",
    },
    typography: {
      fontFamily: "var(--fontFamily-button-fontFamily, sans-serif)",
      fontWeight: "var(--fontWeight-button-fontWeight, 600)",
      textDecoration: "none",
      color:
        "var(--color-on-brand, var(--colors-palette-primary-contrast, #fff))",
    },
    surface: {
      backgroundColor: "var(--colors-palette-primary, #1d4ed8)",
      borderRadius: "var(--radius-button, 0.5rem)",
    },
    states: {
      hover: { surface: { opacity: "0.88" } },
      focusVisible: {
        surface: {
          boxShadow:
            "0 0 0 3px var(--color-surface, #fff), 0 0 0 6px var(--colors-palette-primary, #1d4ed8)",
        },
      },
    },
  },
  render: function Button({
    cta,
    binding,
    action,
    openInNewTab,
    presetImage = "app-store",
    eventName = "cta",
    icon,
    iconPosition = "after",
    puck,
    ...design
  }) {
    const document = useDocument();
    const { i18n } = useTranslation();
    const source = useItemValue(binding, cta);
    const resolved = resolveComponentData(source, i18n.language, document);
    const ctaType = resolved?.ctaType ?? getCTAType(source).ctaType;
    const label =
      resolveComponentData(resolved?.label ?? "", i18n.language, document) ||
      (ctaType === "getDirections"
        ? i18n.t("getDirections", "Get Directions")
        : puck.isEditing
          ? "Add link text"
          : "");
    const rawLink = resolveComponentData(
      resolved?.link ?? "",
      i18n.language,
      document
    );
    const typedLink =
      resolved?.linkType === "PHONE" && !rawLink.startsWith("tel:")
        ? `tel:${rawLink.replace(/[^+\d]/g, "")}`
        : resolved?.linkType === "EMAIL" && !rawLink.startsWith("mailto:")
          ? `mailto:${rawLink}`
          : rawLink;
    const href = safeLink(
      ctaType === "getDirections"
        ? getDirections(
            undefined,
            document.ref_listings,
            undefined,
            { provider: "google" },
            document.yextDisplayCoordinate
          ) || "#"
        : typedLink
    );
    const newTab =
      openInNewTab === "data" ? resolved?.openInNewTab : openInNewTab;
    // An unmapped collection link has no destination. Keep its editor target
    // selectable without creating an invalid anchor or a page-components Link.
    if (action === "link" && !href) {
      return puck.isEditing ? (
        <DesignElement
          as="span"
          elementRef={puck.dragRef}
          design={design}
          isEditing
          className="sl-button"
          aria-disabled="true"
          title="Choose a link destination"
        >
          {label || "Choose a link"}
        </DesignElement>
      ) : (
        <></>
      );
    }
    if (ctaType === "presetImage" && action === "link") {
      return (
        <CTA
          dragRef={puck.dragRef}
          ctaType="presetImage"
          variant="link"
          label=""
          link={href}
          linkType="URL"
          normalizeLink={false}
          presetImageType={presetImage}
          eventName={eventName}
          openInNewTab={newTab}
          disabled={puck.isEditing}
          className="components sl-atom sl-button"
          style={designStyle(design, puck.isEditing)}
          ariaLabel={design.attributes?.ariaLabel}
          id={design.attributes?.htmlId}
        />
      );
    }
    if (!label) return <></>;
    const Icon = icon ? designIcons[icon] : undefined;
    const glyph = Icon ? (
      <Icon
        width="1em"
        height="1em"
        aria-hidden="true"
        focusable="false"
        style={{ flexShrink: 0 }}
      />
    ) : null;
    return (
      <>
        <DesignElement
          elementRef={puck.dragRef}
          as={action === "link" ? Link : "button"}
          design={design}
          isEditing={puck.isEditing}
          className="sl-button"
          {...(action === "link"
            ? {
                href,
                target: newTab ? "_blank" : undefined,
                rel: newTab ? "noopener noreferrer" : undefined,
                eventName: puck.isEditing ? undefined : eventName,
                obfuscate: false,
              }
            : { type: action })}
          onClick={
            puck.isEditing
              ? (event: React.MouseEvent) => event.preventDefault()
              : undefined
          }
        >
          {iconPosition === "before" && glyph}
          {label}
          {iconPosition === "after" && glyph}
        </DesignElement>
      </>
    );
  },
};
