import type {
  Migration,
  MigrationAction,
  TypographyRole,
} from "@yext/visual-editor";
// Freeze the original saved heading-style mapping independently of SDK exports.
const headingRole = (level: number): TypographyRole =>
  level === 1 ? "headline" : level === 2 ? "section-title" : "card-title";

// This migration adopts roles without deciding whether an authored value was a
// default. Every saved override survives, including old palette defaults.
const defaultSurfaces: Record<string, string> = {
  BannerSection: "primary",
  HeroSection: "page",
  ProductSection: "muted",
  AboutSection: "muted",
  CoreInfoSection: "page",
  PromoSection: "page",
  ProfessionalHeroSection: "page",
  EventSection: "muted",
  InsightSection: "muted",
  TeamSection: "muted",
  TestimonialSection: "muted",
  NearbyLocationsSection: "page",
  FAQSection: "muted",
  ReviewsSection: "page",
  PhotoGallerySection: "page",
  VideoSection: "page",
  StaticMapSection: "page",
  FormSection: "page",
  Grid: "page",
  Directory: "page",
  DirectoryGrid: "page",
  DirectoryCard: "page",
  ProductCard: "page",
  EventCard: "page",
  InsightCard: "page",
  TeamCard: "page",
  TestimonialCard: "page",
  PrimaryHeaderSlot: "page",
  SecondaryHeaderSlot: "muted",
  SecondaryFooterSlot: "muted",
};

type Props = Record<string, any>;
const convertHeadingStyle = (styles: Props, key: string) => {
  const level = styles[key];
  if (typeof level === "number" && level >= 1 && level <= 6) {
    styles.typographyRole ??= headingRole(level);
  }
};
const placeHeading = (child: any, tag: number | "p", role: TypographyRole) => {
  if (!child?.props) return;
  const props = child.props;
  props.styles ??= {};
  props.styles.level = typeof tag === "number" ? tag : 2;
  props.styles.semanticLevelOverride = tag;
  props.parentStyles = { ...props.parentStyles, typographyRole: role };
};

export const adoptSemanticThemeProps = (
  type: string,
  original: Props
): Props => {
  const props = structuredClone(original);
  const styles = props.styles;
  if (type === "ExpandedFooter" && styles?.primaryFooter)
    styles.primaryFooter.surface ??= "primary";
  if (styles && defaultSurfaces[type]) styles.surface ??= defaultSurfaces[type];
  if (type === "HeadingText" || type === "HeadingTextSlot") {
    props.styles ??= {};
    convertHeadingStyle(props.styles, "level");
    // Parents below establish the final semantic tag by placement.
    props.styles.level = 2;
    props.styles.semanticLevelOverride = 2;
  }
  if (type === "NearbyLocationCardsWrapper" && styles) {
    convertHeadingStyle(styles, "headingLevel");
    delete styles.headingLevel;
    props.sectionHeadingLevel = 2;
  }
  const convertResultSettings = (value: any): void => {
    if (!value || typeof value !== "object") return;
    if (value.primaryHeading) {
      convertHeadingStyle(value.primaryHeading, "headingLevel");
      delete value.primaryHeading.headingLevel;
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== "slots") convertResultSettings(child);
    }
  };
  if (type === "Locator" || type === "LocatorResultCard")
    convertResultSettings(props);
  const visitSlots = (value: any): void => {
    if (!value || typeof value !== "object") return;
    if (value.type && value.props) {
      value.props = adoptSemanticThemeProps(value.type, value.props);
      return;
    }
    Object.values(value).forEach(visitSlots);
  };
  visitSlots(props.slots);
  const slots = props.slots ?? {};
  for (const [name, children] of Object.entries(slots)) {
    if (!Array.isArray(children)) continue;
    const heading = children[0];
    if (!["HeadingText", "HeadingTextSlot"].includes(heading?.type)) continue;
    if (type === "Directory") {
      placeHeading(
        heading,
        name === "TitleSlot" ? 1 : "p",
        name === "TitleSlot" ? "headline" : "eyebrow"
      );
    } else if (type === "ProfessionalHeroSection") {
      const isName = name === "ProfessionalNameSlot";
      placeHeading(heading, isName ? 1 : "p", isName ? "headline" : "eyebrow");
    } else if (type === "HeroSection") {
      const isLead = name === "BusinessNameSlot" && styles?.showGeomodifier;
      placeHeading(heading, isLead ? "p" : 1, isLead ? "eyebrow" : "headline");
    } else if (type === "DirectoryCard") {
      placeHeading(heading, 2, "card-title");
    } else if (type.endsWith("Card")) {
      placeHeading(heading, 3, "card-title");
    } else {
      placeHeading(heading, 2, "section-title");
    }
  }
  if (type === "AboutSection") {
    for (const child of slots.SidebarSlot ?? [])
      child.props.headingLevelOverride = 3;
  }
  if (slots.CardsWrapperSlot?.[0]?.props) {
    slots.CardsWrapperSlot[0].props.cardHeadingLevel =
      styles?.showSectionHeading === false ? 2 : 3;
  }
  return props;
};
const updated = (
  type: string
): Extract<MigrationAction, { action: "updated" }> => ({
  action: "updated",
  propTransformation: (props) =>
    adoptSemanticThemeProps(type, props) as typeof props,
});

export const semanticThemeRoles: Migration = Object.fromEntries(
  [
    ...new Set([
      ...Object.keys(defaultSurfaces),
      "ExpandedHeader",
      "ExpandedFooter",
      "HeaderLinks",
      "HeadingText",
      "HeadingTextSlot",
      "BodyText",
      "BodyTextSlot",
      "Text",
      "TextSlot",
      "CTAWrapper",
      "CTASlot",
      "Phone",
      "PhoneSlot",
      "PhoneNumbersSlot",
      "HoursStatus",
      "HoursStatusSlot",
      "Locator",
      "LocatorResultCard",
      "NearbyLocationCardsWrapper",
    ]),
  ]
    .sort((a, b) => {
      const order = (type: string) =>
        type.startsWith("HeadingText")
          ? 0
          : type.endsWith("Card")
            ? 1
            : type.endsWith("Wrapper")
              ? 2
              : 3;
      return order(a) - order(b);
    })
    .map((type) => [type, updated(type)])
);
