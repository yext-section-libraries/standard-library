import type { YextComponentConfig } from "@yext/visual-editor";

type PermissionContext = Pick<
  Parameters<NonNullable<YextComponentConfig["resolvePermissions"]>>[1],
  "parent" | "permissions"
>;

/** Grid atoms are movable and removable only while they belong to a Grid. */
export const gridAtomPermissions = {
  permissions: { drag: false, delete: false, duplicate: false },
  resolvePermissions: (
    _data: unknown,
    { parent, permissions }: PermissionContext
  ) => ({
    ...permissions,
    drag: parent?.type === "Grid",
    delete: parent?.type === "Grid",
  }),
} satisfies Pick<YextComponentConfig, "permissions" | "resolvePermissions">;
