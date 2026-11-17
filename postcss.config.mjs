import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const editorStylesPath = fileURLToPath(
  import.meta.resolve("@yext/visual-editor/editor.css")
);

const layerEditorStyles = {
  postcssPlugin: "layer-visual-editor-styles",
  Once(root) {
    if (root.source?.input.file !== editorStylesPath) return;
    const headers = [];
    const imports = [];
    const styles = [];
    for (const node of root.nodes) {
      if (node.type === "atrule" && node.name === "charset") headers.push(node);
      else if (node.type === "atrule" && node.name === "import")
        imports.push(node);
      else styles.push(node);
    }
    root.removeAll();
    root.append(headers);
    // Keep editor controls above the page reset, and page theme rules above both.
    root.append(
      postcss.atRule({ name: "layer", params: "preflight, visual-editor" })
    );
    root.append(imports);
    root.append(
      postcss.atRule({ name: "layer", params: "visual-editor" }).append(styles)
    );
  },
};

export default {
  plugins: [tailwindcss(), layerEditorStyles, autoprefixer()],
};
