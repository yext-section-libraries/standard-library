import { resolveAllData, type Config, type Data } from "@puckeditor/core";
import type { YextComponentConfig } from "@yext/visual-editor";
import { ExpandedHeader } from "../library/sections/ExpandedHeader.tsx";
import { HeroSection } from "../library/sections/HeroSection.tsx";
import { PromoSection } from "../library/sections/PromoSection.tsx";
import { CoreInfoSection } from "../library/sections/CoreInfoSection.tsx";
import { BannerSection } from "../library/sections/BannerSection.tsx";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";

export const components = {
  ...sharedComponentConfigs,
  ExpandedHeader,
  HeroSection,
  PromoSection,
  CoreInfoSection,
  BannerSection,
} as Record<string, YextComponentConfig<any>>;
const config = { components } as Config;
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
    const schema = components[item.type].layoutGenerationMetadata!.props;
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
