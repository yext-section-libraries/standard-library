import {
  defaultThemeTailwindExtensions,
  VisualEditorThemeClassSafelist,
  VisualEditorComponentsContentPath,
} from "@yext/visual-editor";

// This Tailwind Config applies Theme Editor styles to our components
// during playwright testing
export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    VisualEditorComponentsContentPath,
  ],
  theme: {
    extend: defaultThemeTailwindExtensions,
  },
  safelist: VisualEditorThemeClassSafelist,
  plugins: [],
} as Record<string, any>;
