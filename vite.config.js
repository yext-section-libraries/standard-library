import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import yextSSG from "@yext/pages/vite-plugin";
import { yextVisualEditorPlugin } from "@yext/visual-editor/plugin";
import { compareScreenshot } from "./src/testing/compareScreenshot.ts";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";

const isVitest = Boolean(process.env.VITEST);
// Set VISUAL_EDITOR_SOURCE=off to verify against the installed package.
const editorSource = resolve(
  process.env.VISUAL_EDITOR_SOURCE || "../visual-editor/packages/visual-editor"
);
const useEditorSource =
  process.env.VISUAL_EDITOR_SOURCE !== "off" &&
  existsSync(join(editorSource, "src/index.ts"));
const editorAliases = useEditorSource
  ? [
      {
        find: /^@yext\/visual-editor$/,
        replacement: join(editorSource, "src/index.ts"),
      },
      {
        find: /^@yext\/visual-editor\/section-library-support$/,
        replacement: join(editorSource, "src/sectionLibrarySupport.ts"),
      },
      {
        find: /^@yext\/visual-editor\/style\.css$/,
        replacement: join(editorSource, "src/components/styles.css"),
      },
      {
        find: /^@yext\/visual-editor\/editor\.css$/,
        replacement: join(editorSource, "src/editor/index.css"),
      },
    ]
  : [];
/** Used to load the combined translations in tests */
const sectionLibraryI18nModule = "virtual:section-library-i18n";

/**
 * A custom plugin to stub out CSS/SCSS imports during Vitest runs,
 * except for page styles and the design controls exercised by browser tests. This ensures that
 * the css applied during tests is the same css applied the page templates.
 */
const cssStubPlugin = {
  name: "css-stub",
  enforce: "pre",
  resolveId(id) {
    if (
      (id.endsWith(".css") || id.endsWith(".scss")) &&
      !id.endsWith("componentTests.css") &&
      !id.endsWith("style.css") &&
      !id.endsWith("design.css") &&
      !id.endsWith("designControls.css")
    ) {
      return id;
    }
  },
  load(id) {
    if (
      (id.endsWith(".css") || id.endsWith(".scss")) &&
      !id.endsWith("componentTests.css") &&
      !id.endsWith("style.css") &&
      !id.endsWith("design.css") &&
      !id.endsWith("designControls.css")
    ) {
      return "export default {}";
    }
  },
};

export default defineConfig(({ command }) => ({
  define: {
    __VISUAL_EDITOR_TEST__: JSON.stringify(isVitest),
  },
  plugins: [
    react(),
    ...(isVitest ? [cssStubPlugin] : []),
    yextVisualEditorPlugin({
      localEditor: {
        enabled: true,
        layoutGenerationEnabled: true,
        generationModel: "gpt-6-luna",
        generationPromptsPath: join(
          homedir(),
          "alpha/gocode/src/yext/publish/yextsites/storm/js/visualeditor/generationPrompts.ts"
        ),
      },
    }),
    yextSSG(),
  ],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@puckeditor/core",
      "react-i18next",
      "i18next",
      "@yext/pages-components",
      "@yext/search-headless-react",
    ],
    alias: [
      ...(command === "serve" && process.env.NODE_ENV !== "production"
        ? editorAliases
        : []),
      {
        find: sectionLibraryI18nModule,
        replacement: fileURLToPath(
          new URL("./src/library/.generated/i18n.ts", import.meta.url)
        ),
      },
    ],
  },
  server: {
    fs: {
      allow: [
        process.cwd(),
        ...(useEditorSource ? [resolve(editorSource, "../..")] : []),
      ],
    },
  },
  optimizeDeps: {
    exclude: useEditorSource ? ["@yext/visual-editor"] : [],
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
