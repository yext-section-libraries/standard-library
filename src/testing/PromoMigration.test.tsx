import { describe, expect, it } from "vitest";
import { migrationRegistry } from "../library/migrations/registry.ts";
import { makeLayout } from "./generationTestUtils.ts";

describe("legacy promo image migration", () => {
  const migration = (migrationRegistry[1] as any).PromoSection
    .propTransformation;
  it("recovers existing dimensions and preserves unrelated authored values", () => {
    const props = makeLayout("PromoSection").content[0].props;
    const assetUrl = "https://example.com/image.png?width=1440&height=900";
    props.data.backgroundImage.constantValue = { defaultValue: assetUrl };
    const migrated = migration(props, {});
    expect(migrated.data.backgroundImage.constantValue.defaultValue).toEqual({
      url: assetUrl,
      width: 1440,
      height: 900,
    });
    expect(migrated.styles).toBe(props.styles);
    expect(migrated.slots).toBe(props.slots);
    expect(migration(migrated, {})).toBe(migrated);
  });
  it.each([
    "https://example.com/image.png",
    "https://example.com/image.png?width=-1&height=900",
    "invalid",
  ])("preserves assets without known valid dimensions: %s", (assetUrl) => {
    const props = makeLayout("PromoSection").content[0].props;
    props.data.backgroundImage.constantValue = { defaultValue: assetUrl };
    expect(migration(props, {})).toBe(props);
  });
});
