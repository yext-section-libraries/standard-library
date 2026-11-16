# Standard Section Library

This repo provides editable section presets, layout and content atoms, and Yext data blocks for Visual Editor.

## Composable building blocks

Every `*Section` is a draggable preset containing ordinary Puck slots. Insert a preset, then move, remove, or replace its children. Start with Box, Stack, Flex, or Columns for a custom layout. Card, Disclosure, Collection, and Gallery provide reusable patterns. Heading, Paragraph, RichText, Image, Button, Icon, Divider, and Spacer provide content. Address, Hours, phone, directions, maps, reviews, and contact forms retain their Yext behavior. Older content blocks remain under **Legacy blocks** for existing layouts.

Page-level content starts with a Section or a layout container such as Box, Stack, Flex, Columns, Card, or List. Directory and Locator remain page-level tools. Text, images, buttons, and individual Yext data blocks belong inside a suitable container. A Heading can sit directly inside a Section or Card. Lists accept List items, and each List item can contain ordinary content.

The explicit page-area capabilities in `src/library/shared/design/pageStructure.ts` drive the page root, MainContent slots, and generation contracts through root metadata. Nesting permissions do not depend on component-name suffixes.

The field panel uses Puck 0.24 tabs:

- **Content** selects constants, Yext fields, and collection data.
- **Design** uses arrangement diagrams, column previews, alignment buttons, color swatches, and spacing presets. Every option includes a diagram or visual sample and a text label. The selected choice is always marked. **Default** clears the local setting and uses normal element styling; **Parent** inherits surrounding text; **Use Design** clears a responsive exception. These choices do not undo previous edits. Toolbar Undo/Redo reverses edits while keeping the current component selected if it still exists. Open groups and custom inputs stay open across edits and history navigation. Custom sizes use a number and unit picker; CSS formulas and theme tokens have a separate input mode. Optional controls sit under **Fine-tune**, grouped into small fieldsets such as Grid details, Size limits, and Reading comfort, with explanations and space between controls. Arrange content is the single control for normal flow, rows, stacks, and grids; Fine-tune does not repeat it.
- **Responsive** contains only tablet (768–1023px) and mobile (below 768px) exceptions. Design supplies the defaults at every size. Tablet has no preset exceptions. Mobile column layouts stack by default. Clearing an exception restores Design.
- **Accessibility** controls semantic elements, anchor IDs, accessible names, image descriptions, and image purpose.

Style controls follow the selected component and its parent. Flex and Columns arrange their direct children. Grow, shrink, self-alignment, and grid placement appear only when the parent supports them. Image fit appears on Image, and image/divider/spacer blocks do not expose text styling. Alignment needs spare space; a child's own width or self-alignment can limit stretching.

Paragraphs inherit text styles by default. Text defaults on a container apply to children that inherit, while headings, buttons, and explicitly styled text can keep their own appearance. Choose **Parent** on a text control or **Use parent text style** to inherit deliberately. Native atoms attach Puck dragging to their actual HTML elements so item sizing and placement match the published page.

Style inputs offer visual presets, an explicit Custom option, and `var(--token, fallback)` expressions. They use the existing theme variables for fonts, brand colors, content width, and page padding. Optional variables such as `--space-6`, `--color-text`, `--color-surface`, and `--radius-card` can be defined by a future token system. Their fallbacks keep the library usable today. No token editor or token storage is introduced here.

Collection repeats one editable template over manual items or a mapped Yext list. Map its normalized title, body, image, CTA, eyebrow, and supporting text fields in Content. Inside the template, select a Collection item field as an atom's content source. The editor shows one preview item; the published page renders every item. Template edits apply to all items. Anchor IDs inside a template receive an item suffix. For example, choose Offers in Items, map Title to the offer's title and Body to its description, and keep the default Card template. Its Heading and RichText already use those item fields. Unmapped optional images and links are omitted from published output; the editor keeps selectable placeholders. Add or remove atoms inside the Card to change the template for every offer.

