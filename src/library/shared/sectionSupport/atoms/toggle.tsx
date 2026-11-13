import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { themeManagerCn } from "@yext/visual-editor";

function Toggle({
  className,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={themeManagerCn(
        "ve-theme-control inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap self-start w-auto data-[state=on]:bg-[var(--ve-color-muted)]",
        className
      )}
      {...props}
    />
  );
}

export { Toggle };
