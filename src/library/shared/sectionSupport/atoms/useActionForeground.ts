import type { CSSProperties } from "react";
import type { ThemeColor } from "@yext/visual-editor";
import {
  getTextColorStyle,
  resolveThemeColor,
  resolveThemeEntry,
  useBackground,
  useThemeData,
} from "@yext/visual-editor/section-library-support";

/** Unfilled actions share their surrounding surface; filled buttons own theirs. */
export const useActionForeground = (
  actionId?: string,
  color?: ThemeColor,
  textColor?: ThemeColor,
  presetImage = false
) => {
  const theme = useThemeData();
  const background = useBackground();
  const action = resolveThemeEntry(theme.actions, actionId);
  const presetBackground =
    action.presentation === "button"
      ? resolveThemeColor(theme, action.default.backgroundColor)
      : undefined;
  const unfilled =
    action.presentation === "link" ||
    presetBackground === "transparent" ||
    /^#[0-9a-f]{6}00$/i.test(presetBackground ?? "");
  const surfaceForeground =
    unfilled && !presetImage
      ? (getTextColorStyle(color)?.color ?? background?.contrastingColor)
      : undefined;
  const textForeground =
    getTextColorStyle(textColor)?.color ?? surfaceForeground;
  const foregroundStyle: CSSProperties = {
    ...(textForeground ? { color: textForeground } : {}),
    ...(surfaceForeground && action.presentation === "button"
      ? { borderColor: surfaceForeground }
      : {}),
  };
  return { action, foregroundStyle };
};
