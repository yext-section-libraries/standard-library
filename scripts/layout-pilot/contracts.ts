import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import {
  constructFontSelectOptions,
  defaultFonts,
  migrationRegistry as editorMigrations,
  toPuckFields,
} from "@yext/visual-editor";
import { createPuckGenerationCatalog } from "@yext/visual-editor/section-library-support";
import { z } from "zod";
import streamConfig from "../../stream.config.ts";
import library from "../../src/library/library.json";
import { migrationRegistry } from "../../src/library/migrations/registry.ts";
import { sharedComponentConfigs } from "../../src/library/shared/componentRegistry.ts";
import {
  pageAreaComponentIds,
  pageRootComponentIds,
} from "../../src/library/shared/design/pageStructure.ts";
import {
  legacyInstructions,
  legacyOutputSchema,
  type Draft,
  type RepairIssue,
} from "./gateway.ts";

type Field = {
  type: string;
  objectFields?: Fields;
  arrayFields?: Fields;
  repeated?: { mappingFields: Fields };
  allow?: string[];
  disallow?: string[];
  filter?: { types?: string[]; includeListsOnly?: boolean };
};
type Fields = Record<string, Field>;
type RecordValue = Record<string, unknown>;
type ThemeValue = string | number;
type ThemeField = {
  label: string;
  type: string;
  default: ThemeValue;
  options?: { value: ThemeValue }[];
  variable?: string;
};
const linkFonts = new Map(
  constructFontSelectOptions(defaultFonts).map(({ label, value }) => [
    label.toLowerCase(),
    value,
  ])
);
const linkFontFields = new Set(["linkFontFamily", "navigationLinkFontFamily"]);
const addressFields = ["line1", "city", "region", "postalCode", "countryCode"];

const defaultFieldTypes: Record<string, string> = {
  id: "type.string",
  name: "type.string",
  slug: "type.string",
  address: "type.address",
  description: "type.string",
  emails: "type.string[]",
  hours: "type.hours",
  mainPhone: "type.phone",
  services: "type.string[]",
  yextDisplayCoordinate: "type.coordinate",
  c_featuredProducts: "type.products_section",
};

const productItemFields: Record<string, string[]> = {
  image: ["type.image"],
  name: ["type.string"],
  category: ["type.string", "type.rich_text_v2"],
  brow: ["type.string", "type.rich_text_v2"],
  price: ["type.price"],
  description: ["type.rich_text_v2"],
  cta: ["type.cta"],
};

const sections = import.meta.glob<{ config: { id: string } }>(
  "../../src/library/sections/*.tsx",
  { eager: true }
);
const components = Object.fromEntries(
  Object.values(sections).flatMap((section) => {
    const id = section.config?.id;
    return id ? [[id, (section as Record<string, unknown>)[id]]] : [];
  })
) as typeof sharedComponentConfigs;
const catalog = createPuckGenerationCatalog(
  { ...components, ...sharedComponentConfigs },
  { rootAllowedComponentIds: pageRootComponentIds }
);
const excluded = new Set(["CustomCodeSection", "Directory", "Locator"]);
const registered = Object.fromEntries(
  Object.entries(catalog.data.components).filter(
    ([id, component]) => component.generation && !excluded.has(id)
  )
);

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

// The installed editor's Set Theme Data dialog reads this private registry.
// Resolve its import from the installed bundle so another checkout cannot affect the contract.
function loadThemeFields() {
  const require = createRequire(import.meta.url);
  const editorEntry = require.resolve("@yext/visual-editor");
  const bundle = readFileSync(editorEntry, "utf8");
  const registryName = bundle.match(
    /Object\.hasOwn\((\w+),\s*\w+\)\)\s*throw new Error\("Unknown theme field"\)/
  )?.[1];
  const imports = /import \{([^}]+)\} from "(\.\/[^"]+)";/g;
  for (const [, names, path] of bundle.matchAll(imports)) {
    const member = names
      .split(",")
      .map((name) => name.trim().split(/\s+as\s+/))
      .find(([original, alias]) => (alias ?? original) === registryName);
    if (!member) continue;
    const registry: unknown = require(resolve(dirname(editorEntry), path))[
      member[0]
    ];
    if (
      isRecord(registry) &&
      Object.hasOwn(registry, "colorPrimary") &&
      Object.values(registry).every(
        (field) =>
          isRecord(field) &&
          typeof field.label === "string" &&
          typeof field.type === "string" &&
          Object.hasOwn(field, "default")
      )
    )
      return registry as Record<string, ThemeField>;
  }
  throw new Error(
    "Could not locate the installed Visual Editor theme registry"
  );
}

function slotsFor(
  fields: Fields,
  prefix = ""
): Record<string, Pick<Field, "allow" | "disallow">> {
  return Object.fromEntries(
    Object.entries(fields).flatMap(([key, field]) => {
      const path = prefix + key;
      if (field.type === "slot")
        return [[path, { allow: field.allow, disallow: field.disallow }]];
      return field.objectFields
        ? Object.entries(slotsFor(field.objectFields, path + "."))
        : [];
    })
  );
}

