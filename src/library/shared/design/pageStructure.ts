import type { ComponentData, Content } from "@puckeditor/core";
import { composableSectionNames } from "./compositionData.ts";

/** Explicit page-area capabilities. Inner slots stay open to content and nested layouts. */
export const pageAreaComponentIds: string[] = [
  ...composableSectionNames,
  "BrandingPreviewSection",
  "Box",
  "Stack",
  "Flex",
  "Columns",
  "Card",
  "List",
  "Collection",
  "Disclosure",
  "Grid",
  "CustomCodeSection",
  "Directory",
  "Locator",
];
export const pageRootComponentIds = [
  "ExpandedHeader",
  "ExpandedFooter",
  "MainContent",
  ...pageAreaComponentIds,
];
export const pageStructureMetadata = {
  pageContentAllowedComponentIds: pageAreaComponentIds,
  rootAllowedComponentIds: pageRootComponentIds,
};

/** Wrap adjacent loose blocks once, without changing their props, IDs, or Yext bindings. */
export function organizePageContent(content: Content): Content {
  const usedIds = new Set<string>();
  const collect = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (
      "type" in value &&
      "props" in value &&
      typeof (value.props as any)?.id === "string"
    )
      usedIds.add((value.props as any).id);
    Object.values(value).forEach(collect);
  };
  collect(content);
  const wrap = (
    nodes: Content,
    parentId: string,
    allowed: string[]
  ): Content => {
    const output: Content = [];
    let pending: Content = [];
    const flush = () => {
      if (!pending.length) return;
      const baseId = `${parentId}-page-area-${pending[0].props.id}`;
      let id = baseId;
      for (let suffix = 2; usedIds.has(id); suffix++)
        id = `${baseId}-${suffix}`;
      usedIds.add(id);
      const list = pending[0].type === "ListItem";
      output.push({
        type: list ? "List" : "Box",
        props: { id, as: list ? "ul" : "div", content: pending },
      });
      pending = [];
    };
    for (const node of nodes) {
      if (allowed.includes(node.type)) {
        flush();
        output.push(node);
      } else {
        if (
          pending.length &&
          (pending[0].type === "ListItem") !== (node.type === "ListItem")
        )
          flush();
        pending.push(node);
      }
    }
    flush();
    return output.length === nodes.length &&
      output.every((node, index) => node === nodes[index])
      ? nodes
      : output;
  };
  const nodes = content.map((node): ComponentData => {
    if (node.type !== "MainContent" || !Array.isArray(node.props.content))
      return node;
    const organized = wrap(
      node.props.content,
      node.props.id,
      pageAreaComponentIds
    );
    return organized === node.props.content
      ? node
      : { ...node, props: { ...node.props, content: organized } };
  });
  const organized = wrap(nodes, "root", pageRootComponentIds);
  return organized.length === content.length &&
    organized.every((node, index) => node === content[index])
    ? content
    : organized;
}
