import "@yext/visual-editor/editor.css";
import defaultLayout from "../../library/layouts/standard-library/defaultLayout.json";
import "../componentTests.css";
import React from "react";
import { describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { z } from "zod";
import { page } from "@vitest/browser/context";
import { Render } from "@puckeditor/core";
import {
  applyTheme,
  defaultThemeData,
  migrate,
  migrationRegistry as builtInRegistry,
  validateThemeData,
  type ThemeData,
  type ThemeColor,
  YextAutoField,
} from "@yext/visual-editor";
import { createPuckGenerationCatalog } from "@yext/visual-editor/section-library-support";
import { components, config } from "./generationTestUtils.ts";
import { migrationRegistry } from "../../library/migrations/registry.ts";
import { migrateLibraryThemeSelections } from "../../library/migrations/0006_dynamic_theme.ts";
import { VisualEditorProvider } from "../TestVisualEditorProvider.tsx";
import { Heading } from "../../library/shared/sectionSupport/atoms/heading.tsx";
import { Background } from "../../library/shared/sectionSupport/atoms/background.tsx";
import { CTA } from "../../library/shared/sectionSupport/atoms/cta.tsx";
import { Button } from "../../library/shared/sectionSupport/atoms/button.tsx";
import { MaybeLink } from "../../library/shared/sectionSupport/atoms/maybeLink.tsx";
import { defaultDirectoryCardSlotData } from "../../library/shared/sectionSupport/directory/DirectoryCard.tsx";

const makeTheme = (prefix: string): ThemeData => {
  const theme = JSON.parse(JSON.stringify(defaultThemeData), (key, value) =>
    (key === "id" || key === "colorId") && typeof value === "string"
      ? `${prefix}-${value}`
      : value
  ) as ThemeData;
  theme.typography[0] = {
    ...theme.typography[0],
    label: `${prefix} Body`,
    fontSize: 30,
    mobileFontSize: 18,
  };
  theme.colors[0] = {
    ...theme.colors[0],
    label: `${prefix} Surface`,
    background: "#102030",
    foreground: "#FAFAFA",
  };
  theme.actions[0].label = `${prefix} Action`;
  if (prefix === "forest")
    theme.colors[0].background = "linear-gradient(90deg, #12345680, #654321)";
  return theme;
};

describe("dynamic theme collections", () => {
  it.each(["ocean", "forest"])(
    "rebuilds nested generation choices for %s",
    (prefix) => {
      const themeData = makeTheme(prefix);
      expect(validateThemeData(themeData).errors).toEqual([]);
      const catalog = createPuckGenerationCatalog(components, { themeData });
      expect(catalog.fieldOmissions).toEqual([]);
      expect(catalog.puckOptions.themeData).toBe(themeData);
      const json = JSON.stringify(
        Object.fromEntries(
          Object.entries(catalog.data.components)
            .filter(([, component]) => component.generation)
            .map(([name, component]) => [
              name,
              z.toJSONSchema(component.generation!.props),
            ])
        )
      );
      expect(json.includes(themeData.typography[0].id)).toBe(true);
      expect(json.includes(themeData.typography[0].label)).toBe(true);
      expect(json.includes(themeData.actions[0].id)).toBe(true);
      expect(json.includes(themeData.actions[0].label)).toBe(true);
      expect(json).not.toContain('"main-primary"');
      expect(json).not.toContain('"main-body"');
      const locator = JSON.stringify(
        z.toJSONSchema(catalog.data.components.Locator.generation!.props)
      );
      expect(locator).toContain(themeData.actions[0].id);
      const details = JSON.stringify(
        z.toJSONSchema(
          catalog.data.components.AboutSectionDetailsColumn.generation!.props
        )
      );
      expect(details).toContain(themeData.actions[0].id);
    }
  );

  it("preserves nested selections and custom overrides while building directory cards", () => {
    const slots = {
      HeadingSlot: [
        {
          type: "HeadingTextSlot",
          props: {
            styles: {
              typographyId: "custom-heading",
              color: { selectedColor: "[#123456]", contrastingColor: "white" },
            },
          },
        },
      ],
      AddressSlot: [
        {
          type: "AddressSlot",
          props: {
            styles: {
              actionId: "directions",
              textColor: {
                selectedColor: "[#654321]",
                contrastingColor: "white",
              },
            },
          },
        },
      ],
      PhoneSlot: [
        {
          type: "PhoneSlot",
          props: {
            styles: {
              actionId: "phone",
              labelColor: {
                selectedColor: "[#ABCDEF]",
                contrastingColor: "black",
              },
            },
          },
        },
      ],
    };
    const inheritedHeading = defaultDirectoryCardSlotData(
      "parent",
      0,
      undefined,
      undefined,
      {
        HeadingSlot: [
          { type: "HeadingTextSlot", props: { styles: { level: 4 } } },
        ],
      } as any
    );
    expect(
      inheritedHeading.props.slots.HeadingSlot[0].props.styles.typographyId
    ).toBeUndefined();
    const result = defaultDirectoryCardSlotData(
      "parent",
      0,
      undefined,
      undefined,
      slots as any
    );
    for (const key of ["HeadingSlot", "AddressSlot", "PhoneSlot"] as const) {
      expect(result.props.slots[key][0].props.styles).toMatchObject(
        slots[key][0].props.styles
      );
    }
  });

  it("keeps heading semantics, foreground inheritance and CTA overrides with arbitrary identifiers", async () => {
    const theme = makeTheme("runtime");
    const document = { locale: "en", __: { theme: JSON.stringify(theme) } };
    const template = window.document.createElement("template");
    template.innerHTML = applyTheme(document, "./");
    const style = template.content.querySelector("#visual-editor-theme")!;
    window.document.head.appendChild(style);
    const savedTypographyId = theme.typography[0].id;
    const view = (current: ThemeData) => (
      <VisualEditorProvider
        templateProps={{
          document: { ...document, __: { theme: JSON.stringify(current) } },
        }}
      >
        <Background
          background={{ colorId: current.colors[0].id, channel: "background" }}
        >
          <Heading level={3} typographyId={savedTypographyId}>
            Selected heading
          </Heading>
          <CTA
            actionId={current.actions[0].id}
            label="Action"
            link="#"
            normalizeLink={false}
            textColor={{
              selectedColor: "[#123456]",
              contrastingColor: "white",
            }}
          />
        </Background>
      </VisualEditorProvider>
    );
    const { container, rerender } = render(view(theme));
    const heading = container.querySelector("h3")!;
    await page.viewport(1024, 800);
    expect(getComputedStyle(heading).fontSize).toBe("30px");
    await page.viewport(400, 800);
    expect(getComputedStyle(heading).fontSize).toBe("18px");
    expect(heading.getAttribute("data-ve-typography")).toBe(savedTypographyId);
    expect(getComputedStyle(heading).color).toBe("rgb(250, 250, 250)");
    expect(
      container.querySelector("[data-ve-action]")?.getAttribute("style")
    ).toContain("rgb(18, 52, 86)");
    const reordered = structuredClone(theme);
    reordered.typography.reverse();
    reordered.typography.find(
      (entry) => entry.id === savedTypographyId
    )!.label = "Renamed";
    rerender(view(reordered));
    expect(
      container.querySelector("h3")?.getAttribute("data-ve-typography")
    ).toBe(savedTypographyId);
    reordered.typography = reordered.typography.filter(
      (entry) => entry.id !== savedTypographyId
    );
    rerender(view(reordered));
    expect(
      container.querySelector("h3")?.getAttribute("data-ve-typography")
    ).toBe(reordered.typography[0].id);
    cleanup();
    style.remove();
  });
});

describe("authored baseline layouts", () => {
  it("leaves colors, typography and action styles to the active theme", () => {
    const checkDefaults = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        if (/(color|typographyId|actionId)$/i.test(key)) {
          expect(child, key).toBeUndefined();
        }
        checkDefaults(child);
      }
    };
    for (const component of Object.values(components)) {
      checkDefaults(component.defaultProps);
    }
    checkDefaults(defaultDirectoryCardSlotData("card", 0).props);
  });

  it("renders default headings with the active theme typography and preserves semantic levels", async () => {
    const theme = makeTheme("custom");
    const document = {
      locale: "en",
      __: { theme: JSON.stringify(theme) },
    };
    const template = window.document.createElement("template");
    template.innerHTML = applyTheme(document, "./");
    const css = template.content.querySelector(
      "#visual-editor-theme"
    )!.textContent;
    const slots = [
      components.HeroSection.defaultProps!.slots.GeomodifierSlot[0],
      components.PromoSection.defaultProps!.slots.HeadingSlot[0],
      components.ProductCard.defaultProps!.slots.TitleSlot[0],
    ];
    const data = {
      root: { props: {} },
      content: slots.map((slot, index) => ({
        ...structuredClone(slot),
        props: {
          ...structuredClone(slot.props),
          id: `baseline-heading-${index}`,
          data: {
            text: {
              field: "",
              constantValueEnabled: true,
              constantValue: { defaultValue: `Baseline heading ${index}` },
            },
          },
        },
      })),
    };
    const result = render(
      <VisualEditorProvider templateProps={{ document }}>
        <style>{css}</style>
        <Render config={config} data={data} />
      </VisualEditorProvider>
    );
    await page.viewport(1024, 800);
    for (const [index] of slots.entries()) {
      const heading = result.getByText(`Baseline heading ${index}`);
      expect(heading.tagName).toBe(`H${index + 1}`);
      expect(getComputedStyle(heading).fontSize).toBe(
        `${theme.typography[0].fontSize}px`
      );
    }
    await page.viewport(400, 800);
    for (const [index] of slots.entries())
      expect(
        getComputedStyle(result.getByText(`Baseline heading ${index}`)).fontSize
      ).toBe(`${theme.typography[0].mobileFontSize}px`);
    cleanup();
  });
});

