import { Body } from "../library/shared/sectionSupport/atoms/body.tsx";
import { Heading } from "../library/shared/sectionSupport/atoms/heading.tsx";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { Render, type Data } from "@puckeditor/core";
import { page } from "@vitest/browser/context";
import {
  migrate,
  migrationRegistry as editorMigrations,
} from "@yext/visual-editor";
import { migrationRegistry } from "../library/migrations/registry.ts";
import { Background } from "../library/shared/sectionSupport/atoms/background.tsx";
import { CTA } from "../library/shared/sectionSupport/atoms/cta.tsx";
import { VisualEditorProvider } from "./TestVisualEditorProvider.tsx";
import { testSetup } from "./componentTests.setup.ts";
import {
  config,
  generationSchema,
  makeLayout,
  resolve,
} from "./layoutGeneration/generationTestUtils.ts";

const imageUrl = new URL("./theme-placeholder.svg", import.meta.url).href;
const streamDocument = {
  locale: "en",
  name: "Example",
  mainPhone: "+12025550100",
};

const localImages = (value: unknown): void => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "url" && typeof child === "string") {
      (value as Record<string, unknown>)[key] = imageUrl;
    } else localImages(child);
  }
};
const mount = async (layout: Data) => {
  localImages(layout);
  const data = await resolve(layout, streamDocument);
  return render(
    <VisualEditorProvider templateProps={{ document: streamDocument }}>
      <Render config={config} data={data} />
    </VisualEditorProvider>
  );
};
afterEach(cleanup);