function generationFields(id: string) {
  const component = registered[id];
  const config = sharedComponentConfigs[id] ?? components[id];
  const native = component.fields as Fields;
  const converted = config?.fields
    ? (toPuckFields(config.fields) as Fields)
    : {};
  // The catalog has resolved native slots. Preserve Yext field filters for binding validation.
  return { ...native, ...converted, ...config?.fields } as Fields;
}

function componentSlots(id: string) {
  const slots = slotsFor(registered[id].fields as Fields);
  if (id === "MainContent") slots.content = { allow: pageAreaComponentIds };
  return slots;
}

const entitySchemaFile = z
  .object({
    fields: z.record(
      z.string().regex(/^[a-z_][\w]*(?:\.[a-z_][\w]*)*$/i),
      z.string().regex(/^(?:type\.[a-z0-9_]+|c_\w+)(?:\[\])?$/)
    ),
  })
  .strict();

export async function loadContracts(entitySchemaPath?: string) {
  const fields = entitySchemaPath
    ? entitySchemaFile.parse(JSON.parse(readFileSync(entitySchemaPath, "utf8")))
        .fields
    : Object.fromEntries(
        streamConfig.pageSetTypes.ENTITY.stream.fields.map((field) => {
          if (!defaultFieldTypes[field])
            throw new Error(`Missing type for stream field ${field}`);
          return [field, defaultFieldTypes[field]];
        })
      );
  const entityFields = {
    ...Object.fromEntries(
      Object.entries(fields).flatMap(([path, type]) =>
        type === "type.address"
          ? addressFields.map((field) => [`${path}.${field}`, "type.string"])
          : []
      )
    ),
    ...fields,
  };
  const theme = loadThemeFields();
  const schemas: unknown[] = [];
  const schemaIndexes = new Map<string, number>();
  const componentContracts = Object.fromEntries(
    Object.entries(registered).map(([id, component]) => {
      const props = Object.fromEntries(
        Object.entries(component.generation!.props.shape).map(
          ([name, field]) => {
            const { $schema: _schema, ...schema } = z.toJSONSchema(
              field as z.ZodType,
              {
                io: "input",
                unrepresentable: "any",
                reused: "ref",
                override: ({ jsonSchema }) => {
                  if (
                    jsonSchema.type === "object" &&
                    jsonSchema.properties &&
                    jsonSchema.additionalProperties === undefined
                  ) {
                    jsonSchema.additionalProperties = false;
                  }
                  const choices = jsonSchema.anyOf;
                  const values = choices?.map((choice) => choice.const);
                  if (
                    values?.every(
                      (value): value is Exclude<typeof value, undefined> =>
                        value !== undefined
                    ) &&
                    choices?.every((choice) =>
                      Object.keys(choice).every(
                        (key) => key === "const" || key === "type"
                      )
                    )
                  ) {
                    jsonSchema.enum = values;
                    delete jsonSchema.anyOf;
                  }
                },
              }
            );
            const signature = JSON.stringify(schema);
            let index = schemaIndexes.get(signature);
            if (index === undefined) {
              index = schemas.length;
              schemaIndexes.set(signature, index);
              schemas.push(schema);
            }
            return [name, index];
          }
        )
      );
      const bindings = bindingFilters(generationFields(id));
      return [
        id,
        {
          description: component.description,
          instructions: component.generation!.instructions,
          props,
          ...(bindings.length ? { bindingFilters: bindings } : {}),
          defaults: Object.keys(component.defaultProps ?? {}).filter((key) =>
            Object.hasOwn(props, key)
          ),
          slots: componentSlots(id),
        },
      ];
    })
  );
  const themeContract = Object.fromEntries(
    Object.entries(theme).map(([key, field]) => [
      key,
      {
        label: field.label,
        type: field.type,
        default: field.default,
        options: field.options?.map(({ value }) => value),
      },
    ])
  );
  return {
    entityFields,
    theme,
    prompt: {
      rootAllowed: pageRootComponentIds.filter((id) =>
        Object.hasOwn(registered, id)
      ),
      entityFields,
      collectionItemFields: { "type.products_section": productItemFields },
      theme: themeContract,
      linkFontFamilies: Object.keys(defaultFonts),
      paletteVariables: Object.fromEntries(
        Object.entries(theme)
          .filter(([, field]) => field.variable?.startsWith("--ve-color-"))
          .map(([key, field]) => [key, `var(${field.variable})`])
      ),
      components: componentContracts,
      propSchemas: schemas,
    },
  };
}

type Contracts = Awaited<ReturnType<typeof loadContracts>>;

// Editor field definitions can contain React functions and editor-only metadata.
// Export only the field structure needed to locate entity bindings in stored props.
function bindingFilters(
  fields: Fields,
  parent: string[] = []
): {
  path: string[];
  types?: string[];
  includeListsOnly?: boolean;
}[] {
  return Object.entries(fields).flatMap(([key, field]) => {
    const path = [...parent, key];
    return [
      ...(field.filter
        ? [
            {
              path,
              types: field.filter.types,
              includeListsOnly: field.filter.includeListsOnly,
            },
          ]
        : []),
      ...bindingFilters(field.objectFields ?? {}, path),
      ...bindingFilters(field.arrayFields ?? {}, [...path, "*"]),
    ];
  });
}

