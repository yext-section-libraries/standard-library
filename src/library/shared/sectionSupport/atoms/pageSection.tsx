import * as React from "react";
import {
  PageSection as ThemePageSection,
  type PageSectionProps as ThemePageSectionProps,
} from "@yext/visual-editor/section-library-support";
import { FunctionalBlockContext } from "../../design/FunctionalBlockContext.ts";
import { Background } from "./background.tsx";

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
  ({ surface, surfaceRole, onDark, className, maxWidth, ...props }, ref) => {
    const isFunctionalBlock = React.useContext(FunctionalBlockContext);
    const role = surfaceRole ?? surface ?? "page";
    const themedClassName = [onDark && "ve-theme-on-dark", className]
      .filter(Boolean)
      .join(" ");
    if (isFunctionalBlock) {
      const {
        as: Tag = "div",
        background,
        color,
        outerClassName,
        outerStyle,
        verticalPadding: _verticalPadding,
        ...innerProps
      } = props;
      return (
        <Background
          ref={ref}
          surfaceRole={role}
          background={background}
          color={color}
          className={outerClassName}
          style={outerStyle}
        >
          <Tag {...innerProps} className={themedClassName} />
        </Background>
      );
    }

    return (
      <ThemePageSection
        ref={ref}
        maxWidth={maxWidth === "default" ? "theme" : maxWidth}
        surfaceRole={role}
        className={themedClassName}
        {...props}
      />
    );
  }
);
PageSection.displayName = "PageSection";
