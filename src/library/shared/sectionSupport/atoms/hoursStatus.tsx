import {
  HoursStatusAtom as SharedHoursStatusAtom,
  type HoursStatusAtomProps as SharedHoursStatusAtomProps,
} from "@yext/visual-editor/section-library-support";
import type { CSSProperties } from "react";
export type HoursStatusAtomProps = SharedHoursStatusAtomProps & {
  style?: CSSProperties;
};
export const HoursStatusAtom = ({ style, ...props }: HoursStatusAtomProps) => (
  <div style={style}>
    <SharedHoursStatusAtom {...props} bodyVariant="base" />
  </div>
);
