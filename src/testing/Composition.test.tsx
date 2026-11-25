import { DesignPreviewEditor } from "./DesignPreviewEditor.tsx";
import { localEditorPlugins } from "./editorPlugins.ts";
import { demoDocument, demoEntityFields } from "./designDemoData.ts";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
import { page, userEvent } from "@vitest/browser/context";
import { axe } from "jest-axe";
import { toPuckFields } from "@yext/visual-editor";
import { testSetup } from "./componentTests.setup.ts";
import { VisualEditorProvider } from "./TestVisualEditorProvider.tsx";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import { recipeNode } from "../library/shared/design/recipes.ts";
import { automaticTypographyValue } from "../library/shared/design/controlContent.ts";
import { typographyPresetValue } from "../library/shared/design/theme.ts";
import { ThemeSurfaceProvider } from "../library/shared/design/ThemeSurfaceProvider.tsx";
import { ControlPreview } from "../library/shared/design/ControlPreview.tsx";
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

  it("uses an authored gradient for text and links independently of Primary", async () => {
    const linkColors = {
      navigationLinkDefaultTextColor: "#112233",
      navigationLinkDefaultTextColorOnDark: "#ffeedd",
    };
    testSetup({
      colorPrimary: "#0046be",
      colorPrimaryForeground: "#fff",
      ...linkColors,
    });
    const node = recipeNode(
      "Box",
      {
        surfaceRole: "primary",
        surface: {
          backgroundImage:
            "linear-gradient(90deg, #061e72 0%, #0046be 50%, #061e72 100%)",
        },
        responsive: {
          mobile: {
            surface: { backgroundImage: "none", backgroundColor: "#fff" },
          },
        },
      },
      [
        recipeNode("Heading", { as: "h2" }),
        recipeNode("Button", { interactionRole: "navigation-link" }),
        recipeNode("Card", {}, [
          recipeNode("Button", { interactionRole: "navigation-link" }),
        ]),
      ]
    );
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    const heading = view.getByRole("heading", { level: 2 });
    const [link, cardLink] = view.getAllByRole("link", { name: "Learn more" });

    await page.viewport(1280, 800);
    const surface = view.container.querySelector(".sl-surface-primary")!;
    const paintedGradient = getComputedStyle(surface).backgroundImage;
    expect(paintedGradient).toContain("linear-gradient");
    expect(getComputedStyle(heading).color).toBe("rgb(255, 255, 255)");
    expect(getComputedStyle(link).color).toBe("rgb(255, 238, 221)");

    testSetup({
      colorPrimary: "#fff200",
      colorPrimaryForeground: "#000",
      ...linkColors,
    });
    expect(getComputedStyle(surface).backgroundImage).toBe(paintedGradient);
    expect(getComputedStyle(heading).color).toBe("rgb(255, 255, 255)");
    expect(getComputedStyle(link).color).toBe("rgb(255, 238, 221)");
    expect(getComputedStyle(cardLink).color).toBe("rgb(17, 34, 51)");

    await page.viewport(375, 800);
    expect(getComputedStyle(surface).backgroundImage).toBe("none");
    expect(getComputedStyle(heading).color).toBe("rgb(0, 0, 0)");
    expect(getComputedStyle(link).color).toBe("rgb(17, 34, 51)");
  });

  it("uses the responsive theme surface for inherited text and interaction colors", async () => {
    const theme = {
      colorPrimary: "#112233",
      colorPrimaryForeground: "#ffeedd",
      colorForeground: "#101010",
      navigationLinkDefaultTextColor: "#334455",
      navigationLinkDefaultTextColorOnDark: "#eeffee",
    };
    testSetup(theme);
    const node = recipeNode(
      "Box",
      {
        surface: { backgroundColor: "var(--ve-color-background)" },
        responsive: {
          mobile: { surface: { backgroundColor: "var(--ve-color-primary)" } },
        },
      },
      [
        recipeNode("Heading", { as: "h2" }),
        recipeNode("Button", { interactionRole: "navigation-link" }),
        recipeNode("Card", {}, [
          recipeNode("Button", { interactionRole: "navigation-link" }),
        ]),
      ]
    );
    const view = render(
      provider(
        <ThemeSurfaceProvider>
          <Render config={config} data={data([node])} />
        </ThemeSurfaceProvider>
      )
    );
    const heading = view.getByRole("heading", { level: 2 });
    const [link, cardLink] = view.getAllByRole("link", { name: "Learn more" });
    await page.viewport(1280, 800);
    expect(getComputedStyle(heading).color).toBe("rgb(16, 16, 16)");
    expect(getComputedStyle(link).color).toBe("rgb(51, 68, 85)");
    await page.viewport(375, 800);
    expect(getComputedStyle(heading).color).toBe("rgb(255, 238, 221)");
    expect(getComputedStyle(link).color).toBe("rgb(238, 255, 238)");
    expect(getComputedStyle(cardLink).color).toBe("rgb(51, 68, 85)");
    testSetup({
      ...theme,
      colorPrimary: "#fff200",
      colorPrimaryForeground: "#171717",
    });
    await waitFor(() =>
      expect(getComputedStyle(link).color).toBe("rgb(51, 68, 85)")
    );
    expect(getComputedStyle(heading).color).toBe("rgb(23, 23, 23)");
  });

  it("updates foregrounds when a surface or a button paints a different background", async () => {
    testSetup({
      colorForeground: "#171717",
      navigationLinkDefaultTextColor: "#112233",
      navigationLinkDefaultTextColorOnDark: "#eeeeee",
      primaryButtonDefaultTextColor: "#191919",
    });
    const node = recipeNode(
      "Box",
      {
        surfaceRole: "page",
        attributes: { htmlId: "changing-background" },
        states: { hover: { surface: { backgroundColor: "#000" } } },
      },
      [
        recipeNode("Heading", { as: "h2" }),
        recipeNode("Button", { interactionRole: "navigation-link" }),
        recipeNode("Button", {
          action: "button",
          surface: { backgroundColor: "#000" },
        }),
      ]
    );
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    const surface = view.container.querySelector("#changing-background")!;
    const heading = view.getByRole("heading", { level: 2 });
    const link = view.getByRole("link", { name: "Learn more" });
    const button = view.getByRole("button", { name: "Learn more" });
    await userEvent.unhover(surface);
    expect(getComputedStyle(heading).color).toBe("rgb(23, 23, 23)");
    expect(getComputedStyle(button).color).toBe("rgb(255, 255, 255)");
    await userEvent.hover(surface);
    expect(getComputedStyle(surface).backgroundColor).toBe("rgb(0, 0, 0)");
    expect(getComputedStyle(heading).color).toBe("rgb(255, 255, 255)");
    expect(getComputedStyle(link).color).toBe("rgb(238, 238, 238)");
  });

  it("keeps a hover override when the button also receives keyboard focus", async () => {
    const node = recipeNode("Button", {
      action: "button",
      typography: { color: "#112233" },
      states: {
        hover: { typography: { color: "#556677" } },
        focusVisible: { surface: { borderColor: "#ddaa33" } },
      },
    });
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    const button = view.getByRole("button", { name: "Learn more" });
    await userEvent.hover(button);
    expect(getComputedStyle(button).color).toBe("rgb(85, 102, 119)");
    await userEvent.tab();
    expect(button.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(button).borderTopColor).toBe("rgb(221, 170, 51)");
    expect(getComputedStyle(button).color).toBe("rgb(85, 102, 119)");
  });

  it("uses a solid sample of the page gradient for text, borders, and their swatches", async () => {
    const pageColor = "var(--ve-color-background)";
    testSetup({
      colorBackground: "linear-gradient(90deg, #123456 0%, #abcdef 100%)",
    });
    const node = recipeNode(
      "Box",
      {
        attributes: { htmlId: "page-gradient-surface" },
        surface: {
          backgroundColor: pageColor,
          borderColor: pageColor,
          borderStyle: "solid",
          borderWidth: "2px",
        },
      },
      [recipeNode("Heading", { as: "h2", typography: { color: pageColor } })]
    );
    const view = render(
      provider(
        <>
          <div data-testid="page-color-swatch">
            <ControlPreview property="borderColor" value={pageColor} />
          </div>
          <ThemeSurfaceProvider>
            <Render config={config} data={data([node])} />
          </ThemeSurfaceProvider>
        </>
      )
    );
    const surface = view.container.querySelector("#page-gradient-surface")!;
    const heading = view.getByRole("heading", { level: 2 });
    const swatch = view.getByTestId("page-color-swatch").querySelector("span")!;
    expect(getComputedStyle(surface).backgroundImage).toContain(
      "linear-gradient"
    );
    expect(getComputedStyle(surface).borderTopColor).toBe("rgb(18, 52, 86)");
    expect(getComputedStyle(heading).color).toBe("rgb(18, 52, 86)");
    expect(getComputedStyle(swatch).backgroundColor).toBe("rgb(18, 52, 86)");
    testSetup({ colorBackground: "#456789" });
    await waitFor(() =>
      expect(getComputedStyle(heading).color).toBe("rgb(69, 103, 137)")
    );
    expect(getComputedStyle(swatch).backgroundColor).toBe("rgb(69, 103, 137)");
  });

  it("uses the chosen theme background and distinguishes automatic link color from inheritance", async () => {
    testSetup({
      colorMuted: "#222",
      colorMutedForeground: "#fff",
      navigationLinkDefaultTextColorOnDark: "#ffeedd",
    });
    const node = recipeNode(
      "Box",
      { surface: { backgroundColor: "var(--ve-color-muted)" } },
      [
        recipeNode("Heading", { as: "h2" }),
        recipeNode("Button", {
          interactionRole: "navigation-link",
          typography: { color: "inherit" },
          responsive: {
            mobile: {
              typography: { color: automaticTypographyValue("color") },
            },
          },
        }),
      ]
    );
    const view = render(
      provider(<Render config={config} data={data([node])} />)
    );
    const surface = view.container.querySelector(".sl-surface-muted")!;
    const link = view.getByRole("link", { name: "Learn more" });
    expect(getComputedStyle(surface).backgroundColor).toBe("rgb(34, 34, 34)");
    expect(getComputedStyle(view.getByRole("heading")).color).toBe(
      "rgb(255, 255, 255)"
    );
    await page.viewport(1280, 800);
    expect(getComputedStyle(link).color).toBe("rgb(255, 255, 255)");
    await page.viewport(375, 800);
    expect(getComputedStyle(link).color).toBe("rgb(255, 238, 221)");
  });

  it("borrows a responsive size from another style while keeping the starting style", async () => {
    const theme = {
      headlineFontFamily: "Georgia",
      headlineFontWeight: "800",
      headlineFontSize: 48,
      headlineMobileFontSize: 33,
      sectionTitleFontSize: 40,
      sectionTitleMobileFontSize: 26,
      navigationLinkDefaultTextColor: "#114477",
    };
    testSetup(theme);
    const node = recipeNode(
      "Box",
      { typography: { fontSize: "20px", fontWeight: "500" } },
      [
        recipeNode("Heading", {
          as: "h1",
          typographyRole: "headline",
          typography: {
            fontSize: typographyPresetValue("section-title", "font-size"),
          },
        }),
        recipeNode("Heading", { as: "h2", typographyRole: "inherit" }),
        recipeNode("RichText", { typographyRole: "inherit" }),
        recipeNode("Button", {
          interactionRole: "navigation-link",
          typographyRole: "headline",
          typography: { fontSize: "46px", letterSpacing: "1px" },
          responsive: {
            mobile: {
              typography: { fontSize: automaticTypographyValue("font-size") },
            },
          },
        }),
      ]
    );
    const resolved = await resolveAllData(data([node]), config, {
      streamDocument: { locale: "en" },
    });
    const linkProps = resolved.content[0].props.content[3].props;
    expect(linkProps.typographyRole).toBeUndefined();
    expect(linkProps.responsive.mobile.typography.fontSize).toBe(
      typographyPresetValue("headline", "font-size")
    );
    const view = render(provider(<Render config={config} data={resolved} />));
    const heading = view.getByRole("heading", { level: 1 });
    const inheritedHeading = view.getByRole("heading", { level: 2 });
    const inheritedRichText = view.container.querySelector(".sl-rich-text p")!;
    const link = view.getByRole("link", { name: "Learn more" });
    await page.viewport(1280, 800);
    expect(getComputedStyle(heading).fontSize).toBe("40px");
    expect(getComputedStyle(heading).fontFamily).toBe("Georgia");
    expect(getComputedStyle(heading).fontWeight).toBe("800");
    expect(getComputedStyle(inheritedHeading).fontSize).toBe("20px");
    expect(getComputedStyle(inheritedHeading).fontWeight).toBe("500");
    expect(getComputedStyle(inheritedRichText).fontSize).toBe("20px");
    expect(getComputedStyle(link).fontSize).toBe("46px");
    expect(getComputedStyle(link).fontWeight).toBe("800");
    expect(getComputedStyle(link).letterSpacing).toBe("1px");
    expect(getComputedStyle(link).color).toBe("rgb(17, 68, 119)");
    // 700px is inside the editor's Mobile range, above the old theme breakpoint.
    await page.viewport(700, 800);
    expect(getComputedStyle(heading).fontSize).toBe("26px");
    expect(getComputedStyle(link).fontSize).toBe("33px");
    testSetup({ ...theme, sectionTitleMobileFontSize: 30 });
    expect(getComputedStyle(heading).fontSize).toBe("30px");
  });

  it("shows color choices for their specific field and clears text to Automatic", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <DesignPreviewEditor
          config={config}
          data={data([
            recipeNode("Box", { surface: { borderStyle: "solid" } }),
          ])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    for (const label of [
      "Text defaults for children",
      "Background, border and image",
    ])
      fireEvent.click(view.getAllByText(label, { exact: true }).at(-1)!);
    const automatic = view.getByRole("button", {
      name: "Text color: Automatic",
    });
    const inherit = view.getByRole("button", { name: "Text color: Inherit" });
    expect(automatic.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(inherit);
    expect(inherit.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(automatic);
    expect(automatic.getAttribute("aria-pressed")).toBe("true");
    for (const name of [
      "Background color: Inherit",
      "Background color: Transparent",
      "Background color: Primary background",
      "Text color: Primary background",
      "Text color: Primary foreground",
      "Border color: Border",
    ])
      expect(view.getByRole("button", { name })).toBeTruthy();
    for (const name of [
      "Background color: Default",
      "Background color: Primary foreground",
      "Background color: Border",
      "Text color: Transparent",
      "Text color: Border",
      "Text color: Current text color",
    ])
      expect(view.queryByRole("button", { name })).toBeNull();
    const primaryBackground = view.getByRole("button", {
      name: "Background color: Primary background",
    });
    fireEvent.click(primaryBackground);
    expect(primaryBackground.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(
      view.getByRole("button", { name: "Clear background override" })
    );
    expect(primaryBackground.getAttribute("aria-pressed")).toBe("false");
  });

  it("uses a manual contrast setting for a mixed gradient on a section preset", () => {
    testSetup({ colorForeground: "#112233" });
    const props = {
      ...publicComponents.BannerSection.defaultProps,
      surfaceRole: "page",
      surface: { backgroundImage: "linear-gradient(#000, #fff, #000)" },
      content: [recipeNode("Heading", { as: "h2" })],
    };
    const view = render(
      provider(
        <Render
          config={config}
          data={data([{ type: "BannerSection", props }])}
        />
      )
    );
    expect(getComputedStyle(view.getByRole("heading")).color).toBe(
      "rgb(17, 34, 51)"
    );
    view.rerender(
      provider(
        <Render
          config={config}
          data={data([
            {
              type: "BannerSection",
              props: { ...props, backgroundContrast: "dark" },
            },
          ])}
        />
      )
    );
    expect(getComputedStyle(view.getByRole("heading")).color).toBe(
      "rgb(255, 255, 255)"
    );
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
    const summary = details.querySelector("summary")!;
    expect(summary.hasAttribute("data-puck-overlay-portal")).toBe(false);
    expect(details.open).toBe(false);
    fireEvent.click(summary);
    expect(details.open).toBe(true);
  });

  it("toggles an initially revealed disclosure through its Puck overlay portal", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Disclosure", {}, [recipeNode("Paragraph")])])}
          iframe={{ enabled: false }}
        />
      )
    );
    const summary = await view.findByText("Your question", {
      selector: "summary",
    });
    const details = summary.closest("details")!;
    expect(details.open).toBe(true);
    expect(summary.getAttribute("data-puck-overlay-portal")).toBe("true");
    expect(details.hasAttribute("data-puck-overlay-portal")).toBe(false);

    await act(async () => userEvent.click(summary));
    expect(details.open).toBe(false);
    await act(async () => {
      summary.focus();
      await userEvent.keyboard("{Enter}");
    });
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
  it("shows typography styles and keeps custom sizing open when choosing a preset or Inherit", async () => {
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
    const typographyStyle = view.getByRole("combobox", {
      name: "Typography Style",
    }) as HTMLSelectElement;
    const styleOptions = Array.from(typographyStyle.options);
    expect(styleOptions.map((option) => option.label)).toEqual([
      "Inherit",
      "Headline",
      "Section title",
      "Card title",
      "Eyebrow",
      "Body small",
      "Body",
      "Body large",
    ]);
    await waitFor(() =>
      expect(typographyStyle.selectedOptions[0].label).toBe("Headline")
    );
    fireEvent.change(typographyStyle, {
      target: {
        value: styleOptions.find(({ label }) => label === "Section title")!
          .value,
      },
    });
    await waitFor(() =>
      expect(
        view.container.querySelector("h1.sl-type-section-title")
      ).toBeTruthy()
    );
    fireEvent.change(typographyStyle, {
      target: {
        value: styleOptions.find(({ label }) => label === "Headline")!.value,
      },
    });
    await waitFor(() =>
      expect(view.container.querySelector("h1.sl-type-headline")).toBeTruthy()
    );
    const defaultSize = view.getByRole("button", {
      name: "Font size: Default",
    });
    expect(defaultSize.getAttribute("aria-pressed")).toBe("true");
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
    fireEvent.click(view.getByRole("button", { name: "Font size: Inherit" }));
    expect(
      view.getByText(
        "Currently follows the parent text style. Enter a value to override it."
      )
    ).toBeTruthy();
    expect(
      view
        .getByRole("button", { name: "Font size: Inherit" })
        .getAttribute("aria-pressed")
    ).toBe("true");
    expect(view.getByRole("textbox", { name: "Font size value" })).toBe(input);
    fireEvent.click(defaultSize);
    expect(defaultSize.getAttribute("aria-pressed")).toBe("true");
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
      name: "inherited text",
      type: "Paragraph",
      props: { typography: { fontSize: "37px" } },
      path: ["typography", "fontSize"],
      before: "37px",
      after: "inherit",
      tab: "Design",
      groups: [],
      button: "Font size: Inherit",
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
    fireEvent.click(view.getByRole("button", { name: "Weight: Headline" }));
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
  it("keeps an absolute image behind overlay text in the editor and preview", async () => {
    const saved = data([
      recipeNode(
        "Box",
        {
          layout: { width: "240px", height: "160px" },
          position: { position: "relative" },
        },
        [
          recipeNode("Image", {
            attributes: { htmlId: "overlay-image" },
            data: {
              image: {
                field: "",
                constantValue: {
                  url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160'/%3E",
                  width: 240,
                  height: 160,
                },
                constantValueEnabled: true,
              },
            },
            layout: { height: "100%" },
            position: {
              position: "absolute",
              insetBlockStart: "0px",
              insetInlineStart: "0px",
              zIndex: "0",
            },
          }),
          recipeNode("Heading", {
            attributes: { htmlId: "overlay-heading" },
            position: { position: "relative", zIndex: "1" },
          }),
        ]
      ),
      recipeNode("Box", { attributes: { htmlId: "overlay-drop-target" } }),
    ]);
    let getPuck!: ReturnType<typeof useGetPuck>;
    function Capture() {
      getPuck = useGetPuck();
      return <></>;
    }
    const view = render(
      provider(
        <Puck
          config={config}
          data={saved}
          iframe={{ enabled: false }}
          overrides={{ header: Capture }}
          dnd={{ enableDragHandle: true }}
        />
      )
    );
    const editedImage = await waitFor(() => {
      const image = view.container.querySelector<HTMLImageElement>(
        "#overlay-image[data-puck-dnd]"
      );
      expect(image).toBeTruthy();
      return image!;
    });
    const checkOverlay = (container: HTMLElement) => {
      const image =
        container.querySelector<HTMLImageElement>("#overlay-image")!;
      const heading = container.querySelector<HTMLElement>("#overlay-heading")!;
      expect(getComputedStyle(image).position).toBe("absolute");
      expect(getComputedStyle(image).zIndex).toBe("0");
      expect(getComputedStyle(heading).zIndex).toBe("1");
      const imageBounds = image.getBoundingClientRect();
      const headingBounds = heading.getBoundingClientRect();
      expect(headingBounds.bottom).toBeGreaterThan(imageBounds.top);
      expect(headingBounds.top).toBeLessThan(imageBounds.bottom);
    };
    checkOverlay(view.container);
    await act(async () =>
      userEvent.click(editedImage, { position: { x: 20, y: 130 } })
    );
    expect(getPuck().selectedItem?.type).toBe("Image");
    const dropTarget = view.container.querySelector(
      "#overlay-drop-target[data-puck-dropzone]"
    )!;
    const dragHandle = view.getByRole("button", { name: "Drag to reorder" });
    const dragStarted = vi.fn();
    const observer = new MutationObserver(dragStarted);
    observer.observe(editedImage.closest("[data-puck-entry]")!, {
      attributeFilter: ["data-puck-dragging"],
    });
    try {
      await act(async () => userEvent.dragAndDrop(dragHandle, dropTarget));
      expect(dragStarted).toHaveBeenCalled();
    } finally {
      observer.disconnect();
    }

    view.unmount();
    const preview = render(provider(<Render config={config} data={saved} />));
    checkOverlay(preview.container);
  });
  it("keeps responsive header navigation collapsed and in flow while editing", async () => {
    await page.viewport(1280, 900);
    const saved = data([
      recipeNode(
        "Box",
        {
          as: "header",
          position: {
            position: "sticky",
            insetBlockStart: "12px",
            zIndex: "10",
          },
        },
        [
          recipeNode(
            "Flex",
            {
              as: "nav",
              attributes: { htmlId: "desktop-navigation" },
              revealWhenHiddenInEditor: false,
              responsive: { mobile: { layout: { display: "none" } } },
            },
            [recipeNode("Paragraph")]
          ),
          recipeNode(
            "Disclosure",
            {
              revealWhenHiddenInEditor: false,
              layout: { display: "none" },
              responsive: { mobile: { layout: { display: "block" } } },
            },
            [recipeNode("Paragraph")]
          ),
        ]
      ),
    ]);
    const view = render(
      provider(
        <Puck config={config} data={saved} iframe={{ enabled: false }} />
      )
    );
    const { header, desktopNav, mobileMenu } = await waitFor(() => {
      const header = view.container.querySelector("header.sl-atom")!;
      const desktopNav = header?.querySelector("#desktop-navigation")!;
      const mobileMenu = header?.querySelector("details")!;
      expect(desktopNav).toBeTruthy();
      expect(mobileMenu).toBeTruthy();
      return { header, desktopNav, mobileMenu };
    });
    expect(getComputedStyle(header).position).toBe("relative");
    expect(getComputedStyle(header).zIndex).toBe("auto");
    expect(getComputedStyle(desktopNav).display).toBe("flex");
    expect(getComputedStyle(mobileMenu).display).toBe("none");

    await page.viewport(390, 900);
    expect(getComputedStyle(desktopNav).display).toBe("none");
    expect(getComputedStyle(mobileMenu).display).toBe("block");
    expect(mobileMenu.open).toBe(false);
    const summary = mobileMenu.querySelector("summary")!;
    fireEvent.click(summary);
    expect(mobileMenu.open).toBe(true);
    fireEvent.click(summary);
    expect(mobileMenu.open).toBe(false);

    view.unmount();
    const published = render(provider(<Render config={config} data={saved} />));
    const publishedHeader = published.container.querySelector("header")!;
    expect(getComputedStyle(publishedHeader).position).toBe("sticky");
    expect(getComputedStyle(publishedHeader).top).toBe("12px");
    const publishedMenu = publishedHeader.querySelector("details")!;
    expect(publishedMenu.open).toBe(false);
    fireEvent.click(publishedMenu.querySelector("summary")!);
    expect(publishedMenu.open).toBe(true);
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
    expect(
      view
        .getByRole("button", { name: "Corners: Theme image radius" })
        .getAttribute("aria-pressed")
    ).toBe("true");
  });
  it("applies the theme focus ring to a linked image", async () => {
    testSetup({ colorFocusRing: "#234567" });
    const image = recipeNode("Image");
    image.props.data.link = { defaultValue: "#details" };
    const view = render(
      provider(<Render config={config} data={data([image])} />)
    );
    const link = view.getByRole("link");
    await userEvent.tab();
    expect(link.matches(":focus-visible")).toBe(true);
    const style = getComputedStyle(link);
    expect(style.outlineColor).toBe("rgb(35, 69, 103)");
    expect(style.outlineStyle).toBe("solid");
  });

  it("offers theme section spacing for both vertical sides and preserves horizontal padding", async () => {
    await page.viewport(1440, 900);
    testSetup({ pageSectionVerticalSpacing: 52 });
    const node = recipeNode("Box", {
      attributes: { htmlId: "section-spacing" },
      spacing: {
        paddingBlockStart: "8px",
        paddingInlineStart: "13px",
        paddingInlineEnd: "15px",
      },
    });
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
    fireEvent.click(view.getAllByText("Spacing", { exact: true }).at(-1)!);
    fireEvent.click(
      await view.findByRole("button", {
        name: "Padding: Theme section spacing",
      })
    );
    await waitFor(() => {
      const style = getComputedStyle(
        view.container.querySelector("#section-spacing")!
      );
      expect(style.padding).toBe("52px 15px 52px 13px");
    });
    fireEvent.click(
      view.getAllByRole("button", { name: /Set individual sides/ })[0]
    );
    expect(
      view
        .getByRole("button", { name: "Top: Theme section spacing" })
        .getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      view
        .getByRole("button", { name: "Bottom: Theme section spacing" })
        .getAttribute("aria-pressed")
    ).toBe("true");
  });
  it("names the theme radius and border weight on Card controls", async () => {
    await page.viewport(1440, 900);
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Card")])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    fireEvent.click(
      view.getAllByText("Background, border and image", { exact: true }).at(-1)!
    );
    for (const name of [
      "Corners: Theme card radius",
      "Border thickness: Theme card border weight",
    ]) {
      expect(
        view.getByRole("button", { name }).getAttribute("aria-pressed")
      ).toBe("true");
    }
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
  it("selects an interaction preset and overrides one typography setting at a time", async () => {
    await page.viewport(1440, 900);
    testSetup({
      headlineFontSize: 42,
      secondaryButtonFontSize: 18,
      secondaryButtonDefaultFontWeight: "600",
      secondaryButtonDefaultBackgroundColor: "#224466",
    });
    const view = render(
      provider(
        <Puck
          config={config}
          data={data([recipeNode("Button")])}
          iframe={{ enabled: false }}
          ui={{ itemSelector: { index: 0, zone: "root:default-zone" } }}
        />
      )
    );
    fireEvent.click(await view.findByRole("tab", { name: "Design" }));
    expect(
      view.queryByRole("combobox", { name: "Typography Style" })
    ).toBeNull();
    fireEvent.click(
      view.getAllByText("Interaction states", { exact: true }).at(-1)!
    );
    expect(
      await view.findAllByText("Pressed", { exact: true })
    ).not.toHaveLength(0);
    const interaction = view.getByRole("combobox", {
      name: "Theme interaction style",
    }) as HTMLSelectElement;
    const options = Array.from(interaction.options);
    expect(options.map((option) => option.label)).toEqual([
      "Primary button",
      "Secondary button",
      "Link",
      "Navigation link",
    ]);
    fireEvent.change(interaction, {
      target: {
        value: options.find((option) => option.label === "Secondary button")!
          .value,
      },
    });
    const style = () =>
      getComputedStyle(view.container.querySelector(".sl-button")!);
    await waitFor(() =>
      expect(style().backgroundColor).toBe("rgb(34, 68, 102)")
    );
    expect(style().fontSize).toBe("18px");
    expect(
      view.getByRole("button", { name: "Border color: Border" })
    ).toBeTruthy();
    fireEvent.click(view.getAllByText("Typography", { exact: true }).at(-1)!);
    fireEvent.click(
      await view.findByRole("button", { name: "Font size: Headline" })
    );
    await waitFor(() => expect(style().fontSize).toBe("42px"));
    expect(style().fontWeight).toBe("600");
    expect(style().backgroundColor).toBe("rgb(34, 68, 102)");
    fireEvent.click(view.getByRole("button", { name: "Font size: Default" }));
    await waitFor(() => expect(style().fontSize).toBe("18px"));
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
