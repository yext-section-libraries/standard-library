import { styleSchema } from "./styleSchema.ts";

const propertyNames = Object.values(styleSchema).flatMap(Object.keys);
// Append new properties so existing CSS transport names remain stable.
const addedProperties = [
  "overflowWrap",
  "outlineStyle",
  "outlineWidth",
  "outlineColor",
  "outlineOffset",
];
const variableNames = new Map(
  [
    ...propertyNames.filter((property) => !addedProperties.includes(property)),
    ...addedProperties,
  ].map((property, index) => [
    property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
    index.toString(36),
  ])
);

/** Private transport names stay compact in CSS and SSR HTML; authored theme tokens are unchanged. */
export function designVariable(prefix: string, property: string): string {
  const cssProperty = property.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`
  );
  const suffix = variableNames.get(cssProperty);
  if (suffix === undefined)
    throw new Error(`Unknown design property: ${property}`);
  return `--sl-${prefix[0]}${suffix}`;
}
