import * as React from "react";
import { PuckComponent, Slot } from "@puckeditor/core";
import { cva } from "class-variance-authority";
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

export const gridAllowedComponents = [
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

const gridVariants = cva("grid w-full gap-8 sm:grid-cols-1", {
  variants: {
    columns: {
      1: "md:grid-cols-1 lg:grid-cols-1",
      2: "md:grid-cols-2 lg:grid-cols-2",
      3: "md:grid-cols-2 lg:grid-cols-3",
      4: "md:grid-cols-2 lg:grid-cols-4",
      5: "md:grid-cols-2 lg:grid-cols-5",
      6: "md:grid-cols-2 lg:grid-cols-6",
    },
  },
});

const alignmentFields = [
  "alignColumn1",
  "alignColumn2",
  "alignColumn3",
  "alignColumn4",
  "alignColumn5",
  "alignColumn6",
] as const;

type GridAlignment = "left" | "center" | "right";
type ColumnAlignmentField = (typeof alignmentFields)[number];
type ColumnAlignments = Partial<Record<ColumnAlignmentField, GridAlignment>>;

const resolveColumnAlignments = (
  props: ColumnAlignments
): Record<ColumnAlignmentField, GridAlignment> =>
  Object.fromEntries(
    alignmentFields.map((field) => [field, props[field] ?? "left"])
  ) as Record<ColumnAlignmentField, GridAlignment>;

export interface GridProps extends layoutProps, ColumnAlignments {
  columns: 1 | 2 | 3 | 4 | 5 | 6;
  slots: { Column: Slot }[];
  liveVisibility: boolean;
  className?: string;
  /** @internal */
  analytics: {
    scope?: string;
  };
}

const GridSection = React.forwardRef<
  HTMLDivElement,
  Parameters<PuckComponent<GridProps>>[0]
>((props, ref) => {
  const { className, columns = 2, backgroundColor, slots } = props;

  return (
    <PageSection background={backgroundColor} className={className}>
      <div className={gridVariants({ columns })} ref={ref}>
        {slots.slice(0, columns).map(({ Column }, idx) => {
          const resolvedAlign = props[alignmentFields[idx]] ?? "left";
          const alignmentClass =
            resolvedAlign === "left"
              ? columns === 1
                ? "md:items-start text-start"
                : undefined
              : resolvedAlign === "right"
                ? "items-end text-end"
                : "items-center text-center";

          return (
            <Column
              key={idx}
              className={themeManagerCn(
                layoutVariants({ gap: "4" }),
                `flex flex-col max-w-full overflow-hidden`,
                resolvedAlign !== "left" && "[&>*]:max-w-full",
                alignmentClass
              )}
              allow={gridAllowedComponents}
            />
          );
        })}
      </div>
    </PageSection>
  );
});

GridSection.displayName = "GridSection";

const alignmentField = (label: ReturnType<typeof msg>) => ({
  label,
  type: "radio" as const,
  options: ThemeOptions.ALIGNMENT,
});

const gridSectionFields: YextFields<GridProps> = {
  columns: {
    label: msg("fields.columns", "Columns"),
    type: "select",
    options: [
      { label: msg("fields.options.one", "One"), value: 1 },
      { label: msg("fields.options.two", "Two"), value: 2 },
      { label: msg("fields.options.three", "Three"), value: 3 },
      { label: msg("fields.options.four", "Four"), value: 4 },
      { label: msg("fields.options.five", "Five"), value: 5 },
      { label: msg("fields.options.six", "Six"), value: 6 },
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
    generation: { required: false },
    type: "basicSelector",
    label: msg("fields.backgroundColor", "Background Color"),
    options: "BACKGROUND_COLOR",
  },
  alignColumn1: alignmentField(
    msg("fields.alignContentColumn1", "Align Content Column 1")
  ),
  alignColumn2: alignmentField(
    msg("fields.alignContentColumn2", "Align Content Column 2")
  ),
  alignColumn3: alignmentField(
    msg("fields.alignContentColumn3", "Align Content Column 3")
  ),
  alignColumn4: alignmentField(
    msg("fields.alignContentColumn4", "Align Content Column 4")
  ),
  alignColumn5: alignmentField(
    msg("fields.alignContentColumn5", "Align Content Column 5")
  ),
  alignColumn6: alignmentField(
    msg("fields.alignContentColumn6", "Align Content Column 6")
  ),
  analytics: {
    type: "object",
    label: msg("fields.analytics", "Analytics"),
    visible: false,
    objectFields: {
      scope: {
        generation: { required: false },
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
  label: msg("components.grid", "Grid"),
  fields: gridSectionFields,
  defaultProps: {
    columns: 2,
    slots: [{ Column: [] }, { Column: [] }],
    backgroundColor: backgroundColors.background1.value,
    liveVisibility: true,
    analytics: {
      scope: "gridSection",
    },
    ...resolveColumnAlignments({}),
  },
  resolveFields: (data) => {
    const fields = { ...gridSectionFields };
    alignmentFields.slice(data.props.columns).forEach((field) => {
      delete fields[field];
    });
    return toPuckFields(fields);
  },
  resolveData: (data) => {
    let slots = data.props.slots;

    if (data.props.columns < data.props.slots.length) {
      slots = data.props.slots.slice(0, data.props.columns);
    }

    if (data.props.columns > data.props.slots.length) {
      slots = data.props.slots.concat(
        Array.from(
          { length: data.props.columns - data.props.slots.length },
          () => {
            return { Column: [] };
          }
        )
      );
    }

    return {
      ...data,
      props: {
        ...data.props,
        slots,
        ...resolveColumnAlignments(data.props),
      },
    };
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
  id: "Grid",
  displayName: "Grid",
  description: "Renders a grid for other Core Information atoms.",
  pageSetTypes: ["ENTITY"],
  category: "Core Information",
};
