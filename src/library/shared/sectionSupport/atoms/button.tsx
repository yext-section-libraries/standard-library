import * as React from "react";
import {
  Button as SharedButton,
  type ButtonProps,
} from "@yext/visual-editor/section-library-support";
import { useActionForeground } from "./useActionForeground.ts";

export {
  buttonVariants,
  type ButtonProps,
} from "@yext/visual-editor/section-library-support";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ actionId, style, ...props }, ref) => {
    const { foregroundStyle } = useActionForeground(actionId);
    return (
      <SharedButton
        {...props}
        actionId={actionId}
        ref={ref}
        style={{
          ...style,
          color: style?.color ?? foregroundStyle.color,
          borderColor: style?.borderColor ?? foregroundStyle.borderColor,
        }}
      />
    );
  }
);
Button.displayName = "Button";
