import type { Migration } from "@yext/visual-editor";
import { composableSectionNames } from "../shared/design/compositionData.ts";
import {
  bodyTextDefaults,
  inheritParagraphDefaults,
} from "../shared/design/textInheritance.ts";

export const textInheritance = {
  Paragraph: {
    action: "updated",
    propTransformation: inheritParagraphDefaults,
  },
  ...Object.fromEntries(
    composableSectionNames.map((name) => [
      name,
      {
        action: "updated" as const,
        propTransformation: (props: { id: string } & Record<string, any>) => ({
          ...props,
          typography: { ...bodyTextDefaults, ...props.typography },
        }),
      },
    ])
  ),
} satisfies Migration;
