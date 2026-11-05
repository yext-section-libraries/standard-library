import type { Config } from "@puckeditor/core";
import {
  migrate,
  migrationRegistry as editorMigrationRegistry,
} from "@yext/visual-editor";
import { describe, expect, it } from "vitest";
import { migrationRegistry as sectionLibraryMigrationRegistry } from "../library/migrations/registry.ts";
import { Grid } from "../library/sections/Grid.tsx";

const config: Config = { components: { Grid } };
const columnFields = [
  "alignColumn1",
  "alignColumn2",
  "alignColumn3",
  "alignColumn4",
  "alignColumn5",
  "alignColumn6",
] as const;

describe("Grid column alignment migration", () => {
  it.each([
    {
      name: "copies the legacy alignment to every column",
      props: { align: "right" },
      expected: ["right", "right", "right", "right", "right", "right"],
    },
    {
      name: "preserves explicit column alignment",
      props: { align: "right", alignColumn2: "center" },
      expected: ["right", "center", "right", "right", "right", "right"],
    },
    {
      name: "defaults missing alignments to left",
      props: { alignColumn1: "center" },
      expected: ["center", "left", "left", "left", "left", "left"],
    },
  ])("$name", ({ props, expected }) => {
    const result = migrate(
      config,
      {
        root: {
          props: {
            version: editorMigrationRegistry.length,
            sectionLibraryMigrationVersion: 2,
          },
        },
        content: [
          {
            type: "Grid",
            props: { id: "Grid-test", columns: 2, slots: [], ...props },
          },
        ],
      },
      {},
      editorMigrationRegistry,
      sectionLibraryMigrationRegistry
    );

    const migratedProps = result.content[0].props;
    expect(columnFields.map((field) => migratedProps[field])).toEqual(expected);
    expect(migratedProps).not.toHaveProperty("align");
    expect(migratedProps.id).toBe("Grid-test");
    expect(result.root.props).toHaveProperty(
      "sectionLibraryMigrationVersion",
      sectionLibraryMigrationRegistry.length
    );
  });
});
