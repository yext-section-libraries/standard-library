import * as React from "react";
import { CTAVariant, CTA } from "./cta.tsx";
import {
  ThemeColor,
  type TypographyRole,
  themeManagerCn,
} from "@yext/visual-editor";

export type MaybeLinkProps = {
  href?: string;
  "aria-current"?: React.AriaAttributes["aria-current"];
  children?: React.ReactNode;
  className?: string;
  eventName?: string;
  variant?: CTAVariant;
  color?: ThemeColor;
  typographyRole?: TypographyRole;
  alwaysHideCaret?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
};

export const MaybeLink = (props: MaybeLinkProps) => {
  const {
    href,
    children,
    className,
    eventName,
    alwaysHideCaret,
    variant = "link",
    color,
    typographyRole,
    ariaLabel,
    disabled = false,
  } = props;

  if (href) {
    return (
      <CTA
        link={href}
        label={children}
        linkType="URL"
        normalizeLink={false}
        eventName={eventName}
        variant={variant}
        color={color}
        typographyRole={typographyRole}
        className={className}
        alwaysHideCaret={alwaysHideCaret}
        ariaLabel={ariaLabel}
        disabled={disabled}
      />
    );
  } else {
    return (
      <span
        aria-current={props["aria-current"]}
        className={themeManagerCn(
          typographyRole && `ve-theme-${typographyRole}`,
          className
        )}
      >
        {props.children}
      </span>
    );
  }
};
