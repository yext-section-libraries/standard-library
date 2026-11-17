import type { Migration } from "@yext/visual-editor";

const bodyTypographyId = (variant: string) =>
  variant === "base" ? "main-body" : `main-body-${variant}`;

/** Complements the built-in migration for library-only names and prop shapes. */
export const migrateLibraryThemeSelections = (
  value: any,
  inheritedDark = false
): any => {
  if (Array.isArray(value)) {
    return value.map((child) =>
      migrateLibraryThemeSelections(child, inheritedDark)
    );
  }
  if (typeof value === "string") {
    return value
      .replaceAll(
        "--maxWidth-pageSection-contentWidth",
        "--ve-page-content-max-width"
      )
      .replaceAll(
        "rounded-image-borderRadius",
        "rounded-[var(--ve-image-border-radius)]"
      );
  }
  if (!value || typeof value !== "object") return value;

  const background =
    value.props?.styles?.backgroundColor ?? value.styles?.backgroundColor;
  const dark = background
    ? (background.isDarkColor ??
      (background.channel === "background" &&
        /^(main-black|main-.*-dark)$/.test(background.colorId ?? "")))
    : inheritedDark;
  const result = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      migrateLibraryThemeSelections(child, dark),
    ])
  );
  const linkId = `main-link${dark ? "-inverse" : ""}`;
  const props = result.props;

  if (
    props &&
    [
      "BreadcrumbsSection",
      "ImageWrapper",
      "Emails",
      "EmailsSlot",
      "PhoneList",
      "HeaderLinks",
      "FooterExpandedLinksWrapper",
      "FooterExpandedLinkSectionSlot",
      "FooterSocialLinksSlot",
    ].includes(value.type)
  ) {
    props.styles = {
      ...props.styles,
      actionId: props.styles?.actionId ?? linkId,
    };
  }
  if (props && value.type === "HeaderLinks") {
    props.styles.actionId =
      value.props.styles?.actionId ??
      `main-headerFooterMainLink${dark ? "-inverse" : ""}`;
  }
  if (props && value.type === "FooterLinksSlot") {
    // The old variant controlled both layout and one of two header/footer link roles.
    const legacyAction = /^main-(primary|secondary)(-inverse)?$/.exec(
      props.actionId ?? ""
    );
    const variant = props.variant ?? legacyAction?.[1];
    props.variant ??= variant;
    if (!props.actionId || legacyAction) {
      props.actionId = `main-headerFooter${variant === "secondary" ? "Secondary" : "Main"}Link${dark ? "-inverse" : ""}`;
    }
  }
  if (props && value.type === "FAQCard") {
    const styles = (props.styles ??= {});
    for (const prefix of ["question", "answer"]) {
      const oldKey = `${prefix}Variant`;
      const newKey = `${prefix}TypographyId`;
      if (styles[oldKey] !== undefined) {
        styles[newKey] ??= bodyTypographyId(styles[oldKey]);
        delete styles[oldKey];
      }
    }
  }
  // Form's submit action lives outside the usual `styles` object.
  if (props && value.type === "FormSection" && props.ctaStyles?.buttonVariant) {
    props.ctaStyles.actionId ??= `main-${props.ctaStyles.buttonVariant}${dark && props.ctaStyles.buttonVariant !== "primary" ? "-inverse" : ""}`;
    delete props.ctaStyles.buttonVariant;
  }
  if (props && ["AboutSection", "ReviewsSection"].includes(value.type)) {
    props.styles = {
      ...props.styles,
      readMoreActionId: props.styles?.readMoreActionId ?? linkId,
    };
  }
  if (props && value.type === "ReviewsSection") {
    props.styles.accentColor ??= {
      colorId: dark ? "main-white" : "main-primary-dark",
      channel: "background",
    };
  }
  if (
    props &&
    value.type === "FooterSocialLinksSlot" &&
    props.styles?.filledBackground
  ) {
    props.styles.backgroundColor ??= {
      colorId: dark ? "main-white" : "main-primary-dark",
      channel: "background",
    };
  }
  if (props && ["Phone", "PhoneSlot", "PhoneList"].includes(value.type)) {
    props.styles = { ...props.styles };
    if (!props.styles.color)
      props.styles.iconBackgroundColor ??= {
        colorId: "main-primary-light",
        channel: "background",
      };
  }
  if (
    props &&
    ["HeroSection", "ProfessionalHeroSection", "PhotoGalleryWrapper"].includes(
      value.type
    )
  ) {
    props.styles = { ...props.styles };
    const key =
      value.type === "PhotoGalleryWrapper" ? "accentColor" : "reviewStarsColor";
    props.styles[key] ??= {
      colorId: dark ? "main-white" : "main-primary-dark",
      channel: "background",
    };
  }
  if (result.primaryHeading && result.phone && result.email && result.address) {
    if (!result.accentColor)
      result.iconBackgroundColor ??= {
        colorId: "main-primary-light",
        channel: "background",
      };
    result.primaryHeading.color ??= {
      colorId: "main-primary-dark",
      channel: "background",
    };
  }
  // Linked/manual detail blocks contain props without a component type wrapper.
  for (const key of ["emails", "phone", "address"]) {
    if (result.type === key && result[key]) {
      if (key === "phone" && !result[key].styles?.color) {
        result[key].styles = {
          ...result[key].styles,
          iconBackgroundColor: result[key].styles?.iconBackgroundColor ?? {
            colorId: "main-primary-light",
            channel: "background",
          },
        };
      }
      result[key].styles = {
        ...result[key].styles,
        actionId: result[key].styles?.actionId ?? linkId,
      };
    }
  }
  return result;
};

export const dynamicThemeSelections: Migration = {
  content: {
    transformation: (content) => migrateLibraryThemeSelections(content),
  },
};
