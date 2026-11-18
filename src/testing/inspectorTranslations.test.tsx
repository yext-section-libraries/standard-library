import * as React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { Config, Data } from "@puckeditor/core";
import { pt, toPuckFields } from "@yext/visual-editor";
import { DesignPreviewEditor } from "./DesignPreviewEditor.tsx";
import { VisualEditorProvider } from "./TestVisualEditorProvider.tsx";
import { HeaderLinks } from "../library/shared/sectionSupport/header/HeaderLinks.tsx";

afterEach(cleanup);

it("translates resolved Header Links labels and native radio options in the preview inspector", async () => {
  const config: Config = {
    components: {
      HeaderLinks: {
        ...HeaderLinks,
        label: pt(HeaderLinks.label!),
        fields: toPuckFields(HeaderLinks.fields!),
        // The field panel can be tested without the surrounding navigation context.
        render: () => <></>,
      },
    },
  };
  const data: Data = {
    root: { props: {} },
    content: [
      {
        type: "HeaderLinks",
        props: { ...HeaderLinks.defaultProps, id: "header-links" },
      },
    ],
  };
  const view = render(
    <VisualEditorProvider templateProps={{ document: { locale: "en" } }}>
      <DesignPreviewEditor
        config={config}
        data={data}
        ui={{ itemSelector: { zone: "root:default-zone", index: 0 } }}
      />
    </VisualEditorProvider>
  );
  expect(await view.findAllByText("Links", { exact: true })).not.toHaveLength(
    0
  );
  expect(view.container.textContent).not.toContain('"key":"fields.');
  for (const label of [
    "Data",
    "Styles",
    "Align",
    "Right",
    "Typography Style",
    "Weight",
  ])
    expect(view.getAllByText(label, { exact: true })).not.toHaveLength(0);
});