Heading tags are independent of font size. Buttons render links for navigation and native buttons for form actions. Image supports descriptions, decorative images, loading priority, dimensions, and source-provided responsive thumbnails. Lists render `ul`/`ol` with `li` children. Disclosure uses native `details` and `summary`. Mapped-empty sections disappear from server HTML unless their visibility setting says to keep them.

Migration 5 converts saved Sections to editable compositions and retains their field bindings. Migration 6 moves desktop defaults into Design, removes the old automatic tablet column exception, preserves custom tablet settings, and retains mobile layouts. It also normalizes saved heading and paragraph constants for direct plain-text editing. Migration 7 moves the old automatic paragraph font defaults to Sections while retaining authored paragraph overrides. Migration 8 groups adjacent loose page-level blocks into editable Boxes, preserving their IDs, authored styles, and data mappings. Content already inside a Section or container is unchanged. Bundled layouts already use the new format. Saved data must pass through the migration registry before rendering; presets use a single composition renderer. The historical section renderers remain as functional adapters and are covered by the original fixtures; `Composition.test.tsx` exercises the public presets, atom styling, mappings, and editor controls.

### Local development across both repos

Use Node 22.18 or newer within the supported Node 22 release line. With `../visual-editor/packages/visual-editor` present, Vite uses its runtime source during development and browser tests. Saving editor source refreshes the library without packing or installing a tarball. React, Puck, translation, and Pages context packages are deduplicated across the repos.

Set `VISUAL_EDITOR_SOURCE` to another package directory, or set `VISUAL_EDITOR_SOURCE=off` to use the installed package. Production builds use the installed package. Build-tool changes in visual-editor still require rebuilding its plugin; the runtime source connection covers editor and component changes.

Run `npm run dev`, then open `/design-system.html` for an interactive example or `/design-system.html?preview` for the page alone. The example runs locally and does not publish anything. It includes sample entity data and field metadata for trying Yext mappings. The platform supplies metadata from the selected entity.

Run `npm run test:design`, `npm run typecheck`, and `npm run validate` for the composable system. Run `npm run design:css` after changing the shared style schema. `npm run layouts:redesign` converts old bundled layout files and can be run again safely. TypeScript excludes plugin-generated templates and configs; Pages verifies those during its build.

The "components" from the `@yext/visual-editor` library (page sections and content blocks) are now considered
"sections" and have `SectionConfig`s in `src/library/sections`. Slot-only components are in `src/library/shared/sectionSupport`
and registered in `src/library/shared/componentRegistry.ts`.

## Development commands

- `npm run dev`: Runs a local development server using example data from the account. See the Local Editor details below.
- `npm run build`: Generates the same files that will be built in-platform. Outputs to `dist`.
- `npm run i18n:prepare`: Extracts keys and reports missing platform translations. See Internationalization below.
- `npm run i18n:finalize`: Validates and propagates completed translations, then lints them. See Internationalization below.
- `npm run validate`: Verifies the section library repo structure is valid. Must pass for upload to succeed.
- `npm run deploy`: Uploads the latest commit to the platform.
- `npm run add-directory-locator`: Adds the necessary files for a directory and locator to the repo.
- `npm run convert-template`: Converts a legacy template to section library format.

## Section Library structure

```text
src/
  library/
    library.json
    sections/
      Hero.tsx
      Directory.tsx
      Locator.tsx
    shared/
      componentRegistry.ts
    layouts/
      location/
        preview.[png, jpg, jpeg, webp]
        metadata.json
        defaultLayout.json
      citation/
        preview.[png, jpg, jpeg, webp]
        metadata.json
        defaultLayout.json
      directory/
        preview.[png, jpg, jpeg, webp]
        metadata.json
        defaultLayout.json
      locator/
        preview.[png, jpg, jpeg, webp]
        metadata.json
        defaultLayout.json
  templates/
  assets/
config.yaml
```

### src/library/library.json