describe("semantic theme integration", () => {
  it("uses the nearest surface for CTAs, including live theme changes", () => {
    testSetup({
      colorPrimary: "#000000",
      colorBackground: "#FFFFFF",
      primaryButtonDefaultTextColor: "#112233",
      primaryButtonDefaultTextColorOnDark: "#FFEEDD",
    });
    const { getByText } = render(
      <VisualEditorProvider templateProps={{ document: streamDocument }}>
        <Background surface="primary">
          <CTA
            label="Outer action"
            link="#"
            normalizeLink={false}
            variant="primary-button"
          />
          <Background surface="page">
            <CTA
              label="Inner action"
              link="#"
              normalizeLink={false}
              variant="primary-button"
            />
          </Background>
        </Background>
      </VisualEditorProvider>
    );

    expect(getComputedStyle(getByText("Outer action")).color).toBe(
      "rgb(255, 238, 221)"
    );
    expect(getComputedStyle(getByText("Inner action")).color).toBe(
      "rgb(17, 34, 51)"
    );
    testSetup({
      colorPrimary: "#FFFFFF",
      colorBackground: "#000000",
      primaryButtonDefaultTextColor: "#112233",
      primaryButtonDefaultTextColorOnDark: "#FFEEDD",
    });
    expect(getComputedStyle(getByText("Outer action")).color).toBe(
      "rgb(17, 34, 51)"
    );
    expect(getComputedStyle(getByText("Inner action")).color).toBe(
      "rgb(255, 238, 221)"
    );
  });

  it.each(["classic", "compact", "spotlight", "immersive"])(
    "keeps automatic Hero semantics independent of typography in %s",
    async (variant) => {
      const layout = makeLayout("HeroSection");
      const props = layout.content[0].props;
      Object.assign(props.styles, {
        variant,
        showPhone: false,
        showHoursStatus: false,
        showAverageReview: false,
      });
      props.slots.GeomodifierSlot[0].props.styles.typographyRole = "body-small";
      props.slots.BusinessNameSlot[0].props.styles.typographyRole =
        "card-title";
      const { container } = await mount(layout);
      expect(
        container.querySelector("h1.ve-theme-body-small")?.textContent
      ).toBe("Geomodifier");
      expect(
        container.querySelector("p.ve-theme-card-title")?.textContent
      ).toBe("Business Name");
      if (variant === "spotlight") {
        expect(
          container.querySelector(".bg-cover > .ve-theme-page")
        ).toBeNull();
      }
      if (variant === "immersive")
        expect(container.querySelector(".ve-theme-on-dark")).not.toBeNull();
    }
  );

  it("promotes the business name when the Hero geomodifier is hidden", async () => {
    const layout = makeLayout("HeroSection");
    Object.assign(layout.content[0].props.styles, {
      showGeomodifier: false,
      showPhone: false,
      showHoursStatus: false,
    });
    const { container } = await mount(layout);
    expect(container.querySelector("h1.ve-theme-headline")?.textContent).toBe(
      "Business Name"
    );
  });

  it("uses the page surface when an immersive Hero has no background image", async () => {
    const layout = makeLayout("HeroSection");
    layout.content[0].props.styles.variant = "immersive";
    layout.content[0].props.data.backgroundImage = {
      field: "",
      constantValueEnabled: true,
    };
    const { container } = await mount(layout);
    expect(container.querySelector(".ve-theme-on-dark")).toBeNull();
    expect(container.querySelector(".ve-theme-page")).not.toBeNull();
  });

  it.each(["classic", "immersive", "minimal"])(
    "themes Product %s cards and adjusts headings when the section heading is hidden",
    async (cardVariant) => {
      const layout = makeLayout("ProductSection");
      Object.assign(layout.content[0].props.styles, {
        cardVariant,
        showSectionHeading: false,
        backgroundColor: "primary",
      });
      const { container } = await mount(layout);
      expect(container.querySelector(".ve-theme-primary")).not.toBeNull();
      expect(container.querySelectorAll("h2.ve-theme-card-title")).toHaveLength(
        3
      );
      expect(container.querySelectorAll(".ve-theme-card")).toHaveLength(
        cardVariant === "minimal" ? 0 : 3
      );
      expect(container.querySelector(".ve-theme-body-small")?.textContent).toBe(
        "Category"
      );
      expect(
        container.querySelector(".ve-theme-secondary-button")
      ).not.toBeNull();
    }
  );

  it("themes banner rich text and links without flattening authored structure", async () => {
    testSetup({ eyebrowFontSize: 27, eyebrowMobileFontSize: 21 });
    const layout = makeLayout("BannerSection");
    layout.content[0].props.styles.typographyRole = "eyebrow";
    layout.content[0].props.data.text.constantValue = {
      defaultValue: {
        html: '<h3>Announcement</h3><p style="font-size: 14px; color: black"><strong>Offer</strong> <a href="/offer">Details</a></p>',
      },
    };
    const { container } = await mount(layout);
    expect(
      container.querySelector(
        ".ve-theme-primary .rtf-wrapper.ve-theme-eyebrow h3"
      )?.textContent
    ).toBe("Announcement");
    expect(container.querySelector("strong")?.textContent).toBe("Offer");
    expect(
      getComputedStyle(container.querySelector(".rtf-wrapper p")!).color
    ).toBe(
      getComputedStyle(container.querySelector(".ve-theme-primary")!).color
    );
    await page.viewport(1024, 800);
    expect(
      getComputedStyle(container.querySelector(".rtf-wrapper")!).fontSize
    ).toBe("27px");
    expect(
      getComputedStyle(container.querySelector(".rtf-wrapper p")!).fontSize
    ).toBe("27px");
    await page.viewport(375, 800);
    expect(
      getComputedStyle(container.querySelector(".rtf-wrapper")!).fontSize
    ).toBe("21px");
    expect(getComputedStyle(container.querySelector("a")!).color).not.toBe("");
  });

  it("uses navigation styles on both header tiers and theme-owned content width", async () => {
    testSetup({ pageContentMaxWidth: 960 });
    const { container } = await mount(makeLayout("ExpandedHeader"));
    expect(
      container.querySelectorAll(".ve-theme-navigation-link").length
    ).toBeGreaterThan(0);
    expect(container.querySelector(".ve-theme-muted")).not.toBeNull();
    expect(
      getComputedStyle(container.querySelector(".ve-theme-content")!).maxWidth
    ).toBe("960px");
    expect(
      generationSchema("ExpandedHeader").shape.styles.shape
    ).toHaveProperty("maxWidth");
    for (const name of ["HeadingTextSlot", "BodyTextSlot", "TextSlot"]) {
      expect(generationSchema(name).shape.styles.shape).toHaveProperty(
        "typographyRole"
      );
      expect(generationSchema(name).shape.styles.shape).toHaveProperty("color");
    }
    expect(
      generationSchema("HeadingTextSlot").shape.styles.shape
    ).not.toHaveProperty("level");
  });

  it("restores selected role typography when size and weight overrides are set to default", async () => {
    await page.viewport(1280, 800);
    testSetup({
      headlineFontSize: 47,
      headlineMobileFontSize: 33,
      headlineFontWeight: "300",
      eyebrowFontSize: 31,
      eyebrowMobileFontSize: 23,
      bodyLargeFontSize: 37,
      bodyLargeMobileFontSize: 29,
    });
    const reset = { selectedColor: "default", contrastingColor: "default" };
    const { getByText, rerender } = render(
      <>
        <Heading
          level={2}
          typographyRole="headline"
          fontSize="sm"
          weight="700"
          color={{ selectedColor: "[#123456]", contrastingColor: "white" }}
        >
          Role heading
        </Heading>
        <Body typographyRole="body-large">Role body</Body>
      </>
    );
    expect(getByText("Role heading").tagName).toBe("H2");
    expect(getComputedStyle(getByText("Role heading")).fontSize).toBe("14px");
    expect(getComputedStyle(getByText("Role heading")).fontWeight).toBe("700");
    expect(getComputedStyle(getByText("Role heading")).color).toBe(
      "rgb(18, 52, 86)"
    );
    expect(getComputedStyle(getByText("Role body")).fontSize).toBe("37px");
    await page.viewport(375, 800);
    expect(getComputedStyle(getByText("Role heading")).fontSize).toBe("14px");
    expect(getComputedStyle(getByText("Role body")).fontSize).toBe("29px");
    await page.viewport(1280, 800);
    rerender(
      <>
        <Heading
          level={2}
          typographyRole="headline"
          fontSize="default"
          weight="default"
          color={reset}
        >
          Role heading
        </Heading>
        <Body typographyRole="eyebrow">Role body</Body>
      </>
    );
    expect(getByText("Role heading").tagName).toBe("H2");
    expect(getComputedStyle(getByText("Role heading")).fontSize).toBe("47px");
    expect(getComputedStyle(getByText("Role heading")).fontWeight).toBe("300");
    expect(getComputedStyle(getByText("Role heading")).color).not.toBe(
      "rgb(18, 52, 86)"
    );
    expect(getComputedStyle(getByText("Role body")).fontSize).toBe("31px");
    await page.viewport(375, 800);
    expect(getComputedStyle(getByText("Role heading")).fontSize).toBe("33px");
  });

  it("uses the resolved explicit surface for interactions, then restores inheritance on reset", () => {
    const theme = {
      colorPrimary: "#FFFFFF",
      primaryButtonDefaultTextColor: "#112233",
      primaryButtonDefaultTextColorOnDark: "#FFEEDD",
    };
    testSetup(theme);
    const renderSurface = (reset: boolean) => (
      <VisualEditorProvider templateProps={{ document: streamDocument }}>
        <Background
          surface="primary"
          background={
            reset
              ? { selectedColor: "default", contrastingColor: "default" }
              : {
                  selectedColor: "[#000000]",
                  contrastingColor: "black",
                  isDarkColor: false,
                  selectedColorCss: "#FFFFFF",
                  contrastingColorCss: "white",
                }
          }
        >
          <CTA label="Surface action" link="#" normalizeLink={false} />
          <CTA
            label="Override action"
            link="#"
            normalizeLink={false}
            color={{ selectedColor: "[#abcdef]", contrastingColor: "black" }}
            textColor={{
              selectedColor: "[#123456]",
              contrastingColor: "white",
            }}
          />
        </Background>
      </VisualEditorProvider>
    );
    const { getByText, rerender } = render(renderSurface(false));
    expect(
      getComputedStyle(getByText("Surface action").parentElement!)
        .backgroundColor
    ).toBe("rgb(0, 0, 0)");
    expect(
      getComputedStyle(getByText("Surface action").parentElement!).color
    ).toBe("rgb(0, 0, 0)");
    expect(getComputedStyle(getByText("Surface action")).color).toBe(
      "rgb(255, 238, 221)"
    );
    expect(getComputedStyle(getByText("Override action")).color).toBe(
      "rgb(18, 52, 86)"
    );
    act(() => testSetup({ ...theme, colorPrimary: "#998877" }));
    expect(getComputedStyle(getByText("Surface action")).color).toBe(
      "rgb(255, 238, 221)"
    );
    expect(getComputedStyle(getByText("Override action")).color).toBe(
      "rgb(18, 52, 86)"
    );
    rerender(renderSurface(true));
    expect(getComputedStyle(getByText("Surface action")).color).toBe(
      "rgb(17, 34, 51)"
    );
  });

  it("keeps interaction colors inherited when only an inline background changes", () => {
    testSetup({
      colorPrimary: "#000000",
      primaryButtonDefaultTextColor: "#112233",
      primaryButtonDefaultTextColorOnDark: "#FFEEDD",
    });
    const { getByText } = render(
      <VisualEditorProvider templateProps={{ document: streamDocument }}>
        <Background surfaceRole="primary">
          <Background surface="inherit" style={{ backgroundColor: "#FFFFFF" }}>
            <CTA label="Inherited action" link="#" normalizeLink={false} />
          </Background>
        </Background>
      </VisualEditorProvider>
    );
    const action = getByText("Inherited action");
    expect(getComputedStyle(action.parentElement!).backgroundColor).toBe(
      "rgb(255, 255, 255)"
    );
    expect(getComputedStyle(action).color).toBe("rgb(255, 238, 221)");
  });

  it.each(["secondary", "secondary-button"] as const)(
    "honors explicit %s CTA colors on dark surfaces and restores defaults when omitted",
    (variant) => {
      testSetup({
        colorPrimary: "#000000",
        secondaryButtonDefaultTextColorOnDark: "#FFEEDD",
      });
      const renderAction = (custom: boolean) => (
        <VisualEditorProvider templateProps={{ document: streamDocument }}>
          <Background surface="primary">
            <CTA
              label="Secondary action"
              link="#"
              normalizeLink={false}
              variant={variant}
              color={
                custom
                  ? { selectedColor: "[#abcdef]", contrastingColor: "black" }
                  : undefined
              }
              textColor={
                custom
                  ? { selectedColor: "[#123456]", contrastingColor: "white" }
                  : undefined
              }
            />
          </Background>
        </VisualEditorProvider>
      );
      const { getByText, rerender } = render(renderAction(true));
      expect(getComputedStyle(getByText("Secondary action")).color).toBe(
        "rgb(18, 52, 86)"
      );
      expect(
        getComputedStyle(getByText("Secondary action")).borderTopColor
      ).toBe("rgb(171, 205, 239)");
      rerender(renderAction(false));
      expect(getComputedStyle(getByText("Secondary action")).color).toBe(
        "rgb(255, 238, 221)"
      );
    }
  );

  it("migrates saved role fields once while preserving content and layout", () => {
    const layout = makeLayout("HeroSection");
    Object.assign(layout.root.props!, {
      version: editorMigrations.length,
      sectionLibraryMigrationVersion: 4,
    });
    const props = layout.content[0].props;
    props.styles.backgroundColor = {
      selectedColor: "black",
      contrastingColor: "white",
    };
    props.styles.variant = "compact";
    props.slots.PrimaryCTASlot[0].props.styles = {
      variant: "primary",
      color: { selectedColor: "black" },
    };
    const before = structuredClone(layout);
    const migrated = migrate(
      config,
      layout,
      streamDocument,
      editorMigrations,
      migrationRegistry
    );
    expect(migrated.content[0].props.styles).toMatchObject({
      variant: "compact",
    });
    expect(migrated.content[0].props.styles).not.toHaveProperty("surface");
    expect(migrated.content[0].props.styles.backgroundColor).toEqual(
      before.content[0].props.styles.backgroundColor
    );
    expect(
      migrated.content[0].props.slots.PrimaryCTASlot[0].props.styles
    ).toEqual(before.content[0].props.slots.PrimaryCTASlot[0].props.styles);
    expect(
      migrated.content[0].props.slots.PrimaryCTASlot[0].props.data
    ).toEqual(before.content[0].props.slots.PrimaryCTASlot[0].props.data);
    expect(migrated.root.props).toHaveProperty(
      "sectionLibraryMigrationVersion",
      migrationRegistry.length
    );
    expect(
      migrate(
        config,
        migrated,
        streamDocument,
        editorMigrations,
        migrationRegistry
      )
    ).toEqual(migrated);
    expect(layout).toEqual(before);
  });
});
