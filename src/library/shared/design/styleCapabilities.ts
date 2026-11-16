import type { StyleGroup } from "./styleSchema.ts";

export function styleCapabilities(type: string) {
  const container = [
    "Box",
    "Stack",
    "Flex",
    "Columns",
    "Card",
    "List",
    "ListItem",
    "Collection",
    "ProductCardsWrapper",
    "TeamCardsWrapper",
    "InsightCardsWrapper",
    "TestimonialCardsWrapper",
    "EventCardsWrapper",
  ].includes(type);
  const image = type === "Image";
  const icon = type === "Icon";
  const imageLike = type.includes("Image") && !/Card|Section/.test(type);
  const text =
    type.endsWith("Section") ||
    (!imageLike &&
      ![
        "Image",
        "ImageWrapper",
        "Gallery",
        "PhotoGalleryWrapper",
        "Video",
        "StaticMapSection",
        "MapboxStaticMap",
        "Divider",
        "Spacer",
        "Icon",
      ].includes(type));
  return { container, image, icon, text, button: type === "Button" };
}

/** Container controls and item controls have different CSS targets. */
export function supportsStyleProperty(
  group: StyleGroup,
  property: string,
  context: {
    type: string;
    display: string;
    parentDisplay: string;
    position: string;
    inlineText: boolean;
  }
): boolean {
  const profile = styleCapabilities(context.type);
  const flex = context.display.includes("flex");
  const grid = context.display.includes("grid");
  const parentFlex = context.parentDisplay.includes("flex");
  const parentGrid = context.parentDisplay.includes("grid");
  if (group === "typography")
    return profile.text || (profile.icon && property === "color");
  if (group === "surface" && ["objectFit", "objectPosition"].includes(property))
    return profile.image;
  if (group === "layout") {
    if (["flexGrow", "flexShrink", "flexBasis"].includes(property))
      return parentFlex;
    if (["gridColumn", "gridRow"].includes(property)) return parentGrid;
    if (property === "alignSelf") return parentFlex || parentGrid;
    if (["flexDirection", "flexWrap"].includes(property))
      return (profile.container || profile.button) && flex;
    if (["gridTemplateColumns", "gridAutoFlow"].includes(property))
      return profile.container && grid;
    if (
      ["alignItems", "justifyContent", "gap", "rowGap", "columnGap"].includes(
        property
      )
    )
      return (profile.container || profile.button) && (flex || grid);
    if (
      context.inlineText &&
      /^(width|height|minWidth|maxWidth|minHeight|maxHeight|aspectRatio)$/.test(
        property
      )
    )
      return false;
  }
  if (group === "position") {
    if (property.startsWith("inset")) return context.position !== "static";
    if (property === "zIndex")
      return context.position !== "static" || parentFlex || parentGrid;
    if (property === "transform") return !context.inlineText;
  }
  return true;
}