```ts
/**
 * Metadata describing a Library.
 * A library is a collection of Sections and Layouts.
 */
export type LibraryMetadata = {
  /** The version of the library.json metadata schema used in this repo. */
  schemaVersion: 1;
  /** The internal id of the library. */
  id: string;
  /** The user-facing display name of the library. */
  displayName: string;
  /** The user-facing description of the library. */
  description: string;
};
```

### src/library/sections

Each tsx file in `src/library/sections` defines a single section that will be available in the editor.

Each file must contain a named export with the same name as its file stem with the type `YextComponentConfig`
and an exported object `config` of the type `SectionConfig`.

```tsx
import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";

type HeroProps = {};

export const Hero: YextComponentConfig<HeroProps> = () => (
  <section>Hero</section>
);

export const config: SectionConfig = {
  id: "hero",
  displayName: "Hero",
  description: "Shows a page hero.",
  pageSetTypes: ["ENTITY"],
  category: "Content",
};
```

`config.id` is the stable ID stored in layout data. Do not change it after a
layout uses the section. You can rename a section file and its component export
without breaking existing layouts if `config.id` does not change.

### src/library/shared

The shared directory can contain arbitrary files that can be used in any the sections.
`shared/componentRegistry.ts` registers Directory and Locator internals.
It exports `sharedSections`, `sharedComponents`, `sharedRootConfigs`, and
`sharedRootAllowedComponentIds`. Shared Puck components render and stay editable in
stored layout data, but do not show in the editor sidebar. Directory and
Locator source can import stable runtime APIs only from
`@yext/visual-editor/section-library-support`. It must not import Visual Editor
internal or `dist` paths.

### `src/library/layouts`

A layout is a starting point for the editor.

The library must contain at least one layout with `pageSetType`: `ENTITY`, exactly one
layout with `pageSetType`: `DIRECTORY`, and exactly one layout with `pageSetType`: `LOCATOR`.
Entity metadata also can set verticals and purposes.
Directory and Locator metadata sets only the layout ID, display name, and page set type.

To provide the preview shown for a layout in the Visual Editor, add one image
named exactly `preview.png`, `preview.jpg`, `preview.jpeg`, or `preview.webp` to
that layout's directory, alongside `metadata.json` and `defaultLayout.json`.
The image is optional, but a layout may not contain more than one of the supported
preview files, and the file must be no larger than 1 MiB. Run `npm run validate`
to check these requirements.

`defaultLayout.json` can reference visible section IDs and compatible shared
component IDs, apart from the built-in `MainContent` wrapper. A visible section
config sets its supported page set types. The editor shows only visible sections
that support the selected layout type.

### `src/library/migrations`

Defines section library migrations. See "Migrations" below.

### `src/templates`

Holds the autogenerated PagesJS templates. You should not need to add/edit/commit files in this directory.

### `src/assets`

Files in `src/assets` will be made public on the live site. It is recommended to host images
and fonts through the platform for the best optimization and configurability. However,
you may want to use this directory for small SVGs or other icons.

### config.yaml

For section libraries, the only supported config.yaml property is `buildConfiguration`.
`buildConfiguration.buildCommand` defines the build command run when the library is uploaded.
The reverse proxy prefix flag must be kept for the in-platform reverse proxy feature to work.
`buildConfiguration.installDependenciesStep.command` defines how to install npm dependencies.
`buildConfiguration.installDependenciesStep.requiredFiles` defines the files essential for the dependency installation process.

All other config.yaml properties will be dropped/overwritten when uploaded to the platform.

## Build output

The Visual Editor plug-in generates Pages templates while it builds. It writes
`assets/section-library-manifest.json` into the Pages artifact. The artifact
contains library and layout metadata, render and editor paths, and default
layout data. It contains no section source. It is not expected that
these files should require any editing.

## Local Editor

Local Editor lets you edit Section Library layouts in development using
example data from the account's Knowledge Graph.

### Enable Local Editor

```ts
yextVisualEditorPlugin({
  sectionLibrary: true,
  localEditor: { enabled: true },
});
```

