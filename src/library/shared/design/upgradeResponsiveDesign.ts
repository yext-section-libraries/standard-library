import {
  styleSchema,
  type StyleGroups,
  type StyleGroup,
} from "./styleSchema.ts";

const groups = Object.keys(styleSchema) as StyleGroup[];
function merge(...values: Record<string, any>[]): StyleGroups {
  return Object.fromEntries(
    groups.map((group) => [
      group,
      Object.assign({}, ...values.map((value) => value?.[group] ?? {})),
    ])
  );
}
function differences(value: StyleGroups, base: StyleGroups): StyleGroups {
  return Object.fromEntries(
    groups.flatMap((group) => {
      const changes = Object.fromEntries(
        Object.keys(base[group] ?? {}).flatMap((property) => {
          const previous = (value[group] as Record<string, string>)?.[property];
          const next = (base[group] as Record<string, string>)?.[property];
          return previous === next
            ? []
            : [[property, previous || "revert-layer"]];
        })
      );
      return Object.keys(changes).length ? [[group, changes]] : [];
    })
  );
}
/** Convert the first composition format into Design defaults plus smaller-screen exceptions. */
export function upgradeResponsiveDesign<Props extends Record<string, any>>(
  props: Props
): Props {
  const responsive = props.responsive;
  if (!responsive || "mobile" in responsive) return props;
  const base = merge(props, responsive.tablet ?? {}, responsive.desktop ?? {});
  const mobile = differences(merge(props), base);
  const tablet = differences(merge(props, responsive.tablet ?? {}), base);
  // The original card presets inserted a two-column tablet default. Let tablet inherit Design now.
  if (tablet.layout?.gridTemplateColumns === "repeat(2, minmax(0, 1fr))")
    delete tablet.layout.gridTemplateColumns;
  const clean = (value: StyleGroups) =>
    Object.fromEntries(
      Object.entries(value).filter(
        ([, fields]) => Object.keys(fields ?? {}).length
      )
    );
  return {
    ...props,
    ...base,
    responsive: {
      ...(Object.keys(clean(tablet)).length ? { tablet: clean(tablet) } : {}),
      ...(Object.keys(clean(mobile)).length ? { mobile: clean(mobile) } : {}),
    },
  };
}
