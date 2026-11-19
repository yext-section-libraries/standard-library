import {
  InspectorFieldScope,
  useInspectorDisclosure,
} from "./inspectorState.tsx";
import { ControlPreview, type PreviewAxis } from "./ControlPreview.tsx";
import { CustomStyleValue } from "./CustomStyleValue.tsx";
import {
  automaticTypographyValue,
  controlCopy,
  preciseChoices,
  detailGroups,
  focalPoints,
} from "./controlContent.ts";
import {
  styleCapabilities,
  supportsStyleProperty,
} from "./styleCapabilities.ts";
import * as React from "react";
import { FieldGroup, createUsePuck, useGetPuck } from "@puckeditor/core";
import {
  styleSchema,
  styleGroupLabels,
  themeSectionSpacing,
  valueSuggestions,
  type StyleGroup,
} from "./styleSchema.ts";
import { safeCssValue } from "./styles.ts";
import {
  themeTypographyProperties,
  typographyPresetValue,
  typographyStyleOptions,
} from "./theme.ts";
import "./designControls.css";

const usePuck = createUsePuck();

type Values = Record<string, string>;
type Choice = [string, string];
const friendly: Record<string, string> = {
  "": "Default",
  block: "Flow",
  flex: "Row or stack",
  grid: "Columns",
  "inline-flex": "Inline row",
  "inline-block": "Inline block",
  none: "None",
  row: "Row",
  column: "Stack",
  "row-reverse": "Reverse row",
  "column-reverse": "Reverse stack",
  nowrap: "Keep on one line",
  wrap: "Wrap",
  start: "Start",
  end: "End",
  center: "Center",
  stretch: "Stretch",
  baseline: "Text baseline",
  "space-between": "Space between",
  "space-around": "Space around",
  "space-evenly": "Even spacing",
  normal: "Normal",
  auto: "Automatic",
  relative: "Relative",
  absolute: "Absolute",
  sticky: "Sticky",
  fixed: "Fixed",
  static: "Normal flow",
  cover: "Fill & crop",
  contain: "Show whole image",
  fill: "Stretch image",
  "scale-down": "Shrink to fit",
  solid: "Solid",
  dashed: "Dashed",
  dotted: "Dotted",
  visible: "Visible",
  hidden: "Hidden",
  clip: "Clip",
  uppercase: "UPPERCASE",
  lowercase: "lowercase",
  capitalize: "Title case",
  italic: "Italic",
  underline: "Underline",
  "line-through": "Strikethrough",
  justify: "Justify",
  balance: "Balanced lines",
  pretty: "Avoid short last lines",
  pointer: "Pointer",
};
const radiusChoices: Choice[] = [
  ["Square", "0"],
  ["Soft", "0.5rem"],
  ["Round", "1rem"],
  ["Pill", "9999px"],
];
const themePageStyleLabels: Record<string, string> = {
  "var(--ve-image-border-radius)": "Theme image radius",
  "var(--ve-card-border-radius)": "Theme card radius",
  "var(--ve-card-border-width)": "Theme card border weight",
};
const spaceChoices: Choice[] = valueSuggestions.space.filter(([name]) =>
  ["None", "Extra small", "Small", "Medium", "Large"].includes(name)
);

