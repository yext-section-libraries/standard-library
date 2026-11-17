import { themeManagerCn, type ThemeColor } from "@yext/visual-editor";
import {
  CTA as SharedCTA,
  type CTAProps as SharedCTAProps,
} from "@yext/visual-editor/section-library-support";
import { useActionForeground } from "./useActionForeground.ts";

export type CTAProps = SharedCTAProps & { textColor?: ThemeColor };
export const CTA = ({ textColor, style, className, ...props }: CTAProps) => {
  const { action, foregroundStyle } = useActionForeground(
    props.actionId,
    props.color,
    textColor,
    props.ctaType === "presetImage"
  );
  const width =
    props.ctaType === "presetImage"
      ? undefined
      : action.presentation === "button"
        ? "w-full sm:w-fit"
        : "w-fit";

  return (
    <SharedCTA
      {...props}
      className={themeManagerCn(width, className)}
      style={{ ...foregroundStyle, ...style }}
    />
  );
};
