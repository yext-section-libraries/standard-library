import { gridAtomPermissions } from "../shared/gridAtomPermissions.ts";
import { PuckComponent } from "@puckeditor/core";
import { Body } from "../shared/sectionSupport/atoms/body.tsx";
import {
  useDocument,
  resolveComponentData,
  EntityField,
  YextEntityField,
  msg,
  pt,
  TranslatableRichText,
  TranslatableString,
  resolveDataFromParent,
  ThemeColor,
  TypographyRole,
  themeManagerCn,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import { useTranslation } from "react-i18next";

export type TextProps = {
  data: {
    /** The text to display. */
    text: YextEntityField<TranslatableString | TranslatableRichText>;
  };

  styles: {
    /** Optional text color override. */
    color?: ThemeColor;
    /** Optional font style override. */
    fontStyle?: "regular" | "bold" | "italic";
    typographyRole?: TypographyRole;
  };

  /** @internal Controlled data from the parent section. */
  parentData?: {
    field: string;
    text: TranslatableString | TranslatableRichText | undefined;
  };

  /** @internal Controlled style from the parent section */
  parentStyles?: {
    className: string;
    typographyRole?: TypographyRole;
  };
};

const textFields: YextFields<TextProps> = {
  data: {
    type: "object",
    label: msg("fields.data", "Data"),
    objectFields: {
      text: {
        type: "entityField",
        label: msg("fields.text", "Text"),
        filter: {
          types: ["type.string", "type.rich_text_v2"],
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
      fontStyle: {
        label: msg("fields.fontStyle", "Font Style"),
        type: "radio",
        options: [
          {
            label: msg("fields.defaultForPlacement", "Default for Placement"),
            value: undefined,
          },
          { label: msg("fields.options.regular", "Regular"), value: "regular" },
          { label: msg("fields.options.bold", "Bold"), value: "bold" },
          { label: msg("fields.options.italic", "Italic"), value: "italic" },
        ],
      },
      typographyRole: { type: "typographyRole" },
    },
  },
};

const TextComponent: PuckComponent<TextProps> = (props) => {
  const { data, styles, puck, parentData, parentStyles } = props;
  const { i18n } = useTranslation();
  const streamDocument = useDocument();

  const sourceData = parentData ? parentData.text : data.text;
  const resolvedData = sourceData
    ? resolveComponentData(sourceData, i18n.language, streamDocument, {
        output: "plainText",
      })
    : "";

  return resolvedData ? (
    <EntityField
      displayName={pt("text", "Text")}
      fieldId={parentData ? parentData.field : data.text.field}
      constantValueEnabled={!parentData && data.text.constantValueEnabled}
    >
      <Body
        color={styles.color}
        typographyRole={
          styles.typographyRole ?? parentStyles?.typographyRole ?? "body"
        }
        style={{
          fontWeight:
            styles.fontStyle === "bold"
              ? 700
              : styles.fontStyle === "regular"
                ? 400
                : undefined,
          fontStyle: styles.fontStyle === "italic" ? "italic" : undefined,
        }}
        className={themeManagerCn(parentStyles?.className)}
      >
        {resolvedData}
      </Body>
    </EntityField>
  ) : puck.isEditing ? (
    <div className="h-[30px] min-w-[100px]" />
  ) : (
    <></>
  );
};

export const Text: YextComponentConfig<TextProps> = {
  ...gridAtomPermissions,
  label: msg("components.text", "Text"),
  fields: textFields,
  resolveFields: (data) => resolveDataFromParent(textFields, data),
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
  render: (props) => <TextComponent {...props} />,
};

export const config: SectionConfig = {
  id: "Text",
  displayName: "Text",
  description: "Renders body plain text.",
  pageSetTypes: ["ENTITY"],
  category: "Core Information",
};
