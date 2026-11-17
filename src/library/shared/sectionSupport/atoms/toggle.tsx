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
        "inline-flex items-center justify-center gap-2 rounded-full text-black " +
          "bg-gray-100 ",
        "whitespace-nowrap text-black hover:underline " + "    ",
        "data-[state=on]:bg-transparent data-[state=on]:text-current " +
          "self-start w-auto",
        className
      )}
      {...props}
    />
  );
}

export { Toggle };
