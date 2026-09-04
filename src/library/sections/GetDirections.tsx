import { setDeep } from "@puckeditor/core";
import "@yext/pages-components/style.css";
import {
  ThemeColor,
  ThemeOptions,
  msg,
  resolveDataFromParent,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import {
  CTA,
  CTAVariant,
  isCtaVariantWithColor,
} from "../shared/sectionSupport/atoms/cta.tsx";
import { useTranslation } from "react-i18next";

export type GetDirectionsProps = {
  variant: CTAVariant;
  color?: ThemeColor;
};

const getDirectionsFields: YextFields<GetDirectionsProps> = {
  variant: {
    label: msg("fields.variant", "Variant"),
    type: "radio",
    options: ThemeOptions.CTA_VARIANT,
  },
  color: {
    type: "basicSelector",
    label: msg("fields.color", "Color"),
    options: "SITE_COLOR",
  },
};

const GetDirectionsComponent = ({ variant, color }: GetDirectionsProps) => {
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
      variant={variant}
      color={color}
    />
  );
};

export const GetDirections: YextComponentConfig<GetDirectionsProps> = {
  label: msg("components.getDirections", "Get Directions"),
  fields: getDirectionsFields,
  defaultProps: {
    variant: "primary",
  },
  resolveFields: (data) => {
    const updatedFields = resolveDataFromParent(getDirectionsFields, data);
    const ctaVariant = data.props.variant;
    const showColor = isCtaVariantWithColor(ctaVariant);
    setDeep(updatedFields, "color.visible", showColor);
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
