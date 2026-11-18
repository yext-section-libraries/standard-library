import { DesignPreviewEditor } from "./DesignPreviewEditor.tsx";
import { localEditorPlugins } from "./editorPlugins.ts";
import { demoDocument, demoEntityFields } from "./designDemoData.ts";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import {
  Puck,
  Render,
  resolveAllData,
  useGetPuck,
  type Config,
  type Data,
} from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { page } from "@vitest/browser/context";
import { axe } from "jest-axe";
import { toPuckFields } from "@yext/visual-editor";
import { testSetup } from "./componentTests.setup.ts";
import { VisualEditorProvider } from "./TestVisualEditorProvider.tsx";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import { recipeNode } from "../library/shared/design/recipes.ts";
import {
  composableSectionNames,
  compositionData,
} from "../library/shared/design/compositionData.ts";
import { composableSections } from "../library/migrations/0005_composable_sections.ts";
import { createYextFieldTransforms } from "@yext/visual-editor/section-library-support";
import "../library/shared/design/design.css";

const modules = import.meta.glob<{
  config: { id: string };
  [key: string]: any;
}>("../library/sections/*.tsx", { eager: true });
const publicComponents = Object.fromEntries(
  Object.values(modules).map((module) => [
    module.config.id,
    module[module.config.id],
  ])
);
const config: Config = {
  components: Object.fromEntries(
    Object.entries({ ...publicComponents, ...sharedComponentConfigs }).map(
      ([name, component]) => [
        name,
        {
          ...component,
          fields: component.fields ? toPuckFields(component.fields) : undefined,
        },
      ]
    )
  ),
};
const presetNames = Object.keys(publicComponents).filter((name) =>
  composableSectionNames.some((section) => section === name)
);

function withIds(value: any, prefix = "test"): any {
  if (Array.isArray(value))
    return value.map((child, index) => withIds(child, `${prefix}-${index}`));
  if (value && typeof value === "object") {
    const result = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        withIds(child, `${prefix}-${key}`),
      ])
    );
    if (typeof value.type === "string" && value.props) result.props.id = prefix;
    return result;
  }
  return value;
}

const data = (content: unknown[]): Data => ({
  root: { props: {} },
  content: withIds(content),
});
const provider = (
  children: React.ReactNode,
  document: Record<string, any> = {}
) => (
  <VisualEditorProvider
    templateProps={{ document: { locale: "en", ...document } }}
  >
    {children}
  </VisualEditorProvider>
);
afterEach(cleanup);

describe("editable section presets", () => {
  it.each(presetNames)(
    "%s contains registered editable atoms and serializable data",
    (name) => {
      const component = publicComponents[name];
      expect(component.defaultProps.content.length).toBeGreaterThan(0);
      expect(component.renderFields).toBeTypeOf("function");
      const visit = (value: any) => {
        if (Array.isArray(value)) return value.forEach(visit);
        if (!value || typeof value !== "object") return;
        if (value.type && value.props)
          expect(
            config.components[value.type],
            `Unregistered ${value.type} in ${name}`
          ).toBeDefined();
        Object.values(value).forEach(visit);
      };
      visit(component.defaultProps.content);
      expect(() => structuredClone(component.defaultProps)).not.toThrow();
    }
  );

  it("renders nested presets with semantic headings, sections, and safe links on the server", () => {
    const html = renderToStaticMarkup(
      provider(
        <Render
          config={config}
          data={data([
            {
              type: "HeroSection",
              props: publicComponents.HeroSection.defaultProps,
            },
          ])}
        />
      )
    );
    expect(html).toContain("<section");
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toContain("<a");
    expect(html).not.toContain("<style");
    expect(html).not.toContain("undefined");
  });

  it("maps text to Yext data and updates without rewriting authored values", () => {
    const source = {
      field: "name",
      constantValue: { defaultValue: "Fallback" },
      constantValueEnabled: false,
    };
    const tree = data([
      recipeNode("Heading", { data: { text: source }, as: "h1" }),
    ]);
    const view = render(
      provider(<Render config={config} data={tree} />, { name: "Brooklyn" })
    );
    expect(
      view.getByRole("heading", { name: "Brooklyn", level: 1 })
    ).toBeTruthy();
    view.rerender(
      provider(<Render config={config} data={tree} />, { name: "Queens" })
    );
    expect(
      view.getByRole("heading", { name: "Queens", level: 1 })
    ).toBeTruthy();
    expect(source.field).toBe("name");
    expect(source.constantValue.defaultValue).toBe("Fallback");
  });

  it("preserves native list structure without style elements or wrapper divs in the list", () => {
    const html = renderToStaticMarkup(
      provider(
        <Render
          config={config}
          data={data([
            recipeNode("List", {}, [
              recipeNode("ListItem", {}, [recipeNode("Paragraph")]),
            ]),
          ])}
        />
      )
    );
    const node = new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector("ul")!;
    expect(Array.from(node.children).map((child) => child.tagName)).toEqual([
      "LI",
    ]);
    expect(node.querySelector("li > p")).toBeTruthy();
  });

  it("keeps mapped collections populated through their Yext resolver", async () => {
    const props = structuredClone(publicComponents.ProductSection.defaultProps);
    const wrapper = props.content[0].props.content.find(
      (node: any) => node.type === "ProductCardsWrapper"
    );
    wrapper.props.data = {
      field: "c_products",
      constantValueEnabled: false,
      constantValue: [],
    };
    const result = await resolveAllData(
      data([{ type: "ProductSection", props }]),
      config,
      {
        streamDocument: {
          locale: "en",
          c_products: [{ name: "Coffee", description: "Freshly roasted" }],
        },
      }
    );
    const cards = result.content[0].props.content[0].props.content.find(
      (node: any) => node.type === "ProductCardsWrapper"
    );
    expect(cards.props.slots.CardSlot).toHaveLength(1);
  });

  it.each(composableSectionNames)(
    "%s resolves and server-renders its complete composition",
    async (name) => {
      const resolved = await resolveAllData(
        data([{ type: name, props: publicComponents[name].defaultProps }]),
        config,
        { streamDocument: { locale: "en" } }
      );
      expect(() =>
        renderToStaticMarkup(
          provider(<Render config={config} data={resolved} />)
        )
      ).not.toThrow();
    }
  );

  it("migrates authored fields and keeps an already customized composition intact", () => {
    const module = Object.values(modules).find(
      (module) => module.config.id === "HeroSection"
    )!;
    const legacy = structuredClone(module.HeroSectionBody.defaultProps);
    legacy.id = "hero-existing";
    legacy.slots.GeomodifierSlot[0].props.data.text = {
      field: "name",
      constantValueEnabled: false,
      constantValue: { defaultValue: "Fallback" },
    };
    const migration = composableSections.HeroSection;
    if (migration.action !== "updated")
      throw new Error("Expected a section update");
    const migrated = migration.propTransformation(legacy);
    const json = JSON.stringify(migrated.content);
    expect(json).toContain('"field":"name"');
    expect(migrated.id).toBe("hero-existing");
    expect(migrated).not.toHaveProperty("slots");
    expect(migration.propTransformation(migrated)).toBe(migrated);
    expect(compositionData("HeroSection", legacy, true)).toEqual(
      compositionData("HeroSection", legacy, true)
    );
  });
});

