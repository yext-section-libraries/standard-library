import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import {
  Render,
  type Config,
  type Content,
  type SlotField,
} from "@puckeditor/core";
import {
  MainContent,
  CustomCodeSection,
  toPuckFields,
  type YextComponentConfig,
} from "@yext/visual-editor";
import {
  createPuckGenerationCatalog,
  withGenerationCatalog,
} from "@yext/visual-editor/section-library-support";
import { VisualEditorProvider } from "./TestVisualEditorProvider.tsx";
import { recipeNode } from "../library/shared/design/recipes.ts";
import {
  assignCompositionIds,
  composableSectionNames,
} from "../library/shared/design/compositionData.ts";
import {
  pageAreaComponentIds,
  pageRootComponentIds,
  organizePageContent,
} from "../library/shared/design/pageStructure.ts";
import {
  entityRootConfig,
  directoryRootConfig,
  locatorRootConfig,
} from "../library/shared/roots.tsx";
import { pageStructure } from "../library/migrations/0008_page_structure.ts";
import entityLayout from "../library/layouts/standard-library/defaultLayout.json";
import directoryLayout from "../library/layouts/standard-library-directory/defaultLayout.json";
import locatorLayout from "../library/layouts/standard-library-locator/defaultLayout.json";

const modules = import.meta.glob<Record<string, any>>(
  "../library/sections/*.tsx",
  { eager: true }
);
const components: Record<string, YextComponentConfig<any>> = Object.fromEntries(
  Object.values(modules).map((module) => [
    module.config.id,
    module[module.config.id],
  ])
);
const authoringComponents: Record<string, any> = {
  MainContent,
  CustomCodeSection,
  ...components,
  ...sharedComponentConfigs,
};
const config: Config = withGenerationCatalog(
  {
    root: entityRootConfig,
    components: Object.fromEntries(
      Object.entries(authoringComponents).map(([name, component]) => [
        name,
        {
          ...component,
          fields: component.fields ? toPuckFields(component.fields) : undefined,
        },
      ])
    ),
  },
  createPuckGenerationCatalog({
    ...authoringComponents,
    CustomCodeSection: {
      ...authoringComponents.CustomCodeSection,
      layoutGenerationMetadata: { exclude: true },
    },
  })
);
afterEach(cleanup);

const node = (type: string, id: string, props: Record<string, any> = {}) => ({
  type,
  props: { id, ...props },
});

describe("page-area placement", () => {
  it.each([entityRootConfig, directoryRootConfig, locatorRootConfig])(
    "uses explicit page-area permissions at the root and inside main content %#",
    (root) => {
      expect(root.metadata?.pageContentAllowedComponentIds).toEqual(
        pageAreaComponentIds
      );
      for (const type of composableSectionNames)
        expect(pageAreaComponentIds).toContain(type);
      for (const type of [
        "Box",
        "Stack",
        "Flex",
        "Columns",
        "Card",
        "List",
        "Collection",
        "Disclosure",
        "Grid",
        "Directory",
        "Locator",
      ])
        expect(pageAreaComponentIds).toContain(type);
      for (const type of [
        "Heading",
        "Paragraph",
        "Image",
        "Button",
        "HoursTable",
        "Address",
        "ListItem",
      ]) {
        expect(pageAreaComponentIds).not.toContain(type);
        expect(pageRootComponentIds).not.toContain(type);
      }
      expect(config.components.MainContent.fields?.content).toMatchObject({
        type: "slot",
        allow: pageAreaComponentIds,
      });
    }
  );
  it("keeps suitable inner slots open to content, while list slots accept only list items", () => {
    for (const type of [
      "Box",
      "Stack",
      "Flex",
      "Columns",
      "Card",
      "ListItem",
      ...composableSectionNames,
    ]) {
      const field = config.components[type].fields?.content;
      expect(field).toMatchObject({ type: "slot" });
      if (field?.type !== "slot")
        throw new Error(`${type} has no content slot`);
      const slot = field as SlotField;
      expect(slot.allow).toBeUndefined();
      expect(slot.disallow).not.toContain("Heading");
      expect(slot.disallow).not.toContain("Image");
      expect(slot.disallow).toContain("MainContent");
      expect(slot.disallow).toContain("ListItem");
    }
    expect(config.components.List.fields?.content).toMatchObject({
      type: "slot",
      allow: ["ListItem"],
    });
  });
  it("renders headings directly inside a Section and Card, with one main landmark and no extra layout wrapper", () => {
    const content = assignCompositionIds(
      [
        {
          type: "MainContent",
          props: {
            content: [
              {
                type: "HeroSection",
                props: {
                  ...components.HeroSection.defaultProps,
                  content: [recipeNode("Heading", { as: "h1" })],
                },
              },
              recipeNode("Card", {}, [recipeNode("Heading", { as: "h2" })]),
            ],
          },
        },
      ],
      "page"
    ) as Content;
    const view = render(
      <VisualEditorProvider templateProps={{ document: { locale: "en" } }}>
        <Render config={config} data={{ root: { props: {} }, content }} />
      </VisualEditorProvider>
    );
    expect(view.container.querySelectorAll("main")).toHaveLength(1);
    expect(view.container.querySelector("h1")?.parentElement?.tagName).toBe(
      "SECTION"
    );
    expect(view.container.querySelector("h2")?.parentElement?.tagName).toBe(
      "ARTICLE"
    );
  });
});

