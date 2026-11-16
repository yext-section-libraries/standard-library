import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";

// Reuse Vite's TypeScript and CSS loading without starting an HTTP server.
const server = await createServer({
  configFile: false,
  appType: "custom",
  server: { middlewareMode: true, hmr: { server: createHttpServer() } },
  define: { __VISUAL_EDITOR_TEST__: "false" },
});
try {
  await server.ssrLoadModule("/scripts/redesign-layouts.ts");
} finally {
  await server.close();
}
