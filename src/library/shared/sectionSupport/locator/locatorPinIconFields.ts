import {
  msg,
  type YextFields,
} from "@yext/visual-editor/section-library-support";
import { ImageStylingFields } from "../contentBlocks/image/styling.ts";
import type { LocatorProps } from "./Locator.tsx";
import {
  LOCATOR_PIN_ICON_FIELD,
  MAX_PIN_ICON_WIDTH,
  makiIconOptions,
} from "./Map.tsx";

export const locatorPinIconFields = {
  type: {
    generation: { required: true },
    type: "basicSelector",
    label: msg("fields.pinIcon", "Pin Icon"),
    options: [
      { label: msg("fields.options.none", "None"), value: "none" },
      { label: msg("fields.options.icon", "Icon"), value: "icon" },
      {
        label: msg("fields.options.customImage", "Custom image"),
        value: "customImage",
      },
    ],
  },
  iconName: {
    type: "basicSelector",
    label: msg("fields.icon", "Icon"),
    options: makiIconOptions,
  },
  image: LOCATOR_PIN_ICON_FIELD,
  width: {
    type: "number",
    min: 1,
    max: MAX_PIN_ICON_WIDTH,
  },
  aspectRatio: ImageStylingFields.aspectRatio,
} satisfies YextFields<
  NonNullable<LocatorProps["locationStyles"][number]["pinIcon"]>
>;