function stableDefaults(props: RecordValue) {
  // The editor picks shipped stock photos at random when its presets load.
  // Keep one of those same placeholders in each exported preset.
  const stockImage =
    /^https:\/\/images\.unsplash\.com\/photo-(?:1755745360285-0633c972b0fd|1502252430442-aac78f397426|1504548840739-580b10ae7715)(?=\?ixlib=rb-4\.1\.0&)/;
  return JSON.parse(
    JSON.stringify(props, (_key, value: unknown) =>
      typeof value === "string"
        ? value.replace(
            stockImage,
            "https://images.unsplash.com/photo-1502252430442-aac78f397426"
          )
        : value
    )
  );
}

export async function exportContract() {
  const contracts = await loadContracts();
  const editorEntry = createRequire(import.meta.url).resolve(
    "@yext/visual-editor"
  );
  const editorPackage = JSON.parse(
    readFileSync(resolve(dirname(editorEntry), "../package.json"), "utf8")
  );
  return {
    schemaVersion: 1,
    libraryId: library.id,
    editorVersion: editorPackage.version as string,
    editorMigrationVersion: editorMigrations.length,
    libraryMigrationVersion: migrationRegistry.length,
    instructions: legacyInstructions,
    draftSchema: legacyOutputSchema,
    prompt: contracts.prompt,
    validation: {
      addressFields,
      linkFontFields: [...linkFontFields],
      linkFonts: Object.fromEntries(linkFonts),
      components: Object.fromEntries(
        Object.entries(registered).map(([id, component]) => [
          id,
          {
            defaultProps: stableDefaults(component.defaultProps ?? {}),
            slotOrder: Object.keys(componentSlots(id)),
            schema: z.toJSONSchema(component.generation!.props, {
              io: "input",
              target: "draft-2020-12",
              override: ({ jsonSchema, zodSchema }) => {
                const checks =
                  (
                    zodSchema._zod.def as {
                      checks?: { _zod: { def: { check: string } } }[];
                    }
                  ).checks ?? [];
                const custom = checks.filter(
                  (check) => check._zod.def.check === "custom"
                );
                if (custom.length) {
                  const missingConstant = z.safeParse(zodSchema, {
                    field: "",
                    constantValueEnabled: true,
                  });
                  if (
                    custom.length !== 1 ||
                    !jsonSchema.properties?.constantValue ||
                    !jsonSchema.properties.constantValueEnabled ||
                    missingConstant.success ||
                    !missingConstant.error.issues.some(
                      (issue) =>
                        issue.code === "custom" &&
                        issue.path.join(".") === "constantValue" &&
                        issue.message === "Manual bindings require a constant"
                    )
                  ) {
                    throw new Error(
                      `Unrepresented validation refinement in ${id}`
                    );
                  }
                  const rule = {
                    if: {
                      properties: { constantValueEnabled: { const: true } },
                      required: ["constantValueEnabled"],
                    },
                    then: { required: ["constantValue"] },
                  };
                  if (
                    !jsonSchema.allOf?.some(
                      (entry) => JSON.stringify(entry) === JSON.stringify(rule)
                    )
                  ) {
                    jsonSchema.allOf = [...(jsonSchema.allOf ?? []), rule];
                  }
                }
                if (
                  jsonSchema.type === "object" &&
                  jsonSchema.properties &&
                  jsonSchema.additionalProperties === undefined
                ) {
                  jsonSchema.additionalProperties = false;
                }
              },
            }),
            bindingFilters: bindingFilters(generationFields(id)),
          },
        ])
      ),
    },
  };
}

type Component = { type: string; props: RecordValue };
type DraftNode = Draft["nodes"][number];

