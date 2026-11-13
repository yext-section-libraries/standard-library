import { describe, expect, it } from "vitest";
import {
  migrate,
  migrationRegistry as editorMigrations,
} from "@yext/visual-editor";
import { typographyRoleOptions } from "@yext/visual-editor/section-library-support";
import { migrateTypographyProps } from "../library/migrations/0006_typography_roles.ts";
import { migrationRegistry } from "../library/migrations/registry.ts";
import {
  config,
  generationSchema,
  makeLayout,
} from "./layoutGeneration/generationTestUtils.ts";
import { LocatorResultCardFields } from "../library/shared/sectionSupport/locator/LocatorResultCard.tsx";

const roles = [
  "headline",
  "section-title",
  "card-title",
  "eyebrow",
  "body-small",
  "body",
  "body-large",
];

describe("unified typography roles", () => {
  it.each([
    ["xs", "body-small"],
    ["sm", "body-small"],
    ["base", "body"],
    ["lg", "body-large"],
  ])(
    "converts saved %s sizes across text, hours, FAQ, header, and locator fields",
    (variant, typographyRole) => {
      const props = {
        id: "stable-component",
        styles: {
          variant,
          color: { selectedColor: "[#123456]", contrastingColor: "white" },
          align: "right",
        },
        slots: {
          HoursSlot: [
            {
              type: "HoursStatusSlot",
              props: { id: "hours", styles: { bodyVariant: variant } },
            },
          ],
        },
        cards: [
          {
            props: {
              secondaryHeading: {
                variant,
                field: "specialties",
                trueDisplayText: { defaultValue: "Yes" },
              },
              tertiaryHeading: { variant },
              styles: { questionVariant: variant, answerVariant: variant },
            },
          },
        ],
        data: {
          text: { constantValue: { defaultValue: "Authored" }, field: "name" },
          typographyRole: "lead",
          variant,
        },
      };
      const before = structuredClone(props);
      const migrated = migrateTypographyProps(props);
      expect(migrated.styles).toEqual({
        typographyRole,
        color: before.styles.color,
        align: "right",
      });
      expect(migrated.slots.HoursSlot[0].props.styles).toEqual({
        typographyRole,
      });
      expect(migrated.cards[0].props.secondaryHeading).toEqual({
        typographyRole,
        field: "specialties",
        trueDisplayText: { defaultValue: "Yes" },
      });
      expect(migrated.cards[0].props.tertiaryHeading).toEqual({
        typographyRole,
      });
      expect(migrated.cards[0].props.styles).toEqual({
        questionTypographyRole: typographyRole,
        answerTypographyRole: typographyRole,
      });
      expect(migrated.data).toEqual(before.data);
      expect(migrated.id).toBe(before.id);
      expect(migrated.slots.HoursSlot[0].props.id).toBe("hours");
      expect(migrateTypographyProps(migrated)).toEqual(migrated);
      expect(props).toEqual(before);
    }
  );

  it.each([
    ["lead", "eyebrow"],
    ["fine-print", "body-small"],
    ["headline", "headline"],
  ])(
    "retains the selected %s role ahead of an old size",
    (savedRole, expectedRole) => {
      const result = migrateTypographyProps({
        styles: { typographyRole: savedRole, variant: "lg" },
        parentStyles: { typographyRole: savedRole },
      });
      expect(result.styles).toEqual({ typographyRole: expectedRole });
      expect(result.parentStyles).toEqual({ typographyRole: expectedRole });
    }
  );

  it("retains layout and CTA variants while clearing obsolete null sizes", () => {
    const result = migrateTypographyProps({
      styles: { variant: "compact" },
      slots: {
        Body: [
          {
            type: "BodyTextSlot",
            props: {
              styles: { variant: null },
              data: { text: { field: "description" } },
            },
          },
        ],
      },
      cta: { variant: "secondary" },
      custom: { variant: "constructor" },
    });
    expect(result.styles).toEqual({ variant: "compact" });
    expect(result.cta).toEqual({ variant: "secondary" });
    expect(result.custom).toEqual({ variant: "constructor" });
    expect(result.slots.Body[0].props.styles).toEqual({});
  });

  it("updates a version-5 layout even when SDK migration 84 already ran", () => {
    const layout = makeLayout("HeroSection");
    Object.assign(layout.root.props!, {
      version: editorMigrations.length,
      sectionLibraryMigrationVersion: 5,
    });
    const heading = layout.content[0].props.slots.GeomodifierSlot[0].props;
    heading.styles.typographyRole = "lead";
    heading.styles.semanticLevelOverride = 1;
    const migrated = migrate(
      config,
      layout,
      { locale: "en" },
      editorMigrations,
      migrationRegistry
    );
    expect(
      migrated.content[0].props.slots.GeomodifierSlot[0].props.styles
    ).toMatchObject({ typographyRole: "eyebrow", semanticLevelOverride: 1 });
    expect(migrated.root.props).toHaveProperty(
      "sectionLibraryMigrationVersion",
      migrationRegistry.length
    );
    expect(
      migrate(
        config,
        migrated,
        { locale: "en" },
        editorMigrations,
        migrationRegistry
      )
    ).toEqual(migrated);
    expect(heading.styles.typographyRole).toBe("lead");
  });

  it.each(["BodyTextSlot", "TextSlot", "HoursStatusSlot", "HeaderLinks"])(
    "offers one role selector on %s",
    (name) => {
      const schema = generationSchema(name).shape.styles.shape;
      expect(schema).toHaveProperty("typographyRole");
      expect(schema).not.toHaveProperty("variant");
      expect(schema).not.toHaveProperty("bodyVariant");
    }
  );

  it("offers independent FAQ roles and locator supporting-heading roles", () => {
    const faq = generationSchema("FAQCard").shape.styles.shape;
    expect(faq).toHaveProperty("questionTypographyRole");
    expect(faq).toHaveProperty("answerTypographyRole");
    expect(faq).not.toHaveProperty("questionVariant");
    expect(faq).not.toHaveProperty("answerVariant");
    for (const heading of ["secondaryHeading", "tertiaryHeading"] as const) {
      const fields = LocatorResultCardFields.objectFields[heading];
      expect(fields).toHaveProperty("objectFields.typographyRole");
      expect(fields).not.toHaveProperty("objectFields.variant");
    }
    expect(typographyRoleOptions.map((option) => option.value)).toEqual(roles);
  });
});
