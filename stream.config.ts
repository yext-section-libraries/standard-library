import type { LocalEditorConfig } from "@yext/visual-editor/plugin";

const config = {
  defaults: {
    locale: "en",
  },
  env: {
    YEXT_CLOUD_REGION: "US",
    YEXT_CLOUD_CHOICE: "GLOBAL-MULTI",
    YEXT_ENVIRONMENT: "PROD",
    YEXT_SEARCH_API_KEY: "",
    YEXT_SEARCH_EXPERIENCE_KEY: "",
  },
  pageSetTypes: {
    ENTITY: {
      stream: {
        $id: "local-editor-entity-stream",
        filter: { entityTypes: ["location"] },
        fields: [
          "id",
          "name",
          "slug",
          "address",
          "description",
          "emails",
          "hours",
          "mainPhone",
          "services",
          "yextDisplayCoordinate",
        ],
        localization: { locales: ["en"] },
      },
    },
  },
} satisfies LocalEditorConfig;

export default config;
