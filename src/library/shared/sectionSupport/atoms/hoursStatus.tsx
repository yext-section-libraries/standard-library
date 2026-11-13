import {
  HoursStatusAtom as ThemeHoursStatus,
  type HoursStatusAtomProps as ThemeHoursStatusProps,
} from "@yext/visual-editor/section-library-support";
import type { CSSProperties } from "react";
export type HoursStatusAtomProps = ThemeHoursStatusProps & {
  style?: CSSProperties;
};
export const HoursStatusAtom = ({ style, ...props }: HoursStatusAtomProps) => (
  <div style={{ display: "contents", ...style }}>
    <ThemeHoursStatus {...props} />
  </div>
);