describe("saved page structure migration", () => {
  it("groups adjacent loose content once and preserves identities, styles, and Yext mappings", () => {
    const heading = node("Heading", "title", {
      typography: { color: "red" },
      data: { text: { field: "name", constantValueEnabled: false } },
    });
    const paragraph = node("Paragraph", "body");
    const area = node("HeroSection", "hero", {
      content: [node("Heading", "inside")],
    });
    const content = [
      node("MainContent", "main", {
        content: [
          heading,
          paragraph,
          area,
          node("Address", "address"),
          node("HoursTable", "hours"),
        ],
      }),
    ];
    const before = structuredClone(content);
    const result = pageStructure.content.transformation(content);
    const main = result[0].props.content;
    expect(main.map((item: any) => item.type)).toEqual([
      "Box",
      "HeroSection",
      "Box",
    ]);
    expect(main[0].props.content).toEqual([heading, paragraph]);
    expect(main[0].props.content[0]).toBe(heading);
    expect(main[1]).toBe(area);
    expect(main[2].props.content.map((item: any) => item.props.id)).toEqual([
      "address",
      "hours",
    ]);
    expect(content).toEqual(before);
    expect(organizePageContent(result)).toBe(result);
  });
  it("preserves structural page blocks and avoids generated Id collisions", () => {
    const heading = node("Heading", "title");
    const existing = node("Box", "root-page-area-title", { content: [] });
    const result = organizePageContent([
      node("ExpandedHeader", "header"),
      heading,
      existing,
      node("ExpandedFooter", "footer"),
    ]);
    expect(result.map((item) => item.type)).toEqual([
      "ExpandedHeader",
      "Box",
      "Box",
      "ExpandedFooter",
    ]);
    expect(result[1].props.id).toBe("root-page-area-title-2");
    expect(result[1].props.content).toEqual([heading]);
    expect(result[2]).toBe(existing);
  });
  it("places old loose list items in a List", () => {
    const items = [node("ListItem", "one"), node("ListItem", "two")];
    const result = organizePageContent(items);
    expect(result).toMatchObject([
      { type: "List", props: { as: "ul", content: items } },
    ]);
  });
  it.each([entityLayout, directoryLayout, locatorLayout])(
    "keeps compliant bundled layouts unchanged %#",
    (layout) => {
      expect(organizePageContent(layout.content as Content)).toBe(
        layout.content
      );
      expect(layout.root.props.sectionLibraryMigrationVersion).toBe(8);
    }
  );
});