describe("CTA responsive widths", () => {
  const theme = structuredClone(defaultThemeData);
  theme.actions[0].id = "width-button";
  theme.actions.find((action) => action.id === "main-link")!.id = "width-link";
  const document = { locale: "en", __: { theme: JSON.stringify(theme) } };
  const template = window.document.createElement("template");
  template.innerHTML = applyTheme(document, "./");
  const css = template.content.querySelector(
    "#visual-editor-theme"
  )!.textContent;

  const renderSizedCTA = (
    actionId: string,
    className?: string,
    presetImage = false
  ) => {
    const props = structuredClone(components.CTAWrapper.defaultProps!);
    props.id = "sized-cta";
    props.styles.actionId = actionId;
    props.className = className;
    props.data.entityField.constantValueEnabled = true;
    props.data.entityField.constantValue.label = "Sized CTA";
    if (presetImage) {
      props.data.entityField.constantValue.ctaType = "presetImage";
      props.data.entityField.selectedType = "presetImage";
      props.styles.presetImage = "app-store";
    }
    return render(
      <VisualEditorProvider templateProps={{ document }}>
        <style>{css}</style>
        <div style={{ width: 360 }}>
          <Render
            config={config}
            data={{
              root: { props: {} },
              content: [{ type: "CTAWrapper", props }],
            }}
          />
        </div>
      </VisualEditorProvider>
    );
  };

  it.each([
    { actionId: "width-button", mobileWidth: "full" },
    { actionId: "width-link", mobileWidth: "content" },
  ])(
    "keeps $actionId content-width on desktop and $mobileWidth width on mobile",
    async ({ actionId, mobileWidth }) => {
      const result = renderSizedCTA(actionId);
      const cta = result.getByRole("link", { name: "Sized CTA" });
      await page.viewport(1024, 800);
      expect(cta.getBoundingClientRect().width).toBeLessThan(360);
      await page.viewport(400, 800);
      if (mobileWidth === "full")
        expect(cta.getBoundingClientRect().width).toBe(360);
      else expect(cta.getBoundingClientRect().width).toBeLessThan(360);
      cleanup();
    }
  );

  it("preserves an explicitly full-width desktop CTA", async () => {
    const result = renderSizedCTA("width-button", "w-full sm:w-full");
    await page.viewport(1024, 800);
    expect(
      result.getByRole("link", { name: "Sized CTA" }).getBoundingClientRect()
        .width
    ).toBe(360);
    cleanup();
  });

  it("keeps preset image CTAs at their natural width", async () => {
    const result = renderSizedCTA("width-button", undefined, true);
    await page.viewport(400, 800);
    const cta = result.getByRole("link");
    expect(cta.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(cta.getBoundingClientRect().width).toBeLessThan(360);
    cleanup();
  });
});

describe("page stylesheet color inheritance", () => {
  it("uses the banner background foreground for the default rich-text content", () => {
    const theme = structuredClone(defaultThemeData);
    const document = { locale: "en", __: { theme: JSON.stringify(theme) } };
    const template = window.document.createElement("template");
    template.innerHTML = applyTheme(document, "./");
    const css = template.content.querySelector(
      "#visual-editor-theme"
    )!.textContent;
    const banner = defaultLayout.content
      .flatMap((section: any) =>
        section.type === "MainContent" ? section.props.content : []
      )
      .find((section: any) => section.type === "BannerSection");
    const props = structuredClone(banner.props);
    props.id = "banner-default-color";
    props.styles.backgroundColor = {
      colorId: "main-black",
      channel: "background",
    };
    const view = () => (
      <VisualEditorProvider templateProps={{ document }}>
        <style>{css}</style>
        <Render
          config={config}
          data={{
            root: { props: {} },
            content: [{ type: "BannerSection", props }],
          }}
        />
      </VisualEditorProvider>
    );
    const result = render(view());
    expect(getComputedStyle(result.getByText("Banner Text")).color).toBe(
      "rgb(255, 255, 255)"
    );
    props.styles.textColor = {
      selectedColor: "[#123456]",
      contrastingColor: "white",
    };
    result.rerender(view());
    expect(getComputedStyle(result.getByText("Banner Text")).color).toBe(
      "rgb(18, 52, 86)"
    );
    delete props.styles.textColor;
    props.styles.backgroundColor = {
      colorId: "main-white",
      channel: "background",
    };
    result.rerender(view());
    expect(getComputedStyle(result.getByText("Banner Text")).color).toBe(
      "rgb(0, 0, 0)"
    );
    cleanup();
  });
});

describe("standard library color defaults", () => {
  const theme = makeTheme("color-default");
  const document = { locale: "en", __: { theme: JSON.stringify(theme) } };
  const template = window.document.createElement("template");
  template.innerHTML = applyTheme(document, "./");
  const css = template.content.querySelector(
    "#visual-editor-theme"
  )!.textContent;
  const outer: ThemeColor = {
    colorId: theme.colors[0].id,
    channel: "background",
  };
  const nested: ThemeColor = {
    selectedColor: "[#60302080]",
    contrastingColor: "[#FFDD00]",
  };
  const other: ThemeColor = {
    selectedColor: "[#EEEEEE]",
    contrastingColor: "[#123456]",
  };

  const ColorControl = ({
    type,
    initialColor,
    outerBackground,
    innerBackground,
    action = false,
    backgroundOverride,
  }: {
    type: string;
    initialColor: ThemeColor;
    outerBackground: ThemeColor;
    innerBackground: ThemeColor;
    action?: boolean;
    backgroundOverride?: ThemeColor;
  }) => {
    const [color, setColor] = React.useState<ThemeColor | undefined>(
      initialColor
    );
    const fieldName = action ? "textColor" : "color";
    const fields = components[type].fields!.styles as {
      objectFields: Record<string, any>;
    };
    const props = structuredClone(components[type].defaultProps!);
    props.id = "color-default-component";
    props.styles[fieldName] = color;
    if (action) {
      props.styles.color = backgroundOverride;
      props.data.entityField.constantValueEnabled = true;
      props.data.entityField.constantValue.label = "Color sample";
    } else {
      props.data.text = {
        field: "",
        constantValueEnabled: true,
        constantValue: {
          defaultValue:
            type === "BodyText"
              ? { html: "<p>Color sample</p>" }
              : "Color sample",
        },
      };
    }
    return (
      <VisualEditorProvider templateProps={{ document }}>
        <style>{css}</style>
        <YextAutoField
          id="text-color"
          field={fields.objectFields[fieldName]}
          value={color}
          onChange={setColor}
        />
        <output data-testid="saved-color">{JSON.stringify({ color })}</output>
        <Background background={outerBackground}>
          <Background background={innerBackground}>
            <Render
              config={config}
              data={{ root: { props: {} }, content: [{ type, props }] }}
            />
          </Background>
        </Background>
      </VisualEditorProvider>
    );
  };

  const overrides: Array<{ name: string; value: ThemeColor; label: string }> = [
    {
      name: "shared foreground",
      value: {
        channel: "foreground",
        colorId: theme.colors[0].id,
        contrastingColor: "[#000000]",
      },
      label: `${theme.colors[0].label} — foreground`,
    },
    {
      name: "custom alpha",
      value: {
        selectedColor: "[rgba(12, 34, 56, 0.5)]",
        contrastingColor: "white",
      },
      label: "Custom color",
    },
  ];

  for (const type of ["HeadingText", "Text", "BodyText"]) {
    it.each(overrides)(
      `${type} clears a $name override and follows the nearest background foreground`,
      ({ value, label }) => {
        const view = (
          outerBackground: ThemeColor,
          innerBackground: ThemeColor
        ) => (
          <ColorControl
            type={type}
            initialColor={value}
            outerBackground={outerBackground}
            innerBackground={innerBackground}
          />
        );
        const result = render(view(outer, nested));
        expect(result.getByRole("combobox").textContent).toBe(label);
        const explicitColor = getComputedStyle(
          result.getByText("Color sample")
        ).color;
        result.rerender(view(other, outer));
        expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
          explicitColor
        );
        expect(
          JSON.parse(result.getByTestId("saved-color").textContent!)
        ).toEqual({ color: value });
        fireEvent.click(result.getByRole("combobox"));
        fireEvent.click(result.getByRole("option", { name: /^Default$/ }));
        expect(result.getByRole("combobox").textContent).toBe("Default");
        expect(
          JSON.parse(result.getByTestId("saved-color").textContent!)
        ).toEqual({});
        expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
          "rgb(250, 250, 250)"
        );
        result.rerender(view(outer, nested));
        expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
          "rgb(255, 221, 0)"
        );
        result.rerender(view(other, nested));
        expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
          "rgb(255, 221, 0)"
        );
        result.rerender(view(outer, other));
        expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
          "rgb(18, 52, 86)"
        );
        cleanup();
      }
    );
  }

  it("keeps a primary CTA's default label paired with a component background override", () => {
    const view = (backgroundOverride?: ThemeColor) => (
      <ColorControl
        type="CTAWrapper"
        initialColor={overrides[1].value}
        outerBackground={outer}
        innerBackground={nested}
        action
        backgroundOverride={backgroundOverride}
      />
    );
    const result = render(view(outer));
    fireEvent.click(result.getByRole("combobox"));
    fireEvent.click(result.getByRole("option", { name: /^Default$/ }));
    expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
      "rgb(250, 250, 250)"
    );
    result.rerender(view(other));
    expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
      "rgb(18, 52, 86)"
    );
    result.rerender(view());
    expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
      "rgb(255, 255, 255)"
    );
    expect(JSON.parse(result.getByTestId("saved-color").textContent!)).toEqual(
      {}
    );
    cleanup();
  });

  it("clears a CTA label override back to its action preset", () => {
    const result = render(
      <ColorControl
        type="CTAWrapper"
        initialColor={overrides[1].value}
        outerBackground={outer}
        innerBackground={nested}
        action
      />
    );
    fireEvent.click(result.getByRole("combobox"));
    fireEvent.click(result.getByRole("option", { name: /^Default$/ }));
    expect(JSON.parse(result.getByTestId("saved-color").textContent!)).toEqual(
      {}
    );
    expect(getComputedStyle(result.getByText("Color sample")).color).toBe(
      "rgb(255, 255, 255)"
    );
    cleanup();
  });
});

