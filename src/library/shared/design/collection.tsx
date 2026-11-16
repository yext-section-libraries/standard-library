import * as React from "react";
import type { Slot } from "@puckeditor/core";
import {
  createItemSource,
  useDocument,
  type EnhancedTranslatableCTA,
  type TranslatableString,
  type TranslatableRichText,
  type YextComponentConfig,
  type YextEntityField,
} from "@yext/visual-editor";
import type { ImageWrapperProps } from "../../sections/ImageWrapper.tsx";
import { CollectionScope } from "./CollectionScope.tsx";
import { designFields, renderDesignFields } from "./fields.tsx";
import { designAttributes, designStyle } from "./styles.ts";
import { cardConfig, structuralComponents } from "./containers.tsx";
import {
  buttonConfig,
  constantText,
  headingConfig,
  imageConfig,
  richTextConfig,
} from "./content.tsx";
import type { DesignProps } from "./styleSchema.ts";

type Item = {
  title: YextEntityField<TranslatableString>;
  body: YextEntityField<TranslatableRichText>;
  image: ImageWrapperProps["data"]["image"];
  cta: YextEntityField<EnhancedTranslatableCTA>;
  eyebrow: YextEntityField<TranslatableString>;
  value: YextEntityField<TranslatableString>;
};

export const collectionSource = createItemSource<Item>({
  label: "Items",
  mappingFields: {
    title: {
      type: "entityField",
      label: "Title",
      filter: { types: ["type.string"] },
    },
    body: {
      type: "entityField",
      label: "Body",
      filter: { types: ["type.rich_text_v2", "type.string"] },
    },
    image: {
      type: "entityField",
      label: "Image",
      filter: { types: ["type.image"] },
    },
    cta: {
      type: "entityField",
      label: "Call to action",
      filter: { types: ["type.cta"] },
    },
    eyebrow: {
      type: "entityField",
      label: "Eyebrow",
      filter: { types: ["type.string"] },
    },
    value: {
      type: "entityField",
      label: "Supporting text",
      filter: { types: ["type.string", "type.decimal"] },
    },
  },
  defaultValues: ["First item", "Second item", "Third item"].map((title) => ({
    title: constantText(title),
    body: { ...richTextConfig.defaultProps!.data.text },
    image: imageConfig.defaultProps!.data.image,
    cta: buttonConfig.defaultProps!.cta,
    eyebrow: constantText(""),
    value: constantText(""),
  })),
});

export type CollectionProps = DesignProps & {
  items: typeof collectionSource.value;
  template: Slot;
  previewIndex: number;
  as: "div" | "ul" | "ol";
};

export const collectionConfig: YextComponentConfig<CollectionProps> = {
  label: "Collection",
  inline: true,
  fields: {
    items: collectionSource.field,
    template: { type: "slot", visible: false, disallow: structuralComponents },
    previewIndex: {
      type: "number",
      label: "Preview item (starts at 1)",
      min: 1,
    },
    as: {
      type: "select",
      label: "Collection HTML element",
      options: [
        { label: "Grid / group", value: "div" },
        { label: "Unordered list", value: "ul" },
        { label: "Ordered list", value: "ol" },
      ],
    },
    ...designFields,
  },
  renderFields: ({ fields }) =>
    renderDesignFields({
      fields: {
        templateInstructions: (
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>
            Choose a list in Items, then map its fields below. Design the single
            card on the canvas; its content, layout, and styling repeat for
            every item. Its children use Collection item fields as their content
            sources. Preview item changes the record shown here. The page
            preview shows the whole collection.
          </p>
        ),
        ...fields,
      },
    }),
  defaultProps: {
    items: collectionSource.defaultValue,
    previewIndex: 1,
    as: "div",
    layout: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
      gap: "var(--space-8, 2rem)",
    },
    spacing: {
      paddingInlineStart: "0",
      marginBlockStart: "0",
      marginBlockEnd: "0",
    },
    template: [
      {
        type: "Card",
        props: {
          ...cardConfig.defaultProps,
          content: [
            {
              type: "Image",
              props: { ...imageConfig.defaultProps, binding: "image" },
            },
            {
              type: "Heading",
              props: {
                ...headingConfig.defaultProps,
                as: "h3",
                binding: "title",
              },
            },
            {
              type: "RichText",
              props: { ...richTextConfig.defaultProps, binding: "body" },
            },
            {
              type: "Button",
              props: { ...buttonConfig.defaultProps, binding: "cta" },
            },
          ],
        },
      },
    ],
  },
  render: function Collection({
    items,
    template: Template,
    previewIndex,
    as,
    puck,
    ...design
  }) {
    const document = useDocument();
    const records = collectionSource.resolveItems(items, document);
    const selectedIndex = Math.max(
      0,
      Math.min(records.length - 1, (previewIndex || 1) - 1)
    );
    const visibleRecords = puck.isEditing
      ? [records[selectedIndex] ?? {}]
      : records;
    if (!visibleRecords.length) return <></>;
    const Tag = as === "ul" || as === "ol" ? as : "div";
    return (
      <Tag
        ref={puck.dragRef}
        className="components sl-atom"
        role={Tag === "div" ? undefined : "list"}
        {...designAttributes(design.attributes)}
        style={designStyle(design, puck.isEditing)}
      >
        {visibleRecords.map((item, index) => (
          <CollectionScope.Provider
            key={index}
            value={{ item, index: puck.isEditing ? selectedIndex : index }}
          >
            {Template({
              as: Tag === "div" ? "div" : "li",
              className: "sl-collection-item",
              disallow: structuralComponents,
            })}
          </CollectionScope.Provider>
        ))}
      </Tag>
    );
  },
};
