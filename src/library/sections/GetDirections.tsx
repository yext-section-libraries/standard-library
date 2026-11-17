import { gridAtomPermissions } from "../shared/gridAtomPermissions.ts";
import "@yext/pages-components/style.css";
import {
  ThemeColor,
  msg,
  resolveDataFromParent,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import { CTA } from "../shared/sectionSupport/atoms/cta.tsx";
import { useTranslation } from "react-i18next";

export type GetDirectionsProps = {
  actionId?: string;
  color?: ThemeColor;
  /** The text and icon color for the primary variant. */
  textColor?: ThemeColor;
};

const getDirectionsFields: YextFields<GetDirectionsProps> = {
  actionId: {
    generation: { required: false },
    label: "Action preset",
    type: "themeCollection",
    collection: "actions",
  },
  color: {
    type: "basicSelector",
    label: msg("fields.color", "Color"),
    options: "SITE_COLOR",
  },
  textColor: {
    type: "basicSelector",
    label: msg("fields.textColor", "Text Color"),
    options: "SITE_COLOR",
  },
};

const GetDirectionsComponent = ({
  actionId,
  color,
  textColor,
}: GetDirectionsProps) => {
  const { t } = useTranslation();

  return (
    <CTA
      setPadding={true}
      ctaType="getDirections"
      eventName={`getDirections`}
      label={t("getDirections", "Get Directions")}
      linkType={"DRIVING_DIRECTIONS"}
      normalizeLink={false}
      target="_blank"
      actionId={actionId}
      color={color}
      textColor={textColor}
    />
  );
};

export const GetDirections: YextComponentConfig<GetDirectionsProps> = {
  ...gridAtomPermissions,
  label: msg("components.getDirections", "Get Directions"),
  fields: getDirectionsFields,
  defaultProps: {},
  resolveFields: (data) => {
    let updatedFields = resolveDataFromParent(getDirectionsFields, data);
    return updatedFields;
  },
  render: (props) => <GetDirectionsComponent {...props} />,
};

export const config: SectionConfig = {
  id: "GetDirections",
  displayName: "Get Directions",
  description: "Displays a get directions call to action.",
  pageSetTypes: ["ENTITY"],
  category: "Core Information",
};
