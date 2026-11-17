# Visual Editor theme payload contract

This reference documents the complete shape of dynamic theme payload version 1. Read the example for structure; replace its blue palette and design choices with the input brand. The installed package's public types and validator take precedence if its contract differs.

Translate the known brand into a small collection plan:

| Collection   | Decide before writing the payload                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `colors`     | Surface/background and readable foreground pairs, plus colors needed by action states. Put the intended default pair first.                |
| `typography` | The actual text treatments the site needs, including explicit mobile sizes and line heights. Put the intended default treatment first.     |
| `actions`    | Independently styled button and link presets, each with complete default, hover, and active states. Put the intended default action first. |
| `page`       | Content width, vertical section spacing, image/card radii, and card border width.                                                          |

Use descriptive labels for editors and stable identifiers for saved references. An identifier must be 1–128 characters, start with an ASCII letter or digit, and otherwise contain only ASCII letters, digits, `_`, or `-`. Identifiers are case sensitive and unique within their collection. Labels are nonempty, at most 200 characters, and can be renamed. Neither labels nor array positions are identity.

Collection counts and identifiers are yours to choose. Prefer the smallest set that expresses the brand's actual treatments. Array order controls defaults. Keep all three collections nonempty.

## Construct complete entries

Use the public type in TypeScript:

```ts
import { type ThemeData, validateThemeData } from "@yext/visual-editor";
```

For a JSON destination, save only the payload object. It must contain ordinary JSON values, with `version: 1`. Validation requires every property shown below except optional `onDark`; it does not populate defaults. Objects are strict, so unsupported properties are errors.

### Shared colors and inheritance

A color entry contains `id`, `label`, `background`, and `foreground`. Choose the foreground to remain readable on that background. Backgrounds support solid colors, alpha, and supported gradients; foregrounds support solid colors and alpha.

Use explicit references inside action states:

```ts
{ colorId: "brand", channel: "foreground" }
```

The channel selects the exact half of the pair. For example, a filled button can use `brand.background` as its background and `brand.foreground` as its text. An outlined button may use another pair's foreground for its border. Action state colors always reference the shared palette, including transparent colors.

Ordinary component text with an unset color override inherits the foreground established by the nearest selected background pair, including nested backgrounds and custom background/foreground pairs. Action states specify their own colors; retain `data-ve-action` on actions so package CSS controls default, hover, and active styles. Check copied action implementations and inline overrides for stale surface inheritance that defeats the selected states. Set an explicit component color only when that override is intentional.

Use `Background` from `@yext/visual-editor/section-library-support` around themed sections. It selects the action appearance from the resolved background; nested backgrounds reset appearance appropriately. For images or gradients, explicitly set `className="ve-theme-on-dark"` or `className="ve-theme-on-light"` on the relevant wrapper. Copied background/action implementations should follow this package behavior. Payload-only and layout-only tasks should report integration gaps; update runtime implementations when that work is authorized.

### Typography and action structure

Typography groups contain font family, desktop/mobile font sizes, weight, style, desktop/mobile line heights, letter spacing, and text transform. Mobile values apply below 640px and must be saved even when identical to desktop values. Selecting a typography group does not change an element's semantic heading level.

Actions own their typography directly. They do not reference typography groups. Their `fontWeight` lives in each state, rather than at the action's top level. Each action requires full `default`, `hover`, and `active` objects. Follow SKILL.md's interaction guidance to give these states visible feedback, including inferred treatments when the guide omits states, and explain any repeated-state exceptions.

A `button` action also requires padding, border radius, border width, and background/border references in every state. A `link` action omits those button-only properties. Top-level states define the light-background appearance. An optional `onDark` object contains a complete second set of `default`, `hover`, and `active` states with the same required state properties for that presentation; it is not a partial patch. If omitted, dark backgrounds reuse the top-level states. Typography and button shape remain shared across appearances (state fields such as `fontWeight` still belong to each state). Use separate presets for distinct roles or different typography/shapes, rather than merely for background brightness.

For example, clone a link’s complete light states, then adapt every dark state with palette references:

```ts
const action = themeData.actions.find((entry) => entry.id === "text-link")!;
action.onDark = structuredClone({
  default: action.default,
  hover: action.hover,
  active: action.active,
});
for (const state of Object.values(action.onDark)) {
  state.textColor = { colorId: "canvas", channel: "background" };
}
action.onDark.hover.textDecoration = "none";
```

Here `canvas.background` is white in the example below. Choose brand-specific dark-state colors and visible feedback for the actual payload; validate every reference and inspect contrast on each intended surface.

### Complete example

This example illustrates the structure with a blue palette and Open Sans. Replace its design choices with the known brand's choices. Add typography groups and action presets where the site's hierarchy requires them; the example's counts are not prescribed roles.

