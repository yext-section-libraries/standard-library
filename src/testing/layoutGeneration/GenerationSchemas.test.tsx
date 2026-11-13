import { describe, expect, it } from "vitest";
import { StaticMapSection } from "../../library/sections/StaticMapSection.tsx";
import { defaultAboutSectionProps } from "../../library/shared/sectionSupport/pageSections/AboutSection/AboutSectionDetailsColumn.tsx";
import { assetVideoSchema } from "../../library/shared/sectionSupport/contentBlocks/Video.tsx";
import { components, generationSchema } from "./generationTestUtils.ts";

const aboutSectionDetailsColumnSchema = generationSchema(
  "AboutSectionDetailsColumn"
);
const staticMapSectionSchema = generationSchema("StaticMapSection");

describe("generation schema constraints", () => {
  it("accepts every supported About sidebar content type and rejects mismatched content", () => {
    for (const [type, content] of Object.entries(defaultAboutSectionProps)) {
      const section = {
        header: { field: "", constantValue: { defaultValue: "Details" } },
        content: { type, [type]: content },
      };
      expect(() =>
        aboutSectionDetailsColumnSchema.parse({ sections: [section] })
      ).not.toThrow();
      expect(
        aboutSectionDetailsColumnSchema.safeParse({
          sections: [{ ...section, content: { type } }],
        }).success
      ).toBe(false);
    }
  });

  it.each(["hoursTable", "emails", "phone"] as const)(
    "enforces native %s constraints inside About's custom content editor",
    (type) => {
      const content = structuredClone(defaultAboutSectionProps[type]) as any;
      if (type === "hoursTable") content.styles.startOfWeek = "unsupported";
      if (type === "emails") content.styles.listLength = 1.5;
      if (type === "phone") content.styles.phoneFormat = "unsupported";
      expect(
        aboutSectionDetailsColumnSchema.safeParse({
          sections: [
            {
              header: { field: "", constantValue: "Details" },
              content: { type, [type]: content },
            },
          ],
        }).success
      ).toBe(false);
    }
  );

  it.each(["ExpandedFooter"])(
    "accepts saved widths without a mounted theme for %s",
    (name) => {
      const schema = generationSchema(name);
      const props = structuredClone(components[name].defaultProps!);
      for (const maxWidth of [
        "theme",
        "fullWidth",
        "768px",
        "960px",
        "1024px",
        "1280px",
        "1440px",
        null,
      ]) {
        props.styles.maxWidth = maxWidth;
        expect(schema.safeParse(props).success, String(maxWidth)).toBe(true);
      }
      props.styles.maxWidth = "unsupported";
      expect(schema.safeParse(props).success).toBe(false);
      delete props.styles.maxWidth;
      expect(schema.safeParse(props).success).toBe(name === "ExpandedFooter");
    }
  );

  it("keeps integer bounds and optional email limits", () => {
    const emailProps = structuredClone(components.Emails.defaultProps!);
    const emailSchema = generationSchema("Emails");
    for (const listLength of [1, 5]) {
      emailProps.styles.listLength = listLength;
      expect(emailSchema.safeParse(emailProps).success).toBe(true);
    }
    for (const listLength of [0, 6, 1.5]) {
      emailProps.styles.listLength = listLength;
      expect(emailSchema.safeParse(emailProps).success).toBe(false);
    }
    delete emailProps.styles.listLength;
    expect(emailSchema.safeParse(emailProps).success).toBe(true);

    const nearbyProps = structuredClone(
      components.NearbyLocationCardsWrapper.defaultProps!
    );
    const nearbySchema = generationSchema("NearbyLocationCardsWrapper");
    for (const limit of [1, 50]) {
      nearbyProps.data.limit = limit;
      expect(nearbySchema.safeParse(nearbyProps).success).toBe(true);
    }
    for (const limit of [0, 51, 1.5]) {
      nearbyProps.data.limit = limit;
      expect(nearbySchema.safeParse(nearbyProps).success).toBe(false);
    }
    delete nearbyProps.data.limit;
    expect(nearbySchema.safeParse(nearbyProps).success).toBe(false);
  });

  it("preserves video assets and requires their native fields", () => {
    const asset = {
      id: "asset",
      name: "Tour",
      video: {
        id: "video",
        title: "Tour",
        url: "https://www.youtube.com/watch?v=tour",
        embeddedUrl: "https://www.youtube.com/embed/tour",
        thumbnail: "https://example.com/thumbnail.jpg",
        duration: "60",
      },
    };
    expect(assetVideoSchema.parse(asset)).toEqual(asset);
    expect(
      generationSchema("VideoSlot").parse({ data: { assetVideo: asset } })
    ).toEqual({
      data: { assetVideo: asset },
    });
    const { embeddedUrl: _embeddedUrl, ...incompleteVideo } = asset.video;
    expect(
      assetVideoSchema.safeParse({ ...asset, video: incompleteVideo }).success
    ).toBe(false);
    expect(assetVideoSchema.safeParse(undefined).success).toBe(false);
  });

  it("restricts pin ratios to editor options while allowing an omitted icon", () => {
    const schema = generationSchema("Locator");
    const props = structuredClone(components.Locator.defaultProps!);
    props.locationStyles = [{ entityType: "location" }];
    expect(schema.safeParse(props).success).toBe(true);
    for (const aspectRatio of [0.5, 1, 1.78, 4]) {
      props.locationStyles[0].pinIcon = { type: "customImage", aspectRatio };
      expect(schema.safeParse(props).success).toBe(true);
    }
    for (const aspectRatio of [0, -1, 1.234]) {
      props.locationStyles[0].pinIcon = { type: "customImage", aspectRatio };
      expect(schema.safeParse(props).success).toBe(false);
    }
    props.locationStyles[0].pinIcon = {};
    expect(schema.safeParse(props).success).toBe(false);
  });

  it("rejects unsupported map styles", () => {
    expect(
      staticMapSectionSchema.safeParse({
        ...StaticMapSection.defaultProps,
        styles: { mapStyle: "unsupported" },
      }).success
    ).toBe(false);
  });
});
