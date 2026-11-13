import type { Migration, TypographyRole } from "@yext/visual-editor";

// Saved library fields need their own adoption step: SDK migration 84 may have
// already run, and its wildcard does not know our text/FAQ style field names.
const bodyRoles: Record<string, TypographyRole> = {
  xs: "body-small",
  sm: "body-small",
  base: "body",
  lg: "body-large",
};
const contentKeys = new Set([
  "data",
  "constantValue",
  "parentData",
  "trueDisplayText",
  "falseDisplayText",
]);
const renameRole = (role: unknown) =>
  role === "lead" ? "eyebrow" : role === "fine-print" ? "body-small" : role;

export const migrateTypographyProps = <T extends Record<string, any>>(
  props: T
): T => {
  const visit = (value: any): any => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== "object") return value;
    const result: Record<string, any> = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        contentKeys.has(key) ? structuredClone(child) : visit(child),
      ])
    );
    for (const roleKey of [
      "typographyRole",
      "questionTypographyRole",
      "answerTypographyRole",
    ]) {
      if (roleKey in result) result[roleKey] = renameRole(result[roleKey]);
    }
    for (const [oldKey, roleKey] of [
      ["variant", "typographyRole"],
      ["bodyVariant", "typographyRole"],
      ["questionVariant", "questionTypographyRole"],
      ["answerVariant", "answerTypographyRole"],
    ]) {
      const oldValue = result[oldKey];
      if (typeof oldValue !== "string" || !Object.hasOwn(bodyRoles, oldValue))
        continue;
      if (!result[roleKey] || result[roleKey] === "body")
        result[roleKey] = bodyRoles[oldValue];
      delete result[oldKey];
    }
    if (
      result.styles?.variant === null &&
      (result.data?.text || Array.isArray(result.data?.links))
    ) {
      delete result.styles.variant;
    }
    for (const oldKey of ["bodyVariant", "questionVariant", "answerVariant"]) {
      if (result[oldKey] === null) delete result[oldKey];
    }
    return result;
  };
  return visit(props);
};

export const typographyRoles: Migration = {
  "*": {
    action: "updated",
    propTransformation: (props) => migrateTypographyProps(props),
  },
};
