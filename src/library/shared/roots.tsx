import { Background } from "./sectionSupport/atoms/background.tsx";
import {
  pageRootComponentIds,
  pageStructureMetadata,
} from "./design/pageStructure.ts";
import { DropZone, type Config } from "@puckeditor/core";
import { resolveDirectoryRootProps } from "@yext/visual-editor/section-library-support";

export const rootAllowedComponents = pageRootComponentIds;

// The Puck Root configuration for entity page sets
export const entityRootConfig: NonNullable<Config["root"]> = {
  metadata: pageStructureMetadata,
  render: () => (
    <Background surface="page" className="ve-theme-body min-h-screen">
      <DropZone
        zone="default-zone"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
        allow={rootAllowedComponents}
      />
    </Background>
  ),
};

// The Puck Root configuration for directory page sets
export const directoryRootConfig: NonNullable<Config["root"]> = {
  metadata: pageStructureMetadata,
  resolveData: (data: any, params: any) => ({
    ...data,
    props: resolveDirectoryRootProps(
      data.props ?? {},
      params.metadata?.streamDocument ?? {}
    ),
  }),
  render: () => (
    <Background surface="page" className="ve-theme-body min-h-screen">
      <DropZone
        zone="default-zone"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
        allow={rootAllowedComponents}
      />
    </Background>
  ),
};

// The Puck Root configuration for locator page sets
export const locatorRootConfig: NonNullable<Config["root"]> = {
  metadata: pageStructureMetadata,
  render: () => (
    <Background surface="page" className="ve-theme-body min-h-screen">
      <DropZone
        zone="default-zone"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
        allow={rootAllowedComponents}
      />
    </Background>
  ),
};
