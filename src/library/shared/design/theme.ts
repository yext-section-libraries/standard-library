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

export const surfaceColorTokens = {
  page: "background",
  primary: "primary",
  secondary: "secondary",
  accent: "accent",
  muted: "muted",
} as const satisfies Record<SurfaceRole, string>;

export const pageBackgroundValue = "var(--ve-color-background)";
export const pageBackgroundSolidVariable = "--sl-page-background-solid";
export const pageBackgroundSolidValue = `var(${pageBackgroundSolidVariable}, ${pageBackgroundValue})`;

export const backgroundStateCombinations = [
  [],
  ["hover"],
  ["focusVisible"],
  ["hover", "focusVisible"],
  ["active"],
  ["hover", "active"],
  ["focusVisible", "active"],
  ["hover", "focusVisible", "active"],
] as const;

export function themeSurfaceRole(backgroundColor?: string) {
  return surfaceRoles.find(
    (role) => backgroundColor === `var(--ve-color-${surfaceColorTokens[role]})`
  );
}

export function themeSurfaceClassName(
  backgroundColor?: string,
  fallback?: SurfaceRole | ""
) {
  const role = themeSurfaceRole(backgroundColor) ?? fallback;
  return role ? `ve-theme-${role} sl-surface-${role}` : "";
}

export const typographyRoles = [
  "headline",
  "section-title",
  "card-title",
  "eyebrow",
  "body-small",
  "body",
  "body-large",
] as const satisfies readonly TypographyRole[];

export type TypographyStyle = TypographyRole | "inherit";

export const typographyStyleOptions = typographyRoles.map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1).replace(/-/g, " "),
}));

export const themeTypographyProperties: Readonly<Record<string, string>> = {
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  fontStyle: "font-style",
  textTransform: "text-transform",
};

export function typographyPresetValue(role: TypographyRole, property: string) {
  const responsive = property === "font-size" || property === "line-height";
  return `var(--${responsive ? "sl" : "ve"}-${role}-${property})`;
}

export function typographyStyleClassName(
  style?: TypographyStyle,
  fallback?: TypographyRole
) {
  const role = style || fallback;
  return role ? `sl-type-${role}` : "";
}

export const interactionRoles = [
  "primary-button",
  "secondary-button",
  "link",
  "navigation-link",
] as const satisfies readonly InteractionRole[];

export const professionalHeroTextPlacement = [
  ["ProfessionalNameSlot", 1, "headline"],
  ["CredentialsSlot", "p", "eyebrow"],
  ["ProfessionalTitleSlot", "p", "eyebrow"],
  ["BusinessNameSlot", "p", "eyebrow"],
] as const;

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
