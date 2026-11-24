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
import { instructions, outputSchema, type Draft } from "./gateway.ts";

type Field = {
  type: string;
  objectFields?: Fields;
  arrayFields?: Fields;
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
      return [
        id,
        {
          description: component.description,
          instructions: component.generation!.instructions,
          props,
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
    instructions,
    draftSchema: outputSchema,
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
        type: "Box",
        parentIndex: null,
        slot: null,
        propsJson:
          '{"as":"footer","surface":{"backgroundColor":"rgb(18, 52, 86)"}}',
      },
      {
        type: "Heading",
        parentIndex: 0,
        slot: "content",
        propsJson:
          '{"as":"h2","data":{"text":{"field":"address.city","constantValueEnabled":false}}}',
      },
      { type: "FAQSection", parentIndex: null, slot: null, propsJson: "{}" },
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
    try {
      const result = materialize(draft, brand, contracts);
      return {
        name,
        brand,
        draft,
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
      return { name, brand, draft, invalid: true };
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

function assertAuthoredKeys(value: unknown, parsed: unknown, path: string) {
  if (Array.isArray(value) && Array.isArray(parsed)) {
    value.forEach((entry, index) =>
      assertAuthoredKeys(entry, parsed[index], `${path}[${index}]`)
    );
  } else if (isRecord(value) && isRecord(parsed)) {
    for (const [key, entry] of Object.entries(value)) {
      if (!Object.hasOwn(parsed, key))
        throw new Error(`${path}.${key} is not a supported prop`);
      assertAuthoredKeys(entry, parsed[key], `${path}.${key}`);
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
  path: string
) {
  for (const key of Object.keys(authored)) {
    if (!Object.hasOwn(schema.shape, key)) {
      throw new Error(`${path}.${key} is not a supported prop`);
    }
  }
  const parsed = schema.safeParse(props);
  if (parsed.success) {
    assertAuthoredKeys(authored, parsed.data, path);
    return;
  }
  // Some shipped defaults contain inactive placeholders or stored mapping fields
  // outside the generation schema. Keep those defaults and validate model edits.
  const baseline = schema.safeParse(defaults);
  const signature = (issue: z.core.$ZodIssue) =>
    JSON.stringify([issue.code, issue.path, issue.message]);
  const existing = new Set(baseline.error?.issues.map(signature));
  const issues = parsed.error.issues.filter((issue) => {
    if (!existing.has(signature(issue))) return true;
    if (issue.code === "unrecognized_keys") {
      return issue.keys.some((key) =>
        hasAtPath(authored, [...issue.path, key])
      );
    }
    return hasAtPath(authored, issue.path);
  });
  if (issues.length) {
    throw new Error(
      `${path}: ${issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`
    );
  }
  for (const [key, value] of Object.entries(authored)) {
    const field = schema.shape[key].safeParse(props[key]);
    if (field.success) assertAuthoredKeys(value, field.data, `${path}.${key}`);
  }
}

function validateBindings(
  value: unknown,
  fields: Fields,
  entityFields: Contracts["entityFields"],
  path: string
) {
  function checkBinding(name: string, field?: Field) {
    const type = Object.hasOwn(entityFields, name)
      ? entityFields[name]
      : undefined;
    if (!type) throw new Error(`${path} uses an unknown entity field ${name}`);
    const allowed = field?.filter?.types;
    if (allowed?.length && !allowed.includes(type.replace(/\[\]$/, ""))) {
      throw new Error(
        `${path} cannot bind ${name} (${type}); expected ${allowed.join(" or ")}`
      );
    }
    if (field?.filter?.includeListsOnly && !type.endsWith("[]")) {
      throw new Error(`${path} requires a list entity field`);
    }
  }
  function visit(entry: unknown, field?: Field) {
    if (typeof entry === "string") {
      for (const [, name] of entry.matchAll(/\[\[\s*([\w.]+)\s*\]\]/g))
        checkBinding(name);
    } else if (Array.isArray(entry)) {
      entry.forEach((item) =>
        visit(item, { type: "object", objectFields: field?.arrayFields })
      );
    } else if (isRecord(entry)) {
      if (
        typeof entry.field === "string" &&
        entry.field &&
        entry.constantValueEnabled !== true
      ) {
        checkBinding(entry.field, field);
      }
      for (const [key, child] of Object.entries(entry))
        visit(child, field?.objectFields?.[key]);
    }
  }
  visit(value, { type: "object", objectFields: fields });
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

export function materialize(draft: Draft, brand: string, contracts: Contracts) {
  if (!draft.displayName.trim() || !draft.nodes.length)
    throw new Error(
      "The layout needs a display name and at least one component"
    );
  const theme = Object.fromEntries(
    Object.entries(contracts.theme).map(([key, field]) => [key, field.default])
  );
  const failures: string[] = [];
  function check<T>(validate: () => T): T | undefined {
    try {
      return validate();
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  const overrides = new Set<string>();
  for (const { key, value } of draft.themeOverrides) {
    check(() => {
      if (!Object.hasOwn(contracts.theme, key))
        throw new Error(`Unknown theme field ${key}`);
      if (overrides.has(key))
        throw new Error(`Duplicate override for theme field ${key}`);
      if (!validThemeValue(contracts.theme[key], value))
        throw new Error(`Invalid value for theme field ${key}`);
      overrides.add(key);
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
    });
  }
  for (const [key, value] of Object.entries(theme)) {
    if (!validThemeValue(contracts.theme[key], value))
      throw new Error(`Invalid registry default for theme field ${key}`);
  }

  const children = new Map<number | null, Map<string | null, number[]>>();
  for (const [index, node] of draft.nodes.entries()) {
    if (
      node.parentIndex !== null &&
      (node.parentIndex < 0 || node.parentIndex >= index)
    ) {
      throw new Error(`Node ${index} must reference an earlier parent index`);
    }
    if (node.parentIndex === null ? node.slot !== null : !node.slot) {
      throw new Error(
        `Node ${index} needs a slot exactly when it has a parent`
      );
    }
    const slots = children.get(node.parentIndex) ?? new Map();
    const siblings = slots.get(node.slot) ?? [];
    siblings.push(index);
    slots.set(node.slot, siblings);
    children.set(node.parentIndex, slots);
  }
  let nextId = 0;
  function compile(
    type: string,
    authored: RecordValue,
    path: string,
    authoredChildren?: Map<string | null, number[]>,
    inheritedProps?: RecordValue
  ): Component {
    if (!Object.hasOwn(registered, type))
      throw new Error(`${path} uses unsupported component ${type}`);
    const component = registered[type];
    const slots = componentSlots(type);
    const defaults = inheritedProps
      ? mergeProps(component.defaultProps ?? {}, inheritedProps)
      : (component.defaultProps ?? {});
    const props = mergeProps(defaults, authored);
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
      const indices = authoredChildren?.get(slot);
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
      if (indices) {
        container[leaf] = indices.map((index) => {
          const node = draft.nodes[index];
          return (
            check(() => {
              assertChildAllowed(node.type);
              return compileNode(index, node);
            }) ?? { type: node.type, props: {} }
          );
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
    validateProps(
      component.generation!.props,
      defaults,
      props,
      authored,
      `${path} (${type})`
    );
    validateBindings(
      props,
      generationFields(type),
      contracts.entityFields,
      path
    );
    return { type, props: { ...props, id } };
  }
  function compileNode(index: number, node: DraftNode) {
    let props: unknown;
    try {
      props = JSON.parse(node.propsJson);
    } catch {
      throw new Error(`Node ${index} propsJson must be valid JSON`);
    }
    if (!isRecord(props))
      throw new Error(`Node ${index} propsJson must be a JSON object`);
    const slots = Object.hasOwn(registered, node.type)
      ? componentSlots(node.type)
      : {};
    for (const slot of Object.keys(slots)) {
      let value: unknown = props;
      for (const segment of slot.split("."))
        value = isRecord(value) ? value[segment] : undefined;
      if (value !== undefined && (!Array.isArray(value) || value.length)) {
        throw new Error(
          `Node ${index} must provide children of ${slot} as separate nodes`
        );
      }
    }
    return compile(node.type, props, `Node ${index}`, children.get(index));
  }
  const content = (children.get(null)?.get(null) ?? []).flatMap((index) => {
    const node = draft.nodes[index];
    const component = check(() => {
      if (!pageRootComponentIds.includes(node.type))
        throw new Error(`${node.type} is not allowed at the page root`);
      return compileNode(index, node);
    });
    return component ? [component] : [];
  });
  if (failures.length) throw new Error([...new Set(failures)].join("\n"));
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
