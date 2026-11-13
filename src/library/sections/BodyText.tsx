import { gridAtomPermissions } from "../shared/gridAtomPermissions.ts";
import { useTranslation } from "react-i18next";
import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { Body } from "../shared/sectionSupport/atoms/body.tsx";
import {
  useDocument,
  resolveComponentData,
  EntityField,
  YextEntityField,
  pt,
  msg,
  TranslatableRichText,
  TypographyRole,
  resolveDataFromParent,
  ThemeColor,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";

export type BodyTextProps = {
  data: {
    /** The body text to display. */
    text: YextEntityField<TranslatableRichText>;
  };

  styles: {
    /** The color of the body text. */
    color?: ThemeColor;
    typographyRole?: TypographyRole;
  };

  /**
   * @internal Controlled data from the parent section.
   */
  parentData?: {
    field: string;
    richText: TranslatableRichText | undefined;
  };

  /** @internal Controlled style from the parent section */
  parentStyles?: {
    className: string;
    typographyRole?: TypographyRole;
  };
};

const bodyTextFields: YextFields<BodyTextProps> = {
  data: {
    type: "object",
    label: msg("fields.data", "Data"),
    objectFields: {
      text: {
        type: "entityField",
        label: msg("fields.text", "Text"),
        filter: {
          types: ["type.rich_text_v2"],
        },
      },
    },
  },
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      color: {
        type: "basicSelector",
        label: msg("fields.color", "Color"),
        options: "SITE_COLOR",
      },
      typographyRole: { type: "typographyRole" },
    },
  },
};

const BodyTextComponent: PuckComponent<BodyTextProps> = (props) => {
  const { data, styles, puck, parentData } = props;
  const { i18n } = useTranslation();
  const streamDocument = useDocument();

  const sourceData = parentData ? parentData?.richText : data.text;

  const resolvedData = sourceData
    ? resolveComponentData(sourceData, i18n.language, streamDocument, {
        color: styles.color,
        typographyRole:
          styles.typographyRole ?? props.parentStyles?.typographyRole ?? "body",
        className: props.parentStyles?.className,
      })
    : undefined;

  return React.isValidElement(resolvedData) ||
    typeof resolvedData === "string" ? (
    <EntityField
      displayName={pt("body", "Body")}
      fieldId={parentData ? parentData.field : data.text.field}
      constantValueEnabled={data.text.constantValueEnabled}
    >
      {typeof resolvedData === "string" ? (
        <Body
          color={styles.color}
          typographyRole={
            styles.typographyRole ??
            props.parentStyles?.typographyRole ??
            "body"
          }
        >
          {resolvedData}
        </Body>
      ) : (
        resolvedData
      )}
    </EntityField>
  ) : puck.isEditing ? (
    <div className="h-[60px] min-w-[100px]" />
  ) : (
    <></>
  );
};

export const BodyText: YextComponentConfig<BodyTextProps> = {
  ...gridAtomPermissions,
  label: msg("components.richText", "Rich Text"),
  fields: bodyTextFields,
  resolveFields: (data) => resolveDataFromParent(bodyTextFields, data),
  defaultProps: {
    data: {
      text: {
        field: "",
        constantValue: { defaultValue: "Text" },
        constantValueEnabled: true,
      },
    },
    styles: {},
  },
  render: (props) => <BodyTextComponent {...props} />,
};

export const config: SectionConfig = {
  id: "BodyText",
  displayName: "Rich Text",
  description: "Displays rich text.",
  pageSetTypes: ["ENTITY"],
  category: "Core Information",
};
