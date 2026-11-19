import * as React from "react";
import type { Slot } from "@puckeditor/core";
import {
  toPuckFields,
  getAnalyticsScopeHash,
  type YextComponentConfig,
  type YextFields,
  type SurfaceRole,
} from "@yext/visual-editor";
import { designFields, renderDesignFields } from "./fields.tsx";
import type { DesignProps } from "./styleSchema.ts";
import { compositionData } from "./compositionData.ts";
import { designAttributes, designStyle } from "./styles.ts";
import { semanticTagField, type SemanticTag } from "./DesignElement.tsx";
import { structuralComponents } from "./containers.tsx";
import { VisibilityWrapper } from "../sectionSupport/atoms/visibilityWrapper.tsx";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import { surfaceRoles, themeSurfaceClassName } from "./theme.ts";
import { mappedSourcesAreEmpty } from "./sourceVisibility.ts";
import {
  useBackgroundContrastAttributes,
  backgroundContrastField,
  type BackgroundContrast,
} from "./backgroundContrast.ts";

export type CompositionProps = DesignProps & {
  content: Slot;
  as: SemanticTag;
  surfaceRole?: SurfaceRole;
  backgroundContrast?: BackgroundContrast;
  liveVisibility: boolean;
  analytics?: { scope?: string };
  hideWhenMappedContentEmpty?: boolean;
  mappedContentEmpty?: boolean;
};

/** Saved layouts are migrated before rendering; presets only use the composable renderer. */
export function createSectionPreset<Props extends Record<string, any>>(
  name: string,
  previous: Pick<
    YextComponentConfig<Props>,
    "label" | "defaultProps" | "layoutGenerationMetadata"
  >
): YextComponentConfig<CompositionProps> {
  const fields = {
    content: { type: "slot", visible: false, disallow: structuralComponents },
    as: semanticTagField,
    surfaceRole: {
      type: "select",
      label: "Theme surface",
      generation: { required: false },
      options: surfaceRoles.map((role) => ({ label: role, value: role })),
    },
    backgroundContrast: backgroundContrastField,
    liveVisibility: {
      type: "radio",
      label: "Visible on live page",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    hideWhenMappedContentEmpty: {
      type: "radio",
      label: "When mapped content is empty",
      options: [
        { label: "Hide this section", value: true },
        { label: "Keep this section", value: false },
      ],
    },
    mappedContentEmpty: {
      type: "radio",
      visible: false,
      options: [],
      generation: { exclude: true },
    },
    ...designFields,
  } as YextFields<CompositionProps>;
  const result: YextComponentConfig<any> = {
    label: previous.label,
    fields,
    layoutGenerationMetadata: previous.layoutGenerationMetadata?.exclude
      ? { exclude: true }
      : undefined,
    renderFields: renderDesignFields,
    inline: true,
    defaultProps: compositionData(name, previous.defaultProps ?? {}),
    resolveFields: () => toPuckFields(fields),
    resolveData: (data, params) => {
      return {
        props: {
          ...data.props,
          mappedContentEmpty:
            data.props.hideWhenMappedContentEmpty !== false &&
            mappedSourcesAreEmpty(
              data.props.content,
              params.metadata.streamDocument ?? {}
            ),
        },
      };
    },
    render: (props) => {
      const design = props as DesignProps;
      const contrastAttributes = useBackgroundContrastAttributes(
        design,
        props.backgroundContrast
      );
      const {
        content: Content,
        puck,
        as = "section",
        liveVisibility = true,
        surfaceRole = "page",
      } = props;
      if (!Content) return <></>;
      if (props.mappedContentEmpty && !puck.isEditing) return <></>;
      return (
        <AnalyticsScopeProvider
          name={`${props.analytics?.scope ?? name}${getAnalyticsScopeHash(props.id)}`}
        >
          <VisibilityWrapper
            liveVisibility={liveVisibility}
            isEditing={puck.isEditing}
          >
            {Content({
              as,
              ref: puck.dragRef,
              className: `components sl-atom ${themeSurfaceClassName(design.surface?.backgroundColor, surfaceRole)}`,
              ...designAttributes(props.attributes),
              ...contrastAttributes,
              style: designStyle(design, puck.isEditing),
              disallow: structuralComponents,
            })}
          </VisibilityWrapper>
        </AnalyticsScopeProvider>
      );
    },
  };
  // Puck maps generic intersections recursively; preserve the public authored-prop type here.
  return result as YextComponentConfig<CompositionProps>;
}
