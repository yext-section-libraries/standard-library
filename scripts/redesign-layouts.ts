import { organizePageContent } from "../src/library/shared/design/pageStructure.ts";
import { migrationRegistry } from "../src/library/migrations/registry.ts";
import { textInheritance } from "../src/library/migrations/0007_text_inheritance.ts";
import { designDefaults } from "../src/library/migrations/0006_design_defaults.ts";
import { upgradeResponsiveDesign } from "../src/library/shared/design/upgradeResponsiveDesign.ts";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  cardGridDefaults,
  cardListDefaults,
} from "../src/library/shared/design/cardLayout.tsx";
import {
  composableSectionNames,
  compositionData,
} from "../src/library/shared/design/compositionData.ts";

const sectionNames = new Set<string>(composableSectionNames);
let count = 0;
let cardCount = 0;
let upgradeStoredDesign = false;
let upgradeTextDefaults = false;
function convert(value: any): any {
  if (Array.isArray(value)) return value.map(convert);
  if (!value || typeof value !== "object") return value;
  if (value.props && upgradeStoredDesign)
    value = {
      ...value,
      props:
        value.type === "Heading" || value.type === "Paragraph"
          ? designDefaults[value.type].propTransformation(value.props)
          : upgradeResponsiveDesign(value.props),
    };
  if (value.props && upgradeTextDefaults) {
    const migration =
      textInheritance[value.type as keyof typeof textInheritance];
    if (migration)
      value = { ...value, props: migration.propTransformation(value.props) };
  }
  if (
    [
      "ProductCardsWrapper",
      "TeamCardsWrapper",
      "TestimonialCardsWrapper",
      "InsightCardsWrapper",
      "EventCardsWrapper",
    ].includes(value.type) &&
    value.props &&
    value.props.layout === undefined
  ) {
    value = {
      ...value,
      props: {
        ...structuredClone(
          value.type === "EventCardsWrapper"
            ? cardListDefaults
            : cardGridDefaults
        ),
        ...value.props,
      },
    };
    cardCount++;
  }
  if (
    sectionNames.has(value.type) &&
    value.props &&
    value.props.content === undefined
  ) {
    value = {
      ...value,
      props: {
        id: value.props.id,
        ...compositionData(value.type, value.props, true),
      },
    };
    count++;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, convert(child)])
  );
}

for (const entry of readdirSync("src/library/layouts", {
  withFileTypes: true,
})) {
  if (!entry.isDirectory()) continue;
  const directory = entry.name;
  const path = join("src/library/layouts", directory, "defaultLayout.json");
  const original = readFileSync(path, "utf8");
  const stored = JSON.parse(original);
  upgradeStoredDesign =
    (stored.root?.props?.sectionLibraryMigrationVersion ?? 0) < 6;
  upgradeTextDefaults =
    (stored.root?.props?.sectionLibraryMigrationVersion ?? 0) < 7;
  const updated = convert(stored);
  updated.content = organizePageContent(updated.content);
  updated.root.props.sectionLibraryMigrationVersion = migrationRegistry.length;
  const text = `${JSON.stringify(updated, null, 2)}\n`;
  if (text !== original) writeFileSync(path, text);
}
console.log(
  `Converted ${count} section layouts and initialized ${cardCount} mapped card layouts.`
);
