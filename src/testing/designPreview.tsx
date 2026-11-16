import { entityRootConfig } from "../library/shared/roots.tsx";
import { demoDocument, demoEntityFields } from "./designDemoData.ts";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Render, type Config, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import "@yext/visual-editor/editor.css";
import {
  SectionLibraryVisualEditorProvider,
  toPuckFields,
  pt,
  withGenerationCatalog,
  createPuckGenerationCatalog,
} from "@yext/visual-editor/section-library-support";
import * as VisualEditor from "@yext/visual-editor";
import { DesignPreviewEditor } from "./DesignPreviewEditor.tsx";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import { assignCompositionIds } from "../library/shared/design/compositionData.ts";
import { constantText } from "../library/shared/design/content.tsx";
import { recipeNode as node } from "../library/shared/design/recipes.ts";
import { translationLoaders } from "virtual:section-library-i18n";
import "../library/shared/design/design.css";

const { MainContent } = VisualEditor;

const modules = import.meta.glob<{
  config: { id: string; category?: string };
  [key: string]: any;
}>("../library/sections/*.tsx", { eager: true });
const components = Object.fromEntries(
  Object.values(modules).map((module) => [
    module.config.id,
    module[module.config.id],
  ])
);
const baseConfig: Config = {
  root: entityRootConfig,
  components: Object.fromEntries(
    Object.entries({
      MainContent,
      ...components,
      ...sharedComponentConfigs,
    }).map(([name, component]) => [
      name,
      {
        ...component,
        label: pt(component.label ?? name),
        fields: component.fields ? toPuckFields(component.fields) : undefined,
      },
    ])
  ),
  categories: {
    internal: {
      visible: false,
      components: ["MainContent", ...Object.keys(sharedComponentConfigs)],
    },
    ...Object.fromEntries(
      Array.from(
        new Set(
          Object.values(modules).map(
            (module) => module.config.category ?? "Other"
          )
        )
      ).map((category) => [
        category,
        {
          title: category,
          components: Object.values(modules)
            .filter((module) => module.config.category === category)
            .map((module) => module.config.id),
        },
      ])
    ),
  },
};

const config = withGenerationCatalog(
  baseConfig,
  createPuckGenerationCatalog(baseConfig.components)
);

const text = (value: string, props: Record<string, unknown> = {}) =>
  node("Paragraph", { data: { text: constantText(value) }, ...props });
const heading = (value: string, props: Record<string, unknown> = {}) =>
  node("Heading", { data: { text: constantText(value) }, ...props });
const button = (
  label: string,
  href: string,
  props: Record<string, unknown> = {}
) =>
  node("Button", {
    cta: {
      field: "",
      constantValueEnabled: true,
      constantValue: {
        label: { defaultValue: label },
        link: href,
        linkType: "URL",
      },
    },
    ...props,
  });
