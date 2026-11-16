import * as React from "react";
import { Puck, type Overrides } from "@puckeditor/core";
import * as SectionLibrarySupport from "@yext/visual-editor/section-library-support";
import { localEditorPlugins } from "./editorPlugins.ts";

// Source-linked editors share the full editor's translations. Keep older installed
// packages usable when the source checkout is absent.
const { translatedPuckFieldOverrides = {} } =
  SectionLibrarySupport as typeof SectionLibrarySupport & {
    translatedPuckFieldOverrides?: Overrides["fieldTypes"];
  };

// Puck resynchronizes its viewport when iframe options change identity. During the
// first edit's history debounce, that would replace the original undo snapshot.
const editorOptions = {
  ui: { rightSideBarWidth: 360 },
  iframe: { enabled: true },
  dnd: { enableDragHandle: true },
  plugins: localEditorPlugins,
};

/** The same editor host is used by the interactive demo and its editing regressions. */
export function DesignPreviewEditor({
  overrides,
  ...props
}: React.ComponentProps<typeof Puck>) {
  const translatedOverrides = React.useMemo(
    () => ({
      ...overrides,
      fieldTypes: { ...translatedPuckFieldOverrides, ...overrides?.fieldTypes },
    }),
    [overrides]
  );
  return <Puck {...editorOptions} {...props} overrides={translatedOverrides} />;
}
