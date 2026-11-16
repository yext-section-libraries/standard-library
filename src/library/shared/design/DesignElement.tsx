import * as React from "react";
import { designStyle, designAttributes } from "./styles.ts";
import type { DesignProps } from "./styleSchema.ts";
import "./design.css";
import { useScopedAttributes } from "./CollectionScope.tsx";

export type SemanticTag =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "nav"
  | "header"
  | "footer"
  | "address"
  | "ul"
  | "ol"
  | "li"
  | "figure"
  | "figcaption"
  | "blockquote";

export const semanticTagField = {
  type: "select" as const,
  label: "HTML element",
  options: [
    "div",
    "section",
    "article",
    "aside",
    "nav",
    "header",
    "footer",
    "address",
    "ul",
    "ol",
    "li",
    "figure",
    "figcaption",
    "blockquote",
  ].map((value) => ({ label: value, value })),
};

export function DesignElement({
  as: Tag = "div",
  design,
  children,
  className = "",
  isEditing = false,
  elementRef,
  ...rest
}: {
  as?: React.ElementType;
  design: DesignProps;
  children?: React.ReactNode;
  className?: string;
  isEditing?: boolean;
  elementRef?: React.Ref<HTMLElement>;
} & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const attributes = useScopedAttributes(design.attributes);
  return (
    <Tag
      ref={elementRef}
      {...designAttributes(attributes)}
      {...rest}
      className={`components sl-atom ${className}`}
      style={{ ...designStyle(design, isEditing), ...rest.style }}
    >
      {children}
    </Tag>
  );
}
