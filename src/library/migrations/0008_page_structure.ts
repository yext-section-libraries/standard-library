import type { Migration } from "@yext/visual-editor";
import { organizePageContent } from "../shared/design/pageStructure.ts";

/** Existing loose page-level blocks become editable areas; content inside containers is unchanged. */
export const pageStructure = {
  content: { transformation: organizePageContent },
} satisfies Migration;