```ts
const themeData: ThemeData = {
  version: 1,
  colors: [
    {
      id: "canvas",
      label: "Page surface",
      background: "#FFFFFF",
      foreground: "#172033",
    },
    {
      id: "brand",
      label: "Brand blue",
      background: "#1746A2",
      foreground: "#FFFFFF",
    },
    {
      id: "brand-hover",
      label: "Brand blue hover",
      background: "#12377F",
      foreground: "#FFFFFF",
    },
    {
      id: "brand-active",
      label: "Brand blue pressed",
      background: "#0C2659",
      foreground: "#FFFFFF",
    },
  ],
  typography: [
    {
      id: "body",
      label: "Body copy",
      fontFamily: "'Open Sans', 'Open Sans Fallback', sans-serif",
      fontSize: 16,
      mobileFontSize: 16,
      fontWeight: "400",
      fontStyle: "normal",
      lineHeight: "1.5",
      mobileLineHeight: "1.5",
      letterSpacing: "0em",
      textTransform: "none",
    },
    {
      id: "display",
      label: "Large heading",
      fontFamily: "'Open Sans', 'Open Sans Fallback', sans-serif",
      fontSize: 48,
      mobileFontSize: 32,
      fontWeight: "700",
      fontStyle: "normal",
      lineHeight: "1.15",
      mobileLineHeight: "1.2",
      letterSpacing: "-0.02em",
      textTransform: "none",
    },
  ],
  actions: [
    {
      id: "filled",
      label: "Filled brand button",
      presentation: "button",
      fontFamily: "'Open Sans', 'Open Sans Fallback', sans-serif",
      fontSize: 16,
      mobileFontSize: 16,
      fontStyle: "normal",
      lineHeight: "1.5",
      mobileLineHeight: "1.5",
      letterSpacing: "0em",
      textTransform: "none",
      transition:
        "color 150ms ease, background 150ms ease, border-color 150ms ease",
      padding: "12px 24px",
      borderRadius: 6,
      borderWidth: "1px",
      default: {
        fontWeight: "600",
        textDecoration: "none",
        textColor: { colorId: "brand", channel: "foreground" },
        backgroundColor: { colorId: "brand", channel: "background" },
        borderColor: { colorId: "brand", channel: "background" },
      },
      hover: {
        fontWeight: "600",
        textDecoration: "none",
        textColor: { colorId: "brand-hover", channel: "foreground" },
        backgroundColor: { colorId: "brand-hover", channel: "background" },
        borderColor: { colorId: "brand-hover", channel: "background" },
      },
      active: {
        fontWeight: "600",
        textDecoration: "none",
        textColor: { colorId: "brand-active", channel: "foreground" },
        backgroundColor: { colorId: "brand-active", channel: "background" },
        borderColor: { colorId: "brand-active", channel: "background" },
      },
    },
    {
      id: "text-link",
      label: "Underlined brand link",
      presentation: "link",
      fontFamily: "'Open Sans', 'Open Sans Fallback', sans-serif",
      fontSize: 16,
      mobileFontSize: 16,
      fontStyle: "normal",
      lineHeight: "1.5",
      mobileLineHeight: "1.5",
      letterSpacing: "0em",
      textTransform: "none",
      transition: "color 150ms ease",
      default: {
        fontWeight: "600",
        textDecoration: "underline",
        textColor: { colorId: "brand", channel: "background" },
      },
      hover: {
        fontWeight: "600",
        textDecoration: "underline",
        textColor: { colorId: "brand-hover", channel: "background" },
      },
      active: {
        fontWeight: "600",
        textDecoration: "underline",
        textColor: { colorId: "brand-active", channel: "background" },
      },
    },
  ],
  page: {
    imageBorderRadius: 8,
    cardBorderRadius: 8,
    cardBorderWidth: "1px",
    pageContentMaxWidth: 1200,
    pageSectionVerticalSpacing: 48,
  },
};
```

### Supported value forms

| Property                                          | Required value form                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Font sizes, radii, content width, section spacing | Numbers in pixels. Sizes/content width must be positive; radii/spacing may be zero. Maximum 10000.                                 |
| `fontWeight`                                      | Integer **string** from `"1"` to `"1000"`, such as `"400"`; choose a weight the font actually supplies.                            |
| `fontStyle`                                       | `"normal"` or `"italic"`; choose an available font style.                                                                          |
| Line heights                                      | Positive numeric strings such as `"1.5"`, or positive `px`, `rem`, `em`, `%` lengths.                                              |
| `letterSpacing`                                   | Signed length with `px`, `rem`, `em`, or `%`, including `"0em"`.                                                                   |
| `padding`                                         | One to four nonnegative lengths with those units, or `0`, such as `"12px 24px"`.                                                   |
| Border widths                                     | Nonnegative `px`, `rem`, or `em` length, or `"0"`.                                                                                 |
| `textTransform`                                   | `"none"`, `"uppercase"`, `"lowercase"`, or `"capitalize"`.                                                                         |
| State `textDecoration`                            | `"none"`, `"underline"`, `"overline"`, or `"line-through"`.                                                                        |
| `transition`                                      | `"none"`, or supported property/duration/timing expressions as in the example. Consult the schema before using another expression. |

