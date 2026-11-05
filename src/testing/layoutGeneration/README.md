# Generation contract verification

`npm run test:generation` runs the browser component contract and resolution
tests against the installed visual-editor package through its public entrypoints.
It does not require a neighboring visual-editor source checkout or call a model.

For local package verification, install a packed build of the updated visual-editor
package using this repository's `file:.../yext-visual-editor-*.tgz` dependency, then
run `npm install`. Registry-installed packages use the same test command.
Run `npm run typecheck` after tests stop so temporary local-editor templates have
been removed, and run `npm run validate` for repository checks.

## Contract audit

All registered supported components infer their props from static fields.
`FormSection` explicitly opts out; visual-editor excludes its built-in custom-code
section. No supported component retains a complete `layoutGenerationMetadata.props`
override. `InferenceAudit.test.tsx` checks the whole registry and requires an empty
`catalog.fieldOmissions` array, so adding an unknown authoring field fails tests.

Native inference and the remaining field overrides enforce these constraints:

- Fixed slots use `generation: { singleChild: true }` to require exactly one child,
  including when hidden. Native `allow`
  restrictions still define permitted child types. Card collections and Grid
  columns remain variable-length slots.
- Emails keeps optional styles/showIcon/listLength, with integer bounds 1–5.
  Nearby-location limits keep integer bounds 1–50. Both use `generation.integer`
  with native `min`/`max`, rather than replacement schemas.
- About details keeps its discriminated content union and infers each payload
  from the native email, phone, hours, address, text-list and social-link fields
  with `inferFieldZodSchema`. Header navigation links and Locator result cards also
  infer their custom-editor payloads from native backing fields. About's editor
  lookup and union payloads share one static field registry; Address retains its
  runtime field resolution.
- Primitive contracts come from visual-editor's public canonical schemas; this
  library no longer duplicates localized content, color, entity-binding or hours
  schemas. Promotional constants, CTA text colors and directory link overrides
  compose those canonical contracts where needed.
- Locator pin icons infer their contract from the same fields used by the editor,
  including aspect-ratio options. Callback-driven field pickers, custom toggles
  and facets retain explicit leaf constraints. Directory child sources infer fixed
  binding restrictions from `fixedRepeatedField` and `disableConstantValueToggle`,
  preserving boolean mappings and the opaque link-override schema. Locator entity
  types use visual-editor's exported `LOCATOR_ENTITY_TYPES`.
- Promotional video assets reuse inference for the native video field instead of
  duplicating its asset shape.
- Slotted source bindings infer strict mapping objects to reject static payloads;
  no local source schema override is needed.
  Manual content belongs in CardSlot children; references, indexes and backups
  belong to the helper. Source ownership and resolution metadata are retained.
- Header/footer width groups expand `resolveCanonicalSelectorGroups("MAX_WIDTH")`,
  retaining their descriptions and array-valued options without replacement schemas. Saved
  theme/fullWidth/null values remain valid without a mounted browser theme.
  Widths and text sizes use opt-in `generation.nullable` metadata for inheritance
  without changing inferred requiredness.
- HeroImage authoring uses the ratios supported in classic/compact heroes.
  Immersive/spotlight backgrounds use the parent hero's background-image field.
- CTA action type remains link-only; button actions require externally configured
  behavior. Button-only props stay outside generation.

Other intentional exclusions are editor/resolver-owned values: DirectoryCard's
parent-supplied data, DirectoryGrid.manualSlots, PrimaryHeaderSlot.parentValues,
image showImageConstrain, footer variant/eventNamePrefix, and the legacy expanded
footer-link index. These are explicit exclusions, rather than unknown omissions.
Generation instructions on colors, copy placement, bindings and visibility stay
on their relevant fields.

These tests verify component contracts, localized content through resolution,
saved default layouts, fixed slot counts and allowed types, custom fields, and
component-specific manual/linked card resolution. They also cover Locator
reconciliation against active entity types, including changing counts and order.
Generic schema compilation, creation/update/edit mechanics, opaque-data
preservation, and the shared card lifecycle belong in visual-editor's tests.

This changes generation metadata only. Saved props and editor field semantics are
unchanged, so no saved-data migration is needed. The Locator icon glob is repaired
to reference this repository's actual node_modules directory; it previously
produced an empty icon list and an uncompileable empty icon-name enum. Existing
icon values remain valid.
