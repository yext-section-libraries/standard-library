import type { YextComponentConfig } from "@yext/visual-editor";

type PermissionContext = Pick<
  Parameters<NonNullable<YextComponentConfig["resolvePermissions"]>>[1],
  "parent" | "permissions"
>;

/** Public atoms can be composed freely. Fixed internal aliases set their own permissions. */
export const gridAtomPermissions = {
  permissions: { drag: true, delete: true, duplicate: true },
  resolvePermissions: (_data: unknown, { permissions }: PermissionContext) => ({
    ...permissions,
    drag: true,
    delete: true,
  }),
} satisfies Pick<YextComponentConfig, "permissions" | "resolvePermissions">;
