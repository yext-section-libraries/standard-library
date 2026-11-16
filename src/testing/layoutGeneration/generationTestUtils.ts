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
    .map((m) => [m.config.id, m[m.config.id]])
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
  const visit = (value: any): any => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== "object") return value;
    const result = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, visit(child)])
    ) as any;
    if (value.type && value.props)
      result.props.id = `${value.type}-${nextId++}`;
    return result;
  };
  const instance = (type: string, props: any) => visit({ type, props });
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
    const visit = (value: any): any => {
      if (Array.isArray(value)) return value.map(visit);
      if (!value || typeof value !== "object") return value;
      if (value.type && value.props) return project(value);
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, visit(child)])
      );
    };
    for (const key of Object.keys(props)) props[key] = visit(props[key]);
    return { type: item.type, props };
  };
  return layout.content.map(project);
};
export const resolve = (
  layout: Data,
  streamDocument: Record<string, any> = {}
) => resolveAllData(layout, config, { streamDocument });
