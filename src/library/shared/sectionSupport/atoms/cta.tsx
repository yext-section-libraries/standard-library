import {
  CTA as ThemeCTA,
  type CTAProps as ThemeCTAProps,
  type ThemeColor,
  type InteractionRole,
} from "@yext/visual-editor/section-library-support";
export const isCtaVariantWithColor = (variant?: CTAVariant) =>
  [
    "primary",
    "secondary",
    "link",
    "primary-button",
    "secondary-button",
  ].includes(variant ?? "");
export type CTAVariant = ThemeCTAProps["variant"] | InteractionRole;
export type CTAProps = Omit<ThemeCTAProps, "variant"> & {
  variant?: CTAVariant;
  textColor?: ThemeColor;
};
export const CTA = ({
  textColor,
  labelColor,
  variant,
  interactionRole,
  ...props
}: CTAProps) => {
  const role =
    variant === "primary-button" ||
    variant === "secondary-button" ||
    variant === "navigation-link"
      ? variant
      : undefined;
  return (
    <ThemeCTA
      {...props}
      variant={role ? undefined : (variant as ThemeCTAProps["variant"])}
      interactionRole={interactionRole ?? role}
      labelColor={labelColor ?? textColor}
    />
  );
};
