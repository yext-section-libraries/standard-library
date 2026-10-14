import React from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { page } from "@vitest/browser/context";
import type { Config } from "@puckeditor/core";
import { migrate, toPuckFields } from "@yext/visual-editor";
import "./componentTests.setup.ts";
import { VisualEditorProvider } from "./TestVisualEditorProvider.tsx";
import { PhotoGallerySection } from "../library/sections/PhotoGallerySection.tsx";
import { Grid } from "../library/sections/Grid.tsx";
import {
  PhotoGalleryWrapper,
  type PhotoGalleryWrapperProps,
} from "../library/shared/sectionSupport/pageSections/PhotoGallerySection/PhotoGalleryWrapper.tsx";
import { photoGallerySource } from "../library/shared/sectionSupport/pageSections/PhotoGallerySection/photoGallerySource.ts";
import { migrationRegistry } from "../library/migrations/registry.ts";

const columnCounts = [1, 2, 3, 4, 5, 6] as const;
const config: Config = {
  components: {
    PhotoGallerySection: {
      ...PhotoGallerySection,
      fields: toPuckFields(PhotoGallerySection.fields!),
    },
    PhotoGalleryWrapper: {
      ...PhotoGalleryWrapper,
      fields: toPuckFields(PhotoGalleryWrapper.fields!),
    },
  },
};

const renderGallery = (
  columns: PhotoGalleryWrapperProps["styles"]["columns"] | undefined,
  variant: "gallery" | "carousel" = "gallery"
) =>
  render(
    <VisualEditorProvider
      templateProps={{
        document: {
          locale: "en",
          photoGallery: Array.from({ length: 7 }, (_, index) => ({
            url: `${window.location.origin}/src/library/layouts/standard-library/preview.png`,
            width: 100,
            height: 100,
            alternateText: `Image ${index}`,
          })),
        },
      }}
    >
      <PhotoGalleryWrapper.render
        id="column-gallery"
        data={{
          images: {
            ...photoGallerySource.defaultValue,
            field: "photoGallery",
            constantValueEnabled: false,
            mappings: {
              image: {
                field: "$item",
                constantValueEnabled: false,
                constantValue: undefined,
              },
              link: {
                field: "",
                constantValueEnabled: false,
                constantValue: undefined,
              },
            },
          },
        }}
        styles={{
          ...PhotoGalleryWrapper.defaultProps!.styles!,
          // Exercise legacy props before migration as well as configured values.
          columns: columns as PhotoGalleryWrapperProps["styles"]["columns"],
        }}
        parentData={{ variant }}
        puck={{
          isEditing: false,
          dragRef: null,
          metadata: {},
          renderDropZone: () => <div />,
        }}
      />
    </VisualEditorProvider>
  );

