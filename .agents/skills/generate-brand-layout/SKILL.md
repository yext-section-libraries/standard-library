---
name: generate-brand-layout
description: Recreate one live location detail page as a reusable Yext ENTITY layout using this library's atoms, entity fields, and a Designlang-derived Visual Editor theme. Use when asked to generate or explicitly update a branded layout from a URL.
---

# Generate brand layout

For a live pilot, run `npm run layouts:pilot -- <url> --out <new-scratch-directory> --log-file <log-path>`. Put the log outside the output directory. Run `npm run test:layouts:pilot` to check the workflow with the mock gateway. For a checked-in layout, follow the steps below.

## 1. Resolve the target

Take one live HTTP(S) location detail URL. Derive the brand name from the URL's registrable domain and use a lowercase, hyphenated brand slug. Honor an explicit brand override. Use the slug consistently for the folder, layout metadata id, and artifact filenames. Accept an optional target entity schema or sample to verify available fields.

Read the applicable repository instructions. Resolve `src/library/layouts/{brand}` and check for an existing folder or metadata id collision before writing. An existing folder requires an explicit update request. Reject write paths that escape the target folder, including through symlinks.

Confine every generated write, including scratch files, captures, and tool caches, to the target layout folder. Compose with existing library code. Run external tools without adding project dependencies. For explicit updates, stage replacements and preserve original files until the new artifacts pass validation. If a run fails, remove only files created by that run and restore any replaced originals.

## 2. Inspect the page and extract the guide

Inspect the rendered source at 1440 × 1000 and 390 × 844. Record region order, headings, copy, links, and responsive changes. Capture the header and footer separately. Record the order and width of their rows, asset URLs and rendered sizes, search and utilities, and link destinations. Open identifiable menus and footer disclosures without activating their links or submitting forms. Sample sticky behavior, desktop hover, and keyboard focus. Record overlays, loading states, or other gaps in the evidence.

Set `url` to the source URL, `brand` to the validated slug, and `scratch` to a fresh absolute scratch path inside the target folder. Run Designlang from that scratch directory:

```bash
mkdir -p "$scratch/tmp"
(
  cd "$scratch"
  TMPDIR="$scratch/tmp" npm_config_cache="$scratch/npm-cache" \
    npx --yes designlang@13.4.1 brand "$url" \
    --out "$scratch" --name "${brand}.brand" --format html
)
```

Use an installed compatible browser or place a required browser download inside scratch. The `brand` command appends `.html` to `--name`. Verify the resulting `{brand}.brand.html` is a usable guide for the source page. Read it as local data and copy it as emitted to the final layout folder on success. Use only that HTML from Designlang.

Retry recoverable extraction failures. If the guide remains unavailable, report the failure and stop. Proceed in static mode only when the caller explicitly asks to continue without the guide. In static mode, use observed source styles as supported literal atom values and generate only the layout and metadata. If an explicit update would leave a stale guide or theme, resolve removal with the caller before replacing the layout.

## 3. Map the theme

In normal mode, find the full `themeFields` registry and the **Set Theme Data** import rules for the repository's installed `@yext/visual-editor` version. Use version-matched editor source or a complete export and the matching field definitions. The section library's local design helpers cover only the tokens its components consume.

Populate a flat `{brand}-theme.json` with one valid value for every registered field. Choose values in order from the HTML guide, observed live-page styles, and the registered default. Normalize to the field's expected type, units, and allowed options. Select supported editor fonts or built-in fallbacks. Keep custom font metadata and font imports out of the layout and theme. Track which values were inferred or defaulted for the handoff.

## 4. Compose the layout

Use the current component catalog in `src/library/sections` and its atom definitions in `src/library/shared/design` for component IDs, root and slot rules, prop shapes, and responsive controls. Use `src/library/layouts/standard-library/defaultLayout.json` for entity binding examples.

Map every meaningful source region to existing atoms or a library component that already provides the required behavior. Preserve section order, heading hierarchy, visible copy, links, and supported responsive changes. Use theme roles and defaults for shared styling in normal mode. Use supported per-node overrides for source-specific layout or styling that theme defaults cannot express.

Compose distinct header and footer rows with full-width surfaces and bounded inner content. Wrap and shrink legal and navigation rows on narrow screens. Size logos, badges, and icons to their observed dimensions and use contain fit for images. Render each asset once per viewport unless the source repeats it. Use a labeled hamburger Disclosure for mobile navigation when observed and populate each menu or footer disclosure with its verified links.

Bind location-specific content and links to compatible entity fields already verified by repository config or a supplied target schema. Check content-bearing root props as well as nested components. A bound field with a missing value resolves empty, even if a constant is stored alongside it. Keep shared brand content literal where appropriate, and use image URLs observed on the source page for shared images. Omit location-specific content that has no verified field. Account for each omitted or approximated region, field, or interaction in the handoff.

Write valid `defaultLayout.json` with unique component ids and current migration stamps. Set `metadata.json` to the brand's unique id and display name, `pageSetType: "ENTITY"`, and location purpose using the existing metadata schema.

## 5. Verify and report

Place the candidate artifacts at their final paths for validation, with originals recoverable on updates. Run the repository's `validate` script and fix issues attributable to the generated files. Mechanically compare the saved layout with the source inventory for section order, copy, links, and responsive structure. Check component and slot compatibility, entity field paths and types, and accidental location-specific literals. In normal mode, compare theme keys with the complete registry and validate each value against the import rules. Use mechanical checks for this workflow.

Check saved prop values against the consuming component's supported options, including nested and responsive props. Render the saved layout with the saved theme at both capture sizes. Compare the header and footer rows, link hover and focus styles, and responsive width. Check keyboard opening, closing, and link traversal, and verify long legal links wrap within the viewport. Report unsupported interactions, gaps in the source evidence, theme fallbacks, and checks you could not complete.

Check responsive navigation in the Visual Editor canvas as well as on the rendered page. Set `revealWhenHiddenInEditor: false` on breakpoint-specific navigation containers and menu disclosures so the active navigation is the only one visible and the mobile menu starts collapsed.

Remove scratch artifacts and verify the final files. A new run leaves exactly `metadata.json`, `defaultLayout.json`, `{brand}-theme.json`, and `{brand}.brand.html`. Static mode leaves the two layout JSON files. For updates, preserve unrelated pre-existing files. Check the working tree against its starting state and account for every change from the run.

Report the output path, check results, source differences, and theme values inferred or defaulted. In normal mode, identify **Set Theme Data** as the manual import step. In static mode, identify the extraction failure and the static styling used.