describe("repeated editable templates", () => {
  it("renders the same mapped values when the host applies Puck field transforms", () => {
    const document = { locale: "en", name: "Mapped heading" };
    const tree = data([
      recipeNode("Heading", {
        data: {
          text: {
            field: "name",
            constantValueEnabled: false,
            constantValue: { defaultValue: "Fallback" },
          },
        },
      }),
      recipeNode("Button"),
    ]);
    const view = render(
      provider(
        <Render
          config={config}
          data={tree}
          fieldTransforms={createYextFieldTransforms(document, "en")}
        />,
        document
      )
    );
    expect(view.getByRole("heading", { name: "Mapped heading" })).toBeTruthy();
    expect(
      view.getByRole("link", { name: "Learn more" }).getAttribute("href")
    ).toBe("#");
  });
  it("repeats a single template over manual items with unique anchor IDs and valid list markup", () => {
    const node = recipeNode("Collection", { as: "ul" });
    node.props.template = [
      recipeNode("Heading", {
        as: "h3",
        binding: "title",
        attributes: { htmlId: "item-title" },
      }),
    ];
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    expect(
      view.getAllByRole("heading").map((element) => element.textContent)
    ).toEqual(["First item", "Second item", "Third item"]);
    expect(
      Array.from(view.container.querySelectorAll("h3")).map(
        (element) => element.id
      )
    ).toEqual(["item-title-1", "item-title-2", "item-title-3"]);
    expect(
      Array.from(view.container.querySelector("ul")!.children).map(
        (element) => element.tagName
      )
    ).toEqual(["LI", "LI", "LI"]);
  });

  it("keeps the default card editable when Offers has no image or link", async () => {
    await page.viewport(1440, 1000);
    let getPuck!: ReturnType<typeof useGetPuck>;
    const Capture = () => {
      getPuck = useGetPuck();
      return <></>;
    };
    const view = render(
      <VisualEditorProvider
        templateProps={{ document: demoDocument }}
        entityFields={demoEntityFields}
      >
        <DesignPreviewEditor
          config={config}
          data={data([recipeNode("Collection")])}
          overrides={{ header: Capture }}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      </VisualEditorProvider>
    );
    fireEvent.click(await view.findByRole("switch"));
    fireEvent.click(view.getAllByRole("combobox")[0]);
    fireEvent.click(await view.findByRole("option", { name: "Offers" }));
    expect(
      await view.findByText("Call to action", { exact: true })
    ).toBeTruthy();
    expect(view.container.querySelector("article")).toBeTruthy();
    expect(view.container.querySelector("a:not([href])")).toBeNull();
    fireEvent.click(view.getAllByRole("combobox")[1]);
    fireEvent.click(await view.findByRole("option", { name: "Title" }));
    await waitFor(() => {
      expect(
        getPuck().appState.data.content[0].props.items.mappings.title.field
      ).toBe("title");
      expect(view.container.querySelector("h3")?.textContent).toBe("Day desk");
    });
    fireEvent.click(view.getAllByRole("combobox")[2]);
    fireEvent.click(await view.findByRole("option", { name: "Description" }));
    expect(
      await view.findByText(demoDocument.c_offers[0].description)
    ).toBeTruthy();
    fireEvent.change(
      view.getByRole("spinbutton", { name: "Preview item (starts at 1)" }),
      {
        target: { value: "2" },
      }
    );
    await waitFor(() =>
      expect(view.container.querySelector("h3")?.textContent).toBe("Team room")
    );
    expect(
      await view.findByText(demoDocument.c_offers[1].description)
    ).toBeTruthy();
  });

  it.each([false, true])(
    "repeats the full Card template for Offers without optional media or links, with field transforms: %s",
    (transform) => {
      const node = recipeNode("Collection");
      node.props.items = {
        field: "c_offers",
        constantValueEnabled: false,
        constantValue: [],
        mappings: {
          title: { field: "title", constantValueEnabled: false },
          body: { field: "description", constantValueEnabled: false },
        },
      };
      const view = render(
        provider(
          <Render
            config={config}
            data={data([node])}
            fieldTransforms={
              transform
                ? createYextFieldTransforms(demoDocument, "en")
                : undefined
            }
          />,
          demoDocument
        )
      );
      expect(view.container.querySelectorAll("article")).toHaveLength(2);
      expect(
        view.getAllByRole("heading").map((heading) => heading.textContent)
      ).toEqual(demoDocument.c_offers.map((offer) => offer.title));
      for (const offer of demoDocument.c_offers)
        expect(view.getByText(offer.description)).toBeTruthy();
      expect(view.queryByRole("link")).toBeNull();
      expect(view.queryByRole("img")).toBeNull();
    }
  );

  it("omits an empty mapped Offers list from published output", () => {
    const node = recipeNode("Collection");
    node.props.items = {
      field: "c_offers",
      constantValueEnabled: false,
      constantValue: [],
      mappings: {},
    };
    const view = render(
      provider(<Render config={config} data={data([node])} />, {
        c_offers: [],
      })
    );
    expect(view.container.querySelector("article")).toBeNull();
    expect(view.container.textContent).toBe("");
  });

  it("binds the template to normalized fields in a Yext list", () => {
    const node = recipeNode("Collection");
    node.props.items = {
      field: "c_offers",
      constantValueEnabled: false,
      constantValue: [],
      mappings: { title: { field: "name", constantValueEnabled: false } },
    };
    node.props.template = [
      recipeNode("Heading", { as: "h3", binding: "title" }),
    ];
    const view = render(
      provider(<Render config={config} data={data([node])} />, {
        c_offers: [{ name: "Morning" }, { name: "Evening" }],
      })
    );
    expect(
      view.getAllByRole("heading").map((element) => element.textContent)
    ).toEqual(["Morning", "Evening"]);
  });
});