export async function exportParityFixtures() {
  const contracts = await loadContracts();
  const brand = "contract-fixture";
  const valid: Draft = {
    displayName: "Contract fixture",
    nodes: [
      {
        key: "footer",
        type: "Box",
        parentKey: null,
        slot: null,
        propsJson:
          '{"as":"footer","surface":{"backgroundColor":"rgb(18, 52, 86)"}}',
      },
      {
        key: "heading",
        type: "Heading",
        parentKey: "footer",
        slot: "content",
        propsJson:
          '{"as":"h2","data":{"text":{"field":"address.city","constantValueEnabled":false}}}',
      },
      {
        key: "faq",
        type: "FAQSection",
        parentKey: null,
        slot: null,
        propsJson: "{}",
      },
    ],
    themeOverrides: [
      { key: "colorPrimary", value: "#123456" },
      { key: "linkFontFamily", value: "Lato, sans-serif" },
    ],
    omissions: [],
    themeSubstitutions: [],
  };
  const variants: [string, Draft][] = [
    ["nested slots, binding, palette, font and shipped defaults", valid],
    [
      "unsupported prop",
      {
        ...valid,
        nodes: [
          {
            ...valid.nodes[0],
            propsJson: '{"layout":{"justifySelf":"center"}}',
          },
        ],
      },
    ],
    [
      "invalid slot",
      {
        ...valid,
        nodes: [valid.nodes[0], { ...valid.nodes[1], slot: "missing" }],
      },
    ],
    [
      "unknown binding",
      {
        ...valid,
        nodes: [
          valid.nodes[0],
          {
            ...valid.nodes[1],
            propsJson:
              '{"data":{"text":{"field":"missing","constantValueEnabled":false}}}',
          },
        ],
      },
    ],
    [
      "invalid theme font",
      {
        ...valid,
        themeOverrides: [{ key: "linkFontFamily", value: "Made Up Font" }],
      },
    ],
  ];
  return variants.map(([name, draft]) => {
    const legacyDraft = {
      ...draft,
      nodes: draft.nodes.map(({ key: _key, parentKey, ...node }) => ({
        ...node,
        parentIndex:
          parentKey === null
            ? null
            : draft.nodes.findIndex(({ key }) => key === parentKey),
      })),
    };
    try {
      const result = materialize(draft, brand, contracts);
      return {
        name,
        brand,
        draft: legacyDraft,
        artifacts: {
          "defaultLayout.json": result.layout,
          "metadata.json": result.metadata,
          [`${brand}-theme.json`]: result.theme,
        },
      };
    } catch {
      if (draft === valid)
        throw new Error(
          "The reference validator rejected the valid parity fixture"
        );
      return { name, brand, draft: legacyDraft, invalid: true };
    }
  });
}

function mergeProps(defaults: RecordValue, changes: RecordValue): RecordValue {
  return Object.fromEntries(
    [...new Set([...Object.keys(defaults), ...Object.keys(changes)])].map(
      (key) => {
        const base = defaults[key];
        const value = changes[key];
        if (!Object.hasOwn(changes, key)) return [key, structuredClone(base)];
        return [
          key,
          isRecord(base) && isRecord(value) ? mergeProps(base, value) : value,
        ];
      }
    )
  );
}

function containsPrimaryFooterLinks(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(containsPrimaryFooterLinks);
  if (!isRecord(node)) return false;
  if (node.type === "FooterLinksSlot" && isRecord(node.props))
    return node.props.variant === "primary";
  return Object.values(node).some(containsPrimaryFooterLinks);
}

function checkAuthoredKeys(
  value: unknown,
  parsed: unknown,
  path: string[],
  report: (path: string[], message: string) => void
) {
  if (Array.isArray(value) && Array.isArray(parsed)) {
    value.forEach((entry, index) =>
      checkAuthoredKeys(entry, parsed[index], [...path, String(index)], report)
    );
  } else if (isRecord(value) && isRecord(parsed)) {
    for (const [key, entry] of Object.entries(value)) {
      const childPath = [...path, key];
      if (!Object.hasOwn(parsed, key))
        report(childPath, `${childPath.join(".")} is not a supported prop`);
      else checkAuthoredKeys(entry, parsed[key], childPath, report);
    }
  }
}

function hasAtPath(value: unknown, path: PropertyKey[]): boolean {
  for (const key of path) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, key)) {
      return false;
    }
    value = (value as Record<PropertyKey, unknown>)[key];
  }
  return true;
}

function validateProps(
  schema: z.ZodObject,
  defaults: RecordValue,
  props: RecordValue,
  authored: RecordValue,
  report: (path: string[], message: string) => void
) {
  const parsed = schema.safeParse(props);
  if (!parsed.success) {
    // Shipped defaults can contain inactive placeholders outside the generation schema.
    const baseline = schema.safeParse(defaults);
    const signature = (issue: z.core.$ZodIssue) =>
      JSON.stringify([issue.code, issue.path, issue.message]);
    const existing = new Set(baseline.error?.issues.map(signature));
    for (const issue of parsed.error.issues) {
      if (issue.code === "unrecognized_keys") {
        for (const key of issue.keys) {
          const path = [...issue.path, key];
          if (hasAtPath(authored, path))
            report(
              path.map(String),
              `${path.join(".")} is not a supported prop`
            );
        }
      } else if (
        !existing.has(signature(issue)) ||
        hasAtPath(authored, issue.path)
      ) {
        report(
          issue.path.map(String),
          `${issue.path.join(".")} ${issue.message}`.trim()
        );
      }
    }
  }
  for (const [key, value] of Object.entries(authored)) {
    if (!Object.hasOwn(schema.shape, key)) {
      report([key], `${key} is not a supported prop`);
      continue;
    }
    const field = parsed.success
      ? undefined
      : schema.shape[key].safeParse(props[key]);
    if (parsed.success)
      checkAuthoredKeys(value, parsed.data[key], [key], report);
    else if (field?.success)
      checkAuthoredKeys(value, field.data, [key], report);
  }
}

