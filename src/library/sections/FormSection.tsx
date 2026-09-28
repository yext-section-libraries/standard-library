import type { SectionConfig } from "@yext/visual-editor";
import { FormSection as SharedFormSection } from "../shared/FormSection.tsx";

export const FormSection = SharedFormSection;

export const config: SectionConfig = {
  id: "FormSection",
  displayName: "Form Section",
  description: "Displays a contact form.",
  pageSetTypes: ["ENTITY"],
  category: "Page Sections",
};
