import * as React from "react";
import { designIcons as icons } from "./icons.ts";
import type { Slot } from "@puckeditor/core";
import {
  resolveComponentData,
  useDocument,
  type TranslatableString,
  type YextEntityField,
  type YextComponentConfig,
} from "@yext/visual-editor";
import { useTranslation } from "react-i18next";
import { designFields, renderDesignFields } from "./fields.tsx";
import { DesignElement } from "./DesignElement.tsx";
import type { DesignProps } from "./styleSchema.ts";
import {
  itemBindingField,
  useItemValue,
  type ItemBinding,
} from "./CollectionScope.tsx";
import { constantText } from "./content.tsx";
import { structuralComponents } from "./containers.tsx";

export const dividerConfig: YextComponentConfig<DesignProps> = {
  label: "Divider",
  fields: designFields,
  renderFields: renderDesignFields,
  inline: true,
  defaultProps: {
    layout: { width: "100%" },
    spacing: { marginBlockStart: "0", marginBlockEnd: "0" },
    surface: {
      borderWidth: "1px 0 0",
      borderStyle: "solid",
      borderColor: "var(--ve-color-border)",
    },
  },
  render: ({ puck, ...design }) => (
    <DesignElement
      elementRef={puck.dragRef}
      as="hr"
      aria-label={
        design.attributes?.ariaLabel || (puck.isEditing ? "Divider" : undefined)
      }
      design={design}
      isEditing={puck.isEditing}
    />
  ),
};

export const spacerConfig: YextComponentConfig<DesignProps> = {
  label: "Spacer",
  fields: designFields,
  renderFields: renderDesignFields,
  inline: true,
  defaultProps: { layout: { height: "var(--space-8, 2rem)", width: "100%" } },
  render: ({ puck, ...design }) => (
    <DesignElement
      elementRef={puck.dragRef}
      design={design}
      isEditing={puck.isEditing}
      aria-hidden={puck.isEditing ? undefined : true}
      aria-label={
        design.attributes?.ariaLabel || (puck.isEditing ? "Spacer" : undefined)
      }
    />
  ),
};

export type IconProps = DesignProps & {
  icon: keyof typeof icons;
  decorative: boolean;
};

export const iconConfig: YextComponentConfig<IconProps> = {
  label: "Icon",
  fields: {
    icon: {
      type: "select",
      label: "Icon",
      options: Object.keys(icons).map((value) => ({
        label: value.replace(/([a-z])([A-Z])/g, "$1 $2"),
        value,
      })),
    },
    decorative: {
      type: "radio",
      label: "Icon purpose",
      options: [
        { label: "Decorative", value: true },
        { label: "Meaningful (set an accessible name)", value: false },
      ],
    },
    ...designFields,
  },
  renderFields: renderDesignFields,
  inline: true,
  defaultProps: {
    icon: "CheckCircle",
    decorative: true,
    layout: { width: "1.5rem", height: "1.5rem", display: "inline-flex" },
    typography: { color: "var(--ve-color-primary-solid)" },
  },
  render: ({ icon, decorative, puck, ...design }) => {
    const Icon = icons[icon] ?? icons.CheckCircle;
    return (
      <DesignElement
        elementRef={puck.dragRef}
        as="span"
        design={design}
        isEditing={puck.isEditing}
        aria-hidden={decorative && !puck.isEditing ? true : undefined}
        aria-label={
          design.attributes?.ariaLabel ||
          (puck.isEditing ? `${icon} icon` : undefined)
        }
        role={decorative ? undefined : "img"}
      >
        <Icon width="100%" height="100%" aria-hidden="true" focusable="false" />
      </DesignElement>
    );
  },
};

export type DisclosureProps = DesignProps & {
  binding?: ItemBinding;
  summary: YextEntityField<TranslatableString>;
  content: Slot;
  initiallyOpen: boolean;
};

export const disclosureConfig: YextComponentConfig<DisclosureProps> = {
  label: "Disclosure / accordion item",
  fields: {
    binding: itemBindingField(["title"]),
    summary: {
      type: "entityField",
      label: "Summary",
      filter: { types: ["type.string"] },
    },
    content: { type: "slot", visible: false, disallow: structuralComponents },
    initiallyOpen: {
      type: "radio",
      label: "Initially expanded",
      options: [
        { label: "No", value: false },
        { label: "Yes", value: true },
      ],
    },
    ...designFields,
  },
  renderFields: renderDesignFields,
  inline: true,
  defaultProps: {
    summary: constantText("Your question"),
    initiallyOpen: false,
    content: [],
    spacing: { paddingBlockStart: "1rem", paddingBlockEnd: "1rem" },
    surface: {
      borderWidth: "0 0 1px",
      borderStyle: "solid",
      borderColor: "var(--ve-color-border)",
    },
  },
  render: function Disclosure({
    summary,
    binding,
    content: Content,
    initiallyOpen,
    puck,
    ...design
  }) {
    const document = useDocument();
    const { i18n } = useTranslation();
    const text = resolveComponentData(
      useItemValue(binding, summary),
      i18n.language,
      document,
      {
        output: "plainText",
      }
    );
    return (
      <DesignElement
        elementRef={puck.dragRef}
        as="details"
        design={design}
        isEditing={puck.isEditing}
        {...{ open: puck.isEditing || initiallyOpen || undefined }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 600,
            minHeight: 44,
            paddingBlock: "0.5rem",
          }}
        >
          {text || "Your question"}
        </summary>
        {Content({
          style: { paddingBlockStart: "1rem" },
          disallow: structuralComponents,
        })}
      </DesignElement>
    );
  },
};
