import * as React from "react";
import {
  Button as ThemeButton,
  type ButtonProps as ThemeButtonProps,
  type InteractionRole,
} from "@yext/visual-editor/section-library-support";
export { buttonLayoutVariants } from "@yext/visual-editor/section-library-support";
export type ButtonProps = Omit<ThemeButtonProps, "variant"> & {
  variant?: ThemeButtonProps["variant"] | InteractionRole;
};
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, interactionRole, ...props }, ref) => {
    const role =
      variant === "primary-button" ||
      variant === "secondary-button" ||
      variant === "navigation-link"
        ? variant
        : undefined;
    return (
      <ThemeButton
        ref={ref}
        {...props}
        variant={role ? undefined : (variant as ThemeButtonProps["variant"])}
        interactionRole={interactionRole ?? role}
      />
    );
  }
);
Button.displayName = "Button";