describe("Photo gallery columns", () => {
  it("defaults to three columns in both gallery configs", () => {
    expect(PhotoGalleryWrapper.defaultProps!.styles!.columns).toBe(3);
    expect(
      PhotoGallerySection.defaultProps!.slots!.PhotoGalleryWrapper[0].props
        .styles.columns
    ).toBe(3);
  });

  it("matches Grid options and only exposes columns for the gallery variant", async () => {
    const resolveFields = PhotoGalleryWrapper.resolveFields!;
    const props = {
      ...PhotoGalleryWrapper.defaultProps!,
      id: "fields-gallery",
      styles: {
        ...PhotoGalleryWrapper.defaultProps!.styles!,
        columns: 5 as const,
      },
    };
    const params = {} as Parameters<typeof resolveFields>[1];
    for (const variant of ["gallery", "carousel", "gallery"] as const) {
      const fields = await resolveFields(
        {
          props: { ...props, parentData: { variant } },
        },
        params
      );
      const styles = fields.styles;
      expect(styles?.type).toBe("object");
      if (styles?.type !== "object") throw new Error("Missing style fields");
      if (variant === "gallery") {
        expect(styles.objectFields.columns).toMatchObject(
          toPuckFields(Grid.fields!).columns
        );
        expect(styles.objectFields.carouselImageCount).toHaveProperty(
          "visible",
          false
        );
      } else {
        expect(styles.objectFields.columns).toHaveProperty("visible", false);
        expect(styles.objectFields.carouselImageCount).toBeDefined();
      }
      expect(props.styles.columns).toBe(5);
    }
  });

  it.each(columnCounts)(
    "renders %i columns with Grid breakpoints and keeps all images",
    async (columns) => {
      const { container } = renderGallery(columns);
      const grid = container.querySelector(".grid")!;
      expect(container.querySelectorAll("img")).toHaveLength(7);
      for (const [width, expected] of [
        [640, 1],
        [767, 1],
        [768, columns === 1 ? 1 : 2],
        [1023, columns === 1 ? 1 : 2],
        [1024, columns],
      ]) {
        await page.viewport(width, 900);
        await waitFor(() => {
          expect(
            getComputedStyle(grid).gridTemplateColumns.split(" ")
          ).toHaveLength(expected);
        });
      }
      expect(grid.children).toHaveLength(7);
      expect(
        grid.children[columns].getBoundingClientRect().top
      ).toBeGreaterThan(grid.children[0].getBoundingClientRect().top);
      const sizes = container.querySelector("img")!.getAttribute("sizes");
      expect(sizes).toContain(`/ ${columns}`);
      expect(sizes).toContain("min-width: 768px");
    }
  );

  it("falls back to three columns for unmigrated gallery props", async () => {
    await page.viewport(1024, 900);
    const { container } = renderGallery(undefined);
    await waitFor(() => {
      expect(
        getComputedStyle(
          container.querySelector(".grid")!
        ).gridTemplateColumns.split(" ")
      ).toHaveLength(3);
    });
  });

  it.each([1, 6] as const)(
    "leaves carousel rendering unchanged with columns %i",
    (columns) => {
      const { container } = renderGallery(columns, "carousel");
      expect(container.querySelector(".grid")).toBeNull();
      expect(container.querySelectorAll("img")).toHaveLength(14);
      expect(container.querySelectorAll("button").length).toBeGreaterThan(0);
    }
  );

  it.each(["gallery", "carousel"] as const)(
    "migrates nested %s wrappers without losing data and skips repeat migrations",
    (variant) => {
      const wrappers = [undefined, 6].map((columns, index) => ({
        type: "PhotoGalleryWrapper",
        props: {
          ...PhotoGalleryWrapper.defaultProps!,
          id: `migrating-gallery-${index}`,
          styles: {
            image: { aspectRatio: 1.78 },
            carouselImageCount: 2,
            columns,
          },
          parentData: { variant },
        },
      }));
      const data = {
        root: { props: {} },
        content: [
          {
            type: "PhotoGallerySection",
            props: {
              ...PhotoGallerySection.defaultProps!,
              id: "migrating-section",
              slots: { HeadingSlot: [], PhotoGalleryWrapper: wrappers },
            },
          },
        ],
      };
      const migrated = migrate(config, data, {}, [], migrationRegistry);
      const migratedWrappers =
        migrated.content[0].props.slots.PhotoGalleryWrapper;
      expect(migratedWrappers[0].props.styles.columns).toBe(3);
      expect(migratedWrappers[1].props.styles.columns).toBe(6);
      expect(migratedWrappers[0].props.data).toEqual(wrappers[0].props.data);
      expect(migratedWrappers[0].props.styles.carouselImageCount).toBe(2);
      expect(migratedWrappers[0].props.parentData).toEqual({ variant });
      expect(migrated.root.props).toMatchObject({
        sectionLibraryMigrationVersion: 1,
      });
      expect(migrate(config, migrated, {}, [], migrationRegistry)).toEqual(
        migrated
      );
      expect(
        data.content[0].props.slots.PhotoGalleryWrapper[0].props.styles.columns
      ).toBeUndefined();
    }
  );
});
