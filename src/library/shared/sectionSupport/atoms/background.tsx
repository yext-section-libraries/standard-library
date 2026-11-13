import * as React from "react";
import {
  Background as ThemeBackground,
  type BackgroundProps as ThemeBackgroundProps,
} from "@yext/visual-editor/section-library-support";
export interface BackgroundProps extends ThemeBackgroundProps {
  surface?: ThemeBackgroundProps["surfaceRole"];
  /** Image-overlay placement; explicit background colors resolve their own contrast. */
  onDark?: boolean;
}
export const Background = React.forwardRef<HTMLDivElement, BackgroundProps>(
  ({ surface, surfaceRole, onDark, className, ...props }, ref) => (
    <ThemeBackground
      ref={ref}
      surfaceRole={surfaceRole ?? surface ?? "page"}
      className={[onDark && "ve-theme-on-dark", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
);
Background.displayName = "Background";
