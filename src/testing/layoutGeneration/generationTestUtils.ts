import { resolveAllData, type Config, type Data } from "@puckeditor/core";
import { toPuckFields, type YextComponentConfig } from "@yext/visual-editor";
import { createPuckGenerationCatalog } from "@yext/visual-editor/section-library-support";
import { sharedComponentConfigs } from "../../library/shared/componentRegistry.ts";

const modules = import.meta.glob("../../library/sections/*.tsx", {
  eager: true,
}) as Record<string, Record<string, any>>;
export const sections: Record<
  string,
  YextComponentConfig<any>
> = Object.fromEntries(
  Object.values(modules)
    .filter((m) => m.config)
    .map((m) => [
      m.config.id,
      m[Object.keys(m).find((key) => key !== "config" && m[key]?.fields)!],
    ])
);
export const components = { ...sections, ...sharedComponentConfigs } as Record<
  string,
  YextComponentConfig<any>
>;
export const catalog = createPuckGenerationCatalog(components);
export const generationSchema = (name: string) =>
  catalog.data.components[name].generation!.props;
export const config = {
  components: Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      {
        ...component,
        fields: component.fields ? toPuckFields(component.fields) : undefined,
      },
    ])
  ),
} as Config;
export const sectionNames = [
  "ExpandedHeader",
  "HeroSection",
  "PromoSection",
  "CoreInfoSection",
  "BannerSection",
];

// Build serialized native instances, including identities for every authored child.
export const makeLayout = (type: string): Data => {
  let nextId = 0;
  const instance = (type: string, props: any): any => {
    props.id = `${type}-${nextId++}`;
    for (const items of Object.values(props.slots ?? {}) as any[][]) {
      for (const child of items) instance(child.type, child.props);
    }
    return { type, props };
  };
  return {
    root: { props: {} },
    content: [
      instance(type, JSON.parse(JSON.stringify(components[type].defaultProps))),
    ],
  };
};
export const authored = (layout: Data) => {
  const project = (item: any): any => {
    const schema = generationSchema(item.type);
    const props = schema.parse(item.props) as Record<string, any>;
    for (const [slotName, items] of Object.entries(props.slots ?? {})) {
      props.slots[slotName] = (items as any[]).map(project);
    }
    return { type: item.type, props };
  };
  return layout.content.map(project);
};
export const resolve = (
  layout: Data,
  streamDocument: Record<string, any> = {}
) => resolveAllData(layout, config, { streamDocument });
