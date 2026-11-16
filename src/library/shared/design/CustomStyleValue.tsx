import { useInspectorDisclosure } from "./inspectorState.tsx";
import * as React from "react";
import { ControlPreview } from "./ControlPreview.tsx";

const units = ["px", "rem", "em", "%", "vw", "vh", "ch"];
const measurement = (value: string) =>
  value.trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))([a-z%]*)$/i);
const lengths =
  /^(width|height|minWidth|maxWidth|minHeight|maxHeight|fontSize|letterSpacing|gap|rowGap|columnGap|flexBasis|borderWidth|borderRadius|padding.*|margin.*|inset.*)$/;
const numbers = new Set([
  "lineHeight",
  "flexGrow",
  "flexShrink",
  "zIndex",
  "opacity",
]);

/** Numeric values do not require CSS knowledge; formulas and tokens remain an explicit option. */
export function CustomStyleValue({
  property,
  label,
  value,
  onChange,
  inputId,
  invalid,
  preferCss = false,
}: {
  property: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputId: string;
  invalid: boolean;
  preferCss?: boolean;
}) {
  const length = lengths.test(property);
  const numeric = length || numbers.has(property);
  const parsed = measurement(value);
  const complex =
    !!value &&
    (value === "inherit" ||
      (numeric && !parsed) ||
      /^(var|calc|clamp|min|max|linear-gradient|url)\(/.test(value));
  const [cssMode, setCssMode] = useInspectorDisclosure(
    `${property}:css-mode`,
    preferCss ||
      (!numeric &&
        !property.toLowerCase().includes("color") &&
        property !== "fontFamily" &&
        complex)
      ? true
      : false
  );
  const mode = cssMode ? "css" : "value";
  const [preferredUnit, setPreferredUnit] = React.useState(parsed?.[2] || "px");
  const percent = property === "opacity";
  const unit = parsed?.[2] || preferredUnit;
  const cssProperty = property.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`
  );
  const allowedUnits = units.filter(
    (candidate) =>
      typeof CSS === "undefined" || CSS.supports(cssProperty, `1${candidate}`)
  );
  const amount =
    percent && parsed
      ? String(Number(parsed[1]) * 100)
      : (parsed?.[1] ?? (complex ? "" : value));
  const rangeInvalid =
    percent &&
    mode === "value" &&
    !!value &&
    (Number(value) < 0 || Number(value) > 1);
  const issue = invalid || rangeInvalid;
  const updateAmount = (entry: string) => {
    const normalized = /^-?\d+,\d+$/.test(entry)
      ? entry.replace(",", ".")
      : entry;
    const next = measurement(normalized);
    if (!normalized) {
      onChange("");
      return;
    }
    if (percent && next) {
      onChange(String(Number(next[1]) / 100));
      return;
    }
    if (length && next) {
      onChange(`${next[1]}${next[2] || unit}`);
      return;
    }
    onChange(normalized);
  };
  return (
    <div className="sl-custom-value">
      <div
        className="sl-value-mode"
        role="group"
        aria-label={`${label} input type`}
      >
        <button
          type="button"
          aria-pressed={mode === "value"}
          onClick={() => setCssMode(false)}
        >
          <span aria-hidden="true">
            <ControlPreview property="width" value="auto" />
          </span>
          Simple value
        </button>
        <button
          type="button"
          aria-pressed={mode === "css"}
          onClick={() => setCssMode(true)}
        >
          <span aria-hidden="true">
            <ControlPreview property="custom" value="" />
          </span>
          CSS / theme token
        </button>
      </div>
      <label htmlFor={inputId}>
        {mode === "css"
          ? "CSS value or theme token"
          : percent
            ? "Visible percentage"
            : property === "fontFamily"
              ? "Font name"
              : numeric
                ? "Amount"
                : "Value"}
      </label>
      {mode === "value" && property.toLowerCase().includes("color") && (
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={
            /^#[a-f\d]{6}$/i.test(value)
              ? value
              : (value.match(/#[a-f\d]{6}/i)?.[0] ?? "#172033")
          }
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      <div className="sl-measure-input">
        <input
          id={inputId}
          aria-label={`${label} value`}
          inputMode={mode === "value" && numeric ? "decimal" : undefined}
          aria-invalid={issue || undefined}
          aria-describedby={`${inputId}-hint${issue ? ` ${inputId}-error` : ""}`}
          value={
            mode === "value" && numeric
              ? amount
              : mode === "value" && complex
                ? ""
                : value
          }
          placeholder={
            mode === "css"
              ? "var(--your-token)"
              : numeric
                ? "Enter a number"
                : property.toLowerCase().includes("color")
                  ? "#172033"
                  : property === "fontFamily"
                    ? "Georgia, serif"
                    : "Enter a value"
          }
          onChange={(event) =>
            mode === "value" && numeric
              ? updateAmount(event.target.value)
              : onChange(event.target.value)
          }
        />
        {mode === "value" && length && (
          <select
            aria-label={`${label} unit`}
            value={units.includes(unit) ? unit : "px"}
            onChange={(event) => {
              setPreferredUnit(event.target.value);
              if (parsed) onChange(`${parsed[1]}${event.target.value}`);
            }}
          >
            {allowedUnits.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
        {mode === "value" && percent && (
          <span className="sl-unit-suffix">%</span>
        )}
      </div>
      <small id={`${inputId}-hint`} className="sl-value-hint">
        {mode === "css"
          ? "For an exact CSS value, formula, or a token from your theme."
          : value === "inherit"
            ? "Currently follows the parent text style. Enter a value to override it."
            : complex
              ? "Currently uses a theme value or formula. Enter a value here to replace it."
              : length
                ? unit === "px"
                  ? "Pixels are a fixed size. Start with a small number and adjust."
                  : unit === "rem"
                    ? "Scales with the page's base text size. 1 rem is usually 16 pixels."
                    : unit === "em"
                      ? "Scales with the text size here. 1 em is one text size."
                      : unit === "%"
                        ? "A percentage of the space available in the parent."
                        : unit === "ch"
                          ? "Based on character width. Useful for comfortable text line lengths."
                          : `A percentage of the screen's ${unit === "vw" ? "width" : "height"}.`
                : percent
                  ? "100% is solid; lower values are more see-through."
                  : property === "lineHeight"
                    ? "Try 1.5 for comfortable paragraph spacing."
                    : "You can switch to CSS / theme token for more control."}
      </small>
      {issue && (
        <small id={`${inputId}-error`} role="alert">
          {rangeInvalid
            ? "Use a percentage from 0 to 100."
            : "This value doesn't work here. Check the number or choose another unit."}
        </small>
      )}
    </div>
  );
}
