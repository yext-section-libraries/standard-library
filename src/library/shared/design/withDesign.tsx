import * as React from "react";
import type { Fields } from "@puckeditor/core";
import { toPuckFields, type YextComponentConfig } from "@yext/visual-editor";
import { designFields, renderDesignFields } from "./fields.tsx";
import {
  DesignElement,
  semanticTagField,
  type SemanticTag,
} from "./DesignElement.tsx";
import type { DesignProps } from "./styleSchema.ts";
import { FunctionalBlockContext } from "./FunctionalBlockContext.ts";
import { typographyClasses } from "./styles.ts";

/** Gives functional Yext blocks the same editor controls as the layout atoms. */
export function withDesign<Props extends Record<string, any>>(
  component: YextComponentConfig<Props>,
  defaultTag: SemanticTag = "div"
): YextComponentConfig<Props & DesignProps & { as?: SemanticTag }> {
  const Render = component.render as React.ComponentType<any>;
  const result: YextComponentConfig<any> = {
    ...component,
    inline: true,
    fields: {
      ...component.fields,
      as: { ...semanticTagField, generation: { required: false } },
      ...designFields,
    },
    defaultProps: {
      ...component.defaultProps,
      as: defaultTag,
      ...(defaultTag === "address"
        ? { typography: { fontStyle: "normal" } }
        : {}),
    },
    renderFields: renderDesignFields,
    resolveFields: async (data, params) => {
      const fields = component.resolveFields
        ? await component.resolveFields(data, params)
        : component.fields
          ? toPuckFields<Props>(component.fields)
          : {};
      return {
        ...fields,
        as: { ...semanticTagField, generation: { required: false } },
        ...toPuckFields<DesignProps>(designFields),
      } as Fields;
    },
    render: (props) => (
      <FunctionalBlockContext.Provider value={true}>
        <DesignElement
          elementRef={props.puck.dragRef}
          as={props.as ?? defaultTag}
          design={props as DesignProps}
          isEditing={props.puck.isEditing}
          className={`sl-yext-block ${typographyClasses(props as DesignProps)}`}
        >
          <Render {...props} />
        </DesignElement>
      </FunctionalBlockContext.Provider>
    ),
  };
  return result as YextComponentConfig<
    Props & DesignProps & { as?: SemanticTag }
  >;
}
