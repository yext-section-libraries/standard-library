# Agent Instructions & Overrides

## Naming Conventions

- Use `Id` instead of `ID` for all variable and property names.
  - This applies to code identifiers such as variables, properties, parameters, functions, and types.
  - Examples: use `customerId`, `siteId`, `getEntityId`, and `type EntityIdMap = ...`; do not use `customerID`, `siteID`, `getEntityID`, or `type EntityIDMap = ...`.

## Local Workflow

- A build is generally not necessary to run in order to verify changes. Instead, use `npm run typecheck` and `npm run validate`.
- When running a build, be sure to include the env var SECTION_LIBRARY_REVISION_ID=local

## Testing

- This repo is set up with Vitest Browser screenshot tests. The committed screenshots are taken in a Github actions environment. It is expected that the tests will fail
  locally due to minor rendering differences between environments.

## Repo Structure

This repository structure is governed by `@yext/pages` and `@yext/visual-editor`. `npm run validate` will validate the directory structure.

- `src/library/sections` contains the primary page sections. Each must define a `YextComponentConfig`.
- `src/library/shared` contains supporting files for the page sections. Any ts/tsx can be defined here.
- `src/assets` is the public assets folder.
