import { DefaultComponentProps, Fields } from "@puckeditor/core";
import { YextFields, YextPuckField } from "@yext/visual-editor";

/**
 * updateFields is a resolveFields helper that can update or remove fields
 * based on a dot notation path
 * @internal
 */
export const updateFields = <T extends DefaultComponentProps>(
  obj: Record<string, any>,
  paths: (string | undefined)[],
  value: any
): YextFields<T> => {
  const newObj = { ...obj };

  for (const path of paths) {
    if (!path) {
      continue;
    }

    const keys = path.split(".");
    let current = newObj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // Create new objects along the path to ensure deep immutability
      current[key] = { ...current[key] };
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];

    if (value === undefined) {
      delete current[lastKey];
    } else {
      current[lastKey] = value;
    }
  }

  return newObj as Fields<T, YextPuckField>;
};
