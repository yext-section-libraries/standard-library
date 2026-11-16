import * as React from "react";
import type { Slot } from "@puckeditor/core";
import type { YextComponentConfig } from "@yext/visual-editor";
import { designFields, renderDesignFields } from "./fields.tsx";
import { designStyle, designAttributes } from "./styles.ts";
import { semanticTagField, type SemanticTag } from "./DesignElement.tsx";
import type { DesignProps } from "./styleSchema.ts";
import "./design.css";
import { useScopedAttributes } from "./CollectionScope.tsx";
import { headingConfig, paragraphConfig } from "./content.tsx";

export type ContainerProps = DesignProps & { as: SemanticTag; content: Slot };

/** Structural editor objects may not become children of a content container. */
export const structuralComponents = [
  "MainContent",
  "ExpandedHeader",
  "ExpandedFooter",
  "Directory",
  "Locator",
  "ListItem",
];

export function createContainer(
  label: string,
  defaults: Partial<ContainerProps>,
  allowedTags?: SemanticTag[]
): YextComponentConfig<ContainerProps> {
  return {
    label,
    fields: {
      content: {
        type: "slot",
        ...(allowedTags?.every((tag) => tag === "ul" || tag === "ol")
          ? { allow: ["ListItem"] }
          : { disallow: structuralComponents }),
        visible: false,
      },
      as: allowedTags
        ? {
            type: "select",
            label: "HTML element",
            options: allowedTags.map((value) => ({ label: value, value })),
          }
        : semanticTagField,
      ...designFields,
    },
    renderFields: renderDesignFields,
    inline: true,
    defaultProps: { as: "div", content: [], ...defaults },
    render: ({ content: Content, as = "div", puck, ...design }) => {
      const attributes = useScopedAttributes(design.attributes);
      const tag =
        allowedTags && !allowedTags.includes(as) ? allowedTags[0] : as;
      // Invoke the slot callback rather than mounting its changing function as a React type.
      // This preserves form inputs and focus while descendants are edited.
      return (
        <>
          {Content({
            as: tag,
            ref: puck.dragRef,
            className: `components sl-atom ${puck.isEditing ? "sl-editing" : ""}`,
            ...designAttributes(attributes),
            style: designStyle(design, puck.isEditing),
            disallow:
              tag === "ul" || tag === "ol" ? undefined : structuralComponents,
            ...(tag === "ul" || tag === "ol" ? { allow: ["ListItem"] } : {}),
          })}
        </>
      );
    },
  };
}

export const boxConfig = createContainer("Box", {});
export const stackConfig = createContainer("Stack", {
  layout: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-6, 1.5rem)",
  },
});
export const flexConfig = createContainer("Flex", {
  layout: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "var(--space-4, 1rem)",
  },
});
export const columnsConfig = createContainer("Columns", {
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "var(--space-8, 2rem)",
  },
  responsive: {
    mobile: { layout: { gridTemplateColumns: "minmax(0, 1fr)" } },
  },
});
export const cardConfig = createContainer("Card", {
  as: "article",
  content: [
    { type: "Heading", props: { ...headingConfig.defaultProps, as: "h3" } },
    { type: "Paragraph", props: { ...paragraphConfig.defaultProps } },
  ],
  layout: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4, 1rem)",
  },
  spacing: {
    paddingBlockStart: "var(--space-6, 1.5rem)",
    paddingBlockEnd: "var(--space-6, 1.5rem)",
    paddingInlineStart: "var(--space-6, 1.5rem)",
    paddingInlineEnd: "var(--space-6, 1.5rem)",
  },
  surface: {
    backgroundColor: "var(--color-surface, #fff)",
    borderRadius: "var(--radius-card, 1rem)",
    borderColor: "var(--color-border, #dce2e8)",
    borderWidth: "1px",
    borderStyle: "solid",
  },
});
export const listConfig = createContainer(
  "List",
  {
    as: "ul",
    layout: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4, 1rem)",
    },
  },
  ["ul", "ol"]
);
export const listItemConfig = createContainer("List item", { as: "li" }, [
  "li",
]);
