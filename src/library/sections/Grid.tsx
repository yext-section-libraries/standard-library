import * as React from "react";
import { PuckComponent, Slot } from "@puckeditor/core";
import {
  backgroundColors,
  ThemeOptions,
  getAnalyticsScopeHash,
  msg,
  themeManagerCn,
  toPuckFields,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import { PageSection } from "../shared/sectionSupport/atoms/pageSection.tsx";
import { VisibilityWrapper } from "../shared/sectionSupport/atoms/visibilityWrapper.tsx";
import {
  layoutProps,
  layoutVariants,
} from "../shared/sectionSupport/Layout.tsx";
import { AnalyticsScopeProvider } from "@yext/pages-components";

const gridAllowedComponents = [
  "Address",
  "BodyText",
  "CTAGroup",
  "CTAWrapper",
  "Emails",
  "GetDirections",
  "HeadingText",
  "HoursTable",
  "HoursStatus",
  "ImageWrapper",
  "MapboxStaticMap",
  "Phone",
  "TextList",
  "Text",
];

export interface GridProps extends layoutProps {
  columns: number;
  slots: { Column: Slot }[];
  liveVisibility: boolean;
  className?: string;
  align?: "left" | "center" | "right";
  /** @internal */
  analytics: {
    scope?: string;
  };
}

const GridSection = React.forwardRef<
  HTMLDivElement,
  Parameters<PuckComponent<GridProps>>[0]
>(({ className, columns = 2, backgroundColor, slots, align }, ref) => {
  const resolvedAlign = align ?? "left";

  return (
    <PageSection background={backgroundColor} className={className}>
      <div
        className={
          columns === 1
            ? "grid w-full gap-8 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1"
            : columns === 2
              ? "grid w-full gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
              : "grid w-full gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }
        ref={ref}
      >
        {slots.slice(0, columns).map(({ Column }, idx) => (
          <Column
            key={idx}
            className={themeManagerCn(
              layoutVariants({ gap: "4" }),
              `flex flex-col max-w-full overflow-hidden`,
              columns === 1 &&
                (resolvedAlign === "left"
                  ? `md:items-start text-start`
                  : resolvedAlign === "right"
                    ? `md:items-end text-end`
                    : `md:items-center text-center`)
            )}
            allow={gridAllowedComponents}
          />
        ))}
      </div>
    </PageSection>
  );
});

GridSection.displayName = "GridSection";

const gridSectionFields: YextFields<GridProps> = {
  columns: {
    label: msg("fields.columns", "Columns"),
    type: "radio",
    options: [
      { label: msg("fields.options.one", "One"), value: 1 },
      { label: msg("fields.options.two", "Two"), value: 2 },
      { label: msg("fields.options.three", "Three"), value: 3 },
    ],
  },
  slots: {
    type: "array",
    arrayFields: {
      Column: { type: "slot" },
    },
    visible: false,
  },
  backgroundColor: {
    type: "basicSelector",
    label: msg("fields.backgroundColor", "Background Color"),
    options: "BACKGROUND_COLOR",
  },
  align: {
    label: msg("fields.alignContent", "Align Content"),
    type: "radio",
    options: ThemeOptions.ALIGNMENT,
  },
  analytics: {
    type: "object",
    label: msg("fields.analytics", "Analytics"),
    visible: false,
    objectFields: {
      scope: {
        label: msg("fields.scope", "Scope"),
        type: "text",
      },
    },
  },
  liveVisibility: {
    label: msg("fields.visibleOnLivePage", "Visible on Live Page"),
    type: "radio",
    options: [
      { label: msg("fields.options.show", "Show"), value: true },
      { label: msg("fields.options.hide", "Hide"), value: false },
    ],
  },
};

/**
 * The Grid Section component presents a series of columns into which a variety of smaller content blocks may be dragged, allowing for a higher degree of customization.
 */
export const Grid: YextComponentConfig<GridProps> = {
  label: msg("components.gridSection", "Grid Section"),
  fields: gridSectionFields,
  defaultProps: {
    columns: 2,
    slots: [{ Column: [] }, { Column: [] }, { Column: [] }],
    backgroundColor: backgroundColors.background1.value,
    liveVisibility: true,
    analytics: {
      scope: "gridSection",
    },
    align: "left",
  },
  resolveFields: (data) => {
    if (data.props.columns === 1) {
      return toPuckFields(gridSectionFields);
    }

    const rest = { ...gridSectionFields };
    delete rest.align;

    return toPuckFields(rest);
  },
  render: (props) => (
    <AnalyticsScopeProvider
      name={`${props.analytics?.scope ?? "gridSection"}${getAnalyticsScopeHash(props.id)}`}
    >
      <VisibilityWrapper
        liveVisibility={props.liveVisibility}
        isEditing={props.puck.isEditing}
        iconSize="md"
      >
        <GridSection {...props} />
      </VisibilityWrapper>
    </AnalyticsScopeProvider>
  ),
};

export const config: SectionConfig = {
  id: "gridSection",
  displayName: "Grid Section",
  description: "Renders a grid for other Core Information atoms.",
  pageSetTypes: ["ENTITY"],
  category: "Core Information",
};
