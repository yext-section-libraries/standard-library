import type { Config } from "tailwindcss";
import {
  defaultThemeTailwindExtensions,
  VisualEditorComponentsContentPath,
  VisualEditorThemeClassSafelist,
} from "@yext/visual-editor";
import { ComponentsContentPath as SearchUIComponentsContentPath } from "@yext/search-ui-react";

export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    VisualEditorComponentsContentPath,
    SearchUIComponentsContentPath,
  ],
  safelist: VisualEditorThemeClassSafelist,
  theme: {
    extend: defaultThemeTailwindExtensions,
  },
  plugins: [],
} satisfies Config;
