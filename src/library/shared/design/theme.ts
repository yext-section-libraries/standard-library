import type {
  InteractionRole,
  SurfaceRole,
  TypographyRole,
} from "@yext/visual-editor";

export const surfaceRoles = [
  "page",
  "primary",
  "secondary",
  "accent",
  "muted",
] as const satisfies readonly SurfaceRole[];
export const typographyRoles = [
  "headline",
  "section-title",
  "card-title",
  "eyebrow",
  "body-large",
  "body",
  "body-small",
] as const satisfies readonly TypographyRole[];
export const interactionRoles = [
  "primary-button",
  "secondary-button",
  "link",
  "navigation-link",
] as const satisfies readonly InteractionRole[];

export function headingRole(tag: string): TypographyRole {
  return tag === "h1"
    ? "headline"
    : tag === "h2"
      ? "section-title"
      : "card-title";
}

export function interactionRoleForVariant(variant?: string): InteractionRole {
  switch (variant) {
    case "secondary":
    case "secondary-button":
      return "secondary-button";
    case "directoryLink":
    case "link":
      return "link";
    case "headerFooterMainLink":
    case "headerFooterSecondaryLink":
    case "navigation-link":
      return "navigation-link";
    default:
      return "primary-button";
  }
}
