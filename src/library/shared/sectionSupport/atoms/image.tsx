import {
  Image as ThemeImage,
  type ImageProps as ThemeImageProps,
} from "@yext/visual-editor/section-library-support";
export {
  getImageAltText,
  imgSizesHelper,
  type ImgSizesByBreakpoint,
} from "@yext/visual-editor/section-library-support";
export type ImageProps = ThemeImageProps & { applyThemeRadius?: boolean };
export const Image = ({
  applyThemeRadius = true,
  style,
  ...props
}: ImageProps) => (
  <ThemeImage
    {...props}
    style={{ ...(applyThemeRadius ? {} : { borderRadius: 0 }), ...style }}
  />
);
