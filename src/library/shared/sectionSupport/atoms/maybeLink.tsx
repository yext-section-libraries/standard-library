import {
  getTextColorStyle,
  type MaybeLinkProps,
} from "@yext/visual-editor/section-library-support";
import { CTA } from "./cta.tsx";

export type { MaybeLinkProps } from "@yext/visual-editor/section-library-support";

export const MaybeLink = ({ href, children, ...props }: MaybeLinkProps) =>
  href ? (
    <CTA
      {...props}
      link={href}
      label={children}
      linkType="URL"
      normalizeLink={false}
    />
  ) : (
    <span className={props.className} style={getTextColorStyle(props.color)}>
      {children}
    </span>
  );