describe("library theme migration", () => {
  it.each([
    { lexicalStyle: "", removesLegacyColor: true },
    { lexicalStyle: "color: rgb(0, 0, 0);", removesLegacyColor: false },
    { lexicalStyle: "background-color: #FFFFFF;", removesLegacyColor: true },
  ])(
    "repairs serialized default black while preserving authored colors: $lexicalStyle",
    ({ lexicalStyle, removesLegacyColor }) => {
      const props = structuredClone(components.BannerSection.defaultProps!);
      props.id = "legacy-banner-color";
      const richText = props.data.text.constantValue.defaultValue;
      const lexical = JSON.parse(richText.json);
      lexical.root.children[0].children[0].style = lexicalStyle;
      richText.json = JSON.stringify(lexical);
      richText.html = richText.html.replace(
        'style="',
        'style="color: rgb(0, 0, 0);'
      );
      const data = {
        root: {
          props: {
            version: builtInRegistry.length,
            sectionLibraryMigrationVersion: 6,
          },
        },
        content: [{ type: "BannerSection", props }],
      };
      const result = migrate(
        config,
        data,
        {},
        builtInRegistry,
        migrationRegistry
      );
      const migrated =
        result.content[0].props.data.text.constantValue.defaultValue;
      expect(migrated.html.includes("color: rgb(0, 0, 0)")).toBe(
        !removesLegacyColor
      );
      expect(migrated.json).toBe(richText.json);
      expect(migrated.html).toContain("Banner Text");
      expect(result.content[0].props.id).toBe(props.id);
      expect(
        migrate(config, result, {}, builtInRegistry, migrationRegistry)
      ).toEqual(result);
    }
  );

  const bundledLayouts = import.meta.glob(
    "../../library/layouts/*/defaultLayout.json",
    { eager: true, import: "default" }
  );
  it.each(Object.entries(bundledLayouts))(
    "keeps bundled layout %s current and its theme references valid",
    (_path, layout) => {
      const data = layout as Parameters<typeof migrate>[1];
      expect(
        migrate(config, data, {}, builtInRegistry, migrationRegistry)
      ).toEqual(data);
      expect(data.root.props).toMatchObject({
        version: builtInRegistry.length,
        sectionLibraryMigrationVersion: migrationRegistry.length,
      });
      const visit = (value: any) => {
        if (!value || typeof value !== "object") return;
        for (const [key, child] of Object.entries(value)) {
          const collection =
            key === "colorId"
              ? defaultThemeData.colors
              : key === "typographyId"
                ? defaultThemeData.typography
                : key === "actionId" || key === "readMoreActionId"
                  ? defaultThemeData.actions
                  : undefined;
          if (collection && child !== undefined)
            expect(
              collection.some((entry) => entry.id === child),
              `${key} ${child}`
            ).toBe(true);
          visit(child);
        }
      };
      visit(data.content);
    }
  );

  it("renders historical heading semantics and mobile typography against a migrated legacy theme", async () => {
    const document = {
      locale: "en",
      __: {
        theme: JSON.stringify({
          "--fontSize-h2-fontSize": "36px",
          "--fontSize-h3-fontSize": "22px",
        }),
      },
    };
    const data = migrate(
      config,
      {
        root: { props: { version: 83, sectionLibraryMigrationVersion: 5 } },
        content: [
          {
            type: "HeadingText",
            props: {
              id: "legacy-heading",
              data: {
                text: {
                  field: "",
                  constantValueEnabled: true,
                  constantValue: "Legacy heading",
                },
              },
              styles: { level: 2, align: "left", semanticLevelOverride: 4 },
            },
          },
        ],
      },
      document,
      builtInRegistry,
      migrationRegistry
    );
    const template = window.document.createElement("template");
    template.innerHTML = applyTheme(document, "./");
    const style = template.content.querySelector("#visual-editor-theme")!;
    window.document.head.appendChild(style);
    const { container } = render(
      <VisualEditorProvider templateProps={{ document }}>
        <Render config={config} data={data} />
      </VisualEditorProvider>
    );
    const heading = container.querySelector("h4")!;
    expect(heading.textContent).toBe("Legacy heading");
    expect(heading.getAttribute("data-ve-typography")).toBe("main-h2");
    await page.viewport(1024, 800);
    expect(getComputedStyle(heading).fontSize).toBe("36px");
    await page.viewport(400, 800);
    expect(getComputedStyle(heading).fontSize).toBe("22px");
    cleanup();
    style.remove();
  });

  it("migrates library-only shapes after the built-in registry and is repeatable", () => {
    const data = {
      root: { props: { version: 83, sectionLibraryMigrationVersion: 5 } },
      content: [
        {
          type: "FormSection",
          props: {
            id: "form",
            ctaStyles: {
              buttonVariant: "secondary",
              labelColor: {
                selectedColor: "[#123456]",
                contrastingColor: "white",
              },
            },
          },
        },
        {
          type: "FAQCard",
          props: {
            id: "faq",
            styles: { questionVariant: "lg", answerVariant: "sm" },
          },
        },
        { type: "HeaderLinks", props: { id: "header", styles: {} } },
        {
          type: "Emails",
          props: { id: "emails", styles: { actionId: "authored-action" } },
        },
      ],
    };
    const result = migrate(
      config,
      data,
      {},
      builtInRegistry,
      migrationRegistry
    );
    expect(result.content[0].props.ctaStyles).toEqual({
      actionId: "main-secondary",
      labelColor: data.content[0].props.ctaStyles!.labelColor,
    });
    expect(result.content[1].props.styles).toEqual({
      questionTypographyId: "main-body-lg",
      answerTypographyId: "main-body-sm",
    });
    expect(result.content[2].props.styles.actionId).toBe(
      "main-headerFooterMainLink"
    );
    expect(result.content[3].props.styles.actionId).toBe("authored-action");
    expect(migrateLibraryThemeSelections(result.content)).toEqual(
      result.content
    );
    expect(
      migrate(config, result, {}, builtInRegistry, migrationRegistry)
    ).toEqual(result);
    expect(result.root.props).toMatchObject({
      version: builtInRegistry.length,
      sectionLibraryMigrationVersion: migrationRegistry.length,
    });
  });
});

