import { gridAtomPermissions } from "../shared/gridAtomPermissions.ts";
import { PuckComponent } from "@puckeditor/core";
import {
  useDocument,
  EntityField,
  YextEntityField,
  TranslatableString,
  resolveComponentData,
  pt,
  msg,
  ThemeOptions,
  HeadingLevel,
  ThemeColor,
  resolveDataFromParent,
  YextComponentConfig,
  YextFields,
} from "@yext/visual-editor/section-library-support";
import {
  Heading,
  HeadingProps,
} from "../shared/sectionSupport/atoms/heading.tsx";
import { useTranslation } from "react-i18next";
import { SectionConfig } from "@yext/visual-editor";

export type HeadingTextProps = {
  /** The heading text value */
  data: {
    text: YextEntityField<TranslatableString>;
  };

  /** Styling for the heading. */
  styles: {
    /** The h tag level of the section heading */
    level: HeadingProps["level"];
    /** Alignment of the event section heading */
    align: "left" | "center" | "right";
    /** Optional override to render a different HTML tag instead of the one based on the level */
    semanticLevelOverride?: HeadingLevel | "span";
    color?: ThemeColor;
  };

  /** @internal Controlled data from the parent section */
  parentData?: {
    field: string;
    text?: string;
  };
};

const HeadingTextWrapper: PuckComponent<HeadingTextProps> = (props) => {
  const { data, styles, puck, parentData } = props;
  const streamDocument = useDocument();
  const { i18n } = useTranslation();

  const justifyClass = styles?.align
    ? {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
      }[styles.align]
    : "justify-start";

  const alignClass = styles?.align
    ? {
        left: "text-left",
        center: "text-center",
        right: "text-right",
      }[styles.align]
    : "text-left";

  const resolvedHeadingText =
    parentData?.text ??
    resolveComponentData(data.text, i18n.language, streamDocument);

  return resolvedHeadingText ? (
    <div className={`flex w-full ${justifyClass}`}>
      <EntityField
        displayName={pt("heading", "Heading") + " " + styles.level}
        fieldId={parentData ? parentData.field : data.text.field}
        constantValueEnabled={!parentData && data.text.constantValueEnabled}
      >
        <Heading
          level={styles.level}
          className={alignClass}
          semanticLevelOverride={styles.semanticLevelOverride}
          color={styles.color}
        >
          {resolvedHeadingText}
        </Heading>
      </EntityField>
    </div>
  ) : puck.isEditing ? (
    <div className="h-[30px]" />
  ) : (
    <></>
  );
};

const headingTextFields: YextFields<HeadingTextProps> = {
  data: {
    generation: { instructions: "The heading text or entity field." },
    label: msg("fields.data", "Data"),
    type: "object",
    objectFields: {
      text: {
        type: "entityField",
        label: msg("fields.text", "Text"),
        filter: {
          types: ["type.string"],
        },
      },
    },
  },
  styles: {
    label: msg("fields.styles", "Styles"),
    type: "object",
    objectFields: {
      level: {
        generation: { instructions: "The h tag level" },
        type: "basicSelector",
        label: msg("fields.headingLevel", "Heading Level"),
        options: "HEADING_LEVEL",
      },
      align: {
        label: msg("fields.headingAlign", "Heading Align"),
        type: "radio",
        options: ThemeOptions.ALIGNMENT,
      },
      color: {
        generation: {
          instructions:
            "Leave text color unset so the theme chooses it. A requested palette or background change does not by itself require a text color override. Do not infer a text color from imagery or surrounding content. Set a valid theme color when the user specifically requests a text color override.",
        },
        type: "basicSelector",
        label: msg("fields.color", "Color"),
        options: "SITE_COLOR",
      },
    },
  },
};

export const HeadingText: YextComponentConfig<HeadingTextProps> = {
  ...gridAtomPermissions,
  label: msg("components.headingText", "Heading Text"),
  fields: headingTextFields,
  resolveFields: (data) => resolveDataFromParent(headingTextFields, data),
  defaultProps: {
    data: {
      text: {
        field: "",
        constantValue: { defaultValue: "Text" },
        constantValueEnabled: true,
      },
    },
    styles: {
      level: 2,
      align: "left",
    },
  },
  render: (props) => <HeadingTextWrapper {...props} />,
};

export const config: SectionConfig = {
  id: "HeadingText",
  displayName: "Heading Text",
  description: "Renders heading plain text.",
  pageSetTypes: ["ENTITY"],
  category: "Core Information",
};