const content = [
  node(
    "Box",
    {
      as: "header",
      surface: { backgroundColor: "#f5f3ee" },
      spacing: {
        paddingInlineStart: "clamp(1.5rem, 5vw, 5rem)",
        paddingInlineEnd: "clamp(1.5rem, 5vw, 5rem)",
        paddingBlockStart: "1.5rem",
        paddingBlockEnd: "1.5rem",
      },
    },
    [
      node(
        "Flex",
        {
          layout: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          },
        },
        [
          text("FIELDWORK", {
            typography: {
              fontWeight: "800",
              letterSpacing: "0.12em",
              fontSize: "1.125rem",
            },
          }),
          button("Get in touch ↗", "#contact", {
            typography: {
              color: "#213f36",
              textDecoration: "none",
              fontWeight: "600",
            },
            surface: { backgroundColor: "transparent" },
            spacing: {
              paddingInlineStart: "0",
              paddingInlineEnd: "0",
              paddingBlockStart: "0",
              paddingBlockEnd: "0",
            },
          }),
        ]
      ),
    ]
  ),
  node(
    "Box",
    {
      as: "section",
      attributes: { ariaLabel: "Introduction" },
      surface: { backgroundColor: "#f5f3ee" },
      spacing: {
        paddingInlineStart: "clamp(1.5rem, 5vw, 5rem)",
        paddingInlineEnd: "clamp(1.5rem, 5vw, 5rem)",
        paddingBlockStart: "3rem",
        paddingBlockEnd: "5rem",
      },
    },
    [
      node(
        "Columns",
        {
          layout: {
            display: "grid",
            gap: "3rem",
            gridTemplateColumns: "1.1fr 1fr",
            alignItems: "center",
          },
          responsive: {
            mobile: { layout: { gridTemplateColumns: "minmax(0, 1fr)" } },
          },
        },
        [
          node(
            "Stack",
            {
              layout: {
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                maxWidth: "38rem",
              },
            },
            [
              text("PLACES TO DO YOUR BEST WORK", {
                typography: {
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  letterSpacing: "0.16em",
                  color: "#426356",
                },
              }),
              heading("A little room.\nA lot of possibility.", {
                as: "h1",
                typography: {
                  fontFamily: "Georgia, serif",
                  fontWeight: "400",
                  fontSize: "clamp(2.75rem, 5.5vw, 5rem)",
                  lineHeight: "1.02",
                  letterSpacing: "-0.04em",
                  color: "#203e35",
                  whiteSpace: "pre-line",
                  textWrap: "balance",
                },
              }),
              text(
                "Thoughtful spaces for independent minds. Find a desk, build your team, and make yourself at home.",
                {
                  typography: {
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "1.125rem",
                    color: "#53615b",
                    lineHeight: "1.7",
                  },
                  layout: { maxWidth: "32rem" },
                }
              ),
              node("Flex", {}, [
                button("Find your space", "#spaces", {
                  surface: {
                    backgroundColor: "#254b3d",
                    borderRadius: "0.375rem",
                  },
                }),
                button("How it works →", "#details", {
                  surface: { backgroundColor: "transparent" },
                  typography: {
                    color: "#254b3d",
                    textDecoration: "none",
                    fontWeight: "600",
                  },
                }),
              ]),
            ]
          ),
          node(
            "Box",
            {
              layout: {
                aspectRatio: "1.1",
                minHeight: "280px",
                display: "flex",
                alignItems: "end",
              },
              surface: {
                backgroundColor: "#b6c5ad",
                backgroundImage:
                  "linear-gradient(135deg, #c7d0bb 0%, #98b095 45%, #557d66 100%)",
                borderRadius: "50% 50% 1rem 1rem",
              },
              spacing: {
                paddingBlockEnd: "2rem",
                paddingInlineStart: "2rem",
                paddingInlineEnd: "2rem",
              },
            },
            [
              node(
                "Card",
                {
                  as: "div",
                  layout: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    width: "100%",
                  },
                  surface: {
                    backgroundColor: "#ffffffed",
                    borderRadius: "0.75rem",
                    borderWidth: "0",
                    boxShadow: "0 12px 32px #173c2420",
                  },
                },
                [
                  text("Your next chapter starts here.", {
                    typography: {
                      fontFamily: "Georgia, serif",
                      fontSize: "1.5rem",
                      color: "#203e35",
                    },
                  }),
                  text("Flexible memberships. Room to grow.", {
                    typography: { fontSize: "0.875rem", color: "#53615b" },
                  }),
                ]
              ),
            ]
          ),
        ]
      ),
    ]
  ),
  node(
    "Box",
    {
      as: "section",
      attributes: { htmlId: "spaces", ariaLabel: "Membership options" },
      spacing: {
        paddingBlockStart: "4rem",
        paddingBlockEnd: "4rem",
        paddingInlineStart: "clamp(1.5rem, 5vw, 5rem)",
        paddingInlineEnd: "clamp(1.5rem, 5vw, 5rem)",
      },
    },
    [
      node(
        "Stack",
        { layout: { display: "flex", flexDirection: "column", gap: "2rem" } },
        [
          heading("Work your way.", {
            typography: {
              fontFamily: "Georgia, serif",
              fontSize: "2.5rem",
              fontWeight: "400",
              color: "#203e35",
            },
          }),
          node(
            "Columns",
            {
              layout: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
            },
            [
              [
                "A desk for the day",
                "Drop in, settle down, and get to it. A fresh perspective whenever you need one.",
                "01",
              ],
              [
                "A place of your own",
                "Your desk, your routine, your community. A familiar place to do something new.",
                "02",
              ],
              [
                "Room for your team",
                "Private spaces that bring people together, with the flexibility to make them yours.",
                "03",
              ],
            ].map(([title, body, number]) =>
              node(
                "Card",
                {
                  surface: {
                    backgroundColor: "#f8f8f4",
                    borderRadius: "0.75rem",
                    borderWidth: "0",
                  },
                  layout: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  },
                },
                [
                  text(number, {
                    typography: {
                      fontSize: "0.875rem",
                      color: "#64816e",
                      letterSpacing: "0.1em",
                    },
                  }),
                  heading(title, {
                    as: "h3",
                    typography: {
                      fontFamily: "Georgia, serif",
                      fontSize: "1.625rem",
                      fontWeight: "400",
                      color: "#203e35",
                    },
                  }),
                  text(body, {
                    typography: {
                      fontSize: "1rem",
                      lineHeight: "1.7",
                      color: "#53615b",
                    },
                  }),
                ]
              )
            )
          ),
        ]
      ),
    ]
  ),
  node(
    "Box",
    {
      as: "section",
      attributes: { htmlId: "details", ariaLabel: "Common questions" },
      spacing: {
        paddingBlockStart: "2rem",
        paddingBlockEnd: "4rem",
        paddingInlineStart: "clamp(1.5rem, 5vw, 5rem)",
        paddingInlineEnd: "clamp(1.5rem, 5vw, 5rem)",
      },
    },
    [
      heading("A few things to know.", {
        typography: {
          fontFamily: "Georgia, serif",
          fontSize: "2.5rem",
          fontWeight: "400",
          color: "#203e35",
        },
      }),
      node(
        "Disclosure",
        { summary: constantText("Can I try a space before joining?") },
        [
          text(
            "Yes. Start with a day pass and see how it feels. We will show you around and help you find a spot."
          ),
        ]
      ),
      node(
        "Disclosure",
        { summary: constantText("Can my membership grow with my team?") },
        [
          text(
            "Our spaces and memberships adapt as your team changes. Talk to us about the room you need."
          ),
        ]
      ),
    ]
  ),
  node(
    "Box",
    {
      as: "footer",
      attributes: { htmlId: "contact" },
      surface: { backgroundColor: "#203e35" },
      typography: { color: "#f5f3ee" },
      spacing: {
        paddingBlockStart: "3rem",
        paddingBlockEnd: "3rem",
        paddingInlineStart: "clamp(1.5rem, 5vw, 5rem)",
        paddingInlineEnd: "clamp(1.5rem, 5vw, 5rem)",
      },
    },
    [
      text("Let's make room for what's next.", {
        typography: {
          fontFamily: "Georgia, serif",
          fontSize: "2rem",
          color: "#f5f3ee",
        },
      }),
      button("hello@fieldwork.example", "mailto:hello@fieldwork.example", {
        typography: { color: "#f5f3ee", textDecoration: "underline" },
        surface: { backgroundColor: "transparent" },
        spacing: { paddingInlineStart: "0", paddingInlineEnd: "0" },
      }),
    ]
  ),
];
const initial: Data = {
  root: { props: {} },
  content: assignCompositionIds(
    [
      content[0],
      { type: "MainContent", props: { content: content.slice(1, -1) } },
      content[content.length - 1],
    ],
    "demo"
  ) as Data["content"],
};
const previewOnly = new URLSearchParams(location.search).has("preview");

function App() {
  const [data, setData] = React.useState(initial);
  return (
    <SectionLibraryVisualEditorProvider
      templateProps={{ document: demoDocument }}
      entityFields={demoEntityFields}
      translationLoaders={translationLoaders}
    >
      {previewOnly ? (
        <Render config={config} data={data} />
      ) : (
        <DesignPreviewEditor config={config} data={data} onChange={setData} />
      )}
    </SectionLibraryVisualEditorProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
