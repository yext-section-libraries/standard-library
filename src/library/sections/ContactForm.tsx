import type { SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { FormSectionBody, type FormSectionProps } from "./FormSection.tsx";
import { withDesign } from "../shared/design/withDesign.tsx";
import type { DesignProps } from "../shared/design/styleSchema.ts";

export const ContactForm: YextComponentConfig<FormSectionProps & DesignProps> =
  withDesign(FormSectionBody);

export const config: SectionConfig = {
  id: "ContactForm",
  displayName: "ContactForm",
  description:
    "Reusable contactform block with Yext data and responsive styling.",
  pageSetTypes: ["ENTITY"],
  category: "Patterns",
};
