import {
  resolveYextEntityField,
  useDocument,
  isLocalizedAssetImage,
  resolveLocalizedAssetImage,
} from "@yext/visual-editor";
import { PageSection } from "../../atoms/pageSection.tsx";
import { HeroVariantProps } from "../../../../sections/HeroSection.tsx";
import { HeroContent, heroContentParentCn } from "./HeroContent.tsx";
import { useTranslation } from "react-i18next";
import { getImageUrl } from "@yext/pages-components";
import { PuckComponent } from "@puckeditor/core";

export const ImmersiveHero: PuckComponent<HeroVariantProps> = (props) => {
  const { data, styles } = props;
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const streamDocument = useDocument();
  const resolvedBackgroundImage = resolveYextEntityField(
    streamDocument,
    data?.backgroundImage,
    locale
  );

  const localizedImage:
    { url: string; width: number; height: number } | undefined =
    resolvedBackgroundImage && isLocalizedAssetImage(resolvedBackgroundImage)
      ? resolveLocalizedAssetImage(resolvedBackgroundImage, locale)
      : resolvedBackgroundImage && "image" in resolvedBackgroundImage
        ? resolvedBackgroundImage.image
        : resolvedBackgroundImage;

  return (
    <div
      style={{
        backgroundImage: localizedImage?.url
          ? `url(${getImageUrl(localizedImage.url, localizedImage.width, localizedImage.height)})`
          : undefined,
      }}
      className="bg-no-repeat bg-center bg-cover"
    >
      <PageSection
        surface={localizedImage?.url ? "inherit" : "page"}
        background={styles.backgroundColor}
        onDark={!!localizedImage?.url}
        aria-label={t("heroBanner", "Hero Banner")}
        className="z-10 flex items-center h-full w-full"
        outerClassName={`h-fit flex items-center ${localizedImage?.url ? "bg-black/60 text-white" : ""}`}
        outerStyle={{
          minHeight: `${styles.imageHeight}px`,
        }}
      >
        <div className={heroContentParentCn(styles)}>
          <HeroContent {...props} />
        </div>
      </PageSection>
    </div>
  );
};
