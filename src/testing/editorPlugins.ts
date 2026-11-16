import type { Plugin } from "@puckeditor/core";
import * as VisualEditor from "@yext/visual-editor";

// Source-linked editor hosts provide this automatically. Older installed packages can still build the demo.
const { inspectorSessionPlugin, blockSearchPlugin } =
  VisualEditor as typeof VisualEditor & {
    inspectorSessionPlugin?: Plugin;
    blockSearchPlugin?: Plugin;
  };
export const localEditorPlugins: Plugin[] = [
  inspectorSessionPlugin,
  blockSearchPlugin,
].filter((plugin): plugin is Plugin => !!plugin);
