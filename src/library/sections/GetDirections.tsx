import { z } from "zod";
import { ctaVariantSchema } from "../shared/sectionSupport/atoms/ctaSchemas.ts";
import {
  siteColorSchema,
  optionalTextColorSchema,
} from "../shared/generation/colors.ts";
import { gridAtomPermissions } from "../shared/gridAtomPermissions.ts";
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

export const getDirectionsSchema = z.object({
  variant: ctaVariantSchema,
  color: siteColorSchema.optional(),
  textColor: optionalTextColorSchema,
});

export type GetDirectionsProps = {
  variant: CTAVariant;
  color?: ThemeColor;
  /** The text and icon color for the primary variant. */
  textColor?: ThemeColor;
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
  textColor: {
    type: "basicSelector",
    label: msg("fields.textColor", "Text Color"),
    options: "SITE_COLOR",
  },
};

const GetDirectionsComponent = ({
  variant,
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
      variant={variant}
      color={color}
      textColor={textColor}
    />
  );
};

export const GetDirections: YextComponentConfig<GetDirectionsProps> = {
  ...gridAtomPermissions,
  label: msg("components.getDirections", "Get Directions"),
  fields: getDirectionsFields,
  generation: { props: getDirectionsSchema },
  defaultProps: {
    variant: "primary",
  },
  resolveFields: (data) => {
    const updatedFields = resolveDataFromParent(getDirectionsFields, data);
    const ctaVariant = data.props.variant;
    const showColor = isCtaVariantWithColor(ctaVariant);
    let resolvedFields = setDeep(updatedFields, "color.visible", showColor);
    resolvedFields = setDeep(
      resolvedFields,
      "textColor.visible",
      ctaVariant === "primary"
    );
    return resolvedFields;
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
