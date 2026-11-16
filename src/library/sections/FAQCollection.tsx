import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { FAQSectionBody, type FAQSectionProps } from "./FAQSection.tsx";
import { withDesign } from "../shared/design/withDesign.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";

export const FAQCollection: YextComponentConfig<FAQSectionProps & DesignProps> =
  withDesign({
    ...FAQSectionBody,
    fields: {
      ...FAQSectionBody.fields!,
      slots: {
        type: "object",
        visible: false,
        objectFields: {
          HeadingSlot: {
            type: "slot",
            allow: ["HeadingTextSlot"],
            generation: { required: false },
          },
          CardSlot: { type: "slot", allow: [] },
        },
      },
    },
  });

export const config: SectionConfig = {
  id: "FAQCollection",
  displayName: "FAQCollection",
  description:
    "Reusable faqcollection block with Yext data and responsive styling.",
  pageSetTypes: ["ENTITY"],
  category: "Yext data",
};
