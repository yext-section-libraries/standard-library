import * as React from "react";
import type { DesignProps } from "./styleSchema.ts";

/** Normalized item values are supplied by Collection, independently of its visual template. */
export const CollectionScope = React.createContext<
  { item: Record<string, unknown>; index: number } | undefined
>(undefined);

export type ItemBinding =
  "page" | "title" | "body" | "image" | "cta" | "eyebrow" | "value";

export function useItemValue<Value>(
  binding: ItemBinding | undefined,
  pageValue: Value
): Value {
  const scope = React.useContext(CollectionScope);
  return scope && binding && binding !== "page"
    ? (scope.item[binding] as Value)
    : pageValue;
}

export function useScopedAttributes(attributes: DesignProps["attributes"]) {
  const scope = React.useContext(CollectionScope);
  return scope && attributes?.htmlId
    ? { ...attributes, htmlId: `${attributes.htmlId}-${scope.index + 1}` }
    : attributes;
}

export const itemBindingField = (keys: ItemBinding[]) => ({
  type: "select" as const,
  label: "Content comes from",
  options: [
    { label: "Page field or constant", value: "page" },
    ...keys.map((value) => ({ label: `Collection item · ${value}`, value })),
  ],
});
