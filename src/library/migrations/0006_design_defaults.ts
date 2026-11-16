import { resolveComponentData, type Migration } from "@yext/visual-editor";
import { upgradeResponsiveDesign } from "../shared/design/upgradeResponsiveDesign.ts";

const updatePlainText = (props: { id: string } & Record<string, any>) => {
  const updated = upgradeResponsiveDesign(props);
  const field = updated.data?.text;
  const constant = field?.constantValue;
  if (!constant || typeof constant !== "object") return updated;
  const normalized = Object.fromEntries(
    Object.entries(constant).map(([locale, value]) => [
      locale,
      value && typeof value === "object" && ("html" in value || "json" in value)
        ? resolveComponentData(
            {
              defaultValue: {
                html:
                  "html" in value && typeof value.html === "string"
                    ? value.html
                    : undefined,
                json:
                  "json" in value && typeof value.json === "string"
                    ? value.json
                    : undefined,
              },
            },
            "en",
            {},
            { output: "plainText" }
          )
        : value,
    ])
  );
  return {
    ...updated,
    data: { ...updated.data, text: { ...field, constantValue: normalized } },
  };
};
export const designDefaults = {
  "*": { action: "updated", propTransformation: upgradeResponsiveDesign },
  Heading: { action: "updated", propTransformation: updatePlainText },
  Paragraph: { action: "updated", propTransformation: updatePlainText },
} satisfies Migration;