describe("responsive styles and accessibility", () => {
  it("omits a reviews preset when the entity has no reviews", async () => {
    const resolved = await resolveAllData(
      data([
        {
          type: "ReviewsSection",
          props: publicComponents.ReviewsSection.defaultProps,
        },
      ]),
      config,
      { streamDocument: { locale: "en" } }
    );
    expect(
      renderToStaticMarkup(provider(<Render config={config} data={resolved} />))
    ).not.toContain("<section");
  });
  it("honors mapped link targets and renders Yext image badges", () => {
    const view = render(
      provider(
        <Render
          config={config}
          data={data([
            recipeNode("Button", {
              cta: {
                field: "",
                constantValueEnabled: true,
                constantValue: {
                  label: "External",
                  link: "https://example.com",
                  openInNewTab: true,
                  linkType: "URL",
                },
              },
            }),
            recipeNode("Button", {
              cta: {
                field: "",
                selectedType: "presetImage",
                constantValueEnabled: true,
                constantValue: {
                  link: "https://example.com/app",
                  ctaType: "presetImage",
                  linkType: "URL",
                },
              },
              presetImage: "app-store",
            }),
            recipeNode("Button", { action: "button" }),
          ])}
        />
      )
    );
    const link = view.getByRole("link", { name: "External" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(
      view.container.querySelector('a[href="https://example.com/app"] svg')
    ).toBeTruthy();
    expect(
      view.getByRole("button", { name: "Learn more" }).getAttribute("type")
    ).toBe("button");
  });
  it("applies mapped-card layout controls to the actual card grid", async () => {
    const props = structuredClone(publicComponents.ProductSection.defaultProps);
    const wrapper = props.content[0].props.content.find(
      (node: any) => node.type === "ProductCardsWrapper"
    );
    wrapper.props.layout = {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "24px",
    };
    wrapper.props.responsive = {};
    wrapper.props.attributes = { htmlId: "products-grid" };
    const resolved = await resolveAllData(
      data([{ type: "ProductSection", props }]),
      config,
      { streamDocument: { locale: "en" } }
    );
    const view = render(provider(<Render config={config} data={resolved} />));
    const grid = view.container.querySelector("#products-grid")!;
    expect(getComputedStyle(grid).display).toBe("grid");
    expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(
      4
    );
    expect(getComputedStyle(grid).rowGap).toBe("24px");
  });
  it("preserves gaps and lets axis-specific and responsive values override them", async () => {
    const node = recipeNode(
      "Stack",
      {
        attributes: { htmlId: "gap-check" },
        layout: {
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          columnGap: "12px",
        },
        responsive: { mobile: { layout: { gap: "32px" } } },
      },
      [recipeNode("Paragraph"), recipeNode("Paragraph")]
    );
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    const stack = view.container.querySelector("#gap-check")!;
    for (const width of [800, 1440]) {
      await page.viewport(width, 900);
      expect(getComputedStyle(stack).rowGap).toBe("24px");
      expect(getComputedStyle(stack).columnGap).toBe("12px");
    }
    await page.viewport(375, 900);
    expect(getComputedStyle(stack).rowGap).toBe("32px");
    expect(getComputedStyle(stack).columnGap).toBe("32px");
  });

  it("uses surface and interaction roles while preserving explicit responsive typography", async () => {
    testSetup({
      colorPrimary: "#000000",
      colorPrimaryForeground: "#ffffff",
      primaryButtonDefaultTextColor: "#112233",
      primaryButtonDefaultTextColorOnDark: "#ffeedd",
      headlineFontSize: 48,
      headlineMobileFontSize: 32,
    });
    const node = recipeNode("Box", { surfaceRole: "primary" }, [
      recipeNode("Heading", { as: "h2", typographyRole: "headline" }),
      recipeNode("Heading", {
        as: "h2",
        typographyRole: "headline",
        attributes: { htmlId: "custom-heading" },
        responsive: { mobile: { typography: { fontSize: "20px" } } },
      }),
      recipeNode("Button"),
    ]);
    const { container, getByText, getAllByRole } = render(
      provider(<Render config={config} data={data([node])} />)
    );
    const surface = container.querySelector(".sl-surface-primary")!;
    const [heading, customHeading] = getAllByRole("heading", { level: 2 });
    const button = getByText("Learn more");
    expect(getComputedStyle(surface).backgroundColor).toBe("rgb(0, 0, 0)");
    expect(getComputedStyle(button).color).toBe("rgb(255, 238, 221)");
    await page.viewport(1280, 800);
    expect(getComputedStyle(heading).fontSize).toBe("48px");
    expect(getComputedStyle(customHeading).fontSize).toBe("48px");
    await page.viewport(375, 800);
    expect(getComputedStyle(heading).fontSize).toBe("32px");
    expect(getComputedStyle(customHeading).fontSize).toBe("20px");
  });

  it("preserves a dark banner's contrasting text", () => {
    testSetup({ colorPrimary: "#000000", colorPrimaryForeground: "#ffffff" });
    const props = publicComponents.BannerSection.defaultProps;
    const view = render(
      provider(
        <Render
          config={config}
          data={data([{ type: "BannerSection", props }])}
        />
      )
    );
    expect(
      getComputedStyle(view.container.querySelector("section")!).color
    ).toBe("rgb(255, 255, 255)");
    expect(getComputedStyle(view.container.querySelector("p")!).color).toBe(
      "rgb(255, 255, 255)"
    );
  });

  it("retains bindings to fields inside a mapped promotion", () => {
    const module = Object.values(modules).find(
      (module) => module.config.id === "PromoSection"
    )!;
    const old = structuredClone(module.PromoSectionBody.defaultProps);
    old.data.promo = { field: "c_promo", constantValueEnabled: false };
    const props = compositionData("PromoSection", old, true);
    const view = render(
      provider(
        <Render
          config={config}
          data={data([{ type: "PromoSection", props }])}
        />,
        {
          c_promo: {
            title: "Summer offer",
            description: "A seasonal offer",
            cta: { label: "Book now", link: "/SummerOffer", linkType: "URL" },
          },
        }
      )
    );
    expect(view.getByRole("heading", { name: "Summer offer" })).toBeTruthy();
    expect(
      view.getByRole("link", { name: "Book now" }).getAttribute("href")
    ).toBe("/SummerOffer");
  });

  it("omits a mapped-empty section from server HTML and allows an explicit override", async () => {
    const props = structuredClone(publicComponents.ProductSection.defaultProps);
    props.content[0].props.content.find(
      (node: any) => node.type === "ProductCardsWrapper"
    ).props.data = {
      field: "c_products",
      constantValueEnabled: false,
      constantValue: [],
    };
    const resolved = await resolveAllData(
      data([{ type: "ProductSection", props }]),
      config,
      { streamDocument: { locale: "en", c_products: [] } }
    );
    expect(
      renderToStaticMarkup(provider(<Render config={config} data={resolved} />))
    ).not.toContain("<section");
    props.hideWhenMappedContentEmpty = false;
    const kept = await resolveAllData(
      data([{ type: "ProductSection", props }]),
      config,
      { streamDocument: { locale: "en", c_products: [] } }
    );
    expect(
      renderToStaticMarkup(provider(<Render config={config} data={kept} />))
    ).toContain("<section");
  });

  it("keeps phone, email and case-sensitive links intact", () => {
    const nodes = [
      ["PHONE", "+1 (212) 555-0123", "Call"],
      ["EMAIL", "Hello@Example.com", "Email"],
      ["URL", "https://example.com/CaseSensitive", "Visit"],
    ].map(([linkType, link, label]) =>
      recipeNode("Button", {
        cta: {
          field: "",
          constantValueEnabled: true,
          constantValue: { label: { defaultValue: label }, link, linkType },
        },
      })
    );
    const view = render(
      provider(<Render config={config} data={data(nodes)} />)
    );
    expect(view.getByRole("link", { name: "Call" }).getAttribute("href")).toBe(
      "tel:+12125550123"
    );
    expect(view.getByRole("link", { name: "Email" }).getAttribute("href")).toBe(
      "mailto:Hello@Example.com"
    );
    expect(view.getByRole("link", { name: "Visit" }).getAttribute("href")).toBe(
      "https://example.com/CaseSensitive"
    );
  });

  it("uses Design everywhere, isolates tablet and mobile exceptions, and clears overrides", async () => {
    const node = recipeNode(
      "Box",
      {
        attributes: { htmlId: "outer" },
        layout: {
          width: "400px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        },
        responsive: {
          tablet: { layout: { width: "300px" } },
          mobile: { layout: { width: "200px" } },
        },
      },
      [recipeNode("Box", { attributes: { htmlId: "inner" } })]
    );
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    for (const [width, expected] of [
      [375, "200px"],
      [800, "300px"],
      [1440, "400px"],
    ] as const) {
      await page.viewport(width, 900);
      await waitFor(() =>
        expect(
          getComputedStyle(view.container.querySelector("#outer")!).width
        ).toBe(expected)
      );
    }
    expect(
      getComputedStyle(view.container.querySelector("#inner")!).display
    ).toBe("block");
    node.props.responsive.mobile.layout.width = "";
    await page.viewport(375, 900);
    view.rerender(provider(<Render config={config} data={data([node])} />));
    await waitFor(() =>
      expect(
        getComputedStyle(view.container.querySelector("#outer")!).width
      ).toBe("400px")
    );
  });

  it("produces accessible content and native keyboard disclosure controls", async () => {
    const view = render(
      provider(
        <Render
          config={config}
          data={data([
            recipeNode("Heading", { as: "h1" }),
            recipeNode("Paragraph"),
            recipeNode("Button"),
            recipeNode(
              "Disclosure",
              {
                summary: {
                  field: "",
                  constantValueEnabled: true,
                  constantValue: { defaultValue: "Shipping" },
                },
              },
              [recipeNode("Paragraph")]
            ),
          ])}
        />
      )
    );
    expect((await axe(view.container)).violations).toEqual([]);
    expect(view.container.querySelector("a")?.getAttribute("href")).toBe("#");
    const details = view.container.querySelector("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(details.querySelector("summary")!);
    expect(details.open).toBe(true);
  });

  it("applies typography overrides to Yext blocks at the selected breakpoint", async () => {
    const node = {
      type: "Text",
      props: {
        ...publicComponents.Text.defaultProps,
        typography: { fontSize: "29px" },
        responsive: { mobile: { typography: { fontSize: "37px" } } },
      },
    };
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    await page.viewport(375, 900);
    expect(getComputedStyle(view.container.querySelector("p")!).fontSize).toBe(
      "37px"
    );
    for (const width of [800, 1440]) {
      await page.viewport(width, 900);
      expect(
        getComputedStyle(view.container.querySelector("p")!).fontSize
      ).toBe("29px");
    }
  });

  it("organizes real Puck fields into tabs and edits nested styling", async () => {
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Heading", { as: "h1" })])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    const designTab = await view.findByRole("tab", { name: "Design" });
    expect(view.getByRole("tab", { name: "Content" })).toBeTruthy();
    expect(view.getByRole("tab", { name: "Responsive" })).toBeTruthy();
    expect(view.getByRole("tab", { name: "Accessibility" })).toBeTruthy();
    fireEvent.click(designTab);
    expect(view.queryByRole("textbox", { name: "Font size value" })).toBeNull();
    fireEvent.click(
      view.getByRole("button", { name: "Font size: Custom value" })
    );
    const input = await view.findByRole("textbox", { name: "Font size value" });
    fireEvent.change(input, { target: { value: "48" } });
    await waitFor(() =>
      expect(
        getComputedStyle(view.container.querySelector("h1")!).fontSize
      ).toBe("48px")
    );
    fireEvent.change(view.getByRole("combobox", { name: "Font size unit" }), {
      target: { value: "rem" },
    });
    fireEvent.change(input, { target: { value: "3" } });
    await waitFor(() =>
      expect(
        getComputedStyle(view.container.querySelector("h1")!).fontSize
      ).toBe("48px")
    );
    fireEvent.click(view.getByRole("button", { name: "CSS / theme token" }));
    fireEvent.change(input, {
      target: { value: "var(--test-heading-size, 36px)" },
    });
    await waitFor(() =>
      expect(
        getComputedStyle(view.container.querySelector("h1")!).fontSize
      ).toBe("36px")
    );
  });
  it("shows an explicit default choice and keeps custom sizing open when a preset or Parent is chosen", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Heading", { as: "h1" })])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    expect(view.queryByRole("button", { name: /Reset font size/i })).toBeNull();
    fireEvent.click(
      view.getByRole("button", { name: "Font size: Custom value" })
    );
    const input = view.getByRole("textbox", { name: "Font size value" });
    fireEvent.change(input, { target: { value: "48" } });
    fireEvent.click(view.getByRole("button", { name: "Font size: Body" }));
    expect(view.getByRole("textbox", { name: "Font size value" })).toBe(input);
    expect(
      view
        .getByRole("button", { name: "Font size: Body" })
        .getAttribute("aria-pressed")
    ).toBe("true");
    fireEvent.click(view.getByRole("button", { name: "Font size: Parent" }));
    expect(
      view.getByText(
        "Currently follows the parent text style. Enter a value to override it."
      )
    ).toBeTruthy();
    expect(
      view
        .getByRole("button", { name: "Font size: Parent" })
        .getAttribute("aria-pressed")
    ).toBe("true");
    expect(view.getByRole("textbox", { name: "Font size value" })).toBe(input);
    fireEvent.click(
      view.getAllByText("Layout and size", { exact: true }).at(-1)!
    );
    const defaultWidth = await view.findByRole("button", {
      name: "Width: Default",
    });
    expect(defaultWidth.getAttribute("aria-pressed")).toBe("true");
    expect(
      view
        .getByRole("button", { name: "Width: Auto" })
        .getAttribute("aria-pressed")
    ).toBe("false");
    fireEvent.click(view.getByRole("button", { name: "Width: Fill parent" }));
    fireEvent.click(defaultWidth);
    expect(defaultWidth.getAttribute("aria-pressed")).toBe("true");
  });
  it("distinguishes a responsive value from following Design", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Box", { layout: { width: "80%" } })])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Responsive" }));
    fireEvent.click(
      view
        .getAllByText("Tablet · 768–1023px · inherits Design", { exact: true })
        .at(-1)!
    );
    fireEvent.click(
      view.getAllByText("Layout and size", { exact: true }).at(-1)!
    );
    const follow = await view.findByRole("button", {
      name: "Width: Use Design",
    });
    expect(follow.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(view.getByRole("button", { name: "Width: Fill parent" }));
    expect(follow.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(follow);
    expect(follow.getAttribute("aria-pressed")).toBe("true");
    const arrange = view.getByRole("button", {
      name: "Arrange content: Use Design",
    });
    expect(arrange.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(
      view.getByRole("button", { name: "Arrange content: Row →" })
    );
    expect(arrange.getAttribute("aria-pressed")).toBe("false");
    const wrap = view.getByRole("button", {
      name: "When items run out of room: Use Design",
    });
    fireEvent.click(
      view.getByRole("button", { name: "When items run out of room: Wrap" })
    );
    fireEvent.click(wrap);
    expect(wrap.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(arrange);
    expect(arrange.getAttribute("aria-pressed")).toBe("true");
  });
  it.each([
    [
      "Columns",
      "gridTemplateColumns",
      "minmax(0, 1.13fr) minmax(0, 1fr)",
      "Columns",
    ],
    ["Box", "width", "calc(100% - 42px)", "Width"],
  ])(
    "restores %s custom styling when its first edit is Default, including after a preview save",
    async (type, property, authoredValue, label) => {
      await page.viewport(1440, 900);
      let getPuck!: ReturnType<typeof useGetPuck>;
      const Capture = () => {
        getPuck = useGetPuck();
        return <></>;
      };
      const overrides = { header: Capture };
      const ui = { itemSelector: { index: 0, zone: "root:default-zone" } };
      const initial = data([
        recipeNode(type, { layout: { [property]: authoredValue } }, [
          recipeNode("Paragraph"),
          recipeNode("Paragraph"),
        ]),
      ]);
      function Preview() {
        const [saved, setSaved] = React.useState(initial);
        return provider(
          <DesignPreviewEditor
            config={config}
            data={saved}
            onChange={setSaved}
            overrides={overrides}
            ui={ui}
          />
        );
      }
      const view = render(<Preview />);
      fireEvent.click(await view.findByRole("tab", { name: "Design" }));
      expect(
        view
          .getByRole("button", { name: `${label}: Custom value` })
          .getAttribute("aria-pressed")
      ).toBe("true");
      fireEvent.click(view.getByRole("button", { name: `${label}: Default` }));
      await waitFor(() => expect(getPuck().history.hasPast).toBe(true));
      expect(
        getPuck().history.histories[0].state.data.content[0].props.layout[
          property
        ]
      ).toBe(authoredValue);
      await act(async () => getPuck().history.back());
      await waitFor(() => {
        expect(getPuck().selectedItem?.props.layout[property]).toBe(
          authoredValue
        );
        expect(
          view
            .getByRole("button", { name: `${label}: Custom value` })
            .getAttribute("aria-pressed")
        ).toBe("true");
      });
      fireEvent.click(
        view.getByRole("button", { name: `${label}: Custom value` })
      );
      fireEvent.click(view.getByRole("button", { name: "CSS / theme token" }));
      expect(
        (
          view.getByRole("textbox", {
            name: `${label} value`,
          }) as HTMLInputElement
        ).value
      ).toBe(authoredValue);
      await act(async () => getPuck().history.forward());
      await waitFor(() => {
        expect(getPuck().selectedItem?.props.layout[property]).toBe("");
        expect(
          view
            .getByRole("button", { name: `${label}: Default` })
            .getAttribute("aria-pressed")
        ).toBe("true");
      });
      await act(async () => getPuck().history.back());
      await waitFor(() =>
        expect(getPuck().selectedItem?.props.layout[property]).toBe(
          authoredValue
        )
      );
    }
  );
  it.each([
    {
      name: "Parent text",
      type: "Paragraph",
      props: { typography: { fontSize: "37px" } },
      path: ["typography", "fontSize"],
      before: "37px",
      after: "inherit",
      tab: "Design",
      groups: [],
      button: "Font size: Parent",
    },
    {
      name: "default spacing",
      type: "Box",
      props: { spacing: { paddingInlineStart: "3.25rem" } },
      path: ["spacing", "paddingInlineStart"],
      before: "3.25rem",
      after: "",
      tab: "Design",
      groups: ["Spacing"],
      button: "Padding: Default",
    },
    {
      name: "Use Design",
      type: "Box",
      props: { responsive: { tablet: { layout: { width: "61%" } } } },
      path: ["responsive", "tablet", "layout", "width"],
      before: "61%",
      after: "",
      tab: "Responsive",
      groups: ["Tablet · 768–1023px · inherits Design", "Layout and size"],
      button: "Width: Use Design",
    },
    {
      name: "a size preset",
      type: "Box",
      props: { layout: { width: "calc(100% - 42px)" } },
      path: ["layout", "width"],
      before: "calc(100% - 42px)",
      after: "fit-content",
      tab: "Design",
      groups: [],
      button: "Width: Fit content",
    },
  ])(
    "preserves the original value when the first preview edit selects $name",
    async (scenario) => {
      await page.viewport(1440, 900);
      let getPuck!: ReturnType<typeof useGetPuck>;
      const Capture = () => {
        getPuck = useGetPuck();
        return <></>;
      };
      const overrides = { header: Capture };
      const ui = { itemSelector: { index: 0, zone: "root:default-zone" } };
      const initial = data([recipeNode(scenario.type, scenario.props)]);
      const value = (props: Record<string, any>) =>
        scenario.path.reduce((node, key) => node?.[key], props);
      function Preview() {
        const [saved, setSaved] = React.useState(initial);
        return provider(
          <DesignPreviewEditor
            config={config}
            data={saved}
            onChange={setSaved}
            overrides={overrides}
            ui={ui}
          />
        );
      }
      const view = render(<Preview />);
      fireEvent.click(await view.findByRole("tab", { name: scenario.tab }));
      for (const group of scenario.groups)
        fireEvent.click(view.getAllByText(group, { exact: true }).at(-1)!);
      fireEvent.click(
        await view.findByRole("button", { name: scenario.button })
      );
      await waitFor(() => {
        expect(getPuck().history.hasPast).toBe(true);
        expect(
          value(getPuck().history.histories.at(-1)!.state.data.content[0].props)
        ).toBe(scenario.after);
      });
      expect(
        value(getPuck().history.histories[0].state.data.content[0].props)
      ).toBe(scenario.before);
      await act(async () => getPuck().history.back());
      await waitFor(() => {
        expect(value(getPuck().selectedItem!.props)).toBe(scenario.before);
        expect(
          view
            .getByRole("button", { name: scenario.button })
            .getAttribute("aria-pressed")
        ).toBe("false");
      });
      await act(async () => getPuck().history.forward());
      await waitFor(() =>
        expect(value(getPuck().selectedItem!.props)).toBe(scenario.after)
      );
    }
  );
  it("keeps the reviewed Heading, open controls, and history when undoing its size edit", async () => {
    await page.viewport(1440, 900);
    let getPuck!: ReturnType<typeof useGetPuck>;
    const Capture = () => {
      getPuck = useGetPuck();
      return <></>;
    };
    const view = render(
      provider(
        <Puck
          config={config}
          plugins={localEditorPlugins}
          overrides={{ header: Capture }}
          data={data([
            recipeNode("Columns", {}, [
              recipeNode("Heading", {
                as: "h1",
                typography: { fontSize: "32px" },
              }),
            ]),
          ])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    expect(localEditorPlugins.length).toBeGreaterThan(0);
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    fireEvent.click(
      view.getAllByText("Text defaults for children", { exact: true }).at(-1)!
    );
    fireEvent.click(view.getByRole("button", { name: "Weight: Bold" }));
    await waitFor(() =>
      expect(getPuck().history.histories.length).toBeGreaterThan(1)
    );
    fireEvent.click(view.getByRole("button", { name: "Review Heading" }));
    fireEvent.click(
      await view.findByRole("button", { name: "Font size: Custom value" })
    );
    fireEvent.change(view.getByRole("textbox", { name: "Font size value" }), {
      target: { value: "48" },
    });
    await waitFor(() =>
      expect(getPuck().history.histories.length).toBeGreaterThan(2)
    );
    const count = getPuck().history.histories.length;
    await act(async () => getPuck().history.back());
    await waitFor(() => {
      expect(getPuck().selectedItem?.type).toBe("Heading");
      expect(
        (
          view.getByRole("textbox", {
            name: "Font size value",
          }) as HTMLInputElement
        ).value
      ).toBe("32");
    });
    expect(getPuck().appState.ui.fieldTab).toBe("Design");
    expect(getComputedStyle(view.container.querySelector("h1")!).fontSize).toBe(
      "32px"
    );
    expect(getPuck().history.histories).toHaveLength(count);
    await act(async () => getPuck().history.forward());
    await waitFor(() =>
      expect(
        (
          view.getByRole("textbox", {
            name: "Font size value",
          }) as HTMLInputElement
        ).value
      ).toBe("48")
    );
    expect(getPuck().selectedItem?.type).toBe("Heading");
    expect(getPuck().history.histories).toHaveLength(count);
  });
  it("selects a Yext field and returns to editable static text", async () => {
    const view = render(
      <VisualEditorProvider
        templateProps={{ document: demoDocument }}
        entityFields={demoEntityFields}
      >
        <Puck
          config={config}
          data={data([recipeNode("Heading", { as: "h1" })])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      </VisualEditorProvider>
    );
    fireEvent.click(await view.findByRole("switch"));
    fireEvent.click(view.getAllByRole("combobox").at(-1)!);
    fireEvent.click(await view.findByRole("option", { name: "Headline" }));
    await waitFor(() =>
      expect(view.container.querySelector("h1")?.textContent).toBe(
        demoDocument.c_headline
      )
    );
    fireEvent.click(view.getByRole("switch"));
    const input = await view.findByRole("textbox");
    expect((input as HTMLInputElement).value).toBe("Your heading");
    fireEvent.change(input, { target: { value: "Edited static heading" } });
    fireEvent.blur(input);
    await waitFor(() =>
      expect(view.container.querySelector("h1")?.textContent).toBe(
        "Edited static heading"
      )
    );
  });
  it("lets Design change the columns on desktop and tablet while mobile stays stacked", async () => {
    const node = recipeNode(
      "Columns",
      { attributes: { htmlId: "visual-columns" } },
      [
        recipeNode("Paragraph"),
        recipeNode("Paragraph"),
        recipeNode("Paragraph"),
      ]
    );
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([node])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    fireEvent.click(
      await view.findByRole("button", { name: "Columns: Three equal columns" })
    );
    const columns = view.container.querySelector("#visual-columns")!;
    for (const width of [1440, 800]) {
      await page.viewport(width, 900);
      await waitFor(() =>
        expect(
          getComputedStyle(columns).gridTemplateColumns.split(" ").length
        ).toBe(3)
      );
    }
    await page.viewport(375, 900);
    await waitFor(() =>
      expect(
        getComputedStyle(columns).gridTemplateColumns.split(" ").length
      ).toBe(1)
    );
  });
  it("groups optional grid settings and lets the main spacing control replace individual gaps", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([
            recipeNode(
              "Columns",
              {
                attributes: { htmlId: "gap-grid" },
                layout: { rowGap: "30px", columnGap: "40px" },
              },
              [recipeNode("Paragraph"), recipeNode("Paragraph")]
            ),
          ])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    fireEvent.click(
      view.getAllByText("Fine-tune layout", { exact: true }).at(-1)!
    );
    const group = view.getByRole("group", {
      name: "Grid details",
    });
    expect(view.queryByText("Display and order", { exact: true })).toBeNull();
    const layoutGroup = group.closest(".sl-controls")!;
    expect(
      layoutGroup.querySelectorAll('[data-choice-property="arrangement"]')
    ).toHaveLength(1);
    expect(
      layoutGroup.querySelectorAll('[data-choice-property="display"]')
    ).toHaveLength(0);
    expect(
      layoutGroup.querySelectorAll('[data-choice-property="flexDirection"]')
    ).toHaveLength(0);
    expect(
      group.querySelector('[data-style-property="gridAutoFlow"]')
    ).toBeTruthy();
    const row = group.querySelector('[data-style-property="rowGap"]')!;
    const flow = group.querySelector('[data-style-property="gridAutoFlow"]')!;
    await waitFor(() =>
      expect(
        row.getBoundingClientRect().top - flow.getBoundingClientRect().bottom
      ).toBeGreaterThanOrEqual(20)
    );
    for (const button of group.querySelectorAll(".sl-choice"))
      expect(button.querySelector("svg, .sl-columns-preview")).toBeTruthy();
    for (const control of group.querySelectorAll<HTMLElement>(".sl-control")) {
      control.style.width = "297px";
      expect(control.scrollWidth).toBeLessThanOrEqual(control.clientWidth + 1);
    }
    fireEvent.click(
      view.getByRole("button", {
        name: "Space between items: Small",
      })
    );
    const grid = view.container.querySelector("#gap-grid")!;
    await waitFor(() => {
      expect(getComputedStyle(grid).rowGap).toBe("16px");
      expect(getComputedStyle(grid).columnGap).toBe("16px");
    });
  });
  it("lets a paragraph inherit text defaults from its Flex parent", () => {
    const node = recipeNode(
      "Flex",
      {
        typography: {
          fontSize: "30px",
          fontFamily: "monospace",
          fontWeight: "700",
          lineHeight: "1.8",
          color: "rgb(80, 30, 160)",
        },
      },
      [
        recipeNode("Paragraph", {
          attributes: { htmlId: "inherited-paragraph" },
        }),
      ]
    );
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    const paragraph = view.container.querySelector("#inherited-paragraph")!;
    expect(getComputedStyle(paragraph).fontSize).toBe("30px");
    expect(getComputedStyle(paragraph).fontFamily).toContain("monospace");
    expect(getComputedStyle(paragraph).fontWeight).toBe("700");
  });
  it("applies flex item growth to the same element in the editor and published output", async () => {
    await page.viewport(1440, 900);
    const node = recipeNode(
      "Flex",
      {
        attributes: { htmlId: "flex-parent" },
        layout: { width: "600px", flexWrap: "nowrap" },
      },
      [
        recipeNode("Paragraph", {
          attributes: { htmlId: "growing-item" },
          layout: { flexGrow: "1" },
        }),
        recipeNode("Paragraph", {
          layout: { width: "100px", flexShrink: "0" },
        }),
      ]
    );
    const saved = data([node]);
    const view = render(
      provider(
        <Puck
          fieldTransforms={createYextFieldTransforms({ locale: "en" }, "en")}
          config={config}
          data={saved}
          iframe={{ enabled: false }}
        />
      )
    );
    const growing = await waitFor(() => {
      const node = view.container.querySelector("#growing-item");
      expect(node).toBeTruthy();
      return node!;
    });
    expect(growing.parentElement?.id).toBe("flex-parent");
    const editedWidth = parseFloat(getComputedStyle(growing).width);
    expect(editedWidth).toBeGreaterThan(400);
    view.unmount();
    const published = render(provider(<Render config={config} data={saved} />));
    expect(
      parseFloat(
        getComputedStyle(published.container.querySelector("#growing-item")!)
          .width
      )
    ).toBeCloseTo(editedWidth, 1);
  });
  it("uses authored positioning in the editor and published page", async () => {
    const node = recipeNode(
      "Box",
      {
        attributes: { htmlId: "positioned-box" },
        position: { position: "sticky", insetBlockStart: "12px" },
      },
      [recipeNode("Paragraph")]
    );
    const saved = data([node]);
    const view = render(
      provider(
        <Puck config={config} data={saved} iframe={{ enabled: false }} />
      )
    );
    const box = await waitFor(() => {
      const element = view.container.querySelector("#positioned-box");
      expect(element).toBeTruthy();
      return element!;
    });
    expect(getComputedStyle(box).position).toBe("sticky");
    expect(getComputedStyle(box).top).toBe("12px");
    view.unmount();
    const published = render(provider(<Render config={config} data={saved} />));
    expect(
      getComputedStyle(published.container.querySelector("#positioned-box")!)
        .position
    ).toBe("sticky");
  });
  it("hides container and flex-item options on a root paragraph", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Paragraph")])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    fireEvent.click(view.getAllByText("Layout and size").at(-1)!);
    fireEvent.click(view.getAllByText("Fine-tune layout").at(-1)!);
    expect(view.queryAllByText("Grow in parent", { exact: true })).toHaveLength(
      0
    );
    expect(view.queryAllByText("Grid columns", { exact: true })).toHaveLength(
      0
    );
  });
  it("uses the parent's computed text style even for relative sizes and a mobile inherit exception", async () => {
    const node = recipeNode(
      "Box",
      {
        attributes: { htmlId: "type-parent" },
        typography: { fontSize: "2em", fontFamily: "monospace" },
      },
      [
        recipeNode("Heading", {
          attributes: { htmlId: "parent-heading" },
          typography: { fontSize: "40px", fontFamily: "inherit" },
          responsive: { mobile: { typography: { fontSize: "inherit" } } },
        }),
      ]
    );
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    const heading = view.container.querySelector("#parent-heading")!;
    const parent = view.container.querySelector("#type-parent")!;
    await page.viewport(1440, 900);
    expect(getComputedStyle(heading).fontSize).toBe("40px");
    expect(getComputedStyle(heading).fontFamily).toBe(
      getComputedStyle(parent).fontFamily
    );
    await page.viewport(375, 900);
    expect(getComputedStyle(heading).fontSize).toBe(
      getComputedStyle(parent).fontSize
    );
  });
  it("applies grid spans to the actual child element in the editor", async () => {
    await page.viewport(1440, 900);
    const node = recipeNode(
      "Columns",
      {
        attributes: { htmlId: "span-grid" },
        layout: { width: "600px", gap: "16px" },
      },
      [
        recipeNode("Paragraph", {
          attributes: { htmlId: "spanned-item" },
          layout: { gridColumn: "1 / -1" },
        }),
        recipeNode("Paragraph"),
      ]
    );
    const view = render(
      provider(
        <Puck config={config} data={data([node])} iframe={{ enabled: false }} />
      )
    );
    const item = await waitFor(() => {
      const node = view.container.querySelector("#spanned-item");
      expect(node).toBeTruthy();
      return node!;
    });
    expect(item.parentElement?.id).toBe("span-grid");
    expect(parseFloat(getComputedStyle(item).width)).toBeCloseTo(600, 1);
  });
  it("does not show typography controls for an image", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Image", { decorative: true })])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    expect(view.queryAllByText("Typography", { exact: true })).toHaveLength(0);
    expect(
      await view.findByRole("button", { name: "Image fit: Fill & crop" })
    ).toBeTruthy();
  });
  it("makes choosing a border thickness visibly add a border", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([
            recipeNode("Image", {
              decorative: true,
              attributes: { htmlId: "border-image" },
              surface: { borderStyle: "none" },
            }),
          ])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    fireEvent.click(
      view.getAllByText("Fine-tune appearance", { exact: true }).at(-1)!
    );
    fireEvent.click(
      await view.findByRole("button", { name: "Border thickness: Thin" })
    );
    await waitFor(() => {
      const image = view.container.querySelector("#border-image")!;
      expect(getComputedStyle(image).borderTopStyle).toBe("solid");
      expect(getComputedStyle(image).borderTopWidth).toBe("1px");
    });
  });
  it("uses a button-specific label alignment control on the actual button", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Button", { layout: { width: "300px" } })])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    fireEvent.click(view.getAllByText("Layout and size").at(-1)!);
    fireEvent.click(
      await view.findByRole("button", { name: "Label alignment: Start" })
    );
    await waitFor(() =>
      expect(
        getComputedStyle(view.container.querySelector(".sl-button")!)
          .justifyContent
      ).toBe("start")
    );
  });
  it("keeps decorative icons discoverable as editor controls while hiding them on published pages", async () => {
    const tree = data([recipeNode("Icon")]);
    const view = render(
      provider(<Puck config={config} data={tree} iframe={{ enabled: false }} />)
    );
    const icon = await waitFor(() => {
      const node = view.container.querySelector(".sl-atom");
      expect(node).toBeTruthy();
      return node!;
    });
    expect(icon.getAttribute("aria-hidden")).not.toBe("true");
    expect(icon.getAttribute("aria-label")).toContain("icon");
    view.unmount();
    const published = render(provider(<Render config={config} data={tree} />));
    expect(
      published.container.querySelector(".sl-atom")!.getAttribute("aria-hidden")
    ).toBe("true");
  });
});