function validateBindings(
  props: RecordValue,
  fields: Fields,
  entityFields: Contracts["entityFields"],
  report: (path: string[], message: string) => void
) {
  function entityType(name: string) {
    return Object.hasOwn(entityFields, name) ? entityFields[name] : undefined;
  }
  function checkBinding(name: string, path: string[], field?: Field) {
    const type = entityType(name);
    if (!type) {
      report(path, `uses an unknown entity field ${name}`);
      return;
    }
    const allowed = field?.filter?.types;
    if (allowed?.length && !allowed.includes(type.replace(/\[\]$/, ""))) {
      report(
        path,
        `cannot bind ${name} (${type}); expected ${allowed.join(" or ")}`
      );
    }
    if (field?.filter?.includeListsOnly && !type.endsWith("[]"))
      report(path, "requires a list entity field");
  }
  function visit(entry: unknown, path: string[], field?: Field) {
    if (field?.type === "slot") return;
    if (typeof entry === "string") {
      for (const [, name] of entry.matchAll(/\[\[\s*([\w.]+)\s*\]\]/g))
        checkBinding(name, path);
    } else if (Array.isArray(entry)) {
      entry.forEach((item, index) =>
        visit(item, [...path, String(index)], {
          type: "object",
          objectFields: field?.arrayFields,
        })
      );
    } else if (isRecord(entry)) {
      if (
        typeof entry.field === "string" &&
        entry.field &&
        entry.constantValueEnabled !== true
      )
        checkBinding(entry.field, path, field);
      for (const [key, child] of Object.entries(entry)) {
        const isProductMapping =
          key === "mappings" &&
          typeof entry.field === "string" &&
          entry.constantValueEnabled !== true &&
          entityType(entry.field) === "type.products_section" &&
          field?.repeated &&
          isRecord(child);
        if (!isProductMapping) {
          visit(child, [...path, key], field?.objectFields?.[key]);
          continue;
        }
        for (const [target, mapping] of Object.entries(child)) {
          if (
            !isRecord(mapping) ||
            typeof mapping.field !== "string" ||
            !mapping.field ||
            mapping.constantValueEnabled === true
          )
            continue;
          const mappingPath = [...path, key, target];
          const types = Object.hasOwn(productItemFields, mapping.field)
            ? productItemFields[mapping.field]
            : undefined;
          const allowed = field.repeated?.mappingFields[target]?.filter?.types;
          if (!types)
            report(
              mappingPath,
              `uses an unknown product item field ${mapping.field}`
            );
          else if (
            allowed?.length &&
            !types.some((type) => allowed.includes(type))
          )
            report(
              mappingPath,
              `cannot map product item field ${mapping.field}; expected ${allowed.join(" or ")}`
            );
        }
      }
    }
  }
  visit(props, [], { type: "object", objectFields: fields });
}

function validThemeValue(field: ThemeField, value: ThemeValue) {
  if (field.type === "number")
    return typeof value === "number" && Number.isFinite(value);
  if (typeof value !== "string" || !value.trim()) return false;
  return (
    field.type !== "select" ||
    field.options?.some((option) => option.value === value)
  );
}

function normalizeColor(value: unknown) {
  if (typeof value !== "string") return;
  const css = value.trim().toLowerCase();
  if (css === "black") return "000000";
  if (css === "white") return "ffffff";
  const hex = css.match(/^#([\da-f]{3}|[\da-f]{6})$/)?.[1];
  if (hex)
    return hex.length === 3
      ? [...hex].map((digit) => digit + digit).join("")
      : hex;
  const rgb = css.match(
    /^rgb\(\s*(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})\s*\)$/
  );
  const channels = rgb?.slice(1).map(Number);
  if (channels?.every((channel) => channel <= 255)) {
    return channels
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("");
  }
}

