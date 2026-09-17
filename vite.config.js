import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import yextSSG from "@yext/pages/vite-plugin";
import { yextVisualEditorPlugin } from "@yext/visual-editor/plugin";
import { compareScreenshot } from "./src/testing/compareScreenshot.ts";
import { fileURLToPath } from "node:url";

const isVitest = Boolean(process.env.VITEST);
/** Used to load the combined translations in tests */
const sectionLibraryI18nModule = "virtual:section-library-i18n";

export default defineConfig(() => ({
  define: {
    __VISUAL_EDITOR_TEST__: JSON.stringify(isVitest),
  },
  plugins: [
    react(),
    ...(isVitest ? [cssStubPlugin] : []),
    yextVisualEditorPlugin({
      localEditor: {
        enabled: true,
      },
    }),
    yextSSG(),
  ],
  resolve: {
    alias: {
      [sectionLibraryI18nModule]: fileURLToPath(
        new URL("./src/library/.generated/i18n.ts", import.meta.url)
      ),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    env: {
      COMPONENT_TESTS_VISUAL_EDITOR_APP_API_KEY:
        process.env.COMPONENT_TESTS_VISUAL_EDITOR_APP_API_KEY,
      COMPONENT_TESTS_MAPBOX_API_KEY: "dummy",
      COMPONENT_TESTS_SEARCH_API_KEY:
        process.env.COMPONENT_TESTS_SEARCH_API_KEY,
      COMPONENT_TESTS_MAPBOX_STATIC_MAP_KEY:
        process.env.COMPONENT_TESTS_MAPBOX_STATIC_MAP_KEY,
    },
    css: true,
    browser: {
      enabled: true,
      instances: [{ browser: "chromium" }],
      provider: "playwright",
      headless: true,
      screenshotFailures: false,
      commands: {
        compareScreenshot,
      },
    },
  },
}));

/**
 * A custom plugin to stub out CSS/SCSS imports during Vitest runs,
 * except for componentTests.css and style.css. This ensures that
 * the css applied during tests is the same css applied the page templates.
 */
const cssStubPlugin = {
  name: "css-stub",
  enforce: "pre",
  resolveId(id) {
    if (
      (id.endsWith(".css") || id.endsWith(".scss")) &&
      !id.endsWith("componentTests.css") &&
      !id.endsWith("style.css")
    ) {
      return id;
    }
  },
  load(id) {
    if (
      (id.endsWith(".css") || id.endsWith(".scss")) &&
      !id.endsWith("componentTests.css") &&
      !id.endsWith("style.css")
    ) {
      return "export default {}";
    }
  },
};