describe("unfilled CTA foreground inheritance", () => {
  const theme = makeTheme("foreground");
  const document = { locale: "en", __: { theme: JSON.stringify(theme) } };
  const template = window.document.createElement("template");
  template.innerHTML = applyTheme(document, "./");
  const css = template.content.querySelector(
    "#visual-editor-theme"
  )!.textContent;
  const dark: ThemeColor = {
    selectedColor: "[#102030]",
    contrastingColor: "[#FFDD00]",
  };
  const light: ThemeColor = {
    selectedColor: "[#EEEEEE]",
    contrastingColor: "[#123456]",
  };
  const override: ThemeColor = {
    selectedColor: "[#009955]",
    contrastingColor: "white",
  };

  it.each([
    "FooterLinksSlot",
    "FooterExpandedLinksWrapper",
    "FooterSocialLinksSlot",
  ])(
    "%s follows the nearest foreground and keeps explicit overrides",
    (type) => {
      const props = structuredClone(components[type].defaultProps!);
      props.id = `foreground-${type}`;
      if (type === "FooterSocialLinksSlot")
        props.data.facebookLink = "https://www.facebook.com/example";
      if (type === "FooterLinksSlot")
        props.actionId = "foreground-main-headerFooterMainLink";
      else props.styles.actionId = "foreground-main-headerFooterMainLink";
      const view = (background: ThemeColor, color?: ThemeColor) => {
        if (type === "FooterLinksSlot") props.color = color;
        else
          props.styles[
            type === "FooterSocialLinksSlot" ? "iconColor" : "color"
          ] = color;
        return (
          <VisualEditorProvider templateProps={{ document }}>
            <style>{css}</style>
            <Background background={dark}>
              <Background background={background}>
                <Render
                  config={config}
                  data={{ root: { props: {} }, content: [{ type, props }] }}
                />
              </Background>
            </Background>
          </VisualEditorProvider>
        );
      };
      const result = render(view(dark));
      const links = () => result.getAllByRole("link");
      expect(links().length).toBeGreaterThan(0);
      for (const link of links())
        expect(getComputedStyle(link).color).toBe("rgb(255, 221, 0)");
      result.rerender(view(light));
      for (const link of links())
        expect(getComputedStyle(link).color).toBe("rgb(18, 52, 86)");
      result.rerender(view(dark, override));
      for (const link of links())
        expect(getComputedStyle(link).color).toBe("rgb(0, 153, 85)");
      result.rerender(view(dark));
      for (const link of links())
        expect(getComputedStyle(link).color).toBe("rgb(255, 221, 0)");
      cleanup();
    }
  );

  it("pairs an outlined CTA's text and border with its background foreground", () => {
    const view = (
      background: ThemeColor,
      color?: ThemeColor,
      textColor?: ThemeColor
    ) => (
      <VisualEditorProvider templateProps={{ document }}>
        <style>{css}</style>
        <Background background={background}>
          <CTA
            actionId="foreground-main-secondary"
            label="Outlined CTA"
            link="#"
            normalizeLink={false}
            color={color}
            textColor={textColor}
          />
        </Background>
      </VisualEditorProvider>
    );
    const result = render(view(dark));
    const cta = () => result.getByRole("link", { name: "Outlined CTA" });
    expect(getComputedStyle(cta()).color).toBe("rgb(255, 221, 0)");
    expect(getComputedStyle(cta()).borderTopColor).toBe("rgb(255, 221, 0)");
    result.rerender(view(light));
    expect(getComputedStyle(cta()).color).toBe("rgb(18, 52, 86)");
    expect(getComputedStyle(cta()).borderTopColor).toBe("rgb(18, 52, 86)");
    result.rerender(view(dark, override));
    expect(getComputedStyle(cta()).color).toBe("rgb(0, 153, 85)");
    expect(getComputedStyle(cta()).borderTopColor).toBe("rgb(0, 153, 85)");
    result.rerender(view(dark, override, light));
    expect(getComputedStyle(cta()).color).toBe("rgb(238, 238, 238)");
    expect(getComputedStyle(cta()).borderTopColor).toBe("rgb(0, 153, 85)");
    cleanup();
  });

  it.each([
    { type: "conditional link", actionId: "foreground-main-link" },
    { type: "button", actionId: "foreground-main-link" },
    { type: "button", actionId: "foreground-main-secondary" },
  ])("$type with $actionId follows its surface", ({ type, actionId }) => {
    const view = (background: ThemeColor, explicit = false) => (
      <VisualEditorProvider templateProps={{ document }}>
        <style>{css}</style>
        <Background background={dark}>
          <Background background={background}>
            {type === "conditional link" ? (
              <MaybeLink
                href="#"
                actionId={actionId}
                color={explicit ? override : undefined}
              >
                Surface action
              </MaybeLink>
            ) : (
              <Button
                actionId={actionId}
                style={{
                  color: explicit ? "#009955" : undefined,
                  borderColor: explicit ? "#009955" : undefined,
                }}
              >
                Surface action
              </Button>
            )}
          </Background>
        </Background>
      </VisualEditorProvider>
    );
    const result = render(view(dark));
    const action = () =>
      result.getByRole(type === "conditional link" ? "link" : "button", {
        name: "Surface action",
      });
    expect(getComputedStyle(action()).color).toBe("rgb(255, 221, 0)");
    if (actionId.endsWith("secondary"))
      expect(getComputedStyle(action()).borderTopColor).toBe(
        "rgb(255, 221, 0)"
      );
    result.rerender(view(light));
    expect(getComputedStyle(action()).color).toBe("rgb(18, 52, 86)");
    result.rerender(view(dark, true));
    expect(getComputedStyle(action()).color).toBe("rgb(0, 153, 85)");
    result.rerender(view(dark));
    expect(getComputedStyle(action()).color).toBe("rgb(255, 221, 0)");
    cleanup();
  });

  it("keeps a conditional link's color override when it has no destination", () => {
    const result = render(
      <VisualEditorProvider templateProps={{ document }}>
        <style>{css}</style>
        <Background background={dark}>
          <MaybeLink color={override}>Current breadcrumb</MaybeLink>
        </Background>
      </VisualEditorProvider>
    );
    expect(result.queryByRole("link")).toBeNull();
    expect(getComputedStyle(result.getByText("Current breadcrumb")).color).toBe(
      "rgb(0, 153, 85)"
    );
    cleanup();
  });
});
