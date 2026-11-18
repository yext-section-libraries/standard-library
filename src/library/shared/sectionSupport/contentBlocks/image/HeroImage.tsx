import { useTranslation } from "react-i18next";
import { PuckComponent, setDeep } from "@puckeditor/core";
import {
  useDocument,
  AssetImageType,
  resolveDataFromParent,
  EntityField,
  resolveComponentData,
  msg,
  pt,
  YextComponentConfig,
} from "@yext/visual-editor";
import { Image, imgSizesHelper } from "../../atoms/image.tsx";
import {
  getImageUrl,
  imageDefaultProps,
  ImageWrapperFields,
  ImageWrapperProps,
} from "../../../../sections/ImageWrapper.tsx";
import { EmptyImageState } from "./EmptyImageState.tsx";
import { ImageStylingFields } from "./styling.ts";

export interface HeroImageProps extends ImageWrapperProps {
  /** @internal from the parent Hero Section Component */
  variant?: "classic" | "compact" | "immersive" | "spotlight";
}

const HeroImageComponent: PuckComponent<HeroImageProps> = (props) => {
  const { data, styles, className, puck, variant } = props;
  const { i18n } = useTranslation();
  const streamDocument = useDocument();
  const resolvedImage = resolveComponentData(
    data.image,
    i18n.language,
    streamDocument
  );
  const imageUrl = getImageUrl(resolvedImage, i18n.language);
  const isEmpty =
    !resolvedImage ||
    !imageUrl ||
    (typeof imageUrl === "string" && imageUrl.trim() === "");

  if (isEmpty) {
    return (
      <EmptyImageState
        isEmpty={isEmpty}
        isEditing={puck?.isEditing ?? false}
        constantValueEnabled={data.image.constantValueEnabled ?? false}
        constantValue={data.image.constantValue as AssetImageType | undefined}
        fieldId={data.image.field}
        containerStyle={{ minHeight: "250px" }}
        containerClassName={
          className || "max-w-full ve-theme-image w-full h-full"
        }
        fullHeight={true}
        hasParentData={false}
      />
    );
  }

  return (
    <EntityField
      displayName={pt("fields.image", "Image")}
      fieldId={data.image.field}
      constantValueEnabled={data.image.constantValueEnabled}
      fullHeight={true}
      ref={puck?.dragRef}
    >
      <Image
        image={resolvedImage}
        aspectRatio={styles.aspectRatio}
        imageFillType={styles.imageFillType}
        width={variant === "classic" ? styles.width : undefined}
        className={className || "max-w-full ve-theme-image w-full"}
        sizes={imgSizesHelper({
          base: "calc(100vw - 32px)",
          md: "calc(maxWidth / 2)",
        })}
        loading="eager"
      />
    </EntityField>
  );
};

const heroAspectRatioOptions = (
  ImageStylingFields.aspectRatio as {
    options: { label: string; value: number }[];
  }
).options.filter((option) => ![2, 3, 4, 0.56].includes(option.value));

const heroImageFields = setDeep(
  setDeep(
    ImageWrapperFields,
    "styles.objectFields.aspectRatio.options",
    heroAspectRatioOptions
  ),
  "styles.objectFields.aspectRatio.generation",
  {
    instructions:
      "Renders in classic and compact heroes. Immersive/spotlight background images belong in the parent hero data.backgroundImage.",
  }
);

export const HeroImage: YextComponentConfig<HeroImageProps> = {
  label: msg("components.heroImage", "Hero Image"),
  fields: heroImageFields,
  defaultProps: imageDefaultProps,
  resolveFields: (data) => {
    let fields = setDeep(
      resolveDataFromParent(ImageWrapperFields, data),
      "styles.objectFields.width.visible",
      true
    );

    switch (data.props.variant ?? "classic") {
      case "compact": {
        fields = setDeep(fields, "styles.objectFields.width.visible", false);
        // compact should also hide the props hidden by classic
      }
      case "classic": {
        fields = setDeep(
          fields,
          "styles.objectFields.aspectRatio.options",
          heroAspectRatioOptions
        );
        break;
      }
    }
    return fields;
  },
  render: (props) => <HeroImageComponent {...props} />,
};