function usePaletteTokens(
  content: Component[],
  theme: Record<string, ThemeValue>,
  fields: Contracts["theme"]
) {
  const palette = Object.entries(fields).flatMap(([key, field]) => {
    const color = normalizeColor(theme[key]);
    return field.variable?.startsWith("--ve-color-") && color
      ? [{ key, color, token: `var(${field.variable})` }]
      : [];
  });
  let replacements = 0;
  function visit(value: unknown, surfaceRole?: string) {
    if (Array.isArray(value)) {
      value.forEach((child) => visit(child, surfaceRole));
    } else if (isRecord(value)) {
      const role =
        typeof value.surfaceRole === "string" && value.surfaceRole
          ? value.surfaceRole
          : surfaceRole;
      for (const [group, properties] of [
        ["surface", ["backgroundColor", "borderColor"]],
        ["typography", ["color"]],
      ] as const) {
        const style = value[group];
        if (!isRecord(style)) continue;
        for (const key of properties) {
          const color = normalizeColor(style[key]);
          if (!color) continue;
          const matches = palette.filter((entry) => entry.color === color);
          const roleKey =
            role && role !== "page"
              ? role[0].toUpperCase() + role.slice(1)
              : undefined;
          const preferred =
            key === "borderColor"
              ? "colorBorder"
              : key === "color"
                ? roleKey
                  ? `color${roleKey}Foreground`
                  : role === "page"
                    ? "colorForeground"
                    : undefined
                : roleKey
                  ? `color${roleKey}`
                  : undefined;
          const relevant = matches.filter(({ key: field }) =>
            key === "color"
              ? field.endsWith("Foreground")
              : !field.endsWith("Foreground") &&
                !["colorBorder", "colorFocusRing"].includes(field)
          );
          const match =
            matches.find((entry) => entry.key === preferred) ??
            (relevant.length === 1
              ? relevant[0]
              : key === "color" &&
                  matches.length === 1 &&
                  !["colorBorder", "colorFocusRing"].includes(matches[0].key)
                ? matches[0]
                : undefined);
          if (match) {
            style[key] = match.token;
            replacements++;
          }
        }
      }
      for (const child of Object.values(value)) visit(child, role);
    }
  }
  visit(content);
  return replacements;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export class LayoutValidationError extends Error {
  constructor(
    public readonly issues: RepairIssue[],
    public readonly draft: Draft
  ) {
    super([...new Set(issues.map(({ message }) => message))].join("\n"));
  }
}

function normalizeDraftKeys(draft: Draft) {
  const keys = new Map<string, string[]>();
  const reserved = new Set<string>();
  for (const { key, parentKey } of draft.nodes) {
    const occurrences = keys.get(key) ?? [];
    occurrences.push(key);
    keys.set(key, occurrences);
    reserved.add(key);
    if (parentKey !== null) reserved.add(parentKey);
  }
  let sequence = 0;
  for (const [key, occurrences] of keys) {
    if (key.trim() && occurrences.length === 1) continue;
    for (let index = 0; index < occurrences.length; index++) {
      let replacement: string;
      do replacement = `repair-node-${++sequence}`;
      while (reserved.has(replacement));
      occurrences[index] = replacement;
      reserved.add(replacement);
    }
  }
  const nextOccurrence = new Map<string, number>();
  const nodes = draft.nodes.map((node) => {
    const index = nextOccurrence.get(node.key) ?? 0;
    nextOccurrence.set(node.key, index + 1);
    const parents =
      node.parentKey === null ? undefined : keys.get(node.parentKey);
    return {
      ...node,
      key: keys.get(node.key)![index],
      parentKey: parents?.length === 1 ? parents[0] : node.parentKey,
    };
  });
  return { draft: { ...draft, nodes }, keys };
}

function indexDraftNodes(
  nodes: DraftNode[],
  sourceKeys: Map<string, string[]>,
  issues: RepairIssue[]
) {
  const byKey = new Map(nodes.map((node) => [node.key, node]));
  const invalid = new Set<string>();
  const placementIssue = (
    node: DraftNode,
    message: string,
    expected?: unknown
  ) => {
    invalid.add(node.key);
    issues.push({
      kind: "placement",
      key: node.key,
      component: node.type,
      message,
      expected,
    });
  };

  for (const node of nodes) {
    const path = `Node ${node.key}`;
    if (node.parentKey === null) {
      if (node.slot !== null)
        placementIssue(node, `${path} is a root and must have a null slot`);
      else if (
        Object.hasOwn(registered, node.type) &&
        !pageRootComponentIds.includes(node.type)
      )
        placementIssue(
          node,
          `${path}: ${node.type} is not allowed at the page root`,
          pageRootComponentIds
        );
      continue;
    }
    const parent = byKey.get(node.parentKey);
    if (!parent) {
      const candidates = sourceKeys.get(node.parentKey);
      placementIssue(
        node,
        candidates
          ? `${path} references ambiguous parent ${JSON.stringify(node.parentKey)}. Select the intended parent key.`
          : `${path} references unknown parent ${node.parentKey}`,
        candidates
      );
      continue;
    }
    if (!Object.hasOwn(registered, parent.type)) continue;
    const slots = componentSlots(parent.type);
    const rules =
      node.slot && Object.hasOwn(slots, node.slot)
        ? slots[node.slot]
        : undefined;
    if (!rules) {
      placementIssue(
        node,
        `${path}: parent ${parent.key} has no slot ${node.slot}`,
        Object.keys(slots)
      );
    } else if (
      (rules.allow && !rules.allow.includes(node.type)) ||
      rules.disallow?.includes(node.type)
    ) {
      placementIssue(
        node,
        `${path}: ${parent.key}.${node.slot} does not allow ${node.type}`,
        rules
      );
    }
  }

  const visited = new Set<string>();
  for (const node of nodes) {
    const chain = new Set<string>();
    let current: DraftNode | undefined = node;
    while (current && !invalid.has(current.key) && !visited.has(current.key)) {
      if (chain.has(current.key)) {
        placementIssue(
          current,
          `Node ${current.key} is part of a parent cycle`
        );
        break;
      }
      chain.add(current.key);
      current =
        current.parentKey === null ? undefined : byKey.get(current.parentKey);
    }
    for (const key of chain) visited.add(key);
  }

  const children = new Map<string | null, Map<string | null, DraftNode[]>>();
  for (const node of nodes) {
    if (invalid.has(node.key)) continue;
    const slots =
      children.get(node.parentKey) ?? new Map<string | null, DraftNode[]>();
    const siblings = slots.get(node.slot) ?? [];
    siblings.push(node);
    slots.set(node.slot, siblings);
    children.set(node.parentKey, slots);
  }
  return { children, detached: nodes.filter((node) => invalid.has(node.key)) };
}

export function materialize(input: Draft, brand: string, contracts: Contracts) {
  const { draft, keys } = normalizeDraftKeys(input);
  const issues: RepairIssue[] = [];
  if (!draft.displayName.trim())
    issues.push({
      kind: "displayName",
      message: "The layout needs a display name",
    });
  if (!draft.nodes.length)
    issues.push({
      kind: "insert",
      key: null,
      slot: null,
      message: "The layout needs at least one root component",
    });
  const theme = Object.fromEntries(
    Object.entries(contracts.theme).map(([key, field]) => [key, field.default])
  );
  const overrides = new Set<string>();
  for (const { key, value } of draft.themeOverrides) {
    const field = Object.hasOwn(contracts.theme, key)
      ? contracts.theme[key]
      : undefined;
    try {
      if (!field) throw new Error(`Unknown theme field ${key}`);
      if (overrides.has(key))
        throw new Error(`Duplicate override for theme field ${key}`);
      overrides.add(key);
      if (!validThemeValue(field, value))
        throw new Error(`Invalid value for theme field ${key}`);
      if (linkFontFields.has(key) && typeof value === "string") {
        const family = value
          .split(",")[0]
          .trim()
          .replace(/^['"]|['"]$/g, "");
        const registeredFont = linkFonts.get(family.toLowerCase());
        if (!registeredFont)
          throw new Error(
            `Invalid value for theme field ${key}: choose a font from linkFontFamilies`
          );
        theme[key] = registeredFont;
      } else {
        theme[key] = value;
      }
    } catch (error) {
      issues.push({
        kind: "theme",
        key,
        message: errorMessage(error),
        expected: linkFontFields.has(key)
          ? "A name from linkFontFamilies"
          : field?.type,
        example: field?.default,
      });
    }
  }
  for (const [key, value] of Object.entries(theme)) {
    if (!validThemeValue(contracts.theme[key], value))
      throw new Error(`Invalid registry default for theme field ${key}`);
  }

  const { children, detached } = indexDraftNodes(draft.nodes, keys, issues);
  let nextId = 0;
  function compile(
    type: string,
    authored: RecordValue,
    path: string,
    authoredChildren?: Map<string | null, DraftNode[]>,
    inheritedProps?: RecordValue,
    owner?: DraftNode
  ): Component {
    if (!Object.hasOwn(registered, type))
      throw new Error(`${path} uses unsupported component ${type}`);
    const component = registered[type];
    const slots = componentSlots(type);
    const defaults = inheritedProps
      ? mergeProps(component.defaultProps ?? {}, inheritedProps)
      : (component.defaultProps ?? {});
    const props = mergeProps(defaults, authored);
    if (
      type === "ProductCardsWrapper" &&
      isRecord(props.data) &&
      typeof props.data.field === "string" &&
      props.data.constantValueEnabled !== true &&
      Object.hasOwn(contracts.entityFields, props.data.field) &&
      contracts.entityFields[props.data.field] === "type.products_section"
    ) {
      const mappings = isRecord(props.data.mappings) ? props.data.mappings : {};
      const styles = isRecord(props.styles) ? props.styles : {};
      for (const [key, show] of [
        ["name", "showTitle"],
        ["image", "showImage"],
      ]) {
        const binding = mappings[key];
        if (
          styles[show] !== false &&
          !(
            isRecord(binding) &&
            (binding.field || binding.constantValueEnabled === true)
          )
        )
          mappings[key] = { field: key, constantValueEnabled: false };
      }
      props.data.mappings = mappings;
    }
    const id = `${brand}-${type.toLowerCase()}-${++nextId}`;

    for (const slot of authoredChildren?.keys() ?? []) {
      if (!slot || !Object.hasOwn(slots, slot))
        throw new Error(`${path} has no slot ${slot}`);
    }
    for (const [slot, rules] of Object.entries(slots)) {
      const segments = slot.split(".");
      const leaf = segments.pop()!;
      let container = props;
      for (const segment of segments) {
        container[segment] ??= {};
        if (!isRecord(container[segment]))
          throw new Error(`${path}.${slot} is not a slot object`);
        container = container[segment] as RecordValue;
      }
      const authoredNodes = authoredChildren?.get(slot);
      const existing = container[leaf] ?? [];
      if (!Array.isArray(existing))
        throw new Error(`${path}.${slot} must be an array`);
      const assertChildAllowed = (childType: string) => {
        if (
          (rules.allow && !rules.allow.includes(childType)) ||
          rules.disallow?.includes(childType)
        ) {
          throw new Error(`${path}.${slot} does not allow ${childType}`);
        }
      };
      if (authoredNodes) {
        container[leaf] = authoredNodes.flatMap((node) => {
          const child = compileNode(node);
          return child ? [child] : [];
        });
      } else {
        container[leaf] = existing.map((child, index) => {
          if (
            !isRecord(child) ||
            typeof child.type !== "string" ||
            !isRecord(child.props)
          ) {
            throw new Error(`${path}.${slot} has an invalid child`);
          }
          assertChildAllowed(child.type);
          return compile(
            child.type,
            {},
            `${path}.${slot}[${index}]`,
            undefined,
            child.props
          );
        });
      }
    }
    const fields = generationFields(type);
    const reportProp = (propPath: string[], message: string) => {
      const detail = `${path} (${type}): ${message}`;
      if (!owner || !propPath.length) throw new Error(detail);
      // Keep binding wrappers together so a repair can replace an invalid encoding
      // with the registry example. Other props can be repaired at the failing leaf.
      const scope: string[] = [];
      let example: unknown = defaults;
      let draftValue: unknown = authored;
      let field: Field | undefined = { type: "object", objectFields: fields };
      for (const part of propPath) {
        scope.push(part);
        example =
          isRecord(example) || Array.isArray(example)
            ? (example as Record<string, unknown>)[part]
            : undefined;
        draftValue =
          (isRecord(draftValue) || Array.isArray(draftValue)) &&
          Object.hasOwn(draftValue, part)
            ? (draftValue as Record<string, unknown>)[part]
            : undefined;
        field = field?.objectFields?.[part];
        if (
          field?.type === "entityField" ||
          field?.type === "ctaSelector" ||
          !isRecord(draftValue)
        )
          break;
      }
      issues.push({
        kind: "prop",
        key: owner.key,
        component: owner.type,
        path: scope,
        schemaIndex: contracts.prompt.components[type]?.props[scope[0]],
        message: detail,
        example,
      });
    };
    validateProps(
      component.generation!.props,
      defaults,
      props,
      authored,
      reportProp
    );
    validateBindings(props, fields, contracts.entityFields, reportProp);
    if (props.as === "nav" && containsPrimaryFooterLinks(props.content)) {
      const checkGrid = (value: unknown, prefix: string[]) => {
        if (
          isRecord(value) &&
          typeof value.gridTemplateColumns === "string" &&
          /\bmax-content\b/.test(value.gridTemplateColumns)
        )
          reportProp(
            [...prefix, "layout", "gridTemplateColumns"],
            "Footer navigation with primary FooterLinksSlot grids needs bounded columns. Use minmax(0, …fr) tracks."
          );
      };
      checkGrid(props.layout, []);
      if (isRecord(props.responsive))
        for (const [breakpoint, value] of Object.entries(props.responsive))
          if (isRecord(value))
            checkGrid(value.layout, ["responsive", breakpoint]);
    }
    if (
      type === "Breadcrumbs" &&
      isRecord(props.data) &&
      JSON.stringify(props.data.directoryRoot)?.match(/(?:^|")https?:\/\//i)
    ) {
      reportProp(
        ["data", "directoryRoot"],
        "directoryRoot is the displayed root breadcrumb label. Use its observed text instead of a URL."
      );
    }
    return { type, props: { ...props, id } };
  }

  const compiled = new Set<string>();
  function compileNode(node: DraftNode): Component | undefined {
    if (compiled.has(node.key)) return;
    compiled.add(node.key);
    const path = `Node ${node.key}`;
    try {
      let props: unknown;
      try {
        props = JSON.parse(node.propsJson);
      } catch {
        throw new Error(`${path} propsJson must be valid JSON`);
      }
      if (!isRecord(props))
        throw new Error(`${path} propsJson must be a JSON object`);
      const slots = Object.hasOwn(registered, node.type)
        ? componentSlots(node.type)
        : {};
      for (const slot of Object.keys(slots)) {
        let value: unknown = props;
        for (const segment of slot.split("."))
          value = isRecord(value) ? value[segment] : undefined;
        if (value !== undefined && (!Array.isArray(value) || value.length)) {
          issues.push({
            kind: "prop",
            key: node.key,
            component: node.type,
            path: slot.split("."),
            message: `${path} must provide children of ${slot} as separate nodes`,
          });
        }
      }
      return compile(
        node.type,
        props,
        path,
        children.get(node.key),
        undefined,
        node
      );
    } catch (error) {
      issues.push({
        kind: "node",
        key: node.key,
        component: node.type,
        message: errorMessage(error),
      });
    }
  }
  const content = (children.get(null)?.get(null) ?? []).flatMap((node) => {
    const component = compileNode(node);
    return component ? [component] : [];
  });
  // Check detached subtrees and children of malformed nodes for additional repair issues.
  for (const node of detached) compileNode(node);
  for (const node of draft.nodes) compileNode(node);
  if (issues.length) throw new LayoutValidationError(issues, draft);
  const paletteReplacements = usePaletteTokens(content, theme, contracts.theme);
  const rootBinding = (field: string) => ({
    field,
    constantValueEnabled: false,
    constantValue: "",
  });
  return {
    layout: {
      root: {
        props: {
          version: editorMigrations.length,
          sectionLibraryMigrationVersion: migrationRegistry.length,
          ...(contracts.entityFields.name === "type.string"
            ? { title: rootBinding("name") }
            : {}),
          ...(contracts.entityFields.description === "type.string"
            ? { description: rootBinding("description") }
            : {}),
        },
      },
      content,
    },
    metadata: {
      id: brand,
      displayName: draft.displayName.trim(),
      pageSetType: "ENTITY",
      purpose: ["LOCATION"],
    },
    theme,
    paletteReplacements,
    defaultedThemeFields: Object.keys(theme).filter(
      (key) => !overrides.has(key)
    ),
  };
}
