import * as React from "react";
import { FieldGroup, FieldTab } from "@puckeditor/core";
import type { YextFieldDefinition, YextFields } from "@yext/visual-editor";
import {
  styleSchema,
  styleGroupLabels,
  type DesignProps,
  type StyleGroup,
} from "./styleSchema.ts";
import {
  DesignNotice,
  ContentStyleHint,
  DesignPanel,
  StyleGroupEditor,
} from "./StyleControls.tsx";
import { z } from "zod";

export function styleGroupField(
  group: StyleGroup,
  override = false
): YextFieldDefinition {
  return {
    type: "custom",
    label: styleGroupLabels[group],
    generation: {
      required: false,
      schema: z
        .object(
          Object.fromEntries(
            Object.keys(styleSchema[group]).map((property) => [
              property,
              z.string().optional(),
            ])
          )
        )
        .optional(),
    },
    render: ({ value, onChange, readOnly, id }) => (
      <StyleGroupEditor
        group={group}
        fieldId={id}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        override={override}
      />
    ),
  };
}

const groupFields = Object.fromEntries(
  (Object.keys(styleSchema) as StyleGroup[]).map((group) => [
    group,
    styleGroupField(group),
  ])
);
const overrideField = (label: string): YextFieldDefinition => ({
  type: "object",
  label,
  collapsible: true,
  defaultExpanded: false,
  variant: "flush",
  objectFields: Object.fromEntries(
    (Object.keys(styleSchema) as StyleGroup[]).map((group) => [
      group,
      styleGroupField(group, true),
    ])
  ),
  generation: { required: false },
});

export const designFields: YextFields<DesignProps> = {
  ...groupFields,
  responsive: {
    generation: { required: false },
    type: "object",
    label: "Responsive overrides",
    variant: "flush",
    objectFields: {
      tablet: overrideField("Tablet · 768–1023px · inherits Design"),
      mobile: overrideField("Mobile · below 768px"),
    },
  },
  states: {
    generation: { required: false },
    type: "object",
    label: "Interaction states",
    collapsible: true,
    defaultExpanded: false,
    variant: "flush",
    objectFields: {
      hover: overrideField("Hover · pointer devices"),
      focusVisible: overrideField("Keyboard focus"),
    },
  },
  attributes: {
    generation: { required: false },
    type: "object",
    label: "HTML attributes",
    variant: "flush",
    objectFields: {
      htmlId: {
        type: "text",
        generation: { required: false },
        label: "Anchor ID (unique on the page)",
      },
      ariaLabel: {
        type: "text",
        generation: { required: false },
        label: "Accessible name (when needed)",
      },
      title: {
        type: "text",
        generation: { required: false },
        label: "Advisory title",
      },
      language: {
        type: "text",
        generation: { required: false },
        label: "Language code (inherits page language)",
      },
      direction: {
        type: "select",
        generation: { required: false },
        label: "Reading direction",
        options: [
          { label: "Inherit", value: "" },
          { label: "Left to right", value: "ltr" },
          { label: "Right to left", value: "rtl" },
        ],
      },
    },
  },
};

const appearanceKeys = new Set([
  "styles",
  "ctaStyles",
  "surfaceRole",
  "typographyRole",
  "interactionRole",
]);
const accessibilityKeys = new Set(["as", "decorative", "altText", "loading"]);
const designKeys = new Set(Object.keys(designFields));

/** Puck renders the actual field nodes, so mapping, validation, and read-only state survive. */
export const renderDesignFields = ({
  fields,
}: {
  fields: Record<string, React.ReactNode>;
}) => (
  <>
    <FieldTab label="Content">
      <FieldGroup label="Content" collapsible={false}>
        <ContentStyleHint />
        {Object.entries(fields)
          .filter(
            ([key]) =>
              !designKeys.has(key) &&
              !appearanceKeys.has(key) &&
              !accessibilityKeys.has(key)
          )
          .map(([key, field]) => (
            <React.Fragment key={key}>{field}</React.Fragment>
          ))}
      </FieldGroup>
    </FieldTab>
    <FieldTab label="Design">
      <DesignNotice />
      <DesignPanel fields={fields} />
    </FieldTab>
    <FieldTab label="Responsive">
      <p style={{ fontSize: 13, lineHeight: 1.5 }}>
        Design is the default for every screen. Set exceptions here for tablet
        or mobile only. Clear an exception to use Design again.
      </p>
      {fields.responsive}
    </FieldTab>
    <FieldTab label="Accessibility">
      {fields.as}
      {fields.decorative}
      {fields.altText}
      {fields.loading}
      {fields.attributes}
    </FieldTab>
  </>
);
