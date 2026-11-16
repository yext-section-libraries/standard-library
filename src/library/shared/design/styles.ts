import { designVariable } from "./styleVariables.ts";
import type { CSSProperties } from "react";
import {
  styleSchema,
  type DesignProps,
  type StyleGroups,
} from "./styleSchema.ts";

export const designBreakpoints = { mobile: 768, tablet: 1024 } as const;

/** Never interpolate authored selectors or declarations into a stylesheet. */
export function safeCssValue(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  if (
    /[;{}<>\\]/.test(trimmed) ||
    Array.from(trimmed).some((character) => character.charCodeAt(0) < 32) ||
    /\/\*|\*\/|!important|expression\s*\(|javascript\s*:/i.test(trimmed)
  )
    return undefined;
  return trimmed;
}

export function designAttributes(attributes: DesignProps["attributes"]) {
  return {
    id: attributes?.htmlId || undefined,
    "aria-label": attributes?.ariaLabel || undefined,
    title: attributes?.title || undefined,
    lang: attributes?.language || undefined,
    dir: attributes?.direction || undefined,
  };
}

export const baseAtomStyle: CSSProperties = { boxSizing: "border-box" };

/** A single static stylesheet handles every atom, including SSR and live preview. */
export function designStyle(
  props: DesignProps,
  isEditing = false
): CSSProperties {
  const variables: Record<string, string> = {};
  const add = (groups: StyleGroups | undefined, prefix: string) => {
    for (const [group, properties] of Object.entries(styleSchema)) {
      for (const property of Object.keys(properties)) {
        let value = safeCssValue(
          (
            groups?.[group as keyof StyleGroups] as
              Record<string, string> | undefined
          )?.[property]
        );
        if (!value) continue;
        // An unknown function is valid inside a custom property but makes an
        // inheritable text declaration compute to its inherited value. Using
        // the raw CSS keyword here would inherit the parent's *transport var*,
        // which can incorrectly double relative font sizes and miss overrides.
        if (
          group === "typography" &&
          property !== "textDecoration" &&
          value === "inherit"
        )
          value = "sl-parent()";
        if (property === "display" && value === "none" && isEditing) {
          value = "revert";
          variables[designVariable(prefix, "opacity")] = "0.45";
          variables[designVariable(prefix, "min-height")] = "32px";
        }
        variables[designVariable(prefix, property)] = value;
      }
    }
  };
  add(props, "base");
  add(props.responsive?.tablet, "tablet");
  add(props.responsive?.mobile, "mobile");
  add(props.states?.hover, "hover");
  add(props.states?.focusVisible, "focus");
  return { ...baseAtomStyle, ...variables };
}

export function typographyClasses(props: DesignProps): string {
  const groups = {
    base: props,
    tablet: props.responsive?.tablet,
    mobile: props.responsive?.mobile,
    hover: props.states?.hover,
    focus: props.states?.focusVisible,
  };
  return Object.entries(groups)
    .flatMap(([prefix, group]) =>
      Object.keys(styleSchema.typography).flatMap((property) => {
        const value = safeCssValue(
          group?.typography?.[property as keyof typeof styleSchema.typography]
        );
        return value
          ? [
              `sl-type-${prefix}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
            ]
          : [];
      })
    )
    .join(" ");
}
