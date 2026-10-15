import { z } from "zod";
import { entityFieldSchema } from "../shared/generation/data.ts";
import { optionalSiteColorSchema } from "../shared/sectionSupport/contentBlocks/contactSchemas.ts";
import { gridAtomPermissions } from "../shared/gridAtomPermissions.ts";
import { useTranslation } from "react-i18next";
import { PuckComponent } from "@puckeditor/core";
import { FaRegEnvelope } from "react-icons/fa";
import {
  useDocument,
  EntityField,
  YextEntityField,
  resolveComponentData,
  msg,
  pt,
  ThemeColor,
  ThemeOptions,
  backgroundColors,
  resolveDataFromParent,
  toPuckFields,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import {
  getTextColorClass,
  getTextColorStyle,
} from "@yext/visual-editor/section-library-support";
import { CTA } from "../shared/sectionSupport/atoms/cta.tsx";
import { Background } from "../shared/sectionSupport/atoms/background.tsx";
import { updateFields } from "../shared/utils/updateFields.ts";

export const emailsSchema = z.object({
  data: z.object({
    list: entityFieldSchema(z.array(z.string())).describe(
      "Email addresses to display."
    ),
  }),
  styles: z
    .object({
      listLength: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe(
          "Maximum emails displayed from an entity field; defaults to 1."
        ),
      showIcon: z.boolean().optional(),
      color: optionalSiteColorSchema.describe(
        "Email link and icon background color. Omit to use the default theme colors; set only when the user explicitly requests an email color override."
      ),
      iconColor: optionalSiteColorSchema.describe(
        "Email icon glyph color. Omit to use the default icon color; set only when the user explicitly requests an icon color override."
      ),
    })
    .optional(),
});

export interface EmailsProps {
  data: {
    list: YextEntityField<string[]>;
  };

  styles?: {
    listLength?: number;
    showIcon?: boolean;
    /** The color applied to both the email icon background and the email link. */
    color?: ThemeColor;
    /** The color of the email icon. */
    iconColor?: ThemeColor;
  };

  /** @internal Event name to be used for click analytics */
  eventName?: string;

  /** @internal */
  parentData?: {
    field: string;
    list: string[];
  };
}

// Email fields used in Emails and CoreInfoSection
export const EmailsFields: YextFields<EmailsProps> = {
  data: {
    type: "object",
    label: msg("fields.data", "Data"),
    objectFields: {
      list: {
        type: "entityField",
        label: msg("fields.emails", "Emails"),
        filter: {
          types: ["type.string"],
          includeListsOnly: true,
          allowList: ["emails"],
        },
        disallowTranslation: true,
      },
    },
  },
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      listLength: {
        type: "number",
        label: msg("fields.listLength", "List Length"),
        min: 1,
        max: 5,
        visible: false,
      },
      showIcon: {
        label: msg("fields.showIcon", "Show Icon"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
      color: {
        type: "basicSelector",
        label: msg("fields.color", "Color"),
        options: "SITE_COLOR",
      },
      iconColor: {
        type: "basicSelector",
        label: msg("fields.iconColor", "Icon Color"),
        options: "SITE_COLOR",
      },
    },
  },
};

const EmailsComponent: PuckComponent<EmailsProps> = (props) => {
  const { data, styles, parentData, puck, eventName } = props;
  const { i18n } = useTranslation();
  const streamDocument = useDocument();

  const showEmailIcon = styles?.showIcon ?? true;

  let resolvedEmailList = parentData
    ? parentData.list
    : resolveComponentData(data.list, i18n.language, streamDocument);

  if (!!resolvedEmailList && !Array.isArray(resolvedEmailList)) {
    resolvedEmailList = [resolvedEmailList];
  }

  const filteredEmailList = resolvedEmailList?.length
    ? resolvedEmailList
        .slice(
          0,
          data.list.constantValueEnabled
            ? resolvedEmailList.length
            : Math.min(resolvedEmailList.length, styles?.listLength ?? 1)
        )
        .filter((e) => !!e)
    : [];

  return filteredEmailList?.length ? (
    <EntityField
      displayName={pt("fields.emailList", "Email List")}
      fieldId={parentData ? parentData.field : data.list.field}
      constantValueEnabled={data.list.constantValueEnabled}
    >
      <ul className="list-inside flex flex-col gap-4">
        {filteredEmailList.map((email, index) => (
          <li key={index} className="flex items-center gap-3 min-w-0">
            {showEmailIcon && (
              <Background
                background={styles?.color ?? backgroundColors.background2.value}
                className="h-10 w-10 shrink-0 flex justify-center rounded-full items-center"
              >
                <FaRegEnvelope
                  className={`w-4 h-4 ${getTextColorClass(styles?.iconColor) ?? ""}`}
                  style={getTextColorStyle(styles?.iconColor)}
                />
              </Background>
            )}
            <CTA
              eventName={`${eventName || "email"}${index}`}
              link={email}
              label={email}
              linkType="EMAIL"
              normalizeLink={false}
              variant="link"
              color={styles?.color}
              alwaysHideCaret={true}
              className="min-w-0 w-full justify-start whitespace-normal break-all text-left"
            />
          </li>
        ))}
      </ul>
    </EntityField>
  ) : puck.isEditing ? (
    <div className="h-10" />
  ) : (
    <></>
  );
};

export const Emails: YextComponentConfig<EmailsProps> = {
  generation: { props: emailsSchema },
  ...gridAtomPermissions,
  label: msg("components.emails", "Emails"),
  fields: EmailsFields,
  resolveFields: (data) => {
    const updatedFields = resolveDataFromParent(EmailsFields, data);

    if (data.props.data.list.constantValueEnabled) {
      return updatedFields;
    }

    return toPuckFields(
      updateFields<EmailsProps>(
        updatedFields,
        ["styles.objectFields.listLength.visible"],
        true
      )
    );
  },
  defaultProps: {
    data: {
      list: {
        field: "emails",
        constantValue: [],
      },
    },
    styles: {
      listLength: 3,
      showIcon: true,
    },
  },
  render: (props) => <EmailsComponent {...props} />,
};

export const config: SectionConfig = {
  id: "Emails",
  displayName: "Emails",
  description: "Displays a list of emails.",
  pageSetTypes: ["ENTITY"],
  category: "Core Information",
};
