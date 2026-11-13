import * as React from "react";
import {
  PageSection as ThemePageSection,
  type PageSectionProps as ThemePageSectionProps,
} from "@yext/visual-editor/section-library-support";
export interface PageSectionProps extends Omit<
  ThemePageSectionProps,
  "maxWidth"
> {
  maxWidth?: ThemePageSectionProps["maxWidth"] | "default";
  surface?: ThemePageSectionProps["surfaceRole"];
  /** Image-overlay placement; explicit background colors resolve their own contrast. */
  onDark?: boolean;
}
export const PageSection = React.forwardRef<HTMLDivElement, PageSectionProps>(
  ({ surface, surfaceRole, onDark, className, maxWidth, ...props }, ref) => (
    <ThemePageSection
      ref={ref}
      maxWidth={maxWidth === "default" ? "theme" : maxWidth}
      surfaceRole={surfaceRole ?? surface ?? "page"}
      className={[onDark && "ve-theme-on-dark", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
);
PageSection.displayName = "PageSection";