Start Pages development, then open `/local-editor`. The selector uses real
Section Library layout IDs.

The plug-in creates a temporary `local-editor-data-<layout-id>.tsx` template
for each Entity and Directory layout. Pages uses these templates to create
local snapshots. The plug-in removes them when development stops and before
production builds. If these files are not removed automatically, you
should delete them manually.

### Test Data

#### ENTITY Page Sets

By default, a basic location entity stream is used to pull data for ENTITY page set types.
This can be configured in the `stream.config.ts` to use other entity types and to include other fields (including custom fields).

##### Alternative layouts

A layout in `layouts` can override its type's stream and defaults. This allows testing a section library with multiple
layouts and page sets configurations.

#### DIRECTORY Page Sets

By default, fake data is used for directory page sets. The number of directory children can be configured in the local-editor UI.
To use real data, add a `DIRECTORY` entry `stream.config.ts` and configure the filter and fields to match the directory (see example below).

#### LOCATOR Page Sets

By default, fake data is used for locator page sets. A mapbox api key can be provided in the local-editor UI for the locator map.
To use real data, fill out the env variables in the `stream.config.ts` based on the real locator. Additionally, provide
the nearby locations key and mapbox key in the local-editor UI.

### Configure Streams

Update the autogenerated `stream.config.ts` at the starter root. This stream definition
is only for the local-editor. In-platform, all non-linked entity fields will be available
and linked entity fields are configurable via the Page Groups UI.

```ts
import type { LocalEditorConfig } from "@yext/visual-editor/plugin";

const config = {
  defaults: {
    locale: "en",
  },
  env: {
    YEXT_CLOUD_REGION: "US",
    YEXT_CLOUD_CHOICE: "GLOBAL-MULTI",
    YEXT_ENVIRONMENT: "PROD",
    YEXT_SEARCH_API_KEY: "",
    YEXT_SEARCH_EXPERIENCE_KEY: "",
  },
  pageSetTypes: {
    ENTITY: {
      stream: {
        $id: "local-editor-restaurant-stream",
        filter: { entityTypes: ["restaurant"] },
        fields: ["id", "name", "slug", "c_order_now"],
        localization: { locales: ["en"] },
      },
    },
    DIRECTORY: {
      stream: {
        $id: "local-editor-directory-stream",
        // select the correct directory entities:
        // set the correct directory level by entity type id in entityTypes
        // set the correct directory scope by using savedFilterIds (in platform, go to KG -> Configuration -> Saved Filters)
        filter: {
          entityTypes: ["dm_city"],
          savedFilterIds: ["dm_x-y_address_city"],
        },
        // select the fields to include in the stream (will vary by directory level)
        fields: [
          "id",
          "name",
          "slug",
          "dm_directoryChildren.address",
          "dm_directoryChildren.geomodifier",
          "dm_directoryChildren.hours",
          "dm_directoryChildren.id",
          "dm_directoryChildren.mainPhone",
          "dm_directoryChildren.name",
          "dm_directoryChildren.slug",
          "dm_directoryChildren.timezone",
          "dm_addressCountryDisplayName",
          "dm_addressRegionDisplayName",
          // The directory parents field name varies based on site/branch/page group
          "dm_directoryParents_x_y_z.dm_addressCountryDisplayName",
          "dm_directoryParents_x_y_z.dm_addressRegionDisplayName",
          "dm_directoryParents_x_y_z.id",
          "dm_directoryParents_x_y_z.name",
          "dm_directoryParents_x_y_z.slug",
          "dm_directoryParents_x_y_z.meta.entityType.id",
        ],
        localization: { locales: ["en"] },
      },
    },
  },
  layouts: {
    "special-location-layout": {
      stream: {
        $id: "local-editor-special-location-stream",
        filter: { entityTypes: ["location"] },
        fields: ["id", "name", "description"],
        localization: { locales: ["en"] },
      },
    },
  },
} satisfies LocalEditorConfig;

export default config;
```

