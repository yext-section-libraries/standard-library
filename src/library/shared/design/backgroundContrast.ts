import {
  getThemeColorHexValue,
  isDarkColor,
  type YextFieldDefinition,
} from "@yext/visual-editor";
import { useContext } from "react";
import type { DesignProps } from "./styleSchema.ts";
import { safeCssValue } from "./styles.ts";
import { ThemeSurfaceColors } from "./ThemeSurfaceProvider.tsx";
import { backgroundStateCombinations, themeSurfaceRole } from "./theme.ts";

type BackgroundTone = "light" | "dark";
export type BackgroundContrast = "auto" | BackgroundTone;

export const backgroundContrastField = {
  type: "select",
  label: "Background contrast",
  generation: { required: false },
  options: [
    { label: "Auto", value: "auto" },
    { label: "Light background", value: "light" },
    { label: "Dark background", value: "dark" },
  ],
} satisfies YextFieldDefinition;

const opaqueColor =
  /^(?:#(?:[\da-f]{3}|[\da-f]{6})|black|white|rgba?\([^()]+\))$/i;
const gradient = /^(?:repeating-)?(?:linear|radial)-gradient\((.*)\)$/i;
const gradientDirection =
  /^(?:to\s|[-+.\d]+(?:deg|grad|rad|turn)$|(?:circle|ellipse|closest-|farthest-|at\s))/i;
const gradientStop =
  /^(#[\da-f]+|black|white|rgba?\([^()]+\))(?:\s+[-+.\d]+(?:%|[a-z]+)?){0,2}$/i;

function colorTone(color: string): BackgroundTone | undefined {
  if (!opaqueColor.test(color)) return;
  const hex = getThemeColorHexValue(color.toLowerCase());
  if (hex) return isDarkColor(hex) ? "dark" : "light";
}

function backgroundTone(value: string | undefined): BackgroundTone | undefined {
  if (!value) return;
  const match = value.match(gradient);
  if (!match) return colorTone(value);

  const stops = match[1].split(/,(?![^()]*\))/).map((stop) => stop.trim());
  if (gradientDirection.test(stops[0])) stops.shift();
  if (stops.length < 2) return;
  const tones = stops.map((stop) =>
    colorTone(stop.match(gradientStop)?.[1] ?? "")
  );
  // Mixed, translucent, or unresolved colors need an explicit author choice.
  if (tones.every((tone) => tone === tones[0])) return tones[0];
}

export function useBackgroundContrastAttributes(
  props: DesignProps,
  contrast?: BackgroundContrast,
  button = false
) {
  const themeColors = useContext(ThemeSurfaceColors);
  if (contrast === "light" || contrast === "dark")
    return { "data-sl-background-contrast": contrast };

  const toneFor = (...overrides: DesignProps["surface"][]) => {
    let image = safeCssValue(props.surface?.backgroundImage);
    let color = safeCssValue(props.surface?.backgroundColor);
    let overridden = false;
    for (const override of overrides) {
      const nextImage = safeCssValue(override?.backgroundImage);
      const nextColor = safeCssValue(override?.backgroundColor);
      image = nextImage ?? image;
      color = nextColor ?? color;
      overridden ||= !!(nextImage || nextColor);
    }
    const background = image && image.toLowerCase() !== "none" ? image : color;
    const role = (button || overridden) && themeSurfaceRole(background);
    if (role) {
      const themeColor = themeColors[role];
      const sample = themeColor && getThemeColorHexValue(`[${themeColor}]`);
      const tone = sample && isDarkColor(sample) ? "dark" : "light";
      return { tone, role };
    }
    return { tone: backgroundTone(background) };
  };
  const screens = [
    ["desktop", undefined],
    ["tablet", props.responsive?.tablet?.surface],
    ["mobile", props.responsive?.mobile?.surface],
  ] as const;
  const hasStateBackground = Object.values(props.states ?? {}).some(
    (state) =>
      safeCssValue(state?.surface?.backgroundColor) ||
      safeCssValue(state?.surface?.backgroundImage)
  );
  if (hasStateBackground) {
    const tokens = screens.flatMap(([screen, responsive]) =>
      backgroundStateCombinations.flatMap((states) => {
        const { tone, role } = toneFor(
          responsive,
          ...states.map((state) => props.states?.[state]?.surface)
        );
        if (!tone) return [];
        const key = `${screen}-${states.join("-") || "base"}`;
        return role ? [`${key}:${tone}`, `${key}:${role}`] : [`${key}:${tone}`];
      })
    );
    return { "data-sl-state-contrast": tokens.join(" ") || undefined };
  }
  const desktop = toneFor();
  const tablet = toneFor(props.responsive?.tablet?.surface);
  const mobile = toneFor(props.responsive?.mobile?.surface);
  if (
    !desktop.role &&
    !tablet.role &&
    !mobile.role &&
    desktop.tone === tablet.tone &&
    desktop.tone === mobile.tone
  )
    return { "data-sl-background-contrast": desktop.tone };

  return {
    "data-sl-desktop-contrast": desktop.tone,
    "data-sl-tablet-contrast": tablet.tone,
    "data-sl-mobile-contrast": mobile.tone,
    "data-sl-desktop-surface": desktop.role,
    "data-sl-tablet-surface": tablet.role,
    "data-sl-mobile-surface": mobile.role,
  };
}
