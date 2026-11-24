import { createServer as createHttpServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createServer } from "vite";

const { values } = parseArgs({
  options: { out: { type: "string" }, "parity-out": { type: "string" } },
});
if (!values.out)
  throw new Error("Usage: npm run layouts:export-contract -- --out <file>");

const server = await createServer({
  configFile: false,
  appType: "custom",
  root: fileURLToPath(new URL("../../", import.meta.url)),
  logLevel: "silent",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: { server: createHttpServer() } },
  define: { __VISUAL_EDITOR_TEST__: "false" },
});
try {
  const { exportContract, exportParityFixtures } = (await server.ssrLoadModule(
    "/scripts/layout-pilot/contracts.ts"
  )) as typeof import("./contracts.ts");
  const bundle = await exportContract();
  const out = resolve(values.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(bundle) + "\n");
  console.log(out);
  if (values["parity-out"]) {
    const parityOut = resolve(values["parity-out"]);
    await mkdir(dirname(parityOut), { recursive: true });
    await writeFile(
      parityOut,
      JSON.stringify(await exportParityFixtures()) + "\n"
    );
  }
} finally {
  await server.close();
}