For each layout, Local Editor starts with `defaults`, then applies the matching
`pageSetTypes` value, then applies `layouts[layoutId]`. A later value replaces
an earlier value.

You must run `yext pages generate-test-data` or restart your development server after
updating `stream.config.ts`.

## Internationalization

Section libraries supports translations across the following languages:

```text
cs, da, de, en, en-GB, es, et, fi, fr, hr, hu, it, ja, lt, lv,
nb, nl, pl, pt, ro, sk, sv, tr, zh, zh-TW
```

There are two types of translations: Page and Platform.

### Page translations

Page translations are used on the live site. The locale of the page determines which translation is loaded.
If there are any hardcoded strings in the render method of a section,
it should have a translation entry in `src/library/i18n/page/{locale}.json`.
Page translations can be resolved using the `t` function of `useTranslation` from `react-i18next`.

### Platform translations

Platform translations are used in the editor. The locale of Storm user determines which translation is loaded.
Field labels and other editor-only text should have a translation entry in `src/library/i18n/platform/{locale}.json`.
Platform translations are resolved using the `pt` function from `@yext/visual-editor` in React render contexts and
are marked for translation using the deferred translation `msg` function for non-React contexts.

### Built-in translations

The `@yext/visual-editor` library has a set of translations already built-in.
See https://github.com/yext/visual-editor/tree/main/packages/visual-editor/locales.
If a key is present in `@yext/visual-editor` but missing from this repo, the visual-editor translation will be available.
If a key is present in both `@yext/visual-editor` and this repo, this repo's value will be used.

### Updating translations

To update translations, ask Codex to use the `$update-translations` skill.

Translation has two phases:

```bash
npm run i18n:prepare
# Codex translates the missing values
npm run i18n:finalize
```

Preparation runs the distinct platform and page extractors. The platform files contain the complete key superset from `t`, `pt`, and `msg`, while the page files contain only page-facing `t` keys. It then prints every missing or empty platform value beside its English source without failing or changing authored translations.

Finalization requires complete platform translations, repairs only unambiguous interpolation-name mismatches, and reports ambiguous mismatches for manual review. It also runs both i18next linters.

## Migrations

When updating in-use section libraries, migrations may be needed to ensure a seamless upgrade process.
When a new section library revision is selected in the platform, the editor and live site begin using
the new revision's code with the existing layout data. If section props have changed, this can cause
a mismatch. Migrations are applied before rendering, allowing the props to be updated to match the new shape.

There are three MigrationActions:

### Removed

Removes a section from all layouts.

```ts
{
  action: "removed";
}
```

### Updated

Transforms the existing props to the new set of props.
See https://puckeditor.com/docs/api-reference/functions/transform-props

Use `"*"` as the section name to apply an updated migration to every
section, including sections nested in slots. Wildcard migrations cannot
use the `removed` action.

```ts
{
  action: "updated";
  propTransformation: (oldProps: Record<string, any>) => Record<string, any>;
}

// Example
// Renames a prop from "heading" to "title" while keeping all other props
{
  action: "updated";
  propTransformation: ({ heading, ...props }) => ({ title: heading, ...props });
}
```

### Renamed

Changes a component's stored `type` while preserving its props and instance ID,
including components nested in slots and legacy zones.

```ts
{
  hoursStatus: {
    action: "renamed",
    newType: "HoursStatus",
  },
}
```

Register the destination component under its new ID. The migration runner uses
its schema for the old name during migration only, allowing earlier migrations
in both registries to traverse old layouts before the rename runs. Renames run
in registry order and cannot use the wildcard `"*"`.

### Adding a migration

To add a migration, create `src/library/migrations/registry.ts` with an exported `migrationRegistry`.

```tsx
export const migrationRegistry: MigrationRegistry = [];
```

Each item in the registry will be applied in order. The index of the last applied migration
is stored in the layout data at `root.props.sectionLibraryMigrationVersion`. Default layout
files must be updated to the latest migration defined in the repo.
