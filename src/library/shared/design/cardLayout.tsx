import * as React from "react";
import type { YextComponentConfig } from "@yext/visual-editor";
import type { DesignProps } from "./styleSchema.ts";
import { withDesign } from "./withDesign.tsx";
import { designAttributes, designStyle, typographyClasses } from "./styles.ts";

export const cardGridDefaults: DesignProps = {
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "var(--space-8, 2rem)",
  },
  responsive: {
    mobile: { layout: { gridTemplateColumns: "minmax(0, 1fr)" } },
  },
};
export const cardListDefaults: DesignProps = {
  layout: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-8, 2rem)",
  },
};

/** Put layout controls on the actual item grid, preserving each source's mapping behavior. */
export function withCardLayout(
  component: YextComponentConfig<any>,
  list = false
): YextComponentConfig<any> {
  const defaults = list ? cardListDefaults : cardGridDefaults;
  const enhanced = withDesign(component);
  const Render = component.render as React.ComponentType<any>;
  return {
    ...enhanced,
    // This fixed source owns an internal grid; enclosing layout atoms handle its placement.
    inline: false,
    defaultProps: { ...enhanced.defaultProps, ...defaults },
    render: (props) => {
      const CardSlot = props.slots?.CardSlot;
      if (!CardSlot) return <Render {...props} />;
      const design = {
        ...props,
        layout: { ...defaults.layout, ...props.layout },
        responsive: props.responsive ?? defaults.responsive,
      } as DesignProps;
      const styledSlot = (slotProps: Record<string, any> = {}) =>
        CardSlot({
          ...slotProps,
          as: props.as ?? slotProps.as ?? "div",
          ...designAttributes(design.attributes),
          className: `components sl-atom sl-yext-block ${typographyClasses(design)}`,
          style: {
            ...slotProps.style,
            ...designStyle(design, props.puck.isEditing),
          },
        });
      return (
        <Render {...props} slots={{ ...props.slots, CardSlot: styledSlot }} />
      );
    },
  };
}
