import * as React from "react";
import { createUsePuck, useGetPuck } from "@puckeditor/core";

const usePuck = createUsePuck();
export const InspectorFieldScope = React.createContext("");

/** Keep disclosure state with the inspector UI, so data edits and history cannot remount it closed. */
export function useInspectorDisclosure(name: string, initial = false) {
  const scope = React.useContext(InspectorFieldScope);
  const key = `sl:${scope}:${name}`;
  const getPuck = useGetPuck();
  const expanded = usePuck(
    (state) => state.appState.ui.expandedFieldGroups[key] ?? initial
  );
  const setExpanded = React.useCallback(
    (next: boolean) => {
      getPuck().dispatch({
        type: "setUi",
        recordHistory: false,
        ui: (ui) => ({
          expandedFieldGroups: { ...ui.expandedFieldGroups, [key]: next },
        }),
      });
    },
    [getPuck, key]
  );
  return [expanded, setExpanded] as const;
}