function Choices({
  label,
  value,
  onChange,
  choices,
  property,
  allowCustom = true,
  axis,
  showHelp = false,
  emptyLabel = "Default",
  emptyValue = "",
  defaultDescription = "Uses the element's normal style. Choose a value to override it.",
  defaultPreviewValue,
  allowDefault = true,
  mixed = false,
  resetLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  choices: Choice[];
  property: string;
  allowCustom?: boolean;
  axis?: PreviewAxis;
  showHelp?: boolean;
  emptyLabel?: string;
  emptyValue?: string;
  defaultDescription?: string;
  defaultPreviewValue?: string;
  allowDefault?: boolean;
  mixed?: boolean;
  resetLabel?: string;
}) {
  const [custom, setCustom] = useInspectorDisclosure(`${property}:custom`);
  const inputId = React.useId();
  const options: Choice[] =
    allowDefault && !choices.some(([, candidate]) => candidate === emptyValue)
      ? [[emptyLabel, emptyValue], ...choices]
      : choices;
  const selectedValue = mixed ? undefined : value || emptyValue;
  const known = options.some(([, candidate]) => candidate === value);
  const showCustom = allowCustom && custom;
  const customValue = !mixed && !!value && !known;
  const customLink = new Set([
    "display",
    "flexDirection",
    "flexWrap",
    "alignItems",
    "justifyContent",
    "alignSelf",
    "gridAutoFlow",
    "textAlign",
    "textTransform",
    "fontStyle",
    "textDecoration",
    "textWrap",
    "whiteSpace",
    "backgroundSize",
    "backgroundPosition",
    "backgroundRepeat",
    "objectFit",
    "objectPosition",
    "cursor",
    "position",
  ]).has(property);
  const cssProperty = property.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`
  );
  const invalid =
    !!value &&
    (!safeCssValue(value) ||
      (typeof CSS !== "undefined" &&
        property !== "arrangement" &&
        !CSS.supports(cssProperty, value)));
  return (
    <div className="sl-control">
      <div className="sl-control-heading">
        <span id={`${inputId}-label`}>{label}</span>
        <div className="sl-control-actions">
          {resetLabel && value && (
            <button
              type="button"
              className="sl-custom-link"
              onClick={() => onChange("")}
            >
              {resetLabel}
            </button>
          )}
          {allowCustom && customLink && (
            <button
              type="button"
              className="sl-custom-link"
              aria-label={`${label}: Custom value`}
              aria-pressed={customValue}
              aria-expanded={showCustom}
              onClick={() => setCustom(!custom)}
            >
              <span aria-hidden="true">
                <ControlPreview property="custom" value="" />
              </span>
              Custom
            </button>
          )}
          {mixed && (
            <span className="sl-default-note">Different on each side</span>
          )}
        </div>
      </div>
      {showHelp && controlCopy[property]?.help && (
        <p className="sl-control-help">{controlCopy[property].help}</p>
      )}
      <div
        data-choice-property={property}
        className={`sl-choices ${["textAlign", "fontWeight", "fontFamily"].includes(property) ? "sl-choices-compact" : /^(gap|rowGap|columnGap|padding.*|margin.*|letterSpacing|opacity|borderWidth)$/.test(property) ? "sl-choices-scale" : ""} ${["objectPosition", "backgroundPosition"].includes(property) ? "sl-choices-focal" : ""}`}
        role="group"
        aria-labelledby={`${inputId}-label`}
      >
        {options.map(([name, candidate]) => (
          <button
            key={candidate}
            type="button"
            className={`sl-choice${candidate === emptyValue ? " sl-default-choice" : ""}`}
            aria-label={`${label}: ${name}`}
            title={candidate === emptyValue ? defaultDescription : undefined}
            aria-pressed={selectedValue === candidate}
            onClick={() => {
              onChange(candidate);
            }}
          >
            <span className="sl-choice-preview" aria-hidden="true">
              <ControlPreview
                property={
                  candidate === automaticTypographyValue(cssProperty) ||
                  (candidate === emptyValue &&
                    !defaultPreviewValue &&
                    candidate !== "inherit")
                    ? "default"
                    : property
                }
                value={
                  candidate === emptyValue
                    ? (defaultPreviewValue ?? candidate)
                    : candidate
                }
                axis={axis}
              />
            </span>
            <span>{name}</span>
            {selectedValue === candidate && (
              <span className="sl-selected-mark" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        ))}
        {allowCustom && !customLink && (
          <button
            type="button"
            className="sl-choice sl-custom-choice"
            aria-label={`${label}: Custom value`}
            aria-pressed={customValue}
            aria-expanded={showCustom}
            onClick={() => setCustom(!custom)}
          >
            <span className="sl-choice-preview" aria-hidden="true">
              <ControlPreview
                property={customValue ? property : "custom"}
                value={customValue ? value : ""}
                axis={axis}
              />
            </span>
            Custom…
          </button>
        )}
      </div>
      {allowDefault && (
        <p
          className="sl-control-help sl-default-explanation"
          aria-hidden={selectedValue !== emptyValue}
        >
          {defaultDescription}
        </p>
      )}
      {showCustom && (
        <CustomStyleValue
          property={property}
          label={label}
          value={value}
          onChange={onChange}
          inputId={inputId}
          invalid={invalid}
          preferCss={customLink}
        />
      )}
    </div>
  );
}

export function StyleValue({
  property,
  group,
  value = "",
  onChange,
  choices,
  label,
  inheritedValue,
  axis,
  detailed = false,
  override = false,
  themeValue,
  interactionPreset = false,
}: {
  property: string;
  group: StyleGroup;
  value?: string;
  onChange: (value: string) => void;
  choices?: Choice[];
  label?: string;
  inheritedValue?: string;
  axis?: PreviewAxis;
  detailed?: boolean;
  override?: boolean;
  themeValue?: string;
  interactionPreset?: boolean;
}) {
  const definition = (styleSchema[group] as Record<string, readonly string[]>)[
    property
  ];
  const [defaultLabel, kind, ...options] = definition;
  const textColor = property === "color";
  const themeTypography = themeTypographyProperties[property];
  const automaticProperty = textColor ? "color" : themeTypography;
  const usesInteractionDefault =
    interactionPreset &&
    (automaticProperty ||
      [
        "textDecoration",
        "backgroundColor",
        "borderColor",
        "borderRadius",
        "borderStyle",
        "borderWidth",
      ].includes(property));
  const baseBackgroundColor =
    property === "backgroundColor" && !override && !interactionPreset;
  const parentTypography =
    group === "typography" &&
    property !== "textDecoration" &&
    !automaticProperty;
  const presets =
    choices ??
    preciseChoices[property] ??
    (property === "borderRadius"
      ? radiusChoices
      : kind === ""
        ? options.map(
            (option) => [friendly[option] ?? option, option] as Choice
          )
        : kind === "space"
          ? spaceChoices
          : (valueSuggestions[kind] ?? []));
  const themedPresets =
    kind !== "color" &&
    !themeTypography &&
    themeValue?.startsWith("var(") &&
    !presets.some(([, value]) => value === themeValue)
      ? [
          [themePageStyleLabels[themeValue] ?? "Theme", themeValue] as Choice,
          ...presets,
        ]
      : presets;
  const fieldChoices: Choice[] = automaticProperty
    ? [
        ["Inherit", "inherit"],
        [
          textColor && !interactionPreset ? "Automatic" : "Default",
          override ? automaticTypographyValue(automaticProperty) : "",
        ],
        ...(themeTypography
          ? typographyStyleOptions.map(({ label, value }): Choice => [
              label,
              typographyPresetValue(value, themeTypography),
            ])
          : themedPresets),
      ]
    : parentTypography
      ? [
          ["Parent", "inherit"],
          ...themedPresets.filter(([, value]) => value !== "inherit"),
        ]
      : themedPresets;
  return (
    <div className="sl-setting" data-style-property={property}>
      <Choices
        property={property}
        label={label ?? controlCopy[property]?.label ?? defaultLabel}
        value={value}
        onChange={onChange}
        choices={fieldChoices}
        axis={axis}
        showHelp={detailed}
        emptyLabel={override ? "Use Design" : "Default"}
        emptyValue={!override && parentTypography ? "inherit" : ""}
        allowDefault={!baseBackgroundColor}
        resetLabel={
          baseBackgroundColor ? "Clear background override" : undefined
        }
        defaultPreviewValue={override ? inheritedValue : undefined}
        defaultDescription={
          override
            ? `Uses Design${inheritedValue ? `: ${presets.find(([, candidate]) => candidate === inheritedValue)?.[0] ?? inheritedValue}` : " for this setting"}.`
            : usesInteractionDefault
              ? "Uses this setting from the selected interaction style."
              : textColor
                ? "Uses the component’s normal text color."
                : themeTypography
                  ? "Uses this setting from the selected Typography Style or the component’s usual style."
                  : parentTypography
                    ? "Matches the surrounding text style."
                    : "Uses the element's normal style. Choose a value to override it."
        }
      />
    </div>
  );
}

const paddingKeys = [
  "paddingBlockStart",
  "paddingInlineEnd",
  "paddingBlockEnd",
  "paddingInlineStart",
];
const marginKeys = [
  "marginBlockStart",
  "marginInlineEnd",
  "marginBlockEnd",
  "marginInlineStart",
];
function SpacingControl({
  label,
  description,
  keys,
  value,
  onChange,
  override = false,
}: {
  label: string;
  description: string;
  override?: boolean;
  keys: string[];
  value: Values;
  onChange: (value: Values) => void;
}) {
  const [individual, setIndividual] = useInspectorDisclosure(
    `${keys[0]}:sides`
  );
  const values = keys.map((key) => value[key] ?? "");
  const blockKeys = keys.filter((key) => key.includes("Block"));
  const sectionSpacing = blockKeys.every(
    (key) => value[key] === themeSectionSpacing[1]
  );
  const mixed = values.some((candidate) => candidate !== values[0]);
  return (
    <div className="sl-spacing-control">
      <p className="sl-help">{description}</p>
      <Choices
        property={keys[0].startsWith("padding") ? "padding" : "margin"}
        label={label}
        value={sectionSpacing ? themeSectionSpacing[1] : mixed ? "" : values[0]}
        choices={[...spaceChoices, themeSectionSpacing]}
        mixed={mixed && !sectionSpacing}
        emptyLabel={override ? "Use Design" : "Default"}
        defaultDescription={
          override
            ? "Uses the spacing from Design."
            : "Removes local spacing values and uses the element's normal spacing."
        }
        onChange={(next) => {
          const updatedKeys =
            next === themeSectionSpacing[1] || (next === "" && sectionSpacing)
              ? blockKeys
              : keys;
          onChange({
            ...value,
            ...Object.fromEntries(updatedKeys.map((key) => [key, next])),
          });
        }}
      />
      <button
        type="button"
        className="sl-sides-toggle"
        aria-expanded={individual}
        onClick={() => setIndividual(!individual)}
      >
        {individual ? "−" : "+"} Set individual sides
        {mixed ? " · Mixed values" : ""}
      </button>
      {individual && (
        <div className="sl-side-grid">
          {keys.map((key, index) => (
            <div key={key} className={`sl-side-${index}`}>
              <StyleValue
                group="spacing"
                property={key}
                label={["Top", "Right / end", "Bottom", "Left / start"][index]}
                value={value[key]}
                choices={
                  blockKeys.includes(key)
                    ? [...spaceChoices, themeSectionSpacing]
                    : spaceChoices
                }
                override={override}
                detailed
                onChange={(next) => onChange({ ...value, [key]: next })}
              />
            </div>
          ))}
          <div className="sl-space-center" aria-hidden="true">
            Content
          </div>
        </div>
      )}
    </div>
  );
}

export function StyleGroupEditor({
  group,
  value = {},
  onChange,
  readOnly = false,
  override = false,
  fieldId,
}: {
  fieldId?: string;
  group: StyleGroup;
  value?: Values;
  onChange: (value: Values) => void;
  readOnly?: boolean;
  override?: boolean;
}) {
  const selected = usePuck((state) => state.selectedItem);
  const getPuck = useGetPuck();
  const selectedType = selected?.type ?? "";
  const scope =
    fieldId ??
    `${selected?.props.id ?? "root"}:${group}:${override ? "override" : "base"}`;
  const [fineTuneOpen, setFineTuneOpen] = useInspectorDisclosure(
    `${scope}:fine-tune`
  );
  const inherited: Values = override ? (selected?.props[group] ?? {}) : {};
  const effective = {
    ...inherited,
    ...Object.fromEntries(Object.entries(value).filter(([, entry]) => entry)),
  };
  const container = styleCapabilities(selectedType).container;
  const parent = usePuck((state) =>
    state.selectedItem
      ? state.getParentById(state.selectedItem.props.id)
      : undefined
  );
  const itemPlacement = usePuck(
    (state) =>
      state.config.components[state.selectedItem?.type ?? ""]?.inline === true
  );
  const viewport = usePuck(
    (state) => state.appState.ui.viewports.current.width
  );
  const screen =
    typeof viewport === "number"
      ? viewport < 768
        ? "mobile"
        : viewport < 1024
          ? "tablet"
          : undefined
      : undefined;
  const parentDisplay =
    !itemPlacement || parent?.type === "Collection"
      ? "block"
      : parent?.props.responsive?.[screen ?? ""]?.layout?.display ||
        parent?.props.layout?.display ||
        "block";
  const parentDirection =
    parent?.props.responsive?.[screen ?? ""]?.layout?.flexDirection ||
    parent?.props.layout?.flexDirection;
  const ownDisplay =
    (group === "layout" ? effective.display : undefined) ||
    selected?.props.layout?.display ||
    (selected?.props.as === "span" ? "inline" : "block");
  const profile = styleCapabilities(selectedType);
  const interactionRole = selected?.props.interactionRole ?? "primary-button";
  const themedBorder =
    profile.button &&
    (interactionRole === "primary-button" ||
      interactionRole === "secondary-button");
  const context = {
    type: selectedType,
    display: ownDisplay,
    parentDisplay,
    position:
      (group === "position" ? effective.position : undefined) ||
      selected?.props.position?.position ||
      "static",
    inlineText:
      profile.text &&
      !profile.container &&
      ownDisplay === "inline" &&
      !parentDisplay.includes("flex") &&
      !parentDisplay.includes("grid"),
  };
  const supported = (property: string) =>
    supportsStyleProperty(group, property, context);
  const primary = new Set<string>();
  const field = (
    property: string,
    choices?: Choice[],
    label?: string,
    detailed = false
  ) => {
    if (!supported(property)) return null;
    if (property === "display" && !container)
      choices = [
        ["Block", "block"],
        ["Inline", "inline"],
        ["Inline block", "inline-block"],
        ["Hidden", "none"],
      ];
    if (property === "textAlign" && profile.button)
      label = "Wrapped label alignment";
    primary.add(property);
    return (
      <StyleValue
        key={property}
        property={property}
        group={group}
        value={value[property]}
        label={label}
        inheritedValue={inherited[property]}
        choices={choices}
        detailed={detailed}
        override={override}
        interactionPreset={profile.button}
        themeValue={
          getPuck().config.components[selectedType]?.defaultProps?.[group]?.[
            property
          ]
        }
        axis={
          property === "alignItems"
            ? effective.flexDirection?.includes("column")
              ? "horizontal"
              : "vertical"
            : property === "justifyContent"
              ? effective.flexDirection?.includes("column")
                ? "vertical"
                : "horizontal"
              : property === "alignSelf"
                ? parentDirection?.includes("column")
                  ? "horizontal"
                  : "vertical"
                : undefined
        }
        onChange={(next) =>
          onChange({
            ...value,
            ...(property === "gap" ? { rowGap: "", columnGap: "" } : {}),
            ...(property === "borderWidth" &&
            next &&
            parseFloat(next) !== 0 &&
            (!effective.borderStyle || effective.borderStyle === "none")
              ? { borderStyle: "solid" }
              : {}),
            ...(property === "position" &&
            next === "sticky" &&
            ![value.insetBlockStart, value.insetBlockEnd].some(
              (offset) => offset && offset !== "auto"
            )
              ? { insetBlockStart: "0px" }
              : {}),
            [property]:
              !override &&
              group === "typography" &&
              property !== "color" &&
              !themeTypographyProperties[property] &&
              property !== "textDecoration" &&
              !next
                ? "inherit"
                : next,
          })
        }
      />
    );
  };
  const fields: React.ReactNode[] = [];
  if (group === "layout") {
    if (container) {
      const mode =
        effective.display === "grid"
          ? "grid"
          : effective.display?.includes("flex")
            ? effective.flexDirection?.includes("column")
              ? "column"
              : "row"
            : "block";
      primary.add("display");
      primary.add("flexDirection");
      fields.push(
        <Choices
          key="arrange"
          label="Arrange content"
          property="arrangement"
          value={override && !value.display && !value.flexDirection ? "" : mode}
          allowCustom={false}
          allowDefault={override}
          emptyLabel="Use Design"
          defaultPreviewValue={mode}
          defaultDescription="Uses the arrangement from Design."
          choices={[
            ["Normal", "block"],
            ["Row →", "row"],
            ["Stack ↓", "column"],
            ["Grid", "grid"],
          ]}
          onChange={(next) =>
            onChange({
              ...value,
              ...(!next ? { flexDirection: "" } : {}),
              display: next === "row" || next === "column" ? "flex" : next,
              ...(next === "row" || next === "column"
                ? { flexDirection: next }
                : {}),
            })
          }
        />
      );
      if (mode === "grid")
        fields.push(
          field("gridTemplateColumns", valueSuggestions.columns, "Columns")
        );
      if (mode === "row" || mode === "column") {
        fields.push(
          field(
            "alignItems",
            [
              [mode === "row" ? "Top" : "Left", "start"],
              [mode === "row" ? "Middle" : "Center", "center"],
              [mode === "row" ? "Bottom" : "Right", "end"],
              ["Stretch", "stretch"],
            ],
            mode === "row" ? "Vertical alignment" : "Horizontal alignment"
          )
        );
        fields.push(
          field(
            "justifyContent",
            [
              [mode === "row" ? "Left" : "Top", "start"],
              [mode === "row" ? "Center" : "Middle", "center"],
              [mode === "row" ? "Right" : "Bottom", "end"],
              ["Spread out", "space-between"],
            ],
            mode === "row" ? "Space across the row" : "Space down the stack"
          )
        );
        fields.push(
          <label key="reverse" className="sl-switch">
            <input
              type="checkbox"
              checked={effective.flexDirection?.endsWith("-reverse") ?? false}
              onChange={(event) =>
                onChange({
                  ...value,
                  flexDirection: `${mode}${event.target.checked ? "-reverse" : ""}`,
                })
              }
            />
            <span aria-hidden="true">
              <ControlPreview
                property="flexDirection"
                value={`${mode}-reverse`}
              />
            </span>
            Reverse visual order
          </label>
        );
        primary.add("flexWrap");
        fields.push(
          override ? (
            field(
              "flexWrap",
              [
                ["Wrap", "wrap"],
                ["Keep on one line", "nowrap"],
              ],
              "When items run out of room"
            )
          ) : (
            <label key="wrap" className="sl-switch">
              <input
                type="checkbox"
                checked={effective.flexWrap === "wrap"}
                onChange={(e) =>
                  onChange({
                    ...value,
                    flexWrap: e.target.checked ? "wrap" : "nowrap",
                  })
                }
              />
              <span aria-hidden="true">
                <ControlPreview
                  property="flexWrap"
                  value={effective.flexWrap || "nowrap"}
                />
              </span>
              Wrap onto a new line when needed
            </label>
          )
        );
      }
      if (mode !== "block")
        fields.push(field("gap", spaceChoices, "Space between items"));
      if (effective.rowGap || effective.columnGap)
        fields.push(
          <p key="axis-gaps" className="sl-help">
            Rows or columns use their own spacing. Choosing a preset above makes
            their spacing match again.
          </p>
        );
    }
    if (container)
      fields.push(
        <p key="layout-help" className="sl-help">
          Alignment moves direct children within spare space. Set a minimum
          height for vertical alignment. Child widths and self-alignment can
          limit stretching.
        </p>
      );
    fields.push(
      field("width", [
        ["Auto", "auto"],
        ["Fill parent", "100%"],
        ["Fit content", "fit-content"],
      ])
    );
    fields.push(
      field(
        "maxWidth",
        [
          ["No limit", "none"],
          ["Reading width", "65ch"],
          ["Page width", "var(--ve-page-content-max-width)"],
        ],
        "Maximum width"
      )
    );
    if (container || profile.image || profile.icon || selectedType === "Spacer")
      fields.push(
        field(
          "height",
          profile.image
            ? [
                ["Natural", "auto"],
                ["Small", "160px"],
                ["Medium", "320px"],
                ["Large", "560px"],
              ]
            : profile.icon
              ? [
                  ["Small", "16px"],
                  ["Standard", "24px"],
                  ["Large", "40px"],
                ]
              : selectedType === "Spacer"
                ? spaceChoices
                : [
                    ["Auto", "auto"],
                    ["Full screen", "100svh"],
                  ]
        )
      );
    if (profile.image)
      fields.push(
        field("aspectRatio", [
          ["Natural", "auto"],
          ["Square", "1"],
          ["Landscape", "16 / 9"],
          ["Portrait", "3 / 4"],
        ])
      );
    if (profile.button) {
      fields.push(
        field(
          "justifyContent",
          [
            ["Start", "start"],
            ["Center", "center"],
            ["End", "end"],
          ],
          "Label alignment"
        )
      );
      fields.push(
        field(
          "minHeight",
          [
            ["Standard", "44px"],
            ["Comfortable", "56px"],
          ],
          "Minimum button height"
        )
      );
      if (selected?.props.icon)
        fields.push(field("gap", spaceChoices, "Space beside icon"));
    }
    if (container)
      fields.push(
        field(
          "minHeight",
          [
            ["Natural", "0"],
            ["Roomy", "160px"],
            ["Tall", "320px"],
          ],
          "Minimum height"
        )
      );
    if (parentDisplay.includes("flex") || parentDisplay.includes("grid")) {
      fields.push(
        <div key="placement" className="sl-item-placement">
          <p className="sl-help">
            Placement of this element inside its{" "}
            {parentDisplay.includes("flex") ? "flex" : "grid"} parent.
          </p>
          {field(
            "alignSelf",
            [
              ["Use parent", "auto"],
              ["Start", "start"],
              ["Center", "center"],
              ["End", "end"],
              ["Stretch", "stretch"],
            ],
            "Align this item"
          )}
          {field(
            "flexGrow",
            [
              ["Natural size", "0"],
              ["Fill spare space", "1"],
            ],
            "Grow this item"
          )}
          {field(
            "flexShrink",
            [
              ["Allow shrinking", "1"],
              ["Keep size", "0"],
            ],
            "Shrink this item"
          )}
          {field("flexBasis", undefined, "Starting size")}
          {field(
            "gridColumn",
            [
              ["Auto", "auto"],
              ["Span two", "span 2"],
              ["Full row", "1 / -1"],
            ],
            "Column placement"
          )}
          {field(
            "gridRow",
            [
              ["Auto", "auto"],
              ["Span two", "span 2"],
            ],
            "Row placement"
          )}
        </div>
      );
    }
  } else if (group === "spacing") {
    paddingKeys.forEach((key) => primary.add(key));
    marginKeys.forEach((key) => primary.add(key));
    fields.push(
      <SpacingControl
        key="padding"
        override={override}
        label="Padding"
        description="Space inside the element, between its edge and content."
        keys={paddingKeys}
        value={value}
        onChange={onChange}
      />
    );
    fields.push(
      <SpacingControl
        key="margin"
        override={override}
        label="Margin"
        description="Space outside the element, separating it from its neighbors."
        keys={marginKeys}
        value={value}
        onChange={onChange}
      />
    );
  } else if (group === "typography") {
    fields.push(
      <p key="text-help" className="sl-help">
        {container || selectedType.endsWith("Section")
          ? "Text defaults for children that inherit. Headings, buttons, and individually styled text can have their own styles."
          : profile.button
            ? "Default follows the interaction style. Inherit follows the surrounding text."
            : "Default follows the Typography Style. Inherit follows the surrounding text."}
      </p>
    );
    if (container || selectedType.endsWith("Section")) {
      const overrides: { type: string; props: Record<string, any> }[] = [];
      const inspect = (nodes: unknown) => {
        if (!Array.isArray(nodes)) return;
        for (const node of nodes) {
          if (!node?.props) continue;
          if (
            Object.values(node.props.typography ?? {}).some(
              (value) => value && value !== "inherit"
            )
          )
            overrides.push(node);
          inspect(node.props.content);
        }
      };
      inspect(selected?.props.content);
      if (overrides.length)
        fields.push(
          <div key="child-overrides" className="sl-child-overrides">
            <p className="sl-help">
              {overrides.length}{" "}
              {overrides.length === 1
                ? "child keeps its"
                : "children keep their"}{" "}
              own text styles. Select one to review its overrides.
            </p>
            {overrides.slice(0, 4).map((child) => (
              <button
                key={child.props.id}
                type="button"
                className="sl-sides-toggle"
                onClick={() => {
                  const puck = getPuck();
                  const itemSelector = puck.getSelectorForId(child.props.id);
                  if (itemSelector)
                    puck.dispatch({ type: "setUi", ui: { itemSelector } });
                }}
              >
                <span aria-hidden="true">
                  <ControlPreview property="cursor" value="auto" />
                </span>
                Review {child.type.replace(/([a-z])([A-Z])/g, "$1 $2")}
              </button>
            ))}
          </div>
        );
    }
    if (profile.text && !container && !selectedType.endsWith("Section"))
      fields.push(
        <button
          key="inherit-text"
          type="button"
          className="sl-sides-toggle"
          onClick={() =>
            onChange({
              ...value,
              ...Object.fromEntries(
                Object.keys(styleSchema.typography)
                  .filter((property) => property !== "textDecoration")
                  .map((property) => [property, "inherit"])
              ),
            })
          }
        >
          <span aria-hidden="true">
            <ControlPreview property="fontFamily" value="inherit" />
          </span>
          Use parent text style
        </button>
      );
    fields.push(
      field("fontFamily"),
      field("fontSize"),
      field("fontWeight"),
      !profile.button &&
        field("textAlign", [
          ["Start", "start"],
          ["Center", "center"],
          ["End", "end"],
          ["Justify", "justify"],
        ]),
      field("color"),
      profile.button && field("textDecoration")
    );
  } else if (group === "surface") {
    if (profile.image) {
      fields.push(
        field(
          "objectFit",
          [
            ["Fill & crop", "cover"],
            ["Whole image", "contain"],
            ["Natural size", "scale-down"],
          ],
          "Image fit"
        ),
        field("objectPosition", focalPoints, "Keep this part in view"),
        field("borderRadius")
      );
    } else {
      fields.push(
        field("backgroundColor"),
        field("borderRadius"),
        field("boxShadow")
      );
      fields.push(
        field(
          "borderStyle",
          [
            ["None", "none"],
            ["Solid", "solid"],
            ["Dashed", "dashed"],
          ],
          "Border"
        )
      );
      if (
        effective.borderStyle !== "none" &&
        (effective.borderStyle || themedBorder)
      )
        fields.push(field("borderWidth"), field("borderColor"));
    }
  }
  const advanced = Object.keys(styleSchema[group]).filter(
    (property) => supported(property) && !primary.has(property)
  );
  const renderDetails = () => {
    const used = new Set<string>();
    const sections = detailGroups[group].flatMap((section) => {
      const properties = section.properties.filter((property) =>
        advanced.includes(property)
      );
      if (!properties.length) return [];
      properties.forEach((property) => used.add(property));
      return [
        <fieldset key={section.title} className="sl-detail-group">
          <legend>
            {section.title === "Grid details" && ownDisplay !== "grid"
              ? "Item spacing and alignment"
              : section.title}
          </legend>
          <p className="sl-help">
            {section.title === "Grid details" && ownDisplay !== "grid"
              ? "Set separate spacing between rows and columns, or adjust how items line up."
              : section.help}
          </p>
          <div className="sl-detail-fields">
            {properties.map((property) =>
              field(property, undefined, undefined, true)
            )}
          </div>
        </fieldset>,
      ];
    });
    const remaining = advanced.filter((property) => !used.has(property));
    if (remaining.length)
      sections.push(
        <fieldset key="other" className="sl-detail-group">
          <legend>Other adjustments</legend>
          <div className="sl-detail-fields">
            {remaining.map((property) =>
              field(property, undefined, undefined, true)
            )}
          </div>
        </fieldset>
      );
    return sections;
  };
  if (!Object.keys(styleSchema[group]).some(supported)) return null;
  return (
    <InspectorFieldScope.Provider value={scope}>
      <FieldGroup
        id={`sl:${scope}`}
        label={
          group === "typography" &&
          (container || selectedType.endsWith("Section"))
            ? "Text defaults for children"
            : group === "typography" && profile.icon
              ? "Icon color"
              : styleGroupLabels[group]
        }
        collapsible
        defaultExpanded={
          !override &&
          group ===
            (container
              ? "layout"
              : selectedType.includes("Image") ||
                  selectedType.includes("Button")
                ? "surface"
                : "typography")
        }
      >
        <fieldset disabled={readOnly} className="sl-controls">
          {fields}
          {advanced.length > 0 &&
            (group === "position" ? (
              <div className="sl-advanced-content">{renderDetails()}</div>
            ) : (
              <details
                className="sl-advanced"
                open={fineTuneOpen}
                onToggle={(event) => {
                  if (event.currentTarget.open !== fineTuneOpen)
                    setFineTuneOpen(event.currentTarget.open);
                }}
              >
                <summary>
                  <span>
                    Fine-tune{" "}
                    {group === "typography"
                      ? "text"
                      : group === "surface"
                        ? "appearance"
                        : group}
                  </span>
                  <small>Optional settings for a more specific result</small>
                </summary>
                <div className="sl-advanced-content">{renderDetails()}</div>
              </details>
            ))}
        </fieldset>
      </FieldGroup>
    </InspectorFieldScope.Provider>
  );
}

export function DesignNotice() {
  const width = usePuck((state) => state.appState.ui.viewports.current.width);
  const responsive = usePuck((state) => state.selectedItem?.props.responsive);
  const screen =
    typeof width === "number"
      ? width < 768
        ? "mobile"
        : width < 1024
          ? "tablet"
          : undefined
      : undefined;
  const count = screen
    ? Object.values(responsive?.[screen] ?? {}).reduce<number>(
        (sum, group) => sum + Object.values(group ?? {}).filter(Boolean).length,
        0
      )
    : 0;
  return (
    <>
      <p className="sl-help">
        Design applies to every screen. Use Responsive for smaller-screen
        changes.
      </p>
      {!!count && (
        <p className="sl-preview-note" role="status">
          This {screen} preview has {count}{" "}
          {count === 1 ? "exception" : "exceptions"}. Check Responsive →{" "}
          {screen === "mobile" ? "Mobile" : "Tablet"} if a Design change is
          hidden.
        </p>
      )}
    </>
  );
}

export function DesignPanel({
  fields,
}: {
  fields: Record<string, React.ReactNode>;
}) {
  const type = usePuck((state) => state.selectedItem?.type ?? "");
  const text = /Heading|Paragraph|RichText|BodyText|TextList|^Text$/.test(type);
  const image = /Image|Button|CTA/.test(type);
  const order = text
    ? ["typography", "spacing", "layout", "surface"]
    : image
      ? ["surface", "typography", "spacing", "layout"]
      : ["layout", "spacing", "typography", "surface"];
  return (
    <>
      {fields.styles}
      {fields.ctaStyles}
      {fields.surfaceRole}
      {fields.backgroundContrast}
      {fields.typographyRole}
      {fields.interactionRole}
      {order.map((key) => (
        <React.Fragment key={key}>{fields[key]}</React.Fragment>
      ))}
      {fields.position}
      {fields.states}
    </>
  );
}

export function ContentStyleHint() {
  const type = usePuck((state) => state.selectedItem?.type);
  if (type !== "Image") return null;
  return (
    <p className="sl-help">
      Set alternative text in Accessibility, or use the image's description.
      Choose Decorative when the image adds no information.
    </p>
  );
}