For solid colors, prefer hex (`#RGB`, `#RGBA`, `#RRGGBB`, or `#RRGGBBAA`). Supported alternatives include valid `rgb()`/`rgba()` and `hsl()`/`hsla()` values, plus `transparent`, `black`, and `white`. Other named colors and arbitrary CSS expressions are outside this contract.

For gradients, use supported `linear-gradient()` or `radial-gradient()` syntax, for example `linear-gradient(135deg, #1746A2, #0C2659)`. Only action backgrounds can reference a gradient channel; action text and borders need solid channels. A gradient pair's foreground remains a valid solid text reference. Check alpha colors against the actual surface showing through them.

Generate exact selector values for every typography and action `fontFamily`:

```ts
import {
  constructFontSelectOptions,
  defaultFonts,
  type FontRegistry,
} from "@yext/visual-editor";

// Obtain customFonts from the site's existing font integration; use {} for Google-only sites.
const fontOptions = (customFonts: FontRegistry) =>
  constructFontSelectOptions({ ...defaultFonts, ...customFonts });
// Select by family label and copy the option.value exactly, for example:
// "'Open Sans', 'Open Sans Fallback', sans-serif"
```

Use only supported Google Fonts or available custom fonts, with their matching fallback name and generic family. Writing a family name does not install a font. Verify available weights and italics where the catalog or assets are accessible, including those used only by actions. If the brand font is unavailable, follow the font handling instructions in SKILL.md and report the remaining registration requirement. Preserve existing `__customFontAssets` metadata when retaining custom fonts; let the site's font integration generate accurate stylesheet/preload paths when introducing fonts. Keep font registration and asset creation in that integration rather than inventing payload properties.

The completed object must express the brand with every required mobile/state property and compatible shared color references. Report font-loading assumptions outside the payload.

## Inspect and validate the installed package

Run commands from the target site's repository root so Node resolves that site's dependency. Locate the public runtime entrypoint with:

```bash
node --input-type=module -e 'console.log(import.meta.resolve("@yext/visual-editor"))'
```

Within that installed package, read its `package.json`. Follow `exports["."].types` (or the top-level `types` field) to the public TypeScript declarations. Follow relative declaration imports/re-exports to find `ThemeData`, `ThemeColorReference`, and `ThemeValidationResult`; bundled declarations may use generated filenames and export aliases. These files are shipped with the installed dependency. Read them in place without editing the dependency. Import public APIs through `@yext/visual-editor`, rather than importing the generated chunks.

For a complete structural baseline, the installed package also publicly exports `defaultThemeData`. It can be inspected through that same entrypoint; use the brand's values rather than retaining its default design.

Validate the candidate before saving, serialize `result.data`, then validate the saved bytes again using the same registry. The read-only command below checks an existing candidate or saved artifact against bundled Google Fonts. For custom fonts, pass a second path to a local ESM module exporting the site’s available `customFonts` registry; use a TypeScript-capable runner if that integration requires one. Replace the example path with the actual brand-named path:

```bash
node --input-type=module - /absolute/path/to/acme-visual-editor-theme.json <<'NODE'
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { validateThemeData } from "@yext/visual-editor";

const payload = JSON.parse(readFileSync(process.argv[2], "utf8"));
const customFonts = process.argv[3]
  ? (await import(pathToFileURL(resolve(process.argv[3])).href)).customFonts
  : {};
if (!customFonts || typeof customFonts !== "object" || Array.isArray(customFonts)) {
  throw new Error("Expected an available custom FontRegistry export named customFonts.");
}
const result = validateThemeData(payload, customFonts);
if (!result.success || !result.data || result.errors.length || result.warnings.length) {
  console.error(JSON.stringify({ errors: result.errors, warnings: result.warnings }, null, 2));
  process.exitCode = 1;
} else {
  console.log("Theme payload validates with zero errors and warnings.");
}
NODE
```

The validation result has `success: boolean`, optional parsed `data: ThemeData`, and `errors`/`warnings` arrays. Each issue contains `severity`, `code`, `path: (string | number)[]`, and `message`. Use the parsed data when producing the final JSON. Validation does not fill missing mobile or state properties. Missing/incompatible color references are warnings, so checking `success` alone is insufficient. Pass the available custom `FontRegistry` as the second argument; omitting it validates against bundled Google Fonts only. The package editor already supplies that registry for field edits and JSON imports. Font failures use `unsupported_font_family` with paths such as `["actions", 0, "fontFamily"]` or typography paths. Legacy shorthand stacks still render but need correction before saving. Use `validateThemeData` for supported-font checks: `themeDataSchema.parse` only checks structure and syntax.
