import { Background } from "./sectionSupport/atoms/background.tsx";
import {
  pageRootComponentIds,
  pageStructureMetadata,
} from "./design/pageStructure.ts";
import { DropZone, type Config } from "@puckeditor/core";
import { resolveDirectoryRootProps } from "@yext/visual-editor/section-library-support";
import { ThemeSurfaceProvider } from "./design/ThemeSurfaceProvider.tsx";

export const rootAllowedComponents = pageRootComponentIds;

const renderPageRoot = () => (
  <ThemeSurfaceProvider>
    <Background
      surface="page"
      className="sl-page-root ve-theme-body min-h-screen"
    >
      <DropZone
        zone="default-zone"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
        allow={rootAllowedComponents}
      />
    </Background>
  </ThemeSurfaceProvider>
);

// The Puck Root configuration for entity page sets
export const entityRootConfig: NonNullable<Config["root"]> = {
  metadata: pageStructureMetadata,
  render: renderPageRoot,
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
  render: renderPageRoot,
};

// The Puck Root configuration for locator page sets
export const locatorRootConfig: NonNullable<Config["root"]> = {
  metadata: pageStructureMetadata,
  render: renderPageRoot,
};
